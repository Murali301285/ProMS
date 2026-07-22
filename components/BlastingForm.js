'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import SearchableSelect from '@/components/SearchableSelect';
import Select, { components } from 'react-select';
import TransactionTable from '@/components/TransactionTable';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import css from './BlastingForm.module.css';

export default function BlastingForm({ initialData = null, mode = 'create' }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('User'); // Default to User

    const [recentData, setRecentData] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Masters
    const [suppliers, setSuppliers] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        Date: new Date().toISOString().split('T')[0],
        BlastingPatchId: '', // Maps to DrillingPatchId
        NoofHoles: '', // ReadOnly
        AverageDepth: '', // ReadOnly
        MaxCharge: '',
        PPV: '',
        DeckHoles: '',
        WetHoles: '',
        AirPressure: '',
        Remarks: '',
        TotalExplosiveUsed: 0
    });

    const [entries, setEntries] = useState([
        { refName: '', noOfHoles: '', remarks: '', smeSuppliers: [{ SMESupplierId: '', SMEQty: '', remarks: '' }] }
    ]);

    // Accessories State
    const [accessories, setAccessories] = useState([
        // Initial empty row
        { SED: '', TotalBoosterUsed: '', TotalNonelMeters: '', TotalTLDMeters: '' }
    ]);

    const [errors, setErrors] = useState({});

    // Refs for Focus
    const dateRef = useRef(null);
    const formRef = useRef(null);
    const smeSupplierRef = useRef(null);

    // User State for Title
    const [user, setUser] = useState(null);

    // Initial Load - Get User
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const parsed = JSON.parse(userStr);
                // Standardize user object for title
                const displayUser = {
                    ...parsed,
                    username: parsed.EmpName || parsed.UserName || parsed.username || parsed.name || 'User'
                };
                setUser(displayUser);
            } catch (e) {
                console.error("[BlastingForm] User Parse Error:", e);
            }
        }
    }, []);

    // --- SMART DATE CONTEXT LOGIC ---
    useEffect(() => {
        if (mode !== 'create') return;

        // 1. Initial Load: Get Absolute Last Context (Regardless of Date)
        const fetchInitialContext = async () => {
            try {
                const res = await fetch('/api/transaction/blasting/helper/last-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}) // No Date -> Absolute Last
                });
                const context = await res.json();
                console.log("[BlastingForm] Initial Absolute Context:", context);

                if (context && Object.keys(context).length > 0) {
                    const receivedDate = context.Date;
                    const parsedDate = receivedDate ? new Date(receivedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

                    setFormData(prev => ({
                        ...prev,
                        Date: parsedDate, // Overwrite Date
                        BlastingPatchId: context.BlastingPatchId || '',
                        MaxCharge: '', // Reset
                        PPV: '', // Reset
                        DeckHoles: '', // Reset
                        WetHoles: '', // Reset
                        AirPressure: '', // Reset
                        TotalExplosiveUsed: 0, Remarks: ''
                    }));
                    setEntries([{ refName: '', noOfHoles: '', remarks: '', smeSuppliers: [{ SMESupplierId: '', SMEQty: '', remarks: '' }] }]);
                }
            } catch (err) {
                console.error("Initial context fetch failed", err);
            }
        };

        fetchInitialContext();
    }, [mode]);

    // 2. Date Change: Get Context Specific to Selected Date
    const fetchDateContext = useCallback(async () => {
        if (!formData.Date) return;

        try {
            console.log("[BlastingForm] Checking Context for Date:", formData.Date);
            const res = await fetch('/api/transaction/blasting/helper/last-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Date: formData.Date }) // Specific Date
            });
            const context = await res.json();

            if (context && Object.keys(context).length > 0) {
                console.log("[BlastingForm] Found Context for Date:", context);
                setFormData(prev => ({
                    ...prev,
                    // Date: prev.Date, // Keep User Selection
                    BlastingPatchId: context.BlastingPatchId || '',
                    MaxCharge: '', // Reset
                    PPV: '', // Reset
                    DeckHoles: '', // Reset
                    WetHoles: '', // Reset
                    AirPressure: '', // Reset
                    TotalExplosiveUsed: 0, Remarks: ''
                }));
                setEntries([{ refName: '', noOfHoles: '', remarks: '', smeSuppliers: [{ SMESupplierId: '', SMEQty: '', remarks: '' }] }]);

                // Focus logic - Patch ID
                // Don't focus if already focused? 
                // Only if mode is create.

            } else {
                console.log("[BlastingForm] No context for date. Resetting fields.");
                setFormData(prev => ({
                    ...prev,
                    // Date: prev.Date, // Keep User Selection
                    BlastingPatchId: '', MaxCharge: '',
                    PPV: '', DeckHoles: '', WetHoles: '', AirPressure: '',
                    TotalExplosiveUsed: 0, Remarks: ''
                }));
                setEntries([{ refName: '', noOfHoles: '', remarks: '', smeSuppliers: [{ SMESupplierId: '', SMEQty: '', remarks: '' }] }]);
            }

        } catch (err) {
            console.error("Date context fetch failed", err);
        }
    }, [formData.Date, mode]);

    useEffect(() => {
        if (mode === 'create') fetchDateContext();
    }, [fetchDateContext, mode]);


    // --- DYNAMIC RECENT LIST LOGIC ---
    const fetchTableData = async (isLoadMore = false) => {
        // Triggered by changes in filter fields
        if (!isLoadMore) {
            setPage(0);
            setHasMore(true);
        }

        setLoading(true); // Re-using main loading or should create tableLoading? Using main loading might block form. Let's use separate if desired or just reuse.
        // BlastingForm uses 'loading' for Save. Let's create local tableLoading or just not block UI.
        // Actually, existing code didn't use loading state for table explicitly in fetch? 
        // Ah, it didn't. Let's add simple state or just proceed. 
        // Wait, TransactionTable has isLoading prop.

        try {
            const currentPage = isLoadMore ? page + 1 : 0;
            const take = 50;
            const skip = currentPage * take;

            const payload = {
                Date: formData.Date,
                // Removed specific filters (PatchId, SupplierId) to show ALL records for the selected Date
                // BlastingPatchId: formData.BlastingPatchId, 
                // SMESupplierId: formData.SMESupplierId,
                skip,
                take
            };

            const res = await fetch('/api/transaction/blasting/helper/recent-list', {
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
            console.error("Failed to load table data", err);
        } finally {
            // setLoading(false); 
        }
    };

    useEffect(() => {
        // Debounce fetch
        const timer = setTimeout(() => {
            fetchTableData();
        }, 300);
        return () => clearTimeout(timer);
    }, [
        formData.Date
        // Only refresh on Date change (or User change implicitly)
    ]);

    // Initial Load Masters Only
    useEffect(() => {
        // Get Role ...
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) setUserRole(data.user.role);
            })
            .catch(err => console.error("Failed to fetch role", err));

        loadMasters();

        if (initialData) {
            setFormData({
                Date: initialData.Date ? new Date(initialData.Date).toISOString().split('T')[0] : '',
                BlastingPatchId: initialData.BlastingPatchId || initialData.PatchId || '',
                NoofHoles: initialData.NoofHoles || initialData.HolesCharged || '',
                AverageDepth: initialData.AverageDepth || '',
                MaxCharge: initialData.MaxChargeHole || initialData.MaxCharge || '',
                PPV: initialData.PPV || '',
                DeckHoles: initialData.NoofHolesDeckCharged || initialData.DeckHoles || '',
                WetHoles: initialData.NoofWetHole || initialData.WetHoles || '',
                AirPressure: initialData.AirPressure || '',
                Remarks: initialData.Remarks || '',
                TotalExplosiveUsed: initialData.TotalExplosiveUsed || 0
            });
            if (initialData.accessories) {
                setAccessories(initialData.accessories);
            }
            if (initialData.entries && initialData.entries.length > 0) {
                setEntries(initialData.entries);
            } else if (initialData.smeSuppliers && initialData.smeSuppliers.length > 0) {
                // Legacy fallback mapping
                setEntries([{
                    refName: 'Legacy',
                    noOfHoles: initialData.NoofHoles || '',
                    remarks: '',
                    smeSuppliers: initialData.smeSuppliers
                }]);
            } else {
                setEntries([{ refName: '', noOfHoles: '', remarks: '', smeSuppliers: [{ SMESupplierId: '', SMEQty: '', remarks: '' }] }]);
            }
        }
    }, [initialData]);

    const [drillingPatches, setDrillingPatches] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');

    const fetchDrillingPatches = async (month) => {
        if (!month) return;
        try {
            const dRes = await fetch(`/api/transaction/drilling/dropdown-list?month=${month}`);
            const dData = await dRes.json();
            if (dData.success) {
                setDrillingPatches(dData.data);
            }
        } catch (err) {
            console.error("Failed to load drilling patches for month:", month, err);
        }
    };

    useEffect(() => {
        if (selectedMonth) {
            fetchDrillingPatches(selectedMonth);
        }
    }, [selectedMonth]);

    useEffect(() => {
        if (formData.Date) {
            setSelectedMonth(formData.Date.substring(0, 7));
        }
    }, [formData.Date]);

    const loadMasters = async () => {
        try {
            const sRes = await fetch('/api/master/sme-supplier');
            if (sRes.ok) {
                const sData = await sRes.json();
                if (sData.data) {
                    setSuppliers(sData.data.map(s => ({ id: s.SlNo, name: s.Name })));
                }
            } else {
                const lRes = await fetch('/api/master/list?table=TblSMESupplier');
                const lData = await lRes.json();
                if (lData.data) {
                    setSuppliers(lData.data.map(s => ({ id: s.SlNo, name: s.Name })));
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Lookup Patch ID
    // Lookup Function
    const handleLookup = async (patchId) => {
        if (!patchId) return;
        try {
            const res = await fetch(`/api/transaction/drilling/lookup?patchId=${patchId}`);
            const result = await res.json();
            if (result.found) {
                setFormData(prev => ({
                    ...prev,
                    NoofHoles: result.data.holes,
                    AverageDepth: result.data.averageDepth,
                    Percentage: result.data.percentage
                }));
                // Auto focus to SME Supplier
                setTimeout(() => {
                    if (smeSupplierRef.current) smeSupplierRef.current.focus();
                }, 100);
            } else {
                toast.warning("No Drilling information found for this Patch ID.");
                setFormData(prev => ({ ...prev, NoofHoles: '', AverageDepth: '' }));
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to lookup Patch ID");
        }
    };

    // Handler
    const handlePatchIdBlur = () => {
        handleLookup(formData.BlastingPatchId);
    };

    // Handle Input Change
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error immediately on input
        if (value && errors[field]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[field];
                return newErr;
            });
        }
    };

    // Entry Handlers
    const addEntry = () => {
        setEntries([...entries, { refName: '', noOfHoles: '', remarks: '', smeSuppliers: [{ SMESupplierId: '', SMEQty: '', remarks: '' }] }]);
    };

    const deleteEntry = (entryIdx) => {
        if (entries.length === 1) return;
        if (window.confirm('Are you sure you want to remove this entire entry?')) {
            const newEntries = entries.filter((_, i) => i !== entryIdx);
            setEntries(newEntries);
        }
    };

    const handleEntryChange = (entryIdx, field, value) => {
        const newEntries = [...entries];
        newEntries[entryIdx][field] = value;
        setEntries(newEntries);
        if (errors[`entry_${entryIdx}`] || errors.entries) {
            setErrors(prev => { const e = { ...prev }; delete e[`entry_${entryIdx}`]; delete e.entries; return e; });
        }
    };

    // SME Suppliers Handlers
    const handleSmeChange = (entryIdx, smeIdx, field, value) => {
        const newEntries = [...entries];
        newEntries[entryIdx].smeSuppliers[smeIdx][field] = value;
        setEntries(newEntries);
        if (errors[`sme_${entryIdx}_${smeIdx}`] || errors.entries) {
            setErrors(prev => { const e = { ...prev }; delete e[`sme_${entryIdx}_${smeIdx}`]; delete e.entries; return e; });
        }
    };

    const addSmeRow = (entryIdx) => {
        const newEntries = [...entries];
        newEntries[entryIdx].smeSuppliers.push({ SMESupplierId: '', SMEQty: '', remarks: '' });
        setEntries(newEntries);
    };

    const deleteSmeRow = (entryIdx, smeIdx) => {
        const newEntries = [...entries];
        if (newEntries[entryIdx].smeSuppliers.length === 1) return; // Keep at least one
        if (window.confirm('Are you sure you want to remove this SME Supplier?')) {
            newEntries[entryIdx].smeSuppliers = newEntries[entryIdx].smeSuppliers.filter((_, i) => i !== smeIdx);
            setEntries(newEntries);
        }
    };

    // Accessories Handlers
    const handleAccChange = (index, field, value) => {
        const newAcc = [...accessories];
        newAcc[index][field] = value;
        setAccessories(newAcc);

        // Recalc Total
        if (field === 'TotalBoosterUsed') {
            const total = newAcc.reduce((sum, row) => sum + (parseFloat(row.TotalBoosterUsed) || 0), 0);
            setFormData(prev => ({ ...prev, TotalExplosiveUsed: total.toFixed(3) }));
        }
    };

    const addAccRow = () => {
        setAccessories([...accessories, { SED: '', TotalBoosterUsed: '', TotalNonelMeters: '', TotalTLDMeters: '' }]);
    };

    const deleteAccRow = (index) => {
        if (accessories.length === 1) return; // Keep at least one
        const newAcc = accessories.filter((_, i) => i !== index);
        setAccessories(newAcc);

        // Recalc
        const total = newAcc.reduce((sum, row) => sum + (parseFloat(row.TotalBoosterUsed) || 0), 0);
        setFormData(prev => ({ ...prev, TotalExplosiveUsed: total.toFixed(3) }));
    };

    // Validation
    const validate = () => {
        const newErrors = {};
        if (!formData.BlastingPatchId) newErrors.BlastingPatchId = 'Required';

        let entriesValid = true;
        let totalEntryHoles = 0;

        entries.forEach((entry, eIdx) => {
            if (!entry.refName) {
                entriesValid = false;
                newErrors[`entry_${eIdx}`] = 'Ref Name is required';
            }
            if (!entry.noOfHoles) {
                entriesValid = false;
                newErrors[`entry_${eIdx}`] = 'No of Holes is required';
            } else {
                totalEntryHoles += Number(entry.noOfHoles);
            }

            entry.smeSuppliers.forEach((sme, sIdx) => {
                if (!sme.SMESupplierId || !sme.SMEQty) {
                    entriesValid = false;
                    newErrors[`sme_${eIdx}_${sIdx}`] = 'Required';
                }
            });
        });

        if (!entriesValid) {
            newErrors.entries = 'Please fill all mandatory fields in Entries and SME Suppliers.';
        }

        if (totalEntryHoles > Number(formData.NoofHoles || 0)) {
            newErrors.entries = `Total Entry Holes (${totalEntryHoles}) cannot exceed Parent Holes (${formData.NoofHoles})`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            toast.error(errors.entries || "Please fill mandatory fields");
            return;
        }

        // Check for duplicates - Not straightforward with nested structure if they want to reuse supplier across entries.
        // Assuming they can reuse supplier across DIFFERENT entries, but maybe not in the SAME entry.
        for (const entry of entries) {
            const supplierIds = entry.smeSuppliers.map(s => String(s.SMESupplierId));
            const uniqueSupplierIds = new Set(supplierIds);
            if (supplierIds.length > uniqueSupplierIds.size) {
                if (!window.confirm('The same SME Supplier is added more than once in an entry. Do you want to proceed?')) {
                    return;
                }
                break;
            }
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                entries: entries,
                accessories: accessories.filter(a => a.SED || a.TotalBoosterUsed) // Filter empty rows
            };

            const url = mode === 'create' ? '/api/transaction/blasting/create' : `/api/transaction/blasting/${initialData.SlNo}`;
            const method = mode === 'create' ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error);

            toast.success("Saved Successfully!");

            if (mode === 'create') {
                // Reset Form but keep Date
                setFormData(prev => ({
                    Date: prev.Date, // Keep Date
                    BlastingPatchId: '',
                    NoofHoles: '',
                    AverageDepth: '',
                    MaxCharge: '',
                    PPV: '',
                    DeckHoles: '',
                    WetHoles: '',
                    AirPressure: '',
                    Remarks: '',
                    TotalExplosiveUsed: 0
                }));
                setEntries([{ refName: '', noOfHoles: '', remarks: '', smeSuppliers: [{ SMESupplierId: '', SMEQty: '', remarks: '' }] }]);
                setAccessories([{ SED: '', TotalBoosterUsed: '', TotalNonelMeters: '', TotalTLDMeters: '' }]);
                fetchTableData(); // Refresh table

                // Refresh Context (Last Entry Info) explicitly
                if (fetchDateContext) fetchDateContext();

                // Focus back to Patch ID (first field after Date)
                setTimeout(() => {
                    const inputs = formRef.current.querySelectorAll('input');
                    if (inputs[1]) inputs[1].focus();
                }, 100);

            } else {
                router.push('/dashboard/transaction/blasting');
            }

        } catch (err) {
            toast.error(err.message || "Save Failed");
        } finally {
            setLoading(false);
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

    // Keyboard Navigation (Enter)
    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const inputs = Array.from(formRef.current.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled])'));
            let nextIndex = index + 1;

            // Skip ReadOnly or Hidden
            while (nextIndex < inputs.length) {
                const nextEl = inputs[nextIndex];
                if (!nextEl.readOnly) {
                    nextEl.focus();
                    break;
                }
                nextIndex++;
            }
        }
    };

    return (
        <div className={css.container}>
            {/* Header */}
            <div className={css.header}>
                <button onClick={() => router.push('/dashboard/transaction/blasting')} className={css.backBtn}>
                    <ArrowLeft size={16} /> Back
                </button>
                <h1 className={css.title}>{mode === 'create' ? 'Create Blasting Entry' : 'Update Blasting Entry'}</h1>
                <div className={css.headerActions}>
                    <button className={css.saveBtn} onClick={handleSave}>
                        <Save size={16} /> Save (F2)
                    </button>
                </div>
            </div>

            {/* Form - 8 Column Grid */}
            <div className={css.formSection} ref={formRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '15px', padding: '15px' }}>

                {/* --- Row 1 --- */}
                {/* Date: Col 1 */}
                <div className={css.fieldGroup} style={{ gridColumn: '1 / span 1' }}>
                    <label className={css.label}>Date<span className={css.required}>*</span></label>
                    <input
                        type="date"
                        ref={dateRef}
                        className={css.input}
                        value={formData.Date || ""}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => handleChange('Date', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 0)}
                    />
                </div>

                {/* Filter Month: Col 2 */}
                <div className={css.fieldGroup} style={{ gridColumn: '2 / span 1' }}>
                    <label className={css.label}>Filter Month</label>
                    <input
                        type="month"
                        className={css.input}
                        value={selectedMonth || ""}
                        onChange={e => setSelectedMonth(e.target.value)}
                    />
                </div>

                {/* Patch ID: Col 3-4 (Span 2) */}
                <div className={css.fieldGroup} style={{ gridColumn: '3 / span 2' }}>
                    <label className={css.label}>
                        Blasting Patch ID<span className={css.required}>*</span>
                        {errors.BlastingPatchId && <span className={css.errorLabel}>value is missing</span>}
                    </label>
                    <div className={errors.BlastingPatchId ? css.errorInput : ''} style={{ borderRadius: 4, border: errors.BlastingPatchId ? '1px solid #ef4444' : 'none' }}>
                        <Select
                            instanceId="blasting-patch-select"
                            options={drillingPatches.map(dp => ({ ...dp, value: dp.DrillingPatchId, label: dp.DrillingPatchId }))}
                            value={drillingPatches.find(dp => dp.DrillingPatchId === formData.BlastingPatchId) ? { ...drillingPatches.find(dp => dp.DrillingPatchId === formData.BlastingPatchId), value: formData.BlastingPatchId, label: formData.BlastingPatchId } : null}
                            onChange={(option, actionMeta) => {
                                if (actionMeta.action === 'select-option' || actionMeta.action === 'clear') {
                                    if (option) {
                                        const samePatches = drillingPatches.filter(p => p.DrillingPatchId === option.DrillingPatchId);
                                        const totalHoles = samePatches.reduce((sum, p) => sum + (parseFloat(p.NoofHoles) || 0), 0);

                                        setFormData(prev => ({
                                            ...prev,
                                            BlastingPatchId: option.DrillingPatchId,
                                            NoofHoles: totalHoles || '',
                                            AverageDepth: option.AverageDepth ? Number(option.AverageDepth).toFixed(2) : ''
                                        }));
                                        if (errors.BlastingPatchId) {
                                            setErrors(prev => { const e = { ...prev }; delete e.BlastingPatchId; return e; });
                                        }
                                        setTimeout(() => {
                                            if (smeSupplierRef.current) smeSupplierRef.current.focus();
                                        }, 10);
                                    } else {
                                        setFormData(prev => ({
                                            ...prev,
                                            BlastingPatchId: '',
                                            NoofHoles: '',
                                            AverageDepth: ''
                                        }));
                                    }
                                }
                            }}
                            openMenuOnFocus={true}
                            openMenuOnClick={true}
                            placeholder="Search Patch ID..."
                            isClearable
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    height: '38px',
                                    minHeight: '38px',
                                    border: '1px solid #cbd5e1',
                                    boxShadow: 'none',
                                    '&:hover': { border: '1px solid #94a3b8' }
                                }),
                                menu: (base) => ({
                                    ...base,
                                    width: '600px', // Extra wide to fit the 12 columns
                                    zIndex: 9999
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused ? '#f1f5f9' : 'white',
                                    color: '#0f172a',
                                    cursor: 'pointer',
                                    padding: '8px 12px',
                                    borderBottom: '1px solid #e2e8f0'
                                })
                            }}
                            components={{
                                Option: (props) => {
                                    const { data } = props;
                                    return (
                                        <components.Option {...props}>
                                            <div className={css.patchOption}>
                                                <div className={css.patchOptionHeader}>
                                                    <strong>{data.DrillingPatchId}</strong>
                                                </div>
                                                <div className={css.patchOptionGrid}>
                                                    <div className={css.poItem}><span>Agency:</span> {data.Agency}</div>
                                                    <div className={css.poItem}><span>Equip:</span> {data.Equipment}</div>
                                                    <div className={css.poItem}><span>Mat:</span> {data.Material}</div>
                                                    <div className={css.poItem}><span>Loc:</span> {data.Location}</div>
                                                    <div className={css.poItem}><span>Sec:</span> {data.Sector}</div>
                                                    <div className={css.poItem}><span>Scale:</span> {data.Scale}</div>
                                                    <div className={css.poItem}><span>Strata:</span> {data.Strata}</div>
                                                    <div className={css.poItem}><span>Depth:</span> {data.DepthSlab}</div>
                                                    <div className={css.poItem}><span>Holes:</span> {data.NoofHoles}</div>
                                                    <div className={css.poItem}><span>Meters:</span> {data.TotalMeters}</div>
                                                    <div className={css.poItem}><span>Spacing:</span> {data.Spacing}</div>
                                                    <div className={css.poItem}><span>Burden:</span> {data.Burden}</div>
                                                    <div className={css.poItem} style={{ gridColumn: 'span 2' }}><span>Created On:</span> {data.CreatedOn}</div>
                                                </div>
                                            </div>
                                        </components.Option>
                                    );
                                }
                            }}
                        />
                    </div>
                </div>

                {/* No of Holes: Col 5 */}
                <div className={css.fieldGroup} style={{ gridColumn: '5 / span 1' }}>
                    <label className={css.label}>No of Holes</label>
                    <input
                        className={`${css.input} ${css.readOnly}`}
                        value={formData.NoofHoles || ''}
                        readOnly
                    />
                </div>

                {/* Avg Depth: Col 6 */}
                <div className={css.fieldGroup} style={{ gridColumn: '6 / span 1' }}>
                    <label className={css.label}>Avg Depth</label>
                    <input
                        className={`${css.input} ${css.readOnly}`}
                        value={formData.AverageDepth || ''}
                        readOnly
                    />
                </div>

                {/* SME Entries Section */}
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '10px', gap: '20px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            Total Holes : <span style={{ color: '#2563eb' }}>{entries.reduce((sum, e) => sum + (Number(e.noOfHoles) || 0), 0)}</span>
                        </div>
                        <button type="button" className={css.addBtn} onClick={addEntry} style={{ marginTop: 0, padding: '6px 16px', backgroundColor: '#4f46e5', color: 'white' }}>
                            <Plus size={16} style={{ marginRight: 4 }} /> Add Entry
                        </button>
                    </div>

                    {entries.map((entry, eIdx) => (
                        <div key={eIdx} style={{ border: '2px solid #4f46e5', padding: '15px', marginBottom: '20px', borderRadius: '4px', position: 'relative' }}>
                            {/* Entry Header Fields */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '15px', marginBottom: '15px' }}>
                                <div className={css.fieldGroup}>
                                    <label className={css.label}>Ref Name<span className={css.required}>*</span></label>
                                    <input 
                                        className={`${css.input} ${errors[`entry_${eIdx}`] && !entry.refName ? css.errorInput : ''}`}
                                        value={entry.refName} 
                                        onChange={e => handleEntryChange(eIdx, 'refName', e.target.value)} 
                                        style={{ border: errors[`entry_${eIdx}`] && !entry.refName ? '1px solid #ef4444' : '1px solid #dc2626' }}
                                    />
                                </div>
                                <div className={css.fieldGroup}>
                                    <label className={css.label}>No of Holes<span className={css.required}>*</span></label>
                                    <input 
                                        type="number" 
                                        className={`${css.input} ${errors[`entry_${eIdx}`] && !entry.noOfHoles ? css.errorInput : ''}`}
                                        value={entry.noOfHoles} 
                                        onChange={e => handleEntryChange(eIdx, 'noOfHoles', e.target.value)} 
                                        style={{ border: errors[`entry_${eIdx}`] && !entry.noOfHoles ? '1px solid #ef4444' : '1px solid #dc2626' }}
                                    />
                                </div>
                                <div className={css.fieldGroup}>
                                    <label className={css.label}>Remarks</label>
                                    <input 
                                        className={css.input} 
                                        value={entry.remarks} 
                                        onChange={e => handleEntryChange(eIdx, 'remarks', e.target.value)} 
                                        style={{ border: '1px solid #dc2626' }}
                                    />
                                </div>
                            </div>

                            {/* Entry Delete Button */}
                            {entries.length > 1 && (
                                <button type="button" onClick={() => deleteEntry(eIdx)} style={{ position: 'absolute', top: '-12px', right: '-12px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '4px', border: 'none', cursor: 'pointer' }}>
                                    <Trash2 size={14} />
                                </button>
                            )}

                            {/* Inner SME Table */}
                            <div className={css.dataTableSection} style={{ marginTop: '10px' }}>
                                <div className={css.tableTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span>SME Supplier Details <span className={css.required}>*</span></span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                            Total SME Qty : <span style={{ color: '#2563eb' }}>{Number(entry.smeSuppliers.reduce((sum, row) => sum + (parseFloat(row.SMEQty) || 0), 0).toFixed(3))} kg</span>
                                        </div>
                                        <button type="button" className={css.addBtn} onClick={() => addSmeRow(eIdx)} style={{ marginTop: 0, padding: '4px 12px' }}>
                                            <Plus size={14} style={{ marginRight: 4 }} /> Add SME Supplier
                                        </button>
                                    </div>
                                </div>
                                <table className={css.accTable}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '30%' }}>SME Supplier</th>
                                            <th style={{ width: '20%' }}>SME Qty (KG)</th>
                                            <th style={{ width: '30%' }}>Remarks</th>
                                            <th style={{ width: '20%', textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entry.smeSuppliers.map((row, sIdx) => (
                                            <tr key={sIdx}>
                                                <td>
                                                    <div className={errors[`sme_${eIdx}_${sIdx}`] && !row.SMESupplierId ? css.errorInput : ''} style={{ borderRadius: 4, border: errors[`sme_${eIdx}_${sIdx}`] && !row.SMESupplierId ? '1px solid #ef4444' : 'none' }}>
                                                        <SearchableSelect
                                                            options={suppliers}
                                                            value={row.SMESupplierId}
                                                            onChange={(e) => handleSmeChange(eIdx, sIdx, 'SMESupplierId', e.target.value)}
                                                            placeholder="Select Supplier"
                                                            className={css.compactInput}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        className={`${css.input} ${errors[`sme_${eIdx}_${sIdx}`] && !row.SMEQty ? css.errorInput : ''}`}
                                                        value={row.SMEQty || ''}
                                                        onChange={e => handleSmeChange(eIdx, sIdx, 'SMEQty', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={css.input}
                                                        value={row.remarks || ''}
                                                        onChange={e => handleSmeChange(eIdx, sIdx, 'remarks', e.target.value)}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button type="button" className={css.deleteBtn} onClick={() => deleteSmeRow(eIdx, sIdx)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>



                {/* --- Row 3 --- */}
                {/* Max Charge: Col 1 */}
                <div className={css.fieldGroup} style={{ gridColumn: '1 / span 1' }}>
                    <label className={css.label}>Max Charge/Hole (KG)</label>
                    <input type="number" step="0.001" className={css.input} value={formData.MaxCharge || ""} onChange={e => handleChange('MaxCharge', e.target.value)} />
                </div>

                {/* PPV: Col 2 */}
                <div className={css.fieldGroup} style={{ gridColumn: '2 / span 1' }}>
                    <label className={css.label}>PPV (mm/sec)</label>
                    <input type="number" step="0.001" className={css.input} value={formData.PPV || ""} onChange={e => handleChange('PPV', e.target.value)} />
                </div>

                {/* Deck Holes: Col 3 */}
                <div className={css.fieldGroup} style={{ gridColumn: '3 / span 1' }}>
                    <label className={css.label}>Holes Deck Charged</label>
                    <input type="number" step="0.001" className={css.input} value={formData.DeckHoles || ""} onChange={e => handleChange('DeckHoles', e.target.value)} />
                </div>

                {/* Wet Holes: Col 4 */}
                <div className={css.fieldGroup} style={{ gridColumn: '4 / span 1' }}>
                    <label className={css.label}>Wet Holes</label>
                    <input type="number" step="0.001" className={css.input} value={formData.WetHoles || ""} onChange={e => handleChange('WetHoles', e.target.value)} />
                </div>

                {/* Air Pressure: Col 5 */}
                <div className={css.fieldGroup} style={{ gridColumn: '5 / span 1' }}>
                    <label className={css.label}>Air Pressure (DB)</label>
                    <input type="number" step="0.001" className={css.input} value={formData.AirPressure || ""} onChange={e => handleChange('AirPressure', e.target.value)} />
                </div>

                {/* --- Row 4: Accessories --- */}
                <div className={css.dataTableSection} style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                    <div className={css.tableTitle} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Accessories Details</span>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                            Total Explosives Used: <span style={{ color: '#2563eb' }}>{formData.TotalExplosiveUsed} kg</span>
                        </div>
                    </div>

                    <table className={css.accTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>SED</th>
                                <th style={{ width: '20%' }}>Total Booster Used (Kg)</th>
                                <th style={{ width: '20%' }}>Total Nonel Meters</th>
                                <th style={{ width: '20%' }}>Total TLD Meters</th>
                                <th style={{ width: '15%' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accessories.map((row, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <input
                                            value={row.SED}
                                            onChange={e => handleAccChange(idx, 'SED', e.target.value)}
                                            placeholder="Alpha numeric"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number" step="0.001"
                                            value={row.TotalBoosterUsed}
                                            onChange={e => handleAccChange(idx, 'TotalBoosterUsed', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number" step="0.001"
                                            value={row.TotalNonelMeters}
                                            onChange={e => handleAccChange(idx, 'TotalNonelMeters', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number" step="0.001"
                                            value={row.TotalTLDMeters}
                                            onChange={e => handleAccChange(idx, 'TotalTLDMeters', e.target.value)}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button className={css.deleteBtn} onClick={() => deleteAccRow(idx)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button className={css.addBtn} onClick={addAccRow}>
                        <Plus size={14} style={{ marginRight: 4 }} /> Add Row
                    </button>
                </div>



                {/* --- Row 5: Remarks --- */}
                {/* Remarks: Col 1-6 (Span 6) */}
                <div className={css.fieldGroup} style={{ gridColumn: '1 / span 6' }}>
                    <label className={css.label}>Remarks</label>
                    <textarea
                        className={css.textarea}
                        value={formData.Remarks}
                        onChange={e => handleChange('Remarks', e.target.value)}
                    />
                </div>

            </div>

            {/* Recent Blasting List */}
            <div className={css.dataTableSection}>
                <TransactionTable
                    title="Recent Transactions"
                    config={TRANSACTION_CONFIG['blasting']}
                    data={recentData}
                    isLoading={false}
                    onDelete={async (id) => {
                        // Permission Check
                        const record = recentData.find(r => r.SlNo === id);
                        const role = (userRole || '').toLowerCase();
                        const isSuper = ['admin', 'superadmin', 'administrator'].includes(role);

                        if (record && !isSuper) {
                            const created = new Date(record.CreatedDate);
                            const today = new Date();
                            if (created.toDateString() !== today.toDateString()) {
                                toast.error("You can only delete records created today.");
                                return;
                            }
                        }

                        if (!confirm("Delete?")) return;
                        await fetch(`/api/transaction/blasting/${id}`, { method: 'DELETE' });
                        fetchTableData(); // Refresh, cleaned up name call
                    }}
                    onEdit={(row) => {
                        // Permission Check
                        const role = (userRole || '').toLowerCase();
                        const isSuper = ['admin', 'superadmin', 'administrator'].includes(role);

                        if (!isSuper) {
                            const created = new Date(row.CreatedDate);
                            const today = new Date();
                            if (created.toDateString() !== today.toDateString()) {
                                toast.error("You can only edit records created today.");
                                return;
                            }
                        }
                        router.push(`/dashboard/transaction/blasting/${row.SlNo}`);
                    }}
                    userRole={userRole}
                />
                {/* Load More Button */}
                {recentData.length > 0 && hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '20px' }}>
                        <button
                            type="button"
                            onClick={() => fetchTableData(true)}
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
                            Load More
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
