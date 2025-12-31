
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RotateCcw } from 'lucide-react';
import TransactionTable from '@/components/TransactionTable'; // Updated Component
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig'; // Central Config
import styles from '../loading-from-mines/page.module.css'; // Reuse consistent styles
import LoadingOverlay from '@/components/LoadingOverlay'; // Consistent Loader
import { toast } from 'sonner';

export default function WaterTankerEntryList() {
    const router = useRouter();
    const config = TRANSACTION_CONFIG['water-tanker-entry'];

    // UI State
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [lastEntry, setLastEntry] = useState(null);
    const [userRole, setUserRole] = useState('');

    // Filter State
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        fromDate: today,
        toDate: today
    });
    // Query State (What is currently fetched)
    const [query, setQuery] = useState({
        fromDate: today,
        toDate: today
    });

    // --- Effects ---

    // 1. Initial Load (Role + Last Entry)
    useEffect(() => {
        async function loadInit() {
            try {
                // Fetch Role
                const meRes = await fetch('/api/auth/me');
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setUserRole(meData.user.role);
                }
                // Fetch Last Entry
                const lastRes = await fetch('/api/transaction/water-tanker-entry/latest');
                const lastData = await lastRes.json();
                console.log("LAST ENTRY DATA DEBUG:", lastData);
                if (lastData.success && lastData.data) {
                    setLastEntry(lastData.data);
                } else {
                    console.warn("Last Entry Fetch Failed or Empty", lastData);
                }
            } catch (e) { console.error('Init Error', e); }
        }
        loadInit();
    }, []);

    // 2. Data Fetching
    const fetchData = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                fromDate: query.fromDate,
                toDate: query.toDate
            });
            const res = await fetch(`${config.apiEndpoint}?${params}`);
            const result = await res.json();

            if (result.success && result.data) {
                setData(result.data);
            } else if (Array.isArray(result)) {
                // Fallback if API returns array directly (rare but possible in some legacy endpoints)
                setData(result);
            } else {
                setData([]);
                if (result.message) toast.error(result.message);
            }

            // Refresh Last Entry Info
            const lastRes = await fetch('/api/transaction/water-tanker-entry/latest');
            const lastData = await lastRes.json();
            if (lastData.success && lastData.data) setLastEntry(lastData.data);

        } catch (err) {
            console.error('Fetch Error', err);
            toast.error('Failed to load data');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [query]);

    // Trigger Fetch on Query Change
    useEffect(() => {
        fetchData();
    }, [query]);

    // --- Handlers ---

    const handleShow = () => {
        setQuery({ ...filters }); // Commit filters
    };

    const handleReset = () => {
        const defaults = { fromDate: today, toDate: today };
        setFilters(defaults);
        setQuery(defaults);
    };

    const handleDelete = async (id) => {
        // Restriction: User can only delete same-day records (Logic handled in TransactionTable or component can enforce)
        // Check local constraint if needed before API call
        if (userRole !== 'Admin') {
            const record = data.find(d => d.SlNo === id);
            if (record) {
                const created = new Date(record.CreatedDate || record.EntryDate).toDateString();
                const now = new Date().toDateString();
                if (created !== now) {
                    toast.error('You can only delete records created today.');
                    return;
                }
            }
        }

        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            const res = await fetch(`${config.apiEndpoint}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Deleted successfully');
                fetchData();
            } else {
                const json = await res.json();
                toast.error(json.error || 'Delete failed');
            }
        } catch (e) {
            toast.error('Network error');
        }
    };

    const handleEdit = (row) => {
        // Restriction check same as delete
        if (userRole !== 'Admin') {
            const created = new Date(row.CreatedDate || row.EntryDate).toDateString();
            const now = new Date().toDateString();
            if (created !== now) {
                toast.error('You can only edit records created today.');
                return;
            }
        }
        router.push(`/dashboard/transaction/water-tanker-entry/${row.SlNo}`);
    };

    // Shortcut F3
    useEffect(() => {
        const handleKeys = (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                router.push('/dashboard/transaction/water-tanker-entry/add');
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [router]);

    return (
        <div className={styles.page} style={{ position: 'relative' }}>
            {/* {loading && <LoadingOverlay message="Loading Data..." />} */}

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Water Tanker Entry</h1>
                <div className={styles.headerActions}>
                    {console.log("RENDERING LAST ENTRY:", lastEntry)}
                    {lastEntry && (
                        <span style={{
                            color: '#2563eb',
                            fontStyle: 'italic',
                            fontSize: '0.85rem',
                            marginRight: '16px',
                            fontWeight: 500
                        }}>
                            Last data entered on -&gt; Date: {lastEntry.EntryDate ? new Date(lastEntry.EntryDate).toLocaleDateString('en-GB') : 'NA'} | Entered by : {lastEntry.CreatedByName || lastEntry.CreatedBy || 'Unknown'}
                        </span>
                    )}
                    <button className={styles.addNew} onClick={() => router.push('/dashboard/transaction/water-tanker-entry/add')}>
                        <Plus size={16} /> <span style={{ textDecoration: 'underline' }}>A</span>dd New (F3)
                    </button>
                    <button className={styles.refreshBtn} onClick={fetchData} title="Reload">
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Filters */}
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
                    <button onClick={handleReset} className={styles.btnSecondary} title="Reset"><RotateCcw size={16} /></button>
                </div>
            </div>

            {/* TransactionTable */}
            <TransactionTable
                config={config}
                data={data}
                isLoading={loading} // passed to table
                onDelete={handleDelete}
                onEdit={handleEdit}
                userRole={userRole}
            />
        </div>
    );
}
