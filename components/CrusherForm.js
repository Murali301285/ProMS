
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import SearchableSelect from '@/components/SearchableSelect';
import TransactionTable from '@/components/TransactionTable';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import css from './CrusherForm.module.css';

export default function CrusherForm({ initialData = null, mode = 'create' }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('User');
    const [userId, setUserId] = useState(null);
    const [recentData, setRecentData] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

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
        MidScaleInchargeId: '',
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
    const isSavingRef = useRef(false); // Ref for immediate blocking
    // Focus Refs
    const plantRef = useRef(null);
    const haulerRef = useRef(null);
    const dateRef = useRef(null);
    const shiftMap = useRef({}); // Store full shift details

    // Initial Focus
    useEffect(() => {
        const shouldFocusPlant = sessionStorage.getItem('focus_plant_after_save');
        if (shouldFocusPlant) {
            sessionStorage.removeItem('focus_plant_after_save');
            // Wait for mounting/ref to be ready
            setTimeout(() => {
                if (plantRef.current) plantRef.current.focus();
            }, 500); // Generous timeout for masters loading
        } else if (mode === 'create' && dateRef.current) {
            dateRef.current.focus();
        }
    }, []); // Run once on mount

    // Helper to format any time value (Date, ISO string, or HH:mm:ss) to HH:mm
    // Helper to format any time value (Date, ISO string, or HH:mm:ss) to HH:mm
    const formatTimeForInput = (val) => {
        if (!val) return '';
        if (typeof val === 'string') {
            if (val.includes('T')) {
                // Heuristic: If 1970, it's likely a TIME column returned as ISO string -> Use UTC part
                if (val.startsWith('1970')) {
                    return val.split('T')[1].slice(0, 5);
                }
                // Otherwise treat as normal Date -> Local Time
                return new Date(val).toTimeString().slice(0, 5);
            }
            return val.slice(0, 5);
        }
        if (val instanceof Date) {
            // Heuristic: If 1970, it's a TIME column -> Use UTC part
            if (val.getFullYear() === 1970) {
                return val.toISOString().split('T')[1].slice(0, 5);
            }
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
                MidScaleInchargeId: initialData.MidScaleInchargeId || '',
                ManPowerInShift: initialData.ManPowerInShift || '',
                PlantId: initialData.PlantId || '',
                BeltScaleOHMR: initialData.BeltScaleOHMR || '',
                BeltScaleCHMR: initialData.BeltScaleCHMR || '',
                ProductionUnitId: initialData.ProductionUnitId || '',
                ProductionQty: initialData.ProductionQty || '',
                EquipmentId: initialData.EquipmentId || initialData.HaulerEquipmentId || initialData.HaulerId || '',
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

    // --- Dynamic Table & Smart Context Logic ---

    // 1. Fetch data for the Table (Dynamic Filter)
    const fetchTableData = async (isLoadMore = false) => {
        if (!isLoadMore) {
            setPage(0);
            setHasMore(true);
        }
        setTableLoading(true);
        try {
            const currentPage = isLoadMore ? page + 1 : 0;
            const take = 50;
            const skip = currentPage * take;

            // Filter by Date AND Shift (and User ID implicitly via API)
            const payload = {
                Date: formData.Date,
                ShiftId: formData.ShiftId,
                skip,
                take
            };

            console.log("Fetching Table Data with:", payload);

            const res = await fetch('/api/transaction/crusher/helper/recent-list', {
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
            }
        } catch (err) {
            console.error("Failed to fetch recent data:", err);
        } finally {
            setTableLoading(false);
        }
    };

    // 2. Initial Load: Get Absolute Last Context (No Date Filter)
    useEffect(() => {
        if (mode === 'create' && !initialData) {
            const fetchInitialContext = async () => {
                try {
                    const res = await fetch('/api/transaction/crusher/helper/last-context', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}) // Empty body = Absolute Last
                    });
                    const result = await res.json();

                    if (result.data) {
                        const ctx = result.data;

                        // Auto-fill Configuration Fields Only
                        // Auto-fill Configuration Fields Only
                        setFormData(prev => ({
                            ...prev,
                            // Date: If context has date, use it (Backlog entry flow). Else keep default (Today)
                            Date: ctx.Date ? new Date(ctx.Date).toISOString().split('T')[0] : prev.Date,
                            ShiftId: ctx.ShiftId || '',
                            ShiftInChargeId: ctx.ShiftInChargeId || '',
                            MidScaleInchargeId: ctx.MidScaleInchargeId || '',
                            ManPowerInShift: ctx.ManPowerInShift || '',

                            // RESET per User Request
                            PlantId: '',
                            EquipmentId: '',

                            ProductionUnitId: ctx.ProductionUnitId || 2,
                            TripQtyUnitId: ctx.TripQtyUnitId || 2,

                            // Reset Transactional Fields
                            BeltScaleOHMR: '', BeltScaleCHMR: '', ProductionQty: '',
                            NoofTrip: '', QtyTrip: '', TotalQty: '',
                            OHMR: '', CHMR: '', KWH: '', RunningHr: '',
                            TotalStoppageHours: '', Remarks: ''
                        }));

                        // Assuming Stoppages should be empty for new entry
                        setStoppages([]);

                        // Focus Plant
                        setTimeout(() => {
                            if (plantRef.current) plantRef.current.focus();
                        }, 100);
                    }
                } catch (err) {
                    console.error("Initial Context Error:", err);
                }
            };
            fetchInitialContext();
        }
    }, [mode, initialData]);

    // 3. Date Change: Get Date-Specific Context (Backtracking)
    useEffect(() => {
        if (mode === 'create' && formData.Date && !initialData) {
            const fetchDateContext = async () => {
                try {
                    const res = await fetch('/api/transaction/crusher/helper/last-context', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ Date: formData.Date })
                    });
                    const result = await res.json();

                    if (result.data) {
                        const ctx = result.data;
                        // Found data for this date -> Auto-fill
                        setFormData(prev => ({
                            ...prev,
                            ShiftId: ctx.ShiftId || '',
                            ShiftInChargeId: ctx.ShiftInChargeId || '',
                            MidScaleInchargeId: ctx.MidScaleInchargeId || '',
                            ManPowerInShift: ctx.ManPowerInShift || '',

                            // RESET per User Request
                            PlantId: '',
                            EquipmentId: '',

                            ProductionUnitId: ctx.ProductionUnitId || 2,
                            TripQtyUnitId: ctx.TripQtyUnitId || 2,
                            // Reset others
                            BeltScaleOHMR: '', BeltScaleCHMR: '', ProductionQty: '',
                            NoofTrip: '', QtyTrip: '', TotalQty: '', OHMR: '', CHMR: '', RunningHr: '', TotalStoppageHours: '', Remarks: ''
                        }));

                        // Focus Plant
                        setTimeout(() => {
                            if (plantRef.current) plantRef.current.focus();
                        }, 100);
                    } else {
                        // No data for this date -> Reset to Clean Slate (except Date)
                        setFormData(prev => ({
                            ...prev,
                            ShiftId: '', ShiftInChargeId: '', MidScaleInchargeId: '', PlantId: '', EquipmentId: '',
                            ProductionUnitId: 2, TripQtyUnitId: 2,
                            ManPowerInShift: '', BeltScaleOHMR: '', BeltScaleCHMR: '', ProductionQty: '',
                            NoofTrip: '', QtyTrip: '', TotalQty: '', OHMR: '', CHMR: '', RunningHr: '', TotalStoppageHours: '', Remarks: ''
                        }));
                    }
                } catch (err) {
                    console.error("Date Context Error:", err);
                }
            };

            // Debounce or direct? Direct is fine for Date change
            fetchDateContext();
        }
    }, [formData.Date, mode, initialData]);

    // 4. Trigger Table Refresh on Date Change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTableData();
        }, 300);
        return () => clearTimeout(timer);
        return () => clearTimeout(timer);
    }, [formData.Date, formData.ShiftId]); // Refresh table when Date/Shift changes

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
            ShiftId: '', ShiftInChargeId: '', MidScaleInchargeId: '', ManPowerInShift: '', PlantId: '',
            BeltScaleOHMR: '', BeltScaleCHMR: '', ProductionUnitId: 2, ProductionQty: '',
            EquipmentId: '', NoofTrip: '', QtyTrip: '', TripQtyUnitId: 2,
            TotalQty: '', OHMR: '', CHMR: '', RunningHr: '', TotalStoppageHours: '', Remarks: ''
        });
        setStoppages([]);
    };

    // Old fetchRecentData removed in favor of fetchTableData
    // Old checkDuplicate hook removed in favor of useEffect at line 253

    // Masters Loading
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
            if (Array.isArray(shiftData)) {
                const sList = [];
                shiftData.forEach(s => {
                    sList.push({ id: String(s.SlNo), name: s.ShiftName });
                    shiftMap.current[String(s.SlNo)] = s;
                });
                setShifts(sList);
            } else {
                setShifts([]);
            }

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
            // Relaxed Filter & Sort Alphabetically
            const reasons = Array.isArray(bdData)
                ? bdData.map(r => ({ id: String(r.SlNo), name: r.BDReasonName }))
                    .sort((a, b) => a.name.localeCompare(b.name))
                : [];
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
            const from = field === 'FromTime' ? value : newStoppages[index].FromTime;
            const to = field === 'ToTime' ? value : newStoppages[index].ToTime;

            if (from && to) {
                // Validation: To Time >= From Time
                const d1 = new Date(`2000-01-01T${from}`);
                const d2 = new Date(`2000-01-01T${to}`);
                let diffMs = d2 - d1;

                if (diffMs < 0) {
                    // If negative, it implies next day OR invalid. 
                    // User requirement: "To time is always greater then or equal".
                    // If it crosses midnight, it might be valid, but typically in shift entry it's same day logic unless specified.
                    // Assuming strict "To >= From" for now as per "To time is always greater then or equal(>=0)" request.
                    // Wait, if shift crosses midnight (10PM to 6AM), To < From is valid in real time but standard logic handles 24h wrapping. 
                    // Request says "To time is always greater then or equal". I will warn/error if To < From unless user handles crossover.
                    // Actually, I'll calculate positive duration (24h wrap) but Show minutes.
                    diffMs += 24 * 60 * 60 * 1000;
                }

                // Calculate Minutes
                const minutes = Math.round(diffMs / (1000 * 60));
                newStoppages[index].StoppageMinutes = minutes; // Store Minutes internally
                newStoppages[index].StoppageHours = (minutes / 60).toFixed(3); // Keep Hours for total calc/compatibility if needed, but display handles conversion
            }
        }
        setStoppages(newStoppages);

        // Total in Hours (Standard) or Minutes? User said "this applies to Total stoppages too". 
        // So I should calculate total MINUTES vs Hours.
        // Let's sum Minutes.
        const totalMinutes = newStoppages.reduce((sum, row) => sum + (parseFloat(row.StoppageMinutes) || 0), 0);

        // Update TotalStoppageHours field (which is displayed). 
        // I will string format it here? No, `TotalStoppageHours` is likely used in calculation logic (Production Qty etc? No, just display/save).
        // I'll store the numeric Hours for DB compatibility (e.g. 1.5) but formatting logic will happen at render?
        // Actually, user wants "if goes above 60 show it in hour".
        // I will update `TotalStoppageHours` state to be the DISPLAY STRING for now? 
        // OR keep it numeric and format in UI. 
        // Let's keep `TotalStoppageHours` as the numeric value (Hours) for consistency with DB, 
        // and add a display helper in the JSX.
        setFormData(prev => ({ ...prev, TotalStoppageHours: (totalMinutes / 60).toFixed(3) }));
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
                4: () => document.getElementById('belt-ohmr')?.focus(), // Plant -> OHMR (Belt) - Need ID
                5: () => document.getElementById('belt-chmr')?.focus(), // OHMR -> CHMR (Belt) - Need ID
                6: () => haulerRef.current && haulerRef.current.focus(), // CHMR -> Hauler
                7: () => document.getElementById('notrip-input')?.focus(), // Hauler -> No of Trip
                10: () => document.getElementById('qtytrip-input')?.focus(), // No of Trip -> Qty/Trip
                11: () => document.getElementById('hauler-ohmr')?.focus(), // Qty/Trip -> Hauler OHMR (Jump to Row 4)
                12: () => document.getElementById('hauler-chmr')?.focus(), // Hauler OHMR -> Hauler CHMR
                13: () => document.getElementById('add-stoppage-btn')?.focus(), // Hauler CHMR -> Add Stoppage (KWH removed)
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
            fetchTableData();
        }
    };

    // Global Key Listener for F2/F5
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                if (!loading) handleSave(); // Check loading here too
            }
            if (e.key === 'F5') { e.preventDefault(); fetchTableData(); }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [formData, stoppages, loading]); // Added loading dependency


    const validate = () => {
        const newErrors = {};
        if (!formData.Date) newErrors.Date = 'Required';
        if (!formData.ShiftId) newErrors.ShiftId = 'Required';
        if (!formData.PlantId) newErrors.PlantId = 'Required';
        if (!formData.ShiftInChargeId) newErrors.ShiftInChargeId = 'Required';
        if (!formData.EquipmentId) newErrors.EquipmentId = 'Required';

        // Stoppages validation
        const shift = shiftMap.current[formData.ShiftId];

        for (const st of stoppages) {
            if (!st.StoppageId) {
                toast.error("Stoppage Reason is required for all rows");
                return false;
            }
            if (st.FromTime && st.ToTime && st.FromTime > st.ToTime) {
                // Allow crossing midnight ONLY if shift confirms it? 
                // User said "To time is always greater then or equal".
                // I'll block it for now unless specific requirement comes.
                toast.error(`Invalid Stoppage: To Time (${st.ToTime}) must be >= From Time (${st.FromTime})`);
                return false;
            }

            // Shift Boundary Check
            if (shift && shift.FromTime && shift.ToTime) {
                const sStart = formatTimeForInput(shift.FromTime);
                const sEnd = formatTimeForInput(shift.ToTime);

                const checkTime = (t) => {
                    if (sStart <= sEnd) return t >= sStart && t <= sEnd;
                    return t >= sStart || t <= sEnd; // Night logic
                };

                if (!checkTime(st.FromTime) || !checkTime(st.ToTime)) {
                    toast.error(`Stoppage time ${st.FromTime}-${st.ToTime} is outside Shift hours (${sStart}-${sEnd})`);
                    return false;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (isSavingRef.current) return;

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

        isSavingRef.current = true;
        setLoading(true);

        try {
            if (mode === 'create') {
                try {
                    const dupRes = await fetch('/api/transaction/crusher/check-duplicate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ Date: formData.Date, ShiftId: formData.ShiftId, PlantId: formData.PlantId, EquipmentId: formData.EquipmentId })
                    });
                    const dupData = await dupRes.json();
                    if (dupData.exists) {
                        toast.error("Duplicate Entry!");
                        setLoading(false);
                        isSavingRef.current = false;
                        return;
                    }
                } catch (e) { console.error(e); }
            }

            const url = mode === 'create' ? '/api/transaction/crusher/create' : `/api/transaction/crusher/${initialData.SlNo}`;
            const method = mode === 'create' ? 'POST' : 'PUT';

            if (!userId) {
                toast.error("User session missing");
                setLoading(false);
                isSavingRef.current = false;
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
                    // Keep Date, Shift, Incharges, ManPower
                    // Reset Others
                    PlantId: '', EquipmentId: '',
                    BeltScaleOHMR: '', BeltScaleCHMR: '', ProductionUnitId: 2, ProductionQty: '',
                    NoofTrip: '', QtyTrip: '', TripQtyUnitId: 2,
                    TotalQty: '', OHMR: '', CHMR: '', KWH: '', RunningHr: '', TotalStoppageHours: '', Remarks: ''
                }));
                setStoppages([]);
                fetchTableData();

                // Focus Plant
                setTimeout(() => {
                    if (plantRef.current) plantRef.current.focus();
                }, 100);
            } else {
                router.push('/dashboard/transaction/crusher');
            }
        } catch (err) {
            toast.error(err.message || "Save Failed");
        } finally {
            setLoading(false);
            isSavingRef.current = false;
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await fetch(`/api/transaction/crusher/${id}`, { method: 'DELETE' });
            toast.success("Record deleted");
            fetchTableData();
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
                <button onClick={() => router.push('/dashboard/transaction/crusher')} className={css.backBtn}>
                    <ArrowLeft size={16} /> Back
                </button>
                <h1 className={css.title}>{mode === 'create' ? 'Create Crusher Entry' : 'Update Crusher Entry'}</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleReset} className={css.refreshBtn} title="(Esc) Reset Form" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px' }}>
                        <RotateCcw size={20} />
                    </button>
                    <button onClick={handleSave} disabled={loading} className={css.saveBtn} title="(F2) Save Record">
                        {loading ? 'Saving...' : (mode === 'create' ? 'Save (F2)' : 'Update (F2)')}
                    </button>
                </div>
            </div>

            {/* Form - 8 Column Grid - Updated Layout */}
            <div className={css.crusherGrid} ref={formRef}>

                {/* --- Row 1 --- */}
                {/* Date: C1 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Date<span className={css.required}>*</span></label>
                    <input ref={dateRef} type="date" className={css.input} style={errors.Date ? { border: '1px solid red' } : {}} value={formData.Date} max={new Date().toISOString().split('T')[0]} onChange={e => handleChange('Date', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 0)} />
                    {errors.Date && <span style={{ color: 'red', fontSize: '10px' }}>missing value</span>}
                </div>

                {/* Shift: C2 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Shift<span className={css.required}>*</span></label>
                    <SearchableSelect options={shifts} value={formData.ShiftId} onChange={(e) => handleChange('ShiftId', e.target.value)} placeholder="Shift" className={css.compactInput} name="ShiftId" error={errors.ShiftId} />
                    {errors.ShiftId && <span style={{ color: 'red', fontSize: '10px' }}>missing value</span>}
                </div>

                {/* Incharge (Large-Scale): C3 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Shift In Charge (Large)<span className={css.required}>*</span></label>
                    <SearchableSelect
                        options={operators}
                        value={formData.ShiftInChargeId}
                        onChange={(e) => handleChange('ShiftInChargeId', e.target.value)}
                        placeholder="Select..."
                        className={css.compactInput}
                        name="ShiftInChargeId"
                        error={errors.ShiftInChargeId}
                    />
                    {errors.ShiftInChargeId && <span style={{ color: 'red', fontSize: '10px' }}>missing value</span>}
                </div>

                {/* Incharge (Mid-Scale): C4 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Shift In Charge (Mid)</label>
                    <SearchableSelect
                        options={operators}
                        value={formData.MidScaleInchargeId}
                        onChange={(e) => handleChange('MidScaleInchargeId', e.target.value)}
                        placeholder="Select..."
                        className={css.compactInput}
                        name="MidScaleInchargeId"
                    />
                </div>

                {/* Manpower: C5 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Manpower</label>
                    <input type="number" step="1" className={css.input} value={formData.ManPowerInShift} onChange={e => handleChange('ManPowerInShift', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 3)} />
                </div>

                {/* Plant: C6 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Plant<span className={css.required}>*</span></label>
                    <SearchableSelect
                        ref={plantRef}
                        options={plants}
                        value={formData.PlantId}
                        onChange={(e) => {
                            handleChange('PlantId', e.target.value);
                            // Auto-focus OHMR after selection if single select
                            document.getElementById('belt-ohmr')?.focus();
                        }}
                        placeholder="Plant"
                        className={css.compactInput}
                        name="PlantId"
                        error={errors.PlantId}
                    />
                    {errors.PlantId && <span style={{ color: 'red', fontSize: '10px' }}>missing value</span>}
                </div>



                {/* --- Row 2 --- */}
                {/* OHMR (Belt): C1 */}
                <div className={css.fieldGroup} style={{ gridColumn: '1 / span 1' }}>
                    <label className={css.label}>OHMR (Belt Scale)</label>
                    <input id="belt-ohmr" type="number" step="0.001" className={css.input} value={formData.BeltScaleOHMR} onChange={e => handleChange('BeltScaleOHMR', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 5)} />
                </div>

                {/* CHMR (Belt): C2 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>CHMR (Belt Scale)</label>
                    <input id="belt-chmr" type="number" step="0.001" className={css.input} value={formData.BeltScaleCHMR} onChange={e => handleChange('BeltScaleCHMR', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 6)} />
                </div>

                {/* Production Qty: C3 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Production Qty</label>
                    <input type="number" step="0.001" className={`${css.input} ${css.readOnly}`} value={formData.ProductionQty} readOnly />
                </div>

                {/* Unit: C4 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Unit</label>
                    <SearchableSelect options={units} value={formData.ProductionUnitId} onChange={(e) => handleChange('ProductionUnitId', e.target.value)} placeholder="Unit" className={css.compactInput} name="ProductionUnitId" />
                </div>



                {/* --- Row 3 --- */}
                {/* Hauler: C1-C2 (Span 2) */}
                <div className={css.fieldGroup} style={{ gridColumn: '1 / span 2' }}>
                    <label className={css.label}>Hauler<span className={css.required}>*</span></label>
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

                {/* No of Trip: C3 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>No of Trip</label>
                    <input id="notrip-input" type="number" step="1" className={css.input} value={formData.NoofTrip} onChange={e => handleChange('NoofTrip', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 10)} />
                </div>

                {/* Qty/Trip: C4 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Qty/Trip</label>
                    <input id="qtytrip-input" type="number" step="0.001" className={css.input} value={formData.QtyTrip} onChange={e => handleChange('QtyTrip', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 11)} />
                </div>

                {/* Unit: C5 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Unit</label>
                    <SearchableSelect options={units} value={formData.TripQtyUnitId} onChange={(e) => handleChange('TripQtyUnitId', e.target.value)} placeholder="Unit" className={css.compactInput} name="TripQtyUnitId" />
                </div>

                {/* Total Qty: C6 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Total Qty</label>
                    <input type="number" step="0.001" className={`${css.input} ${css.readOnly}`} value={formData.TotalQty} readOnly />
                </div>



                {/* --- Row 4 --- */}
                {/* OHMR: C1 */}
                <div className={css.fieldGroup} style={{ gridColumn: '1 / span 1' }}>
                    <label className={css.label}>OHMR</label>
                    <input id="hauler-ohmr" type="number" step="0.001" className={css.input} value={formData.OHMR} onChange={e => handleChange('OHMR', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 12)} />
                </div>

                {/* CHMR: C2 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>CHMR</label>
                    <input id="hauler-chmr" type="number" step="0.001" className={css.input} value={formData.CHMR} onChange={e => handleChange('CHMR', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 13)} />
                </div>

                {/* Running Hr: C3 */}
                <div className={`${css.fieldGroup} ${css.colSpan1}`}>
                    <label className={css.label}>Running Hr</label>
                    <input type="number" step="0.001" className={`${css.input} ${css.readOnly}`} value={formData.RunningHr} readOnly />
                </div>

                {/* --- Row 5: Stoppages --- */}
                <div className={css.dataTableSection} style={{ gridColumn: '1 / -1', marginTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <div className={css.header} style={{ borderBottom: 'none', paddingBottom: '10px' }}>
                        <h3 className={css.tableTitle}>
                            Stoppages
                            <span style={{ fontSize: '13px', fontWeight: 'normal', marginLeft: '10px', color: '#555' }}>
                                {(() => {
                                    if (!formData.ShiftId) return '';
                                    const s = shiftMap.current[String(formData.ShiftId)];
                                    if (s && s.FromTime && s.ToTime) {
                                        const start = formatTimeForInput(s.FromTime);
                                        const end = formatTimeForInput(s.ToTime);
                                        return `[ Shift Time: ${start} - ${end} ]`;
                                    }
                                    return '';
                                })()}
                            </span>
                        </h3>
                        <div className={css.label} style={{ fontSize: '12px' }}>
                            Total Duration: {(() => {
                                const totalHrs = parseFloat(formData.TotalStoppageHours) || 0;
                                const totalMins = Math.round(totalHrs * 60);
                                if (totalMins < 60) return `${totalMins} Minutes`;
                                return `${totalHrs.toFixed(2)} Hours`;
                            })()}
                        </div>
                    </div>

                    <div style={{ /* overflowX: 'auto' removed */ }}>
                        <table className={css.accTable} id="stoppage-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '15%' }}>From Time</th>
                                    <th style={{ width: '15%' }}>To Time</th>
                                    <th style={{ width: '25%' }}>Reason</th>
                                    <th style={{ width: '10%' }}>Duration</th>
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
                                            <input
                                                id={`stop-hours-${index}`}
                                                type="text"
                                                value={(() => {
                                                    const mins = row.StoppageMinutes || Math.round((parseFloat(row.StoppageHours) || 0) * 60);
                                                    if (!mins) return '';
                                                    if (mins < 60) return `${mins} Mins`;
                                                    return `${(mins / 60).toFixed(2)} Hrs`;
                                                })()}
                                                className={`${css.input} ${css.readOnly}`}
                                                readOnly
                                            />
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
                        <button id="add-stoppage-btn" type="button" onClick={addStoppageRow} className={css.addBtn} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Plus size={14} /> Add Row
                        </button>
                    </div>
                </div>



                {/* --- Row 6: Remarks --- */}
                {/* Remarks: Span 6 */}
                <div className={css.fieldGroup} style={{ gridColumn: 'span 6' }}>
                    <label className={css.label}>Remarks</label>
                    <input
                        type="text"
                        className={css.input}
                        value={formData.Remarks}
                        onChange={e => handleChange('Remarks', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 20)}
                    />
                </div>

            </div>    {/* Actions Removed from bottom - Moved to Header */}



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
                {/* Load More Button */}
                {recentData.length > 0 && hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '20px' }}>
                        <button
                            type="button"
                            onClick={() => fetchTableData(true)}
                            disabled={tableLoading}
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
                            {tableLoading ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
}
