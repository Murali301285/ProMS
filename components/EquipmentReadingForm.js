'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import styles from './EquipmentReadingForm.module.css';
import SearchableSelect from './SearchableSelect';
import TransactionTable from './TransactionTable';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';

/* Utility for Decimal Rounding */
const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export default function EquipmentReadingForm({ isEdit = false, initialData = null }) {
    const router = useRouter();

    // --- State ---
    const [loading, setLoading] = useState(false);
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
        ShiftInchargeId: [], // Array
        RelayId: '',

        ActivityId: '',
        EquipmentId: '',
        OperatorId: [], // Array (Driver)

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

    // Derived State: Filtered Equipments
    const filteredEquipments = useMemo(() => {
        if (!formData.ActivityId) return [];
        return options.equipments.filter(e => e.ActivityId == formData.ActivityId);
    }, [formData.ActivityId, options.equipments]);


    // Ref for focus management
    const activityRef = useRef(null);
    const equipmentRef = useRef(null);

    // --- 1. Init Data Loading ---
    useEffect(() => {
        async function loadMasters() {
            setLoading(true);
            try {
                // Fetch User
                // Fetch User
                const userRes = await fetch('/api/auth/me').then(r => r.json());
                setUserId(userRes.user?.id || 1);
                setUserRole(userRes.user?.role || '');

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
                const formattedDriver = uniqueBy(opDriver, 'id').map(s => ({ id: s.id, name: `${s.name} (${s.OperatorId || s.id})` }));

                setOptions({
                    shifts: shifts.map(s => ({
                        id: s.id,
                        name: s.FromTime && s.ToTime ? `${s.name} (${formatTime(s.FromTime)} - ${formatTime(s.ToTime)})` : s.name
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
            } catch (error) {
                console.error(error);
                toast.error("Failed to load master data");
            } finally {
                setLoading(false);
            }
        }
        loadMasters();
    }, []);

    // --- 1.1 Populate Form Data (Separate Effect) ---
    useEffect(() => {
        if (isEdit && initialData) {
            // Populate Form for Edit
            // V16: Sanitize nulls to empty strings to avoid React 'uncontrolled to controlled' error
            const safeData = { ...initialData };
            console.log("DEBUG: Populating Form. Initial Data:", initialData);

            Object.keys(safeData).forEach(key => {
                if (safeData[key] === null) safeData[key] = '';
            });

            // Helper to parse multi-select values (Handle Array, CSV String, Single Value)
            const parseMultiSelect = (val) => {
                if (!val) return [];
                if (Array.isArray(val)) return val.map(Number); // Ensure numbers
                if (typeof val === 'string') {
                    if (val.includes(',')) return val.split(',').map(v => Number(v.trim())); // CSV
                    return [Number(val)]; // Single String
                }
                if (typeof val === 'number') return [val]; // Single Number
                return [];
            };

            const parsedShiftIncharge = parseMultiSelect(safeData.ShiftInchargeId);
            const parsedOperator = parseMultiSelect(safeData.OperatorId);

            console.log("DEBUG: Parsed ShiftInchargeId:", parsedShiftIncharge);
            console.log("DEBUG: Parsed OperatorId:", parsedOperator);

            setFormData({
                ...safeData,
                ShiftInchargeId: parsedShiftIncharge,
                OperatorId: parsedOperator
            });
        }
    }, [isEdit, initialData]);


    // --- 2. Context Loading (Add Mode Only) ---
    // Trigger on Date or Shift Change
    useEffect(() => {
        if (isEdit) return; // Don't auto-load context in edit mode

        const loadContext = async () => {
            // Basic req: Only Date or Date+Shift selected
            if (!formData.Date) return;

            try {
                const res = await fetch('/api/transaction/helper/last-equipment-reading-context', {
                    method: 'POST',
                    body: JSON.stringify({
                        date: formData.Date,
                        shiftId: formData.ShiftId || null,
                        userId: userId
                    })
                }).then(r => r.json());

                if (res.success && res.data) {
                    setFormData(prev => ({
                        ...prev,
                        ShiftId: res.data.ShiftId || prev.ShiftId,
                        RelayId: res.data.RelayId || prev.RelayId,
                        // If multiple incharges logic:
                        ShiftInchargeId: res.data.ShiftInchargeId || prev.ShiftInchargeId,
                        // Note: ManPower not in form per Requirement? 
                        // Prompt didn't explicitly list ManPower in Entry Form Row 1.
                        // "Row 1 -> Date, Shift, Shift In charge, Relay" - Wait, User Request says "Man Power" in Priority 3 logic descriptions.
                        // But Form Layout list didn't include it.
                        // "Row 1 -> Date, Shift, Shift In charge, Relay"
                        // I will skip ManPower if not in layout.
                    }));
                    if (res.source) toast.info(`Context Loaded (${res.source})`);

                    // Focus Activity
                    if (activityRef.current) setTimeout(() => activityRef.current.focus(), 100);
                }
            } catch (e) {
                console.error(e);
            }
        };

        const timer = setTimeout(loadContext, 500); // Debounce
        return () => clearTimeout(timer);
    }, [formData.Date, formData.ShiftId, isEdit, userId]);


    // --- 3. Meter Reading Fetch ---
    useEffect(() => {
        if (isEdit || !formData.EquipmentId) return;

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
                deduction += (parseFloat(prev.FaceMarchingHr) || 0);
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

        // 1. Header (Mandatory)
        if (!formData.Date) errs.Date = "Required";
        if (!formData.ShiftId) errs.ShiftId = "Required";
        if (!formData.ShiftInchargeId?.length) errs.ShiftInchargeId = "Required";
        if (!formData.RelayId) errs.RelayId = "Required";

        // 2. Context (Mandatory)
        if (!formData.ActivityId) errs.ActivityId = "Required";
        if (!formData.EquipmentId) errs.EquipmentId = "Required";
        if (!formData.OperatorId?.length) errs.OperatorId = "Required";

        // 3. HMR (Mandatory)
        if (formData.OHMR === '') errs.OHMR = "Required";
        if (formData.CHMR === '') errs.CHMR = "Required";

        // HMR Logic
        if (parseFloat(formData.NetHMR) < 0) errs.NetHMR = "Cannot be negative";
        if (parseFloat(formData.CHMR) < parseFloat(formData.OHMR)) errs.CHMR = "Must be >= OHMR";

        // 4. KMR (Mandatory if Visible/Applicable)
        if (isDetailActivity) {
            if (formData.OKMR === '') errs.OKMR = "Required";
            if (formData.CKMR === '') errs.CKMR = "Required";

            // KMR Logic
            if (parseFloat(formData.NetKMR) < 0) {
                errs.NetKMR = "Cannot be negative";
                toast.error("Net KMR cannot be negative!");
            }
            if (parseFloat(formData.CKMR) < parseFloat(formData.OKMR)) {
                errs.CKMR = "Must be >= OKMR";
            }
        }

        // 5. Others (Dev Hr, BD, Maint) -> NON MANDATORY per User Request V18.5
        // Explicitly removed validation for: DevelopmentHrMining, FaceMarchingHr, etc.
        // Explicitly removed validation for: RunningBDMaintenanceHr, BDHr, MaintenanceHr

        // 6. Critical Safety (Block Save if Calculation Logic Failure)
        if (parseFloat(formData.TotalWorkingHr) < 0) {
            errs.TotalWorkingHr = "Total Working Hr cannot be negative!";
            toast.error("Check Calculation: Total Working Hr < 0");
        }
        if (parseFloat(formData.IdleHr) < 0) {
            // Optional: Block save or just warn? User said "reset are non mandatory".
            // But Negative Idle means Time > 8 (impossible). I'll keep it as error for data sanity.
            errs.IdleHr = "Idle Hr cannot be negative! (Check inputs)";
            toast.error("Check Calculation: Idle Hr < 0");
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
                    toast.error("Duplicate Entry Found!");
                    setLoading(false);
                    return;
                }
            }

            const url = isEdit
                ? `/api/transaction/equipment-reading/${initialData.SlNo}`
                : '/api/transaction/equipment-reading/add';

            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();

            if (result.success) {
                toast.success(isEdit ? "Updated Successfully" : "Saved Successfully");

                if (isEdit) {
                    router.back(); // or push main
                    router.push('/dashboard/transaction/equipment-reading');
                } else {
                    // Reset Logic (Add Mode)
                    // Keep: Date, Shift, Incharge, Relay, Activity, Operator
                    // Reset: Equipment, Readings, Hours, Remarks
                    setFormData(prev => ({
                        ...prev,
                        EquipmentId: '',

                        OHMR: '', CHMR: '', NetHMR: '',
                        OKMR: '', CKMR: '', NetKMR: '',

                        DevelopmentHrMining: '', FaceMarchingHr: '', DevelopmentHrNonMining: '', BlastingMarchingHr: '',
                        RunningBDMaintenanceHr: '', TotalWorkingHr: '', BDHr: '', MaintenanceHr: '', IdleHr: '',

                        SectorId: '', PatchId: '', MethodId: '', Remarks: ''
                    }));

                    // Focus Equipment? Or Activity?
                    // User: "reset to default of other than Date, shift,Shift incharge, relay, operator/driver these control"
                    // So Activity should potentially NOT be reset?
                    // "Date, Shift,Shift Incharge, Realy,Activity and Operator -> data/selected should remain"
                    // OK, so Activity remains. Reset Equipment.
                    if (equipmentRef.current) equipmentRef.current.focus();
                }
            } else {
                toast.error(result.message);
            }

        } catch (error) {
            console.error(error);
            toast.error("Save Failed");
        } finally {
            setLoading(false);
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

    // V15: Enter Key Navigation
    const handleContainerKeyDown = (e) => {
        // Only handle Enter
        if (e.key !== 'Enter' || e.defaultPrevented) return;

        // Only on Inputs/Textareas (allow Buttons to behave naturally)
        const tagName = e.target.tagName;
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') return;

        e.preventDefault(); // Prevent Submit

        // Find next focusable
        const formContainer = e.currentTarget;
        const selector = 'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

        const focusable = Array.from(formContainer.querySelectorAll(selector))
            .filter(el => {
                // Visibility check (basic)
                return el.offsetWidth > 0 && el.offsetHeight > 0;
            });

        const index = focusable.indexOf(e.target);
        if (index > -1 && index < focusable.length - 1) {
            focusable[index + 1].focus();
        }
    };


    // --- Render Helpers ---

    return (
        <div className={styles.container} onKeyDown={handleContainerKeyDown}>
            {/* Header */}
            <div className={styles.header}>
                {/* Left: Back */}
                <button className={styles.backBtn} onClick={() => router.back()}>
                    <ArrowLeft size={16} /> Back
                </button>

                {/* Center: Title */}
                <h1 className={styles.title}>{isEdit ? 'Update' : 'Create'} Equipment Reading</h1>

                {/* Right: Actions */}
                <div className={styles.headerActions}>
                    <button className={styles.resetBtn} onClick={() => {
                        setFormData({
                            ...formData,
                            OHMR: '', CHMR: '', NetHMR: '', OKMR: '', CKMR: '', NetKMR: '',
                            DevelopmentHrMining: '', FaceMarchingHr: '', DevelopmentHrNonMining: '', BlastingMarchingHr: '',
                            RunningBDMaintenanceHr: '', TotalWorkingHr: '', BDHr: '', MaintenanceHr: '', IdleHr: '',
                            SectorId: '', PatchId: '', MethodId: '', Remarks: ''
                        });
                        if (equipmentRef.current) equipmentRef.current.focus();
                    }} title="Reset Fields">
                        <RotateCcw size={16} />
                    </button>

                    <button className={styles.saveBtn} onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        {isEdit ? 'Update (F2)' : 'Save (F2)'}
                    </button>
                </div>
            </div>

            {/* Form */}
            <div className={styles.formContainer}>

                {/* Merged Row 1 & 2: Context + Equipment */}
                {/* User Req: "strech the design to match the screnn size... reduce Date, Shift, Relay... increase Shift Incharge" */}
                {/* CSS update will handle the Grid. JSX just needs to be cleaner. */}
                <div className={`${styles.row} ${styles.rowContext}`}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Date <span className={styles.required}>*</span></label>
                        <input type="date"
                            className={`${styles.input} ${errors.Date ? styles.errorInput : ''}`}
                            value={formData.Date ? formData.Date.split('T')[0] : ''}
                            max={today}
                            onChange={e => setFormData({ ...formData, Date: e.target.value })}
                            disabled={isEdit}
                        />
                        {errors.Date && <span className={styles.errorText}>{errors.Date}</span>}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Shift <span className={styles.required}>*</span></label>
                        <SearchableSelect
                            className={styles.smallSelect} // V10: Unified Style
                            options={options.shifts}
                            value={formData.ShiftId}
                            onChange={(e) => setFormData({ ...formData, ShiftId: e.target.value })}
                            placeholder="Select"
                            error={errors.ShiftId}
                            disabled={isEdit}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        {/* Multi-Select ShiftIncharge */}
                        <label className={styles.label}>Shift Incharge <span className={styles.required}>*</span></label>
                        <SearchableSelect
                            className={styles.smallSelect} // V10: Unified Style
                            options={options.operatorsIncharge}
                            name="ShiftInchargeId" // V17.2: Prop for debug
                            value={formData.ShiftInchargeId}
                            onChange={(e) => setFormData({ ...formData, ShiftInchargeId: e.target.value })}
                            placeholder="Select Incharges"
                            multiple={true} // V10: Multi-Select
                            error={errors.ShiftInchargeId}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Relay <span className={styles.required}>*</span></label>
                        <SearchableSelect
                            className={styles.smallSelect} // V10: Unified Style
                            options={options.relays}
                            value={formData.RelayId}
                            onChange={(e) => setFormData({ ...formData, RelayId: e.target.value })}
                            placeholder="Select"
                            error={errors.RelayId}
                        />
                    </div>
                </div>

                {/* Row 2: Equipment Context (Activity, Equip, Operator) */}
                <div className={styles.rowEquipment}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Activity <span className={styles.required}>*</span></label>
                        <SearchableSelect
                            className={styles.smallSelect}
                            ref={activityRef}
                            options={options.activities}
                            value={formData.ActivityId}
                            onChange={(e) => setFormData({ ...formData, ActivityId: e.target.value, EquipmentId: '' })}
                            placeholder="Select"
                            error={errors.ActivityId}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Equipment <span className={styles.required}>*</span></label>
                        <SearchableSelect
                            className={styles.smallSelect}
                            ref={equipmentRef}
                            options={filteredEquipments}
                            value={formData.EquipmentId}
                            onChange={(e) => setFormData({ ...formData, EquipmentId: e.target.value })}
                            placeholder="Select"
                            error={errors.EquipmentId}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Operator/Driver <span className={styles.required}>*</span></label>
                        <SearchableSelect
                            className={styles.smallSelect}
                            options={options.operatorsDriver}
                            name="OperatorId" // V17.2: Prop for debug
                            value={formData.OperatorId}
                            onChange={(e) => setFormData({ ...formData, OperatorId: e.target.value })}
                            placeholder="Select Operators"
                            multiple={true} // V10: Multi-Select
                            error={errors.OperatorId}
                        />
                    </div>
                    {/* Empty Div for Spacing */}
                    <div></div>
                </div>

                <div className={styles.divider} />

                {/* Meters (6 Columns if IsDetail, otherwise just HMR) */}
                <div className={styles.rowMeter}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>OHMR</label>
                        <input type="number" step="0.01" className={styles.input}
                            value={formData.OHMR} onChange={e => setFormData({ ...formData, OHMR: e.target.value })}
                            placeholder="Prev"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>CHMR</label>
                        <input type="number" step="0.01" className={`${styles.input} ${errors.CHMR ? styles.errorInput : ''}`}
                            value={formData.CHMR} onChange={e => setFormData({ ...formData, CHMR: e.target.value })}
                        />
                        {errors.CHMR && <span className={styles.errorText}>{errors.CHMR}</span>}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Net HMR</label>
                        <input type="number" readOnly className={`${styles.input} ${errors.NetHMR ? styles.errorInput : ''}`} value={formData.NetHMR} />
                        {errors.NetHMR && <span className={styles.errorText}>{errors.NetHMR}</span>}
                    </div>

                    {/* KMR (Only if IsDetail) */}
                    {isDetailActivity ? (
                        <>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>OKMR <span className={styles.required}>*</span></label>
                                <input type="number" step="0.01" className={`${styles.input} ${errors.OKMR ? styles.errorInput : ''}`}
                                    value={formData.OKMR} onChange={e => setFormData({ ...formData, OKMR: e.target.value })}
                                />
                                {errors.OKMR && <span className={styles.errorText}>{errors.OKMR}</span>}
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>CKMR <span className={styles.required}>*</span></label>
                                <input type="number" step="0.01" className={`${styles.input} ${errors.CKMR ? styles.errorInput : ''}`}
                                    value={formData.CKMR} onChange={e => setFormData({ ...formData, CKMR: e.target.value })}
                                />
                                {errors.CKMR && <span className={styles.errorText}>{errors.CKMR}</span>}
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Net KMR</label>
                                <input type="number" readOnly className={`${styles.input} ${errors.NetKMR ? styles.errorInput : ''}`} value={formData.NetKMR} />
                                {errors.NetKMR && <span className={styles.errorText}>{errors.NetKMR}</span>}
                            </div>
                        </>
                    ) : (
                        // Spacer if not Detail (keep grid alignment?) Or just empty
                        <> <div /><div /><div /> </>
                    )}
                </div>

                <div className={styles.divider} />

                {/* Specific Hours Row (6 Columns) */}
                {/* "Dev. Hr (Mining),Face Mrch,Dev. Hr (Non),Blast Mrch,Run BD/Maint,Total Work" */}
                {/* Specific Hours Row (6 Columns) - V12: Always Visible */}
                <div className={styles.rowSix}>
                    {/* Mining Inputs 1-4: Only if !isDetailActivity */}
                    {!isDetailActivity && (
                        <>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Dev(Min)</label>
                                <input type="number" className={`${styles.input} ${errors.DevelopmentHrMining ? styles.errorInput : ''}`}
                                    value={formData.DevelopmentHrMining} onChange={e => setFormData({ ...formData, DevelopmentHrMining: e.target.value })}
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Face Mrch</label>
                                <input type="number" className={`${styles.input} ${errors.FaceMarchingHr ? styles.errorInput : ''}`}
                                    value={formData.FaceMarchingHr} onChange={e => setFormData({ ...formData, FaceMarchingHr: e.target.value })}
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Dev(Non)</label>
                                <input type="number" className={`${styles.input} ${errors.DevelopmentHrNonMining ? styles.errorInput : ''}`}
                                    value={formData.DevelopmentHrNonMining} onChange={e => setFormData({ ...formData, DevelopmentHrNonMining: e.target.value })}
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Blst Mrch</label>
                                <input type="number" className={`${styles.input} ${errors.BlastingMarchingHr ? styles.errorInput : ''}`}
                                    value={formData.BlastingMarchingHr} onChange={e => setFormData({ ...formData, BlastingMarchingHr: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {/* Common Inputs 5-6: Always Visible */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Run BD/Mt</label>
                        <input type="number" className={`${styles.input} ${errors.RunningBDMaintenanceHr ? styles.errorInput : ''}`}
                            value={formData.RunningBDMaintenanceHr} onChange={e => setFormData({ ...formData, RunningBDMaintenanceHr: e.target.value })}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Total Wrk</label>
                        <input type="number" readOnly className={`${styles.input} ${errors.TotalWorkingHr ? styles.errorInput : ''}`}
                            value={formData.TotalWorkingHr} style={{ fontWeight: 'bold' }}
                        />
                    </div>
                </div>


                {/* BD / Maint / Idle Row (3 Cols) */}
                {/* "BD Hrs, Maintenance Hr and Idle hrs in one row" */}
                <div className={styles.rowThree}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>BD Hr</label>
                        <input type="number" className={`${styles.input} ${errors.BDHr ? styles.errorInput : ''}`}
                            value={formData.BDHr} onChange={e => setFormData({ ...formData, BDHr: e.target.value })}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Maint Hr</label>
                        <input type="number" className={`${styles.input} ${errors.MaintenanceHr ? styles.errorInput : ''}`}
                            value={formData.MaintenanceHr} onChange={e => setFormData({ ...formData, MaintenanceHr: e.target.value })}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Idle Hr</label>
                        <input type="number" readOnly className={`${styles.input} ${errors.IdleHr ? styles.errorInput : ''}`}
                            value={formData.IdleHr}
                        />
                    </div>
                </div>

                <div className={styles.divider} />

                {/* Additional Details (Sector/Patch/Method) */}
                <div className={styles.row}>
                    {isDetailActivity && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Sector</label>
                            <SearchableSelect
                                className={styles.smallSelect} // V12: Uniform
                                options={options.sectors}
                                value={formData.SectorId}
                                onChange={(e) => setFormData({ ...formData, SectorId: e.target.value })}
                                placeholder="Select"
                                error={errors.SectorId}
                            />
                        </div>
                    )}

                    {!isDetailActivity && (
                        <>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Patch</label>
                                <SearchableSelect
                                    className={styles.smallSelect} // V12: Uniform
                                    options={options.patches}
                                    value={formData.PatchId}
                                    onChange={(e) => setFormData({ ...formData, PatchId: e.target.value })}
                                    placeholder="Select"
                                // error={errors.PatchId} // Removed Mandatory
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Method</label>
                                <SearchableSelect
                                    className={styles.smallSelect} // V12: Uniform
                                    options={options.methods}
                                    value={formData.MethodId}
                                    onChange={(e) => setFormData({ ...formData, MethodId: e.target.value })}
                                    placeholder="Select"
                                // error={errors.MethodId} // Removed Mandatory
                                />
                            </div>
                        </>
                    )}

                    <div className={styles.fieldGroup} style={{ gridColumn: isDetailActivity ? 'span 3' : 'span 2' }}>
                        <label className={styles.label}>Remarks</label>
                        <input type="text" className={styles.input}
                            value={formData.Remarks} onChange={e => setFormData({ ...formData, Remarks: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* History Table (Visible in Add & Edit now) */}
            <div className={styles.historySection}>
                <h3 className={styles.historyTitle}>Recent Entries</h3>
                <RecentHistory
                    config={TRANSACTION_CONFIG['equipment-reading']}
                    date={formData.Date}
                    shiftId={formData.ShiftId}
                    userRole={userRole}
                />
            </div>
        </div>
    );
}

// Sub-component for auto-fetching history based on context
function RecentHistory({ config, date, shiftId, userRole }) {
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!date) return;
        const fetchHistory = async () => {
            const params = new URLSearchParams({
                fromDate: date,
                toDate: date,
                limit: '10' // Last 10
            });
            try {
                const res = await fetch(`${config.apiEndpoint}?${params}`).then(r => r.json());
                if (res.data) setData(res.data);
            } catch (e) { console.error(e); }
        };
        fetchHistory();
    }, [date, shiftId, config.apiEndpoint]);

    return (
        <TransactionTable
            config={config}
            data={data}
            isLoading={false}
            userRole={userRole}
        />
    );
}
