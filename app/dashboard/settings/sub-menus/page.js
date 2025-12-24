
'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../Settings.module.css';
import DataTable from '@/components/DataTable';

export default function SubMenusPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        PageName: '',
        PagePath: '',
        IsActive: true
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/crud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'read', table: 'TblPage' })
            });
            const result = await res.json();
            setData(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load sub-menus");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSave = async () => {
        const action = editingId ? 'update' : 'create';
        const body = {
            table: 'TblPage',
            action,
            data: formData,
            id: editingId
        };

        const res = await fetch('/api/settings/crud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result = await res.json();

        if (!res.ok) {
            toast.error(result.error || result.message || "Failed to save page");
            return;
        }

        if (editingId) toast.success("Page updated");
        else toast.success("Page created");

        window.dispatchEvent(new Event('menu-updated')); // Auto-refresh sidebar

        setEditingId(null);
        setFormData({ PageName: '', PagePath: '', IsActive: true });
        fetchData();
    };

    const handleEdit = (item) => {
        setEditingId(item.SlNo);
        setFormData({
            PageName: item.PageName,
            PagePath: item.PagePath,
            IsActive: item.IsActive
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        await fetch('/api/settings/crud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'TblPage', action: 'delete', id })
        });
        toast.success("Page deleted");
        window.dispatchEvent(new Event('menu-updated')); // Auto-refresh sidebar
        fetchData();
    };

    const columns = [
        { header: 'Page Name', accessor: 'PageName', sortable: true, render: row => <b>{row.PageName}</b> },
        { header: 'Path', accessor: 'PagePath', sortable: true, render: row => <span style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>{row.PagePath}</span> },
        {
            header: 'Status',
            accessor: 'IsActive',
            sortable: true,
            render: (row) => (
                <span className={`${styles.badge} ${row.IsActive ? styles.badgeActive : styles.badgeInactive}`}>
                    {row.IsActive ? 'Active' : 'Inactive'}
                </span>
            )
        },
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
                    <FileText size={24} /> Sub Menus (Pages)
                </h1>
            </div>

            {/* Form */}
            <div className={styles.formCard}>
                <h2 className={styles.cardTitle}>{editingId ? 'Edit Page' : 'Add New Page'}</h2>
                <div className={styles.formGrid}>
                    <input name="PageName" placeholder="Page / Sub Menu Name" value={formData.PageName} onChange={handleChange} className={styles.input} />
                    <input name="PagePath" placeholder="Path (e.g. /dashboard/master/new)" value={formData.PagePath} onChange={handleChange} className={styles.input} />
                    <label className={styles.checkboxLabel}>
                        <input type="checkbox" name="IsActive" checked={formData.IsActive} onChange={handleChange} />
                        Is Active
                    </label>
                </div>
                <div className={styles.buttonGroup}>
                    {editingId && <button onClick={() => { setEditingId(null); setFormData({ PageName: '', PagePath: '', IsActive: true }); }} className={styles.btnSecondary}>Cancel</button>}
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
                    fileName="SubMenus"
                    defaultSort={{ key: 'PageName', direction: 'asc' }}
                />
            </div>
        </div>
    );
}
