'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';
import LoadingOverlay from '@/components/LoadingOverlay';
import Link from 'next/link';
import TransactionTable from '@/components/TransactionTable';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import SearchableSelect from '@/components/SearchableSelect';
import { toast } from 'sonner';
import css from './DrillingForm.module.css';

// Styled similar to other Transaction Forms

export default function DrillingForm({ mode = 'create', initialData = null }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Masters Data
    const [masters, setMasters] = useState({
        equipment: [],
        material: [],
        location: [],
        sector: [],
        scale: [],
        strata: [],
        depthSlab: [],
        drillingAgency: [],
        remarks: [], // Drilling Remarks
        units: [] // For internal mapping math
    });

    const today = new Date().toISOString().split('T')[0];

    // Form State
    const [formData, setFormData] = useState({
        Date: today,
        DrillingPatchId: '',
        DrillingAgencyId: '',
        EquipmentId: '',
        MaterialId: '',
        LocationId: '',
        SectorId: '',
        ScaleId: '',
        StrataId: '',
        DepthSlabId: '',
        NoofHoles: '',
        TotalMeters: '',
        Spacing: '',
        Burden: '',
        TopRLBottomRL: '',
        AverageDepth: '',
        Output: '',
        UnitId: '',
        TotalQty: '',
        RemarkId: '', // Drilling Remarks
        Remarks: '', // General Remarks
    });

    // Validation Errors
    const [errors, setErrors] = useState({});

    // References for Focus Management
    const inputRefs = useRef([]);

    // --- Load Masters ---
    useEffect(() => {
        async function loadMasters() {
            setLoading(true);
            try {
                // Parallel Fetch for Speed
                const [eqRes, matRes, locRes, secRes, scRes, strRes, dsRes, drRemRes, unitRes, daRes] = await Promise.all([
                    fetch('/api/master/equipment'),
                    fetch('/api/master/material'),
                    fetch('/api/master/location'),
                    fetch('/api/master/sector'),
                    fetch('/api/master/scale'),
                    fetch('/api/master/strata'),
                    fetch('/api/master/depth-slab'),
                    fetch('/api/master/drilling-remarks'),
                    fetch('/api/master/unit'),
                    fetch('/api/master/drilling-agency')
                ]);

                const eqData = await eqRes.json();
                const matData = await matRes.json();
                const locData = await locRes.json();
                const secData = await secRes.json();
                const scData = await scRes.json();
                const strData = await strRes.json();
                const dsData = await dsRes.json();
                const drRemData = await drRemRes.json();
                const unitData = await unitRes.json();
                const daData = await daRes.json();

                // Helper to safely get array from response (handle direct array or { data: [] })
                const getArr = (res) => Array.isArray(res) ? res : (res.data || []);

                // Filter Data as per Requirements
                setMasters({
                    equipment: getArr(eqData).filter(i => i.IsActive && !i.IsDelete && i.ActivityId === 7),
                    material: getArr(matData).filter(i => i.IsActive && !i.IsDelete),
                    location: getArr(locData).filter(i => i.IsActive && !i.IsDelete),
                    sector: getArr(secData).filter(i => i.IsActive && !i.IsDelete),
                    scale: getArr(scData).filter(i => i.IsActive && !i.IsDelete),
                    strata: getArr(strData).filter(i => i.IsActive && !i.IsDelete),
                    depthSlab: getArr(dsData).filter(i => i.IsActive && !i.IsDelete),
                    remarks: getArr(drRemData).filter(i => i.IsActive && !i.IsDelete),
                    units: getArr(unitData),
                    drillingAgency: getArr(daData).filter(i => i.IsActive && !i.IsDelete)
                });

                // Set Initial Data if Edit Mode
                if (mode === 'edit' && initialData) {
                    setFormData({
                        ...initialData,
                        Date: initialData.Date ? new Date(initialData.Date).toISOString().split('T')[0] : today
                    });
                }

            } catch (err) {
                console.error("Failed to load masters", err);
                toast.error("Failed to load master data. Please refresh.");
            } finally {
                setLoading(false);
            }
        }
        loadMasters();
    }, [mode, initialData]);


    // --- Calculations & Unit Logic ---
    useEffect(() => {
        // 1. Auto Select Unit based on Material
        if (formData.MaterialId && masters.material && masters.material.length > 0) {
            // Find material by string comparison to be safe
            const material = masters.material.find(m => String(m.SlNo) === String(formData.MaterialId));

            console.log("[DrillingForm] Material Auto-Select Check:", {
                selectedMaterialId: formData.MaterialId,
                foundMaterial: material
            });

            if (material) {
                const foundUnitId = material.UnitId;
                const currentUnitId = formData.UnitId;

                // Update if they differ (comparing as strings/coerced to handle 2 vs '2')
                if (String(foundUnitId || '') !== String(currentUnitId || '')) {
                    console.log(`[DrillingForm] Auto-setting UnitId to ${foundUnitId} (was ${currentUnitId})`);
                    setFormData(prev => ({ ...prev, UnitId: foundUnitId || '' }));
                }
            }
        }
    }, [formData.MaterialId, masters.material]);

    useEffect(() => {
        // 2. Calculate Average Depth & Total Qty
        const holes = parseFloat(formData.NoofHoles) || 0;
        const totalMeters = parseFloat(formData.TotalMeters) || 0;
        const output = parseFloat(formData.Output) || 0;

        let avgDepth = 0;
        let totalQty = 0;

        if (holes > 0) {
            avgDepth = (totalMeters / holes).toFixed(3);
        }

        totalQty = (holes * totalMeters * output).toFixed(3);

        setFormData(prev => ({
            ...prev,
            AverageDepth: avgDepth,
            TotalQty: totalQty
        }));

    }, [formData.NoofHoles, formData.TotalMeters, formData.Output]); // Dependencies


    // --- Table Data State ---
    const [tableData, setTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // User State for Title
    const [user, setUser] = useState(null);

    // Initial Load - Get User
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        console.log("[DrillingForm] LocalStorage User:", userStr);
        if (userStr) {
            try {
                const parsed = JSON.parse(userStr);
                console.log("[DrillingForm] Parsed User:", parsed);
                // Standardize user object for title
                const displayUser = {
                    ...parsed,
                    username: parsed.EmpName || parsed.UserName || parsed.username || parsed.name || 'User'
                };
                setUser(displayUser);
            } catch (e) {
                console.error("[DrillingForm] User Parse Error:", e);
            }
        }
    }, []);

    // --- SMART CONTEXT LOGIC ---

    // 1. Initial Load: Get Absolute Last Context (Regardless of Date)
    useEffect(() => {
        if (mode !== 'create') return;

        const fetchInitialContext = async () => {
            try {
                // No Date payload -> asks for absolute last record
                const res = await fetch('/api/transaction/drilling/helper/last-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                const context = await res.json();
                console.log("[DrillingForm] Initial Absolute Context:", context);

                if (context && Object.keys(context).length > 0) {
                    // Found last record (e.g., from yesterday)
                    // Set Date AND Fields
                    const receivedDate = context.Date;
                    const parsedDate = receivedDate ? new Date(receivedDate).toISOString().split('T')[0] : today;

                    setFormData(prev => ({
                        ...prev,
                        Date: parsedDate, // Overwrite date on initial load
                        DrillingPatchId: context.DrillingPatchId || '',
                        EquipmentId: context.EquipmentId || '',
                        MaterialId: context.MaterialId || '',
                        LocationId: context.LocationId || '',
                        SectorId: context.SectorId || '',
                        ScaleId: context.ScaleId || '',
                        StrataId: context.StrataId || '',
                        DepthSlabId: context.DepthSlabId || '',
                        DrillingAgencyId: context.DrillingAgencyId || '',
                        // Reset entry fields
                        NoofHoles: '', TotalMeters: '', Spacing: '', Burden: '', TopRLBottomRL: '',
                        RemarkId: '', Output: '', UnitId: '', TotalQty: '', Remarks: ''
                    }));
                }
            } catch (err) {
                console.error("Initial context fetch failed", err);
            }
        };

        fetchInitialContext();
    }, [mode]); // Run once on mount (if create mode)


    // 2. Date Change: Get Context Specific to Selected Date
    useEffect(() => {
        if (mode !== 'create') return;

        // Skip if Date is same as what we just loaded? 
        // No, difficult to track here. Let it run, it will just re-confirm data.

        const fetchDateContext = async () => {
            if (!formData.Date) return;

            try {
                console.log("[DrillingForm] Checking Context for Date:", formData.Date);
                const res = await fetch('/api/transaction/drilling/helper/last-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Date: formData.Date }) // Specific Date
                });
                const context = await res.json();

                if (context && Object.keys(context).length > 0) {
                    // Found record for this date
                    console.log("[DrillingForm] Found Context for Date:", context);
                    setFormData(prev => ({
                        ...prev,
                        // Date: prev.Date, // Keep User Selection
                        DrillingPatchId: context.DrillingPatchId || '',
                        EquipmentId: context.EquipmentId || '',
                        MaterialId: context.MaterialId || '',
                        LocationId: context.LocationId || '',
                        SectorId: context.SectorId || '',
                        ScaleId: context.ScaleId || '',
                        StrataId: context.StrataId || '',
                        DepthSlabId: context.DepthSlabId || '',
                        DrillingAgencyId: context.DrillingAgencyId || '',
                        // Reset others
                        NoofHoles: '', TotalMeters: '', Spacing: '', Burden: '', TopRLBottomRL: '',
                        RemarkId: '', Output: '', UnitId: '', TotalQty: '', Remarks: ''
                    }));

                    // Focus logic
                    setTimeout(() => {
                        if (inputRefs.current['NoofHoles']) inputRefs.current['NoofHoles'].focus();
                    }, 100);

                } else {
                    // No record for this date -> Reset
                    console.log("[DrillingForm] No context for date. Resetting fields.");
                    setFormData(prev => ({
                        ...prev,
                        // Date: prev.Date, // Keep User Selection
                        DrillingPatchId: '', EquipmentId: '', MaterialId: '', LocationId: '',
                        SectorId: '', ScaleId: '', StrataId: '', DepthSlabId: '', DrillingAgencyId: '',
                        NoofHoles: '', TotalMeters: '', Spacing: '', Burden: '', TopRLBottomRL: '',
                        RemarkId: '', Output: '', UnitId: '', TotalQty: '', Remarks: ''
                    }));
                }

            } catch (err) {
                console.error("Date context fetch failed", err);
            }
        };

        // We need to avoid this running immediately and clashing with Initial Load?
        // Actually, if Initial Load changes the Date, this WILL run.
        // That is acceptable: 
        // 1. Initial Load sets Date=25th.
        // 2. This runs for 25th. Finds data (same data). Sets fields again.
        // Outcome: Correct State.

        fetchDateContext();

    }, [formData.Date, mode]);


    // --- DYNAMIC RECENT LIST LOGIC ---
    // Fetch Table Data when Relevant Filters Change
    const fetchTableData = async (isLoadMore = false) => {
        // Logic: If Date or Context Control changes -> Load data
        // "Once the Date or above said controls changes -> recent transactions should load based on the filtered details"

        if (!isLoadMore) {
            setPage(0);
            setHasMore(true);
        }

        setTableLoading(true);
        try {
            const currentPage = isLoadMore ? page + 1 : 0;
            const take = 50;
            const skip = currentPage * take;

            // Build Filter Payload
            // "if field is empty/default then -> condition should be removed"
            const payload = {
                Date: formData.Date,
                DrillingPatchId: formData.DrillingPatchId,
                EquipmentId: formData.EquipmentId,
                MaterialId: formData.MaterialId,
                LocationId: formData.LocationId,
                SectorId: formData.SectorId,
                ScaleId: formData.ScaleId,
                StrataId: formData.StrataId,
                DepthSlabId: formData.DepthSlabId,
                skip,
                take
            };

            const res = await fetch('/api/transaction/drilling/helper/recent-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (result.data) {
                const newData = result.data;
                if (newData.length < take) setHasMore(false);

                if (isLoadMore) {
                    setTableData(prev => [...prev, ...newData]);
                    setPage(currentPage);
                } else {
                    setTableData(newData);
                }
            }
        } catch (err) {
            console.error("Failed to load table data", err);
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        // Trigger fetch on any relevant change
        // Debounce might be good but let's stick to direct effect for responsiveness if data size is small
        const timer = setTimeout(() => {
            fetchTableData();
        }, 300); // Small delay to avoid heavy hitting while typing Patch ID
        return () => clearTimeout(timer);
    }, [
        formData.Date,
        formData.DrillingPatchId,
        formData.EquipmentId,
        formData.MaterialId,
        formData.LocationId,
        formData.SectorId,
        formData.ScaleId,
        formData.StrataId,
        formData.DepthSlabId
    ]);

    // Field Order for Navigation (Visual Order)
    const FIELD_ORDER = [
        'Date',
        'DrillingPatchId', 'EquipmentId', 'MaterialId', 'LocationId',
        'SectorId', 'ScaleId', 'StrataId', 'DepthSlabId',
        'NoofHoles', 'TotalMeters', 'Spacing', 'Burden', 'TopRLBottomRL', 'RemarkId',
        'Output', // Skips AverageDepth
        'DrillingAgencyId', 'Remarks' // Skips UnitId, TotalQty
    ];

    // Read Only / Skip Fields
    const SKIP_FIELDS = ['AverageDepth', 'UnitId', 'TotalQty'];

    useEffect(() => {
        // Auto-focus DrillingPatchId on Mount
        // Using timeout to ensure render completion
        setTimeout(() => {
            if (inputRefs.current['DrillingPatchId']) {
                inputRefs.current['DrillingPatchId'].focus();
            }
        }, 100);
    }, []);

    // --- Validation Logic ---
    const validate = () => {
        const newErrors = {};

        // Mandatory Fields
        const required = [
            'DrillingPatchId', 'DrillingAgencyId', 'EquipmentId', 'MaterialId', 'LocationId',
            'SectorId', 'ScaleId', 'StrataId', 'DepthSlabId',
            'NoofHoles', 'TotalMeters', 'Spacing', 'Burden', 'RemarkId',
            'AverageDepth', 'Output', 'UnitId', 'TotalQty'
        ];

        required.forEach(field => {
            const val = formData[field];
            // Allow 0 (number) but reject null, undefined, empty string
            if (val === null || val === undefined || val === '') {
                newErrors[field] = 'Required';
            }
        });

        // Specific Validations
        if (formData.NoofHoles && !/^\d+$/.test(formData.NoofHoles)) {
            newErrors.NoofHoles = 'Whole Number only';
        }

        // Decimals (3 Places)
        const decimal3 = /^\d+(\.\d{1,3})?$/;
        if (formData.TotalMeters && !decimal3.test(formData.TotalMeters)) newErrors.TotalMeters = 'Max 3 decimals';
        if (formData.Spacing && !decimal3.test(formData.Spacing)) newErrors.Spacing = 'Max 3 decimals';
        if (formData.Burden && !decimal3.test(formData.Burden)) newErrors.Burden = 'Max 3 decimals';

        // Output % (2 Decimals, whole number prefix)
        // Regex: Starts with digit 1-9 (no leading zero like 0.67), optional decimals .xx
        const outputRegex = /^[1-9]\d*(\.\d{1,2})?$/;
        if (formData.Output && !outputRegex.test(formData.Output)) {
            newErrors.Output = 'Invalid Format (e.g. 67.0)'; // "0.67 not valid"
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear Error on Change
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSave = async () => {
        if (!validate()) {
            toast.error("Please fix validation errors marked in red.");
            return;
        }

        setLoading(true);
        try {
            const url = mode === 'create' ? '/api/transaction/drilling/create' : `/api/transaction/drilling/${initialData.SlNo}`;
            const method = mode === 'create' ? 'POST' : 'PUT';

            // Clean Data for Payload (Convert Numbers)
            const payload = {
                ...formData,
                // Ensure IDs are numbers not strings
                DrillingAgencyId: parseInt(formData.DrillingAgencyId),
                EquipmentId: parseInt(formData.EquipmentId),
                MaterialId: parseInt(formData.MaterialId),
                LocationId: parseInt(formData.LocationId),
                SectorId: parseInt(formData.SectorId),
                ScaleId: parseInt(formData.ScaleId),
                StrataId: parseInt(formData.StrataId),
                DepthSlabId: parseInt(formData.DepthSlabId),
                UnitId: parseInt(formData.UnitId),
                RemarkId: parseInt(formData.RemarkId)
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'Failed to save');

            toast.success("Saved Successfully!");

            if (mode === 'create') {
                // Reset Fields except Date
                setFormData(prev => ({
                    ...prev,
                    DrillingPatchId: '', DrillingAgencyId: '', EquipmentId: '', MaterialId: '', LocationId: '',
                    SectorId: '', ScaleId: '', StrataId: '', DepthSlabId: '',
                    NoofHoles: '', TotalMeters: '', Spacing: '', Burden: '', TopRLBottomRL: '',
                    AverageDepth: '', Output: '', UnitId: '', TotalQty: '', RemarkId: '', Remarks: ''
                }));
                // Focus first input (excluding Date) -> PatchId
                if (inputRefs.current['DrillingPatchId']) inputRefs.current['DrillingPatchId'].focus();

                fetchTableData(); // Refresh table
            } else {
                router.push('/dashboard/transaction/drilling');
            }

        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };


    const handleKeyDown = (e, fieldName) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            const currIndex = FIELD_ORDER.indexOf(fieldName);
            if (currIndex > -1 && currIndex < FIELD_ORDER.length - 1) {
                const nextField = FIELD_ORDER[currIndex + 1];

                // Check if next field ref exists
                if (inputRefs.current[nextField]) {
                    // SearchableSelect exposes .focus(), Input exposes .focus()
                    // If it's a SearchableSelect, it might handle its own Enter behavior (open menu).
                    // But if we are in a Text Input (e.g. PatchId) hitting Enter, we want to go to next.
                    // If next is ReadOnly (e.g. Unit), we should skip it.

                    if (SKIP_FIELDS.includes(nextField)) {
                        // Recursively find next valid
                        // For simplicity, just trying +2 (improve if many skips in row)
                        // Actually, let's just create a dynamic finder
                        let nextIdx = currIndex + 1;
                        while (nextIdx < FIELD_ORDER.length) {
                            if (!SKIP_FIELDS.includes(FIELD_ORDER[nextIdx])) {
                                if (inputRefs.current[FIELD_ORDER[nextIdx]]) {
                                    inputRefs.current[FIELD_ORDER[nextIdx]].focus();
                                }
                                break;
                            }
                            nextIdx++;
                        }
                    } else {
                        inputRefs.current[nextField].focus();
                    }
                }
            }
        }
        // Shortcut Keys
        if (e.key === 'F2' || (e.ctrlKey && e.key === 's')) {
            e.preventDefault();
            handleSave();
        }
    };


    // --- Global Shortcuts (F2) ---
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    });

    // --- Table Actions ---
    const handleEdit = (row) => {
        router.push(`/dashboard/transaction/drilling/${row.SlNo}`);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            const res = await fetch(`/api/transaction/drilling/${id}`, {
                method: 'DELETE'
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to delete');

            toast.success("Record deleted successfully");
            fetchTableData(); // Refresh table
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        }
    };

    // Helper for rendering Fields with CSS Module Classes
    // Updated to use SearchableSelect for 'select' type
    const renderField = (name, label, type = 'text', required = false, props = {}) => {
        let inputComponent = null;

        if (type === 'select') {
            // Map Options for SearchableSelect { id, name }
            // Using logic: ID = SlNo, Name = (Name || EquipmentName || ... fallback chain)
            const mappedOptions = (props.options || []).map(opt => ({
                id: opt.SlNo,
                name: opt.Name || opt.EquipmentName || opt.MaterialName || opt.LocationName || opt.SectorName || opt.DrillingRemarks || opt.Strata || opt.DrillingRemarks || opt.AgencyName || 'Unknown'
            }));

            inputComponent = (
                <SearchableSelect
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    options={mappedOptions}
                    placeholder="-- Select --"
                    className={css.compactInput} // Override to 30px
                    error={!!errors[name]}
                    ref={el => inputRefs.current[name] = el}
                // ReadOnly prop isn't natively supported by SearchableSelect logic shown, but we can disable wrapper events if needed.
                // For now assuming active. SearchableSelect doesn't explicitly have 'readOnly' prop in code view, only autoFocus.
                />
            );
            // Handling ReadOnly for UnitId specifically (if needed) - SearchableSelect might need update or pointer-events:none wrapper
            if (props.readOnly) {
                inputComponent = (
                    <div style={{ pointerEvents: 'none', opacity: 1, backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                        {inputComponent}
                    </div>
                );
            }

        } else {
            inputComponent = (
                <input
                    type={type}
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    className={`${css.input} ${errors[name] ? css.errorInput : ''} ${props.readOnly ? css.readOnly : ''}`}
                    readOnly={props.readOnly}
                    max={props.max}
                    ref={el => inputRefs.current[name] = el}
                    onKeyDown={(e) => handleKeyDown(e, name)}
                    placeholder={props.placeholder}
                />
            );
        }

        return (
            <div className={css.fieldGroup} style={props.colSpan ? { gridColumn: `span ${props.colSpan}` } : {}}>
                <label className={css.label}>
                    {label} {required && <span className={css.required}>*</span>}
                </label>
                {inputComponent}
                {errors[name] && <span className={css.errorText}>{errors[name]}</span>}
            </div>
        );
    };

    return (
        <div className={css.container}>
            {loading && <LoadingOverlay message="Processing..." />}

            <div className={css.header}>
                <button className={css.backBtn} onClick={() => router.push('/dashboard/transaction/drilling')}>
                    <ArrowLeft size={16} /> Back
                </button>
                <h1 className={css.title}>{mode === 'create' ? 'Create Drilling Entry' : 'Update Drilling Entry'}</h1>
                <div className={css.headerActions}>
                    <button className={css.refreshBtn} onClick={() => window.location.reload()} title="Refresh (F5)">
                        <RefreshCw size={18} />
                    </button>
                    <button className={css.saveBtn} onClick={handleSave} title="Save (Ctrl+S / F2)">
                        <Save size={18} /> Save (F2)
                    </button>
                </div>
            </div>

            {/* Form - 8 Column Grid */}
            <div className={css.formSection} style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '15px', padding: '15px' }}>

                {/* --- Row 1 --- */}
                {/* Date: C1 */}
                {renderField('Date', 'Date of Drilling', 'date', true, { max: today, colSpan: 1 })}

                {/* Patch: C2 */}
                {renderField('DrillingPatchId', 'Drilling Patch ID', 'text', true, { colSpan: 1 })}

                {/* Breaks not needed if we manage spans correctly, but dividers help visual separation */}


                {/* --- Row 2 --- */}
                {/* Equipment: C1-C2 (Span 2) */}
                {renderField('EquipmentId', 'Equipment', 'select', true, { options: masters.equipment, colSpan: 2 })}

                {/* Material: C3 */}
                {renderField('MaterialId', 'Material', 'select', true, { options: masters.material, colSpan: 1 })}

                {/* Location: C4 */}
                {renderField('LocationId', 'Location', 'select', true, { options: masters.location, colSpan: 1 })}



                {/* --- Row 3 --- */}
                {/* Sector: C1 */}
                {renderField('SectorId', 'Sector', 'select', true, { options: masters.sector, colSpan: 1 })}

                {/* Scale: C2 */}
                {renderField('ScaleId', 'Scale', 'select', true, { options: masters.scale, colSpan: 1 })}

                {/* Strata: C3 */}
                {renderField('StrataId', 'Strata', 'select', true, { options: masters.strata, colSpan: 1 })}

                {/* Slab: C4 */}
                {renderField('DepthSlabId', 'Depth Slab', 'select', true, { options: masters.depthSlab, colSpan: 1 })}



                {/* --- Row 4 --- */}
                {/* Holes: C1 */}
                {renderField('NoofHoles', 'No of Holes', 'text', true, { placeholder: 'Num', colSpan: 1 })}

                {/* Meters: C2 */}
                {renderField('TotalMeters', 'Total Meters/Hole', 'text', true, { placeholder: '0.000', colSpan: 1 })}

                {/* Spacing: C3 */}
                {renderField('Spacing', 'Spacing', 'text', true, { placeholder: '0.000', colSpan: 1 })}

                {/* Burden: C4 */}
                {renderField('Burden', 'Burden', 'text', true, { placeholder: '0.000', colSpan: 1 })}

                {/* RL: C5 */}
                {renderField('TopRLBottomRL', 'Top RL Bottom RL', 'text', false, { colSpan: 1 })}

                {/* Drilling Remarks: C6-C7 (Span 2) */}
                {renderField('RemarkId', 'Drilling Remarks', 'select', true, { options: masters.remarks, colSpan: 2 })}



                {/* --- Row 5 --- */}
                {/* Avg Depth: C1 */}
                {renderField('AverageDepth', 'Average Depth', 'text', true, { readOnly: true, placeholder: 'Calc', colSpan: 1 })}

                {/* Output: C2 */}
                {renderField('Output', 'Output %', 'text', true, { placeholder: 'e.g. 67.0', colSpan: 1 })}

                {/* Unit: C3 - ReadOnly removed for testing */}
                {renderField('UnitId', 'Unit', 'select', true, { options: masters.units, readOnly: false, colSpan: 1 })}

                {/* Qty: C4 */}
                {renderField('TotalQty', 'Total Qty', 'text', true, { readOnly: true, placeholder: 'Calc', colSpan: 1 })}

                {/* Agency: C5 */}
                {renderField('DrillingAgencyId', 'Drilling Agency', 'select', true, { options: masters.drillingAgency, colSpan: 1 })}



                {/* --- Row 6 --- */}
                {/* General Remarks: C1-C6 (Span 6) */}
                {renderField('Remarks', 'Remarks', 'text', false, { placeholder: 'Optional remarks', colSpan: 6 })}

            </div>

            <div className={css.dataTableSection}>
                <TransactionTable
                    title={`Recent Transactions - By ${user?.username || 'User'}`}
                    config={TRANSACTION_CONFIG['drilling']}
                    data={tableData}
                    isLoading={tableLoading && page === 0}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    userRole="User"
                    hideHeader={false}
                />
                {/* Load More Button */}
                {tableData.length > 0 && hasMore && (
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
        </div>
    );
}
