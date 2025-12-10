
'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Save, Menu } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../Settings.module.css';
import DataTable from '@/components/DataTable';

export default function MenusPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        ModuleName: '',
        Icon: '',
        SortOrder: 0
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/crud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'read', table: 'TblModule' })
            });
            const result = await res.json();
            setData(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load menus");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleChange = (e) => {
        const val = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
        setFormData({ ...formData, [e.target.name]: val });
    };

    const handleSave = async () => {
        const action = editingId ? 'update' : 'create';
        const body = {
            table: 'TblModule',
            action,
            data: formData,
            id: editingId
        };

        await fetch('/api/settings/crud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (editingId) toast.success("Menu updated");
        else toast.success("Menu created");

        setEditingId(null);
        setFormData({ ModuleName: '', Icon: '', SortOrder: 0 });
        fetchData();
    };

    const handleEdit = (item) => {
        setEditingId(item.SlNo);
        setFormData({
            ModuleName: item.ModuleName,
            Icon: item.Icon || '',
            SortOrder: item.SortOrder || 0
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        await fetch('/api/settings/crud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'TblModule', action: 'delete', id })
        });
        fetchData();
    };

    const columns = [
        { header: 'Module Name', accessor: 'ModuleName', sortable: true, render: row => <b>{row.ModuleName}</b> },
        { header: 'Icon', accessor: 'Icon', sortable: true },
        { header: 'Sort Order', accessor: 'SortOrder', sortable: true },
        {
            header: 'Actions',
            accessor: 'actions',
            sortable: false,
            align: 'center',
            render: (row) => (
                <div className={styles.tdActions}>
                    <button onClick={() => handleEdit(row)} className={`${styles.actionBtn} ${styles.edit}`} title="Edit"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(row.SlNo)} className={`${styles.actionBtn} ${styles.delete}`} title="Delete"><Trash2 size={16} /></button>
                </div>
            )
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <Menu size={24} /> Menus (Modules)
                </h1>
            </div>

            {/* Form */}
            <div className={styles.formCard}>
                <h2 className={styles.cardTitle}>{editingId ? 'Edit Menu' : 'Add New Menu'}</h2>
                <div className={styles.formGrid}>
                    <input name="ModuleName" placeholder="Module Name" value={formData.ModuleName} onChange={handleChange} className={styles.input} />
                    <input name="Icon" placeholder="Icon Name (e.g. Home, Settings)" value={formData.Icon} onChange={handleChange} className={styles.input} />
                    <input type="number" name="SortOrder" placeholder="Sort Order" value={formData.SortOrder} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.buttonGroup}>
                    {editingId && <button onClick={() => { setEditingId(null); setFormData({ ModuleName: '', Icon: '', SortOrder: 0 }); }} className={styles.btnSecondary}>Cancel</button>}
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
                    loading={loading}
                    fileName="Modules"
                    defaultSort={{ key: 'SortOrder', direction: 'asc' }} // Default sort by Order
                />
            </div>
        </div>
    );
}
