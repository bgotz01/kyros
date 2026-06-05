'use client';

import { useState, useEffect } from 'react';
import { PRESETS, Preset } from './PresetConfig';

interface Props {
    setFilterRanges: React.Dispatch<React.SetStateAction<Record<string, { min: string; max: string }>>>;
    setVisibleCols: React.Dispatch<React.SetStateAction<string[]>>;
    applyFilters: (overrideRanges?: Record<string, { min: string; max: string }>, overrideDropdowns?: Record<string, string>) => void;
    currentFilterRanges: Record<string, { min: string; max: string }>;
    currentVisibleCols: string[];
    rangeStart: string;
    rangeEnd: string;
    onRangeStart: (v: string) => void;
    onRangeEnd: (v: string) => void;
    sectors: string[];
    setSectors: (v: string[]) => void;
}

const mergePresets = (custom: Preset[]): Preset[] => {
    const customLabels = new Set(custom.map(p => p.label));
    return [...PRESETS.filter(p => !customLabels.has(p.label)), ...custom];
};

const isBuiltIn = (label: string) => PRESETS.some(p => p.label === label);

export default function PresetFilters({
    setFilterRanges,
    setVisibleCols,
    applyFilters,
    currentFilterRanges,
    currentVisibleCols,
    rangeStart,
    rangeEnd,
    onRangeStart,
    onRangeEnd,
    sectors,
    setSectors,
}: Props) {
    const [selected, setSelected] = useState('');
    const [presets, setPresets] = useState<Preset[]>(PRESETS);
    const [showModal, setShowModal] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [editingPreset, setEditingPreset] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [duplicateError, setDuplicateError] = useState('');

    const inputStyle: React.CSSProperties = {
        borderColor: 'var(--surface-border)',
        color: 'var(--text-primary)',
        background: 'var(--surface-raised)',
        caretColor: 'var(--accent)',
    };

    // load custom presets on mount
    useEffect(() => {
        fetch('/api/stocks/screener-presets')
            .then(r => r.json())
            .then(custom => { if (Array.isArray(custom) && custom.length > 0) setPresets(mergePresets(custom)); })
            .catch(() => { });
    }, []);

    const handleSelect = (label: string) => {
        setSelected(label);
        const preset = presets.find(p => p.label === label);
        if (!preset) return;

        const cleanedFilters = Object.fromEntries(
            Object.entries(preset.filters)
                .filter(([, val]) => val.min !== '' || val.max !== '')
                .map(([key, val]) => [key, { min: val.min ?? '', max: val.max ?? '' }])
        );

        setFilterRanges(cleanedFilters);
        setVisibleCols(preset.columns);
        if (preset.rangeStart) onRangeStart(preset.rangeStart);
        if (preset.rangeEnd) onRangeEnd(preset.rangeEnd);
        if (preset.sectors) setSectors(preset.sectors);
        applyFilters(cleanedFilters);
    };

    const handleSave = async () => {
        const name = presetName.trim();
        if (!name) return;

        const existing = presets.find(p => p.label === name);
        if (existing && editingPreset !== name) {
            setDuplicateError(`"${name}" already exists.`);
            return;
        }

        setSaving(true);
        setDuplicateError('');

        const activeFilters = Object.fromEntries(
            Object.entries(currentFilterRanges)
                .filter(([, val]) => val.min !== '' || val.max !== '')
                .map(([key, val]) => [key, { min: val.min, max: val.max }])
        );

        // if renaming, delete the old entry first
        if (editingPreset && editingPreset !== name) {
            await fetch('/api/stocks/screener-presets', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: editingPreset }),
            });
        }

        const entry: Preset = {
            label: name,
            filters: activeFilters,
            columns: currentVisibleCols,
            ...(rangeStart && { rangeStart }),
            ...(rangeEnd && { rangeEnd }),
            ...(sectors.length > 0 && { sectors }),
        };

        await fetch('/api/stocks/screener-presets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });

        const custom = await fetch('/api/stocks/screener-presets').then(r => r.json());
        if (Array.isArray(custom)) setPresets(mergePresets(custom));

        setSaving(false);
        setPresetName('');
        setEditingPreset(null);
        setDuplicateError('');
        setShowModal(false);
        setSelected(name);
    };

    const handleDelete = async (label: string) => {
        await fetch('/api/stocks/screener-presets', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label }),
        });
        const custom = await fetch('/api/stocks/screener-presets').then(r => r.json());
        setPresets(Array.isArray(custom) ? mergePresets(custom) : PRESETS);
        if (selected === label) setSelected('');
    };

    const activeFilterCount = Object.values(currentFilterRanges).filter(v => v.min !== '' || v.max !== '').length;

    return (
        <>
            <div className="flex items-center gap-2">
                <select
                    value={selected}
                    onChange={e => handleSelect(e.target.value)}
                    className="border px-2.5 py-1.5 text-xs tracking-wider focus:outline-none"
                    style={{ ...inputStyle, minWidth: 140 }}
                >
                    <option value="">Preset…</option>
                    {presets.map(p => (
                        <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                </select>

                <button
                    onClick={() => {
                        if (selected && !isBuiltIn(selected)) {
                            setPresetName(selected);
                            setEditingPreset(selected);
                        } else {
                            setPresetName('');
                            setEditingPreset(null);
                        }
                        setDuplicateError('');
                        setShowModal(true);
                    }}
                    className="border px-3 py-1.5 text-xs tracking-widest uppercase hover:opacity-70"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                >
                    {selected && !isBuiltIn(selected) ? 'Update' : 'Save'}
                </button>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <div className="w-full max-w-sm border flex flex-col"
                        style={{ background: 'var(--surface-raised)', borderColor: 'var(--surface-border)' }}>

                        {/* header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b"
                            style={{ borderColor: 'var(--surface-border)' }}>
                            <span className="text-xs tracking-widest uppercase font-semibold"
                                style={{ color: 'var(--text-primary)' }}>
                                {editingPreset ? 'Update Preset' : 'Save Preset'}
                            </span>
                            <button onClick={() => { setShowModal(false); setPresetName(''); setEditingPreset(null); setDuplicateError(''); }}
                                className="text-lg leading-none hover:opacity-70"
                                style={{ color: 'var(--text-muted)' }}>✕</button>
                        </div>

                        <div className="px-5 py-4 space-y-3">
                            <input
                                type="text"
                                value={presetName}
                                onChange={e => { setPresetName(e.target.value); setDuplicateError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                placeholder="Preset name…"
                                autoFocus
                                className="w-full border px-3 py-1.5 text-sm focus:outline-none"
                                style={inputStyle}
                            />
                            {duplicateError && (
                                <p className="text-xs" style={{ color: '#ef4444' }}>{duplicateError}</p>
                            )}
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
                                {' · '}{currentVisibleCols.length} columns
                                {rangeStart && rangeEnd && ` · range ${rangeStart} → ${rangeEnd}`}
                                {sectors.length > 0 && ` · ${sectors.length} sector${sectors.length > 1 ? 's' : ''}`}
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setShowModal(false); setPresetName(''); setEditingPreset(null); setDuplicateError(''); }}
                                    className="flex-1 border px-4 py-1.5 text-xs tracking-widest uppercase hover:opacity-70"
                                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!presetName.trim() || saving}
                                    className="flex-1 border px-4 py-1.5 text-xs tracking-widest uppercase hover:opacity-70 disabled:opacity-30"
                                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                                    {saving ? '…' : editingPreset ? 'Update' : 'Save'}
                                </button>
                            </div>

                            {/* custom presets deletion list */}
                            {presets.filter(p => !isBuiltIn(p.label)).length > 0 && (
                                <div className="border-t pt-3 space-y-1" style={{ borderColor: 'var(--surface-border)' }}>
                                    <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                                        Custom
                                    </p>
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                        {presets.filter(p => !isBuiltIn(p.label)).map(p => (
                                            <div key={p.label} className="flex items-center justify-between px-2 py-1 border"
                                                style={{ borderColor: 'var(--surface-border)' }}>
                                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
                                                <button onClick={() => handleDelete(p.label)}
                                                    className="text-xs hover:opacity-70 pl-2"
                                                    style={{ color: '#ef4444' }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
