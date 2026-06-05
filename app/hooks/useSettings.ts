'use client';

import { useState, useCallback } from 'react';
import {
    loadSettings,
    saveSettings,
    type PanteonSettings,
    type Provider,
    type AgentName,
    type AgentConfig,
} from '../lib/settings';

export function useSettings() {
    const [settings, setSettings] = useState<PanteonSettings>(() => loadSettings());

    const setKey = useCallback((provider: Provider, value: string) => {
        setSettings((prev) => {
            const next: PanteonSettings = {
                ...prev,
                keys: { ...prev.keys, [provider]: value },
            };
            saveSettings(next);
            return next;
        });
    }, []);

    const removeKey = useCallback((provider: Provider) => {
        setSettings((prev) => {
            const keys = { ...prev.keys };
            delete keys[provider];
            const next: PanteonSettings = { ...prev, keys };
            saveSettings(next);
            return next;
        });
    }, []);

    const setAgentConfig = useCallback((agent: AgentName, config: AgentConfig) => {
        setSettings((prev) => {
            const next: PanteonSettings = {
                ...prev,
                agents: { ...prev.agents, [agent]: config },
            };
            saveSettings(next);
            return next;
        });
    }, []);

    const hasKey = useCallback(
        (provider: Provider) => !!settings.keys[provider],
        [settings.keys],
    );

    return { settings, setKey, removeKey, setAgentConfig, hasKey };
}
