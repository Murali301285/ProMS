'use client';

import { Loader2 } from 'lucide-react';

export default function LoadingOverlay({ message = "Loading data..." }) {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            borderRadius: 'inherit'
        }}>
            <div style={{
                background: 'white',
                padding: '16px 24px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid #e2e8f0'
            }}>
                <Loader2 className="animate-spin" color="#2563eb" size={24} />
                <span style={{ fontWeight: 600, color: '#334155' }}>{message}</span>
            </div>
        </div>
    );
}
