"use client";
import React, { useState } from 'react';
import DailyProgressTable from './DailyProgressTable';
import { toast } from 'sonner';
import styles from './DailyProgressPage.module.css';

export default function DailyProgressPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleShowReport = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/reports/daily-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }),
            });
            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
                if (result.data.production.length === 0) {
                    toast.info("No data found for the selected date.");
                }
            } else {
                toast.error(result.message || "Failed to fetch report");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("An error occurred while fetching the report.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className="print:hidden">
                <h1 className={styles.heading}>Daily Progress Report</h1>

                <div className={styles.controlsParams}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Select Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleShowReport}
                        disabled={loading}
                        className={`${styles.button} ${styles.primaryButton}`}
                    >
                        {loading ? 'Generating...' : 'Show Report'}
                    </button>
                </div>
            </div>

            {reportData && (
                <DailyProgressTable data={reportData} date={date} />
            )}
        </div>
    );
}
