
'use client';

import { useState, useEffect } from 'react';
import { Shield, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../Settings.module.css';
import DataTable from '@/components/DataTable';

export default function AuditLogsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Default dates to current date
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        fromDate: today,
        toDate: today
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const payload = { action: 'read', table: 'TblAuditLog' };
            if (filters.fromDate && filters.toDate) {
                payload.filters = filters;
            }

            const res = await fetch('/api/settings/crud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            setData(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load audit logs");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = () => {
        fetchData();
    };

    const columns = [
        { header: 'Sl No', accessor: 'SlNo', sortable: true, width: '80px' },
        {
            header: 'Date',
            accessor: 'ActionDate',
            sortable: true,
            render: (row) => new Date(row.ActionDate).toLocaleString('en-GB') // dd/mm/yyyy hh:mm:ss generic
        },
        {
            header: 'Action',
            accessor: 'Action',
            sortable: true,
            render: (row) => (
                <span className={`${styles.badge} ${row.Action === 'INSERT' ? styles.badgeActive :
                    row.Action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        styles.badgeInactive
                    }`}
                    style={row.Action === 'UPDATE' ? { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' } : {}}
                >
                    {row.Action}
                </span>
            )
        },
        { header: 'Table', accessor: 'TableName', sortable: true },
        {
            header: 'Record ID',
            accessor: 'RecordId',
            render: (row) => <span style={{ fontFamily: 'monospace', background: 'var(--secondary)', padding: '2px 4px', borderRadius: '4px' }}>{row.RecordId || '-'}</span>
        },
        { header: 'User', accessor: 'ActionBy', sortable: true },
        {
            header: 'Changes',
            accessor: 'NewValue',
            width: '40%',
            render: (row) => (
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all', maxHeight: '100px', overflowY: 'auto' }}>
                    {row.NewValue || '-'}
                </div>
            )
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <Shield size={24} /> Audit Logs
                </h1>
            </div>

            {/* Filter Section */}
            <div className={styles.formCard}>
                <div className={styles.formGrid}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem' }}>From Date</label>
                        <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} className={styles.input} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem' }}>To Date</label>
                        <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} className={styles.input} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button onClick={handleSearch} className={styles.btnPrimary} disabled={loading}>
                            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                            Show Details
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className={styles.tableContainer}>
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    fileName="AuditLogs"
                    defaultSort={{ key: 'ActionDate', direction: 'desc' }}
                />
            </div>
        </div>
    );
}
