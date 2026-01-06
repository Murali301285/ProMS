'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import TransactionTable from '@/components/TransactionTable';
import css from './BlastingForm.module.css';

export default function BDSEntryForm({ mode = 'create', initialData = null }) {
    const router = useRouter();
    const today = new Date().toISOString().split('T')[0];

    const config = {
        table: '[Trans].[TblBDSEntry]',
        idField: 'SlNo',
        apiPath: '/api/transaction/bds-entry',
        columns: [
            { accessor: 'SlNo', label: '#', width: 50, frozen: true },
            { accessor: 'Date', label: 'Date', type: 'date', width: 100, frozen: true },
            { accessor: 'SMECategoryName', label: 'SME Category', width: 200 },
            { accessor: 'VehicleNo', label: 'Vehicle No', width: 120 },
            { accessor: 'Weighment', label: 'Weighment', type: 'number', width: 100 },
            { accessor: 'CounterReading', label: 'Counter', type: 'number', width: 100 },
            { accessor: 'LoadingSheet', label: 'Loading Sheet', type: 'number', width: 100 },
            { accessor: 'StandardDeduction', label: 'Std Ded', type: 'number', width: 100 },
            { accessor: 'AcceptedQuantity', label: 'Accepted Qty', type: 'number', width: 100 },
            { accessor: 'ChallanNo', label: 'Challan No', width: 120 },
            { accessor: 'Remarks', label: 'Remarks', width: 150 },
            { accessor: 'CreatedByName', label: 'Created By', width: 120 },
            { accessor: 'CreatedDate', label: 'Created Time', type: 'datetime', width: 150, disableFilter: true },
        ]
    };

    const [formData, setFormData] = useState({
        Date: today,
        SMECategoryId: '',
        VehicleNo: '',
        Weighment: '',
        CounterReading: '',
        LoadingSheet: '',
        StandardDeduction: '',
        AcceptedQuantity: '',
        ChallanNo: '',
        Remarks: ''
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [user, setUser] = useState(null); // Added user state
    const [userRole, setUserRole] = useState('User'); // Added userRole state fallback

    useEffect(() => {
        // Fetch User
        fetch('/api/auth/me').then(r => r.json()).then(res => {
            if (res.user) {
                setUser(res.user);
                setUserRole(res.user.role || 'User');
            }
        }).catch(err => console.error(err));
    }, []);
    const [recentData, setRecentData] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    // userRole removed (duplicate)
    const [smeCategories, setSmeCategories] = useState([]);
    const [lastEntry, setLastEntry] = useState(null);

    const formRef = useRef(null);

    useEffect(() => {
        // Redundant fetch '/api/auth/me' removed

        fetch('/api/master/sme-category').then(r => r.json()).then(res => {
            if (res.data) setSmeCategories(res.data); // data has {id, name}
        });


        fetchLastEntry();

        if (mode === 'edit' && initialData) {
            setFormData({
                ...initialData,
                Date: initialData.Date ? new Date(initialData.Date).toISOString().split('T')[0] : today,
                SMECategoryId: initialData.SMECategoryId ? String(initialData.SMECategoryId) : '',
                VehicleNo: initialData.VehicleNo || '',
                Weighment: initialData.Weighment,
                CounterReading: initialData.CounterReading,
                LoadingSheet: initialData.LoadingSheet,
                StandardDeduction: initialData.StandardDeduction,
                AcceptedQuantity: initialData.AcceptedQuantity,
                ChallanNo: initialData.ChallanNo || '',
                Remarks: initialData.Remarks || ''
            });
        }
    }, [mode, initialData]);

    // Smart Context Effect
    useEffect(() => {
        if (mode === 'create' && lastEntry) {
            setFormData(prev => ({ // Use prev to keep untouched fields if any, though we are resetting most
                ...prev,
                Date: lastEntry.Date ? new Date(lastEntry.Date).toISOString().split('T')[0] : today,
                SMECategoryId: lastEntry.SMECategoryId ? String(lastEntry.SMECategoryId) : '',
                VehicleNo: '',
                Weighment: '',
                CounterReading: '',
                LoadingSheet: '',
                StandardDeduction: '',
                AcceptedQuantity: '',
                ChallanNo: '',
                Remarks: ''
            }));
            // Auto-focus Vehicle No if context found
            setTimeout(() => {
                const vehicleInput = formRef.current?.querySelector('input[name="VehicleNo"]');
                if (vehicleInput) vehicleInput.focus();
            }, 100);
        }
    }, [lastEntry, mode]);

    useEffect(() => { if (formData.Date) fetchRecentData(); }, [formData.Date]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                handleSave(mode === 'edit');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [formData, mode]);

    const fetchLastEntry = async () => {
        try {
            const res = await fetch('/api/transaction/bds-entry/latest');
            const json = await res.json();
            if (json.success) setLastEntry(json.data);
        } catch (e) { }
    };

    const fetchRecentData = async () => {
        setLoadingRecent(true);
        try {
            const res = await fetch('/api/transaction/bds-entry/list', {
                method: 'POST',
                body: JSON.stringify({ fromDate: formData.Date, toDate: formData.Date })
            });
            const result = await res.json();
            if (result.success) setRecentData(result.data);
        } catch (e) { } finally { setLoadingRecent(false); }
    };

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
        setFormData({
            Date: today,
            SMECategoryId: '',
            VehicleNo: '',
            Weighment: '',
            CounterReading: '',
            LoadingSheet: '',
            StandardDeduction: '',
            AcceptedQuantity: '',
            ChallanNo: '',
            Remarks: ''
        });
        setErrors({});
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.Date) newErrors.Date = 'Required';
        if (!formData.SMECategoryId) newErrors.SMECategoryId = 'Required';
        if (!formData.VehicleNo) newErrors.VehicleNo = 'Required';

        ['Weighment', 'CounterReading', 'LoadingSheet', 'StandardDeduction', 'AcceptedQuantity'].forEach(field => {
            if (formData[field] === '' || formData[field] === null) newErrors[field] = 'Required';
        });

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
                ? `/api/transaction/bds-entry/${initialData.SlNo}`
                : '/api/transaction/bds-entry/create';
            const method = isUpdate ? 'PUT' : 'POST';

            const res = await fetch(url, { method, body: JSON.stringify(formData) });
            const result = await res.json();

            if (result.success) {
                toast.success(result.message);
                if (isUpdate) {
                    router.push('/dashboard/transaction/bds-entry');
                    router.refresh();
                } else {
                    handleReset();
                    fetchRecentData();
                    fetchLastEntry();
                }
            } else {
                toast.error(result.message);
            }
        } catch (err) { toast.error("Operation Failed"); } finally { setLoading(false); }
    };

    // Actions
    const handleEditRecent = (row) => router.push(`/dashboard/transaction/bds-entry/${row.SlNo}`);
    const handleDeleteRecent = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`/api/transaction/bds-entry/${id}`, { method: 'DELETE' });
            if (res.ok) { toast.success("Deleted"); fetchRecentData(); }
        } catch (e) { toast.error("Delete failed"); }
    };

    const handleEnterKey = (e, nextField) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextInput = document.querySelector(`[name="${nextField}"]`);
            if (nextInput) {
                nextInput.focus();
            } else if (nextField === 'PartyId') {
                // Approximate selector for SearchableSelect input if possible, or just focus container
                // SearchableSelect usually has an input inside.
                const selectContainer = document.querySelector('.searchable-select-input input');
                if (selectContainer) selectContainer.focus();
            }
        }
    };

    // Custom Enter key mapping
    const handleKeyDown = (e, fieldName) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const order = [
                'Date', 'SMECategoryId', 'VehicleNo',
                'Weighment', 'CounterReading', 'LoadingSheet', 'StandardDeduction', 'AcceptedQuantity',
                'ChallanNo', 'Remarks'
            ];
            const currentIndex = order.indexOf(fieldName);
            if (currentIndex !== -1 && currentIndex < order.length - 1) {
                const nextField = order[currentIndex + 1];

                // Special handling for SearchableSelect component which might not have standard name attr on input
                if (nextField === 'SMECategoryId') {
                    // Try to find the first input inside the select container's expected area
                    // Ideally SearchableSelect should expose a ref or ID, but we try generic DOM traversal
                    const inputs = formRef.current.querySelectorAll('input');
                    // 'Date' is 0, SME input is likely index 1 (depends on rendering)
                    if (inputs[1]) inputs[1].focus();
                } else {
                    const nextInput = formRef.current.querySelector(`[name="${nextField}"]`);
                    if (nextInput) nextInput.focus();
                }
            } else if (fieldName === 'Remarks') {
                // On Remarks Enter -> maybe save? User didn't specify, but often F2 is save.
                // We leave it as is or focus Save button.
            }
        }
    };

    return (
        <div className={css.container}>
            <div className={css.header}>
                <button onClick={() => router.push('/dashboard/transaction/bds-entry')} className={css.backBtn}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center' }}>
                    <h1 className={css.headerTitle} style={{ fontSize: '15px' }}>{mode === 'edit' ? 'Update' : 'Create'} BDS Entry</h1>

                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleReset} className={css.backBtn} title="(F5) Reset"><RotateCcw size={18} /></button>
                    <button onClick={() => handleSave(mode === 'edit')} disabled={loading} className={css.saveBtn} title="(F2) Save Record">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {mode === 'edit' ? 'Update (F2)' : 'Save (F2)'}
                    </button>
                </div>
            </div>

            <div className={css.card} ref={formRef}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '15px' }}>

                    {/* --- Row 1 --- */}

                    {/* Date: R1 C1 */}
                    <div className={css.group} style={{ gridColumn: '1 / span 1' }}>
                        <label className={css.label}>Date <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="date"
                            name="Date"
                            value={formData.Date}
                            onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'Date')}
                            className={css.input}
                            autoFocus
                        />
                    </div>

                    {/* SME Category: R1 C2-C3 (Span 2) */}
                    <div className={css.group} style={{ gridColumn: '2 / span 2' }}>
                        <label className={css.label}>SME Category <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            options={smeCategories}
                            value={formData.SMECategoryId}
                            onChange={(e) => handleSelectChange('SMECategoryId', e.target.value)}
                            placeholder="Select SME Category"
                            error={errors.SMECategoryId}
                            className={css.input}
                            name="SMECategoryId"
                            onKeyDown={(e) => handleKeyDown(e, 'SMECategoryId')}
                        />
                    </div>

                    {/* Vehicle No: R1 C4 */}
                    <div className={css.group} style={{ gridColumn: '4 / span 1' }}>
                        <label className={css.label}>Vehicle No <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text"
                            name="VehicleNo"
                            value={formData.VehicleNo}
                            onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'VehicleNo')}
                            className={css.input}
                            style={errors.VehicleNo ? { borderColor: 'red' } : {}}
                            placeholder="Enter Vehicle No"
                        />
                    </div>

                    {/* --- Row 2 --- */}

                    {/* Weighment: R2 C1 */}
                    <div className={css.group} style={{ gridColumn: '1 / span 1' }}>
                        <label className={css.label}>Weighment (Kg) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number" name="Weighment"
                            value={formData.Weighment} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'Weighment')}
                            className={css.input} step="0.001"
                            style={{ borderColor: errors.Weighment ? 'red' : '' }}
                        />
                    </div>

                    {/* Counter Reading: R2 C2 */}
                    <div className={css.group} style={{ gridColumn: '2 / span 1' }}>
                        <label className={css.label}>Counter Reading (Kg) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number" name="CounterReading"
                            value={formData.CounterReading} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'CounterReading')}
                            className={css.input} step="0.001"
                            style={{ borderColor: errors.CounterReading ? 'red' : '' }}
                        />
                    </div>

                    {/* Loading Sheet: R2 C3 */}
                    <div className={css.group} style={{ gridColumn: '3 / span 1' }}>
                        <label className={css.label}>Loading Sheet (Kg) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number" name="LoadingSheet"
                            value={formData.LoadingSheet} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'LoadingSheet')}
                            className={css.input} step="0.001"
                            style={{ borderColor: errors.LoadingSheet ? 'red' : '' }}
                        />
                    </div>

                    {/* --- Row 3 --- */}

                    {/* Std Deduction: R3 C1 */}
                    <div className={css.group} style={{ gridColumn: '1 / span 1' }}>
                        <label className={css.label}>Std Deduction (Kg) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number" name="StandardDeduction"
                            value={formData.StandardDeduction} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'StandardDeduction')}
                            className={css.input} step="0.001"
                            style={{ borderColor: errors.StandardDeduction ? 'red' : '' }}
                        />
                    </div>

                    {/* Accepted Qty: R3 C2 */}
                    <div className={css.group} style={{ gridColumn: '2 / span 1' }}>
                        <label className={css.label}>Accepted Qty (Kg) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number" name="AcceptedQuantity"
                            value={formData.AcceptedQuantity} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'AcceptedQuantity')}
                            className={css.input} step="0.001"
                            style={{ borderColor: errors.AcceptedQuantity ? 'red' : '' }}
                        />
                    </div>

                    {/* Challan No: R3 C3 */}
                    <div className={css.group} style={{ gridColumn: '3 / span 1' }}>
                        <label className={css.label}>Challan No</label>
                        <input
                            type="text" name="ChallanNo"
                            value={formData.ChallanNo} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'ChallanNo')}
                            className={css.input} placeholder="Enter Challan No"
                        />
                    </div>

                    {/* --- Row 4 --- */}

                    {/* Remarks: R4 C1-C6 (Span 6) */}
                    <div className={css.group} style={{ gridColumn: '1 / span 6' }}>
                        <label className={css.label}>Remarks</label>
                        <input
                            type="text" name="Remarks"
                            value={formData.Remarks} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'Remarks')}
                            className={css.input}
                        />
                    </div>

                </div>
            </div>

            <div className={css.dataTableSection}>
                <div style={{ height: '400px', width: '100%' }}>
                    <TransactionTable
                        title="Recent Transactions"
                        config={config} data={recentData} isLoading={loadingRecent} onEdit={handleEditRecent} onDelete={handleDeleteRecent} userRole={userRole} />
                </div>
            </div>
        </div>
    );
}
