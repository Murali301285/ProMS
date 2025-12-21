'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import styles from './CrStoppageCumulative.module.css';
import CrStoppageCumulativeTable from './CrStoppageCumulativeTable';

export default function CrStoppageCumulativePage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    const handleFetchReport = async () => {
        if (!date) {
            toast.error("Please select a date");
            return;
        }

        setLoading(true);
        setReportData(null);
        try {
            const res = await fetch('/api/reports/cr-stoppage-cumulative', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
            const result = await res.json();
            if (result.success) {
                setReportData(result.data);
                toast.success("Report generated");
            } else {
                toast.error(result.message || "Failed to fetch report");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.reportTitle} style={{ textAlign: 'left', marginBottom: '10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Crusher Stoppage Cumulative Report</h1>
            </div>

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
                    onClick={handleFetchReport}
                    disabled={loading}
                    className={styles.showBtn}
                >
                    {loading && <Loader2 className="animate-spin h-4 w-4 inline mr-2" />}
                    {loading ? 'Generating...' : 'Show Report'}
                </button>
            </div>

            {reportData && (
                <CrStoppageCumulativeTable
                    data={reportData}
                    date={date}
                />
            )}

            {!reportData && !loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flex: 1, padding: '50px' }}>
                    Select a date and click Show Report
                </div>
            )}
        </div>
    );
}
