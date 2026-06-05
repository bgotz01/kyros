/**
 * POST /api/backtest/suggest
 *
 * Given a regime name + metadata, asks the AI to propose a trading strategy
 * expressed as a backtest DSL object the UI can load directly into the builder.
 *
 * Body: { regime: string; description: string; guidance: string; entryDescription: string }
 *
 * Returns: { strategy: { name, asset, rules, defaultSignal }, rationale: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { callAgent } from '@/app/lib/llm';
import { loadSettings } from '@/app/lib/settings';

const SYSTEM_PROMPT = `You are a quantitative strategy designer working within a macro regime framework.
You will be given a market regime and asked to propose a signal-based trading strategy for backtesting.

The strategy must be expressed as a JSON object matching this exact schema:
{
  "name": "string — short descriptive name",
  "asset": "SPX" | "NDX",
  "rules": [
    {
      "conditions": [
        {
          "indicator": "price_vs_ma" | "ma_slope" | "ma_crossover" | "rsi" | "price_vs_ma_and_slope",
          // For price_vs_ma, ma_slope, price_vs_ma_and_slope:
          "period": number,       // MA period (e.g. 50, 100, 200)
          "operator": ">" | ">=" | "<" | "<=" | "==",
          "threshold": number,    // ratio for price_vs_ma (e.g. 1.10 = 10% above), pct for ma_slope
          // For price_vs_ma_and_slope only (additional slope check):
          "slope_operator": ">" | "<",  // optional
          "slope_threshold": number,    // optional, slope % threshold
          // For ma_crossover:
          "fast": number,
          "slow": number
          // For rsi:
          // indicator: "rsi", period: 14, operator: ">", threshold: 70
        }
      ],
      "signal": "long" | "short" | "flat"
    }
  ],
  "defaultSignal": "long" | "short" | "flat"
}

Rules are evaluated in order — first match wins.
Multiple conditions within a rule use AND logic.

IMPORTANT:
- price_vs_ma threshold is a RATIO (1.10 = price is 10% ABOVE the MA, 0.90 = 10% BELOW)
- ma_slope threshold is a PERCENTAGE (e.g. -0.5 means slope is negative by 0.5%)
- For rsi, threshold is 0-100 (e.g. 70 = overbought)
- Keep strategies simple and testable: 2-4 rules maximum
- Think about what behavior makes sense in this specific regime context

You must respond with ONLY a JSON object in this exact format:
{
  "strategy": { ...the strategy DSL... },
  "rationale": "2-3 sentences explaining the logic and why it fits this regime"
}`;

export async function POST(req: NextRequest) {
    let body: {
        regime: string;
        description: string;
        guidance: string;
        entryDescription: string;
        exitDescription: string;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { regime, description, guidance, entryDescription, exitDescription } = body;

    const userPrompt = `Design a signal-based trading strategy for the following market regime:

REGIME: ${regime}
DESCRIPTION: ${description}
GUIDANCE: ${guidance}
ENTRY CONDITIONS: ${entryDescription}
EXIT CONDITIONS: ${exitDescription}

Consider:
- What does this regime imply about equity risk/reward?
- Should the strategy be mean-reverting (buy dips, sell rips) or trend-following?
- Which asset (SPX broad market, or NDX tech-heavy) fits the regime better?
- What MA periods and thresholds historically mark extremes in this kind of environment?

Return a concrete, testable strategy as JSON.`;

    try {
        const settings = loadSettings();
        const result = await callAgent('athena', [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
        ], settings);

        // Parse the JSON from the response
        const text = result.text.trim();

        // Extract JSON — model may wrap in markdown fences
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ?? text.match(/(\{[\s\S]+\})/);
        const jsonStr = jsonMatch ? jsonMatch[1] : text;

        let parsed: { strategy: unknown; rationale: string };
        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            console.error('Failed to parse AI strategy response:', text.slice(0, 300));
            return NextResponse.json(
                { error: 'AI returned invalid JSON. Try again.' },
                { status: 500 },
            );
        }

        return NextResponse.json(parsed);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('backtest/suggest error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
