'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface CouncilSidebarContextValue {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

const CouncilSidebarContext = createContext<CouncilSidebarContextValue>({
    isOpen: false,
    open: () => { },
    close: () => { },
    toggle: () => { },
});

export function useCouncilSidebar() {
    return useContext(CouncilSidebarContext);
}

export function CouncilSidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <CouncilSidebarContext.Provider value={{
            isOpen,
            open: () => setIsOpen(true),
            close: () => setIsOpen(false),
            toggle: () => setIsOpen(o => !o),
        }}>
            {children}
        </CouncilSidebarContext.Provider>
    );
}
