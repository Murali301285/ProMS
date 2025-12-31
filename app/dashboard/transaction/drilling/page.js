'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import TransactionTable from '@/components/TransactionTable';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../loading-from-mines/page.module.css'; // Reusing styles

export default function DrillingPage() {
    const router = useRouter();
    const config = TRANSACTION_CONFIG['drilling'];

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

    // Load Init Info (Role)
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
                const lastRes = await fetch('/api/transaction/drilling/last-entry');
                const lastData = await lastRes.json();
                if (lastData.success && lastData.data) {
                    setLastEntry(lastData.data);
                }
            } catch (e) { console.error(e); }
        }
        loadInit();
    }, []); // Only on mount

    // Data Fetching
    const fetchData = useCallback(async () => {
        if (loading) return;
        setLoading(true);

        try {
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

            // Refresh Last Entry on data refresh
            fetch('/api/transaction/drilling/last-entry')
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
        // Implement logic for Delete Restriction Check
        const record = data.find(item => item.SlNo === id);
        if (!record) return;

        // Restriction: Normal User can only delete Same Day Created
        if (userRole !== 'Admin') {
            const createdDate = new Date(record.CreatedDate).toISOString().split('T')[0];
            const todayDate = new Date().toISOString().split('T')[0];
            if (createdDate !== todayDate) {
                toast.error("You can only delete records created today.");
                return;
            }
        }

        if (!window.confirm("Are you sure you want to delete this record?")) return;

        try {
            const res = await fetch(`/api/transaction/drilling/${id}`, {
                method: 'DELETE'
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to delete');

            toast.success("Record deleted successfully");
            fetchData(); // Refresh list
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        }
    };

    const handleEdit = (row) => {
        // Restriction: Normal User can only edit Same Day Created
        if (userRole !== 'Admin') {
            const createdDate = new Date(row.CreatedDate).toISOString().split('T')[0];
            const todayDate = new Date().toISOString().split('T')[0];
            if (createdDate !== todayDate) {
                toast.error("You can only edit records created today.");
                return;
            }
        }
        router.push(`/dashboard/transaction/drilling/${row.SlNo}`);
    };
    // Shortcut for Add New
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F3' || (e.ctrlKey && e.key === 'a')) {
                e.preventDefault();
                router.push('/dashboard/transaction/drilling/add');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);


    return (
        <div className={styles.page} style={{ position: 'relative' }}>
            {/* Blocking Overlay */}
            {/* {loading && <LoadingOverlay message="Processing..." />} */}

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Drilling</h1>
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
                            Last data entered on -&gt; Date: {new Date(lastEntry.Date).toLocaleDateString('en-GB')} | Entered by : {lastEntry.CreatedByName || 'Unknown'}
                        </span>
                    )}

                    {/* Add New Button (Disabled for now as per requirement sequence) -> Actually enabled to route to Add page */}
                    <button className={styles.addNew} onClick={() => router.push('/dashboard/transaction/drilling/add')}>
                        <Plus size={16} /> <span style={{ textDecoration: 'underline' }}>A</span>dd New (F3)
                    </button>
                    <button className={styles.refreshBtn} onClick={() => fetchData()} title="Reload">
                        <RotateCcw size={16} />
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
                isLoading={loading} // Loading handled by overlay
                onDelete={handleDelete}
                userRole={userRole}
                onEdit={handleEdit}
            />
        </div>
    );
}
