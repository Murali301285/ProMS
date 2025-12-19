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
            { accessor: 'PartyName', label: 'Party', width: 150 },
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
        PartyId: '',
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
    const [recentData, setRecentData] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [parties, setParties] = useState([]);
    const [lastEntry, setLastEntry] = useState(null);

    const formRef = useRef(null);

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.json()).then(res => { if (res.user) setUserRole(res.user.role); });

        fetch('/api/master/party').then(r => r.json()).then(res => {
            if (res.data) setParties(res.data.map(p => ({ id: String(p.SlNo), name: p.PartyName })));
        });

        fetchLastEntry();

        if (mode === 'edit' && initialData) {
            setFormData({
                ...initialData,
                Date: initialData.Date ? new Date(initialData.Date).toISOString().split('T')[0] : today,
                PartyId: initialData.PartyId ? String(initialData.PartyId) : '',
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
            PartyId: '',
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
        if (!formData.PartyId) newErrors.PartyId = 'Required';
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
                'Date', 'PartyId', 'VehicleNo',
                'Weighment', 'CounterReading', 'LoadingSheet', 'StandardDeduction', 'AcceptedQuantity',
                'ChallanNo', 'Remarks'
            ];
            const currentIndex = order.indexOf(fieldName);
            if (currentIndex !== -1 && currentIndex < order.length - 1) {
                const nextField = order[currentIndex + 1];

                // Special handling for SearchableSelect component which might not have standard name attr on input
                if (nextField === 'PartyId') {
                    // Try to find the first input inside the select container's expected area
                    // Ideally SearchableSelect should expose a ref or ID, but we try generic DOM traversal
                    const inputs = formRef.current.querySelectorAll('input');
                    // 'Date' is 0, Party input is likely index 1 (depends on rendering)
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
                <button onClick={() => router.back()} className={css.backBtn}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center' }}>
                    <h1 className={css.headerTitle} style={{ fontSize: '15px' }}>{mode === 'edit' ? 'Update' : 'Create'} BDS Entry</h1>
                    {mode === 'create' && lastEntry && (
                        <div className="text-xs text-gray-500 mt-1" style={{ fontSize: '11px' }}>
                            Last data: <span className="font-semibold">{new Date(lastEntry.Date).toLocaleDateString('en-GB')}</span> | Party: <span className="font-semibold text-blue-600">{lastEntry.PartyName}</span> | By: <span className="font-semibold text-blue-600">{lastEntry.CreatedByName || lastEntry.CreatedBy || 'Admin'}</span>
                        </div>
                    )}
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
                <div className={css.row} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <div className={css.group} style={{ width: '50%' }}>
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
                    <div className={css.group} style={{ width: '50%' }}>
                        <label className={css.label}>Party <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            options={parties}
                            value={formData.PartyId}
                            onChange={(e) => handleSelectChange('PartyId', e.target.value)}
                            placeholder="Select Party"
                            error={errors.PartyId}
                            className={css.input}
                            name="PartyId" // Ensure this is passed if supported, else SearchableSelect needs update
                            onKeyDown={(e) => handleKeyDown(e, 'PartyId')} // Needs implementation in SearchableSelect usually
                        />
                    </div>
                    <div className={css.group} style={{ width: '50%' }}>
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
                </div>

                <div className={css.divider}></div>

                {/*
                    Numeric Row + Challan
                    User wants inputs to be 50% width.
                    We will keep grid but wrapper inputs in div or use inline width.
                    Order: Weighment, Counter, Loading, StdDed, Accepted, Challan
                */}
                <div className={css.row} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <div className={css.group}>
                        <label className={css.label}>Weighment (Kg) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number" name="Weighment"
                            value={formData.Weighment} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'Weighment')}
                            className={css.input} step="0.001"
                            style={{ width: '50%', borderColor: errors.Weighment ? 'red' : '' }}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Counter Reading (Kg) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number" name="CounterReading"
                            value={formData.CounterReading} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'CounterReading')}
                            className={css.input} step="0.001"
                            style={{ width: '50%', borderColor: errors.CounterReading ? 'red' : '' }}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Loading Sheet (Kg) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number" name="LoadingSheet"
                            value={formData.LoadingSheet} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'LoadingSheet')}
                            className={css.input} step="0.001"
                            style={{ width: '50%', borderColor: errors.LoadingSheet ? 'red' : '' }}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Std Deduction (Kg) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number" name="StandardDeduction"
                            value={formData.StandardDeduction} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'StandardDeduction')}
                            className={css.input} step="0.001"
                            style={{ width: '50%', borderColor: errors.StandardDeduction ? 'red' : '' }}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Accepted Qty (Kg) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number" name="AcceptedQuantity"
                            value={formData.AcceptedQuantity} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'AcceptedQuantity')}
                            className={css.input} step="0.001"
                            style={{ width: '50%', borderColor: errors.AcceptedQuantity ? 'red' : '' }}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Challan No</label>
                        <input
                            type="text" name="ChallanNo"
                            value={formData.ChallanNo} onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, 'ChallanNo')}
                            className={css.input} placeholder="Enter Challan No"
                            style={{ width: '50%' }}
                        />
                    </div>
                </div>

                <div className={css.row}>
                    <div className={css.group} style={{ width: '100%' }}>
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
                <div className={css.tableTitle}>Recent Entries</div>
                <div style={{ height: '400px', width: '100%' }}>
                    <TransactionTable config={config} data={recentData} isLoading={loadingRecent} onEdit={handleEditRecent} onDelete={handleDeleteRecent} userRole={userRole} />
                </div>
            </div>
        </div>
    );
}
