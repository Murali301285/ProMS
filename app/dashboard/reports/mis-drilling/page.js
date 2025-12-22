'use client';

import { useState, useEffect } from 'react';
import LoadingOverlay from '@/components/LoadingOverlay';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import MISDrillingTable from './MISDrillingTable';
import styles from '@/app/dashboard/reports/crusher-summary/CrusherSummary.module.css'; // Reuse styles

export default function MISDrillingPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [data, setData] = useState({ coal: [], ob: [] });
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/mis-drilling?date=${date}`);
            const result = await res.json();
            if (result.error) throw new Error(result.error);
            setData(result);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load report");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // Initial load? Or wait for user? Usually fetch on mount.

    const handleShow = () => fetchData();
    const handleReset = () => {
        setDate(today);
        // Maybe fetch again?
    };

    return (
        <div className={styles.container}>
            {loading && <LoadingOverlay message="Generating Report..." />}

            <div className={styles.controlsContainer}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Date</label>
                    <input type="date" className={styles.input} value={date} max={today} onChange={e => setDate(e.target.value)} />
                </div>
                <button onClick={handleShow} className={styles.showBtn}>Show</button>
                <button onClick={handleReset} className={styles.showBtn} style={{ backgroundColor: '#64748b' }}><RotateCcw size={16} /></button>
            </div>

            <MISDrillingTable data={data} date={date} />
        </div>
    );
}
