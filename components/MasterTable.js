'use client';

import { useRouter } from 'next/navigation';

import { useState, useEffect } from 'react';
import { Save, Plus, Edit, Trash2, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal/Modal';
import DynamicForm from '@/components/DynamicForm';
import BulkUploadModal from '@/components/BulkUploadModal';
import styles from '@/app/dashboard/settings/Settings.module.css';

export default function MasterTable({ config, title }) {
    const router = useRouter();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null); // For delete modal
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [lookups, setLookups] = useState({});
    const [activeFilters, setActiveFilters] = useState({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Toggle Filter Value
    const handleFilterChange = (accessor, value) => {
        setActiveFilters(prev => {
            if (value === 'CLEAR_ALL') {
                const newState = { ...prev };
                delete newState[accessor];
                return newState;
            }

            const current = prev[accessor] || [];
            const newValues = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];

            return {
                ...prev,
                [accessor]: newValues.length > 0 ? newValues : undefined // cleanup empty filters
            };
        });
    };

    // Apply Filters
    const filteredData = data.filter(row => {
        return Object.entries(activeFilters).every(([accessor, selectedValues]) => {
            if (!selectedValues || selectedValues.length === 0) return true;
            return selectedValues.includes(row[accessor]);
        });
    });

    // Fetch Lookups
    useEffect(() => {
        const fetchLookups = async () => {
            const newLookups = {};
            for (const col of config.columns) {
                if (typeof col === 'object' && col.type === 'select' && col.lookup) {
                    try {
                        const res = await fetch('/api/settings/ddl', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(col.lookup)
                        });
                        if (res.ok) {
                            newLookups[col.accessor] = await res.json();
                        }
                    } catch (err) {
                        console.error(`Failed to fetch lookup for ${col.accessor}`, err);
                    }
                }
            }
            setLookups(newLookups);
        };
        fetchLookups();
    }, [config]);

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
            let val = row[field];

            // Convert Date string to HH:mm for time inputs (Manual extraction to avoid timezone shift)
            if (typeof col === 'object' && col.type === 'time' && val) {
                try {
                    let timePart = val;
                    if (val.includes('T')) {
                        timePart = val.split('T')[1].substring(0, 5); // Extract HH:mm from ISO
                    } else if (val.length >= 5) {
                        timePart = val.substring(0, 5);
                    }
                    val = timePart;
                } catch (e) {
                    console.error("Time conversion error:", e);
                }
            }

            form[field] = val;
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
            sortable: true,
            width: '80px',
            render: (row, index) => index // Display passed serial number
        },
        ...config.columns.map(col => {
            const isObj = typeof col === 'object';
            const accessor = isObj ? col.accessor : col;
            const header = isObj && col.label ? col.label : accessor.replace(/([A-Z])/g, ' $1').trim();
            const isCheckbox = isObj && col.type === 'checkbox';

            return {
                header,
                accessor,
                // Enable sorting for all columns unless explicitly disabled
                // User requirement: "Add Sorting filter to all the columns... (like toggles, Isactive)"
                sortable: isObj && col.sortable !== undefined ? col.sortable : true,
                render: (row) => {
                    // Support displayField for API-joined columns
                    const useDisplayField = isObj && col.displayField;
                    const val = useDisplayField ? row[col.displayField] : row[accessor];

                    if (accessor.toLowerCase().includes('date') || accessor.toLowerCase().includes('time')) {
                        try {
                            // If it's a pure time field
                            if (accessor.toLowerCase().includes('time') && val) {
                                // Extract time part if it's a full ISO string
                                let timePart = val;
                                if (val.includes('T')) {
                                    timePart = val.split('T')[1].substring(0, 5); // HH:mm
                                } else if (val.length >= 5) {
                                    timePart = val.substring(0, 5);
                                }

                                // Convert 24h to 12h AM/PM manually to avoid timezone shifts
                                const [h, m] = timePart.split(':');
                                const hour = parseInt(h);
                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                const hour12 = hour % 12 || 12;
                                return `${hour12}:${m} ${ampm}`;
                            }

                            // For Dates, continue using Date object but formatted
                            const d = new Date(val);
                            if (!isNaN(d.getTime())) {
                                return d.toLocaleDateString('en-GB');
                            }
                        } catch (e) { }
                    }
                    if (isObj && col.type === 'file' && val) {
                        return <img src={val} alt="Preview" style={{ height: '30px', borderRadius: '4px' }} />;
                    }
                    // Only use client-side lookup if we didn't use a displayField (API-side join)
                    if (isObj && col.type === 'select' && lookups[accessor] && !useDisplayField) {
                        const found = lookups[accessor].find(item => item.id == val);
                        return found ? found.name : val;
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
                <div className={styles.headerActions}>
                    <button onClick={handleAdd} className={styles.btnPrimary} title="Add New Record">
                        <Plus size={16} /> Add New
                    </button>
                    {(config.bulkUpload || title === 'Drilling Remarks' || title === 'SME Category' || title === 'Equipment Group' || title === 'Equipment') && (
                        <button
                            onClick={() => {
                                if (title === 'Drilling Remarks') {
                                    router.push('/dashboard/master/drilling-remarks-bulk-upload');
                                } else if (title === 'Equipment Group') {
                                    router.push('/dashboard/master/equipment-group-bulk-upload');
                                } else if (title === 'Equipment') {
                                    router.push('/dashboard/master/equipment-bulk-upload');
                                } else if (title === 'Operator') {
                                    router.push('/dashboard/master/operator-bulk-upload');
                                } else if (title === 'Stoppage Reason') {
                                    router.push('/dashboard/master/stoppage-reason-bulk-upload');
                                } else if (title === 'Location') {
                                    router.push('/dashboard/master/location-bulk-upload');
                                } else {
                                    setIsBulkUploadOpen(true);
                                }
                            }}
                            className={styles.btnPrimary}
                            style={{ backgroundColor: '#10b981', animation: 'none' }}
                            title="Bulk Upload"
                        >
                            <Upload size={16} /> Bulk Upload
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Section Removed - Handled by DataTable */}

            <div className={styles.tableContainer}>
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    fileName={title}
                    defaultSort={{ key: config.idField || 'SlNo', direction: 'asc' }}
                />
            </div>

            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title={editId ? 'Edit Record' : 'Add New Record'}
            >
                <DynamicForm
                    columns={config.columns.map(col => {
                        if (typeof col === 'object' && col.type === 'select' && lookups[col.accessor]) {
                            return { ...col, lookupData: lookups[col.accessor] };
                        }
                        return col;
                    })}
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

            {/* Bulk Upload Modal */}
            <BulkUploadModal
                isOpen={isBulkUploadOpen}
                onClose={() => {
                    setIsBulkUploadOpen(false);
                }}
                onComplete={() => {
                    fetchData(); // Auto Refresh on completion
                }}
                config={{ ...config, title }}
            />
        </div >
    );
}

