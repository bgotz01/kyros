#!/usr/bin/env python3
"""
Panteon Backtest Engine
=======================
Reads a strategy definition from stdin (JSON), fetches price + regime data
from the DB, runs the strategy over each regime period, and writes results
to stdout as JSON.

Usage:
  echo '<strategy_json>' | python backtest_engine.py

The regime provides the date windows. The strategy runs independently inside
each window using daily price data. Results are aggregated across all periods.
"""

import sys
import json
import os
import math
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# ── Load env ─────────────────────────────────────────────────────────────────

# Look for .env.local in the panteon root (one level up from python/)
dotenv_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(dotenv_path)

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print(json.dumps({"error": "DATABASE_URL not set"}))
    sys.exit(1)

# ── Constants ─────────────────────────────────────────────────────────────────

ASSET_SERIES = {
    "SPX": ("equities", "US/GSPC"),   # monthly macro_time_series (1960–present)
    "NDX": ("equities", "NDX"),       # monthly macro_time_series (1985–present)
    "SPY": ("historical", "SPY"),     # daily historical_prices (2009–present)
    "QQQ": ("historical", "QQQ"),     # daily historical_prices (2009–present)
}

INDICATOR_WARMUP = {
    "price_vs_ma": lambda p: p.get("period", 200) + 10,
    "ma_slope":    lambda p: p.get("period", 200) + 10,
    "ma_crossover": lambda p: max(p.get("fast", 50), p.get("slow", 200)) + 10,
    "rsi":         lambda p: p.get("period", 14) + 5,
    "price_vs_ma_and_slope": lambda p: p.get("period", 200) + 10,
}

# ── DB helpers ────────────────────────────────────────────────────────────────

def get_connection():
    return psycopg2.connect(DATABASE_URL)


