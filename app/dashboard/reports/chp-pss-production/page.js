'use client';
import { useState, useEffect } from 'react';
import styles from '../daily-progress/DailyProgressPage.module.css';
import ChpPssProductionTable from './ChpPssProductionTable';

export default function ChpPssProductionPage() {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [month, setMonth] = useState(currentMonth);
    const [plantId, setPlantId] = useState('');
    const [plantList, setPlantList] = useState([]);

    const [reportData, setReportData] = useState(null); // { production, stoppages }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Plants
    useEffect(() => {
        async function fetchPlants() {
            try {
                // Correct Endpoint: /api/master/plant (lowercase slug)
                // Returns array directly: [{ SlNo, Name, ... }]
                const res = await fetch('/api/master/plant');
                const data = await res.json();

                if (Array.isArray(data)) {
                    // Filter for Active and Non-Deleted
                    const validPlants = data.filter(p => !p.IsDelete && p.IsActive);
                    setPlantList(validPlants);
                } else {
                    console.error("Invalid Plant data format", data);
                }
            } catch (e) {
                console.error("Failed to load plants", e);
            }
        }
        fetchPlants();
    }, []);

    const handleShowReport = async () => {
        if (!month || !plantId) {
            alert("Please select Month and Plant");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/chp-pss-production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, plantId })
            });
            const result = await response.json();
            if (result.success) {
                setReportData({ production: result.production, stoppages: result.stoppages, allReasons: result.allReasons });
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
                <h1 className={styles.title}>CHP PSS Production Report</h1>

                <div className={styles.controls} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '40px', flexWrap: 'nowrap' }}>
                    <div className={styles.inputGroup} style={{ width: '150px' }}>
                        <label>Month</label>
                        <input
                            type="month"
                            className={styles.input}
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className={styles.inputGroup} style={{ width: '200px' }}>
                        <label>Plant</label>
                        <select
                            className={styles.input}
                            value={plantId}
                            onChange={(e) => setPlantId(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="">-- Select Plant --</option>
                            {plantList.map(p => (
                                <option key={p.SlNo} value={p.SlNo}>{p.Name}</option>
                            ))}
                        </select>
                    </div>

                    <button className={`${styles.button} ${styles.primary}`} onClick={handleShowReport} disabled={loading} style={{ height: '38px', marginBottom: '1px' }}>
                        {loading ? 'Loading...' : 'Show Report'}
                    </button>
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {reportData && (
                <div className={styles.reportContainer} id="print-section">
                    <ChpPssProductionTable
                        production={reportData.production}
                        stoppages={reportData.stoppages}
                        allReasons={reportData.allReasons}
                        month={month}
                    />
                </div>
            )}
        </div>
    );
}
