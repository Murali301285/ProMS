'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import TransactionTable from '@/components/TransactionTable';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, RotateCcw } from 'lucide-react';
import styles from './page.module.css';

export default function InternalTransferPage() {
    const router = useRouter();
    const config = TRANSACTION_CONFIG['internal-transfer'];

    // 1. UI Filter State
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        fromDate: today,
        toDate: today
    });

    // 2. Query State (Active for Fetching)
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

    // Load Init Info (Role & Last Entry)
    useEffect(() => {
        async function loadInit() {
            try {
                // Fetch User Role
                const meRes = await fetch('/api/auth/me');
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setUserRole(meData.user.role);
                }

                // Fetch Last Entry Info
                const lastRes = await fetch('/api/transaction/helper/last-internal-entry-info');
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
                limit: '1000000',
                fromDate: query.fromDate,
                toDate: query.toDate
            });

            console.log("🚀 [CLIENT] Fetching List Data from API...");

            const res = await fetch(`${config.apiEndpoint}?${params}`, { cache: 'no-store' });
            const result = await res.json();

            console.log(`📥 [CLIENT] List Data Received: ${result.data ? result.data.length : 0} rows.`);

            if (result.data) {
                setData(result.data);
            } else {
                setData([]);
            }

            // Refresh Last Entry
            fetch('/api/transaction/helper/last-internal-entry-info')
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
    }, [query, config.apiEndpoint]);

    useEffect(() => {
        fetchData();
    }, [query]);

    const handleShow = () => {
        setQuery({ ...filters });
    };

    const handleReset = () => {
        const defaults = { fromDate: today, toDate: today };
        setFilters(defaults);
        setQuery(defaults);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        alert("Delete functionality pending API implementation in Phase 2.");
    };

    return (
        <div className={styles.page} style={{ position: 'relative' }}>
            {/* Blocking Overlay */}
            {loading && <LoadingOverlay message="Processing..." />}

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Internal Transfer</h1>
                <div className={styles.headerActions}>
                    {/* Last Data Label */}
                    {lastEntry && (
                        <span style={{
                            color: '#2563eb',
                            fontStyle: 'italic',
                            fontSize: '0.85rem',
                            marginRight: '16px',
                            fontWeight: 500
                        }}>
                            Last data entered on -&gt; Date: {new Date(lastEntry.TransferDate).toLocaleDateString('en-GB')} | Entered by : {lastEntry.CreatedByName || 'Unknown'}
                        </span>
                    )}

                    <button className={`${styles.addNew} transition-transform active:scale-95 hover:scale-105 duration-200`} onClick={() => router.push('/dashboard/transaction/internal-transfer/add')}>
                        <Plus size={16} /> Add New
                    </button>
                    <button className={styles.refreshBtn} onClick={() => fetchData()} title="Reload">
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>From Date</label>
                    <input type="date" value={filters.fromDate} max={today} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} />
                </div>
                <div className={styles.filterGroup}>
                    <label>To Date</label>
                    <input type="date" value={filters.toDate} max={today} onChange={e => setFilters({ ...filters, toDate: e.target.value })} />
                </div>

                <div className={styles.actions}>
                    <button onClick={handleShow} className={styles.btnPrimary} title="Load Data">Show</button>
                    <button onClick={handleReset} className={styles.btnSecondary} title="Reset Dates"><RotateCcw size={16} /></button>
                </div>
            </div>

            {/* Table */}
            <TransactionTable
                config={config}
                data={data}
                isLoading={false}
                onDelete={handleDelete}
                userRole={userRole}
            />
        </div>
    );
}
