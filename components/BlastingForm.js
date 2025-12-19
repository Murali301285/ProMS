'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import SearchableSelect from '@/components/SearchableSelect';
import TransactionTable from '@/components/TransactionTable';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import css from './BlastingForm.module.css';

export default function BlastingForm({ initialData = null, mode = 'create' }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('User'); // Default to User

    const [recentData, setRecentData] = useState([]);

    // Masters
    const [suppliers, setSuppliers] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        Date: new Date().toISOString().split('T')[0],
        BlastingPatchId: '', // Maps to DrillingPatchId
        NoofHoles: '', // ReadOnly
        AverageDepth: '', // ReadOnly
        SMESupplierId: '',
        SMEQty: '',
        MaxCharge: '',
        PPV: '',
        DeckHoles: '',
        WetHoles: '',
        AirPressure: '',
        Remarks: '',
        TotalExplosiveUsed: 0
    });

    // Accessories State
    const [accessories, setAccessories] = useState([
        // Initial empty row
        { SED: '', TotalBoosterUsed: '', TotalNonelMeters: '', TotalTLDMeters: '' }
    ]);

    const [errors, setErrors] = useState({});

    // Refs for Focus
    const dateRef = useRef(null);
    const formRef = useRef(null);

    // Initial Load
    useEffect(() => {
        // Get Role
        // Get Role from API (More reliable than localStorage)
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
                BlastingPatchId: initialData.PatchId || '',
                NoofHoles: initialData.HolesCharged || '', // Verify mapping
                AverageDepth: '', // Will specific fetch if needed, or if API returns it
                SMESupplierId: initialData.SMESupplierId || '',
                SMEQty: initialData.SMEQty || '',
                MaxCharge: initialData.MaxCharge || '',
                PPV: initialData.PPV || '',
                DeckHoles: initialData.HolesCharged || '', // Wait, holes charged is different? No, check schema
                WetHoles: initialData.WetHoles || '',
                AirPressure: initialData.AirPressure || '',
                Remarks: initialData.Remarks || '',
                TotalExplosiveUsed: initialData.TotalExplosiveUsed || 0
            });
            if (initialData.accessories) {
                setAccessories(initialData.accessories);
            }
        }
        // Auto focus
        if (dateRef.current) dateRef.current.focus();
        fetchRecentData();
    }, [initialData, formData.Date]); // Reload recent when Date changes

    // Lookup Patch ID on Edit Load
    useEffect(() => {
        if (mode === 'update' && initialData?.PatchId) {
            handleLookup(initialData.PatchId);
        }
    }, [mode, initialData]);

    const fetchRecentData = async () => {
        try {
            // Reusing list API with Date Filter
            const res = await fetch(`/api/transaction/blasting/list?fromDate=${formData.Date}&toDate=${formData.Date}`);
            const result = await res.json();
            if (result.data) setRecentData(result.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadMasters = async () => {
        try {
            const sRes = await fetch('/api/master/sme-supplier'); // Try specific first
            if (sRes.ok) {
                const sData = await sRes.json();
                if (sData.data) {
                    setSuppliers(sData.data.map(s => ({ id: s.SlNo, name: s.Name })));
                    return;
                }
            }

            // Fallback
            const lRes = await fetch('/api/master/list?table=TblSMESupplier');
            const lData = await lRes.json();
            if (lData.data) {
                setSuppliers(lData.data.map(s => ({ id: s.SlNo, name: s.Name })));
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
                    AverageDepth: result.data.averageDepth
                }));
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
        if (!formData.SMESupplierId) newErrors.SMESupplierId = 'Required';
        if (!formData.SMEQty) newErrors.SMEQty = 'Required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            toast.error("Please fill mandatory fields");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
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
                    SMESupplierId: '',
                    SMEQty: '',
                    MaxCharge: '',
                    PPV: '',
                    DeckHoles: '',
                    WetHoles: '',
                    AirPressure: '',
                    Remarks: '',
                    TotalExplosiveUsed: 0
                }));
                setAccessories([{ SED: '', TotalBoosterUsed: '', TotalNonelMeters: '', TotalTLDMeters: '' }]);
                fetchRecentData(); // Refresh table

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
                <button onClick={() => router.back()} className={css.backBtn}>
                    <ArrowLeft size={16} /> Back
                </button>
                <h1 className={css.title}>{mode === 'create' ? 'Create' : 'Update'} Blasting</h1>
                <div className={css.headerActions}>
                    <button className={css.saveBtn} onClick={handleSave}>
                        <Save size={16} /> Save (F2)
                    </button>
                </div>
            </div>

            <div className={css.formSection} ref={formRef}>
                {/* Row 1: Date */}
                <div className={css.row}>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Date<span className={css.required}>*</span></label>
                        <input
                            type="date"
                            ref={dateRef}
                            className={css.input}
                            value={formData.Date}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={e => handleChange('Date', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 0)}
                        />
                    </div>
                </div>

                <div className={css.divider}></div>

                {/* Row 2: Patch ID, Holes, Depth, Supplier, Qty */}
                <div className={css.row5}>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>
                            Blasting Patch ID
                            {errors.BlastingPatchId && <span className={css.errorLabel}>value is missing</span>}
                        </label>
                        <input
                            className={`${css.input} ${errors.BlastingPatchId ? css.errorInput : ''}`}
                            value={formData.BlastingPatchId}
                            onChange={e => handleChange('BlastingPatchId', e.target.value)}
                            onBlur={handlePatchIdBlur}
                            placeholder="Enter Patch ID"
                            onKeyDown={(e) => handleKeyDown(e, 1)}
                        />
                    </div>

                    <div className={css.fieldGroup}>
                        <label className={css.label}>No of Holes</label>
                        <input
                            className={`${css.input} ${css.readOnly}`}
                            value={formData.NoofHoles}
                            readOnly
                        />
                    </div>

                    <div className={css.fieldGroup}>
                        <label className={css.label}>Avg Depth</label>
                        <input
                            className={`${css.input} ${css.readOnly}`}
                            value={formData.AverageDepth}
                            readOnly
                        />
                    </div>

                    <div className={css.fieldGroup}>
                        <label className={css.label}>
                            SME Supplier<span className={css.required}>*</span>
                            {errors.SMESupplierId && <span className={css.errorLabel}>value is missing</span>}
                        </label>
                        <div className={errors.SMESupplierId ? css.errorInput : ''} style={{ borderRadius: 4, border: errors.SMESupplierId ? '1px solid #ef4444' : 'none' }}>
                            <SearchableSelect
                                options={suppliers}
                                value={formData.SMESupplierId}
                                onChange={(val) => handleChange('SMESupplierId', val)}
                                placeholder="Select Supplier"
                                className={css.compactInput}
                            />
                        </div>
                    </div>

                    <div className={css.fieldGroup}>
                        <label className={css.label}>
                            SME Qty (KG)<span className={css.required}>*</span>
                            {errors.SMEQty && <span className={css.errorLabel}>value is missing</span>}
                        </label>
                        <input
                            type="number"
                            step="0.001"
                            className={`${css.input} ${errors.SMEQty ? css.errorInput : ''}`}
                            value={formData.SMEQty}
                            onChange={e => handleChange('SMEQty', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 5)}
                        />
                    </div>
                </div>

                <div className={css.divider}></div>

                {/* Row 3: Max Charge, PPV, Deck Holes, Wet Holes, Air Press */}
                <div className={css.row5}>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Max Charge/Hole (KG)</label>
                        <input type="number" step="0.001" className={css.input} value={formData.MaxCharge} onChange={e => handleChange('MaxCharge', e.target.value)} />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>PPV (mm/sec)</label>
                        <input type="number" step="0.001" className={css.input} value={formData.PPV} onChange={e => handleChange('PPV', e.target.value)} />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Holes Deck Charged</label>
                        <input type="number" step="0.001" className={css.input} value={formData.DeckHoles} onChange={e => handleChange('DeckHoles', e.target.value)} />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Wet Holes</label>
                        <input type="number" step="0.001" className={css.input} value={formData.WetHoles} onChange={e => handleChange('WetHoles', e.target.value)} />
                    </div>
                    <div className={css.fieldGroup}>
                        <label className={css.label}>Air Pressure (DB)</label>
                        <input type="number" step="0.001" className={css.input} value={formData.AirPressure} onChange={e => handleChange('AirPressure', e.target.value)} />
                    </div>
                </div>

                <div className={css.divider}></div>

                {/* Row 4: Accessories Table */}
                <div className={css.dataTableSection}>
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

                <div className={css.divider}></div>

                {/* Row 5: Remarks */}
                <div className={css.row}>
                    <div className={css.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                        <label className={css.label}>Remarks</label>
                        <textarea
                            className={css.textarea}
                            value={formData.Remarks}
                            onChange={e => handleChange('Remarks', e.target.value)}
                        />
                    </div>
                </div>

            </div>

            {/* Recent Blasting List */}
            <div className={css.dataTableSection}>
                <div className={css.tableTitle}>Recent Transactions</div>
                <TransactionTable
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
                        fetchRecentData();
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
            </div>
        </div>
    );
}
