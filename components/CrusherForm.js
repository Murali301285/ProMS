
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import SearchableSelect from '@/components/SearchableSelect';
import TransactionTable from '@/components/TransactionTable';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import css from './BlastingForm.module.css';

export default function CrusherForm({ initialData = null, mode = 'create' }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('User');
    const [userId, setUserId] = useState(null);
    const [recentData, setRecentData] = useState([]);

    // Masters
    const [shifts, setShifts] = useState([]);
    const [operators, setOperators] = useState([]); // Shift In Charge
    const [plants, setPlants] = useState([]);
    const [units, setUnits] = useState([]);
    const [haulers, setHaulers] = useState([]); // Equipment
    const [bdReasons, setBdReasons] = useState([]);

    const [stoppages, setStoppages] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        Date: new Date().toISOString().split('T')[0],
        ShiftId: '',
        ShiftInChargeId: '',
        ManPowerInShift: '',
        PlantId: '',
        BeltScaleOHMR: '',
        BeltScaleCHMR: '',
        ProductionUnitId: '',
        ProductionQty: '',
        EquipmentId: '',
        NoofTrip: '',
        QtyTrip: '',
        TripQtyUnitId: '',
        TotalQty: '',
        OHMR: '',
        CHMR: '',
        RunningHr: '',
        TotalStoppageHours: '',
        Remarks: ''
    });

    const [errors, setErrors] = useState({});
    const formRef = useRef(null);
    // Focus Refs
    const plantRef = useRef(null);
    const haulerRef = useRef(null);

    // Helper to format any time value (Date, ISO string, or HH:mm:ss) to HH:mm
    const formatTimeForInput = (val) => {
        if (!val) return '';
        if (typeof val === 'string') {
            // If ISO Date string (e.g., 2024-01-01T10:30:00)
            if (val.includes('T')) {
                return new Date(val).toTimeString().slice(0, 5);
            }
            // If just time string (10:30:00), slice seconds
            return val.slice(0, 5);
        }
        // If Date object
        if (val instanceof Date) {
            return val.toTimeString().slice(0, 5);
        }
        return '';
    };

    // Initial Load & User Role
    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUserRole(data.user.role);
                    setUserId(data.user.id); // Store User ID
                }
            })
            .catch(err => console.error("Failed to fetch role", err));

        loadMasters();

        if (initialData) {
            setFormData({
                Date: initialData.Date ? new Date(initialData.Date).toISOString().split('T')[0] : '',
                ShiftId: initialData.ShiftId || '',
                ShiftInChargeId: initialData.ShiftInChargeId || '',
                ManPowerInShift: initialData.ManPowerInShift || '',
                PlantId: initialData.PlantId || '',
                BeltScaleOHMR: initialData.BeltScaleOHMR || '',
                BeltScaleCHMR: initialData.BeltScaleCHMR || '',
                ProductionUnitId: initialData.ProductionUnitId || '',
                ProductionQty: initialData.ProductionQty || '',
                EquipmentId: initialData.EquipmentId || initialData.HaulerId || '',
                NoofTrip: initialData.NoofTrip || '',
                QtyTrip: initialData.QtyTrip || '',
                TripQtyUnitId: initialData.TripQtyUnitId || '',
                TotalQty: initialData.TotalQty || '',
                OHMR: initialData.OHMR || '',
                CHMR: initialData.CHMR || '',
                RunningHr: initialData.RunningHr || '',
                TotalStoppageHours: initialData.TotalStoppageHours || '',
                Remarks: initialData.Remarks || ''
            });

            if (initialData.stoppages) {
                setStoppages(initialData.stoppages.map(s => ({
                    FromTime: formatTimeForInput(s.FromTime),
                    ToTime: formatTimeForInput(s.ToTime),
                    StoppageId: s.StoppageId,
                    StoppageHours: s.StoppageHours,
                    Remarks: s.Remarks || ''
                })));
            }
        }
    }, [initialData]);

    // Initial Data & Unique Check Logic
    useEffect(() => {
        fetchRecentData();
        checkDuplicate();
    }, [formData.Date, formData.ShiftId, formData.PlantId, formData.EquipmentId]);

    // Calculations
    useEffect(() => {
        // Production Qty = BeltScaleCHMR - BeltScaleOHMR
        const oh = parseFloat(formData.BeltScaleOHMR) || 0;
        const ch = parseFloat(formData.BeltScaleCHMR) || 0;
        if (ch > 0 || oh > 0) {
            const prod = Math.max(0, ch - oh).toFixed(3);
            setFormData(prev => ({ ...prev, ProductionQty: prod }));
        }
    }, [formData.BeltScaleOHMR, formData.BeltScaleCHMR]);

    useEffect(() => {
        // Total Qty = Trips * Qty/Trip
        const trips = parseFloat(formData.NoofTrip) || 0;
        const qtyPerTrip = parseFloat(formData.QtyTrip) || 0;
        if (trips > 0 || qtyPerTrip > 0) {
            const total = (trips * qtyPerTrip).toFixed(3);
            setFormData(prev => ({ ...prev, TotalQty: total }));
        }
    }, [formData.NoofTrip, formData.QtyTrip]);

    useEffect(() => {
        // Running Hr = CHMR - OHMR
        const oh = parseFloat(formData.OHMR) || 0;
        const ch = parseFloat(formData.CHMR) || 0;
        if (ch > 0 || oh > 0) {
            const run = Math.max(0, ch - oh).toFixed(3);
            setFormData(prev => ({ ...prev, RunningHr: run }));
        }
    }, [formData.OHMR, formData.CHMR]);




    const handleReset = () => {
        setFormData({
            Date: new Date().toISOString().split('T')[0],
            ShiftId: '', ShiftInChargeId: '', ManPowerInShift: '', PlantId: '',
            BeltScaleOHMR: '', BeltScaleCHMR: '', ProductionUnitId: 2, ProductionQty: '',
            EquipmentId: '', NoofTrip: '', QtyTrip: '', TripQtyUnitId: 2,
            TotalQty: '', OHMR: '', CHMR: '', RunningHr: '', TotalStoppageHours: '', Remarks: ''
        });
        setStoppages([]);
    };

    const checkDuplicate = async () => {
        if (mode === 'create' && formData.Date && formData.ShiftId && formData.PlantId && formData.EquipmentId) {
            try {
                const res = await fetch('/api/transaction/crusher/check-duplicate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Date: formData.Date, ShiftId: formData.ShiftId, PlantId: formData.PlantId, EquipmentId: formData.EquipmentId })
                });
                const data = await res.json();
                if (data.exists) {
                    toast.error("Duplicate Entry! Record already exists for this Date, Shift, Plant and Hauler.");
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const fetchRecentData = async () => {
        try {
            let url = `/api/transaction/crusher/list?fromDate=${formData.Date}&toDate=${formData.Date}`;
            // Implement specific initial
            // - [x] Round 3: Shift In-Charge Width (-25%) <!-- id: 54 -->
            // - [x] Round 3: Row 2 Widths (-50%, No Stretch) <!-- id: 55 -->
            // - [x] Round 3: Hauler Row Widths (Hauler -30%, Limit Others) <!-- id: 56 -->
            // - [x] Round 4: Row 1 Manpower (-50%) & Plant (+25%) <!-- id: 57 -->
            // - [x] Round 4: Fix Tab Order (Manpower -> Plant -> Fields) <!-- id: 58 -->
            // - [x] Round 2: Fix Reason Dropdown Data (API Mapping) <!-- id: 52 -->
            // - [x] Round 2: Force Remarks Full Width (CSS) <!-- id: 53 -->
            // console.error(err); // This line seems misplaced from the original snippet, it's already in the catch block.
            const res = await fetch(url);
            const result = await res.json();
            if (result.data) setRecentData(result.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadMasters = async () => {
        try {
            const [shiftRes, opRes, plantRes, unitRes, equipRes, bdRes] = await Promise.all([
                fetch('/api/master/shift'),
                fetch('/api/master/operator'),
                fetch('/api/master/plant'),
                fetch('/api/master/unit'),
                fetch('/api/master/equipment'),
                fetch('/api/master/bd-reason', { cache: 'no-store' }) // Force fresh data
            ]);

            const shiftData = await shiftRes.json();
            setShifts(Array.isArray(shiftData) ? shiftData.map(s => ({ id: String(s.SlNo), name: s.ShiftName })) : []);

            const opData = await opRes.json();
            const ops = Array.isArray(opData) ? opData : [];
            setOperators(ops
                .filter(o => o.SubCategoryId === 1 && o.IsActive && !o.IsDelete)
                .map(o => ({ id: String(o.SlNo), name: `${o.OperatorName} (${o.OperatorId || ''})` }))
            );

            const plantData = await plantRes.json();
            setPlants(Array.isArray(plantData) ? plantData.map(p => ({ id: String(p.SlNo), name: p.Name })) : []);

            const unitData = await unitRes.json();
            const unitList = Array.isArray(unitData) ? unitData.map(u => ({ id: u.SlNo, name: u.Name })) : [];
            setUnits(unitList);
            // Default Unit to MT (SlNo = 2) if not set
            if (!formData.ProductionUnitId) { setFormData(prev => ({ ...prev, ProductionUnitId: 2, TripQtyUnitId: 2 })); }

            const equipData = await equipRes.json();
            const equips = Array.isArray(equipData) ? equipData : [];
            setHaulers(equips
                .filter(e => e.ActivityId === 4 && e.IsActive && !e.IsDelete)
                .map(e => ({ id: String(e.SlNo), name: e.EquipmentName }))
            );

            const bdData = await bdRes.json();
            console.log("BD Data Raw:", bdData);
            // Relaxed Filter & Sort Alphabetically
            const reasons = Array.isArray(bdData)
                ? bdData.map(r => ({ id: String(r.SlNo), name: r.BDReasonName }))
                    .sort((a, b) => a.name.localeCompare(b.name))
                : [];
            console.log("BD Reasons Parsed:", reasons);
            setBdReasons(reasons);

        } catch (err) {
            console.error("Error loading masters:", err);
            toast.error("Failed to load master data");
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error if exists
        if (errors[field] && value) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleStoppageChange = (index, field, value) => {
        const newStoppages = [...stoppages];
        newStoppages[index][field] = value;

        if (field === 'FromTime' || field === 'ToTime') {
            const from = newStoppages[index].FromTime;
            const to = newStoppages[index].ToTime;
            if (from && to) {
                const d1 = new Date(`2000-01-01T${from}`);
                const d2 = new Date(`2000-01-01T${to}`);
                let diff = (d2 - d1) / (1000 * 60 * 60);
                if (diff < 0) diff += 24;
                newStoppages[index].StoppageHours = diff.toFixed(3);
            }
        }
        setStoppages(newStoppages);
        const total = newStoppages.reduce((sum, row) => sum + (parseFloat(row.StoppageHours) || 0), 0);
        setFormData(prev => ({ ...prev, TotalStoppageHours: total.toFixed(3) }));
    };

    const addStoppageRow = () => {
        setStoppages([...stoppages, { FromTime: '', ToTime: '', StoppageId: '', StoppageHours: '', Remarks: '' }]);
    };

    const removeStoppageRow = (index) => {
        const newStoppages = stoppages.filter((_, i) => i !== index);
        setStoppages(newStoppages);
        const total = newStoppages.reduce((sum, row) => sum + (parseFloat(row.StoppageHours) || 0), 0);
        setFormData(prev => ({ ...prev, TotalStoppageHours: total.toFixed(3) }));
    };

    const handleKeyDown = (e, index) => {
        // console.log(`Key: ${e.key}, Index: ${index}`); // Debug
        if (e.key === 'Enter') {
            e.preventDefault();

            // REFINED LOGIC: Explicit Chain
            const mapping = {
                3: () => plantRef.current && plantRef.current.focus(), // Manpower -> Plant
                4: () => document.getElementById('ohmr-input')?.focus(), // Plant -> OHMR
                5: () => document.getElementById('chmr-input')?.focus(), // OHMR -> CHMR
                6: () => haulerRef.current && haulerRef.current.focus(), // CHMR -> Hauler
                7: () => document.getElementById('notrip-input')?.focus(), // Hauler -> No of Trip (Skip others?)
                10: () => document.getElementById('qtytrip-input')?.focus(), // No of Trip -> Qty/Trip
                11: () => document.getElementById('add-stoppage-btn')?.focus(), // Qty/Trip -> New Stoppage
            };

            if (mapping[index]) {
                mapping[index]();
                return;
            }


            // Fallback to sequential standard 
            const inputs = Array.from(formRef.current.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button[data-seq]'));
            let nextIndex = index + 1;
            while (nextIndex < inputs.length) {
                const nextEl = inputs[nextIndex];
                if (!nextEl.readOnly) { nextEl.focus(); break; }
                nextIndex++;
            }
        }
        // Shortcuts
        if (e.key === 'F2') {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'F5') {
            e.preventDefault();
            fetchRecentData();
        }
    };

    // Global Key Listener for F2/F5
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === 'F2') { e.preventDefault(); handleSave(); }
            if (e.key === 'F5') { e.preventDefault(); fetchRecentData(); }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [formData, stoppages]); // Re-bind with latest state


    const validate = () => {
        const newErrors = {};
        if (!formData.Date) newErrors.Date = 'Required';
        if (!formData.ShiftId) newErrors.ShiftId = 'Required';
        if (!formData.PlantId) newErrors.PlantId = 'Required';
        if (!formData.ShiftInChargeId) newErrors.ShiftInChargeId = 'Required';
        if (!formData.EquipmentId) newErrors.EquipmentId = 'Required';

        // Stoppages validation
        for (const st of stoppages) {
            if (!st.StoppageId) {
                toast.error("Stoppage Reason is required for all rows");
                return false;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            toast.error("Please fill mandatory fields");
            return;
        }

        const newErrors = {};
        if (!formData.Date) newErrors.Date = true;
        if (!formData.ShiftId) newErrors.ShiftId = true;
        if (!formData.ShiftInChargeId) newErrors.ShiftInChargeId = true;
        if (!formData.PlantId) newErrors.PlantId = true;
        if (!formData.EquipmentId) newErrors.EquipmentId = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill mandatory fields");
            return;
        }

        if (mode === 'create') {
            // Re-check duplicate before save just in case
            try {
                const dupRes = await fetch('/api/transaction/crusher/check-duplicate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Date: formData.Date, ShiftId: formData.ShiftId, PlantId: formData.PlantId, EquipmentId: formData.EquipmentId })
                });
                const dupData = await dupRes.json();
                if (dupData.exists) {
                    toast.error("Duplicate Entry! Record already exists for this Date, Shift, Plant and Hauler.");
                    return;
                }
            } catch (e) { console.error(e); }
        }

        setLoading(true);
        try {
            const url = mode === 'create' ? '/api/transaction/crusher/create' : `/api/transaction/crusher/${initialData.SlNo}`;
            const method = mode === 'create' ? 'POST' : 'PUT';

            if (!userId) {
                toast.error("User session missing. Please re-login.");
                setLoading(false);
                return;
            }

            const payload = { ...formData, UserId: userId, stoppages };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || result.message);

            toast.success("Saved Successfully!");

            if (mode === 'create') {
                setFormData(prev => ({
                    ...prev,
                    // Keep Date
                    ShiftId: '', ShiftInChargeId: '', ManPowerInShift: '', PlantId: '',
                    BeltScaleOHMR: '', BeltScaleCHMR: '', ProductionUnitId: 2, ProductionQty: '',
                    EquipmentId: '', NoofTrip: '', QtyTrip: '', TripQtyUnitId: 2,
                    TotalQty: '', OHMR: '', CHMR: '', RunningHr: '', TotalStoppageHours: '', Remarks: ''
                }));
                setStoppages([]);
                fetchRecentData();
                // Auto focus first input after save? can do via Ref
            } else {
                router.push('/dashboard/transaction/crusher');
            }
        } catch (err) {
            toast.error(err.message || "Save Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await fetch(`/api/transaction/crusher/${id}`, { method: 'DELETE' });
            toast.success("Record deleted");
            fetchRecentData();
        } catch (err) {
            toast.error(err.message || "Delete failed");
        }
    };

    const handleEdit = (row) => {
        if (!row || !row.SlNo) { toast.error("Invalid Record ID"); return; }
        router.push(`/dashboard/transaction/crusher/${row.SlNo}`);
    };

    return (
        <div className={css.container}>
            <div className={css.header}>
                <button onClick={() => router.back()} className={css.backBtn}>
                    <ArrowLeft size={16} /> Back
                </button>
                <h1 className={css.title}>{mode === 'create' ? 'Create' : 'Update'} Crusher</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleReset} className={css.refreshBtn} title="(Esc) Reset Form" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px' }}>
                        <RotateCcw size={20} />
                    </button>
                    <button onClick={handleSave} disabled={loading} className={css.saveBtn} title="(F2) Save Record">
                        {loading ? 'Saving...' : (mode === 'create' ? 'Save (F2)' : 'Update (F2)')}
                    </button>
                </div>
            </div>

            <div className={css.formSection} ref={formRef}>
                {/* Row 1: Date (15%), Shift (25%), ShiftInCharge (35%), Manpower (10%), Plant (15%) */}
                {/* Row 1: Date (15%), Shift (15%), ShiftInCharge (40%), Manpower (10%), Plant (20%) - Adjusted */}
                <div className={css.row} style={{ display: 'grid', gridTemplateColumns: '15% 15% 36% 6% 12.5% auto', gap: '10px' }}>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Date<span className={css.required}>*</span></label>
                        <input type="date" className={css.input} style={errors.Date ? { border: '1px solid red' } : {}} value={formData.Date} max={new Date().toISOString().split('T')[0]} onChange={e => handleChange('Date', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 0)} autoFocus />
                        {errors.Date && <span style={{ color: 'red', fontSize: '10px' }}>missing value</span>}
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Shift<span className={css.required}>*</span></label>
                        <SearchableSelect options={shifts} value={formData.ShiftId} onChange={(e) => handleChange('ShiftId', e.target.value)} placeholder="Shift" className={css.compactInput} name="ShiftId" error={errors.ShiftId} />
                        {errors.ShiftId && <span style={{ color: 'red', fontSize: '10px' }}>missing value</span>}
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Shift In Charge <span className={css.required}>*</span></label>
                        <SearchableSelect
                            options={operators}
                            value={formData.ShiftInChargeId ? formData.ShiftInChargeId.split(',').filter(Boolean) : []}
                            onChange={(e) => {
                                const val = Array.isArray(e.target.value) ? e.target.value : e.target.value;
                                const csv = Array.isArray(val) ? val.join(',') : val;
                                handleChange('ShiftInChargeId', csv);
                            }}
                            placeholder="Select In-Charge"
                            className={css.compactInput}
                            name="ShiftInChargeId"
                            multiple={true}
                            error={errors.ShiftInChargeId}
                        />
                        {errors.ShiftInChargeId && <span style={{ color: 'red', fontSize: '10px' }}>missing value</span>}
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Manpower</label>
                        <input type="number" step="1" className={css.input} value={formData.ManPowerInShift} onChange={e => handleChange('ManPowerInShift', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 3)} />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Plant<span className={css.required}>*</span></label>
                        <SearchableSelect
                            ref={plantRef}
                            options={plants}
                            value={formData.PlantId}
                            onChange={(e) => {
                                handleChange('PlantId', e.target.value);
                                // Auto-focus OHMR after selection if single select
                                document.getElementById('ohmr-input')?.focus();
                            }}
                            placeholder="Plant"
                            className={css.compactInput}
                            name="PlantId"
                            error={errors.PlantId}
                        />
                        {errors.PlantId && <span style={{ color: 'red', fontSize: '10px' }}>missing value</span>}
                    </div>
                </div>

                <div className={css.divider}></div>

                {/* Row 2: OHMR (Belt), CHMR (Belt), Production Qty, Unit */}
                <div className={css.row} style={{ display: 'grid', gridTemplateColumns: '20% 20% 20% 10% auto', gap: '15px' }}>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>OHMR (Belt Scale)</label>
                        <input id="ohmr-input" type="number" step="0.001" className={css.input} value={formData.BeltScaleOHMR} onChange={e => handleChange('BeltScaleOHMR', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 5)} />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>CHMR (Belt Scale)</label>
                        <input id="chmr-input" type="number" step="0.001" className={css.input} value={formData.BeltScaleCHMR} onChange={e => handleChange('BeltScaleCHMR', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 6)} />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Production Qty</label>
                        <input type="number" step="0.001" className={`${css.input} ${css.readOnly}`} value={formData.ProductionQty} readOnly />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Unit</label>
                        <SearchableSelect options={units} value={formData.ProductionUnitId} onChange={(e) => handleChange('ProductionUnitId', e.target.value)} placeholder="Unit" className={css.compactInput} name="ProductionUnitId" />
                    </div>
                </div>


                <div className={css.divider}></div>

                {/* Row 3: Hauler (30%), Trip (17.5%), Qty/Trip (17.5%), Unit (10%), Total Qty (25%) */}
                <div className={css.row} style={{ display: 'grid', gridTemplateColumns: '21% 9% 9% 10% 11% auto', gap: '15px' }}>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Hauler</label>
                        <SearchableSelect
                            ref={haulerRef}
                            options={haulers}
                            value={formData.EquipmentId}
                            onChange={(e) => {
                                handleChange('EquipmentId', e.target.value);
                                document.getElementById('notrip-input')?.focus();
                            }}
                            placeholder="Hauler"
                            className={css.compactInput}
                            name="EquipmentId"
                            error={errors.EquipmentId}
                        />
                        {errors.EquipmentId && <span style={{ color: 'red', fontSize: '10px' }}>missing value</span>}
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>No of Trip</label>
                        <input id="notrip-input" type="number" step="1" className={css.input} value={formData.NoofTrip} onChange={e => handleChange('NoofTrip', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 10)} />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Qty/Trip</label>
                        <input id="qtytrip-input" type="number" step="0.001" className={css.input} value={formData.QtyTrip} onChange={e => handleChange('QtyTrip', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 11)} />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Unit</label>
                        <SearchableSelect options={units} value={formData.TripQtyUnitId} onChange={(e) => handleChange('TripQtyUnitId', e.target.value)} placeholder="Unit" className={css.compactInput} name="TripQtyUnitId" />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Total Qty</label>
                        <input type="number" step="0.001" className={`${css.input} ${css.readOnly}`} value={formData.TotalQty} readOnly />
                    </div>
                </div>

                <div className={css.divider}></div>

                {/* Row 4: Hauler OHMR, CHMR, Running Hr - Compacted */}
                <div className={css.row} style={{ display: 'grid', gridTemplateColumns: '16% 16% 16% auto', gap: '15px' }}>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>OHMR</label>
                        <input type="number" step="0.001" className={css.input} value={formData.OHMR} onChange={e => handleChange('OHMR', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 12)} />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>CHMR</label>
                        <input type="number" step="0.001" className={css.input} value={formData.CHMR} onChange={e => handleChange('CHMR', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 13)} />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Running Hr</label>
                        <input type="number" step="0.001" className={`${css.input} ${css.readOnly}`} value={formData.RunningHr} readOnly />
                    </div>
                </div>

                {/* Row 4: Stoppages */}
                <div className={css.dataTableSection} style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <div className={css.header} style={{ borderBottom: 'none', paddingBottom: '10px' }}>
                        <h3 className={css.tableTitle}>Stoppages</h3>
                        <div className={css.label} style={{ fontSize: '12px' }}>Total Stoppage Hours: {formData.TotalStoppageHours || 0}</div>
                    </div>

                    <div style={{ /* overflowX: 'auto' removed */ }}>
                        <table className={css.accTable} id="stoppage-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '15%' }}>From Time</th>
                                    <th style={{ width: '15%' }}>To Time</th>
                                    <th style={{ width: '25%' }}>Reason</th>
                                    <th style={{ width: '10%' }}>Hours</th>
                                    <th style={{ width: '25%' }}>Remarks</th>
                                    <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stoppages.map((row, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input type="time" value={row.FromTime} onChange={(e) => handleStoppageChange(index, 'FromTime', e.target.value)} className={css.input} />
                                        </td>
                                        <td>
                                            <input type="time" value={row.ToTime} onChange={(e) => handleStoppageChange(index, 'ToTime', e.target.value)} className={css.input} />
                                        </td>
                                        <td>
                                            <SearchableSelect
                                                options={bdReasons}
                                                value={row.StoppageId}
                                                onChange={(e) => handleStoppageChange(index, 'StoppageId', e.target.value)}
                                                placeholder="Select Reason"
                                                className={css.compactInput}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        // Focus next input (Hours)
                                                        const inputs = document.querySelectorAll('#stoppage-table input');
                                                        // This is tricky because SearchableSelect is complex.
                                                        // Easier: Assign IDs to inputs.
                                                        document.getElementById(`stop-hours-${index}`)?.focus();
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <input id={`stop-hours-${index}`} type="number" step="0.001" value={row.StoppageHours} onChange={(e) => handleStoppageChange(index, 'StoppageHours', e.target.value)} className={`${css.input} ${css.readOnly}`} readOnly />
                                        </td>
                                        <td>
                                            <input type="text" value={row.Remarks} onChange={(e) => handleStoppageChange(index, 'Remarks', e.target.value)} className={css.input} />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button type="button" onClick={() => removeStoppageRow(index)} className={css.deleteBtn}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <button type="button" onClick={addStoppageRow} className={css.addBtn} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Plus size={14} /> Add Row
                        </button>
                    </div>
                </div>

                <div className={css.divider}></div>

                {/* Row 5: Remarks */}
                <div className={css.row} style={{ display: 'block', width: '100%' }}>
                    <div className={css.fieldGroup} style={{ width: '100%' }}>
                        <label className={css.label}>Remarks</label>
                        <input
                            type="text"
                            className={css.input}
                            value={formData.Remarks}
                            onChange={e => handleChange('Remarks', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 20)}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>

                {/* Actions Removed from bottom - Moved to Header */}

            </div>

            {/* Recent Transactions */}
            <div className={css.dataTableSection}>
                <div className={css.tableTitle}>Recent Transactions</div>
                <TransactionTable
                    config={TRANSACTION_CONFIG['crusher']}
                    data={recentData}
                    isLoading={false}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    userRole={userRole}
                />
            </div>
        </div>
    );
}
