'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable'; // Reusing DataTable
import ReportTable from '@/components/reports/ReportTable'; // Reusing ReportTable for View
import { toast } from 'sonner';
import { Download, Eye, Clock, AlertCircle, CheckCircle, RefreshCw, ArrowLeft, FileText } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import styles from './GeneratedReports.module.css';

export default function GeneratedReports() {
    const [viewError, setViewError] = useState(null); // State for error modal

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewData, setViewData] = useState(null); // Data for viewing
    const [viewMeta, setViewMeta] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/reports/status');
            const result = await res.json();
            if (result.success) {
                setRequests(result.data);
            }
        } catch (error) {
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleViewError = (req) => {
        setViewError(req);
    };

    const handleView = async (req) => {
        if (!req.ArtifactPath) return;

        const toastId = toast.loading('Loading report data...');
        try {
            const res = await fetch(req.ArtifactPath);
            if (!res.ok) throw new Error('File not found');
            const data = await res.json();

            if (!data || data.length === 0) {
                toast.error('Report is empty', { id: toastId });
                return;
            }

            setViewData(data);
            setViewMeta(req);
            toast.success('Report loaded', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to load report data', { id: toastId });
        }
    };

    const handleDownload = async (req) => {
        if (!req.ArtifactPath) return;

        const toastId = toast.loading('Preparing download...');
        try {
            const res = await fetch(req.ArtifactPath);
            const data = await res.json();

            if (!data || data.length === 0) {
                toast.error('No data to download', { id: toastId });
                return;
            }

            // Helper to format date as dd_mm_yyyy
            const formatDate = (dateStr) => {
                if (!dateStr) return 'Unknown';
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return dateStr;
                return `${String(d.getDate()).padStart(2, '0')}_${String(d.getMonth() + 1).padStart(2, '0')}_${d.getFullYear()}`;
            };

            // Parse Criteria for Filename and Header
            let fromDateStr = 'Unknown';
            let toDateStr = 'Unknown';
            try {
                const c = JSON.parse(req.Criteria);
                fromDateStr = c.fromDate;
                toDateStr = c.toDate;
            } catch (e) { console.error('Error parsing criteria', e); }

            const fromDateFormatted = formatDate(fromDateStr);
            const toDateFormatted = formatDate(toDateStr);

            // 1. Create Workbook
            const wb = XLSX.utils.book_new();

            // 2. Prepare Data with proper headers
            // We'll construct the sheet manually to insert custom rows
            const headers = Object.keys(data[0]);

            // Calculate Column Widths
            const colWidths = headers.map(key => {
                const maxContentLen = Math.max(
                    key.length,
                    ...data.map(row => String(row[key] || '').length).slice(0, 50) // limit sample check for speed
                );
                return { wch: maxContentLen + 2 };
            });

            // 3. Build Sheet Data
            // Row 1: Header Info
            const reportTitle = [`${req.ReportType} Report - From ${fromDateFormatted.replace(/_/g, '/')} To ${toDateFormatted.replace(/_/g, '/')}`];

            // Row 3: Column Headers
            // Row 4+: Data

            const ws = XLSX.utils.aoa_to_sheet([
                reportTitle,                // Row 1
                [],                         // Row 2 (Empty)
                headers                     // Row 3 (Headers)
            ]);

            // Add Data starting from Row 4
            XLSX.utils.sheet_add_json(ws, data, { skipHeader: true, origin: 'A4' });

            // Add Footer: Empty Row + Downloaded On
            const lastRowIndex = 4 + data.length; // 1-based index roughly
            // Actually let's use aoa for footer to be safe
            XLSX.utils.sheet_add_aoa(ws, [
                [], // Empty Row
                [`Downloaded on ${new Date().toLocaleString()}`]
            ], { origin: -1 }); // -1 appends to bottom


            // 4. Apply Styles
            // Header Row (Row 1): Merge, Bold, Center
            if (!ws['!merges']) ws['!merges'] = [];
            ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }); // Merge A1 across all cols

            ws['A1'].s = {
                font: { bold: true, sz: 14 },
                alignment: { horizontal: 'center' }
            };

            // Column Headers (Row 3): Bold, Border
            const headerRowIndex = 2; // 0-indexed (Row 3)
            const range = XLSX.utils.decode_range(ws['!ref']);

            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
                if (!ws[cellRef]) continue;
                ws[cellRef].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "4F81BD" } }, // Blue header
                    alignment: { horizontal: 'center' }
                };
            }

            // Set Column Widths
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, "Report");

            // Filename: ProMS_[ReportName]_DatedFrom_[fromdate]_to_[todate]
            const fileName = `ProMS_${req.ReportType}_DatedFrom_${fromDateFormatted}_to_${toDateFormatted}.xlsx`;

            XLSX.writeFile(wb, fileName);
            toast.success('Download started', { id: toastId });

        } catch (error) {
            console.error(error);
            toast.error('Download failed', { id: toastId });
        }
    };

    // Columns for the Request List
    const requestColumns = [
        { header: 'ID', accessor: 'SlNo', width: '60px' },
        { header: 'Report Type', accessor: 'ReportType', width: '150px' },
        {
            header: 'Criteria',
            accessor: 'Criteria',
            width: '200px',
            render: (row) => {
                try {
                    const c = JSON.parse(row.Criteria);
                    return <span className="text-xs text-slate-500">{c.fromDate} to {c.toDate}</span>
                } catch (e) { return '-'; }
            }
        },
        {
            header: 'Requested On',
            accessor: 'RequestedDate',
            width: '180px',
            render: (row) => (
                <span className="text-sm">{row.RequestedDate}</span>
            )
        },
        {
            header: 'Status',
            accessor: 'Status',
            width: '120px',
            render: (row) => {
                const statusClass = row.Status === 'COMPLETED' ? styles.statusCompleted :
                    row.Status === 'FAILED' ? styles.statusFailed :
                        styles.statusPending;
                const Icon = row.Status === 'COMPLETED' ? CheckCircle :
                    row.Status === 'FAILED' ? AlertCircle : Clock;

                return (
                    <div className="flex items-center gap-2">
                        <span className={`${styles.statusBadge} ${statusClass}`}>
                            <Icon size={12} /> {row.Status}
                        </span>
                    </div>
                )
            }
        },
        {
            header: 'Actions',
            accessor: 'actions',
            width: '150px',
            render: (row) => (
                <div className={styles.actions}>
                    {row.Status === 'FAILED' ? (
                        <button
                            onClick={() => handleViewError(row)}
                            className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-semibold hover:bg-red-200"
                            title="View Error Details"
                        >
                            <FileText size={14} /> View Error
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => handleView(row)}
                                disabled={row.Status !== 'COMPLETED'}
                                className={`${styles.iconBtn} ${styles.viewBtn} ${row.Status !== 'COMPLETED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="View Report"
                            >
                                <Eye size={16} />
                            </button>
                            <button
                                onClick={() => handleDownload(row)}
                                disabled={row.Status !== 'COMPLETED'}
                                className={`${styles.iconBtn} ${styles.downloadBtn} ${row.Status !== 'COMPLETED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Download Excel"
                            >
                                <Download size={16} />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    if (viewData) {
        // Generate columns dynamically from the first item
        const reportColumns = viewData.length > 0
            ? Object.keys(viewData[0]).map(key => ({
                header: key.replace(/([A-Z])/g, ' $1').trim(), // Add space before caps
                accessor: key
            }))
            : [];

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <button
                            onClick={() => setViewData(null)}
                            className={styles.backBtn}
                        >
                            <ArrowLeft size={16} /> Back to List
                        </button>
                        <div className="flex flex-col items-center mt-2">
                            <div className="flex items-center gap-3">
                                <h1 className={styles.title}>
                                    {viewMeta?.ReportType} Report
                                </h1>
                                {(() => {
                                    try {
                                        if (viewMeta?.Criteria) {
                                            const c = JSON.parse(viewMeta.Criteria);
                                            const fmt = (d) => {
                                                if (!d) return '';
                                                const [y, m, dPart] = d.split('-');
                                                return `${dPart}/${m}/${y}`;
                                            };
                                            return (
                                                <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                                    From Date: {fmt(c.fromDate)} - To Date: {fmt(c.toDate)}
                                                </span>
                                            );
                                        }
                                    } catch (e) { return null; }
                                })()}
                            </div>
                            <p className={styles.subtitle}>
                                Generated on {viewMeta?.RequestedDate}
                            </p>
                        </div>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <ReportTable
                        columns={reportColumns}
                        data={viewData}
                        reportName={viewMeta?.ReportType}
                        generated={true}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Generated Reports</h1>
                    <p className={styles.subtitle}>Download status for bulk/historical reports</p>
                </div>
                <button
                    onClick={fetchRequests}
                    className={styles.refreshBtn}
                >
                    <RefreshCw size={14} className={loading ? styles.spin : ''} /> Refresh
                </button>
            </div>

            <div className={styles.tableContainer}>
                <DataTable
                    columns={requestColumns}
                    data={requests}
                    loading={loading}
                    showSerialNo={false}
                />
            </div>

            {/* Error Log Modal */}
            {viewError && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full m-4 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                <AlertCircle size={20} /> Error Details
                            </h3>
                            <button
                                onClick={() => setViewError(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm font-mono whitespace-pre-wrap break-words text-gray-800">
                            {viewError.ErrorMessage || 'No error details available.'}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setViewError(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
