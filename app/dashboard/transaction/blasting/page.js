'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import TransactionTable from '@/components/TransactionTable';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../loading-from-mines/page.module.css'; // Reuse existing styles

export default function BlastingPage() {
    const router = useRouter();
    const config = TRANSACTION_CONFIG['blasting'];

    const today = new Date().toISOString().split('T')[0];

    // Filters
    const [filters, setFilters] = useState({ fromDate: today, toDate: today });
    const [query, setQuery] = useState({ fromDate: today, toDate: today });

    // Data
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [lastEntry, setLastEntry] = useState(null);

    // Load User Role
    // Load User Role & Latest Entry
    useEffect(() => {
        // User Role
        fetch('/api/auth/me').then(r => r.json()).then(res => {
            if (res.user) setUserRole(res.user.role);
        }).catch(e => console.error(e));

        // Fetch Last Entry Info
        fetch('/api/transaction/blasting/latest').then(r => r.json()).then(res => {
            if (res.data) setLastEntry(res.data);
        }).catch(e => console.error(e));
    }, []);

    // Fetch Data
    const fetchData = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: '1000',
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
        } catch (err) {
            console.error(err);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [query, config.apiEndpoint]);

    useEffect(() => {
        fetchData();
    }, [query]);

    // Handlers
    const handleShow = () => setQuery({ ...filters });
    const handleReset = () => {
        setFilters({ fromDate: today, toDate: today });
        setQuery({ fromDate: today, toDate: today });
    };

    const handleDelete = async (id) => {
        const record = data.find(item => item.SlNo === id);
        if (!record) return;

        // Permission Check
        const isSuperUser = ['Admin', 'SuperAdmin', 'Administrator'].includes(userRole);
        if (!isSuperUser) {
            const created = new Date(record.CreatedDate);
            const today = new Date();
            if (created.toDateString() !== today.toDateString()) {
                toast.error("You can only delete records created today.");
                return;
            }
        }

        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            const res = await fetch(`/api/transaction/blasting/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            toast.success("Record deleted");
            fetchData();
        } catch (err) {
            toast.error(err.message || "Delete failed");
        }
    };

    const handleEdit = (row) => {
        // Permission Check
        const role = (userRole || '').toLowerCase();
        const isSuperUser = ['admin', 'superadmin', 'administrator'].includes(role);
        if (!isSuperUser) {
            const created = new Date(row.CreatedDate);
            const today = new Date();
            if (created.toDateString() !== today.toDateString()) {
                toast.error("You can only edit records created today.");
                return;
            }
        }
        router.push(`/dashboard/transaction/blasting/${row.SlNo}`);
    };
    // Shortcut for Add New
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F3' || (e.ctrlKey && e.key === 'a')) {
                e.preventDefault();
                router.push('/dashboard/transaction/blasting/add');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <div className={styles.page}>
            {loading && <LoadingOverlay message="Loading Blasting Data..." />}

            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Blasting</h1>

                </div>
                <div className={styles.headerActions}>
                    {lastEntry && (
                        <span style={{
                            color: '#2563eb',
                            fontStyle: 'italic',
                            fontSize: '0.85rem',
                            marginRight: '16px',
                            fontWeight: 500,
                            alignSelf: 'center'
                        }}>
                            Last data entered on -&gt; Date: {new Date(lastEntry.Date).toLocaleDateString('en-GB')} | Entered by : {lastEntry.CreatedBy || 'Admin'}
                        </span>
                    )}
                    <button className={styles.addNew} onClick={() => router.push('/dashboard/transaction/blasting/add')}>
                        <Plus size={16} /> <span style={{ textDecoration: 'underline' }}>A</span>dd New (F3)
                    </button>
                    <button className={styles.refreshBtn} onClick={fetchData} title="Reload">
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

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
                    <button onClick={handleShow} className={styles.btnPrimary}>Show</button>
                    <button onClick={handleReset} className={styles.btnSecondary}><RotateCcw size={16} /></button>
                </div>
            </div>

            <TransactionTable
                config={config}
                data={data}
                isLoading={false}
                onDelete={handleDelete}
                onEdit={handleEdit}
                userRole={userRole}
            />
        </div>
    );
}
