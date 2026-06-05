/**
 * POST /api/backtest
 *
 * Receives a strategy definition, shells out to python/backtest_engine.py,
 * and streams the result back as JSON.
 *
 * The Python script reads the DB directly using DATABASE_URL and writes
 * a single JSON object to stdout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

const PYTHON_SCRIPT = path.join(process.cwd(), 'python', 'backtest_engine.py');
const TIMEOUT_MS = 60_000; // 60s max

function findPython(): string {
    // Prefer the panteon venv if it exists, fall back to system python3
    const venvPy = path.join(process.cwd(), '.venv', 'bin', 'python');
    const { existsSync } = require('fs');
    if (existsSync(venvPy)) return venvPy;
    return 'python3';
}

export async function POST(req: NextRequest) {
    let strategy: unknown;
    try {
        strategy = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const python = findPython();

    return new Promise<NextResponse>((resolve) => {
        const proc = spawn(python, [PYTHON_SCRIPT], {
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
        proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

        // Send strategy JSON to Python via stdin
        proc.stdin.write(JSON.stringify(strategy));
        proc.stdin.end();

        const timer = setTimeout(() => {
            proc.kill();
            resolve(NextResponse.json({ error: 'Backtest timed out after 60s' }, { status: 504 }));
        }, TIMEOUT_MS);

        proc.on('close', (code) => {
            clearTimeout(timer);

            if (code !== 0) {
                console.error('Backtest engine stderr:', stderr);
                resolve(NextResponse.json(
                    { error: 'Backtest engine failed', detail: stderr.slice(0, 500) },
                    { status: 500 },
                ));
                return;
            }

            try {
                const result = JSON.parse(stdout);
                if (result.error) {
                    resolve(NextResponse.json({ error: result.error }, { status: 400 }));
                    return;
                }
                resolve(NextResponse.json(result));
            } catch {
                console.error('Failed to parse backtest output:', stdout.slice(0, 200));
                resolve(NextResponse.json(
                    { error: 'Failed to parse backtest output' },
                    { status: 500 },
                ));
            }
        });

        proc.on('error', (err) => {
            clearTimeout(timer);
            console.error('Failed to spawn Python:', err);
            resolve(NextResponse.json(
                { error: `Failed to start Python: ${err.message}` },
                { status: 500 },
            ));
        });
    });
}
