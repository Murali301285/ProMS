'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import styles from './TransactionForm.module.css';
import SearchableSelect from './SearchableSelect';
import TransactionTable from './TransactionTable';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';

/* Utility for Decimal Rounding */
const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export default function EquipmentReadingForm({ isEdit = false, initialData = null }) {
    const router = useRouter();

    // --- State ---
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null); // Added User State
    const [isContextLocked, setIsContextLocked] = useState(true); // Context Locking State (Default True)
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for History Refresh
    const [options, setOptions] = useState({
        shifts: [],
        relays: [],
        activities: [],
        equipments: [], // Full list
        operatorsIncharge: [],
        operatorsDriver: [],
        sectors: [],
        patches: [],
        methods: []
    });

    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        Date: today,
        ShiftId: '',
        ShiftInchargeId: '', // Single Value
        MidScaleInchargeId: '', // Single Value
        RelayId: '',

        ActivityId: '',
        EquipmentId: '',
        OperatorId: '', // Single string instead of array

        // HMR
        OHMR: '',
        CHMR: '',
        NetHMR: '',

        // KMR
        OKMR: '',
        CKMR: '',
        NetKMR: '',

        // Hours
        DevelopmentHrMining: '',
        FaceMarchingHr: '',
        DevelopmentHrNonMining: '',
        BlastingMarchingHr: '',
        RunningBDMaintenanceHr: '',

        // Calculated
        TotalWorkingHr: '',
        BDHr: '',
        MaintenanceHr: '',
        IdleHr: '',

        // Details
        SectorId: '',
        PatchId: '',
        MethodId: '',
        Remarks: ''
    });

    // Validations & Errors
    const [errors, setErrors] = useState({});

    // Current User ID (for Context Loading)
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState('');

    // Derived State: Is Detail Activity?
    const isDetailActivity = useMemo(() => {
        if (!formData.ActivityId) return false;
        // Fix: Use 'id' instead of 'value' as options map was updated to {id, name}
        const act = options.activities.find(a => a.id == formData.ActivityId);
        return act ? act.isDetail : false;
    }, [formData.ActivityId, options.activities]);

    // Derived State: Is Loading Activity? (Special Case: Show Sector + Patch + Method)
    const isLoadingActivity = useMemo(() => {
        if (!formData.ActivityId) return false;
        const act = options.activities.find(a => a.id == formData.ActivityId);
        return act ? act.name.toLowerCase().includes('loading') : false;
    }, [formData.ActivityId, options.activities]);

    // Derived State: Filtered Equipments
    const filteredEquipments = useMemo(() => {
        if (!formData.ActivityId) return [];
        return options.equipments.filter(e => e.ActivityId == formData.ActivityId);
    }, [formData.ActivityId, options.equipments]);


    // --- SMART CONTEXT LOGIC ---
    // Ref to track parameters to prevent duplicate calls if needed
    // const prevParams = useRef({ date: formData.Date, shift: formData.ShiftId });

    useEffect(() => {
        const fetchContext = async () => {
            // Run when Date OR Shift is present. If Shift is empty, we might not want to run? 
            // Logic: "If you select a Date & Shift for which..." -> So we need Shift.
            // Run when Date OR Shift is present.
            // If Shift is empty (cleared by user), we should RESET the form to clear stale context.
            if (!formData.ShiftId) {
                // Reset Fields (Logic matched with "No Data Found" else block below)
                // STRICT LOCK: Always Locked (Empty)
                setIsContextLocked(true);
                setFormData(prev => ({
                    ...prev,
                    // Keep Date (Shift is already empty in formData if this triggers)
                    ShiftInchargeId: '', MidScaleInchargeId: '', RelayId: '',
                    ActivityId: '', EquipmentId: '', OperatorId: '',
                    OHMR: '', CHMR: '', NetHMR: '', OKMR: '', CKMR: '', NetKMR: '',
                    DevelopmentHrMining: '', FaceMarchingHr: '', DevelopmentHrNonMining: '', BlastingMarchingHr: '', RunningBDMaintenanceHr: '',
                    TotalWorkingHr: '', BDHr: '', MaintenanceHr: '', IdleHr: '',
                    SectorId: '', PatchId: '', MethodId: '', Remarks: ''
                }));
                return;
            }

            if (isEdit) return;

            // Only run if Date actually changed or is initial mount check
            // Note: formData.Date is init to today.

            try {
                // Get User ID (localStorage)
                let currentUserId = 0;
                const userStr = localStorage.getItem('user');
                if (userStr) currentUserId = JSON.parse(userStr).id;

                const res = await fetch('/api/transaction/equipment-reading/helper/last-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: formData.Date, ShiftId: formData.ShiftId })
                }).then(r => r.json());

                if (res.success && res.data) {
                    const ctx = res.data;
                    const newDate = ctx.Date ? new Date(ctx.Date).toISOString().split('T')[0] : '';
                    const isDefaultDate = formData.Date === new Date().toISOString().split('T')[0];

                    toast.info(`Auto-filled from ${ctx.SourceOfContext || 'History'}`, { id: 'ctx-load-er' });

                    const isFallback = ctx.SourceOfContext === 'LoadingFallback';

                    setFormData(prev => ({
                        ...prev,
                        Date: (isDefaultDate && newDate) ? newDate : (prev.Date || newDate),
                        ShiftId: ctx.ShiftId || prev.ShiftId,
                        ShiftInchargeId: ctx.ShiftInchargeId || '',
                        MidScaleInchargeId: ctx.MidScaleInchargeId || '',
                        RelayId: ctx.RelayId || '',
                        // If Fallback (Mines), Activity remains empty. If History, pre-load it.
                        ActivityId: isFallback ? '' : (ctx.ActivityId || ''),

                        // REST OF FIELDS: RESET TO DEFAULT/EMPTY
                        EquipmentId: '',
                        OperatorId: '',
                        OHMR: '', CHMR: '', NetHMR: '', OKMR: '', CKMR: '', NetKMR: '',
                        DevelopmentHrMining: '', FaceMarchingHr: '', DevelopmentHrNonMining: '', BlastingMarchingHr: '',
                        RunningBDMaintenanceHr: '', TotalWorkingHr: '', BDHr: '', MaintenanceHr: '', IdleHr: '',
                        SectorId: '', PatchId: '', MethodId: '', Remarks: ''
                    }));

                    // Focus Logic
                    setTimeout(() => {
                        if (isFallback) {
                            // If Fallback, Start at Activity
                            if (activityRef.current) activityRef.current.focus();
                        } else {
                            // If History (Activity Pre-filled), Go to Equipment
                            if (equipmentRef.current) equipmentRef.current.focus();
                        }
                    }, 100);

                    // Context Locking: STRICT LOCK (Data Found)
                    setIsContextLocked(true);

                } else {
                    // Reset Logic: If No Data Found for this Date/Shift
                    toast.info("No context found. Resetting fields.");

                    // STRICT LOCK (No Data)
                    setIsContextLocked(true);

                    setFormData(prev => ({
                        ...prev,
                        // Keep Date & Shift
                        ShiftInchargeId: '', MidScaleInchargeId: '', RelayId: '',
                        ActivityId: '', EquipmentId: '', OperatorId: '',
                        OHMR: '', CHMR: '', NetHMR: '', OKMR: '', CKMR: '', NetKMR: '',
                        DevelopmentHrMining: '', FaceMarchingHr: '', DevelopmentHrNonMining: '', BlastingMarchingHr: '', RunningBDMaintenanceHr: '',
                        TotalWorkingHr: '', BDHr: '', MaintenanceHr: '', IdleHr: '',
                        SectorId: '', PatchId: '', MethodId: '', Remarks: ''
                    }));

                    // Focus Incharge? No, maybe focus Shift or just leave it.
                }
            } catch (e) { console.error(e); }
        };

        fetchContext();
        // prevDateRef.current = formData.Date; // Removed ref

    }, [formData.Date, formData.ShiftId]);
    // Note: Dependencies need to be careful. If I add isEdit, make sure it doesn't loop.

    // Ref for focus management
    const activityRef = useRef(null);
    const equipmentRef = useRef(null);
    const saveBtnRef = useRef(null);
    const remarksRef = useRef(null);

    // --- 1. Init Data Loading ---
    useEffect(() => {
        async function loadMasters() {
            setLoading(true);
            try {
                // Fetch User
                const userRes = await fetch('/api/auth/me').then(r => r.json());
                setUserId(userRes.user?.id || 1);
                setUserRole(userRes.user?.role || '');
                if (userRes.user) setUser(userRes.user);

                // Fetch Masters
                // V18.1: Enable includeInactive to ensure old records map correctly
                const ddlOptions = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
                const fetchDDL = (body) => fetch('/api/settings/ddl', { ...ddlOptions, body: JSON.stringify({ ...body, includeInactive: true }) }).then(r => r.json());

                const [shifts, relays, activities, equipments, opIncharge, opDriver, sectors, patches, methods] = await Promise.all([
                    fetchDDL({ table: 'shift', nameField: 'ShiftName', valueField: 'SlNo', additionalColumns: ['FromTime', 'ToTime'] }),
                    fetchDDL({ table: 'relay', nameField: 'Name', valueField: 'SlNo' }),
                    fetchDDL({ table: 'activity', nameField: 'Name', valueField: 'SlNo', additionalColumns: ['IsDetail'] }),
                    fetchDDL({ table: 'equipment', nameField: 'EquipmentName', valueField: 'SlNo', additionalColumns: ['ActivityId'] }),
                    // Operators: SubCat 1 (Incharge), SubCat 2 (Driver)
                    // V18.2: Use 'SlNo' (PK) for value. V18.3: Fetch 'OperatorId' (Code) for display.
                    fetchDDL({ table: 'operator', nameField: 'OperatorName', valueField: 'SlNo', filter: { SubCategoryId: 1 }, additionalColumns: ['OperatorId'] }),
                    fetchDDL({ table: 'operator', nameField: 'OperatorName', valueField: 'SlNo', filter: { SubCategoryId: 2 }, additionalColumns: ['OperatorId'] }),

                    fetchDDL({ table: 'sector', nameField: 'SectorName', valueField: 'SlNo' }),
                    fetchDDL({ table: 'patch', nameField: 'Name', valueField: 'SlNo' }),
                    fetchDDL({ table: 'method', nameField: 'Name', valueField: 'SlNo' }),
                ]);

                // Helper to format Time (Raw)
                const formatTime = (t) => {
                    if (!t) return '';
                    // V18.1: Raw String Display (No Timezone Conversion)
                    // Expecting ISO string like "1970-01-01T06:00:00.000Z" -> "06:00"
                    if (typeof t === 'string' && t.includes('T')) {
                        return t.split('T')[1].substring(0, 5);
                    }
                    return String(t).substring(0, 5); // Fallback
                };

                // Dedup Helper
                const uniqueBy = (arr, key) => {
                    const seen = new Set();
                    return arr.filter(item => {
                        const val = item[key];
                        if (seen.has(val)) return false;
                        seen.add(val);
                        return true;
                    });
                };

                // V18.3: Show Name (Code) e.g., "Murali (JHE40)"
                const formattedIncharge = uniqueBy(opIncharge, 'id').map(s => ({ id: s.id, name: `${s.name} (${s.OperatorId || s.id})` }));
                // Reuse same pool for both if relevant, or fetch separately if they are distinct categories. 
                // Assuming same 'Incharge' pool for both Large and Mid scale for now.

                const formattedDriver = uniqueBy(opDriver, 'id').map(s => ({ id: s.id, name: `${s.name} (${s.OperatorId || s.id})` }));

                setOptions({
                    shifts: shifts.map(s => ({
                        id: s.id,
                        name: s.name
                    })),
                    relays: relays.map(s => ({ id: s.id, name: s.name })),
                    activities: activities.map(s => ({ id: s.id, name: s.name, isDetail: s.IsDetail })),
                    equipments: equipments.map(s => ({ id: s.id, name: s.name, ActivityId: s.ActivityId })),
                    // Update V10/V11: Name format "Name (Id)"
                    operatorsIncharge: formattedIncharge,
                    operatorsDriver: formattedDriver,
                    sectors: sectors.map(s => ({ id: s.id, name: s.name })),
                    patches: patches.map(s => ({ id: s.id, name: s.name })),
                    methods: methods.map(s => ({ id: s.id, name: s.name })),
                });
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load master data");
                setLoading(false);
            }
        }
        loadMasters();

        // 1.1 Initial Context Load (Pre-Fill Form with Last Entry)
        async function loadInitialContext() {
            if (isEdit || initialData) return;

            try {
                // Determine if we should look for specific params? No, just get the very last entry.
                // We'll use the same endpoint but without strict filters if supported, or a new 'last-entry-info' logic?
                // The current 'last-context' API requires Date/Shift to be specific? 
                // Let's check api logic. If I send nothing, what does it do?
                // It likely needs params.
                // Reverting to: '/api/transaction/equipment-reading/helper/last-entry-info' (If exists? No, I need to check).
                // Assuming it's similar to LoadingFromMines.

                // Let's use the 'main' context endpoint but we need a way to get "Latest" regardless of date.
                // Actually, let's use the same behavior as LoadingFromMines which uses 'last-context' passing nothing?
                // No, LoadingFromMines uses 'last-entry-info' for the label, but 'last-context' for auto-fill.

                // USER REQUEST: "Initial loading -> load the last date, shift, incharges, relay, activity"
                // Implementation: Fetch the absolutely last entered record by this user (or globally?) and fill it.

                const res = await fetch('/api/transaction/equipment-reading/helper/last-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}) // No Filters -> Should return latest? Need to verify API.
                }).then(r => r.json());

                if (res.success && res.data) {
                    const ctx = res.data;
                    const newDate = ctx.Date ? new Date(ctx.Date).toISOString().split('T')[0] : today;

                    // Set Form Data
                    setFormData(prev => ({
                        ...prev,
                        Date: newDate,
                        ShiftId: ctx.ShiftId || '',
                        ShiftInchargeId: ctx.ShiftInchargeId || '',
                        MidScaleInchargeId: ctx.MidScaleInchargeId || '',
                        RelayId: ctx.RelayId || '',
                        ActivityId: ctx.ActivityId || '',

                        // Note: We don't fetch equipment/meters here, user flows: Date/Shift -> Context -> Activity -> Equipment
                    }));

                    // Focus Equipment?
                    setTimeout(() => {
                        if (equipmentRef.current) equipmentRef.current.focus();
                    }, 500); // Slight delay for rendering
                }
            } catch (e) { console.error(e); }
        }

        // Trigger if not Edit
        if (!isEdit) loadInitialContext();

    }, [isEdit, initialData]);

    // --- 1.1 Populate Form Data (Separate Effect) ---
    useEffect(() => {
        if (isEdit && initialData) {
            // Populate Form for Edit
            // V16: Sanitize nulls to empty strings to avoid React 'uncontrolled to controlled' error
            const safeData = { ...initialData };

            Object.keys(safeData).forEach(key => {
                if (safeData[key] === null) safeData[key] = '';
            });

            // Convert OperatorId array format to single string if it was saved as array (retro-compatibility)
            let parsedOperator = safeData.OperatorId || '';
            if (Array.isArray(parsedOperator) && parsedOperator.length > 0) {
                parsedOperator = String(parsedOperator[0]);
            } else if (typeof parsedOperator === 'string' && parsedOperator.includes(',')) {
                parsedOperator = parsedOperator.split(',')[0].trim();
            } else if (typeof parsedOperator === 'number') {
                parsedOperator = String(parsedOperator);
            }

            setFormData({
                ...safeData,
                ShiftInchargeId: safeData.ShiftInchargeId || '',
                MidScaleInchargeId: safeData.MidScaleInchargeId || '',
                OperatorId: parsedOperator
            });
        }
    }, [isEdit, initialData]);





    // --- 3. Meter Reading Fetch ---
    useEffect(() => {
        if (isEdit) return;

        if (!formData.EquipmentId) {
            setFormData(prev => ({
                ...prev,
                OHMR: '',
                OKMR: '',
                NetHMR: (prev.CHMR ? '' : prev.NetHMR), // Also clear net hmr/kmr if they depended on it
                NetKMR: (prev.CKMR ? '' : prev.NetKMR)
            }));
            return;
        }

        const loadReadings = async () => {
            try {
                const res = await fetch('/api/transaction/helper/last-meter-reading', {
                    method: 'POST',
                    body: JSON.stringify({ equipmentId: formData.EquipmentId })
                }).then(r => r.json());

                if (res.success && res.data) {
                    setFormData(prev => ({
                        ...prev,
                        OHMR: res.data.OHMR || '',
                        OKMR: res.data.OKMR || ''
                    }));
                } else {
                    // Leave empty if no data found
                    setFormData(prev => ({ ...prev, OHMR: '', OKMR: '' }));
                }
            } catch (e) { console.error(e); }
        };
        loadReadings();
    }, [formData.EquipmentId, isEdit]);


    // --- 4. Calculations ---
    useEffect(() => {
        setFormData(prev => {
            let updates = {};

            // HMR
            const chmr = parseFloat(prev.CHMR) || 0;
            const ohmr = parseFloat(prev.OHMR) || 0;
            // Only calc if both present (or CHMR present)
            if (prev.CHMR && prev.OHMR) {
                updates.NetHMR = round2(chmr - ohmr);
            } else if (!prev.CHMR) {
                updates.NetHMR = '';
            }

            // KMR
            const ckmr = parseFloat(prev.CKMR) || 0;
            const okmr = parseFloat(prev.OKMR) || 0;
            if (prev.CKMR && prev.OKMR) {
                // Fixed Validation: Net KMR never < 0 ?? Form should prevent save, but calc allows display?
                // "highlight via validation" -> We calculate normally, validate on save/render.
                updates.NetKMR = round2(ckmr - okmr);
            } else if (!prev.CKMR) {
                updates.NetKMR = ''; // Clear if CKMR cleared
            }

            // Total Working Hr
            // Formula: Net HMR - (Running BD/Maintenance Hr + {Dev. Hr (Mining) + Face Marching Hr + Dev. Hr (Non Mining) + Blasting Marching Hr})
            // Only subtract Details if Visible (IsDetail=0)
            const netHmr = parseFloat(updates.NetHMR || prev.NetHMR) || 0;
            const runBd = parseFloat(prev.RunningBDMaintenanceHr) || 0;

            let deduction = runBd;

            // If Detail=0 (Mining Visible), add those
            // Wait, logic check: 
            // "visible -> if IsDetail = 0"
            if (!isDetailActivity) {
                deduction += (parseFloat(prev.DevelopmentHrMining) || 0);
                // deduction += (parseFloat(prev.FaceMarchingHr) || 0); // V19.2: Removed per request
                deduction += (parseFloat(prev.DevelopmentHrNonMining) || 0);
                deduction += (parseFloat(prev.BlastingMarchingHr) || 0);
            }

            // Only calc if NetHMR is valid
            if ((updates.NetHMR || prev.NetHMR) !== '') {
                updates.TotalWorkingHr = round2(netHmr - deduction);
            } else {
                updates.TotalWorkingHr = '';
            }

            // Idle Hr
            // Formula: 8 - (Total Working Hr + BD Hr + Maintenance Hr)
            const totalWork = parseFloat(updates.TotalWorkingHr || prev.TotalWorkingHr) || 0;
            const bd = parseFloat(prev.BDHr) || 0;
            const maint = parseFloat(prev.MaintenanceHr) || 0;

            if ((updates.TotalWorkingHr || prev.TotalWorkingHr) !== '') {
                updates.IdleHr = round2(8 - (totalWork + bd + maint));
            } else {
                updates.IdleHr = '';
            }

            return { ...prev, ...updates };
        });
    }, [
        formData.CHMR, formData.OHMR,
        formData.CKMR, formData.OKMR,
        formData.RunningBDMaintenanceHr,
        formData.DevelopmentHrMining, formData.FaceMarchingHr, formData.DevelopmentHrNonMining, formData.BlastingMarchingHr,
        formData.BDHr, formData.MaintenanceHr,
        isDetailActivity
    ]);


    // --- 5. Validation & Submit ---
    const validate = () => {
        let errs = {};
        const REQ_MSG = "Value required"; // V19 Standard Message

        // 1. Header (Mandatory)
        if (!formData.Date) errs.Date = REQ_MSG;
        if (!formData.ShiftId) errs.ShiftId = REQ_MSG;
        if (!formData.ShiftInchargeId) errs.ShiftInchargeId = REQ_MSG;
        if (!formData.MidScaleInchargeId) errs.MidScaleInchargeId = REQ_MSG;
        if (!formData.RelayId) errs.RelayId = REQ_MSG;

        // 2. Context (Mandatory)
        if (!formData.ActivityId) errs.ActivityId = REQ_MSG;
        if (!formData.EquipmentId) errs.EquipmentId = REQ_MSG;
        if (!formData.OperatorId) errs.OperatorId = REQ_MSG;

        // 3. HMR (Mandatory)
        if (formData.OHMR === '') errs.OHMR = REQ_MSG;
        if (formData.CHMR === '') errs.CHMR = REQ_MSG;

        // HMR Logic
        const netHmr = parseFloat(formData.NetHMR);

        if (!isNaN(netHmr)) {
            if (netHmr < 0) {
                errs.NetHMR = "Cannot be negative";
                toast.error("Net HMR cannot be negative!");
            } else if (netHmr > 8) {
                errs.NetHMR = "Cannot exceed 8 Hrs";
                toast.error(`Net HMR (${netHmr}) cannot be more than 8 Hours in a single shift!`);
            }
        }

        // CHMR Checks
        if (parseFloat(formData.CHMR) < parseFloat(formData.OHMR)) errs.CHMR = "Must be >= OHMR";

        // 4. KMR (Mandatory if Visible/Applicable)
        if (isDetailActivity) {
            if (formData.OKMR === '') errs.OKMR = REQ_MSG;
            if (formData.CKMR === '') errs.CKMR = REQ_MSG;

            // KMR Logic
            if (parseFloat(formData.NetKMR) < 0) {
                errs.NetKMR = "Cannot be negative";
                toast.error("Net KMR cannot be negative!");
            }
            if (parseFloat(formData.CKMR) < parseFloat(formData.OKMR)) {
                errs.CKMR = "Must be >= OKMR";
            }
        }

        // 5. Others (Dev Hr, BD, Maint) -> NON MANDATORY per User Request V19
        // Explicitly optional: DevelopmentHrMining, FaceMarchingHr, etc.
        // Explicitly optional: RunningBDMaintenanceHr, BDHr, MaintenanceHr

        // 6. Critical Safety (Block Save if Calculation Logic Failure)
        if (parseFloat(formData.TotalWorkingHr) < 0) {
            errs.TotalWorkingHr = "Total Working Hr cannot be negative!";
            toast.error("Check Calculation: Total Working Hr < 0");
        }
        if (parseFloat(formData.IdleHr) < 0) {
            errs.IdleHr = "Idle Hr cannot be negative! (Check inputs)";
            toast.error("Check Calculation: Idle Hr < 0");
        }

        if (Object.keys(errs).length > 0) {
            console.log("Validation Errors:", errs);
            console.log("FormData at Validation:", formData);
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };


    const handleSubmit = async () => {
        if (!validate()) {
            toast.warning("Please check errors");
            return;
        }

        setLoading(true);
        try {
            // Duplicate Check (Add Mode)
            if (!isEdit) {
                const dupRes = await fetch('/api/transaction/helper/check-duplicate-equipment', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                }).then(r => r.json());

                if (dupRes.exists) {
                    toast.error("Duplicate Entry: This Equipment already has an entry for this Date & Shift.");
                    setLoading(false);
                    return;
                }
            }

            const url = isEdit
                ? `/api/transaction/equipment-reading/${initialData.SlNo}`
                : '/api/transaction/equipment-reading';

            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, UserId: userId })
            });



            if (!res.ok) {
                const txt = await res.text();
                console.error(`[handleSubmit] Error Body:`, txt);
                throw new Error(txt || `Server Error: ${res.status}`);
            }

            const json = await res.json();

            if (json.success) {
                toast.success(isEdit ? "Updated Successfully" : "Saved Successfully");
                setRefreshTrigger(prev => prev + 1); // Refresh History

                if (isEdit) {
                    router.back();
                    router.refresh();
                } else {
                    // Reset Logic (Add Mode) - Keep Header & Context
                    // "Date, Shift,Shift Incharge, Relay, Activity -> data/selected should remain"
                    setFormData(prev => ({
                        ...prev,
                        EquipmentId: '',
                        OperatorId: '', // Reset Operator

                        // Reset Meters
                        OHMR: '', CHMR: '', NetHMR: '',
                        OKMR: '', CKMR: '', NetKMR: '',

                        // Reset Detail Hours
                        DevelopmentHrMining: '', FaceMarchingHr: '', DevelopmentHrNonMining: '', BlastingMarchingHr: '',

                        // Reset Common Hours
                        RunningBDMaintenanceHr: '', TotalWorkingHr: '', BDHr: '', MaintenanceHr: '', IdleHr: '',

                        // Reset Others
                        SectorId: '', PatchId: '', MethodId: '', Remarks: ''
                    }));

                    // Focus Activity
                    if (activityRef.current) setTimeout(() => activityRef.current.focus(), 100);
                }
            } else {
                toast.error(json.message || "Failed to save");
            }

        } catch (error) {
            console.error("[handleSubmit] Catch Error:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Smart Tab Jump (Remarks -> Save)
    const handleSmartJump = (e, targetRef) => {
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            if (targetRef && targetRef.current) {
                targetRef.current.focus();
            }
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'F2' || (e.ctrlKey && e.key === 's')) {
                e.preventDefault();
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [formData]);

    // V15: Enter Key Navigation (Improved V20: Skip ReadOnly)
    const handleContainerKeyDown = (e) => {
        // Only handle Enter
        if (e.key !== 'Enter' || e.defaultPrevented) return;

        // Only on Inputs/Textareas/Selects
        const tagName = e.target.tagName;
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA' && tagName !== 'SELECT') return;

        e.preventDefault(); // Prevent Submit

        // Find next focusable
        const formContainer = e.currentTarget;
        // Include readOnly elements in the query so we can skip them in the loop logic
        const selector = 'input:not([type="hidden"]), textarea, select, button:not([disabled])';

        const focusable = Array.from(formContainer.querySelectorAll(selector))
            .filter(el => {
                // Must be visible and not disabled
                return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled;
            });

        const index = focusable.indexOf(e.target);
        if (index > -1) {
            let nextIndex = index + 1;
            // Scan forward for next editable field
            while (nextIndex < focusable.length) {
                const el = focusable[nextIndex];
                if (!el.readOnly) {
                    el.focus();
                    if (document.activeElement === el) return; // Focus success
                }
                nextIndex++;
            }
        }
    };


    // Live Validation on Blur
    const handleHMRBlur = () => {
        const netHmr = parseFloat(formData.NetHMR);
        // Only validate if it's a valid number (skip empty or incomplete states)
        if (!isNaN(netHmr) && (formData.OHMR !== '' && formData.CHMR !== '')) {
            let newErrors = { ...errors };

            if (netHmr < 0) {
                toast.error("Net HMR cannot be negative!");
                newErrors.NetHMR = "Cannot be negative";
                setErrors(newErrors);
            } else if (netHmr > 8) {
                toast.error(`Net HMR (${netHmr}) cannot be more than 8 Hours in a single shift!`);
                newErrors.NetHMR = "Cannot exceed 8 Hrs";
                setErrors(newErrors);
            } else {
                // Clear Error if valid
                if (newErrors.NetHMR) {
                    delete newErrors.NetHMR;
                    setErrors(newErrors);
                }
            }
        }
    };

    const handleKMRBlur = () => {
        const netKmr = parseFloat(formData.NetKMR);
        if (!isNaN(netKmr) && (formData.OKMR !== '' && formData.CKMR !== '')) {
            let newErrors = { ...errors };

            if (netKmr < 0) {
                toast.error("Net KMR cannot be negative!");
                newErrors.NetKMR = "Cannot be negative";
                setErrors(newErrors);
            } else {
                // Clear Error if valid
                if (newErrors.NetKMR) {
                    delete newErrors.NetKMR;
                    setErrors(newErrors);
                }
            }
        }
    };

    // --- Render Helpers ---

    return (
        <div className={styles.container} onKeyDown={handleContainerKeyDown}>
            {/* Header */}
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button className={styles.backBtn} onClick={() => router.push('/dashboard/transaction/equipment-reading')}>
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>

                <h1 className={styles.headerTitle}>{isEdit ? 'Update' : 'Create'} Equipment Reading</h1>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Buttons Moved to Form Grid (Row 6) */}
                </div>
            </div>

            {/* Form - 8 Column Grid */}
            <form className={styles.card} onSubmit={(e) => e.preventDefault()}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '5px' }}>

                    {/* --- Row 1 --- */}
                    {/* Date: C1 */}
                    <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                        <label>Date <span style={{ color: 'red' }}>*</span></label>
                        <input type="date"
                            className={`${styles.input} ${errors.Date ? styles.errorBorder : ''}`}
                            value={formData.Date ? formData.Date.split('T')[0] : ''}
                            max={today}
                            onChange={e => setFormData({ ...formData, Date: e.target.value })}
                            disabled={isEdit}
                        />
                        {errors.Date && <div className={styles.errorMsg}>{errors.Date}</div>}
                    </div>

                    {/* Shift: C2 */}
                    <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                        <label>Shift <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            className={styles.select}
                            options={options.shifts}
                            value={formData.ShiftId}
                            onChange={(e) => setFormData({ ...formData, ShiftId: e.target.value })}
                            placeholder="Select"
                            error={errors.ShiftId}
                            disabled={isEdit}
                        />
                        {errors.ShiftId && <div className={styles.errorMsg}>{errors.ShiftId}</div>}
                    </div>

                    {/* Incharge Large: C3-C4 */}
                    <div className={styles.group} style={{ gridColumn: 'span 2' }}>
                        <label>Incharge (Large-Scale) <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            className={styles.select}
                            options={options.operatorsIncharge}
                            name="ShiftInchargeId"
                            value={formData.ShiftInchargeId}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, ShiftInchargeId: e.target.value }));
                                if (errors.ShiftInchargeId) setErrors(prev => ({ ...prev, ShiftInchargeId: '' }));
                            }}
                            placeholder="Large Scale"
                            error={errors.ShiftInchargeId}
                            disabled={loading || isContextLocked}
                        />
                        {errors.ShiftInchargeId && <div className={styles.errorMsg}>{errors.ShiftInchargeId}</div>}
                    </div>

                    {/* Incharge Mid: C5-C6 */}
                    <div className={styles.group} style={{ gridColumn: 'span 2' }}>
                        <label>Incharge (Mid-Scale) <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            className={styles.select}
                            options={options.operatorsIncharge}
                            name="MidScaleInchargeId"
                            value={formData.MidScaleInchargeId}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, MidScaleInchargeId: e.target.value }));
                                if (errors.MidScaleInchargeId) setErrors(prev => ({ ...prev, MidScaleInchargeId: '' }));
                            }}
                            placeholder="Mid Scale"
                            error={errors.MidScaleInchargeId}
                            disabled={loading || isContextLocked}
                        />
                        {errors.MidScaleInchargeId && <div className={styles.errorMsg}>{errors.MidScaleInchargeId}</div>}
                    </div>

                    {/* Relay: C7 */}
                    <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                        <label>Relay <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            className={styles.select}
                            options={options.relays}
                            value={formData.RelayId}
                            onChange={(e) => setFormData({ ...formData, RelayId: e.target.value })}
                            placeholder="Select"
                            error={errors.RelayId}
                            disabled={loading || isContextLocked}
                        />
                        {errors.RelayId && <div className={styles.errorMsg}>{errors.RelayId}</div>}
                    </div>

                    <div style={{ gridColumn: '1 / -1', height: '0', margin: '0' }}></div>


                    {/* --- Row 2 --- */}
                    {/* Activity: C1 */}
                    <div className={styles.group} style={{ gridColumn: '1 / span 1' }}>
                        <label>Activity <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            className={styles.select}
                            ref={activityRef}
                            options={options.activities}
                            value={formData.ActivityId}
                            onChange={(e) => setFormData({ ...formData, ActivityId: e.target.value, EquipmentId: '' })}
                            placeholder="Select"
                            error={errors.ActivityId}
                        />
                        {errors.ActivityId && <div className={styles.errorMsg}>{errors.ActivityId}</div>}
                    </div>

                    {/* Equipment: C2-C3 (Span 2) */}
                    <div className={styles.group} style={{ gridColumn: 'span 2' }}>
                        <label>Equipment <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            className={styles.select}
                            ref={equipmentRef}
                            options={filteredEquipments}
                            value={formData.EquipmentId}
                            onChange={(e) => setFormData({ ...formData, EquipmentId: e.target.value })}
                            placeholder="Select"
                            error={errors.EquipmentId}
                        />
                        {errors.EquipmentId && <div className={styles.errorMsg}>{errors.EquipmentId}</div>}
                    </div>

                    {/* Operator: C4-C5 (Span 2) */}
                    <div className={styles.group} style={{ gridColumn: 'span 2' }}>
                        <label>Operator <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            className={styles.select}
                            options={options.operatorsDriver}
                            value={formData.OperatorId}
                            onChange={(e) => setFormData({ ...formData, OperatorId: e.target.value })}
                            placeholder="Select Operator"
                            error={errors.OperatorId}
                        />
                        {errors.OperatorId && <div className={styles.errorMsg}>{errors.OperatorId}</div>}
                    </div>


                    {/* --- Row 3 (HMR/KMR) --- */}
                    {/* OHMR: C1 */}
                    <div className={styles.group} style={{ gridColumn: '1 / span 1' }}>
                        <label>OHMR</label>
                        <input type="number" step="0.01" className={`${styles.input} ${errors.OHMR ? styles.errorBorder : ''}`}
                            value={formData.OHMR || ""} onChange={e => setFormData({ ...formData, OHMR: e.target.value })}
                            onBlur={handleHMRBlur}
                            placeholder="Prev"
                        />
                        {errors.OHMR && <div className={styles.errorMsg}>{errors.OHMR}</div>}
                    </div>

                    {/* CHMR: C2 */}
                    <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                        <label>CHMR</label>
                        <input type="number" step="0.01" className={`${styles.input} ${errors.CHMR ? styles.errorBorder : ''}`}
                            value={formData.CHMR || ""} onChange={e => setFormData({ ...formData, CHMR: e.target.value })}
                            onBlur={handleHMRBlur}
                        />
                        {errors.CHMR && <div className={styles.errorMsg}>{errors.CHMR}</div>}
                    </div>

                    {/* Net HMR: C3 */}
                    <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                        <label>Net HMR</label>
                        <input type="number" readOnly tabIndex={-1}
                            className={`${styles.input} ${styles.readOnly} ${errors.NetHMR ? styles.errorBorder : ''}`}
                            value={formData.NetHMR || ""}
                            onBlur={handleHMRBlur}
                        />
                        {errors.NetHMR && <div className={styles.errorMsg}>{errors.NetHMR}</div>}
                    </div>

                    {/* KMR (Conditional) */}
                    {isDetailActivity && (
                        <>
                            {/* OKMR: C4 */}
                            <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                                <label>OKMR <span style={{ color: 'red' }}>*</span></label>
                                <input type="number" step="0.01" className={`${styles.input} ${errors.OKMR ? styles.errorBorder : ''}`}
                                    value={formData.OKMR || ""} onChange={e => setFormData({ ...formData, OKMR: e.target.value })}
                                />
                                {errors.OKMR && <div className={styles.errorMsg}>{errors.OKMR}</div>}
                            </div>

                            {/* CKMR: C5 */}
                            <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                                <label>CKMR <span style={{ color: 'red' }}>*</span></label>
                                <input type="number" step="0.01" className={`${styles.input} ${errors.CKMR ? styles.errorBorder : ''}`}
                                    value={formData.CKMR || ""} onChange={e => setFormData({ ...formData, CKMR: e.target.value })}
                                    onBlur={handleKMRBlur}
                                />
                                {errors.CKMR && <div className={styles.errorMsg}>{errors.CKMR}</div>}
                            </div>

                            {/* Net KMR: C6 */}
                            <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                                <label>Net KMR</label>
                                <input type="number" readOnly tabIndex={-1} className={`${styles.input} ${styles.readOnly} ${errors.NetKMR ? styles.errorBorder : ''}`}
                                    value={formData.NetKMR || ""}
                                    onBlur={handleKMRBlur}
                                />
                                {errors.NetKMR && <div className={styles.errorMsg}>{errors.NetKMR}</div>}
                            </div>
                        </>
                    )}

                    {/* Row Break */}
                    <div style={{ gridColumn: '1 / -1', height: '0', margin: '0' }}></div>


                    {/* --- Row 4 (Hours) --- */}
                    {/* Mining Inputs: C1-C4 (Only if !isDetailActivity) */}
                    {!isDetailActivity && (
                        <>
                            <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                                <label>Dev. Hr(Mining)</label>
                                <input type="number" className={`${styles.input} ${errors.DevelopmentHrMining ? styles.errorBorder : ''}`}
                                    value={formData.DevelopmentHrMining || ""} onChange={e => setFormData({ ...formData, DevelopmentHrMining: e.target.value })}
                                />
                            </div>
                            <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                                <label>Face Marching Hr</label>
                                <input type="number" className={`${styles.input} ${errors.FaceMarchingHr ? styles.errorBorder : ''}`}
                                    value={formData.FaceMarchingHr || ""} onChange={e => setFormData({ ...formData, FaceMarchingHr: e.target.value })}
                                />
                            </div>
                            <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                                <label>Dev. Hr(Non)</label>
                                <input type="number" className={`${styles.input} ${errors.DevelopmentHrNonMining ? styles.errorBorder : ''}`}
                                    value={formData.DevelopmentHrNonMining || ""} onChange={e => setFormData({ ...formData, DevelopmentHrNonMining: e.target.value })}
                                />
                            </div>
                            <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                                <label>Blast Marching Hr</label>
                                <input type="number" className={`${styles.input} ${errors.BlastingMarchingHr ? styles.errorBorder : ''}`}
                                    value={formData.BlastingMarchingHr || ""} onChange={e => setFormData({ ...formData, BlastingMarchingHr: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {/* Run BD/Maint: Next Col */}
                    <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                        <label>Run BD/Maint Hr</label>
                        <input type="number" className={`${styles.input} ${errors.RunningBDMaintenanceHr ? styles.errorBorder : ''}`}
                            value={formData.RunningBDMaintenanceHr || ""} onChange={e => setFormData({ ...formData, RunningBDMaintenanceHr: e.target.value })}
                        />
                    </div>

                    {/* Total Work: Next Col */}
                    <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                        <label>Total Working Hr</label>
                        <input type="number" readOnly tabIndex={-1} className={`${styles.input} ${styles.readOnly} ${errors.TotalWorkingHr ? styles.errorBorder : ''}`}
                            value={formData.TotalWorkingHr || ""} style={{ fontWeight: 'bold' }}
                        />
                        {errors.TotalWorkingHr && <div className={styles.errorMsg}>{errors.TotalWorkingHr}</div>}
                    </div>

                    {/* Row Break */}
                    <div style={{ gridColumn: '1 / -1', height: '0', margin: '0' }}></div>


                    {/* --- Row 5 (Status) --- */}
                    {/* BD Hr: C1 */}
                    <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                        <label>BD Hr</label>
                        <input type="number" className={`${styles.input} ${errors.BDHr ? styles.errorBorder : ''}`}
                            value={formData.BDHr || ""} onChange={e => setFormData({ ...formData, BDHr: e.target.value })}
                        />
                    </div>

                    {/* Maint Hr: C2 */}
                    <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                        <label>Maint Hr</label>
                        <input type="number" className={`${styles.input} ${errors.MaintenanceHr ? styles.errorBorder : ''}`}
                            value={formData.MaintenanceHr || ""} onChange={e => setFormData({ ...formData, MaintenanceHr: e.target.value })}
                        />
                    </div>

                    {/* Idle Hr: C3 */}
                    <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                        <label>Idle Hr</label>
                        <input type="number" readOnly tabIndex={-1} className={`${styles.input} ${styles.readOnly} ${errors.IdleHr ? styles.errorBorder : ''}`}
                            value={formData.IdleHr || ""}
                        />
                        {errors.IdleHr && <div className={styles.errorMsg}>{errors.IdleHr}</div>}
                    </div>

                    {/* Row Break */}
                    <div style={{ gridColumn: '1 / -1', height: '0', margin: '0' }}></div>


                    {/* --- Row 6 (Details) --- */}
                    {/* Patch: Show if Not Detail (includes Loading) */}
                    {!isDetailActivity && (
                        <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                            <label>Patch</label>
                            <SearchableSelect
                                className={styles.select}
                                options={options.patches}
                                value={formData.PatchId}
                                onChange={(e) => setFormData({ ...formData, PatchId: e.target.value })}
                                placeholder="Select"
                            // error={errors.PatchId} // Removed Mandatory
                            />
                        </div>
                    )}

                    {/* Sector: Shown if Detail OR Loading */}
                    {(isDetailActivity || isLoadingActivity) && (
                        <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                            <label>Sector</label>
                            <SearchableSelect
                                className={styles.select}
                                options={options.sectors}
                                value={formData.SectorId}
                                onChange={(e) => setFormData({ ...formData, SectorId: e.target.value })}
                                placeholder="Select"
                                error={errors.SectorId}
                            />
                        </div>
                    )}

                    {/* Method: Show if Not Detail (includes Loading) */}
                    {!isDetailActivity && (
                        <div className={styles.group} style={{ gridColumn: 'span 1' }}>
                            <label>Method</label>
                            <SearchableSelect
                                className={styles.select}
                                options={options.methods}
                                value={formData.MethodId}
                                onChange={(e) => setFormData({ ...formData, MethodId: e.target.value })}
                                placeholder="Select"
                            // error={errors.MethodId} // Removed Mandatory
                            />
                        </div>
                    )}

                    {/* Remarks: Adjust Span based on visible fields */}
                    {/* 
                        Loading (IsLoading=T, IsDetail=F): Sector(1) + Patch(1) + Method(1) + Remarks(3) + Buttons(2) = 8
                        Mining (IsLoading=F, IsDetail=F): Patch(1) + Method(1) + Remarks(4) + Buttons(2) = 8
                        Detail (IsLoading=F, IsDetail=T): Sector(1) + Remarks(5) + Buttons(2) = 8
                    */}
                    <div className={styles.group} style={{ gridColumn: `span ${isLoadingActivity ? 3 : (isDetailActivity ? 5 : 4)}` }}>
                        <label>Remarks</label>
                        <input type="text" className={styles.input}
                            ref={remarksRef}
                            value={formData.Remarks || ""} onChange={e => setFormData({ ...formData, Remarks: e.target.value })}
                            placeholder="Remarks..."
                            onKeyDown={(e) => handleSmartJump(e, saveBtnRef)}
                        />
                    </div>

                    {/* Buttons: C7-C8 (Span 2) - Reset & Save */}
                    <div style={{ gridColumn: 'span 1', display: 'flex', alignItems: 'flex-end' }}>
                        <button
                            type="button"
                            className={styles.saveBtn}
                            style={{ width: '100%', background: '#64748b' }}
                            onClick={() => {
                                if (confirm('Reset Form?')) {
                                    setFormData({
                                        ...formData,
                                        EquipmentId: '', OperatorId: [],
                                        OHMR: '', CHMR: '', NetHMR: '', OKMR: '', CKMR: '', NetKMR: '',
                                        DevelopmentHrMining: '', FaceMarchingHr: '', DevelopmentHrNonMining: '', BlastingMarchingHr: '',
                                        RunningBDMaintenanceHr: '', TotalWorkingHr: '', BDHr: '', MaintenanceHr: '', IdleHr: '',
                                        SectorId: '', PatchId: '', MethodId: '', Remarks: ''
                                    });
                                    if (equipmentRef.current) equipmentRef.current.focus();
                                }
                            }} title="Reset Fields">
                            <RotateCcw size={18} /> Reset
                        </button>
                    </div>

                    <div style={{ gridColumn: 'span 1', display: 'flex', alignItems: 'flex-end' }}>
                        <button
                            ref={saveBtnRef}
                            className={styles.saveBtn}
                            style={{ width: '100%' }}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                            {isEdit ? 'Update' : 'Save'}
                        </button>
                    </div>

                </div>
            </form>

            {/* History Table (Visible in Add & Edit now) */}
            <div className={styles.tableSection}>
                <RecentHistory
                    config={TRANSACTION_CONFIG['equipment-reading']}
                    date={formData.Date}
                    shiftId={formData.ShiftId}
                    shiftInchargeId={formData.ShiftInchargeId}
                    midScaleInchargeId={formData.MidScaleInchargeId}
                    activityId={formData.ActivityId}
                    equipmentId={formData.EquipmentId}
                    userRole={userRole}
                    title="Recent Transactions"
                    refreshTrigger={refreshTrigger}
                />
            </div>
        </div>
    );
}

// Sub-component for auto-fetching history based on context
function RecentHistory({ config, date, shiftId, shiftInchargeId, midScaleInchargeId, activityId, equipmentId, userRole, title, refreshTrigger }) {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const fetchHistory = useCallback(async (isLoadMore = false) => {
        if (!date) return;

        if (!isLoadMore) {
            setPage(0);
            setHasMore(true);
        }
        setLoading(true);

        try {
            const currentPage = isLoadMore ? page + 1 : 0;
            const take = 50;
            const skip = currentPage * take;

            // Use new POST API
            const res = await fetch('/api/transaction/equipment-reading/helper/recent-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Date: date,
                    shiftId,
                    shiftInchargeId,
                    midScaleInchargeId,
                    activityId,
                    equipmentId,
                    skip,
                    take
                })
            }).then(r => r.json());

            if (res.success) {
                const newData = res.data || [];
                if (newData.length < take) setHasMore(false);

                if (isLoadMore) {
                    setData(prev => [...prev, ...newData]);
                    setPage(currentPage);
                } else {
                    setData(newData);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [date, page, shiftId, shiftInchargeId, midScaleInchargeId, activityId, equipmentId]);

    useEffect(() => {
        fetchHistory(false);
    }, [date, shiftId, shiftInchargeId, midScaleInchargeId, activityId, equipmentId, refreshTrigger]); // Reset when ANY context changes OR Trigger

    return (
        <>
            <TransactionTable
                config={config}
                data={data}
                isLoading={loading && page === 0}
                title={title}
                userRole={userRole}
                onEdit={(item) => router.push(`/dashboard/transaction/equipment-reading/${item.SlNo}`)}
                onDelete={async (id) => {
                    // Confirm is handled by Table Component
                    try {
                        const res = await fetch(`/api/transaction/equipment-reading/${id}`, { method: 'DELETE' }).then(r => r.json());
                        if (res.success) {
                            toast.success("Deleted Successfully");
                            // Refresh Data
                            fetchHistory(false);
                        } else {
                            toast.error(res.message || "Delete Failed");
                        }
                    } catch (e) {
                        console.error(e);
                        toast.error("Delete Failed");
                    }
                }}
            />
            {/* Load More Button */}
            {data.length > 0 && hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '20px' }}>
                    <button
                        type="button"
                        onClick={() => fetchHistory(true)}
                        disabled={loading}
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
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </>
    );
}
