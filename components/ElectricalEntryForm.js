'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, RotateCcw, ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import TransactionTable from '@/components/TransactionTable'; // Updated import
import css from './BlastingForm.module.css';

export default function ElectricalEntryForm({ mode = 'create', initialData = null }) {
    const router = useRouter();
    const today = new Date().toISOString().split('T')[0];

    // Local Config for Recent Transactions (Matching List Page)
    const config = {
        table: '[Trans].[TblElectricalEntry]',
        idField: 'SlNo',
        apiPath: '/api/transaction/electrical-entry',
        columns: [
            { accessor: 'SlNo', label: '#', width: 50, frozen: true },
            { accessor: 'Date', label: 'Date', type: 'date', width: 120, frozen: true },
            { accessor: 'ShiftName', label: 'Shift', width: 100, frozen: true },
            { accessor: 'RelayName', label: 'Relay', width: 150, frozen: true },
            { accessor: 'EquipmentName', label: 'Equipment/Plant', width: 180 },
            { accessor: 'OMR', label: 'OMR', type: 'number', width: 100 },
            { accessor: 'CMR', label: 'CMR', type: 'number', width: 100 },
            { accessor: 'TotalUnit', label: 'Total Unit', type: 'number', width: 120 },
            { accessor: 'UnitName', label: 'Unit', width: 100 },
            { accessor: 'Remarks', label: 'Remarks', width: 200 },
            { accessor: 'CreatedByName', label: 'Created By', width: 150 },
            { accessor: 'CreatedDate', label: 'Created Time', type: 'datetime', width: 180, disableFilter: true },
        ]
    };

    // State
    const [formData, setFormData] = useState({
        Date: today,
        ShiftId: '',
        RelayId: '',
        EquipmentId: '',
        OMR: '',
        CMR: '',
        TotalUnit: '',
        UnitId: '',
        Remarks: ''
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [recentData, setRecentData] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [userRole, setUserRole] = useState(null); // Added for TransactionTable

    const [masters, setMasters] = useState({
        shift: [],
        relay: [],
        equipment: [],
        unit: []
    });

    const formRef = useRef(null);

    // Fetch User Role
    useEffect(() => {
        fetch('/api/auth/me').then(res => res.json()).then(json => {
            if (json.user) setUserRole(json.user.role);
        }).catch(console.error);

        fetchLastEntry();
    }, []);

    const [lastEntry, setLastEntry] = useState(null);

    const fetchLastEntry = async () => {
        try {
            const res = await fetch('/api/transaction/electrical-entry/latest');
            const json = await res.json();
            if (json.success) setLastEntry(json.data);
        } catch (err) {
            console.error("Failed to fetch last entry", err);
        }
    };

    // Fetch Masters and Initial Data
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [shiftRes, relayRes, eqRes, unitRes] = await Promise.all([
                    fetch('/api/master/shift').then(r => r.json()),
                    fetch('/api/master/relay').then(r => r.json()),
                    fetch('/api/master/equipment').then(r => r.json()),
                    fetch('/api/master/unit').then(r => r.json())
                ]);

                const parseRes = (res) => Array.isArray(res) ? res : (res.data || []);
                const units = parseRes(unitRes);

                // Set Default Unit (KWH)
                const defaultUnit = units.find(u => u.Name.toUpperCase() === 'KWH');
                if (defaultUnit && mode === 'create') {
                    setFormData(prev => ({ ...prev, UnitId: defaultUnit.SlNo }));
                }

                setMasters({
                    shift: parseRes(shiftRes).map(s => ({ id: String(s.SlNo), name: s.ShiftName })),
                    relay: parseRes(relayRes).map(r => ({ id: String(r.SlNo), name: r.Name })),
                    equipment: parseRes(eqRes).map(e => ({ id: String(e.SlNo), name: e.EquipmentName })),
                    unit: units.map(u => ({ id: String(u.SlNo), name: u.Name }))
                });

                if (mode === 'edit' && initialData) {
                    setFormData({
                        ...initialData,
                        Date: initialData.Date ? new Date(initialData.Date).toISOString().split('T')[0] : today,
                        ShiftId: initialData.ShiftId ? String(initialData.ShiftId) : '',
                        RelayId: initialData.RelayId ? String(initialData.RelayId) : '',
                        EquipmentId: initialData.EquipmentId ? String(initialData.EquipmentId) : '',
                        UnitId: initialData.UnitId ? String(initialData.UnitId) : '',
                        OMR: initialData.OMR,
                        CMR: initialData.CMR,
                        TotalUnit: initialData.TotalUnit,
                        Remarks: initialData.Remarks || ''
                    });
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load master data");
            }
        };
        fetchMasters();
    }, [mode, initialData]);

    const fetchRecentData = useCallback(async () => {
        // Fetch recent data for both create and edit modes

        setLoadingRecent(true);
        try {
            const res = await fetch('/api/transaction/electrical-entry/recent', {
                method: 'POST',
                // Fetch recent for the selected date only? Or general recent?
                // Typically 'recent' implies "last few entered by user".
                // But user might want "recent for this date".
                // The API supports date filtering.
                body: JSON.stringify({ date: formData.Date })
            });
            const result = await res.json();
            if (result.success) {
                setRecentData(result.data);
            }
        } catch (err) {
            console.error("Recent Data Load Failed", err);
        } finally {
            setLoadingRecent(false);
        }
    }, [formData.Date, mode]);

    // Smart Load Effect
    useEffect(() => {
        fetchRecentData();
    }, [fetchRecentData]);

    // Calculations
    // Key Listener for F2 (Save)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                handleSave(mode === 'edit');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [formData, mode]); // Dependencies for closure data

    // Calculations
    useEffect(() => {
        const omr = parseFloat(formData.OMR);
        const cmr = parseFloat(formData.CMR);
        if (!isNaN(omr) && !isNaN(cmr)) {
            const total = (cmr - omr).toFixed(3);
            setFormData(prev => ({ ...prev, TotalUnit: total > 0 ? total : '0.000' }));
        }
    }, [formData.OMR, formData.CMR]);

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
            ...prev,
            ShiftId: '',
            RelayId: '',
            EquipmentId: '',
            OMR: '',
            CMR: '',
            TotalUnit: '',
            Remarks: ''
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.Date) newErrors.Date = 'Required';
        if (!formData.ShiftId) newErrors.ShiftId = 'Required';
        if (!formData.RelayId) newErrors.RelayId = 'Required';
        if (!formData.EquipmentId) newErrors.EquipmentId = 'Required';
        if (!formData.UnitId) newErrors.UnitId = 'Required';

        // Strict check for empty strings
        if (formData.OMR === '' || formData.OMR === null) newErrors.OMR = 'Required';
        if (formData.CMR === '' || formData.CMR === null) newErrors.CMR = 'Required';

        if (!newErrors.OMR && !newErrors.CMR) {
            const omr = parseFloat(formData.OMR);
            const cmr = parseFloat(formData.CMR);
            if (cmr < omr) {
                newErrors.CMR = 'CMR cannot be less than OMR';
                toast.error('CMR cannot be less than OMR');
            }
        }

        if (parseFloat(formData.TotalUnit) < 0) {
            newErrors.TotalUnit = 'Invalid Total';
        }

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
                ? `/api/transaction/electrical-entry/${initialData.SlNo}`
                : '/api/transaction/electrical-entry/create';
            const method = isUpdate ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                body: JSON.stringify(formData)
            });
            const result = await res.json();

            if (result.success) {
                toast.success(result.message);
                if (isUpdate) {
                    router.push('/dashboard/transaction/electrical-entry');
                    router.refresh(); // Ensure list update
                } else {
                    handleReset();
                    fetchRecentData(); // Function from useCallback
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
        router.push(`/dashboard/transaction/electrical-entry/${row.SlNo}`);
    };

    const handleDeleteRecent = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`/api/transaction/electrical-entry/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Deleted");
                fetchRecentData();
            }
        } catch (e) { toast.error("Delete failed"); }
    };

    return (
        <div className={css.container}>
            {/* Header */}
            <div className={css.header}>
                <button onClick={() => router.back()} className={css.backBtn}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, marginLeft: '10px' }}>
                    <h1 className={css.headerTitle} style={{ fontSize: '15px', marginBottom: '0' }}>{mode === 'edit' ? 'Update' : 'Create'} Electrical Entry</h1>
                    {lastEntry && (
                        <div className="text-xs text-gray-500 mt-1" style={{ fontSize: '11px' }}>
                            Last data entered on -&gt; Date: <span className="font-semibold">{new Date(lastEntry.Date).toLocaleDateString('en-GB')}</span> | Entered by : <span className="font-semibold text-blue-600">{lastEntry.CreatedByName || lastEntry.CreatedBy || 'Admin'}</span>
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
                {/* Form Fields - Row 1 */}
                <div className={css.row} style={{ display: 'grid', gridTemplateColumns: '20% 30% 25% auto', gap: '15px' }}>
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
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Shift <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            id="shift-input"
                            options={masters.shift}
                            value={formData.ShiftId}
                            onChange={(e) => handleSelectChange('ShiftId', e.target.value)}
                            placeholder="Select Shift"
                            error={errors.ShiftId}
                            className={css.input}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Relay <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={masters.relay}
                            value={formData.RelayId}
                            onChange={(e) => handleSelectChange('RelayId', e.target.value)}
                            placeholder="Select Relay"
                            error={errors.RelayId}
                            className={css.input}
                        />
                    </div>
                </div>

                <div className={css.divider}></div>

                {/* Form Fields - Row 2 */}
                <div className={css.row} style={{ display: 'grid', gridTemplateColumns: '30% 15% 15% 15% 10% auto', gap: '15px' }}>
                    <div className={css.group}>
                        <label className={css.label}>Equipment/Plant <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={masters.equipment}
                            value={formData.EquipmentId}
                            onChange={(e) => {
                                handleSelectChange('EquipmentId', e.target.value);
                                document.getElementById('omr-input')?.focus();
                            }}
                            placeholder="Select Equipment"
                            error={errors.EquipmentId}
                            className={css.input}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>OMR <span className="text-red-500">*</span></label>
                        <input
                            id="omr-input"
                            type="number"
                            name="OMR"
                            value={formData.OMR}
                            onChange={handleChange}
                            className={css.input}
                            style={errors.OMR ? { borderColor: 'red' } : {}}
                            step="0.001"
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>CMR <span className="text-red-500">*</span></label>
                        <input
                            id="cmr-input"
                            type="number"
                            name="CMR"
                            value={formData.CMR}
                            onChange={handleChange}
                            className={css.input}
                            style={errors.CMR ? { borderColor: 'red' } : {}}
                            step="0.001"
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Total Unit</label>
                        <input
                            type="text"
                            value={formData.TotalUnit}
                            readOnly
                            className={`${css.input} ${css.readOnly}`}
                        />
                    </div>
                    <div className={css.group}>
                        <label className={css.label}>Unit <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={masters.unit}
                            value={formData.UnitId}
                            onChange={(e) => handleSelectChange('UnitId', e.target.value)}
                            placeholder="Unit"
                            error={errors.UnitId}
                            className={css.input}
                        />
                    </div>
                </div>

                <div className={css.divider}></div>

                {/* Form Fields - Row 3 */}
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

            {/* Recent Transactions - Updated to TransactionTable */}
            <div className={css.dataTableSection}>
                <div className={css.tableTitle}>Recent Entries (Today)</div>
                <div style={{ padding: '0' }}> {/* Clean padding for sticky headers */}
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
        </div>
    );
}
