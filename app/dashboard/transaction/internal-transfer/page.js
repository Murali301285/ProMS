'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import TransactionTable from '@/components/TransactionTable';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, RotateCcw } from 'lucide-react';
// Basic inline styles to replace missing CSS module for build success
const styles = {
    page: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b' },
    headerActions: { display: 'flex', gap: '10px', alignItems: 'center' },
    addNew: { display: 'flex', alignItems: 'center', gap: '5px', background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' },
    refreshBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    filters: { display: 'flex', alignItems: 'flex-end', gap: '15px', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px', fontWeight: '500', color: '#64748b' },
    actions: { display: 'flex', gap: '10px' },
    btnPrimary: { background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' },
    btnSecondary: { background: 'white', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }
};

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
        <div style={styles.page}>
            {/* Blocking Overlay */}
            {/* {loading && <LoadingOverlay message="Processing..." />} */}

            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>Internal Transfer</h1>
                <div style={styles.headerActions}>
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

                    <button style={styles.addNew} onClick={() => router.push('/dashboard/transaction/internal-transfer/add')}>
                        <Plus size={16} /> Add New
                    </button>
                    <button style={styles.refreshBtn} onClick={() => fetchData()} title="Reload">
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={styles.filters}>
                <div style={styles.filterGroup}>
                    <label>From Date</label>
                    <input type="date" value={filters.fromDate} max={today} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} style={{ border: '1px solid #cbd5e1', padding: '6px', borderRadius: '4px' }} />
                </div>
                <div style={styles.filterGroup}>
                    <label>To Date</label>
                    <input type="date" value={filters.toDate} max={today} onChange={e => setFilters({ ...filters, toDate: e.target.value })} style={{ border: '1px solid #cbd5e1', padding: '6px', borderRadius: '4px' }} />
                </div>

                <div style={styles.actions}>
                    <button onClick={handleShow} style={styles.btnPrimary} title="Load Data">Show</button>
                    <button onClick={handleReset} style={styles.btnSecondary} title="Reset Dates"><RotateCcw size={16} /></button>
                </div>
            </div>

            {/* Table */}
            <TransactionTable
                config={config}
                data={data}
                isLoading={loading}
                onDelete={handleDelete}
                userRole={userRole}
            />
        </div>
    );
}
