
'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import styles from '@/app/dashboard/settings/Settings.module.css';

export default function SystemLogsPage() {
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/logs');
            const data = await res.json();
            setLogs(data.logs || 'No logs available');
        } catch (error) {
            setLogs('Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} /> System Error Logs
                </h1>
                <button onClick={fetchLogs} className={styles.btnPrimary} title="Refresh Logs">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div style={{
                background: '#0f172a',
                color: '#22c55e',
                padding: '1rem',
                borderRadius: '8px',
                height: 'calc(100vh - 200px)',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '14px',
                whiteSpace: 'pre-wrap',
                border: '1px solid #334155'
            }}>
                {loading ? 'Loading logs...' : logs}
            </div>
        </div>
    );
}
