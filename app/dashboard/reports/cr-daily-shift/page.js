"use client"
import React, { useState } from 'react';
import styles from './CrDailyShift.module.css';
import CrDailyShiftTable from './CrDailyShiftTable';
import { toast } from 'sonner';

export default function CrDailyShiftReport() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleShowReport = async () => {
        if (!date) {
            toast.error("Please select a date");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/reports/cr-daily-shift', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
            const json = await res.json();

            if (json.success) {
                setData(json.data);
                toast.success("Report loaded successfully");
            } else {
                toast.error(json.message || "Failed to load report");
                setData(null);
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.controlsContainer}>
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
                    className={styles.showBtn}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Show Report"}
                </button>
            </div>

            {data && <CrDailyShiftTable shifts={data} date={date} />}
        </div>
    );
}
