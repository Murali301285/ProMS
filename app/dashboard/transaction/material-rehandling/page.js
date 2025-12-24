'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import TransactionTable from '@/components/TransactionTable';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, RotateCcw } from 'lucide-react';
import styles from './page.module.css';

export default function MaterialRehandlingPage() {
    const router = useRouter();
    const config = TRANSACTION_CONFIG['material-rehandling'];

    // 1. UI Filter State
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        fromDate: today,
        toDate: today
    });

    // 2. Query State
    const [query, setQuery] = useState({
        fromDate: today,
        toDate: today
    });

    // 3. Data State
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [lastEntry, setLastEntry] = useState(null);

    // --- Effects & Handlers ---

    // Load Init Info
    useEffect(() => {
        async function loadInit() {
            try {
                // Fetch User Role
                const meRes = await fetch('/api/auth/me');
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setUserRole(meData.user.role);
                }

                // Fetch Last Entry Info (Specific API)
                const lastRes = await fetch('/api/transaction/material-rehandling/latest');
                const lastData = await lastRes.json();
                if (lastData.success && lastData.data) {
                    setLastEntry(lastData.data);
                }
            } catch (e) { console.error(e); }
        }
        loadInit();
    }, []);

    // Data Fetching
    const fetchData = useCallback(async () => {
        if (loading) return;
        setLoading(true);

        try {
            const params = new URLSearchParams({
                offset: '0',
                limit: '1000000',
                fromDate: query.fromDate,
                toDate: query.toDate
            });

            const res = await fetch(`${config.apiEndpoint}?${params}`, { cache: 'no-store' });
            const result = await res.json();

            if (result.data) {
                setData(result.data);
            } else {
                setData([]);
            }

            // Refresh Last Entry
            fetch('/api/transaction/material-rehandling/latest')
                .then(r => r.json())
                .then(res => {
                    if (res.success) setLastEntry(res.data);
                });

        } catch (err) {
            console.error(err);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [query, config.apiEndpoint]); // Removed loading dependency to prevent staleness

    // Trigger Fetch
    useEffect(() => {
        fetchData();
    }, [query]);

    // Shortcut for Add New
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F3' || (e.ctrlKey && e.key === 'a')) {
                e.preventDefault();
                router.push('/dashboard/transaction/material-rehandling/add');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <div className={styles.container}>
            {loading && <LoadingOverlay message="Loading Rehandling Data..." />}

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Material Rehandling</h1>
                <div className={`${styles.actions} items-center`}>
                    {lastEntry && (
                        <span style={{
                            color: '#2563eb',
                            fontStyle: 'italic',
                            fontSize: '0.85rem',
                            marginRight: '16px',
                            fontWeight: 500
                        }}>
                            Last data entered on -&gt; Date: {new Date(lastEntry.Date).toLocaleDateString('en-GB')} | Entered by : {lastEntry.CreatedBy || 'Admin'}
                        </span>
                    )}
                    <button
                        onClick={() => router.push('/dashboard/transaction/material-rehandling/add')}
                        className={`${styles.addButton} transition-transform active:scale-95 hover:scale-105 duration-200`}
                    >
                        <Plus size={18} /> <span style={{ textDecoration: 'underline' }}>A</span>dd New (F3)
                    </button>
                    {/* Refresh Button Removed */}
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.dateGroup}>
                    <label className="font-bold">From Date</label>
                    <input
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                        className={styles.input}
                    />
                </div>
                <div className={styles.dateGroup}>
                    <label className="font-bold">To Date</label>
                    <input
                        type="date"
                        value={filters.toDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                        className={styles.input}
                    />
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        onClick={() => setQuery(filters)}
                        className={styles.searchBtn}
                    >
                        Show
                    </button>
                    <button
                        onClick={() => {
                            setFilters({ fromDate: today, toDate: today });
                            setQuery({ fromDate: today, toDate: today });
                        }}
                        className={styles.resetBtn}
                        title="Reset Filters"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
                <TransactionTable
                    data={data}
                    config={config}
                    loading={loading}
                    userRole={userRole}
                    onEdit={(row) => router.push(`/dashboard/transaction/material-rehandling/${row.SlNo}`)}
                />
            </div>
        </div>
    );
}
