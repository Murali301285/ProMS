
'use client';

import { useUI } from "@/contexts/UIContext";

export default function TransactionWrapper({ children }) {
    const { txnScale } = useUI();

    const getScaleClass = () => {
        if (txnScale === 1.1) return 'scale-large';
        if (txnScale === 1.25) return 'scale-largest';
        return 'scale-normal';
    };

    return (
        <div className={getScaleClass()}>
            {children}
        </div>
    );
}
