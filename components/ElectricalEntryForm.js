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
            { accessor: 'Type', label: 'Type', width: 100 },
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
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [userRole, setUserRole] = useState(null); // Added for TransactionTable
    const [displayUser, setDisplayUser] = useState(null);

    const [entryType, setEntryType] = useState('Equipment'); // 'Equipment' or 'Plant'
    const [formKey, setFormKey] = useState(0); // Force-remount key
    const [masters, setMasters] = useState({
        shift: [],
        relay: [],
        equipment: [],
        plant: [],
        unit: []
    });

    const formRef = useRef(null);

    // Fetch User Role & Last Entry
    // Fetch User Role
    useEffect(() => {
        fetch('/api/auth/me').then(res => res.json()).then(json => {
            if (json.user) setUserRole(json.user.role);
        }).catch(console.error);
    }, []);

    // Get LocalStorage User for Title Display
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const parsed = JSON.parse(userStr);
                setDisplayUser(parsed.EmpName || parsed.UserName || parsed.username || parsed.name || 'User');
            } catch (e) {
                console.error("User Parse Error", e);
            }
        }
    }, []);

    // 4. Trigger Table Refresh (Smart Filter: Date or Shift)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTableData();
        }, 300);
        return () => clearTimeout(timer);
    }, [formData.Date, formData.ShiftId]);


    // --- Dynamic Table & Smart Context Logic ---

    // 1. Fetch data for the Table (Dynamic Filter)
    const fetchTableData = async (isLoadMore = false) => {
        if (!isLoadMore) {
            setPage(0);
            setHasMore(true);
        }
        setLoadingRecent(true);
        try {
            const currentPage = isLoadMore ? page + 1 : 0;
            const take = 50;
            const skip = currentPage * take;

            const payload = {
                Date: formData.Date,
                ShiftId: formData.ShiftId, // Optional Filter
                skip,
                take
            };
            const res = await fetch('/api/transaction/electrical-entry/helper/recent-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.data) {
                const newData = result.data;
                if (newData.length < take) setHasMore(false);

                if (isLoadMore) {
                    setRecentData(prev => [...prev, ...newData]);
                    setPage(currentPage);
                } else {
                    setRecentData(newData);
                }
            } else {
                if (!isLoadMore) setRecentData([]);
            }
        } catch (err) {
            console.error("Failed to fetch recent data:", err);
        } finally {
            setLoadingRecent(false);
        }
    };

    // 2. Converged Smart Context Logic
    const isInitialMount = useRef(true);
    const lastFetchDate = useRef(null); // Track last fetched date to prevent loop

    useEffect(() => {
        if (mode !== 'create' || initialData) return;

        const loadContext = async () => {
            try {
                // Scenario A: First Load (Fetch Absolute Last to get Date & Shift)
                if (isInitialMount.current) {
                    isInitialMount.current = false;
                    const res = await fetch('/api/transaction/electrical-entry/helper/last-context', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}) // Empty = Absolute Last
                    });
                    const result = await res.json();
                    if (result.data) {
                        const ctx = result.data;
                        const ctxDate = ctx.Date ? new Date(ctx.Date).toISOString().split('T')[0] : formData.Date; // Use formData.Date if ctx.Date is null
                        lastFetchDate.current = ctxDate; // Sync ref

                        const isPlant = ctx.Type === 'Plant' || (ctx.PlantId && !ctx.EquipmentId);

                        setEntryType(ctx.Type || (isPlant ? 'Plant' : 'Equipment'));
                        setFormData(prev => ({
                            ...prev,
                            // PRELOAD: Date, Shift, Relay
                            Date: ctxDate,
                            ShiftId: ctx.ShiftId || '',
                            RelayId: ctx.RelayId || '',
                            UnitId: ctx.UnitId || prev.UnitId,

                            // RESET: Everything else
                            PlantId: '', EquipmentId: '',
                            OMR: '', CMR: '', TotalUnit: '', Remarks: ''
                        }));
                    } else {
                        lastFetchDate.current = formData.Date; // Sync even if no data
                    }
                }
                // Scenario B: User Changed Date (Fetch Context for specific date)
                else if (formData.Date !== lastFetchDate.current) {
                    lastFetchDate.current = formData.Date; // Update ref immediately

                    const res = await fetch('/api/transaction/electrical-entry/helper/last-context', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ Date: formData.Date })
                    });
                    const result = await res.json();
                    if (result.data) {
                        const ctx = result.data;
                        // Avoid overriding EntryType if user manually changed it?

                        setFormData(prev => ({
                            ...prev,
                            ShiftId: ctx.ShiftId || '',
                            RelayId: ctx.RelayId || '',
                            UnitId: ctx.UnitId || prev.UnitId,

                            // RESET
                            PlantId: '', EquipmentId: '',
                            OMR: '', CMR: '', TotalUnit: '', Remarks: ''
                        }));
                    } else {
                        // No context for this date
                        setFormData(prev => ({
                            ...prev,
                            PlantId: '', EquipmentId: '',
                            OMR: '', CMR: '', TotalUnit: '', Remarks: ''
                        }));
                    }
                }

                // Common Actions: Focus & Table Refresh (Run only if we actually did something or initial load)
                // But wait, if Date didn't change, we skip the block.
                // So this Focus logic runs only on actual Date changes or initial load.
                // This is desired. resetForNextEntry handles the Save case.

                setTimeout(() => {
                    fetchTableData(); // explicit call

                    let targetId = null;
                    if (entryType === 'Equipment') targetId = 'equipment-select';
                    else if (entryType === 'Plant') targetId = 'plant-select';

                    if (targetId) {
                        const el = document.getElementById(targetId);
                        if (el) el.focus();
                    }
                }, 150);

            } catch (err) {
                console.error("Context Load Error:", err);
            }
        };

        loadContext();
    }, [formData.Date, mode, initialData]); // Dependencies 

    // Remove separate fetchTableData trigger to avoid double calls
    // useEffect(() => { ... fetchTableData ... }, [formData.Date]) -> Removed/Merged above



    // Fetch Masters and Initial Data
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [shiftRes, relayRes, eqRes, plantRes, unitRes] = await Promise.all([
                    fetch('/api/master/shift').then(r => r.json()),
                    fetch('/api/master/relay').then(r => r.json()),
                    fetch('/api/master/equipment').then(r => r.json()),
                    fetch('/api/master/plant').then(r => r.json()),
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
                    plant: parseRes(plantRes).map(p => ({ id: String(p.SlNo), name: p.Name })),
                    unit: units.map(u => ({ id: String(u.SlNo), name: u.Name }))
                });

                // Edit Logic removed from here - moved to dedicated effect
            } catch (err) {
                console.error(err);
                toast.error("Failed to load master data");
            }
        };
        fetchMasters();
    }, [mode, initialData]); // Dependencies for Masters. Note: Edit logic moved out.

    // 2. Edit Mode: Populate Initial Data (Isolated Effect)
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            console.log("[ElectricalEntryForm] Edit Initial Data:", initialData);

            const isPlant = !!initialData.PlantId;
            setEntryType(isPlant ? 'Plant' : 'Equipment');

            // Helper for robust value retrieval (checks for null/undefined, allows 0)
            const getVal = (keys) => {
                for (let k of keys) {
                    if (initialData[k] !== undefined && initialData[k] !== null) return initialData[k];
                }
                return '';
            };

            setFormData(prev => ({
                ...prev, // Keep prev (though we usually overwrite)
                ...initialData,
                Date: initialData.Date ? new Date(initialData.Date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                ShiftId: initialData.ShiftId ? String(initialData.ShiftId) : '',
                RelayId: initialData.RelayId ? String(initialData.RelayId) : '',
                EquipmentId: initialData.EquipmentId ? String(initialData.EquipmentId) : '',
                PlantId: initialData.PlantId ? String(initialData.PlantId) : '',
                UnitId: initialData.UnitId ? String(initialData.UnitId) : '',

                // Transactional Fields - Robust Mapping
                OMR: getVal(['OMR', 'Omr', 'omr']),
                CMR: getVal(['CMR', 'Cmr', 'cmr']),
                TotalUnit: getVal(['TotalUnit', 'Totalunit', 'totalUnit', 'totalunit']),
                Remarks: getVal(['Remarks', 'remarks'])
            }));
        }
    }, [mode, initialData]); // Only re-run if these change

    // 3. Date Change: Get Date-Specific Context (Backtracking)
    useEffect(() => {
        if (mode === 'create' && formData.Date && !initialData) {
            const fetchDateContext = async () => {
                try {
                    const res = await fetch('/api/transaction/electrical-entry/helper/last-context', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ Date: formData.Date })
                    });
                    const result = await res.json();

                    if (result.data) {
                        const ctx = result.data;
                        const isPlant = ctx.Type === 'Plant' || (ctx.PlantId && !ctx.EquipmentId);
                        setEntryType(ctx.Type || (isPlant ? 'Plant' : 'Equipment'));

                        setFormData(prev => ({
                            ...prev,
                            ShiftId: ctx.ShiftId || '',
                            RelayId: ctx.RelayId || '',
                            PlantId: '', // Reset
                            EquipmentId: '', // Reset
                            UnitId: ctx.UnitId || prev.UnitId,

                            // Map Transactional from Last Context
                            OMR: '', // Reset
                            CMR: '', // Reset
                            TotalUnit: '', // Reset
                            Remarks: '' // Reset
                        }));
                    } else {
                        // Reset if no data for date
                        setFormData(prev => ({
                            ...prev,
                            ShiftId: '', RelayId: '', PlantId: '', EquipmentId: '',
                            OMR: '', CMR: '', TotalUnit: '', Remarks: ''
                        }));
                        // Keep current Entry Type or reset? Let's keep it.
                    }
                } catch (err) {
                    console.error("Date Context Error:", err);
                }
            };
            fetchDateContext();
        }
    }, [formData.Date, mode, initialData]);

    // 4. Trigger Table Refresh
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTableData();
        }, 300);
        return () => clearTimeout(timer);
    }, [formData.Date]);


    // Fetch Masters and Initial Data
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [shiftRes, relayRes, eqRes, plantRes, unitRes] = await Promise.all([
                    fetch('/api/master/shift').then(r => r.json()),
                    fetch('/api/master/relay').then(r => r.json()),
                    fetch('/api/master/equipment').then(r => r.json()),
                    fetch('/api/master/plant').then(r => r.json()),
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
                    plant: parseRes(plantRes).map(p => ({ id: String(p.SlNo), name: p.Name })),
                    unit: units.map(u => ({ id: String(u.SlNo), name: u.Name }))
                });

                if (mode === 'edit' && initialData) {
                    const isPlant = !!initialData.PlantId;
                    setEntryType(isPlant ? 'Plant' : 'Equipment');
                    setFormData({
                        ...initialData,
                        Date: initialData.Date ? new Date(initialData.Date).toISOString().split('T')[0] : today,
                        ShiftId: initialData.ShiftId ? String(initialData.ShiftId) : '',
                        RelayId: initialData.RelayId ? String(initialData.RelayId) : '',
                        EquipmentId: initialData.EquipmentId ? String(initialData.EquipmentId) : '',
                        PlantId: initialData.PlantId ? String(initialData.PlantId) : '',
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

    // Helper for resetting transactional fields while keeping context
    const resetForNextEntry = () => {
        // Functional Update to guarantee latest state
        setFormData(prev => ({
            ...prev,
            // Keep: Date, ShiftId, RelayId, UnitId
            // Reset:
            EquipmentId: '',
            PlantId: '',
            OMR: '',
            CMR: '',
            TotalUnit: '',
            Remarks: ''
        }));

        setFormKey(prev => prev + 1); // Force Remount of Inputs

        // Focus
        setTimeout(() => {
            let targetId = null;
            if (entryType === 'Equipment') targetId = 'equipment-select';
            else if (entryType === 'Plant') targetId = 'plant-select';

            if (targetId) {
                const el = document.getElementById(targetId);
                if (el) el.focus();
            }
        }, 150);
        toast.info("Ready for next entry (v2.0)");
    };

    const handleReset = () => {
        resetForNextEntry();
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.Date) newErrors.Date = 'Required';
        if (!formData.ShiftId) newErrors.ShiftId = 'Required';
        if (!formData.RelayId) newErrors.RelayId = 'Required';

        // Conditional Validation
        if (entryType === 'Equipment' && !formData.EquipmentId) newErrors.EquipmentId = 'Required';
        if (entryType === 'Plant' && !formData.PlantId) newErrors.PlantId = 'Required';

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
                body: JSON.stringify({ ...formData, entryType })
            });
            const result = await res.json();

            if (result.success) {
                toast.success(result.message);
                if (isUpdate) {
                    router.push('/dashboard/transaction/electrical-entry');
                    router.refresh(); // Ensure list update
                } else {
                    // Reset Logic (User Request)
                    resetForNextEntry();
                    fetchTableData();
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

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                handleSave(mode === 'edit');
            } else if (e.key === 'F5') {
                e.preventDefault();
                handleReset();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }); // No dependency array intended to ensure fresh closures for handleSave/handleReset

    // Last Entry State
    const [lastEntry, setLastEntry] = useState(null);
    useEffect(() => {
        fetch('/api/transaction/electrical-entry/latest')
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) setLastEntry(json.data);
            })
            .catch(console.error);
    }, []);

    return (
        <div className={css.container}>
            {/* Header */}
            <div className={css.header}>
                <button onClick={() => router.push('/dashboard/transaction/electrical-entry')} className={css.backBtn}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center' }}>
                    <h1 className={css.headerTitle} style={{ fontSize: '15px', marginBottom: '0', textAlign: 'center' }}>
                        {mode === 'edit' ? 'Update' : 'Create'} Electrical Entry
                    </h1>
                    {/* Last Entry Display - Hidden per User Request */}
                    {/* {lastEntry && (
                        <span style={{ color: '#2563eb', fontStyle: 'italic', fontSize: '0.85rem', fontWeight: 500 }}>
                            Last data entered on -&gt; Date: {lastEntry.Date ? new Date(lastEntry.Date).toLocaleDateString('en-GB') : ''} | Entered by : {lastEntry.CreatedByName || lastEntry.CreatedBy || 'Unknown'}
                        </span>
                    )} */}
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
                <div key={formKey} style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '15px' }}>

                    {/* --- Row 1 --- */}

                    {/* Date: R1 C1 */}
                    <div className={css.group} style={{ gridColumn: '1 / span 1' }}>
                        <label className={css.label}>Date <span style={{ color: 'red' }}>*</span></label>
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

                    {/* Shift: R1 C2 */}
                    <div className={css.group} style={{ gridColumn: '2 / span 1' }}>
                        <label className={css.label}>Shift <span style={{ color: 'red' }}>*</span></label>
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

                    {/* Relay: R1 C3 */}
                    <div className={css.group} style={{ gridColumn: '3 / span 1' }}>
                        <label className={css.label}>Relay <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            options={masters.relay}
                            value={formData.RelayId}
                            onChange={(e) => handleSelectChange('RelayId', e.target.value)}
                            placeholder="Select Relay"
                            error={errors.RelayId}
                            className={css.input}
                        />
                    </div>

                    {/* --- Row 2 --- */}

                    {/* Equipment/Plant: R2 C1-C2 (Span 2) */}
                    <div className={css.group} style={{ gridColumn: '1 / span 2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className={css.label}>
                                {entryType} <span style={{ color: 'red' }}>*</span>
                            </label>

                            {/* Toggle Switch UI */}
                            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '4px', padding: '2px', marginBottom: '4px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEntryType('Equipment');
                                        setFormData(prev => ({ ...prev, PlantId: '', EquipmentId: '' })); // Reset values on switch
                                        setErrors(prev => ({ ...prev, PlantId: null, EquipmentId: null }));
                                    }}
                                    style={{
                                        fontSize: '10px',
                                        padding: '2px 8px',
                                        borderRadius: '3px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: entryType === 'Equipment' ? '#3b82f6' : 'transparent',
                                        color: entryType === 'Equipment' ? 'white' : 'inherit',
                                        boxShadow: entryType === 'Equipment' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                        fontWeight: entryType === 'Equipment' ? '600' : 'normal',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Equipment
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEntryType('Plant');
                                        setFormData(prev => ({ ...prev, EquipmentId: '', PlantId: '' })); // Reset values on switch
                                        setErrors(prev => ({ ...prev, PlantId: null, EquipmentId: null }));
                                    }}
                                    style={{
                                        fontSize: '10px',
                                        padding: '2px 8px',
                                        borderRadius: '3px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: entryType === 'Plant' ? '#3b82f6' : 'transparent',
                                        color: entryType === 'Plant' ? 'white' : 'inherit',
                                        boxShadow: entryType === 'Plant' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                        fontWeight: entryType === 'Plant' ? '600' : 'normal',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Plant
                                </button>
                            </div>
                        </div>

                        {entryType === 'Equipment' ? (
                            <SearchableSelect
                                id="equipment-select"
                                autoFocus={true} // Auto-focus on mount (worked by formKey)
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
                        ) : (
                            <SearchableSelect
                                id="plant-select"
                                autoFocus={true} // Auto-focus on mount (worked by formKey)
                                options={masters.plant}
                                value={formData.PlantId}
                                onChange={(e) => {
                                    handleSelectChange('PlantId', e.target.value);
                                    document.getElementById('omr-input')?.focus();
                                }}
                                placeholder="Select Plant"
                                error={errors.PlantId}
                                className={css.input}
                            />
                        )}
                    </div>

                    {/* OMR: R2 C3 */}
                    <div className={css.group} style={{ gridColumn: '3 / span 1' }}>
                        <label className={css.label}>OMR <span style={{ color: 'red' }}>*</span></label>
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

                    {/* CMR: R2 C4 */}
                    <div className={css.group} style={{ gridColumn: '4 / span 1' }}>
                        <label className={css.label}>CMR <span style={{ color: 'red' }}>*</span></label>
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

                    {/* Total Unit: R2 C5 */}
                    <div className={css.group} style={{ gridColumn: '5 / span 1' }}>
                        <label className={css.label}>Total Unit</label>
                        <input
                            type="text"
                            value={formData.TotalUnit}
                            readOnly
                            className={`${css.input} ${css.readOnly}`}
                        />
                    </div>

                    {/* Unit: R2 C6 */}
                    <div className={css.group} style={{ gridColumn: '6 / span 1' }}>
                        <label className={css.label}>Unit <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            options={masters.unit}
                            value={formData.UnitId}
                            onChange={(e) => handleSelectChange('UnitId', e.target.value)}
                            placeholder="Unit"
                            error={errors.UnitId}
                            className={css.input}
                        />
                    </div>

                    {/* --- Row 3 --- */}

                    {/* Remarks: R3 C1-C6 (Span 6) */}
                    <div className={css.group} style={{ gridColumn: '1 / span 6' }}>
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
                <div style={{ padding: '0' }}> {/* Clean padding for sticky headers */}
                    <TransactionTable
                        config={config}
                        title="Recent Transactions"
                        data={recentData}
                        isLoading={loadingRecent && page === 0}
                        onEdit={handleEditRecent}
                        onDelete={handleDeleteRecent}
                        userRole={userRole}
                    />
                    {/* Load More Button */}
                    {recentData.length > 0 && hasMore && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '20px' }}>
                            <button
                                type="button"
                                onClick={() => fetchTableData(true)}
                                disabled={loadingRecent}
                                style={{
                                    padding: '8px 24px',
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '20px',
                                    color: '#1e293b',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 500
                                }}
                            >
                                {loadingRecent ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
