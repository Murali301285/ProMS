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
        remarks: [], // Drilling Remarks
        units: [] // For internal mapping math
    });

    const today = new Date().toISOString().split('T')[0];

    // Form State
    const [formData, setFormData] = useState({
        Date: today,
        DrillingPatchId: '',
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
                const [eqRes, matRes, locRes, secRes, scRes, strRes, dsRes, drRemRes, unitRes] = await Promise.all([
                    fetch('/api/master/equipment'),
                    fetch('/api/master/material'),
                    fetch('/api/master/location'),
                    fetch('/api/master/sector'),
                    fetch('/api/master/scale'),
                    fetch('/api/master/strata'), // New API needs ensuring
                    fetch('/api/master/depth-slab'),
                    fetch('/api/master/drilling-remarks'),
                    fetch('/api/master/unit')
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
                    units: getArr(unitData)
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
        if (formData.MaterialId) {
            const material = masters.material.find(m => m.SlNo == formData.MaterialId);
            if (material && material.UnitId) {
                setFormData(prev => ({ ...prev, UnitId: material.UnitId }));
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

    // Fetch Table Data when Date Changes or on Save
    const fetchTableData = async () => {
        if (!formData.Date) return;
        setTableLoading(true);
        try {
            const config = TRANSACTION_CONFIG['drilling'];
            // Fetch for specific date
            const params = new URLSearchParams({
                offset: '0',
                limit: '1000',
                fromDate: formData.Date,
                toDate: formData.Date
            });
            const res = await fetch(`${config.apiEndpoint}?${params}`);
            const result = await res.json();
            if (result.data) {
                setTableData(result.data);
            }
        } catch (err) {
            console.error("Failed to load table data", err);
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        fetchTableData();
    }, [formData.Date]);

    // Field Order for Navigation (Visual Order)
    const FIELD_ORDER = [
        'Date',
        'DrillingPatchId', 'EquipmentId', 'MaterialId', 'LocationId',
        'SectorId', 'ScaleId', 'StrataId', 'DepthSlabId',
        'NoofHoles', 'TotalMeters', 'Spacing', 'Burden', 'TopRLBottomRL', 'RemarkId',
        'Output', // Skips AverageDepth
        'Remarks' // Skips UnitId, TotalQty
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
            'DrillingPatchId', 'EquipmentId', 'MaterialId', 'LocationId',
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
                    DrillingPatchId: '', EquipmentId: '', MaterialId: '', LocationId: '',
                    SectorId: '', ScaleId: '', StrataId: '', DepthSlabId: '',
                    NoofHoles: '', TotalMeters: '', Spacing: '', Burden: '', TopRLBottomRL: '',
                    AverageDepth: '', Output: '', UnitId: '', TotalQty: '', RemarkId: '', Remarks: ''
                }));
                // Focus first input (excluding Date) -> PatchId
                if (inputRefs.current['DrillingPatchId']) inputRefs.current['DrillingPatchId'].focus();

                fetchTableData(); // Refresh table
            } else {
                router.back();
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
                name: opt.Name || opt.EquipmentName || opt.MaterialName || opt.LocationName || opt.SectorName || opt.DrillingRemarks || opt.Strata || opt.DrillingRemarks || 'Unknown'
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
                <button className={css.backBtn} onClick={() => router.back()}>
                    <ArrowLeft size={16} /> Back
                </button>
                <h1 className={css.title}>{mode === 'create' ? 'Create' : 'Update'} Drilling</h1>
                <div className={css.headerActions}>
                    <button className={css.refreshBtn} onClick={() => window.location.reload()} title="Refresh (F5)">
                        <RefreshCw size={18} />
                    </button>
                    <button className={css.saveBtn} onClick={handleSave} title="Save (Ctrl+S / F2)">
                        <Save size={18} /> Save (F2)
                    </button>
                </div>
            </div>

            <div className={css.formSection}>
                {/* Row 1: Date */}
                <div className={css.row}>
                    {renderField('Date', 'Date of Drilling', 'date', true, { max: today })}
                </div>

                <div className={css.divider}></div>

                {/* Row 2: Patch, Equipment, Material, Location */}
                <div className={css.row}>
                    {renderField('DrillingPatchId', 'Drilling Patch ID', 'text', true)}
                    {renderField('EquipmentId', 'Equipment', 'select', true, { options: masters.equipment })}
                    {renderField('MaterialId', 'Material', 'select', true, { options: masters.material })}
                    {renderField('LocationId', 'Location', 'select', true, { options: masters.location })}
                </div>

                {/* Row 3: Sector, Scale, Strata, Slab (Line Removed) */}
                <div className={css.row}>
                    {renderField('SectorId', 'Sector', 'select', true, { options: masters.sector })}
                    {renderField('ScaleId', 'Scale', 'select', true, { options: masters.scale })}
                    {renderField('StrataId', 'Strata', 'select', true, { options: masters.strata })}
                    {renderField('DepthSlabId', 'Depth Slab', 'select', true, { options: masters.depthSlab })}
                </div>

                <div className={css.divider}></div>

                {/* Row 4: Holes, Meters, Spacing, Burden, RL, Remarks */}
                <div className={css.rowCustom}>
                    {renderField('NoofHoles', 'No of Holes', 'text', true, { placeholder: 'Num' })}
                    {renderField('TotalMeters', 'Total Meters/Hole', 'text', true, { placeholder: '0.000' })}
                    {renderField('Spacing', 'Spacing', 'text', true, { placeholder: '0.000' })}
                    {renderField('Burden', 'Burden', 'text', true, { placeholder: '0.000' })}
                    {renderField('TopRLBottomRL', 'Top RL Bottom RL', 'text', false)}
                    {renderField('RemarkId', 'Drilling Remarks', 'select', true, { options: masters.remarks })}
                </div>

                {/* Divider Removed as requested */}

                {/* Row 5: Avg, Output, Unit, Total Qty - Half Width */}
                <div className={css.rowHalf}>
                    {renderField('AverageDepth', 'Average Depth', 'text', true, { readOnly: true, placeholder: 'Calc: Meters/Holes' })}
                    {renderField('Output', 'Output %', 'text', true, { placeholder: 'e.g. 67.0' })}
                    {/* Unit is ReadOnly and Auto Selected via Material */}
                    {renderField('UnitId', 'Unit', 'select', true, { options: masters.units, readOnly: true })}
                    {renderField('TotalQty', 'Total Qty', 'text', true, { readOnly: true, placeholder: 'Calc: H*M*Out' })}
                </div>

                <div className={css.divider}></div>

                {/* Row 6: Remarks */}
                <div className={css.row} style={{ gridTemplateColumns: '1fr' }}>
                    {renderField('Remarks', 'Remarks', 'text', false, { placeholder: 'Optional remarks' })}
                </div>

            </div>

            <div className={css.dataTableSection}>
                <h3 className={css.tableTitle}>Recent Entries</h3>
                <TransactionTable
                    config={TRANSACTION_CONFIG['drilling']}
                    data={tableData}
                    isLoading={tableLoading}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    userRole="User"
                    hideHeader={false}
                />
            </div>
        </div>
    );
}
