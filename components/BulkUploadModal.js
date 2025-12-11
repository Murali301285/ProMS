'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx-js-style'; // Use js-style for styling
import { Download, Upload, Trash2, X, RefreshCw, AlertCircle, CheckCircle, Save, FileSpreadsheet, ArrowRight, Play } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/app/dashboard/settings/Settings.module.css';

// Stepped Wizard UI for Bulk Upload
export default function BulkUploadModal({ isOpen, onClose, config, onComplete }) {
    // 1: Upload, 2: Preview, 3: Processing, 4: Summary
    const [step, setStep] = useState(1);

    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    // Reset State when Modal Opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFile(null);
            setData([]);
            setStats({ total: 0, success: 0, failed: 0 });
            setProcessing(false);
            setProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const tableTitle = config.table.replace('[Master].[', '').replace(']', '');

    // --- LOGIC ---

    const handleDownloadTemplate = () => {
        const headers = ['SlNo'];
        config.columns.forEach(col => {
            const label = typeof col === 'string' ? col : col.label || col.accessor;
            headers.push(label);
        });

        const ws = XLSX.utils.aoa_to_sheet([headers]);

        // Auto-fit Columns (min 10 chars, max 50)
        const colWidths = headers.map(h => ({ wch: Math.max(h.length + 5, 15) }));
        ws['!cols'] = colWidths;

        // Apply Header Styles (Bold, Grey Bg, Centered)
        headers.forEach((h, i) => {
            const cellRef = XLSX.utils.encode_cell({ c: i, r: 0 });
            if (ws[cellRef]) {
                ws[cellRef].s = {
                    font: { bold: true, sz: 12, color: { rgb: "000000" } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    fill: { fgColor: { rgb: "E0E0E0" } },
                    border: {
                        top: { style: 'thin' }, bottom: { style: 'thin' },
                        left: { style: 'thin' }, right: { style: 'thin' }
                    }
                };
            }
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `${tableTitle}_Template.xlsx`);
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
                const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });

                // Transform keys based on labels to accessors
                const transformed = jsonData.map((row, idx) => {
                    const newRow = { _id: idx, _status: 'Pending', _msg: '' };
                    config.columns.forEach(col => {
                        const accessor = typeof col === 'string' ? col : col.accessor;
                        const label = typeof col === 'string' ? col : col.label || accessor;
                        newRow[accessor] = row[label] !== undefined ? row[label] : (row[accessor] || '');
                    });
                    return newRow;
                });

                setData(transformed);
                setFile(selectedFile);
                setStats({ total: transformed.length, success: 0, failed: 0 });
                setStep(2); // Move to Preview
            } catch (error) {
                console.error(error);
                toast.error("Failed to parse Excel file");
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleProcess = async () => {
        setStep(3); // Move to Processing
        setProcessing(true);
        let successCount = 0;
        let failCount = 0;

        const newData = [...data];

        for (let i = 0; i < newData.length; i++) {
            const row = newData[i];
            const payload = {};
            config.columns.forEach(col => {
                const acc = typeof col === 'string' ? col : col.accessor;
                payload[acc] = row[acc];
            });
            payload['UploadRemark'] = 'Bulk Insert'; // Default log

            try {
                // Try Create
                const res = await fetch('/api/settings/crud', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'create', table: tableTitle, data: payload })
                });

                const result = await res.json();
                if (res.ok) {
                    newData[i]._status = 'Success';
                    newData[i]._msg = 'Inserted';
                    successCount++;
                } else if (res.status === 409 && result.existingId) {
                    // Update on Duplicate
                    payload['UploadRemark'] = 'Bulk Update';
                    const updateRes = await fetch('/api/settings/crud', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'update', table: tableTitle, id: result.existingId, data: payload })
                    });
                    if (updateRes.ok) {
                        newData[i]._status = 'Success';
                        newData[i]._msg = 'Updated';
                        successCount++;
                    } else {
                        const updateErr = await updateRes.json();
                        newData[i]._status = 'Failed';
                        newData[i]._msg = 'Update Failed: ' + (updateErr.message || updateErr.error);
                        failCount++;
                    }
                } else {
                    newData[i]._status = 'Failed';
                    newData[i]._msg = result.message || result.error || 'Failed';
                    failCount++;
                }
            } catch (err) {
                newData[i]._status = 'Failed';
                newData[i]._msg = 'Error';
                failCount++;
            }
            // Update Progress UI
            setData([...newData]);
            setStats({ total: newData.length, success: successCount, failed: failCount });
            setProgress(Math.round(((i + 1) / newData.length) * 100));
        }

        setProcessing(false);
        setStep(4); // Move to Summary
        if (onComplete) onComplete(); // Trigger Auto-Refresh
    };

    // --- RENDERERS ---

    const renderStep1_Upload = () => (
        <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', border: '2px dashed #e5e7eb', borderRadius: '12px', background: '#f9fafb' }}>
            <div style={{ background: '#dbeafe', padding: '20px', borderRadius: '50%' }}>
                <CloudUploadIcon size={48} color="#2563eb" />
            </div>
            <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>Upload Data File</h3>
                <p style={{ color: '#6b7280' }}>Drag and drop your Excel file here, or click to browse.</p>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
                <button className={styles.btnSecondary} onClick={handleDownloadTemplate}>
                    <Download size={16} /> Download Template
                </button>
                <div style={{ position: 'relative' }}>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                        ref={fileInputRef}
                    />
                    <button className={styles.btnPrimary}>
                        <FileSpreadsheet size={16} /> Select Excel File
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStep2_Preview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className={styles.modalHeader} style={{ paddingBottom: '10px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileSpreadsheet /> Preview Data ({data.length} Rows)
                </h3>
            </div>
            <div className={styles.tableWrapper} style={{ flex: 1, overflow: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>#</th>
                            {config.columns.map((col, idx) => (
                                <th key={idx}>{typeof col === 'string' ? col : col.label || col.accessor}</th>
                            ))}
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={row._id}>
                                <td>{idx + 1}</td>
                                {config.columns.map((col, cIdx) => (
                                    <td key={cIdx}>{row[typeof col === 'string' ? col : col.accessor]}</td>
                                ))}
                                <td>
                                    <button onClick={() => {
                                        setData(prev => prev.filter(r => r._id !== row._id));
                                        setStats(prev => ({ ...prev, total: prev.total - 1 }));
                                    }} style={{ color: 'red', background: 'none', border: 'none' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button onClick={() => setStep(1)} className={styles.btnSecondary}>Cancel</button>
                <button onClick={handleProcess} className={styles.btnPrimary}>
                    <Play size={16} /> Start Processing
                </button>
            </div>
        </div>
    );

    const renderStep3_Processing = () => (
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Processing Data...</h3>
                <p style={{ color: '#6b7280' }}>Please wait while we process your records safely.</p>
            </div>

            {/* Progress Circle or Bar */}
            <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', background: '#e5e7eb', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, background: '#2563eb', height: '100%', transition: 'width 0.3s' }}></div>
            </div>
            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{progress}% Complete</p>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                Success: <span style={{ color: 'green' }}>{stats.success}</span> | Failed: <span style={{ color: 'red' }}>{stats.failed}</span>
            </p>
        </div>
    );

    const renderStep4_Summary = () => (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={48} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '10px' }}>Upload Complete!</h2>
            <p style={{ color: '#6b7280', marginBottom: '30px' }}>Your data has been processed successfully.</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px' }}>
                <div style={{ textAlign: 'center' }}>
                    <h4 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{stats.success}</h4>
                    <span style={{ color: '#6b7280' }}>Success</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h4 style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.failed > 0 ? '#dc2626' : '#9ca3af' }}>{stats.failed}</h4>
                    <span style={{ color: '#6b7280' }}>Failed</span>
                </div>
            </div>

            <button onClick={onClose} className={styles.btnPrimary} style={{ padding: '10px 40px', fontSize: '1.1rem' }}>
                Finish & Close
            </button>
        </div>
    );

    const CloudUploadIcon = ({ size, color }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>
    );

    return (
        <div className={styles.modalOverlay} style={{ zIndex: 2000 }}>
            <div className={styles.modalContent} style={{ width: '800px', maxWidth: '95vw', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'absolute', top: '20px', right: '20px', cursor: 'pointer' }} onClick={!processing ? onClose : undefined}>
                    {!processing && <X size={24} color="#9ca3af" />}
                </div>

                {step === 1 && renderStep1_Upload()}
                {step === 2 && renderStep2_Preview()}
                {step === 3 && renderStep3_Processing()}
                {step === 4 && renderStep4_Summary()}
            </div>
        </div>
    );
}
