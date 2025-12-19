
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import TransactionTable from '@/components/TransactionTable';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../loading-from-mines/page.module.css'; // Reuse common styles

export default function CrusherPage() {
    const router = useRouter();
    const config = TRANSACTION_CONFIG['crusher'];

    const today = new Date().toISOString().split('T')[0];

    // Filters
    const [filters, setFilters] = useState({ fromDate: today, toDate: today });
    const [query, setQuery] = useState({ fromDate: today, toDate: today });

    // Data
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [lastEntry, setLastEntry] = useState(null);

    // Initial Load
    useEffect(() => {
        // User Role
        fetch('/api/auth/me').then(r => r.json()).then(res => {
            if (res.user) setUserRole(res.user.role);
        }).catch(e => console.error(e));

        // Last Entry
        fetch('/api/transaction/crusher/latest').then(r => r.json()).then(res => {
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

        const isSuperUser = ['Admin', 'SuperAdmin', 'Administrator'].includes(userRole);
        if (!isSuperUser) {
            const created = new Date(record.CreatedDate);
            const todayDate = new Date();
            if (created.toDateString() !== todayDate.toDateString()) {
                toast.error("You can only delete records created today.");
                return;
            }
        }

        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            const res = await fetch(`/api/transaction/crusher/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Delete failed");
            toast.success("Record deleted");
            fetchData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleEdit = (row) => {
        const role = (userRole || '').toLowerCase();
        const isSuperUser = ['admin', 'superadmin', 'administrator'].includes(role);
        if (!isSuperUser) {
            const created = new Date(row.CreatedDate);
            const todayDate = new Date();
            if (created.toDateString() !== todayDate.toDateString()) {
                toast.error("You can only edit records created today.");
                return;
            }
        }
        router.push(`/dashboard/transaction/crusher/${row.SlNo}`);
    };

    return (
        <div className={styles.page}>
            {loading && <LoadingOverlay message="Loading Crusher Data..." />}

            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Crusher</h1>
                    {lastEntry && (
                        <div className="text-xs text-gray-500 mt-1">
                            Last data entered on &rarr; Date: {new Date(lastEntry.CreatedDate).toLocaleDateString('en-GB')} | Entered by : {lastEntry.CreatedByName}
                        </div>
                    )}
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.addNew} onClick={() => router.push('/dashboard/transaction/crusher/add')}>
                        <Plus size={16} /> Add New
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
