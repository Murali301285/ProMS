'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import TransactionTable from '@/components/TransactionTable';
import css from './BlastingForm.module.css'; // Reusing Blasting styles

export default function DispatchEntryForm({ mode = 'create', initialData = null }) {
    const router = useRouter();
    const today = new Date().toISOString().split('T')[0];

    // Local Config for Recent Transactions
    const config = {
        table: '[Trans].[TblDispatchEntry]',
        idField: 'SlNo',
        apiPath: '/api/transaction/dispatch-entry',
        columns: [
            { accessor: 'SlNo', label: '#', width: 50, frozen: true },
            { accessor: 'Date', label: 'Date', type: 'date', width: 120, frozen: true },
            { accessor: 'DispatchLocationName', label: 'Dispatch Location', width: 180 },
            { accessor: 'Trip', label: 'Trip', type: 'number', width: 80 },
            { accessor: 'TotalQty', label: 'Total Qty', type: 'number', width: 100 },
            { accessor: 'UnitName', label: 'UOM', width: 80 },
            { accessor: 'Remarks', label: 'Remarks', width: 200 },
            { accessor: 'CreatedByName', label: 'Created By', width: 150 },
            { accessor: 'CreatedDate', label: 'Created Time', type: 'datetime', width: 180, disableFilter: true },
        ]
    };

    // State
    const [formData, setFormData] = useState({
        Date: today,
        DispatchLocationId: '',
        Trip: '',
        TotalQty: '',
        UOMId: '',
        Remarks: ''
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [recentData, setRecentData] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [locations, setLocations] = useState([]);
    const [units, setUnits] = useState([]);
    const [displayUser, setDisplayUser] = useState('');

    const formRef = useRef(null);

    // Fetch User Info
    useEffect(() => {
        fetch('/api/auth/me').then(res => res.json()).then(json => {
            if (json.user) setUserRole(json.user.role);
        }).catch(console.error);

        // Display Name from LocalStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const parsed = JSON.parse(userStr);
                setDisplayUser(parsed.EmpName || parsed.UserName || parsed.username || parsed.name || 'User');
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    // Fetch Masters
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [locRes, unitRes] = await Promise.all([
                    fetch('/api/master/location').then(r => r.json()),
                    fetch('/api/master/unit').then(r => r.json())
                ]);

                const locData = Array.isArray(locRes) ? locRes : (locRes.data || []);
                const unitData = Array.isArray(unitRes) ? unitRes : (unitRes.data || []);

                if (locData.length > 0) {
                    setLocations(locData.map(l => ({ id: String(l.SlNo), name: l.LocationName })));
                }
                if (unitData.length > 0) {
                    setUnits(unitData.map(u => ({ id: String(u.SlNo), name: u.Name })));
                }
            } catch (err) {
                toast.error("Failed to load master data");
                console.error(err);
            }
        };

        fetchMasters();
    }, []);

    // Initial Load (Edit Mode Only)
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                ...initialData,
                Date: initialData.Date ? new Date(initialData.Date).toISOString().split('T')[0] : today,
                DispatchLocationId: initialData.DispatchLocationId ? String(initialData.DispatchLocationId) : '',
                Trip: initialData.Trip,
                TotalQty: initialData.TotalQty,
                UOMId: initialData.UOMId ? String(initialData.UOMId) : '',
                Remarks: initialData.Remarks || ''
            });
        }
        // 2. Create Mode: Fetch Last Context (Date Only)
        else if (mode === 'create') {
            const fetchContext = async () => {
                try {
                    const res = await fetch('/api/transaction/dispatch-entry/helper/last-context', {
                        method: 'POST',
                        body: JSON.stringify({}) // Absolute Last
                    });
                    const json = await res.json();
                    if (json.success && json.data && json.data.Date) {
                        setFormData(prev => ({
                            ...prev,
                            Date: new Date(json.data.Date).toISOString().split('T')[0]
                        }));
                    }
                } catch (e) { console.error(e); }
            };
            fetchContext();
        }
    }, [mode, initialData]);

    // Fetch Recent Data (triggered by Date change)
    const fetchRecentData = async () => {
        setLoadingRecent(true);
        try {
            const res = await fetch('/api/transaction/dispatch-entry/list', {
                method: 'POST',
                body: JSON.stringify({
                    fromDate: formData.Date,
                    toDate: formData.Date,
                    dispatchLocationId: formData.DispatchLocationId
                })
            });
            const result = await res.json();
            if (result.success) setRecentData(result.data);
        } catch (e) { } finally { setLoadingRecent(false); }
    };

    // Fetch Recent Data (Triggered by Date or Location change)
    useEffect(() => {
        if (formData.Date) {
            const timer = setTimeout(() => {
                fetchRecentData();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [formData.Date, formData.DispatchLocationId]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSelectChange = (name, val) => {
        setFormData(prev => ({ ...prev, [name]: val }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleReset = () => {
        setFormData(prev => ({
            Date: today,
            DispatchLocationId: prev.DispatchLocationId, // Keep Context
            Trip: '',
            TotalQty: '',
            UOMId: prev.UOMId, // Keep Context
            Remarks: ''
        }));
        setErrors({});
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.Date) newErrors.Date = 'Required';
        if (!formData.DispatchLocationId) newErrors.DispatchLocationId = 'Required';
        if (!formData.Trip) newErrors.Trip = 'Required';
        if (!formData.TotalQty) newErrors.TotalQty = 'Required';
        if (!formData.UOMId) newErrors.UOMId = 'Required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (isUpdate = false) => {
        if (!validate()) {
            toast.error("Please fill mandatory fields");
            return;
        }

        setLoading(true);
        try {
            const url = isUpdate
                ? `/api/transaction/dispatch-entry/${initialData.SlNo}`
                : '/api/transaction/dispatch-entry/create';
            const method = isUpdate ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                body: JSON.stringify(formData)
            });
            const result = await res.json();

            if (result.success) {
                toast.success(result.message);
                if (isUpdate) {
                    router.push('/dashboard/transaction/dispatch-entry');
                    router.refresh();
                } else {
                    // Reset but keep context
                    setFormData(prev => ({
                        ...prev,
                        Trip: '', TotalQty: '', Remarks: ''
                    }));
                    fetchRecentData();
                }
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            toast.error("Operation Failed");
        } finally {
            setLoading(false);
        }
    };

    // Actions for TransactionTable
    const handleEditRecent = (row) => {
        router.push(`/dashboard/transaction/dispatch-entry/${row.SlNo}`);
    };

    const handleDeleteRecent = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`/api/transaction/dispatch-entry/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Deleted");
                fetchRecentData();
            }
        } catch (e) { toast.error("Delete failed"); }
    };

    return (
        <div className={css.container}>
            <div className={css.header}>
                <button onClick={() => router.push('/dashboard/transaction/dispatch-entry')} className={css.backBtn}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, marginLeft: '10px' }}>
                    <h1 className={css.headerTitle} style={{ fontSize: '15px', marginBottom: '0' }}>{mode === 'edit' ? 'Update' : 'Create'} Dispatch Entry</h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleReset} className={css.backBtn} style={{ justifyContent: 'center', width: '36px' }} title="(F5) Reset">
                        <RotateCcw size={18} />
                    </button>
                    <button onClick={() => handleSave(mode === 'edit')} disabled={loading} className={css.saveBtn} title="(F2) Save Record">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {mode === 'edit' ? 'Update (F2)' : 'Save (F2)'}
                    </button>
                </div>
            </div>

            <div className={css.card} ref={formRef}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '15px' }}>

                    {/* Row 1 */}

                    {/* Date */}
                    <div className={css.group}>
                        <label className={css.label}>Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            name="Date"
                            value={formData.Date}
                            onChange={handleChange}
                            className={css.input}
                            autoFocus
                        />
                        {errors.Date && <span className={css.errorText}>{errors.Date}</span>}
                    </div>

                    {/* Dispatch Location */}
                    <div className={css.group} style={{ gridColumn: 'span 2' }}>
                        <label className={css.label}>Dispatch Location <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={locations}
                            value={formData.DispatchLocationId}
                            onChange={(e) => handleSelectChange('DispatchLocationId', e.target.value)}
                            placeholder="Select Location"
                            error={errors.DispatchLocationId}
                            className={css.input}
                        />
                    </div>

                    {/* UOM */}
                    <div className={css.group}>
                        <label className={css.label}>UOM <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={units}
                            value={formData.UOMId}
                            onChange={(e) => handleSelectChange('UOMId', e.target.value)}
                            placeholder="Select Unit"
                            error={errors.UOMId}
                            className={css.input}
                        />
                    </div>

                    {/* Row 2 */}

                    {/* Trip */}
                    <div className={css.group}>
                        <label className={css.label}>Trip <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="Trip"
                            value={formData.Trip}
                            onChange={handleChange}
                            className={css.input}
                            style={errors.Trip ? { borderColor: 'red' } : {}}
                        />
                        {errors.Trip && <span className={css.errorText}>{errors.Trip}</span>}
                    </div>

                    {/* Total Qty */}
                    <div className={css.group}>
                        <label className={css.label}>Total Qty <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="TotalQty"
                            value={formData.TotalQty}
                            onChange={handleChange}
                            className={css.input}
                            step="0.001"
                            style={errors.TotalQty ? { borderColor: 'red' } : {}}
                        />
                        {errors.TotalQty && <span className={css.errorText}>{errors.TotalQty}</span>}
                    </div>

                    {/* Remarks */}
                    <div className={css.group} style={{ gridColumn: 'span 3' }}>
                        <label className={css.label}>Remarks</label>
                        <input
                            type="text"
                            name="Remarks"
                            value={formData.Remarks}
                            onChange={handleChange}
                            className={css.input}
                        />
                    </div>

                </div>
            </div>

            <div className={css.dataTableSection}>
                <div style={{ height: '400px', width: '100%' }}>
                    <TransactionTable
                        config={config}
                        title={`Recent Transactions - By ${displayUser || 'User'}`}
                        data={recentData}
                        isLoading={loadingRecent}
                        onEdit={handleEditRecent}
                        onDelete={handleDeleteRecent}
                        userRole={userRole}
                    />
                </div>
            </div>
        </div>
    );
}
