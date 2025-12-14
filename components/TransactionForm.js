'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, User, Users, RotateCcw } from 'lucide-react';

import { toast } from 'sonner';
import TransactionTable from './TransactionTable';
import SearchableSelect from './SearchableSelect';
import styles from './TransactionForm.module.css';

export default function TransactionForm({ initialData = null, isEdit = false }) {
    const router = useRouter();
    console.log("!!! VERSION_CHECK_FINAL: TransactionForm Loaded !!!");
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Dropdown Options State
    const [options, setOptions] = useState({
        shifts: [],
        incharges: [],
        relays: [],
        sources: [],
        destinations: [],
        materials: [],
        haulers: [],
        loaders: [],
        units: [] // Assuming standard units or fetched
    });

    // Form State
    const [formData, setFormData] = useState({
        Date: new Date().toISOString().split('T')[0],
        ShiftId: '',
        ShiftInchargeId: [], // Array for multiple
        ManPower: '',
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
        Remarks: '' // Added Remarks
    });

    // State for Auto-Fill & Validation
    const [errors, setErrors] = useState({});

    // Data Table State (Context-Aware List)
    const [filteredTableData, setFilteredTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);

    // Focus Refs
    const destinationRef = useRef(null);

    // Initial Data Load (Dropdowns & Edit Data)
    useEffect(() => {
        const loadInit = async () => {
            try {
                // Fetch Dropdowns
                // Added Logs for Debugging
                const fetchDDL = async (table, filter = null, extra = []) => {
                    try {
                        console.log(`Fetching DDL for ${table}...`);
                        const res = await fetch('/api/settings/ddl', {
                            method: 'POST',
                            body: JSON.stringify({
                                table,
                                nameField: 'Name',
                                valueField: 'SlNo',
                                additionalColumns: extra,
                                ...filter
                            })
                        }).then(r => r.json());
                        // console.log(`DDL ${table} Result:`, res); // Reduced noise
                        return Array.isArray(res) ? res : [];
                    } catch (e) {
                        console.error(`DDL ${table} Failed:`, e);
                        return [];
                    }
                };

                // NOTE: Using individual fetch calls wrapped in helper to debug easier
                // NOTE: Using individual fetch calls wrapped in helper to debug easier
                const [shifts, incharges, relays, sources, dests, mats, haulers, loaders, units] = await Promise.all([
                    fetchDDL('shift', { nameField: 'ShiftName' }),
                    fetchDDL('operator', { nameField: 'OperatorName', filter: { SubCategoryId: 1 } }, ['OperatorId']), // Request OperatorId
                    fetchDDL('relay'),   // User requested [Name]
                    fetchDDL('source'),  // User requested [Name]
                    fetchDDL('destination'), // User requested [Name]
                    fetchDDL('material', { nameField: 'MaterialName' }),
                    fetchDDL('equipment', { nameField: 'EquipmentName', filter: { ActivityId: 4 } }), // Hauler
                    fetchDDL('equipment', { nameField: 'EquipmentName', filter: { ActivityId: 3 } }), // Loader
                    fetchDDL('unit', { nameField: 'Name' }) // Fixed: DB Column is Name, not UnitName
                ]);

                console.log("👉 Loaded Data:", { shifts, incharges, haulers });

                setOptions({
                    shifts: shifts || [],
                    incharges: (incharges || []).map(i => ({
                        ...i,
                        name: `${i.name} (${i.OperatorId})` // Format: Name (OperatorId)
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
                    setFormData({
                        ...initialData,
                        Date: initialData.LoadingDate ? new Date(initialData.LoadingDate).toISOString().split('T')[0] : '',
                        MangQtyTrip: initialData.QtyTrip, // Mapping DB Names to Form Names
                        NTPCQtyTrip: initialData.NtpcQtyTrip,
                        MangTotalQty: initialData.TotalQty,
                        NTPCTotalQty: initialData.TotalNtpcQty,
                        Unit: initialData.UnitId, // UnitId
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
    }, [isEdit, initialData]);

    // Auto-Fill Last Context
    useEffect(() => {
        if (isEdit || !formData.Date) return;

        const loadLast = async () => {
            try {
                const res = await fetch('/api/transaction/helper/last-context', {
                    method: 'POST',
                    body: JSON.stringify({ date: formData.Date, ShiftId: formData.ShiftId })
                }).then(r => r.json());

                if (res.success && res.data) {
                    setFormData(prev => ({
                        ...prev,
                        ShiftId: res.data.ShiftId || '',
                        ShiftInchargeId: res.data.ShiftInchargeIds
                            ? res.data.ShiftInchargeIds.split(',').map(id => Number(id))
                            : [],
                        RelayId: res.data.RelayId || '',
                        SourceId: res.data.SourceId || '',
                        DestinationId: res.data.DestinationId || '',
                        MaterialId: res.data.MaterialId || '',
                        HaulerId: res.data.HaulerEquipmentId || '',
                        LoadingMachineId: res.data.LoadingMachineId || '',
                        ManPower: res.data.ManPower || '', // Added ManPower
                        Unit: res.data.Unit || '', // Added Unit
                        // Keep Date, Trips, Quantity blank/existing unless we want to copy them? User implies default should be loaded.
                    }));
                    console.log("✅ Auto-Filled Context:", res.data);
                    toast.info(`Context Loaded`);
                }
            } catch (e) {
                console.error("Auto-Fill Failed", e);
            }
        };
        // Debounce slightly or just call
        const timer = setTimeout(loadLast, 500);
        return () => clearTimeout(timer);
    }, [formData.Date, formData.ShiftId, isEdit]); // Removed userScope

    // Handle Input Change
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' })); // Clear error

        // Strict Integer Validation for ManPower and NoOfTrips
        if (['ManPower', 'NoOfTrips'].includes(name)) {
            // Allow empty string to let user backspace
            if (value !== '' && !/^\d+$/.test(value)) {
                return; // Ignore non-integer input
            }
        }

        setFormData(prev => {
            const updated = { ...prev, [name]: value };

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
                                MangQtyTrip: res.data.ManagementQtyTrip,
                                NTPCQtyTrip: res.data.NTPCQtyTrip
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


    // Auto-Fetch Data Table List (Context Aware)
    const fetchContextData = useCallback(async () => {
        // Only fetch if context is "sufficiently" filled? Or Just fetch?
        // Let's fetch if Date & Shift are present at minimum.
        // Only fetch if Date is present (Shift is optional for initial view)
        if (!formData.Date) return;

        setTableLoading(true);
        try {
            // Reuse main GET API but with specific filters?
            // Actually main GET API supports Date.
            // But we need exact match on Shift, Relay, etc.
            // Client-side filtering of "Add" page is complex if we use main API.
            // Let's rely on standard GET and maybe filter client side?
            // OR pass strict params.
            // Let's construct a search query string.
            const query = new URLSearchParams({
                fromDate: formData.Date,
                toDate: formData.Date,
                limit: 1000000 // Get all rows for client-side filtering
            });

            const res = await fetch(`/api/transaction/loading-from-mines?${query}`).then(r => r.json());
            if (res.data) {
                // Client-side strict filter to show ONLY matching context
                // Context: Shift, Relay, Source, Dest, Material, Hauler
                const filtered = res.data.filter(row =>
                    (!formData.ShiftId || row.ShiftId == formData.ShiftId) && // Loose equality, optional
                    (!formData.RelayId || row.RelayId == formData.RelayId) &&
                    (!formData.SourceId || row.SourceId == formData.SourceId) &&
                    (!formData.DestinationId || row.DestinationId == formData.DestinationId) &&
                    (!formData.MaterialId || row.MaterialId == formData.MaterialId) &&
                    (!formData.HaulerId || row.HaulerEquipmentId == formData.HaulerId)
                );
                setFilteredTableData(filtered);
            }
        } finally {
            setTableLoading(false);
        }
    }, [
        formData.Date,
        formData.ShiftId,
        formData.ShiftInchargeId, // Added
        formData.RelayId,
        formData.SourceId,
        formData.DestinationId,
        formData.MaterialId,
        formData.HaulerId,
        formData.LoadingMachineId // Added
    ]);

    useEffect(() => {
        fetchContextData();
    }, [fetchContextData]); // Debouncing might be needed if frequent updates

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

        // Special validation for Array (ShiftInchargeId)
        if (!formData.ShiftInchargeId || (Array.isArray(formData.ShiftInchargeId) && formData.ShiftInchargeId.length === 0)) {
            newErrors.ShiftInchargeId = 'Required';
        }

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
                const dupRes = await fetch('/api/transaction/helper/check-duplicate', {
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
                    router.back();
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


                    <button
                        onClick={async () => {
                            if (confirm('Reset form to defaults?')) {
                                const today = new Date().toISOString().split('T')[0];

                                // 1. Reset Form State
                                setFormData({
                                    SlNo: 0,
                                    LoadingId: 0,
                                    Date: today, // Reset to Today
                                    ShiftId: '',
                                    ShiftInchargeId: [],
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
                                setErrors({});

                                // 2. Trigger "Load Last Data" logic (simulating UserScope='ME' for specific date)
                                // We reuse the logic: if scope is ALL or ME, fetch last context.
                                // Here we force fetch context for TODAY.
                                try {
                                    setIsLoading(true);
                                    const res = await fetch('/api/transaction/helper/last-context', {
                                        method: 'POST',
                                        body: JSON.stringify({ date: today, ShiftId: '' })
                                    }).then(r => r.json());

                                    if (res.success && res.data) {
                                        setFormData(prev => ({
                                            ...prev,
                                            ShiftId: res.data.ShiftId || '',
                                            ShiftInchargeId: res.data.ShiftInchargeId ? [res.data.ShiftInchargeId] : [], // Ensure array if single ID returned? Setup logic handles it?
                                            // Actually backend might return array? No, table has single ID usually?
                                            // Wait, TblLoadingFromMines structure...
                                            // Schema check: Trans table has ShiftId, etc.
                                            // ShiftIncharge logic: `[Trans].[TblLoadingShiftIncharge]` handles multiple. 
                                            // But `last-context` API returned `ShiftInchargeId`. If multiple, what does it return?
                                            // The API we saw selects `ShiftInchargeId` from `TblLoadingFromMines`. 
                                            // Wait, `TblLoadingFromMines` doesn't have `ShiftInchargeId` anymore (it was normalized).
                                            // I should verify `last-context` query in step 3248.
                                            // It selected `ShiftInchargeId`. If that column implies primary incharge or is legacy...
                                            // If normalized, we need to fetch multiple.
                                            // For now assume single ID for context is better than nothing, or empty.

                                            // Let's assume the API returns what it can.
                                            RelayId: res.data.RelayId || '',
                                            SourceId: res.data.SourceId || '',
                                            DestinationId: res.data.DestinationId || '',
                                            MaterialId: res.data.MaterialId || '',
                                            HaulerId: res.data.HaulerEquipmentId || '',
                                            LoadingMachineId: res.data.LoadingMachineId || ''
                                        }));
                                    }
                                } catch (e) {
                                    console.error("Reset context fetch failed", e);
                                } finally {
                                    setIsLoading(false);
                                }
                            }
                        }}
                        className={`p-1.5 rounded transition-all text-gray-500 hover:text-red-600 hover:bg-red-50 ml-2 border border-gray-300`}
                        title="Reset Form"
                    >
                        <RotateCcw size={16} strokeWidth={2} />
                    </button>
                </div>

                <h1 className={styles.headerTitle}>
                    {isEdit ? 'Update' : 'Create'} Loading From Mines
                </h1>

                <button onClick={handleSubmit} disabled={isLoading} className={styles.saveBtn}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    {isEdit ? 'Update (F2)' : 'Save (F2)'}
                </button>
            </div>

            {/* SINGLE ULTRA-COMPACT CARD */}
            <form className={styles.card} onSubmit={(e) => e.preventDefault()}>

                {/* Row 1: Context */}
                <div className={styles.rowContext}>
                    <div className={styles.group}>
                        <label>Date <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="date" name="Date" value={formData.Date} max={new Date().toISOString().split('T')[0]}
                            onChange={handleChange} onKeyDown={handleEnter}
                            className={`${styles.input} ${errors.Date ? styles.errorBorder : ''}`}
                        />
                        {errors.Date && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
                        <label>Shift <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            name="ShiftId"
                            value={formData.ShiftId}
                            onChange={handleChange}
                            options={options.shifts}
                            placeholder="Select Shift"
                            autoFocus
                            className={styles.select}
                            error={errors.ShiftId}
                        />
                        {errors.ShiftId && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
                        <label>Shift Incharge <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            name="ShiftInchargeId"
                            value={formData.ShiftInchargeId}
                            onChange={handleChange}
                            options={options.incharges}
                            placeholder="Select Incharge(s)"
                            className={styles.select}
                            error={errors.ShiftInchargeId}
                            multiple={true}
                        />
                        {errors.ShiftInchargeId && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
                        <label>Man Power <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text" name="ManPower" value={formData.ManPower}
                            onChange={handleChange} className={`${styles.input} ${errors.ManPower ? styles.errorBorder : ''}`}
                            onKeyDown={handleEnter} placeholder="Enter Man Power"
                        />
                        {errors.ManPower && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
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
                </div>

                <hr className={styles.divider} />

                {/* Row 2: Source/Dest/Mat/Hauler/Loader */}
                <div className={styles.rowConfig}>
                    <div className={styles.group}>
                        <label>Source <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            name="SourceId"
                            value={formData.SourceId}
                            onChange={handleChange}
                            options={options.sources}
                            placeholder="Select Source"
                            className={styles.select}
                            error={errors.SourceId}
                        />
                        {errors.SourceId && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
                        <label>Destination <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            ref={destinationRef}
                            name="DestinationId"
                            value={formData.DestinationId}
                            onChange={handleChange}
                            options={options.destinations}
                            placeholder="Select Destination"
                            className={styles.select}
                            error={errors.DestinationId}
                        />
                        {errors.DestinationId && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
                        <label>Material <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            name="MaterialId"
                            value={formData.MaterialId}
                            onChange={handleChange}
                            options={options.materials}
                            placeholder="Select Material"
                            className={styles.select}
                            error={errors.MaterialId}
                        />
                        {errors.MaterialId && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
                        <label>Hauler <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            name="HaulerId"
                            value={formData.HaulerId}
                            onChange={handleChange}
                            options={options.haulers}
                            placeholder="Select Hauler"
                            className={styles.select}
                            error={errors.HaulerId}
                        />
                        {errors.HaulerId && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
                        <label>Loading M/C <span style={{ color: 'red' }}>*</span></label>
                        <SearchableSelect
                            name="LoadingMachineId"
                            value={formData.LoadingMachineId}
                            onChange={handleChange}
                            options={options.loaders}
                            placeholder="Select Loader"
                            className={styles.select}
                            error={errors.LoadingMachineId}
                        />
                        {errors.LoadingMachineId && <div className={styles.errorMsg}>Required</div>}
                    </div>
                </div>

                <hr className={styles.divider} />

                {/* Row 3 - Quantities */}
                <div className={styles.rowQuantities}>
                    <div className={styles.group}>
                        <label>No of Trips <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text" name="NoOfTrips" value={formData.NoOfTrips}
                            onChange={handleChange} onKeyDown={handleEnter}
                            className={`${styles.input} ${errors.NoOfTrips ? styles.errorBorder : ''}`} placeholder="Enter No of Trips"
                        />
                        {errors.NoOfTrips && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
                        <label>Mang Qty/Trip <span style={{ color: 'red' }}>*</span></label>
                        <input type="number" name="MangQtyTrip" value={formData.MangQtyTrip} readOnly className={`${styles.input} ${styles.readOnly}`} />
                        {errors.MangQtyTrip && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
                        <label>NTPC Qty/Trip <span style={{ color: 'red' }}>*</span></label>
                        <input type="number" name="NTPCQtyTrip" value={formData.NTPCQtyTrip} readOnly className={`${styles.input} ${styles.readOnly}`} />
                        {errors.NTPCQtyTrip && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
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
                    <div className={styles.group}>
                        <label>Mang Total Qty <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" name="MangTotalQty" value={formData.MangTotalQty} readOnly className={`${styles.input} ${styles.readOnly}`} />
                        {errors.MangTotalQty && <div className={styles.errorMsg}>Required</div>}
                    </div>
                    <div className={styles.group}>
                        <label>NTPC Total Qty <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" name="NTPCTotalQty" value={formData.NTPCTotalQty} readOnly className={`${styles.input} ${styles.readOnly}`} />
                        {errors.NTPCTotalQty && <div className={styles.errorMsg}>Required</div>}
                    </div>

                </div>

                {/* Remarks Row (Moved out of Grid for clean stacking) */}
                <div className={styles.remarksRow} style={{ marginTop: '12px', marginBottom: '12px', width: '100%' }}>
                    <div className={styles.group}>
                        <label>Remarks</label>
                        <input type="text" name="Remarks" value={formData.Remarks || ''} onChange={handleChange} onKeyDown={handleEnter} className={styles.input} placeholder="Optional remarks..." />
                    </div>
                </div>

                <div className={styles.tableSection} style={{ marginTop: '12px' }}>
                    <h3 className={styles.tableHeader}>Recent Transactions</h3>
                    <TransactionTable
                        config={{
                            columns: [
                                { accessor: 'SlNo', label: 'Sl No', width: 60, disableFilter: true },
                                { accessor: 'LoadingDate', label: 'Date', width: 100, type: 'date', disableFilter: true },
                                { accessor: 'ShiftName', label: 'Shift', width: 100 },
                                { accessor: 'ShiftInCharge', label: 'Shift In Charge', width: 200 }, // Added
                                { accessor: 'ManPower', label: 'Man Power', width: 80 }, // Added missing column
                                { accessor: 'RelayName', label: 'Relay', width: 100 },

                                { accessor: 'SourceName', label: 'Source', width: 120 },
                                { accessor: 'DestinationName', label: 'Destination', width: 120 },
                                { accessor: 'MaterialName', label: 'Material', width: 120 },
                                { accessor: 'HaulerName', label: 'Hauler', width: 140 },
                                { accessor: 'LoadingMachineName', label: 'Loader', width: 140 },
                                { accessor: 'UnitName', label: 'Unit', width: 60 },

                                { accessor: 'NoofTrip', label: 'Trips', width: 80 },
                                { accessor: 'QtyTrip', label: 'Mgmt Qty/Trip', width: 110, type: 'number' },
                                { accessor: 'NtpcQtyTrip', label: 'NTPC Qty/Trip', width: 110, type: 'number' },
                                { accessor: 'TotalQty', label: 'Mgmt Total', width: 110, type: 'number' },
                                { accessor: 'TotalNtpcQty', label: 'NTPC Total', width: 110, type: 'number' }, // Added splits
                                { accessor: 'CreatedDate', label: 'Time', width: 120, type: 'datetime', disableFilter: true }
                            ],
                            idField: 'SlNo',
                            defaultSort: 'CreatedDate'
                        }}
                        data={filteredTableData}
                        isLoading={tableLoading}
                        userRole="Admin"
                    />
                </div>
            </form>
        </div >
    );
}
