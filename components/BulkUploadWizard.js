'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx-js-style';
import { Download, FileSpreadsheet, Trash2, X, Play, CheckCircle, AlertCircle, Upload as CloudUploadIcon, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import styles from './BulkUploadWizard.module.css';
import { MASTER_CONFIG } from '@/lib/masterConfig';

// Reusable Wizard Component
export default function BulkUploadWizard({ config, tableTitle, onBack }) {
    // 1: Upload, 2: Preview, 3: Processing, 4: Summary
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [existingData, setExistingData] = useState([]);
    const [masterData, setMasterData] = useState({}); // Cache for Lookups
    const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, inserted: 0, updated: 0 });
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [hasValidData, setHasValidData] = useState(true);
    const fileInputRef = useRef(null);
    const router = useRouter();

    // Fetch Master Data for Lookups
    const fetchMasterData = async () => {
        const lookups = {};
        for (const col of config.columns) {
            if (typeof col === 'object' && col.type === 'select' && col.lookup) {
                const configKey = col.lookup.table; // e.g. 'equipment-group'
                if (!lookups[configKey]) {
                    try {
                        // Resolve actual Table Name from MASTER_CONFIG
                        // If configKey finds a config, use its table property. Else assume it IS the table name.
                        let dbTableName = configKey;
                        if (MASTER_CONFIG[configKey]) {
                            dbTableName = MASTER_CONFIG[configKey].table;
                        }

                        // Clean for API (API expects 'TblEquipmentGroup', not '[Master].[TblEquipmentGroup]')
                        const table = dbTableName.replace('[Master].[', '').replace(']', '');

                        const res = await fetch('/api/settings/crud', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'read', table })
                        });

                        if (!res.ok) {
                            console.error(`API Error for ${table}:`, res.status, res.statusText);
                            continue;
                        }

                        const result = await res.json();
                        if (Array.isArray(result)) {
                            lookups[configKey] = result;
                        }
                    } catch (err) {
                        console.error(`Failed to fetch lookup ${configKey}`, err);
                    }
                }
            }
        }
        setMasterData(lookups);
    };

    // Fetch Existing Data for Validation
    const fetchExistingData = async () => {
        try {
            await fetchMasterData(); // Fetch lookups first
            const table = config.table.replace('[Master].[', '').replace(']', '');
            const res = await fetch('/api/settings/crud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'read', table })
            });
            const result = await res.json();
            if (Array.isArray(result)) {
                setExistingData(result);
            }
        } catch (error) {
            console.error("Failed to fetch existing data for validation", error);
        }
    };

    // Reset State
    const reset = () => {
        setStep(1);
        setFile(null);
        setData([]);
        setStats({ total: 0, success: 0, failed: 0, inserted: 0, updated: 0 });
        setProcessing(false);
        setProgress(0);
        setHasValidData(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Auto-Reset on Mount & Fetch Data
    useEffect(() => {
        reset();
        fetchExistingData();
    }, []);

    const handleDownloadTemplate = () => {
        const headers = ['SlNo'];
        const validations = {}; // Column Index -> List of Values

        config.columns.filter(c => !(typeof c === 'object' && (c.viewOnly || c.excludeFromExport))).forEach((col, idx) => {
            const label = typeof col === 'string' ? col : col.templateLabel || col.label || col.accessor;
            headers.push(label);

            // 1. Prepare Validation Options
            if (typeof col === 'object' && col.type === 'select' && col.lookup) {
                const lookupTable = masterData[col.lookup.table] || [];
                const nameField = col.lookup.nameField;
                const options = lookupTable.map(item => item[nameField]).filter(Boolean);
                if (options.length > 0) {
                    validations[idx + 1] = options; // +1 because SlNo is at 0
                }
            }
        });

        const ws = XLSX.utils.aoa_to_sheet([headers]);

        // Auto-fit Columns
        const colWidths = headers.map(h => ({ wch: Math.max(h.length + 5, 20) }));
        ws['!cols'] = colWidths;

        // Apply Header Styles
        headers.forEach((h, i) => {
            const cellRef = XLSX.utils.encode_cell({ c: i, r: 0 });
            if (ws[cellRef]) {
                const colConfig = config.columns.find(c => {
                    const label = typeof c === 'string' ? c : c.templateLabel || c.label || c.accessor;
                    return label === h;
                });
                const isRequired = colConfig && typeof colConfig === 'object' && colConfig.required;

                if (!ws[cellRef].s) ws[cellRef].s = {};

                // Explicitly set fill style
                ws[cellRef].s = {
                    font: { bold: true, sz: 12, color: { rgb: "000000" } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    fill: { fgColor: { rgb: isRequired ? "FFFF00" : "E0E0E0" } },
                    border: {
                        top: { style: 'thin' }, bottom: { style: 'thin' },
                        left: { style: 'thin' }, right: { style: 'thin' }
                    }
                };
            }
        });

        // 2. Add Data Validation (if library supports it, unfortunately standard SheetJS Community doesn't easy-write validations)
        // However, we can use a trick with a hidden sheet for lists if using Pro, but here we try basic XLML or just skip if library limited.
        // NOTE: xlsx-js-style is based on SheetJS. Writing Data Validations structure directly to worksheet object is complex.
        // We will try a known structure for "dataValidation" if supported, else this part might need a different library like exceljs.
        // Given constraint: "is it possible". If we cannot easily do it with current lib, we proceed without or user accepts limitation.
        // But let's try populating '!dataValidation' property if supported.
        // Since we can't guarantee `xlsx-js-style` supports writing validation, we'll try best effort or skip.
        // We'll skip complex validation code to avoid corrupt files if unsupported.

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `${tableTitle}_Template.xlsx`);
    };

    const validateRow = (row, currentExisting) => {
        // User Requirement: Check "Equipment Long Text" (EquipmentName) specifically for Equipment Master
        // Fallback to other unique columns if generic
        const longTextCol = config.columns.find(c => c.accessor === 'EquipmentName');

        let match = null;
        if (longTextCol) {
            match = currentExisting.find(ex => String(ex['EquipmentName']).trim().toLowerCase() === String(row['EquipmentName']).trim().toLowerCase());
        } else {
            // Generic Fallback
            const uniqueCols = config.columns.filter(c => typeof c === 'object' && c.unique).map(c => c.accessor);
            if (uniqueCols.length > 0) {
                match = currentExisting.find(ex => uniqueCols.some(u => String(ex[u]).trim().toLowerCase() === String(row[u]).trim().toLowerCase()));
            }
        }

        if (match) {
            return { status: 'Update', existingId: match[config.idField] };
        }
        return { status: 'New', existingId: null };
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // Manual Cell Iteration for Strict Alignment
                const range = XLSX.utils.decode_range(ws['!ref']);
                const dataRows = [];
                const headers = [];

                // Debug Logs
                console.log("Raw Range:", ws['!ref']);

                // 1. Read Headers (First Row)
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ c: C, r: range.s.r });
                    const cell = ws[cellAddress];
                    headers[C] = cell ? String(cell.v).trim() : '';
                }
                console.log("Detected Headers:", headers);

                // 2. Map Config Accessors to Column Indices
                const colMap = {}; // accessor -> Column Index (C)
                config.columns.forEach(col => {
                    const accessor = typeof col === 'string' ? col : col.accessor;
                    const label = typeof col === 'string' ? col : col.templateLabel || col.label || accessor;

                    // Fuzzy Match headers
                    let index = headers.indexOf(label);
                    if (index === -1) index = headers.findIndex(h => h.toLowerCase() === label.toLowerCase());
                    if (index === -1) index = headers.findIndex(h => h.toLowerCase().includes(label.toLowerCase()));

                    if (index !== -1) {
                        colMap[accessor] = index;
                    }
                });
                console.log("Column Mapping:", colMap);

                // 3. Analyze Data for Shifts (Anchor Logic)
                // We use 'EquipmentGroupId' (Equipment Model) as the Anchor because it has a strict Lookup.
                let globalShift = 0;
                const anchorColConfig = config.columns.find(c => c.accessor === 'EquipmentGroupId');
                const modelMasterKey = 'equipment-group'; // Correct key from config

                console.log("Master Data Keys:", Object.keys(masterData));
                console.log("Checking Anchor for EquipmentGroupId using Master:", modelMasterKey, "Available:", !!masterData[modelMasterKey]);

                if (anchorColConfig && masterData[modelMasterKey]) {
                    const expectedIndex = colMap['EquipmentGroupId'];
                    if (expectedIndex !== undefined) {
                        // Scan all columns (Index 0 to 20) to find where the Data actually is
                        const lookupTable = masterData[modelMasterKey];

                        let bestMatchIdx = -1;
                        let maxMatches = 0;

                        // Helper for Hyper-Fuzzy Match (Alphanumeric only)
                        const normalize = (str) => String(str || '').replace(/[^a-z0-9]/gi, '').toLowerCase();

                        // Check columns -5 to +5 around expected
                        for (let c = 0; c < 20; c++) {
                            let matches = 0;
                            // Check first 10 rows
                            for (let r = range.s.r + 1; r <= Math.min(range.e.r, range.s.r + 10); r++) {
                                const cell = ws[XLSX.utils.encode_cell({ c: c, r: r })];
                                if (cell && cell.v) {
                                    const val = normalize(cell.v);

                                    if (lookupTable.some(item => normalize(item.Name) === val)) {
                                        matches++;
                                    }
                                }
                            }
                            if (matches > maxMatches) {
                                maxMatches = matches;
                                bestMatchIdx = c;
                            }
                        }

                        // Use a threshold. If we found a column with good matches, and it's different from expected
                        if (maxMatches > 0 && bestMatchIdx !== -1 && bestMatchIdx !== expectedIndex) {
                            globalShift = bestMatchIdx - expectedIndex;
                        }
                    }
                }

                // 4. Process Data Rows
                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                    const newRow = { _id: R - range.s.r - 1, _status: 'Pending', _msg: globalShift !== 0 ? 'Auto-Aligned' : '' };
                    let isEmptyRow = true;
                    const missingLookups = [];

                    config.columns.filter(c => !(typeof c === 'object' && c.viewOnly)).forEach(col => {
                        const accessor = typeof col === 'string' ? col : col.accessor;
                        let colIdx = colMap[accessor];

                        // Apply Shift
                        if (colIdx !== undefined) {
                            colIdx += globalShift;
                        }

                        const defaultValue = (typeof col === 'object' && col.defaultValue !== undefined) ? col.defaultValue : '';

                        let value = defaultValue;
                        if (colIdx !== undefined && colIdx >= 0) {
                            const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: R });
                            const cell = ws[cellAddress];
                            if (cell !== undefined && cell.v !== undefined) {
                                value = cell.v;
                                isEmptyRow = false;
                            }
                        }

                        // Trim Value
                        if (typeof value === 'string') value = value.trim();
                        if (value === '' && defaultValue !== '') value = defaultValue;

                        // Lookup Validation
                        if (typeof col === 'object' && col.lookup && value) {
                            const lookupTable = masterData[col.lookup.table] || [];
                            const nameField = col.lookup.nameField;
                            const match = lookupTable.find(item => String(item[nameField]).trim().toLowerCase() === String(value).trim().toLowerCase());

                            if (!match) {
                                missingLookups.push({
                                    accessor,
                                    value,
                                    table: col.lookup.table,
                                    nameField,
                                    label: col.label
                                });
                            }
                        }

                        newRow[accessor] = value;
                    });

                    if (!isEmptyRow) {
                        // Validate against existing data
                        const validation = validateRow(newRow, existingData);
                        newRow._validationStatus = validation.status;
                        newRow._existingId = validation.existingId;
                        newRow._missingLookups = missingLookups;

                        // Child Table Status
                        if (missingLookups.length > 0) {
                            newRow._childStatus = `Auto-Create: [${missingLookups.map(m => m.label).join(', ')}]`;
                        } else {
                            newRow._childStatus = 'Found';
                        }
                        dataRows.push(newRow);
                    }
                }

                const isValid = dataRows.length > 0;
                setData(dataRows);
                setHasValidData(isValid);
                setFile(selectedFile);
                setStats({ total: dataRows.length, success: 0, failed: 0, inserted: 0, updated: 0 });
                setStep(2); // Move to Preview
            } catch (error) {
                console.error(error);
                toast.error("Failed to parse Excel file");
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const resolveMaster = async (missing) => {
        const { table, value, nameField } = missing;

        // 1. Check Cache again (might be created by previous row)
        let lookupTable = masterData[table] || [];
        let match = lookupTable.find(item => String(item[nameField]).trim().toLowerCase() === String(value).trim().toLowerCase());

        if (match) return match.SlNo;

        // 2. Create New
        // Extract real table name
        let dbTableName = table;
        if (MASTER_CONFIG[table]) {
            dbTableName = MASTER_CONFIG[table].table;
        }
        const dbTable = dbTableName.replace('[Master].[', '').replace(']', '');

        try {
            const payload = { [nameField]: value };
            // Add defaults for specific tables if needed? 
            // For now assume single-field creation is enough or DB defaults handle rest.

            const res = await fetch('/api/settings/crud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', table: dbTable, data: payload })
            });
            const result = await res.json();

            if (res.ok && result.id) {
                // Update Cache (Keep for UI sync, but rely on return value for logic)
                const newItem = { SlNo: result.id, ...payload };
                lookupTable = [...lookupTable, newItem];
                setMasterData(prev => ({ ...prev, [table]: lookupTable }));
                return result.id;
            }
        } catch (e) {
            console.error(`Failed to auto-create master ${value}`, e);
        }
        return null;
    };

    const handleProcess = async () => {
        setStep(3);
        setProcessing(true);
        let successCount = 0;
        let failCount = 0;
        let insertCount = 0;
        let updateCount = 0;
        const newData = [...data];

        for (let i = 0; i < newData.length; i++) {
            const row = newData[i];
            const payload = {};
            let processingError = null;

            // 1. Resolve Missing Lookups & Store IDs locally for this row
            const resolvedMap = {}; // store accessor -> new ID
            if (row._missingLookups && row._missingLookups.length > 0) {
                for (const missing of row._missingLookups) {
                    const id = await resolveMaster(missing);
                    if (!id) {
                        processingError = `Failed to create master: ${missing.value}`;
                        break;
                    }
                    // IMPORTANT: Map the 'accessor' (e.g., CategoryId) to the new ID
                    // We need to find which column this missing value belongs to
                    // The 'missing' object structure is { table: '...', value: '...', field: 'Name' }
                    // We need to match it back to the column accessor.
                    const relevantCol = config.columns.find(c =>
                        typeof c === 'object' && c.lookup && c.lookup.table === missing.table
                    );
                    if (relevantCol) {
                        resolvedMap[relevantCol.accessor] = id;
                    }
                }
            }

            if (processingError) {
                newData[i]._status = 'Error';
                newData[i]._msg = processingError;
                failCount++;
                setProgress(Math.round(((i + 1) / newData.length) * 100));
                continue; // Skip this row
            }

            // 2. Build Payload (Resolve IDs)
            config.columns.forEach(col => {
                // Skip ViewOnly columns like PMSCode
                if (typeof col === 'object' && col.viewOnly) return;

                const acc = typeof col === 'string' ? col : col.accessor;
                let val = row[acc];

                // If Lookup, find ID
                if (typeof col === 'object' && col.lookup) {
                    // CHECK 1: Did we just resolve it?
                    if (resolvedMap[acc]) {
                        payload[acc] = resolvedMap[acc];
                    } else {
                        // CHECK 2: Is it in the existing (stale) cache?
                        const lookupTable = masterData[col.lookup.table] || [];
                        const nameField = col.lookup.nameField;
                        const valueField = col.lookup.valueField || 'SlNo';

                        const match = lookupTable.find(item => String(item[nameField]).trim().toLowerCase() === String(val).trim().toLowerCase());
                        if (match) {
                            payload[acc] = match[valueField];
                        } else {
                            // If not found in cache AND not newly resolved, set null
                            payload[acc] = null;
                        }
                    }
                } else {
                    payload[acc] = val;
                }
            });

            // Determine Action based on validation
            const realIsUpdate = !!row._existingId;

            payload['UploadRemark'] = realIsUpdate ? 'Updated using bulk upload' : 'Inserted using bulk upload';
            const action = realIsUpdate ? 'update' : 'create';
            const id = realIsUpdate ? row._existingId : null;

            // Extract actual table name from config
            const tableName = config.table.replace('[Master].[', '').replace(']', '');

            try {
                const body = {
                    action,
                    table: tableName,
                    data: payload,
                    id: id
                };

                const res = await fetch('/api/settings/crud', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const result = await res.json();
                if (res.ok) {
                    newData[i]._status = realIsUpdate ? 'Updated' : 'Inserted';
                    newData[i]._msg = realIsUpdate ? 'Record Updated successfully' : 'Record Inserted successfully';
                    successCount++;
                    if (realIsUpdate) updateCount++; else insertCount++;
                } else {
                    newData[i]._status = 'Error';
                    newData[i]._msg = result.message || result.error || 'Failed';
                    failCount++;
                }
            } catch (err) {
                newData[i]._status = 'Error';
                newData[i]._msg = err.message || 'Unknown Error';
                failCount++;
            }
            // Update progress only
            setProgress(Math.round(((i + 1) / newData.length) * 100));
        }

        // Final State Update
        setData([...newData]);
        setStats({ total: newData.length, success: successCount, failed: failCount, inserted: insertCount, updated: updateCount });
        setProcessing(false);
        setStep(4); // Move to Summary
    };

    // --- RENDERERS ---

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return '#3b82f6'; // Blue
            case 'Update': return '#f59e0b'; // Amber
            case 'Inserted': return '#16a34a'; // Green
            case 'Updated': return '#f59e0b'; // Amber
            case 'Error': return '#dc2626'; // Red
            default: return '#64748b'; // Gray
        }
    };

    return (
        <div className={styles.container}>
            {/* Header with Back Button */}
            <div className={styles.header}>
                {!processing && (
                    <button onClick={onBack} className={styles.backButton}>
                        <ArrowLeft size={24} />
                    </button>
                )}
                <div>
                    <h1 className={styles.title}>Bulk Upload: {tableTitle}</h1>
                    <p className={styles.subtitle}>Follow the steps to upload and process your data.</p>
                </div>
            </div>

            {/* Steps Indicator */}
            <div className={styles.stepsContainer}>
                <div className={styles.stepsTrack}></div>
                {[
                    { id: 1, label: 'Upload' },
                    { id: 2, label: 'Preview' },
                    { id: 3, label: 'Process' },
                    { id: 4, label: 'Summary' }
                ].map((s) => (
                    <div key={s.id} className={styles.stepItem}>
                        <div className={`${styles.stepCircle} ${step >= s.id ? styles.stepCircleActive : ''} ${step === s.id ? styles.ring : ''}`}>
                            {step > s.id ? <CheckCircle size={20} /> : s.id}
                        </div>
                        <span className={`${styles.stepLabel} ${step >= s.id ? styles.stepLabelActive : ''}`}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className={styles.card}>
                {/* Step 1: Upload */}
                {step === 1 && (
                    <div className={styles.uploadZone}>
                        <div className={styles.iconCircle}>
                            <CloudUploadIcon size={48} />
                        </div>
                        <h3 className={styles.uploadTitle}>Upload Data File</h3>
                        <p className={styles.uploadDesc}>
                            Drag and drop your Excel file here, or click to browse. Ensure your file matches the template structure.
                        </p>

                        <div className={styles.actions}>
                            <button onClick={handleDownloadTemplate} className={styles.btnSecondary + " " + styles.btn}>
                                <Download size={18} /> Download Template
                            </button>
                            <div className={styles.fileInputWrapper}>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    className={styles.fileInput}
                                    ref={fileInputRef}
                                />
                                <button className={styles.btnPrimary + " " + styles.btn}>
                                    <FileSpreadsheet size={18} /> Select Excel File
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Preview */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className={styles.previewHeader}>
                            <h3 className={styles.previewTitle}>
                                <FileSpreadsheet className={styles.textSuccess} size={20} />
                                Preview Data
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>New: {data.filter(r => r._validationStatus === 'New').length}</span> |
                                    <span style={{ color: '#f59e0b', fontWeight: 'bold', marginLeft: '5px' }}>Update: {data.filter(r => r._validationStatus === 'Update').length}</span>
                                </div>
                                <button onClick={reset} className={styles.resetBtnLink}>Cancel & Reset</button>
                            </div>
                        </div>

                        {!hasValidData && (
                            <div style={{
                                margin: '0 0 1rem 0',
                                padding: '1rem',
                                background: '#fee2e2',
                                border: '1px solid #ef4444',
                                borderRadius: '8px',
                                color: '#b91c1c',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <AlertCircle size={20} />
                                <div>
                                    <strong>No valid data found!</strong>
                                    <p style={{ margin: 0, fontSize: '0.9em' }}>The uploaded file appears to be empty or contains no valid data rows.</p>
                                </div>
                            </div>
                        )}

                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}>#</th>
                                        <th style={{ width: '100px' }}>Type</th>
                                        <th style={{ width: '200px' }}>Child Status</th>
                                        {config.columns.filter(c => !(typeof c === 'object' && c.viewOnly)).map((col, idx) => (
                                            <th key={idx}>
                                                {typeof col === 'string' ? col : col.label || col.accessor}
                                            </th>
                                        ))}
                                        <th style={{ textAlign: 'center', width: '60px' }}>Del</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, idx) => (
                                        <tr key={row._id}>
                                            <td style={{ color: '#64748b' }}>{idx + 1}</td>
                                            <td>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    background: row._validationStatus === 'New' ? '#dbeafe' : '#fef3c7',
                                                    color: row._validationStatus === 'New' ? '#1e40af' : '#92400e'
                                                }}>
                                                    {row._validationStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.75rem', fontWeight: '600',
                                                    color: row._childStatus === 'Found' ? '#16a34a' : '#ea580c'
                                                }}>
                                                    {row._childStatus}
                                                </span>
                                            </td>
                                            {config.columns.filter(c => !(typeof c === 'object' && c.viewOnly)).map((col, cIdx) => (
                                                <td key={cIdx}>
                                                    {row[typeof col === 'string' ? col : col.accessor]}
                                                </td>
                                            ))}
                                            <td style={{ textAlign: 'center' }}>
                                                <button onClick={() => {
                                                    setData(prev => prev.filter(r => r._id !== row._id));
                                                    setStats(prev => ({ ...prev, total: prev.total - 1 }));
                                                }} className={styles.deleteBtn}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.bottomActions}>
                            <button onClick={reset} className={styles.btnSecondary + " " + styles.btn}>Cancel</button>
                            {hasValidData && (
                                <button onClick={handleProcess} className={styles.btnPrimary + " " + styles.btn}>
                                    <Play size={18} /> Process Data
                                </button>
                            )}
                            {!hasValidData && (
                                <button onClick={reset} className={styles.btnPrimary + " " + styles.btn}>
                                    <RefreshCw size={18} /> Re-upload
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Processing */}
                {step === 3 && (
                    <div className={styles.processingContainer}>
                        <div className={styles.spinnerContainer}>
                            <div className={styles.spinner}></div>
                            <div className={styles.progressText}>{progress}%</div>
                        </div>

                        <h3 className={styles.uploadTitle}>Processing Data...</h3>
                        <div className={styles.statsRow}>
                            <div className={styles.statItem}>
                                <div className={styles.statValue + " " + styles.textSuccess}>{stats.success}</div>
                                <div className={styles.statLabel}>Success</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statValue + " " + styles.textDanger}>{stats.failed}</div>
                                <div className={styles.statLabel}>Failed</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Summary */}
                {step === 4 && (
                    <div className={styles.summaryContainer} style={{ width: '100%', maxWidth: '1000px' }}>
                        <div className={styles.successIcon} style={{
                            background: stats.failed === 0 ? '#dcfce7' : (stats.success === 0 ? '#fee2e2' : '#ffedd5'),
                            color: stats.failed === 0 ? '#16a34a' : (stats.success === 0 ? '#dc2626' : '#ea580c')
                        }}>
                            {stats.failed === 0 ? <CheckCircle size={48} /> : (stats.success === 0 ? <AlertCircle size={48} /> : <AlertCircle size={48} />)}
                        </div>
                        <h2 className={styles.summaryTitle}>
                            {stats.failed === 0 ? 'Upload Complete!' : (stats.success === 0 ? 'Upload Failed' : 'Upload Completed with Errors')}
                        </h2>
                        <p className={styles.summaryDesc}>
                            {stats.failed === 0
                                ? 'All records have been processed successfully.'
                                : `Processed ${stats.success} records. Failed to process ${stats.failed} records.`}
                        </p>

                        <div className={styles.summaryStatsGrid}>
                            <div className={styles.summaryCard + " " + styles.cardTotal}>
                                <div className={styles.statValue}>{stats.total}</div>
                                <div className={styles.statLabel}>Total</div>
                            </div>
                            <div className={styles.summaryCard + " " + styles.cardSuccess}>
                                <div className={styles.statValue + " " + styles.textSuccess}>{stats.success}</div>
                                <div className={styles.statLabel}>Success</div>
                            </div>
                            <div className={styles.summaryCard + " " + styles.cardFailed}>
                                <div className={styles.statValue + " " + styles.textDanger}>{stats.failed}</div>
                                <div className={styles.statLabel}>Failed</div>
                            </div>
                        </div>

                        {/* Detailed Result Table */}
                        <div className={styles.tableWrapper} style={{ width: '100%', marginBottom: '2rem' }}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}>#</th>
                                        <th style={{ width: '150px' }}>Identifier</th>
                                        <th style={{ width: '100px' }}>Status</th>
                                        <th>Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, idx) => (
                                        <tr key={row._id}>
                                            <td style={{ color: '#64748b' }}>{idx + 1}</td>
                                            <td style={{ fontWeight: '500' }}>
                                                {/* Try to show the first unique column or first column as identifier */}
                                                {row[config.columns.find(c => typeof c === 'object' && c.unique)?.accessor] || Object.values(row)[1]}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    background: row._status === 'Error' ? '#fee2e2' : (row._status === 'Updated' ? '#ffedd5' : '#dcfce7'),
                                                    color: row._status === 'Error' ? '#dc2626' : (row._status === 'Updated' ? '#c2410c' : '#16a34a')
                                                }}>
                                                    {row._status}
                                                </span>
                                            </td>
                                            <td style={{ color: row._status === 'Error' ? '#dc2626' : 'inherit' }}>
                                                {row._msg}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={reset} className={styles.btnSecondary + " " + styles.btn + " " + styles.btnLarge}>
                                <RefreshCw size={18} /> Upload New File
                            </button>
                            <button onClick={onBack} className={styles.btnPrimary + " " + styles.btn + " " + styles.btnLarge}>
                                <ArrowLeft size={18} /> Finish & Return
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
