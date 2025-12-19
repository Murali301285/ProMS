'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import TransactionTable from '@/components/TransactionTable';
import css from './BlastingForm.module.css'; // Reusing Blasting styles as requested

export default function DispatchEntryForm({ mode = 'create', initialData = null }) {
    const router = useRouter();
    const today = new Date().toISOString().split('T')[0];

    // Local Config for Recent Transactions
    const config = {
        table: '[Trans].[TblBDSEntry]',
        idField: 'SlNo',
        apiPath: '/api/transaction/dispatch-entry',
        columns: [
            { accessor: 'SlNo', label: '#', width: 50, frozen: true },
            { accessor: 'Date', label: 'Date', type: 'date', width: 120, frozen: true },
            { accessor: 'PartyName', label: 'Party', width: 150 },
            { accessor: 'VehicleNo', label: 'Vehicle No', width: 120 },
            { accessor: 'Weighment', label: 'Weighment', type: 'number', width: 100 },
            { accessor: 'AcceptedQuantity', label: 'Accepted Qty', type: 'number', width: 100 },
            { accessor: 'CreatedByName', label: 'Created By', width: 150 },
            { accessor: 'CreatedDate', label: 'Created Time', type: 'datetime', width: 180, disableFilter: true },
        ]
    };

    // State
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

    // Initial Load
    useEffect(() => {
        fetchUser();
        fetchMasters();
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

    // Smart Load Recent
    useEffect(() => {
        if (formData.Date) fetchRecentData();
    }, [formData.Date]);

    // Key Listener
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

    const fetchUser = async () => {
        const res = await fetch('/api/auth/me').then(r => r.json());
        if (res.user) setUserRole(res.user.role);
    };

    const fetchLastEntry = async () => {
        try {
            const res = await fetch('/api/transaction/dispatch-entry/latest');
            const json = await res.json();
            if (json.success) setLastEntry(json.data);
        } catch (err) { }
    };

    const fetchMasters = async () => {
        try {
            const res = await fetch('/api/master/party');
            const json = await res.json();
            if (json.data) {
                setParties(json.data.map(p => ({ id: String(p.SlNo), name: p.PartyName })));
            }
        } catch (err) { toast.error("Failed to load Party master"); }
    };

    const fetchRecentData = async () => {
        setLoadingRecent(true);
        try {
            // Reusing list API with date filter
            const res = await fetch('/api/transaction/dispatch-entry/list', {
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
                    handleReset();
                    fetchRecentData();
                    fetchLastEntry();
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
                <button onClick={() => router.back()} className={css.backBtn}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, marginLeft: '10px' }}>
                    <h1 className={css.headerTitle} style={{ fontSize: '15px', marginBottom: '0' }}>{mode === 'edit' ? 'Update' : 'Create'} Dispatch Entry</h1>
                    {lastEntry && (
                        <div className="text-xs text-gray-500 mt-1" style={{ fontSize: '11px' }}>
                            Last data entered on -&gt; Date: <span className="font-semibold">{new Date(lastEntry.Date).toLocaleDateString('en-GB')}</span> | Party: <span className="font-semibold text-blue-600">{lastEntry.PartyName}</span> | By : <span className="font-semibold text-blue-600">{lastEntry.CreatedByName || lastEntry.CreatedBy || 'Admin'}</span>
                        </div>
                    )}
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
                {/* Row 1 */}
                <div className={css.row} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                    <div className={css.group}>
                        <label className={css.label}>Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            name="Date"
                            value={formData.Date}
                            max={today}
                            onChange={handleChange}
                            className={css.input}
                            autoFocus
                        />
                        {errors.Date && <span className={css.errorText}>{errors.Date}</span>}
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Party <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={parties}
                            value={formData.PartyId}
                            onChange={(e) => handleSelectChange('PartyId', e.target.value)}
                            placeholder="Select Party"
                            error={errors.PartyId}
                            className={css.input}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Vehicle No <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="VehicleNo"
                            value={formData.VehicleNo}
                            onChange={handleChange}
                            className={css.input}
                            style={errors.VehicleNo ? { borderColor: 'red' } : {}}
                            placeholder="Enter Vehicle No"
                        />
                        {errors.VehicleNo && <span className={css.errorText}>{errors.VehicleNo}</span>}
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Challan No</label>
                        <input
                            type="text"
                            name="ChallanNo"
                            value={formData.ChallanNo}
                            onChange={handleChange}
                            className={css.input}
                            placeholder="Enter Challan No"
                        />
                    </div>
                </div>

                <div className={css.divider}></div>

                {/* Row 2 - Numeric Fields */}
                <div className={css.row} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
                    <div className={css.group}>
                        <label className={css.label}>Weighment (Kg) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="Weighment"
                            value={formData.Weighment}
                            onChange={handleChange}
                            className={css.input}
                            step="0.001"
                            style={errors.Weighment ? { borderColor: 'red' } : {}}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Counter Reading (Kg) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="CounterReading"
                            value={formData.CounterReading}
                            onChange={handleChange}
                            className={css.input}
                            step="0.001"
                            style={errors.CounterReading ? { borderColor: 'red' } : {}}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Loading Sheet (Kg) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="LoadingSheet"
                            value={formData.LoadingSheet}
                            onChange={handleChange}
                            className={css.input}
                            step="0.001"
                            style={errors.LoadingSheet ? { borderColor: 'red' } : {}}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Std Deduction (Kg) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="StandardDeduction"
                            value={formData.StandardDeduction}
                            onChange={handleChange}
                            className={css.input}
                            step="0.001"
                            style={errors.StandardDeduction ? { borderColor: 'red' } : {}}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Accepted Qty (Kg) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="AcceptedQuantity"
                            value={formData.AcceptedQuantity}
                            onChange={handleChange}
                            className={css.input}
                            step="0.001"
                            style={errors.AcceptedQuantity ? { borderColor: 'red' } : {}}
                        />
                    </div>
                </div>

                {/* Row 3 - Remarks */}
                <div className={css.row}>
                    <div className={css.group} style={{ width: '100%' }}>
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
                <div className={css.tableTitle}>Recent Entries (Today)</div>
                <div style={{ height: '400px', width: '100%' }}>
                    <TransactionTable
                        config={config}
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
