'use client';
import { useState } from 'react';
import styles from '../daily-progress/DailyProgressPage.module.css';
import OperatorPerformanceLoadingTable from './OperatorPerformanceLoadingTable';

export default function OperatorPerformanceLoadingPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);

    // State
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleShowReport = async () => {
        if (!date) {
            alert("Please select Date");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/operator-performance-loading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Operator Performance - Loading Report</h1>

                <div className={styles.controls} style={{ justifyContent: 'flex-start', gap: '20px' }}>
                    <div className={styles.inputGroup} style={{ width: '200px' }}>
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
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {reportData && (
                <div className={styles.reportContainer} id="print-section">
                    <OperatorPerformanceLoadingTable data={reportData} date={date} />
                </div>
            )}
        </div>
    );
}
