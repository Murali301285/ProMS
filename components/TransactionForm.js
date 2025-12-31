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

    // Refs
    const shiftRef = useRef(null);
    const inchargeRef = useRef(null);
    const sourceRef = useRef(null);
    const destinationRef = useRef(null);
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

                    // Parse Date
                    const newDate = res.data.LoadingDate ? new Date(res.data.LoadingDate).toISOString().split('T')[0] : '';

                    const isDefaultDate = formData.Date === new Date().toISOString().split('T')[0];

                    setFormData(prev => ({
                        ...prev,
                        // If current date is default (Today) and API returned a different date (History), switch to History
                        // Otherwise keep existing date (if user manually picked something else, or if same)
                        Date: (isDefaultDate && newDate) ? newDate : (prev.Date || newDate),

                        ShiftId: res.data.ShiftId || prev.ShiftId,
                        ShiftInchargeId: res.data.ShiftInchargeId || '',
                        MidScaleInchargeId: res.data.MidScaleInchargeId || '',
                        RelayId: res.data.RelayId || '',
                        SourceId: res.data.SourceId || '',
                        ManPower: res.data.ManPower || '',
                        // Clear others
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

                    // Prevent duplicate toasts (simple implementation: Use refined toast ID or just trust Effect cleanup)
                    // Better: Only toast if it's a "New" context load (e.g. not just a refresh)
                    toast.info("Context Loaded from Last Entry", { id: 'ctx-load' }); // Singleton toast

                    // Focus Destination
                    if (destinationRef.current) setTimeout(() => destinationRef.current.focus(), 300);

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


    // Auto-Fetch Data Table List (Context Aware & Dynamic Filter)
    const fetchContextData = useCallback(async () => {
        // As per request: "Controls like Date, Shift... changes -> recent transactions should load based on the filtered details"
        // Also: "Select... from tblload where Date... etc"
        // If field is empty -> no filter.

        setTableLoading(true);
        try {
            const payload = {
                Date: formData.Date,
                ShiftId: formData.ShiftId,
                SourceId: formData.SourceId,
                DestinationId: formData.DestinationId,
                MaterialId: formData.MaterialId,
                HaulerId: formData.HaulerId,
                LoadingMachineId: formData.LoadingMachineId
            };

            console.log("🔍 Fetching Recent List with Filter:", payload);

            const res = await fetch('/api/transaction/loading-from-mines/helper/recent-list', {
                method: 'POST',
                body: JSON.stringify(payload)
            }).then(r => r.json());

            if (res.success) {
                setFilteredTableData(res.data || []);
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
    ]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchContextData();
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
                    setIsLoading(false);
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
                        // Reset below:
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

                    // Focus Destination after Reset
                    setTimeout(() => {
                        if (destinationRef.current) destinationRef.current.focus();
                    }, 100);

                    fetchContextData(); // Refresh the grid below
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
                <div className={styles.tableSection} style={{ marginTop: '12px' }}>
                    {/* Header handled by TransactionTable title prop */}
                    <TransactionTable
                        config={{
                            columns: [
                                { accessor: 'SlNo', label: 'Sl No', width: 60, disableFilter: true },
                                { accessor: 'Date', label: 'Date', width: 100, type: 'date', disableFilter: true },
                                { accessor: 'ShiftName', label: 'Shift', width: 100 },
                                { accessor: 'ShiftInchargeName', label: 'Incharge (Large)', width: 150 },
                                { accessor: 'MidScaleInchargeName', label: 'Incharge (Mid)', width: 150 },
                                { accessor: 'ManPower', label: 'Man Power', width: 90 },
                                { accessor: 'RelayName', label: 'Relay', width: 100 },
                                { accessor: 'SourceName', label: 'Source', width: 120 },
                                { accessor: 'DestinationName', label: 'Destination', width: 120 },
                                { accessor: 'MaterialName', label: 'Material', width: 120 },
                                { accessor: 'HaulerName', label: 'Hauler', width: 140 },
                                { accessor: 'LoadingMachineName', label: 'Loading M/C', width: 140 }, // Changed label to match request
                                { accessor: 'NoOfTrips', label: 'Trips', width: 80 },
                                { accessor: 'QtyTrip', label: 'Mang. Load Factor', width: 130 },
                                { accessor: 'NtpcQtyTrip', label: 'NTPC Load Factor', width: 130 },
                                { accessor: 'UnitName', label: 'Unit', width: 80 },
                                { accessor: 'TotalQty', label: 'Mang Total Qty', width: 130, type: 'number' },
                                { accessor: 'TotalNtpcQty', label: 'NTPC Total Qty', width: 130, type: 'number' },
                                { accessor: 'CreatedByName', label: 'Created By', width: 110 },
                                { accessor: 'CreatedDate', label: 'Created Date', type: 'datetime', width: 140 },
                                { accessor: 'UpdatedByName', label: 'Updated By', width: 110 },
                                { accessor: 'UpdatedDate', label: 'Updated Date', type: 'datetime', width: 140 }
                            ]
                        }}
                        title={userName ? `Recent Transactions - by ${userName}` : "Recent Transactions"}
                        data={filteredTableData}
                        isLoading={tableLoading}
                        onEdit={(row) => {
                            // Edit Logic - mostly handled by parent or router.push
                            // But here we are in Add page usually... Wait, this table is used for "Recent".
                            // Clicking Edit here should navigate to Edit page.
                            router.push(`/dashboard/transaction/loading-from-mines/edit/${row.SlNo}`);
                        }}
                        userRole="User" // TODO: Pass actual role
                    />
                </div>
            </form>
        </div >
    );
}
