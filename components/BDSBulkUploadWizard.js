'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx-js-style';
import { Download, FileSpreadsheet, Trash2, X, Play, CheckCircle, AlertCircle, Upload as CloudUploadIcon, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import styles from './BulkUploadWizard.module.css'; // Reuse existing styles

export default function BDSBulkUploadWizard({ onBack }) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [hasValidData, setHasValidData] = useState(true);
    const fileInputRef = useRef(null);
    const [masters, setMasters] = useState({ smeCategories: [] });
    const [error, setError] = useState(null);

    // Config for BDS
    const columns = [
        { label: 'Date(dd/mm/yyyy)', accessor: 'Date', required: true, type: 'date', example: 'YYYY-MM-DD' },
        { label: 'SME Category', accessor: 'SMECategory', required: true, lookup: true },
        { label: 'VehicleNo', accessor: 'VehicleNo', required: true },
        { label: 'Weighment (Kg)', accessor: 'Weighment', required: true, type: 'number' },
        { label: 'Counter Reading (Kg)', accessor: 'CounterReading', required: true, type: 'number' },
        { label: 'Loading Sheet (Kg)', accessor: 'LoadingSheet', required: true, type: 'number' },
        { label: 'Std Deduction (Kg)', accessor: 'StandardDeduction', required: true, type: 'number' },
        { label: 'Accepted Qty (Kg)', accessor: 'AcceptedQuantity', required: true, type: 'number' },
        { label: 'Challan No', accessor: 'ChallanNo' }, // Not mandatory
        { label: 'Remarks', accessor: 'Remarks' }        // Not mandatory
    ];

    useEffect(() => {
        // Fetch SME Category Master
        fetch('/api/master/sme-category').then(r => r.json()).then(res => {
            if (res.data) setMasters({ smeCategories: res.data });
        });
    }, []);

    const reset = () => {
        setStep(1);
        setFile(null);
        setData([]);
        setStats({ total: 0, success: 0, failed: 0 });
        setProcessing(false);
        setProgress(0);
        setHasValidData(true);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDownloadTemplate = () => {
        const headers = ['SlNo', ...columns.map(c => c.label)];
        const ws = XLSX.utils.aoa_to_sheet([headers]);

        // Define Mandatory Fields for Styling
        const mandatoryFields = [
            'Date(dd/mm/yyyy)', 'SME Category', 'Vehicle No',
            'Weighment (Kg)', 'Counter Reading (Kg)', 'Loading Sheet (Kg)',
            'Std Deduction (Kg)', 'Accepted Qty (Kg)'
        ];

        // Apply Styles
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: 0, c: C }); // Header Row is 0
            if (!ws[address]) continue;

            const headerValue = ws[address].v;

            // Base Style: Bold
            const style = {
                font: { bold: true, sz: 11 },
                alignment: { horizontal: "center" },
                border: {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" }
                }
            };

            // Yellow Background for Mandatory
            if (mandatoryFields.includes(headerValue)) {
                style.fill = { fgColor: { rgb: "FFFF00" } };
            }

            ws[address].s = style;
        }

        // Set Column Widths
        const colWidths = headers.map(h => ({ wch: 22 }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BDS_Entry_Template");
        XLSX.writeFile(wb, "BDS_Entry_Template.xlsx");
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setError(null); // Clear previous errors

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" });

                if (jsonData.length === 0) {
                    setError({
                        title: "No valid data found!",
                        message: "The uploaded file appears to be empty or contains no valid data rows."
                    });
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                const processed = jsonData.map((row, idx) => {
                    const newRow = { _id: idx, _status: 'Pending', _msg: '' };
                    let isValid = true;
                    let missing = [];

                    columns.forEach(col => {
                        let val = row[col.label]; // Read by Label
                        // Fallback to strict accessor if label not found
                        if (val === undefined) val = row[col.accessor];

                        if (col.required && (val === undefined || val === '' || val === null)) {
                            isValid = false;
                            missing.push(col.label);
                        }

                        // Lookup Validation
                        if (col.lookup && val) {
                            const sme = masters.smeCategories.find(p => p.name.toLowerCase() === String(val).toLowerCase().trim());
                            if (sme) {
                                newRow['SMECategoryId'] = sme.id;
                            } else {
                                isValid = false;
                                missing.push(`Invalid SME Category: ${val}`);
                            }
                        }

                        newRow[col.accessor] = val;
                    });

                    if (missing.length > 0) {
                        newRow._status = 'Error';
                        newRow._msg = `Missing/Invalid: ${missing.join(', ')}`;
                    } else {
                        newRow._status = 'Ready';
                    }

                    return newRow;
                });

                setData(processed);
                setHasValidData(processed.some(r => r._status === 'Ready'));
                setFile(selectedFile);
                setStep(2);
            } catch (err) {
                toast.error("Failed to parse Excel");
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleProcess = async () => {
        setStep(3);
        setProcessing(true);
        let success = 0;
        let failed = 0;
        const newData = [...data];

        for (let i = 0; i < newData.length; i++) {
            const row = newData[i];
            if (row._status !== 'Ready') {
                failed++;
                continue;
            }

            try {
                // Convert JS Date if excel parsed it weirdly, or ensure string format
                // XLSX usually gives integers for dates, need handling? 
                // We forced 'defval' empty string. user might type '2024-01-01'. 
                // If integer, convert. 
                // Date Handling
                let dateVal = row.Date;
                // Check if it's an Excel serial number
                if (typeof dateVal === 'number') {
                    const dateObj = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
                    dateVal = dateObj.toISOString().split('T')[0];
                }

                // Simple call to API
                const payload = {
                    Date: dateVal,
                    SMECategoryId: row.SMECategoryId,
                    VehicleNo: row.VehicleNo,
                    Weighment: row.Weighment,
                    CounterReading: row.CounterReading,
                    LoadingSheet: row.LoadingSheet,
                    StandardDeduction: row.StandardDeduction,
                    AcceptedQuantity: row.AcceptedQuantity,
                    ChallanNo: row.ChallanNo,
                    Remarks: row.Remarks
                };

                const res = await fetch('/api/transaction/bds-entry/bulk-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: payload })
                });
                const json = await res.json();

                if (json.success) {
                    newData[i]._status = 'Success';
                    newData[i]._msg = 'Inserted';
                    success++;
                } else {
                    newData[i]._status = 'Error';
                    newData[i]._msg = json.message;
                    failed++;
                }

            } catch (e) {
                newData[i]._status = 'Error';
                newData[i]._msg = e.message;
                failed++;
            }
            setProgress(Math.round(((i + 1) / newData.length) * 100));
        }

        setData(newData);
        setStats({ total: newData.length, success, failed });
        setProcessing(false);
        setStep(4);
    };

    const handleDownloadErrors = () => {
        const failedRows = data.filter(r => r._status !== 'Success');
        if (failedRows.length === 0) return;

        const headers = ['SlNo', ...columns.map(c => c.label), 'Error Message'];
        const rows = failedRows.map(r => {
            // Map back to original labels if possible, or just values
            const row = [];
            row.push(r._id + 1);
            columns.forEach(c => row.push(r[c.accessor]));
            row.push(r._msg);
            return row;
        });

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Errors");
        XLSX.writeFile(wb, "Upload_Errors.xlsx");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                {!processing && (
                    <button onClick={onBack} className={styles.backButton}>
                        <ArrowLeft size={24} />
                    </button>
                )}
                <div>
                    <h1 className={styles.title}>Bulk Upload: BDS Entry</h1>
                    {error && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                            <div>
                                <div className="font-bold text-red-700 text-sm">{error.title}</div>
                                <div className="text-red-600 text-xs">{error.message}</div>
                            </div>
                            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Steps Visual */}
            <div className={styles.stepsContainer}>
                <div className={styles.stepsTrack}></div>
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className={styles.stepItem}>
                        <div className={`${styles.stepCircle} ${step >= s ? styles.stepCircleActive : ''}`}>
                            {s}
                        </div>
                        <div className={`${styles.stepLabel} ${step >= s ? styles.stepLabelActive : ''}`}>
                            {['Upload', 'Preview', 'Process', 'Summary'][s - 1]}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.card}>
                {step === 1 && (
                    <div className={styles.uploadZone}>
                        <div className={styles.iconCircle}>
                            <CloudUploadIcon size={48} />
                        </div>
                        <h3 className={styles.uploadTitle}>Upload Data File</h3>
                        <p className={styles.uploadDesc}>Drag and drop your Excel file here, or click to browse.</p>

                        <div className={styles.actions}>
                            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleDownloadTemplate}>
                                <Download size={16} /> Template
                            </button>
                            <div className={styles.fileInputWrapper}>
                                <input type="file" onChange={handleFileChange} accept=".xlsx,.xls" className={styles.fileInput} />
                                <button className={`${styles.btn} ${styles.btnPrimary}`}>
                                    <FileSpreadsheet size={16} /> Select Excel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className={styles.previewHeader}>
                            <h3 className={styles.previewTitle}><FileSpreadsheet size={20} /> Preview Data</h3>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button onClick={reset} className={styles.resetBtnLink}>Cancel & Reset</button>
                                <button onClick={handleProcess} disabled={!hasValidData} className={`${styles.btn} ${styles.btnPrimary}`} style={{ opacity: !hasValidData ? 0.5 : 1 }}>
                                    <Play size={16} /> Process Results
                                </button>
                            </div>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        {columns.map(c => <th key={c.accessor}>{c.label}</th>)}
                                        <th>Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, i) => (
                                        <tr key={i}>
                                            <td>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                                    background: row._status === 'Ready' ? '#dbeafe' : '#fee2e2',
                                                    color: row._status === 'Ready' ? '#1e40af' : '#991b1b'
                                                }}>
                                                    {row._status}
                                                </span>
                                            </td>
                                            {columns.map(c => <td key={c.accessor}>{row[c.accessor]}</td>)}
                                            <td style={{ color: '#dc2626', fontSize: '0.85rem' }}>{row._msg}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className={styles.processingContainer}>
                        <div className={styles.spinnerContainer}>
                            <div className={styles.spinner}></div>
                            <div className={styles.progressText}>{progress}%</div>
                        </div>
                        <h3 className={styles.uploadTitle}>Processing Records...</h3>
                        <p className={styles.uploadDesc}>Please wait while we validate and insert data.</p>

                        <div className={styles.statsRow}>
                            <div className={styles.statItem}>
                                <div className={`${styles.statValue} ${styles.textSuccess}`}>{stats.success}</div>
                                <div className={styles.statLabel}>Success</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={`${styles.statValue} ${styles.textDanger}`}>{stats.failed}</div>
                                <div className={styles.statLabel}>Failed</div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className={styles.summaryContainer}>
                        <div className={styles.successIcon}>
                            <CheckCircle size={48} />
                        </div>
                        <h2 className={styles.summaryTitle}>Upload Complete</h2>
                        <p className={styles.summaryDesc}>Your data processing has been finished.</p>

                        <div className={styles.summaryStatsGrid}>
                            <div className={`${styles.summaryCard} ${styles.cardTotal}`}>
                                <div className={styles.statValue}>{stats.total}</div>
                                <div className={styles.statLabel}>Total Records</div>
                            </div>
                            <div className={`${styles.summaryCard} ${styles.cardSuccess}`}>
                                <div className={`${styles.statValue} ${styles.textSuccess}`}>{stats.success}</div>
                                <div className={styles.statLabel}>Success</div>
                            </div>
                            <div className={`${styles.summaryCard} ${styles.cardFailed}`}>
                                <div className={`${styles.statValue} ${styles.textDanger}`}>{stats.failed}</div>
                                <div className={styles.statLabel}>Failed</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={onBack} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}>
                                Back to List
                            </button>
                            {stats.failed > 0 && (
                                <button onClick={handleDownloadErrors} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnLarge}`} style={{ color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2' }}>
                                    <Download size={16} /> Download Errors
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
