'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import TransactionTable from '@/components/TransactionTable';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, RotateCcw } from 'lucide-react';
import styles from './page.module.css';

export default function LoadingFromMinesPage() {
    const router = useRouter();
    const config = TRANSACTION_CONFIG['loading-from-mines'];

    // 1. UI Filter State (Input only - Deferred)
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

                // Fetch Last Entry Info (Independent of Filter)
                const lastRes = await fetch('/api/transaction/helper/last-entry-info');
                const lastData = await lastRes.json();
                if (lastData.success && lastData.data) {
                    setLastEntry(lastData.data);
                }
            } catch (e) { console.error(e); }
        }
        loadInit();
    }, []); // Only on mount

    // Data Fetching (Fetches ALL data for Date Range)
    const fetchData = useCallback(async () => {
        if (loading) return;
        setLoading(true);

        try {
            // Fetch ALL data (Client Side Filtering Strategy)
            const params = new URLSearchParams({
                offset: '0',
                limit: '1000000', // Fetch practically infinite
                fromDate: query.fromDate,
                toDate: query.toDate
            });

            const res = await fetch(`${config.apiEndpoint}?${params}`);
            const result = await res.json();

            if (result.data) {
                setData(result.data);
            } else {
                setData([]);
            }

            // Refresh Last Entry on data refresh too (in case user added something)
            fetch('/api/transaction/helper/last-entry-info')
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

    // Trigger Fetch when Active Query changes
    useEffect(() => {
        fetchData();
    }, [query]);

    // Handlers
    const handleShow = () => {
        setQuery({ ...filters }); // Commit Filters to Query
    };

    const handleReset = () => {
        const defaults = {
            fromDate: today,
            toDate: today
        };
        setFilters(defaults);
        setQuery(defaults);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        // API Call for delete would go here (Not implemented yet as per previous context)
        alert("Delete functionality pending API implementation.");
    };

    // Shortcut for Add New
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F3' || (e.ctrlKey && e.key === 'a')) {
                e.preventDefault();
                router.push('/dashboard/transaction/loading-from-mines/add');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <div className={styles.page} style={{ position: 'relative' }}>
            {/* Blocking Overlay - Removed for Async Loading as per user request */}
            {/* {loading && <LoadingOverlay message="Processing..." />} */}

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Loading From Mines</h1>
                <div className={styles.headerActions}>
                    {/* Last Data Label (Independent) */}
                    {lastEntry && (
                        <span style={{
                            color: '#2563eb',
                            fontStyle: 'italic',
                            fontSize: '0.85rem',
                            marginRight: '16px',
                            fontWeight: 500
                        }}>
                            Last data entered on -&gt; Loading Date: {new Date(lastEntry.LoadingDate).toLocaleDateString('en-GB')} | Entered by : {lastEntry.CreatedByName || 'Unknown'}
                        </span>
                    )}

                    <button className={styles.addNew} onClick={() => router.push('/dashboard/transaction/loading-from-mines/add')}>
                        <Plus size={16} /> <span style={{ textDecoration: 'underline' }}>A</span>dd New (F3)
                    </button>

                </div>
            </div>

            {/* Filters (Dates Only) */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>From Date</label>
                    <input
                        type="date"
                        value={filters.fromDate}
                        max={today}
                        onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label>To Date</label>
                    <input
                        type="date"
                        value={filters.toDate}
                        max={today}
                        onChange={e => setFilters({ ...filters, toDate: e.target.value })}
                    />
                </div>

                <div className={styles.actions}>
                    <button onClick={handleShow} className={styles.btnPrimary} title="Load Data">Show</button>
                    <button onClick={handleReset} className={styles.btnSecondary} title="Reset Dates"><RotateCcw size={16} /></button>
                </div>
            </div>

            {/* Table */}
            <TransactionTable
                config={config}
                data={data} // Full Data passed
                isLoading={loading} // Passed loading state to table
                onDelete={handleDelete}
                userRole={userRole}
                onEdit={(row) => router.push(`/dashboard/transaction/loading-from-mines/${row.SlNo}`)}
            />
        </div>
    );
}
