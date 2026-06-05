import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const JSON_PATH = path.join(process.cwd(), 'app/components/stocks/screener/customPresets.json');

function read() {
    try { return JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8')); }
    catch { return []; }
}

function write(data: unknown) {
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
    return NextResponse.json(read());
}

export async function POST(req: Request) {
    const { label, filters, columns, rangeStart, rangeEnd, sectors } = await req.json();
    if (!label || !filters || !columns) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const presets = read();
    const idx = presets.findIndex((p: { label: string }) => p.label === label);
    const entry = {
        label, filters, columns,
        ...(rangeStart && { rangeStart }),
        ...(rangeEnd && { rangeEnd }),
        ...(sectors?.length > 0 && { sectors }),
    };
    if (idx >= 0) presets[idx] = entry;
    else presets.push(entry);
    write(presets);
    return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
    const { label } = await req.json();
    if (!label) return NextResponse.json({ error: 'Missing label' }, { status: 400 });
    write(read().filter((p: { label: string }) => p.label !== label));
    return NextResponse.json({ ok: true });
}
