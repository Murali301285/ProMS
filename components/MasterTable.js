'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal/Modal';
import DynamicForm from '@/components/DynamicForm';
import styles from '@/app/dashboard/settings/Settings.module.css';

export default function MasterTable({ config, title }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null); // For delete modal
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const table = config.table.replace('[Master].[', '').replace(']', '');
            console.log("Fetching data for:", table);
            const res = await fetch('/api/settings/crud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'read', table })
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

    useEffect(() => {
        fetchData();
        // Reset form when config changes
        setFormData({});
        setIsEditing(false);
    }, [config]);

    // Initialize Form Data
    const initForm = () => {
        const initial = {};
        config.columns.forEach(col => {
            const field = typeof col === 'string' ? col : col.accessor;
            initial[field] = '';
        });
        initial.IsActive = true;
        setErrors({});
        setFormData(initial);
    };

    const handleAdd = () => {
        initForm();
        setEditId(null);
        setIsEditing(true);
    };

    const handleEdit = (row) => {
        const form = {};
        config.columns.forEach(col => {
            const field = typeof col === 'string' ? col : col.accessor;
            form[field] = row[field];
        });
        form.IsActive = row.IsActive;
        setErrors({});
        setFormData(form);
        setEditId(row[config.idField]);
        setIsEditing(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            await fetch('/api/settings/crud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: config.table.replace('[Master].[', '').replace(']', ''),
                    action: 'delete',
                    id: deleteId
                })
            });
            fetchData();
            toast.success('Record deleted successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete record: ' + error.message);
        } finally {
            setDeleteId(null);
        }
    };

    const handleToggleColumn = async (id, field, currentValue) => {
        const newValue = !currentValue;

        // Optimistic UI Update
        const previousData = [...data];
        setData(data.map(item => item[config.idField] === id ? { ...item, [field]: newValue } : item));

        try {
            const res = await fetch('/api/settings/crud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: config.table.replace('[Master].[', '').replace(']', ''),
                    action: 'update',
                    id,
                    data: { [field]: newValue }
                })
            });
            toast.success('Status updated successfully');
        } catch (error) {
            console.error(error);
            setData(previousData); // Revert on error
            toast.error(`Failed to update ${field}: ` + error.message);
        }
    };

    const handleSave = async () => {
        // Validation
        const newErrors = {};
        let firstErrorInput = null;

        for (const col of config.columns) {
            if (typeof col === 'object' && col.required) {
                if (!formData[col.accessor] || formData[col.accessor].toString().trim() === '') {
                    newErrors[col.accessor] = true;
                    if (!firstErrorInput) {
                        firstErrorInput = col.accessor;
                    }
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            console.log("Validation Errors:", newErrors);
            setErrors(newErrors);
            // Optional: generic alert if desired, but UI shows red borders now
            return;
        }

        const action = editId ? 'update' : 'create';

        // Filter out audit columns from formData before sending to API
        const cleanData = {};
        Object.keys(formData).forEach(key => {
            if (!['CreatedBy', 'CreatedDate', 'UpdatedBy', 'UpdatedDate', 'IsDelete'].includes(key)) {
                cleanData[key] = formData[key];
            }
        });

        const body = {
            table: config.table.replace('[Master].[', '').replace(']', ''),
            action,
            data: cleanData,
            id: editId
        };

        console.log("🚀 FRONTEND: Sending to API:", JSON.stringify(body, null, 2));

        try {
            const res = await fetch('/api/settings/crud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsEditing(false);
                fetchData();
                toast.success(editId ? 'Record updated successfully' : 'Record created successfully');
            } else {
                const errData = await res.json();
                console.error("Backend Error:", errData);
                toast.error('Backend Error: ' + (errData.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            toast.error('Request Error: ' + err.message);
        }
    };

    // Global Shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (!isEditing) return;
            if (e.key === 'F2') {
                e.preventDefault();
                handleSave();
            }
            if (e.key === 'F5') {
                e.preventDefault();
                if (confirm('Are you sure you want to reset/cancel?')) {
                    setIsEditing(false);
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isEditing, formData]);

    // Prepare Columns for DataTable
    const columns = [
        {
            header: 'Sl No',
            accessor: 'SlNo',
            sortable: false,
            width: '80px',
            render: (row, index) => index
        },
        ...config.columns.map(col => {
            const isObj = typeof col === 'object';
            const accessor = isObj ? col.accessor : col;
            const header = isObj && col.label ? col.label : accessor.replace(/([A-Z])/g, ' $1').trim();

            return {
                header,
                accessor,
                sortable: true,
                render: (row) => {
                    const val = row[accessor];
                    if (accessor.toLowerCase().includes('date') || accessor.toLowerCase().includes('time')) {
                        try {
                            const d = new Date(val);
                            if (!isNaN(d.getTime())) {
                                if (accessor.toLowerCase().includes('time')) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                return d.toLocaleDateString('en-GB');
                            }
                        } catch (e) { }
                    }
                    if (isObj && col.type === 'file' && val) {
                        return <img src={val} alt="Preview" style={{ height: '30px', borderRadius: '4px' }} />;
                    }
                    if (isObj && col.type === 'checkbox') {
                        return (
                            <label className={styles.switch} onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={!!val}
                                    onChange={() => handleToggleColumn(row[config.idField], accessor, val)}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        );
                    }
                    return val;
                }
            };
        }),
        {
            header: 'Status',
            accessor: 'IsActive',
            render: (row) => (
                <label className={styles.switch}>
                    <input
                        type="checkbox"
                        checked={row.IsActive}
                        onChange={() => handleToggleColumn(row[config.idField], 'IsActive', row.IsActive)}
                    />
                    <span className={styles.slider}></span>
                </label>
            )
        },
        {
            header: 'Actions',
            accessor: 'actions',
            sortable: false,
            align: 'center',
            render: (row) => (
                <div className={styles.tdActions}>
                    <button onClick={() => handleEdit(row)} className={`${styles.actionBtn} ${styles.edit}`} title="Edit Record"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteClick(row[config.idField])} className={`${styles.actionBtn} ${styles.delete}`} title="Delete Record"><Trash2 size={16} /></button>
                </div>
            )
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{title} Master</h1>
                <button onClick={handleAdd} className={styles.btnPrimary} title="Add New Record">
                    <Plus size={16} /> Add New
                </button>
            </div>

            <div className={styles.tableContainer}>
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    fileName={title}
                    defaultSort={{ key: typeof config.columns[0] === 'object' ? config.columns[0].accessor : config.columns[0], direction: 'asc' }}
                />
            </div>

            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title={editId ? 'Edit Record' : 'Add New Record'}
            >
                <DynamicForm
                    columns={config.columns}
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                    setErrors={setErrors}
                />
                <div className={styles.buttonGroup} style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setIsEditing(false)} className={styles.btnSecondary} title="(F5)">Cancel</button>
                    <button onClick={handleSave} className={styles.btnPrimary} title="(F2)">
                        <Save size={16} /> {editId ? 'Update' : 'Save'}
                    </button>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Confirm Delete"
            >
                <div>
                    <p style={{ marginBottom: '20px' }}>Are you sure you want to delete this record? This action cannot be undone.</p>
                    <div className={styles.buttonGroup} style={{ justifyContent: 'flex-end' }}>
                        <button onClick={() => setDeleteId(null)} className={styles.btnSecondary}>Cancel</button>
                        <button onClick={confirmDelete} className={`${styles.btnPrimary}`} style={{ background: '#ef4444', color: 'white' }}>
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
