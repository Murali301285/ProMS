
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
    const [txnScale, setTxnScale] = useState(1);

    useEffect(() => {
        // Load persist state
        const saved = localStorage.getItem('proms_txn_scale');
        const scale = saved ? parseFloat(saved) : 1;
        setTxnScale(scale);

        // Apply Global Scale immediately on mount
        document.documentElement.style.zoom = scale;
    }, []);

    const updateScale = (scale) => {
        setTxnScale(scale);
        localStorage.setItem('proms_txn_scale', scale);
        // Apply Global Scope
        document.documentElement.style.zoom = scale;
        // Also set a CSS variable if needed for other calculations
        document.documentElement.style.setProperty('--app-scale', scale);
    };

    return (
        <UIContext.Provider value={{ txnScale, updateScale }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    return useContext(UIContext);
}
