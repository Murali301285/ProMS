import { Search, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import styles from './ReportFilter.module.css';

/**
 * Reusable Report Filter Component
 * @param {Object} props
 * @param {string} props.title - Filter Section Title (optional)
 * @param {string} props.reportType - Current Report Type
 * @param {Function} props.setReportType - Setter for Report Type
 * @param {string} props.fromDate - From Date
 * @param {Function} props.setFromDate - Setter for From Date
 * @param {string} props.toDate - To Date
 * @param {Function} props.setToDate - Setter for To Date
 * @param {Function} props.onGenerate - Handler for Generate button
 * @param {Function} props.onReset - Handler to reset parent data (optional)
 * @param {boolean} props.loading - Loading state
 * @param {Array} props.reportOptions - List of report types [{value, label}]
 * @param {boolean} props.showReportType - Show/Hide Report Type Dropdown
 */
export default function ReportFilter({
    title,
    reportType,
    setReportType,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    onGenerate,
    onReset,
    loading,
    reportOptions = [],
    showReportType = true,
    singleDate = false,
    children // NEW: Allow injecting custom inputs
}) {
    const router = useRouter(); // Initialize router

    const handleGenerate = async () => {
        if (!fromDate) return toast.error('Please select a date');
        if (!singleDate && !toDate) return toast.error('Please select both From and To dates');

        // Check Date Range (> 30 Days) - Only for Range Mode
        if (!singleDate) {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 30) {
                // Reset Data in Parent if onReset is provided
                if (onReset) onReset();

                // Trigger Async Request
                try {
                    const res = await fetch('/api/reports/request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            reportType, // passed from parent
                            fromDate,
                            toDate,
                            requestedBy: 1 // TODO: Get from Auth
                        })
                    });
                    const result = await res.json();
                    if (result.success) {
                        toast.success(
                            <div>
                                <p className="font-semibold">Request Submitted</p>
                                <p className="text-xs mt-1">You will be notified when ready.</p>
                                <p className="text-xs">Visit <b>Generated Reports</b> page to check status.</p>
                            </div>
                            , { duration: 5000 }
                        );
                        // Auto-redirect to Generated Reports page
                        router.push('/dashboard/reports/generated');
                    } else {
                        toast.error(result.message || 'Request Failed');
                    }
                } catch (err) {
                    toast.error('Failed to submit request');
                }
                return; // Stop here, don't trigger Sync callback
            }
        }

        // Normal Sync Flow
        if (onGenerate) {
            onGenerate();
        }
    };

    return (
        <div className={styles.container}>

            {showReportType && (
                <div className={`${styles.inputGroup} flex-grow md:flex-grow-0`}>
                    <label className={styles.label}>Report Type</label>
                    <div className={styles.selectWrapper}>
                        <select
                            className={styles.select}
                            value={reportType}
                            onChange={e => setReportType(e.target.value)}
                        >
                            <option value="">Select Report...</option>
                            {reportOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className={styles.inputGroup}>
                <label className={styles.label}>{singleDate ? 'Date' : 'From Date'}</label>
                <input
                    type="date"
                    className={styles.input}
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                />
            </div>

            {!singleDate && (
                <div className={styles.inputGroup}>
                    <label className={styles.label}>To Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={toDate}
                        onChange={e => setToDate(e.target.value)}
                    />
                </div>
            )}

            {/* Custom Inputs (e.g. Shift Selection) */}
            {children}

            <div className="flex gap-2">
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={styles.generateBtn}
                >
                    {loading ? (
                        <>
                            <RotateCcw className={styles.spinner} size={16} />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Search size={16} />
                            Generate View
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