def fetch_regime_periods(conn, regime_name: str) -> list[dict]:
    """
    Returns list of {start_date, end_date} for the given regime.
    Reconstructs periods from the monthly regime timeline.
    """
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT date::text AS date, regime, entry_date::text AS entry_date
            FROM macro_regime_timeline
            ORDER BY date ASC
        """)
        rows = cur.fetchall()

    periods = []
    current = None
    for row in rows:
        if current is None or current["regime"] != row["regime"]:
            if current:
                periods.append(current)
            current = {
                "regime": row["regime"],
                "start_date": row["date"],
                "end_date": row["date"],
            }
        else:
            current["end_date"] = row["date"]

    if current:
        # Mark as current if end date is recent
        end = date.fromisoformat(current["end_date"])
        if (date.today() - end).days < 60:
            current["is_current"] = True
        periods.append(current)

    return [p for p in periods if p["regime"] == regime_name]


def fetch_prices(conn, asset: str, from_date: str, to_date: str) -> pd.DataFrame:
    """
    Fetches daily close prices for the given asset between from_date and to_date.
    Includes warmup period before from_date for indicator calculation.
    Routes to historical_prices (daily OHLCV) or macro_time_series (monthly).
    """
    asset_class, series_name = ASSET_SERIES[asset]

    if asset_class == "historical":
        # Daily OHLCV from historical_prices table
        with conn.cursor() as cur:
            cur.execute("""
                SELECT date::text, close
                FROM historical_prices
                WHERE symbol = %s
                  AND date BETWEEN %s AND %s
                ORDER BY date ASC
            """, (series_name, from_date, to_date))
            rows = cur.fetchall()
    else:
        # Monthly prices from macro_time_series
        with conn.cursor() as cur:
            cur.execute("""
                SELECT date, value AS close
                FROM macro_time_series
                WHERE asset_class = %s
                  AND series_name = %s
                  AND column_name = 'Value'
                  AND date BETWEEN %s AND %s
                ORDER BY date ASC
            """, (asset_class, series_name, from_date, to_date))
            rows = cur.fetchall()

    if not rows:
        return pd.DataFrame(columns=["date", "close"])

    df = pd.DataFrame(rows, columns=["date", "close"])
    df["date"] = pd.to_datetime(df["date"])
    df["close"] = df["close"].astype(float)
    df = df.set_index("date").sort_index()
    return df


# ── Indicator computation ─────────────────────────────────────────────────────

def compute_indicators(prices: pd.DataFrame, rules: list[dict]) -> pd.DataFrame:
    """Add all required indicator columns to the price DataFrame."""
    df = prices.copy()
    df["close"] = df["close"].astype(float)

    needed_mas = set()
    need_rsi_periods = set()

    for rule in rules:
        # Support both "condition" (singular) and "conditions" (list)
        conds = rule.get("conditions", None)
        if conds is None:
            c = rule.get("condition", {})
            conds = [c] if c else []

        for c in conds:
            ind = c.get("indicator", "")

            if ind == "price_vs_ma":
                needed_mas.add(int(c.get("period", 200)))

            elif ind == "ma_slope":
                needed_mas.add(int(c.get("period", 200)))

            elif ind == "ma_crossover":
                needed_mas.add(int(c.get("fast", 50)))
                needed_mas.add(int(c.get("slow", 200)))

            elif ind == "price_vs_ma_and_slope":
                needed_mas.add(int(c.get("period", 200)))

            elif ind == "rsi":
                need_rsi_periods.add(int(c.get("period", 14)))

    for period in needed_mas:
        col = f"ma{period}"
        df[col] = df["close"].rolling(period, min_periods=period).mean()
        df[f"{col}_slope"] = df[col].pct_change(5) * 100  # 5-day slope %

    for period in need_rsi_periods:
        delta = df["close"].diff()
        gain = delta.clip(lower=0).rolling(period).mean()
        loss = (-delta.clip(upper=0)).rolling(period).mean()
        rs = gain / loss.replace(0, np.nan)
        df[f"rsi{period}"] = 100 - (100 / (1 + rs))

    return df


# ── Signal evaluation ─────────────────────────────────────────────────────────

def evaluate_condition(row: pd.Series, condition: dict) -> bool:
    """Evaluate a single condition on a price row. Returns True/False."""
    ind = condition.get("indicator", "")
    op = condition.get("operator", ">")
    threshold = float(condition.get("threshold", 0))

    def compare(val, op, thr):
        if val is None or (isinstance(val, float) and math.isnan(val)):
            return False
        if op == ">":  return val > thr
        if op == ">=": return val >= thr
        if op == "<":  return val < thr
        if op == "<=": return val <= thr
        if op == "==": return abs(val - thr) < 1e-9
        return False

    if ind == "price_vs_ma":
        period = int(condition.get("period", 200))
        ma_val = row.get(f"ma{period}")
        if pd.isna(ma_val) or ma_val == 0:
            return False
        ratio = float(row["close"]) / float(ma_val)
        return compare(ratio, op, threshold)

    elif ind == "ma_slope":
        period = int(condition.get("period", 200))
        slope = row.get(f"ma{period}_slope")
        return compare(slope, op, threshold)

    elif ind == "ma_crossover":
        fast = int(condition.get("fast", 50))
        slow = int(condition.get("slow", 200))
        fast_val = row.get(f"ma{fast}")
        slow_val = row.get(f"ma{slow}")
        if pd.isna(fast_val) or pd.isna(slow_val) or slow_val == 0:
            return False
        ratio = float(fast_val) / float(slow_val)
        return compare(ratio, op, threshold)

    elif ind == "rsi":
        period = int(condition.get("period", 14))
        rsi_val = row.get(f"rsi{period}")
        return compare(rsi_val, op, threshold)

    elif ind == "price_vs_ma_and_slope":
        # Combined: price deviation AND MA slope direction
        period = int(condition.get("period", 200))
        ma_val = row.get(f"ma{period}")
        slope_val = row.get(f"ma{period}_slope")
        slope_op = condition.get("slope_operator", ">")
        slope_threshold = float(condition.get("slope_threshold", 0))
        if pd.isna(ma_val) or ma_val == 0:
            return False
        ratio = float(row["close"]) / float(ma_val)
        price_ok = compare(ratio, op, threshold)
        slope_ok = compare(slope_val, slope_op, slope_threshold)
        return price_ok and slope_ok

    return False


def evaluate_signal(row: pd.Series, rules: list[dict], default_signal: str) -> str:
    """
    Evaluate rules in order — first match wins.
    Rules may have a single condition or a list of conditions (all must be true = AND).
    Returns: 'long' | 'short' | 'flat'
    """
    for rule in rules:
        conditions = rule.get("conditions", None)
        if conditions is None:
            # Single condition shorthand
            cond = rule.get("condition", {})
            conditions = [cond] if cond else []

        if not conditions:
            continue

        # All conditions must pass (AND logic)
        if all(evaluate_condition(row, c) for c in conditions):
            return rule.get("signal", "flat")

    return default_signal


# ── Trade simulation ──────────────────────────────────────────────────────────

def simulate_period(df: pd.DataFrame, rules: list[dict], default_signal: str,
                    trade_start: str, trade_end: str) -> dict:
    """
    Run strategy signals over the trading window [trade_start, trade_end].
    Prices before trade_start are used only for indicator warmup.
    Returns trades and daily equity curve.
    """
    trade_df = df[
        (df.index >= pd.Timestamp(trade_start)) &
        (df.index <= pd.Timestamp(trade_end))
    ].copy()

    if trade_df.empty:
        return {"trades": [], "equity_curve": [], "period_return": None}

    equity = 100.0
    position = 0  # 0=flat, 1=long, -1=short
    entry_price = None
    entry_date = None
    trades = []
    equity_curve = []

    for i, (idx, row) in enumerate(trade_df.iterrows()):
        signal = evaluate_signal(row, rules, default_signal)

        # Position change logic
        target_pos = {"long": 1, "short": -1, "flat": 0}.get(signal, 0)

        # Execute signal on next bar (1-bar delay to avoid lookahead)
        if i == 0:
            # First bar: set position, no trade yet
            position = target_pos
            if position != 0:
                entry_price = float(row["close"])
                entry_date = str(idx.date())
            equity_curve.append({
                "date": str(idx.date()),
                "equity": round(equity, 4),
                "position": position,
                "signal": signal,
                "close": float(row["close"]),
                "ma200": round(float(row.get("ma200", float("nan") if pd.isna(row.get("ma200", float("nan"))) else row.get("ma200"))), 2) if not pd.isna(row.get("ma200", float("nan"))) else None,
            })
            continue

        prev_row = trade_df.iloc[i - 1]
        prev_close = float(prev_row["close"])
        curr_close = float(row["close"])
        daily_ret = (curr_close - prev_close) / prev_close

        # Apply P&L from existing position before changing it
        if position != 0:
            equity *= (1 + position * daily_ret)

        # Change position if signal changed
        if target_pos != position:
            if position != 0 and entry_price is not None:
                exit_pct = position * (curr_close - entry_price) / entry_price * 100
                trades.append({
                    "entry_date": entry_date,
                    "exit_date": str(idx.date()),
                    "direction": "long" if position == 1 else "short",
                    "entry_price": round(entry_price, 2),
                    "exit_price": round(curr_close, 2),
                    "return_pct": round(exit_pct, 3),
                    "days_held": (idx - pd.Timestamp(entry_date)).days,
                })
            position = target_pos
            entry_price = float(curr_close) if position != 0 else None
            entry_date = str(idx.date()) if position != 0 else None

        ma200_val = row.get("ma200")
        equity_curve.append({
            "date": str(idx.date()),
            "equity": round(equity, 4),
            "position": position,
            "signal": signal,
            "close": round(curr_close, 2),
            "ma200": round(float(ma200_val), 2) if ma200_val is not None and not pd.isna(ma200_val) else None,
        })

    # Close any open position at end of period
    if position != 0 and entry_price is not None and len(trade_df) > 0:
        last_close = float(trade_df["close"].iloc[-1])
        last_date = str(trade_df.index[-1].date())
        exit_pct = position * (last_close - entry_price) / entry_price * 100
        trades.append({
            "entry_date": entry_date,
            "exit_date": last_date,
            "direction": "long" if position == 1 else "short",
            "entry_price": round(entry_price, 2),
            "exit_price": round(last_close, 2),
            "return_pct": round(exit_pct, 3),
            "days_held": (trade_df.index[-1] - pd.Timestamp(entry_date)).days,
            "open_at_period_end": True,
        })

    period_return = round((equity - 100.0), 3)
    return {"trades": trades, "equity_curve": equity_curve, "period_return": period_return}


# ── Statistics ────────────────────────────────────────────────────────────────

def compute_stats(all_trades: list[dict], all_equity: list[dict]) -> dict:
    if not all_equity:
        return {}

    returns = [e["return_pct"] for e in all_trades if "return_pct" in e] if all_trades else []

    equities = [e["equity"] for e in all_equity]
    dates = [e["date"] for e in all_equity]

    # Max drawdown
    peak = equities[0]
    max_dd = 0.0
    for eq in equities:
        if eq > peak:
            peak = eq
        dd = (eq - peak) / peak * 100
        if dd < max_dd:
            max_dd = dd

    # Compute daily returns for Sharpe
    daily_rets = []
    for i in range(1, len(equities)):
        if equities[i - 1] > 0:
            daily_rets.append((equities[i] - equities[i - 1]) / equities[i - 1])

    sharpe = None
    if len(daily_rets) > 20:
        dr = np.array(daily_rets)
        if dr.std() > 0:
            sharpe = round(float(dr.mean() / dr.std() * np.sqrt(252)), 3)

    # CAGR across all active trading days
    total_days = (pd.Timestamp(dates[-1]) - pd.Timestamp(dates[0])).days if len(dates) > 1 else 1
    total_return = (equities[-1] - equities[0]) / equities[0]
    cagr = None
    if total_days > 0:
        cagr = round((math.pow(1 + total_return, 365.0 / total_days) - 1) * 100, 2)

    win_rate = None
    avg_win = None
    avg_loss = None
    if returns:
        wins = [r for r in returns if r > 0]
        losses = [r for r in returns if r <= 0]
        win_rate = round(len(wins) / len(returns) * 100, 1)
        avg_win = round(sum(wins) / len(wins), 2) if wins else None
        avg_loss = round(sum(losses) / len(losses), 2) if losses else None

    return {
        "total_return": round(total_return * 100, 2),
        "cagr": cagr,
        "sharpe": sharpe,
        "max_drawdown": round(max_dd, 2),
        "calmar": round(cagr / abs(max_dd), 3) if cagr and max_dd != 0 else None,
        "trade_count": len(all_trades),
        "win_rate": win_rate,
        "avg_win": avg_win,
        "avg_loss": avg_loss,
        "avg_trade_return": round(sum(returns) / len(returns), 3) if returns else None,
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    raw = sys.stdin.read().strip()
    try:
        strategy = json.loads(raw)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}"}))
        sys.exit(1)

    regime_name = strategy.get("regime")
    asset = strategy.get("asset", "SPX")
    rules = strategy.get("rules", [])
    default_signal = strategy.get("default_signal", "flat")

    if not regime_name:
        print(json.dumps({"error": "Missing 'regime' in strategy"}))
        sys.exit(1)

    if asset not in ASSET_SERIES:
        print(json.dumps({"error": f"Unknown asset '{asset}'. Use: {list(ASSET_SERIES.keys())}"}))
        sys.exit(1)

    # Compute warmup days needed across all rules
    warmup_days = 250  # default
    for rule in rules:
        conds = rule.get("conditions", [rule.get("condition", {})])
        for c in conds:
            ind = c.get("indicator", "")
            if ind in INDICATOR_WARMUP:
                needed = INDICATOR_WARMUP[ind](c)
                warmup_days = max(warmup_days, needed)

    conn = get_connection()
    try:
        periods = fetch_regime_periods(conn, regime_name)

        if not periods:
            print(json.dumps({"error": f"No periods found for regime '{regime_name}'"}))
            sys.exit(1)

        all_trades = []
        all_equity = []
        period_results = []
        running_equity = 100.0  # compound across periods

        for period in periods:
            start = period["start_date"]
            end = period["end_date"]
            is_current = period.get("is_current", False)

            # Warmup window: fetch extra history before the period start
            warmup_start = (
                pd.Timestamp(start) - pd.tseries.offsets.BusinessDay(warmup_days + 50)
            ).strftime("%Y-%m-%d")

            prices_raw = fetch_prices(conn, asset, warmup_start, end)

            if len(prices_raw) < 10:
                period_results.append({
                    "start_date": start,
                    "end_date": end if not is_current else "Current",
                    "is_current": is_current,
                    "skipped": True,
                    "reason": "Insufficient price data",
                })
                continue

            # Compute all needed indicators on the full (warmup+trading) window
            prices_with_indicators = compute_indicators(prices_raw, rules)

            # Simulate only within the regime period
            result = simulate_period(
                prices_with_indicators, rules, default_signal, start, end
            )

            if not result["equity_curve"]:
                period_results.append({
                    "start_date": start,
                    "end_date": end if not is_current else "Current",
                    "is_current": is_current,
                    "skipped": True,
                    "reason": "No trading days in period",
                })
                continue

            # Scale equity curve to running capital
            scale = running_equity / 100.0
            scaled_curve = [
                {**pt, "equity": round(pt["equity"] * scale, 4)}
                for pt in result["equity_curve"]
            ]

            # Update running equity
            if result["period_return"] is not None:
                running_equity *= (1 + result["period_return"] / 100.0)

            all_trades.extend(result["trades"])
            all_equity.extend(scaled_curve)

            period_results.append({
                "start_date": start,
                "end_date": end if not is_current else "Current",
                "is_current": is_current,
                "period_return": result["period_return"],
                "trade_count": len(result["trades"]),
                "trades": result["trades"],
            })

        stats = compute_stats(all_trades, all_equity)

        output = {
            "regime": regime_name,
            "asset": asset,
            "strategy_name": strategy.get("name", "Unnamed Strategy"),
            "period_count": len(periods),
            "periods_traded": len(period_results),
            "stats": stats,
            "period_results": period_results,
            "equity_curve": all_equity,
        }

        print(json.dumps(output))

    finally:
        conn.close()


if __name__ == "__main__":
    main()
