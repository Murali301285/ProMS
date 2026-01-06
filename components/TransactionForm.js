'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, User, Users, RotateCcw } from 'lucide-react';

import { toast } from 'sonner';
import TransactionTable from './TransactionTable';
import SearchableSelect from './SearchableSelect';
import styles from './TransactionForm.module.css';

export default function TransactionForm({ initialData = null, isEdit = false, moduleType = 'loading-from-mines' }) { // Added moduleType
    const router = useRouter();
    console.log(`!!! VERSION_CHECK_FINAL: TransactionForm Loaded (${moduleType}) !!!`);
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs
    const shiftRef = useRef(null);
    const inchargeRef = useRef(null);
    const sourceRef = useRef(null);
    const destinationRef = useRef(null);
    const haulerRef = useRef(null); // Added Ref for Hauler
    const loadingMachineRef = useRef(null); // Added Ref for Loading M/C
    const prevDateRef = useRef(new Date().toISOString().split('T')[0]);

    // Initial Form State
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        SlNo: 0,
        LoadingId: 0,
        Date: '', // Init Empty (Load from Context)
        ShiftId: '',
        ShiftInchargeId: '', // Changed to Single Value
        MidScaleInchargeId: '', // Added New Field
        RelayId: '',
        SourceId: '',
        DestinationId: '',
        MaterialId: '',
        HaulerId: '',
        LoadingMachineId: '',
        NoOfTrips: '',
        MangQtyTrip: '',
        NTPCQtyTrip: '',
        Unit: '',
        MangTotalQty: '',
        NTPCTotalQty: '',
        Remarks: '',
        ManPower: '',
        CreatedBy: 0,
        CreatedDate: ''
    });

    const [errors, setErrors] = useState({});

    const [options, setOptions] = useState({
        shifts: [],
        incharges: [],
        relays: [],
        sources: [],
        destinations: [],
        materials: [],
        haulers: [],
        loaders: [],
        units: []
    });

    const [mappings, setMappings] = useState([]);
    const [filteredTableData, setFilteredTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [page, setPage] = useState(0); // Pagination Page Index
    const [hasMore, setHasMore] = useState(true); // Is there more data?

    // Derived State
    const filteredMaterials = useMemo(() => {
        if (!formData.DestinationId) return options.materials;
        const mappedIds = mappings
            .filter(m => m.DestinationId == formData.DestinationId)
            .map(m => m.MaterialId);

        if (mappedIds.length === 0) return options.materials;
        return options.materials.filter(m => mappedIds.includes(m.id));
    }, [formData.DestinationId, mappings, options.materials]);

    // State for User Info (Title)
    const [userName, setUserName] = useState('');

    // Initial Data Load (Dropdowns & Edit Data & User Info)
    useEffect(() => {
        const loadInit = async () => {
            try {
                // Fetch User Info
                fetch('/api/user/me').then(r => r.json()).then(res => {
                    if (res.success) setUserName(res.user.name || res.user.username);
                });

                // Fetch Dropdowns
                const fetchDDL = async (table, filter = null, extra = []) => {
                    try {
                        const res = await fetch('/api/settings/ddl', {
                            method: 'POST',
                            body: JSON.stringify({
                                table,
                                nameField: 'Name',
                                valueField: 'SlNo',
                                additionalColumns: extra, // Support extra cols
                                ...filter
                            })
                        }).then(r => r.json());
                        return Array.isArray(res) ? res : [];
                    } catch (e) {
                        console.error(`DDL ${table} Failed:`, e);
                        return [];
                    }
                };

                const [shifts, incharges, relays, sources, dests, mats, haulers, loaders, units, mapRes] = await Promise.all([
                    fetchDDL('shift', { nameField: 'ShiftName' }),
                    fetchDDL('operator', { nameField: 'OperatorName', filter: { SubCategoryId: 1 } }, ['OperatorId']),
                    fetchDDL('relay'),
                    fetchDDL('source'),
                    fetchDDL('destination'),
                    fetchDDL('material', { nameField: 'MaterialName' }, ['UnitId']),
                    fetchDDL('equipment', { nameField: 'EquipmentName', filter: { ActivityId: 4 } }),
                    fetchDDL('equipment', { nameField: 'EquipmentName', filter: { ActivityId: 3 } }),
                    fetchDDL('unit', { nameField: 'Name' }),
                    fetch('/api/settings/destination-material').then(r => r.json()).catch(() => ({ mappings: [] }))
                ]);

                setMappings(mapRes.mappings || []);
                // ... (setOptions remains same)

                setOptions({
                    shifts: shifts || [],
                    incharges: (incharges || []).map(i => ({
                        ...i,
                        name: `${i.name} (${i.OperatorId})`
                    })),
                    relays: relays || [],
                    sources: sources || [],
                    destinations: dests || [],
                    materials: mats || [],
                    haulers: haulers || [],
                    loaders: loaders || [],
                    units: units || []
                });

                if (isEdit && initialData) {
                    // console.log("Initializing Form with:", initialData);
                    setFormData({
                        ...initialData,
                        // Dynamic Date Mapping based on Module
                        Date: initialData.LoadingDate || initialData.RehandlingDate || initialData.TransferDate ?
                            new Date(initialData.LoadingDate || initialData.RehandlingDate || initialData.TransferDate).toISOString().split('T')[0] : '',

                        // Correct Mappings for Specific Fields
                        // Ensure Trips is mapped regardless of casing (NoOfTrips vs NoofTrip)
                        NoOfTrips: initialData.NoOfTrips || initialData.NoofTrip || '',

                        MangQtyTrip: initialData.QtyTrip,
                        NTPCQtyTrip: initialData.NtpcQtyTrip,
                        MangTotalQty: initialData.TotalQty,
                        NTPCTotalQty: initialData.TotalNtpcQty,
                        Unit: initialData.UnitId,
                        Remarks: initialData.Remarks || ''
                    });
                }

            } catch (error) {
                console.error("Init Error", error);
                toast.error("Failed to load master data. Please refresh.");
            } finally {
                setPageLoading(false);
            }
        };
        loadInit();
    }, [isEdit, initialData, moduleType]); // Added moduleType dependency

    // ... (Dynamic Filtering, Auto-Populate Unit remain same)

    // Auto-Fill Last Context
    useEffect(() => {
        const isDateChange = prevDateRef.current !== formData.Date;
        prevDateRef.current = formData.Date;

        const loadLast = async () => {
            try {
                // Only load context if in Create Mode (allow empty date for initial load)
                if (isEdit) return;

                const payload = {};
                if (formData.Date) payload.date = formData.Date;
                if (formData.ShiftId) payload.ShiftId = formData.ShiftId;

                console.log("🚀 [SmartContext] calling API", payload);

                const res = await fetch('/api/transaction/loading-from-mines/helper/last-context', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                }).then(r => r.json());

                // If Result Found -> Apply
                if (res.success && res.data) {
                    console.log("✅ [SmartContext] Valid Data Found:", res.data);
                    console.log("   -> Load Factors via Context:", res.data.ManagementQtyTrip, res.data.NTPCQtyTrip);
                    console.log("   -> Unit via Context:", res.data.UnitId);


                    // Parse Date
                    const newDate = res.data.LoadingDate ? new Date(res.data.LoadingDate).toISOString().split('T')[0] : '';

                    const isDefaultDate = formData.Date === new Date().toISOString().split('T')[0];

                    setFormData(prev => ({
                        ...prev,
                        // If current date is default (Today) and API returned a different date (History), switch to History
                        // Otherwise keep existing date (if user manually picked something else, or if same)
                        // FIX: If user explicit cleared date (isDateChange && !formData.Date), keep it empty.
                        Date: (isDateChange && !formData.Date) ? '' :
                            ((isDefaultDate && newDate) ? newDate : (prev.Date || newDate)),

                        ShiftId: res.data.ShiftId || prev.ShiftId,
                        ShiftInchargeId: res.data.ShiftInchargeId || '',
                        MidScaleInchargeId: res.data.MidScaleInchargeId || '',
                        RelayId: res.data.RelayId || '',
                        SourceId: res.data.SourceId || '',
                        ManPower: res.data.ManPower || '',

                        // Smart Context: Pre-Load these from history (User Request)
                        DestinationId: res.data.DestinationId || '',
                        MaterialId: res.data.MaterialId || '',
                        HaulerId: res.data.HaulerId || '',
                        Unit: res.data.UnitId || (options.materials?.find(m => m.id == res.data.MaterialId)?.UnitId) || '', // Auto-fill Unit (Context or Master)

                        // Explicitly Clear Transactional Fields
                        LoadingMachineId: '',
                        NoOfTrips: '',
                        MangQtyTrip: res.data.ManagementQtyTrip ?? '', // Pre-load Load Factor
                        NTPCQtyTrip: res.data.NTPCQtyTrip ?? '',       // Pre-load Load Factor
                        MangTotalQty: '',
                        NTPCTotalQty: '',
                        Remarks: ''
                    }));

                    // Prevent duplicate toasts (simple implementation: Use refined toast ID or just trust Effect cleanup)
                    // Better: Only toast if it's a "New" context load (e.g. not just a refresh)
                    toast.info("Context Loaded from Last Entry", { id: 'ctx-load' }); // Singleton toast

                    // Auto Focus Logic (Hauler Present -> Focus Loader, Else -> Focus Hauler)
                    setTimeout(() => {
                        // Check if Hauler was pre-loaded (and not just clearing)
                        const hasHauler = res.data.HaulerId;
                        if (hasHauler && loadingMachineRef.current) {
                            loadingMachineRef.current.focus();
                        } else if (haulerRef.current) {
                            haulerRef.current.focus();
                        }
                    }, 300);

                } else {
                    // NO DATA FOUND -> Clear Transactional Fields
                    console.log("ℹ️ [SmartContext] No previous data found.");

                    // Don't clear Date/Shift if just Date changed, but if Shift changed maybe?
                    // User Request: "Reset to default for other fields like Dest, Mat..."

                    setFormData(prev => ({
                        ...prev,
                        // Keep Date, Shift (if selected), 
                        ShiftInchargeId: '',
                        MidScaleInchargeId: '',
                        RelayId: '',
                        SourceId: '',
                        DestinationId: '',
                        MaterialId: '',
                        HaulerId: '',
                        LoadingMachineId: '',
                        ManPower: '',
                        Unit: '',
                        NoOfTrips: '',
                        MangQtyTrip: '',
                        NTPCQtyTrip: '',
                        MangTotalQty: '',
                        NTPCTotalQty: '',
                        Remarks: ''
                    }));
                }
            } catch (e) {
                console.error("❌ [SmartContext] API Call Failed:", e);
            }
        };

        const timer = setTimeout(loadLast, 500);
        return () => clearTimeout(timer);
    }, [formData.Date, formData.ShiftId, isEdit, moduleType]); // Trigger on Date OR Shift change

    // Handle Input Change
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' })); // Clear error

        // Auto-Focus Incharge (Large-Scale) on Shift Change
        if (name === 'ShiftId') {
            setTimeout(() => {
                if (inchargeRef.current) inchargeRef.current.focus();
            }, 100);
        }

        // Strict Integer Validation for ManPower and NoOfTrips
        if (['ManPower', 'NoOfTrips'].includes(name)) {
            // Allow empty string to let user backspace
            if (value !== '' && !/^\d+$/.test(value)) return;
        }
        // If Incharge fields, ensure they are single values (already handled by SearchableSelect scalar mode)

        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            // Cascade Reset: Destination -> Clear Material
            if (name === 'DestinationId') {
                updated.MaterialId = '';
            }

            // Auto Auto-Select Unit based on Material
            if (name === 'MaterialId') {
                // lookup unit from materials list
                const selectedMat = options.materials.find(m => m.id == value);
                if (selectedMat && selectedMat.UnitId) {
                    updated.Unit = selectedMat.UnitId;
                }
            }

            // Auto Calculate Totals
            if (['NoOfTrips', 'MangQtyTrip', 'NTPCQtyTrip'].includes(name)) {
                calculateTotals(updated);
            }
            return updated;
        });
    };

    const calculateTotals = (data) => {
        const trips = parseFloat(data.NoOfTrips) || 0;
        const mQty = parseFloat(data.MangQtyTrip) || 0;
        const nQty = parseFloat(data.NTPCQtyTrip) || 0;

        data.MangTotalQty = (trips * mQty).toFixed(2);
        data.NTPCTotalQty = (trips * nQty).toFixed(2);
    };

    // Auto-Fetch Qty/Trip Map
    useEffect(() => {
        if (formData.HaulerId && formData.MaterialId) {
            // Only fetch if NOT in edit mode OR values changed by user (to avoid overriding edit)
            // Actually, usually should re-fetch if mapping keys change.
            fetch(`/api/transaction/helper/qty-trip-mapping?haulerId=${formData.HaulerId}&materialId=${formData.MaterialId}`)
                .then(r => r.json())
                .then(res => {
                    if (res.success && res.data) {
                        setFormData(prev => {
                            const upd = {
                                ...prev,
                                MangQtyTrip: res.data.ManagementQtyTrip ?? '',
                                NTPCQtyTrip: res.data.NTPCQtyTrip ?? ''
                            };
                            calculateTotals(upd);
                            return upd;
                        });
                    } else if (res.success && res.data === null) {
                        // No Mapping Found - Show Error
                        // User requested "pop up modal". Using a persistent toast for now as it acts like a pop-up alert in this UI.
                        toast.error("No Qty Mapping is found for this material group and Material. Please check Master/Qty-Trip Mapping page.", {
                            duration: 5000,
                            style: { border: '2px solid red', background: '#fff0f0' }
                        });
                    }
                });
        }
    }, [formData.HaulerId, formData.MaterialId]);


    const pageRef = useRef(0);

    // Auto-Fetch Data Table List (Context Aware & Dynamic Filter)
    const fetchContextData = useCallback(async (isLoadMore = false) => {
        if (!isLoadMore) {
            // Reset if fresh load
            setPage(0);
            pageRef.current = 0;
            setHasMore(true);
        }

        setTableLoading(true);
        try {
            // Use Ref for stable page access without dependency
            const currentPage = isLoadMore ? pageRef.current + 1 : 0;
            const take = 50;
            const skip = currentPage * take;

            const payload = {
                Date: formData.Date,
                ShiftId: formData.ShiftId,
                SourceId: formData.SourceId,
                DestinationId: formData.DestinationId,
                MaterialId: formData.MaterialId,
                HaulerId: formData.HaulerId,
                LoadingMachineId: formData.LoadingMachineId,
                skip,
                take
            };

            const res = await fetch('/api/transaction/loading-from-mines/helper/recent-list', {
                method: 'POST',
                body: JSON.stringify(payload)
            }).then(r => r.json());

            if (res.success) {
                const newData = res.data || [];
                if (newData.length < take) {
                    setHasMore(false);
                }

                if (isLoadMore) {
                    setFilteredTableData(prev => [...prev, ...newData]);
                    setPage(currentPage);
                    pageRef.current = currentPage;
                } else {
                    setFilteredTableData(newData);
                }
            }
        } catch (e) {
            console.error("Recent List Fetch Error", e);
        } finally {
            setTableLoading(false);
        }
    }, [
        formData.Date,
        formData.ShiftId,
        formData.SourceId,
        formData.DestinationId,
        formData.MaterialId,
        formData.HaulerId,
        formData.LoadingMachineId
        // Removed 'page' dependency to prevent infinite reset loop
    ]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchContextData(false); // Fresh Load
        }, 500); // 500ms Debounce
        return () => clearTimeout(timer);
    }, [fetchContextData]);

    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const form = e.target.form || e.target.closest('form');
            if (!form) return; // Should not happen if wrapped correctly

            // Find all inputs, selects, and our custom searchable buttons
            const elements = Array.from(form.querySelectorAll('input:not([type="hidden"]), select, textarea, button[data-searchable], [tabindex]:not([tabindex="-1"])')).filter(el =>
                !el.disabled && !el.hidden && el.offsetParent !== null && !el.classList.contains('hidden')
            );

            const index = elements.indexOf(e.target);
            if (index > -1) {
                let nextIndex = index + 1;
                while (nextIndex < elements.length) {
                    const next = elements[nextIndex];
                    if (!next.readOnly) {
                        next.focus();
                        return;
                    }
                    nextIndex++;
                }
                // If end of form, focus Save Button?
                // Assuming Save button is last or explicitly labeled?
                // For now, let's just stop or loop.
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const required = ['Date', 'ShiftId', 'RelayId', 'ManPower', 'SourceId', 'DestinationId', 'MaterialId', 'HaulerId', 'LoadingMachineId', 'NoOfTrips', 'Unit', 'MangQtyTrip', 'NTPCQtyTrip', 'MangTotalQty', 'NTPCTotalQty'];
        required.forEach(field => {
            if (!formData[field]) newErrors[field] = 'Required';
        });

        if (!formData.ShiftInchargeId) newErrors.ShiftInchargeId = 'Required';

        // MidScaleInchargeId is now MANDATORY per user request (Step 1497)
        if (!formData.MidScaleInchargeId) newErrors.MidScaleInchargeId = 'Required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleReset = () => {
        // Full Reset logic (similar to initial state but keeping context if intended? usually Reset button clears everything or reverts to defaults)
        // User behavior "Reset form to defaults" implies clearing transaction data.
        // If in Edit mode, it might mean "Reload initial data", but usually just clears user input.

        if (isEdit) {
            // In Edit mode, reset to initialData
            setFormData({
                ...initialData,
                Date: initialData.LoadingDate ? new Date(initialData.LoadingDate).toISOString().split('T')[0] : '',
                NoOfTrips: initialData.NoOfTrips || initialData.NoofTrip || '',
                MangQtyTrip: initialData.QtyTrip,
                NTPCQtyTrip: initialData.NtpcQtyTrip,
                MangTotalQty: initialData.TotalQty,
                NTPCTotalQty: initialData.TotalNtpcQty,
                Unit: initialData.UnitId,
                Remarks: initialData.Remarks || ''
            });
        } else {
            // In Add Mode: Clear Transaction fields, Keep Date/Shift/Context if desirable, OR clear all? 
            // The "Reset" button usually clears everything the user typed. 
            // But let's follow the "Reset Row 3" logic we used in save-success, plus clearing context if the USER clicks Reset.
            // ACTUALLY, usually Reset button clears to "Blank Form" state.
            setFormData(prev => ({
                ...prev,
                // Keep Context (Date, Shift, Incharge, Relay, Source) - as these are often repetitive
                ShiftInchargeId: prev.ShiftInchargeId,
                MidScaleInchargeId: prev.MidScaleInchargeId,
                RelayId: prev.RelayId,
                SourceId: prev.SourceId,
                ManPower: prev.ManPower,

                // Reset Destination and below
                DestinationId: '',
                MaterialId: '',
                HaulerId: '',
                LoadingMachineId: '',
                NoOfTrips: '',
                MangQtyTrip: '',
                NTPCQtyTrip: '',
                Unit: '',
                MangTotalQty: '',
                NTPCTotalQty: '',
                Remarks: ''
            }));

            setErrors({});
            // Focus Source or Date?
            if (shiftRef.current) shiftRef.current.focus();
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error("Please fill all mandatory fields");
            return;
        }

        setIsLoading(true);
        try {
            // Duplicate Check (Add Mode Only)
            if (!isEdit) {
                const dupRes = await fetch('/api/transaction/loading-from-mines/helper/check-duplicate', {
                    method: 'POST', body: JSON.stringify(formData)
                }).then(r => r.json());

                if (dupRes.exists) {
                    toast.error("Duplicate Entry! A record with this combination already exists.");
                    setIsSubmitting(false);
                    return;
                }
            }

            const url = isEdit
                ? `/api/transaction/loading-from-mines/${initialData.SlNo}`
                : '/api/transaction/loading-from-mines/add';

            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            }).then(r => r.json());

            if (res.success) {
                toast.success(isEdit ? "Record updated successfully!" : "Record saved successfully!");
                if (isEdit) {
                    router.push('/dashboard/transaction/loading-from-mines');
                } else {
                    // Reset Row 3 ONLY (Keep Context)
                    // Reset Logic as per User Request
                    setFormData(prev => ({
                        ...prev,
                        // Retain: Date, Shift, Incharge, ManPower, Relay, Source
                        // AND Retain: Destination, Material, Hauler (User Request)
                        DestinationId: prev.DestinationId,
                        MaterialId: prev.MaterialId,
                        HaulerId: prev.HaulerId,

                        // RETAIN Load Factors & Unit (User Request Re-Fix)
                        MangQtyTrip: prev.MangQtyTrip,
                        NTPCQtyTrip: prev.NTPCQtyTrip,
                        Unit: prev.Unit,

                        // Reset Transactional Fields
                        LoadingMachineId: '',
                        NoOfTrips: '',
                        MangTotalQty: '',
                        NTPCTotalQty: '',
                        Remarks: ''
                    }));

                    // Focus Loading Machine after Reset (User Request)
                    setTimeout(() => {
                        if (loadingMachineRef.current) loadingMachineRef.current.focus();
                    }, 100);

                    fetchContextData(false); // Refresh the grid below
                }
            } else {
                toast.error(res.message || "Failed to save record");
            }
        } catch (e) {
            console.error(e);
            toast.error("An error occurred during save");
        } finally {
            setIsLoading(false);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKd = (e) => {
            if (e.key === 'F2' || (e.ctrlKey && e.key === 's')) {
                e.preventDefault();
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handleKd);
        return () => window.removeEventListener('keydown', handleKd);
    }, [formData]); // Re-bind on data change to capture latest

    if (pageLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading...</div>;

    return (
        <div className={styles.container}>
            {/* Header: Left (Back), Center (Title), Right (Save) */}
            {/* Header: Left (Back + Scope), Center (Title), Right (Save) */}
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => router.push('/dashboard/transaction/loading-from-mines')} className={styles.backBtn}>
                        <ArrowLeft size={18} /> Back
                    </button>



                </div>

                <h1 className={styles.headerTitle}>
                    {isEdit ? 'Update' : 'Create'} Loading From Mines
                </h1>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={async () => {
                            if (confirm('Reset form to defaults?')) {
                                // Step 1: Reset to "Fresh" state with EMPTY Date
                                // This causes useEffect to fire -> fetch "latest user context" -> fill Date/Shift/etc
                                setFormData({
                                    SlNo: 0, LoadingId: 0,
                                    Date: '', // Let Effect Fill this
                                    ShiftId: '',
                                    ShiftInchargeId: '', MidScaleInchargeId: '',
                                    RelayId: '',
                                    SourceId: '', DestinationId: '', MaterialId: '', HaulerId: '', LoadingMachineId: '',
                                    NoOfTrips: '', MangQtyTrip: '', NTPCQtyTrip: '', Unit: '', MangTotalQty: '', NTPCTotalQty: '',
                                    Remarks: '', ManPower: '', CreatedBy: 0, CreatedDate: ''
                                });
                                setErrors({});

                                toast.info("Resetting...");
                            }
                        }}
                        className={styles.saveBtn}
                        title="Reset Form"
                        type="button"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button onClick={handleSubmit} disabled={isLoading} className={styles.saveBtn}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                        {isEdit ? 'Update (F2)' : 'Save (F2)'}
                    </button>
                </div>
            </div>

            {/* 8-COLUMN GRID LAYOUT */}
            <form className={styles.card} onSubmit={(e) => e.preventDefault()}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '15px' }}>

                    {/* --- Row 1 --- */}

                    {/* Date: R1 C1 */}
                    <div className={styles.group} style={{ gridColumn: '1 / span 1' }}>
                        <label>Date <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="date" name="Date" value={formData.Date} max={new Date().toISOString().split('T')[0]}
                            onChange={handleChange} onKeyDown={handleEnter}
                            onClick={(e) => {
                                try {
                                    if (e.target.showPicker) {
                                        e.target.showPicker();
                                    }
                                } catch (error) {
                                    console.log("Picker not supported", error);
                                }
                            }}
                            className={`${styles.input} ${errors.Date ? styles.errorBorder : ''} ${styles.uniqueField}`}
                        />
                        {errors.Date && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Shift: R1 C2 */}
                    <div className={styles.group} style={{ gridColumn: '2 / span 1' }}>
                        <label>Shift <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            ref={shiftRef}
                            name="ShiftId"
                            value={formData.ShiftId}
                            onChange={handleChange}
                            options={options.shifts}
                            placeholder="Select Shift"
                            autoFocus
                            className={`${styles.select} ${styles.uniqueField}`}
                            error={errors.ShiftId}
                        />
                        {errors.ShiftId && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Shift Incharge (Large Scale): R1 C3-C4 (Span 2) */}
                    <div className={styles.group} style={{ gridColumn: '3 / span 2' }}>
                        <label>Incharge (Large-Scale) <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            ref={inchargeRef}
                            name="ShiftInchargeId"
                            value={formData.ShiftInchargeId}
                            onChange={handleChange}
                            options={options.incharges}
                            placeholder="Large Scale"
                            className={styles.select}
                            error={errors.ShiftInchargeId}
                        />
                        {errors.ShiftInchargeId && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Incharge (Mid Scale): R1 C5-C6 (Span 2) */}
                    <div className={styles.group} style={{ gridColumn: '5 / span 2' }}>
                        <label>Incharge (Mid-Scale) <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            name="MidScaleInchargeId"
                            value={formData.MidScaleInchargeId}
                            onChange={handleChange}
                            options={options.incharges}
                            placeholder="Mid Scale"
                            className={styles.select}
                            error={errors.MidScaleInchargeId}
                        />
                        {errors.MidScaleInchargeId && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Man Power: R1 C7 */}
                    <div className={styles.group} style={{ gridColumn: '7 / span 1' }}>
                        <label>Man Power <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text" name="ManPower" value={formData.ManPower}
                            onChange={handleChange} className={`${styles.input} ${errors.ManPower ? styles.errorBorder : ''}`}
                            onKeyDown={handleEnter} placeholder="Man Power"
                        />
                        {errors.ManPower && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Relay: R1 C8 */}
                    <div className={styles.group} style={{ gridColumn: '8 / span 1' }}>
                        <label>Relay <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            name="RelayId"
                            value={formData.RelayId}
                            onChange={handleChange}
                            options={options.relays}
                            placeholder="Select Relay"
                            className={styles.select}
                            error={errors.RelayId}
                        />
                        {errors.RelayId && <div className={styles.errorMsg}>Required</div>}
                    </div>


                    {/* --- Row 2 --- */}

                    {/* Source: R2 C1 */}
                    <div className={styles.group} style={{ gridColumn: '1 / span 1' }}>
                        <label>Source <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            ref={sourceRef}
                            name="SourceId"
                            value={formData.SourceId}
                            onChange={handleChange}
                            options={options.sources}
                            placeholder="Select Source"
                            className={`${styles.select} ${styles.uniqueField}`}
                            error={errors.SourceId}
                        />
                        {errors.SourceId && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Destination: R2 C2 */}
                    <div className={styles.group} style={{ gridColumn: '2 / span 1' }}>
                        <label>Destination <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            ref={destinationRef}
                            name="DestinationId"
                            value={formData.DestinationId}
                            onChange={handleChange}
                            options={options.destinations}
                            placeholder="Select Destination"
                            className={`${styles.select} ${styles.uniqueField}`}
                            error={errors.DestinationId}
                        />
                        {errors.DestinationId && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Material: R2 C3 */}
                    <div className={styles.group} style={{ gridColumn: '3 / span 1' }}>
                        <label>Material <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            name="MaterialId"
                            value={formData.MaterialId}
                            onChange={handleChange}
                            options={filteredMaterials}
                            placeholder="Select Material"
                            className={`${styles.select} ${styles.uniqueField}`}
                            error={errors.MaterialId}
                        />
                        {errors.MaterialId && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Hauler: R2 C4-C5 (Span 2) */}
                    <div className={styles.group} style={{ gridColumn: '4 / span 2' }}>
                        <label>Hauler <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            ref={haulerRef}
                            name="HaulerId"
                            value={formData.HaulerId}
                            onChange={handleChange}
                            options={options.haulers}
                            placeholder="Select Hauler"
                            className={`${styles.select} ${styles.uniqueField}`}
                            error={errors.HaulerId}
                        />
                        {errors.HaulerId && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Loading M/C: R2 C6-C7 (Span 2) */}
                    <div className={styles.group} style={{ gridColumn: '6 / span 2' }}>
                        <label>Loading M/C <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            ref={loadingMachineRef}
                            name="LoadingMachineId"
                            value={formData.LoadingMachineId}
                            onChange={handleChange}
                            options={options.loaders}
                            placeholder="Select Loader"
                            className={`${styles.select} ${styles.uniqueField}`}
                            error={errors.LoadingMachineId}
                        />
                        {errors.LoadingMachineId && <div className={styles.errorMsg}>Required</div>}
                    </div>


                    {/* --- Row 3 --- */}

                    {/* No of Trips: R3 C1 */}
                    <div className={styles.group} style={{ gridColumn: '1 / span 1' }}>
                        <label>No of Trips <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text" name="NoOfTrips" value={formData.NoOfTrips}
                            onChange={handleChange} onKeyDown={handleEnter}
                            className={`${styles.input} ${errors.NoOfTrips ? styles.errorBorder : ''}`} placeholder="Enter No of Trips"
                        />
                        {errors.NoOfTrips && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Mang Qty/Trip: R3 C2 */}
                    <div className={styles.group} style={{ gridColumn: '2 / span 1' }}>
                        <label>Mang. Load Factor <span style={{ color: 'red' }}>*</span></label>
                        <input type="number" name="MangQtyTrip" value={formData.MangQtyTrip} readOnly className={`${styles.input} ${styles.readOnly}`} />
                        {errors.MangQtyTrip && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* NTPC Qty/Trip: R3 C3 */}
                    <div className={styles.group} style={{ gridColumn: '3 / span 1' }}>
                        <label>NTPC Load Factor <span style={{ color: 'red' }}>*</span></label>
                        <input type="number" name="NTPCQtyTrip" value={formData.NTPCQtyTrip} readOnly className={`${styles.input} ${styles.readOnly}`} />
                        {errors.NTPCQtyTrip && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Unit: R3 C4 */}
                    <div className={styles.group} style={{ gridColumn: '4 / span 1' }}>
                        <label>Unit <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            name="Unit"
                            value={formData.Unit}
                            onChange={handleChange}
                            options={options.units}
                            placeholder="Select Unit"
                            className={styles.select}
                            error={errors.Unit}
                        />
                        {errors.Unit && <div className={styles.errorMsg}>Required</div>}
                    </div>

                    {/* Mang Total Qty: R3 C5 */}
                    <div className={styles.group} style={{ gridColumn: '5 / span 1' }}>
                        <label>Mang Total Qty <span style={{ color: 'red' }}>*</span></label>
                        <input type="number" name="MangTotalQty" value={formData.MangTotalQty} readOnly className={`${styles.input} ${styles.readOnly}`} />
                    </div>

                    {/* NTPC Total Qty: R3 C6 */}
                    <div className={styles.group} style={{ gridColumn: '6 / span 1' }}>
                        <label>NTPC Total Qty <span style={{ color: 'red' }}>*</span></label>
                        <input type="number" name="NTPCTotalQty" value={formData.NTPCTotalQty} readOnly className={`${styles.input} ${styles.readOnly}`} />
                    </div>


                    {/* --- Row 4 --- */}

                    {/* Remarks: R4 C1-C6 (Span 6) */}
                    <div className={styles.group} style={{ gridColumn: '1 / span 6' }}>
                        <label>Remarks</label>
                        <input
                            type="text"
                            name="Remarks" value={formData.Remarks}
                            onChange={handleChange} onKeyDown={handleEnter}
                            className={styles.input} placeholder="Any Remarks..."
                        />
                    </div>

                </div>

                {/* Submit / Reset / Cancel */}
                {/* Bottom Actions Removed - Handled in Header */}

            </form>

            {/* Transaction Table Section */}
            <div className={styles.tableSection} style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <TransactionTable
                    title="Recent Transactions"
                    config={{
                        columns: [
                            { accessor: 'SlNo', label: 'Sl No', width: 60, disableFilter: true },
                            { accessor: 'Date', label: 'Date', width: 100, type: 'date', disableFilter: true },
                            { accessor: 'ShiftName', label: 'Shift', width: 80 },
                            { accessor: 'ShiftInchargeName', label: 'Incharge (L)', width: 130 },
                            { accessor: 'MidScaleInchargeName', label: 'Incharge (M)', width: 130 },
                            { accessor: 'ManPower', label: 'ManP', width: 60 },
                            { accessor: 'RelayName', label: 'Relay', width: 80 },
                            { accessor: 'SourceName', label: 'Source', width: 110 },
                            { accessor: 'DestinationName', label: 'Destination', width: 110 },
                            { accessor: 'MaterialName', label: 'Material', width: 110 },
                            { accessor: 'HaulerName', label: 'Hauler', width: 130 },
                            { accessor: 'LoadingMachineName', label: 'Loading M/C', width: 130 },
                            { accessor: 'NoOfTrips', label: 'Trips', width: 60 },
                            { accessor: 'QtyTrip', label: 'Mang LF', width: 80 },
                            { accessor: 'NtpcQtyTrip', label: 'NTPC LF', width: 80 },
                            { accessor: 'UnitName', label: 'Unit', width: 60 },
                            { accessor: 'TotalQty', label: 'Mang Total', width: 100, type: 'number' },
                            { accessor: 'TotalNtpcQty', label: 'NTPC Total', width: 100, type: 'number' },
                            { accessor: 'CreatedByName', label: 'Created By', width: 100 },
                            { accessor: 'CreatedDate', label: 'Created', type: 'datetime', width: 130 }
                        ],
                        idField: 'SlNo',
                        defaultSort: 'SlNo'
                    }}
                    data={filteredTableData}
                    isLoading={tableLoading && page === 0}
                    onEdit={(row) => router.push(`/dashboard/transaction/loading-from-mines/edit/${row.SlNo}`)}
                    userRole="User"
                />

                {/* Load More Button */}
                {filteredTableData.length > 0 && hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', marginBottom: '30px' }}>
                        <button
                            type="button"
                            onClick={() => fetchContextData(true)}
                            disabled={tableLoading}
                            style={{
                                padding: '8px 24px', // Comfortable click area
                                background: 'white',
                                border: '1px solid #cbd5e1',
                                borderRadius: '20px', // Pill shape
                                color: '#334155',
                                cursor: tableLoading ? 'wait' : 'pointer',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                fontWeight: 600,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                        >
                            {tableLoading ? (
                                <span style={{ color: '#64748b' }}>Loading more...</span>
                            ) : (
                                <>
                                    <span>Load More Records</span>
                                    <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', color: '#475569' }}>+50</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
}
