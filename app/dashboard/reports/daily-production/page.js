'use client';
import { useState } from 'react';
import styles from '../daily-progress/DailyProgressPage.module.css'; // Reusing styles
import DailyProductionTable from './DailyProductionTable';

export default function DailyProductionPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    // Shift state removed
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Removed useEffect for fetching shifts

    const handleShowReport = async () => {
        if (!date) {
            alert("Please select a Date");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/daily-production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }) // Only date sent
            });
            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
            } else {
                setError(result.message || 'Failed to fetch report');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        // Excel Logic to be implemented or reused
        alert("Excel Export not yet implemented for this specific report.");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Daily Production Report</h1>

                <div className={styles.controls}>
                    {/* Date Input with specific width */}
                    <div className={styles.inputGroup} style={{ width: '30%' }}>
                        <label>Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <button className={`${styles.button} ${styles.primary}`} onClick={handleShowReport} disabled={loading}>
                        {loading ? 'Loading...' : 'Show Report'}
                    </button>

                    {/* Buttons moved to Table Component */}
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {reportData && (
                <div className={styles.reportContainer} id="print-section">
                    <DailyProductionTable data={reportData} date={date} />
                </div>
            )}
        </div>
    );
}
