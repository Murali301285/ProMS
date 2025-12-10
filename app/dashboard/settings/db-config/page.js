
'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Save, Database } from 'lucide-react';
import styles from '../Settings.module.css';
import DataTable from '@/components/DataTable';

export default function DbConfigPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        DbName: '',
        DisplayName: '',
        Environment: 'Test',
        Remarks: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/crud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'read', table: 'TblDbConfig' })
            });
            const result = await res.json();
            setData(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error(error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        const action = editingId ? 'update' : 'create';
        const body = {
            table: 'TblDbConfig',
            action,
            data: formData,
            id: editingId
        };

        await fetch('/api/settings/crud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        setEditingId(null);
        setFormData({ DbName: '', DisplayName: '', Environment: 'Test', Remarks: '' });
        fetchData();
    };

    const handleEdit = (item) => {
        setEditingId(item.SlNo);
        setFormData({
            DbName: item.DbName,
            DisplayName: item.DisplayName,
            Environment: item.Environment,
            Remarks: item.Remarks || ''
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        await fetch('/api/settings/crud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'TblDbConfig', action: 'delete', id })
        });
        fetchData();
    };

    const columns = [
        { header: 'DB Name', accessor: 'DbName', sortable: true },
        { header: 'Display Name', accessor: 'DisplayName', sortable: true },
        {
            header: 'Environment',
            accessor: 'Environment',
            sortable: true,
            render: (row) => (
                <span className={`${styles.badge} ${row.Environment === 'Live' ? styles.badgeActive : styles.badgeTest}`}>
                    {row.Environment}
                </span>
            )
        },
        { header: 'Remarks', accessor: 'Remarks', sortable: true },
        {
            header: 'Actions',
            accessor: 'actions',
            sortable: false,
            render: (row) => (
                <div className={styles.tdActions}>
                    <button onClick={() => handleEdit(row)} className={styles.actionBtn}><Edit size={16} /></button>
                    <button onClick={() => handleDelete(row.SlNo)} className={`${styles.actionBtn} ${styles.delete}`}><Trash2 size={16} /></button>
                </div>
            )
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <Database size={24} /> DB Configuration
                </h1>
            </div>

            {/* Form */}
            <div className={styles.formCard}>
                <h2 className={styles.cardTitle}>{editingId ? 'Edit Configuration' : 'Add New Configuration'}</h2>
                <div className={styles.formGrid}>
                    <input name="DbName" placeholder="Database Name (e.g. ProdMS_Test)" value={formData.DbName} onChange={handleChange} className={styles.input} />
                    <input name="DisplayName" placeholder="Display Name" value={formData.DisplayName} onChange={handleChange} className={styles.input} />
                    <select name="Environment" value={formData.Environment} onChange={handleChange} className={styles.select}>
                        <option value="Live">Live</option>
                        <option value="Test">Test</option>
                        <option value="Old">Old</option>
                    </select>
                    <input name="Remarks" placeholder="Remarks" value={formData.Remarks} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.buttonGroup}>
                    {editingId && <button onClick={() => { setEditingId(null); setFormData({ DbName: '', DisplayName: '', Environment: 'Test', Remarks: '' }); }} className={styles.btnSecondary}>Cancel</button>}
                    <button onClick={handleSave} className={styles.btnPrimary}>
                        <Save size={16} /> Save
                    </button>
                </div>
            </div>

            {/* List */}
            <div className={styles.tableContainer}>
                <DataTable
                    columns={columns}
                    data={data}
                    fileName="DbConfig"
                    defaultSort={{ key: 'DbName', direction: 'asc' }}
                />
            </div>
        </div>
    );
}
