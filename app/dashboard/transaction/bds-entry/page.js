'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, RotateCcw, Upload } from 'lucide-react';
import TransactionTable from '@/components/TransactionTable';
import styles from '../loading-from-mines/page.module.css';

export default function BDSEntryList() {
    const router = useRouter();
    const today = new Date().toISOString().split('T')[0];

    const config = {
        table: '[Trans].[TblBDSEntry]',
        idField: 'SlNo',
        apiPath: '/api/transaction/bds-entry',
        columns: [
            { accessor: 'SlNo', label: '#', width: 50, frozen: true },
            { accessor: 'Date', label: 'Date', type: 'date', width: 120, frozen: true },
            { accessor: 'SMECategoryName', label: 'SME Category', width: 200 },
            { accessor: 'VehicleNo', label: 'Vehicle No', width: 120 },
            { accessor: 'Weighment', label: 'Weighment (Kg)', type: 'number', width: 120 },
            { accessor: 'CounterReading', label: 'Counter Reading (Kg)', type: 'number', width: 150 },
            { accessor: 'LoadingSheet', label: 'Loading Sheet (Kg)', type: 'number', width: 140 },
            { accessor: 'StandardDeduction', label: 'Std Deduction (Kg)', type: 'number', width: 150 },
            { accessor: 'AcceptedQuantity', label: 'Accepted Qty (Kg)', type: 'number', width: 150 },
            { accessor: 'ChallanNo', label: 'Challan No', width: 120 },
            { accessor: 'Remarks', label: 'Remarks', width: 200 },
            { accessor: 'CreatedByName', label: 'Created By', width: 150 },
            { accessor: 'CreatedDate', label: 'Created Time', type: 'datetime', width: 180, disableFilter: true },
            { accessor: 'UpdatedBy', label: 'Updated By', width: 150 },
            { accessor: 'UpdatedDate', label: 'Updated Time', type: 'datetime', width: 180, disableFilter: true }
        ]
    };

    const [filters, setFilters] = useState({ fromDate: today, toDate: today });
    const [query, setQuery] = useState({ fromDate: today, toDate: today });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [lastEntry, setLastEntry] = useState(null);

    useEffect(() => {
        fetchUserRole();
        fetchLastEntry();
    }, []);

    useEffect(() => {
        fetchData();
    }, [query]);

    const fetchLastEntry = async () => {
        try {
            const res = await fetch('/api/transaction/bds-entry/latest');
            const json = await res.json();
            if (json.success) setLastEntry(json.data);
        } catch (err) { }
    };

    const fetchUserRole = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const json = await res.json();
            if (json.user) setUserRole(json.user.role);
        } catch (err) { }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/transaction/bds-entry/list', {
                method: 'POST',
                body: JSON.stringify({
                    fromDate: query.fromDate,
                    toDate: query.toDate
                })
            });
            const result = await res.json();
            if (result.success) setData(result.data);
            else setData([]);
        } catch (err) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [query]);

    const handleShow = () => setQuery({ ...filters });
    const handleReset = () => {
        setFilters({ fromDate: today, toDate: today });
        setQuery({ fromDate: today, toDate: today });
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`/api/transaction/bds-entry/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Deleted Successfully");
                fetchData();
            }
        } catch (err) { toast.error("Delete Failed"); }
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
        router.push(`/dashboard/transaction/bds-entry/${row.SlNo}`);
    };
    // Shortcut for Add New
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F3' || (e.ctrlKey && e.key === 'a')) {
                e.preventDefault();
                router.push('/dashboard/transaction/bds-entry/create');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title} style={{ fontSize: '20px' }}>BDS Entry</h1>

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
                            Last data entered on -&gt; Date: {new Date(lastEntry.Date).toLocaleDateString('en-GB')} | SME: {lastEntry.SMECategoryName} | Entered by : {lastEntry.CreatedByName || lastEntry.CreatedBy || 'Admin'}
                        </span>
                    )}
                    <button
                        onClick={() => router.push('/dashboard/transaction/bds-entry/bulk-upload')}
                        className={styles.addNew}
                        style={{ backgroundColor: '#10b981' }}
                    >
                        <Upload size={16} /> Bulk Upload
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/transaction/bds-entry/create')}
                        className={styles.addNew}
                    >
                        <Plus size={16} /> <span style={{ textDecoration: 'underline' }}>A</span>dd New (F3)
                    </button>
                    <button
                        onClick={fetchData}
                        className={styles.refreshBtn}
                        title="Reload"
                    >
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
                isLoading={loading}
                onDelete={handleDelete}
                onEdit={handleEdit}
                userRole={userRole}
            />
        </div>
    );
}
