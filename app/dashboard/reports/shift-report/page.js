'use client';
import { useState, useEffect } from 'react';
import styles from '../daily-progress/DailyProgressPage.module.css'; // Reusing generic report styles
import ShiftReportTable from './ShiftReportTable';

export default function ShiftReportPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [shiftId, setShiftId] = useState('');
    const [shifts, setShifts] = useState([]);

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Shifts on mount
    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const res = await fetch('/api/master/shift');
                if (res.ok) {
                    const data = await res.json();
                    // Master API returns array directly
                    if (Array.isArray(data)) {
                        setShifts(data);
                    } else if (data.success && Array.isArray(data.data)) {
                        setShifts(data.data);
                    }
                } else {
                    console.warn("Could not fetch shifts");
                }
            } catch (e) { console.error(e); }
        };
        fetchShifts();
    }, []);

    const handleShowReport = async () => {
        if (!date || !shiftId) {
            alert("Please select both Date and Shift");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/shift-production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, shiftId })
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
                <h1 className={styles.title}>Shift Report</h1>

                <div className={styles.controls} style={{ justifyContent: 'flex-start', gap: '20px' }}>
                    {/* Date and Shift Container - 30% Width */}
                    <div style={{ display: 'flex', gap: '10px', width: '30%', minWidth: '300px' }}>
                        <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label>Date</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label>Shift</label>
                            <select
                                className={styles.input}
                                value={shiftId}
                                onChange={(e) => setShiftId(e.target.value)}
                                style={{ width: '100%' }}
                            >
                                <option value="">-- Select --</option>
                                {shifts.map(s => (
                                    <option key={s.SlNo} value={s.SlNo}>{s.ShiftName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button className={`${styles.button} ${styles.primary}`} onClick={handleShowReport} disabled={loading}>
                        {loading ? 'Loading...' : 'Show Report'}
                    </button>
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {reportData && (
                <div className={styles.reportContainer} id="print-section">
                    <ShiftReportTable data={reportData} date={date} shiftName={shifts.find(s => s.SlNo == shiftId)?.ShiftName || ''} />
                </div>
            )}
        </div>
    );
}
