'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import TransactionTable from './TransactionTable';
import SearchableSelect from './SearchableSelect';
import styles from './TransactionForm.module.css'; // Reusing styles

export default function MaterialRehandlingForm({ initialData = null, isEdit = false }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Explicit Module Type
    const moduleType = 'material-rehandling';

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
        RehandlingId: 0,
        Date: today,
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

    // Derived State: Material Filtering
    const filteredMaterials = useMemo(() => {
        // Fallback: If no destination, show all
        if (!formData.DestinationId) return options.materials;

        // console.log(`[🔎 Filtering Materials] DestID: ${formData.DestinationId}, Mappings Count: ${mappings.length}, Total Mats: ${options.materials.length}`);

        const mappedIds = mappings
            .filter(m => m.DestinationId == formData.DestinationId)
            .map(m => m.MaterialId);

        // Fallback: If no mapping found for this destination, show ALL
        if (mappedIds.length === 0) {
            // console.log(`[⚠️ No Mapping Found] for DestID ${formData.DestinationId} -> Returning ALL Materials`);
            return options.materials;
        }

        // console.log(`[✅ Mapping Found] Filtered ${mappedIds.length} Materials`);
        const result = options.materials.filter(m => mappedIds.includes(m.id));
        // console.log(`[📦 Filter Result] ${result.length} items. First:`, result[0]);
        return result;
    }, [formData.DestinationId, mappings, options.materials]);

    // Auto-Set Unit based on Material
    useEffect(() => {
        if (!formData.MaterialId) return;

        const selectedMat = options.materials.find(m => m.id == formData.MaterialId); // Use ID check here too
        // Default to MT (2) if no unit found or mapped
        const targetUnit = selectedMat?.UnitId ? String(selectedMat.UnitId) : '2';

        // console.log(`[🔄 Unit Auto-Set] Material: ${formData.MaterialId}, MappedUnit: ${selectedMat?.UnitId}, Final: ${targetUnit}`);

        setFormData(prev => ({ ...prev, Unit: targetUnit }));
    }, [formData.MaterialId, options.materials]);

    // Initial Data Load (Dropdowns & Edit Data)
    useEffect(() => {
        const loadInit = async () => {
            try {
                // Fetch Dropdowns
                const fetchDDL = async (table, filter = null, extra = []) => {
                    try {
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
                // console.log("DATA_LOAD: Mappings Loaded", mapRes.mappings?.length);
                // console.log("DATA_LOAD: Materials Loaded", mats?.length);

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
                    setFormData({
                        ...initialData,
                        // Fix Date Mapping
                        Date: initialData.RehandlingDate ? new Date(initialData.RehandlingDate).toISOString().split('T')[0] : today,
                        MangQtyTrip: initialData.QtyTrip,

                        // Ensure Unit is string for Select
                        Unit: initialData.UnitId ? String(initialData.UnitId) : '',

                        NTPCQtyTrip: initialData.NtpcQtyTrip,
                        MangTotalQty: initialData.TotalQty,
                        NTPCTotalQty: initialData.TotalNtpcQty,
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
        const isDateChange = prevDateRef.current !== formData.Date;
        if (isDateChange) prevDateRef.current = formData.Date;

        const loadLast = async () => {
            // Only fetch if Date is set (Shift is optional)
            // (and logic is not Edit mode to avoid overwriting)
            if (isEdit) return;

            // Get User ID
            let userId = 0;
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const u = JSON.parse(userStr);
                    userId = u.id || u.SlNo || 0;
                }
            } catch (e) { console.error("User Parse Error", e); }

            try {
                const res = await fetch('/api/transaction/helper/last-context', {
                    method: 'POST',
                    body: JSON.stringify({
                        date: formData.Date,
                        ShiftId: formData.ShiftId,
                        moduleType,
                        UserId: userId
                    })
                }).then(r => r.json());

                // If Result Found -> Apply
                if (res.success && res.data) {
                    let incharges = [];
                    if (res.data.ShiftInchargeIds) {
                        incharges = res.data.ShiftInchargeIds.toString().split(',').map(id => Number(id)); // Handle potentially different formats
                    }
                    // If array logic differs in API vs here, ensure it's array of numbers
                    if (Array.isArray(res.data.ShiftInchargeIds)) {
                        incharges = res.data.ShiftInchargeIds.map(Number);
                    }

                    const isFallback = res.source === 'LoadingFallback';

                    setFormData(prev => {
                        const newState = {
                            ...prev,
                            ShiftId: res.data.ShiftId || prev.ShiftId,
                            ShiftInchargeId: incharges.length > 0 ? incharges : [],
                            RelayId: res.data.RelayId || '',
                            ManPower: res.data.ManPower || '',

                            // If Fallback, CLEAR specific fields, else use data or keep prev (actually context load usually implies replace?)
                            // Standard Context Load: Replace if valid, else empty? 
                            // Existing logic: 
                            // SourceId: res.data.SourceId || '', -> verified in previous code

                            SourceId: isFallback ? '' : (res.data.SourceId || ''),
                            DestinationId: isFallback ? '' : (res.data.DestinationId || ''),
                            MaterialId: isFallback ? '' : (res.data.MaterialId || ''),
                            HaulerId: isFallback ? '' : (res.data.HaulerEquipmentId || ''),
                            LoadingMachineId: isFallback ? '' : (res.data.LoadingMachineId || ''),
                            Unit: isFallback ? '' : (res.data.Unit ? String(res.data.Unit) : ''), // Ensure string for select

                            // Clear others on context load?
                            NoOfTrips: '',
                            MangQtyTrip: '',
                            NTPCQtyTrip: '',
                            MangTotalQty: '',
                            NTPCTotalQty: '',
                            Remarks: ''
                        };
                        return newState;
                    });

                    toast.info(`Context Loaded (${isFallback ? 'From Daily Loading' : 'Previous Entry'})`);
                    if (sourceRef.current) setTimeout(() => sourceRef.current.focus(), 300);

                } else {
                    // NO DATA FOUND -> AUTO CLEAR LOGIC
                    setFormData(prev => {
                        const resetState = {
                            ...prev,
                            // Keep Shift if manually selected? 
                            // Existing logic: if isDateChange reset Shift, else keep? 
                            // If Date changed, and no context found, we clear everything including shift (unless manually set?)
                            // Let's stick to existing logic for resets

                            ShiftInchargeId: [],
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
                        };

                        if (isDateChange) resetState.ShiftId = '';
                        return resetState;
                    });

                    // Focus Logic
                    if (isDateChange) {
                        if (shiftRef.current) setTimeout(() => shiftRef.current.focus(), 300);
                    } else {
                        if (inchargeRef.current) setTimeout(() => inchargeRef.current.focus(), 300);
                    }
                }
            } catch (e) {
                console.error("Context Load Failed", e);
            }
        };

        const timer = setTimeout(loadLast, 500);
        return () => clearTimeout(timer);
    }, [formData.Date, formData.ShiftId, isEdit]);

    // Handle Input Change
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

        // Strict Integer Validation
        if (['ManPower', 'NoOfTrips'].includes(name)) {
            if (value !== '' && !/^\d+$/.test(value)) return;
        }

        setFormData(prev => {
            const updated = { ...prev, [name]: value };
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
                        toast.error("No Qty Mapping is found.", { duration: 3000 });
                    }
                });
        }
    }, [formData.HaulerId, formData.MaterialId]);


    // Auto-Fetch Data Table List
    const fetchContextData = useCallback(async () => {
        if (!formData.Date) return;

        setTableLoading(true);
        try {
            const query = new URLSearchParams({
                fromDate: formData.Date,
                toDate: formData.Date,
                limit: 1000
            });

            const res = await fetch(`/api/transaction/material-rehandling?${query}`).then(r => r.json());
            if (res.data) {
                const filtered = res.data.filter(row =>
                    (!formData.ShiftId || row.ShiftId == formData.ShiftId) &&
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
        formData.Date, formData.ShiftId, formData.RelayId, formData.SourceId,
        formData.DestinationId, formData.MaterialId, formData.HaulerId,
        formData.LoadingMachineId
    ]);

    useEffect(() => {
        fetchContextData();
    }, [fetchContextData]);

    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const form = e.target.form || e.target.closest('form');
            if (!form) return;
            const elements = Array.from(form.querySelectorAll('input:not([type="hidden"]), select, textarea, button[data-searchable], [tabindex]:not([tabindex="-1"])')).filter(el => !el.disabled && !el.hidden && el.offsetParent !== null);
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
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const required = [
            'Date', 'ShiftId', 'RelayId', 'ManPower', 'SourceId', 'DestinationId',
            'MaterialId', 'HaulerId', 'LoadingMachineId', 'NoOfTrips', 'Unit',
            'MangQtyTrip', 'NTPCQtyTrip', 'MangTotalQty', 'NTPCTotalQty'
        ];

        const isValid = (val) => val !== '' && val !== null && val !== undefined;

        required.forEach(field => {
            if (!isValid(formData[field])) newErrors[field] = 'Required';
        });

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
            const url = isEdit
                ? `/api/transaction/material-rehandling/${initialData.SlNo}`
                : '/api/transaction/material-rehandling';

            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            }).then(r => r.json());

            if (res.success) {
                toast.success(isEdit ? "Record updated!" : "Record saved!");
                if (isEdit) {
                    router.back();
                } else {
                    setFormData(prev => ({
                        ...prev,
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
                    setTimeout(() => {
                        if (destinationRef.current) destinationRef.current.focus();
                    }, 100);
                    fetchContextData();
                }
            } else {
                toast.error(res.message || "Failed to save");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error saving");
        } finally {
            setIsLoading(false);
        }
    };

    // Keyboard Shortcuts (F2)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSubmit]);

    if (pageLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => router.push('/dashboard/transaction/material-rehandling')} className={styles.backBtn}>
                        <ArrowLeft size={18} /> Back
                    </button>

                    <button onClick={() => {
                        if (confirm('Reset?')) window.location.reload();
                    }} className="p-1.5 rounded text-gray-500 hover:bg-gray-100"><RotateCcw size={16} /></button>
                </div>

                <h1 className={styles.headerTitle}>
                    {isEdit ? 'Update' : 'Create'} Material Rehandling
                </h1>

                <button onClick={handleSubmit} disabled={isLoading} className={styles.saveBtn}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    {isEdit ? 'Update (F2)' : 'Save (F2)'}
                </button>
            </div>

            <form className={styles.card} onSubmit={(e) => e.preventDefault()}>
                {/* Row 1 */}
                <div className={styles.rowContext}>
                    <div className={styles.group}>
                        <label>Date <span className="text-red-500">*</span></label>
                        <input type="date" name="Date" value={formData.Date} onChange={handleChange} className={`${styles.input} ${errors.Date ? styles.errorBorder : ''}`} />
                    </div>
                    <div className={styles.group}>
                        <label>Shift <span className="text-red-500">*</span></label>
                        <SearchableSelect ref={shiftRef} name="ShiftId" value={formData.ShiftId} onChange={handleChange} options={options.shifts} placeholder="Shift" className={styles.select} error={errors.ShiftId} autoFocus />
                    </div>
                    <div className={styles.group}>
                        <label>Incharge <span className="text-red-500">*</span></label>
                        <SearchableSelect ref={inchargeRef} name="ShiftInchargeId" value={formData.ShiftInchargeId} onChange={handleChange} options={options.incharges} placeholder="Incharge" className={styles.select} multiple error={errors.ShiftInchargeId} />
                    </div>
                    <div className={styles.group}>
                        <label>Man Power <span className="text-red-500">*</span></label>
                        <input type="text" name="ManPower" value={formData.ManPower} onChange={handleChange} className={`${styles.input} ${errors.ManPower ? styles.errorBorder : ''}`} onKeyDown={handleEnter} />
                    </div>
                    <div className={styles.group}>
                        <label>Relay <span className="text-red-500">*</span></label>
                        <SearchableSelect name="RelayId" value={formData.RelayId} onChange={handleChange} options={options.relays} placeholder="Relay" className={styles.select} error={errors.RelayId} />
                    </div>
                </div>

                <hr className={styles.divider} />

                {/* Row 2 */}
                <div className={styles.rowConfig}>
                    <div className={styles.group}>
                        <label>Source <span className="text-red-500">*</span></label>
                        <SearchableSelect ref={sourceRef} name="SourceId" value={formData.SourceId} onChange={handleChange} options={options.sources} placeholder="Source" className={styles.select} error={errors.SourceId} />
                    </div>
                    <div className={styles.group}>
                        <label>Destination <span className="text-red-500">*</span></label>
                        <SearchableSelect ref={destinationRef} name="DestinationId" value={formData.DestinationId} onChange={handleChange} options={options.destinations} placeholder="Dest" className={styles.select} error={errors.DestinationId} />
                    </div>
                    <div className={styles.group}>
                        <label>Material <span className="text-red-500">*</span></label>
                        <SearchableSelect name="MaterialId" value={formData.MaterialId} onChange={handleChange} options={filteredMaterials} placeholder="Material" className={styles.select} error={errors.MaterialId} />
                    </div>
                    <div className={styles.group}>
                        <label>Hauler <span className="text-red-500">*</span></label>
                        <SearchableSelect name="HaulerId" value={formData.HaulerId} onChange={handleChange} options={options.haulers} placeholder="Hauler" className={styles.select} error={errors.HaulerId} />
                    </div>
                    <div className={styles.group}>
                        <label>Loader <span className="text-red-500">*</span></label>
                        <SearchableSelect name="LoadingMachineId" value={formData.LoadingMachineId} onChange={handleChange} options={options.loaders} placeholder="Loader" className={styles.select} error={errors.LoadingMachineId} />
                    </div>
                </div>

                <hr className={styles.divider} />

                {/* Row 3 */}
                <div className={styles.rowQuantities}>
                    <div className={styles.group}>
                        <label>Trips <span className="text-red-500">*</span></label>
                        <input type="text" name="NoOfTrips" value={formData.NoOfTrips} onChange={handleChange} className={`${styles.input} ${errors.NoOfTrips ? styles.errorBorder : ''}`} onKeyDown={handleEnter} />
                    </div>
                    <div className={styles.group}>
                        <label>Mang. Qty/Trip</label>
                        <input type="number" value={formData.MangQtyTrip} readOnly className={`${styles.input} ${styles.readOnly} ${errors.MangQtyTrip ? styles.errorBorder : ''}`} />
                    </div>
                    <div className={styles.group}>
                        <label>NTPC Qty/Trip</label>
                        <input type="number" value={formData.NTPCQtyTrip} readOnly className={`${styles.input} ${styles.readOnly} ${errors.NTPCQtyTrip ? styles.errorBorder : ''}`} />
                    </div>
                    <div className={styles.group}>
                        <label>Unit <span className="text-red-500">*</span></label>
                        <SearchableSelect name="Unit" value={formData.Unit} onChange={handleChange} options={options.units} placeholder="Unit" className={styles.select} error={errors.Unit} />
                    </div>
                    <div className={styles.group}>
                        <label>Total Mang. Qty</label>
                        <input type="number" value={formData.MangTotalQty} readOnly className={`${styles.input} ${styles.readOnly} ${errors.MangTotalQty ? styles.errorBorder : ''}`} />
                    </div>
                    <div className={styles.group}>
                        <label>Total NTPC Qty</label>
                        <input type="number" value={formData.NTPCTotalQty} readOnly className={`${styles.input} ${styles.readOnly} ${errors.NTPCTotalQty ? styles.errorBorder : ''}`} />
                    </div>
                </div>

                <div className={styles.remarksRow} style={{ marginTop: '12px' }}>
                    <div className={styles.group}>
                        <label>Remarks</label>
                        <input type="text" name="Remarks" value={formData.Remarks} onChange={handleChange} className={styles.input} placeholder="Remarks..." onKeyDown={handleEnter} />
                    </div>
                </div>

                <div className={styles.tableSection} style={{ marginTop: '20px' }}>
                    <h3 className={styles.tableHeader}>Recent Rehandling</h3>
                    <TransactionTable
                        config={{
                            columns: [
                                { accessor: 'SlNo', label: 'ID', width: 60 },
                                { accessor: 'RehandlingDate', label: 'Date', width: 90, type: 'date' },
                                { accessor: 'ShiftName', label: 'Shift', width: 80 },
                                { accessor: 'ShiftInCharge', label: 'InCharge', width: 150 },
                                { accessor: 'ManPower', label: 'Man Power', width: 80 },
                                { accessor: 'RelayName', label: 'Relay', width: 80 },
                                { accessor: 'SourceName', label: 'Source', width: 100 },
                                { accessor: 'DestinationName', label: 'Dest', width: 100 },
                                { accessor: 'MaterialName', label: 'Material', width: 100 },
                                { accessor: 'HaulerName', label: 'Hauler', width: 100 },
                                { accessor: 'LoadingMachineName', label: 'Loader', width: 100 },
                                { accessor: 'NoofTrip', label: 'Trips', width: 60 },
                                { accessor: 'QtyTrip', label: 'Mang. Qty/Trip', width: 90 },
                                { accessor: 'NtpcQtyTrip', label: 'NTPC Qty/Trip', width: 90 },
                                { accessor: 'TotalQty', label: 'Total Mang. Qty', width: 100 },
                                { accessor: 'TotalNtpcQty', label: 'Total NTPC Qty', width: 100 },
                                { accessor: 'UnitName', label: 'Unit', width: 60 },
                                { accessor: 'CreatedDate', label: 'Time', width: 110, type: 'datetime' }
                            ],
                            idField: 'SlNo',
                            defaultSort: 'CreatedDate'
                        }}
                        data={filteredTableData}
                        isLoading={tableLoading}
                        userRole="Admin"
                        onEdit={(row) => {
                            if (confirm('Navigate to edit this record? Unsaved changes will be lost.')) {
                                router.push(`/dashboard/transaction/material-rehandling/${row.SlNo}`);
                            }
                        }}
                    />
                </div>
            </form>
        </div>
    );
}
