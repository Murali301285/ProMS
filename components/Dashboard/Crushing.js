'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import StoppagePareto from './Charts/StoppagePareto';
import html2canvas from 'html2canvas';
import { utils, writeFile } from 'xlsx';
import { toast } from 'sonner';
import styles from '../../app/dashboard/page.module.css';

export default function Crushing() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });


    // REDESIGN: Enhanced Dummy Data
    const DUMMY_DATA = {
        production: {
            shift: { MaxQty: 450, CrusherName: 'Crusher-01', ShiftName: 'Shift B' },
            day: { MaxQty: 1200, CrusherName: 'Crusher-01' },
            month: { MaxQty: 25000, CrusherName: 'Crusher-02' },
            // NEW: Detailed List
            list: [
                { CrusherName: 'Crusher-01', ShiftQty: 450, DayQty: 1200, Target: 1500, Achievement: 80 },
                { CrusherName: 'Crusher-02', ShiftQty: 380, DayQty: 950, Target: 1500, Achievement: 63 },
                { CrusherName: 'Crusher-03', ShiftQty: 0, DayQty: 0, Target: 1500, Achievement: 0, Remarks: 'Shutdown' },
                { CrusherName: 'Crusher-04', ShiftQty: 410, DayQty: 1150, Target: 1500, Achievement: 76 }
            ]
        },
        stoppages: [
            { Reason: 'Conveyor Belt Tear', Frequency: 2, TotalDuration: 4.5, CrusherName: 'Crusher-01' },
            { Reason: 'No Power', Frequency: 1, TotalDuration: 2.0, CrusherName: 'Crusher-01' },
            { Reason: 'Screen Jam', Frequency: 3, TotalDuration: 1.5, CrusherName: 'Crusher-02' },
            { Reason: 'Boulder Jam', Frequency: 1, TotalDuration: 0.5, CrusherName: 'Crusher-01' }
        ],
        // NEW: Detailed Stoppage Log
        stoppageLog: [
            { Time: '10:30 AM', Crusher: 'Crusher-01', Reason: 'Conveyor Belt Tear', Duration: '2.5 hrs', Remarks: 'Belt replaced' },
            { Time: '02:15 PM', Crusher: 'Crusher-01', Reason: 'No Power', Duration: '2.0 hrs', Remarks: 'Grid failure' },
            { Time: '11:00 AM', Crusher: 'Crusher-02', Reason: 'Screen Jam', Duration: '0.5 hrs', Remarks: 'Cleared manually' },
            { Time: '04:45 PM', Crusher: 'Crusher-01', Reason: 'Conveyor Belt Tear', Duration: '2.0 hrs', Remarks: 'Belt alignment issue' },
        ]
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Simulate Network Delay
            await new Promise(resolve => setTimeout(resolve, 800));
            // const res = await fetch(`/api/dashboard/crushing?date=${date}`);
            // if (!res.ok) throw new Error('Failed to fetch data');
            // const json = await res.json();
            setData(DUMMY_DATA);
        } catch (error) {
            console.error(error);
            toast.error('Error loading dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    // Excel Download Handler
    const handleDownloadExcel = () => {
        if (!data) return;

        const wb = utils.book_new();

        // Sheet 1: Production Highlights
        const prodData = [
            { Metric: 'Highest Shift Production', Value: data.production?.shift?.MaxQty, Entity: data.production?.shift?.CrusherName, Shift: data.production?.shift?.ShiftName },
            { Metric: 'Highest Day Production', Value: data.production?.day?.MaxQty, Entity: data.production?.day?.CrusherName, Shift: '-' },
            { Metric: 'Highest Month Production', Value: data.production?.month?.MaxQty, Entity: data.production?.month?.CrusherName, Shift: '-' },
        ];
        const wsProd = utils.json_to_sheet(prodData);
        utils.book_append_sheet(wb, wsProd, 'Highlights');

        // Sheet 2: Crusher Details
        if (data.production?.list) {
            const wsList = utils.json_to_sheet(data.production.list);
            utils.book_append_sheet(wb, wsList, 'Crusher Performance');
        }

        // Sheet 3: Stoppages
        if (data.stoppages?.length > 0) {
            const wsStop = utils.json_to_sheet(data.stoppages);
            utils.book_append_sheet(wb, wsStop, 'Stoppage Summary');
        }

        writeFile(wb, `Crushing_Report_${date}.xlsx`);
        toast.success('Excel Downloaded');
    };

    if (loading && !data) return <div className="p-8 text-white">Loading Dashboard...</div>;


    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1>Crushing Dashboard</h1>
                <div className={styles.controls}>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={styles.dateInput}
                    />
                    <button onClick={fetchData} className={`${styles.iconButton} ${styles.btnBlue}`}>
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={handleDownloadExcel} className={`${styles.iconButton} ${styles.btnGreen}`}>
                        <Download size={18} /> Excel
                    </button>
                </div>
            </div>


            <div style={{ padding: '1rem' }}>

                {/* Section 1: Production Overview */}
                <section>
                    <h2 className={styles.sectionTitle}>1. Production Overview</h2>

                    {/* Row 1: KPI Cards */}
                    <div className={styles.gridThree} style={{ marginBottom: '1.5rem' }}>
                        <div className={`${styles.kpiCard} ${styles.cardPink}`}>
                            <h3 className={styles.kpiLabel}>Highest Production (Shift)</h3>
                            <div className={styles.kpiValue}>{data?.production?.shift?.MaxQty || 0} MT</div>
                            <div className={styles.kpiSubtext}>
                                {data?.production?.shift?.CrusherName || 'N/A'} ({data?.production?.shift?.ShiftName})
                            </div>
                        </div>
                        <div className={`${styles.kpiCard} ${styles.cardIndigo}`}>
                            <h3 className={styles.kpiLabel}>Highest Production (Day)</h3>
                            <div className={styles.kpiValue}>{data?.production?.day?.MaxQty || 0} MT</div>
                            <div className={styles.kpiSubtext}>
                                {data?.production?.day?.CrusherName || 'N/A'}
                            </div>
                        </div>
                        <div className={`${styles.kpiCard} ${styles.cardTeal}`}>
                            <h3 className={styles.kpiLabel}>Highest Production (Month)</h3>
                            <div className={styles.kpiValue}>{data?.production?.month?.MaxQty || 0} MT</div>
                            <div className={styles.kpiSubtext}>
                                {data?.production?.month?.CrusherName || 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Detailed List */}
                    <div className={styles.chartContainer} style={{ height: 'auto', minHeight: 'auto' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Crusher-wise Performance</h3>
                        <table className={styles.detailTable}>
                            <thead>
                                <tr>
                                    <th>Crusher Name</th>
                                    <th style={{ textAlign: 'right' }}>Shift (MT)</th>
                                    <th style={{ textAlign: 'right' }}>Day (MT)</th>
                                    <th style={{ textAlign: 'right' }}>Ach %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.production?.list?.map((row, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 500 }}>{row.CrusherName} {row.Remarks && <span style={{ color: 'red', fontSize: '0.7em' }}>({row.Remarks})</span>}</td>
                                        <td style={{ textAlign: 'right' }}>{row.ShiftQty}</td>
                                        <td style={{ textAlign: 'right' }}>{row.DayQty}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                background: row.Achievement >= 90 ? '#dcfce7' : row.Achievement >= 60 ? '#fef9c3' : '#fee2e2',
                                                color: row.Achievement >= 90 ? '#166534' : row.Achievement >= 60 ? '#854d0e' : '#991b1b',
                                                fontWeight: 700
                                            }}>
                                                {row.Achievement}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Section 2: Stoppage Analysis */}
                <section style={{ marginTop: '2rem' }}>
                    <h2 className={styles.sectionTitle}>2. Stoppage Analysis</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 35%) 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* Summary Chart */}
                        <div className={styles.chartContainer}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Stoppage Reasons (Hrs)</h3>
                            {data?.stoppages && <StoppagePareto data={data.stoppages} />}
                        </div>

                        {/* Detailed Log Table */}
                        <div className={styles.chartContainer} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Top Stoppages Log</h3>
                            <table className={styles.detailTable}>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Crusher</th>
                                        <th>Reason</th>
                                        <th>Remarks</th>
                                        <th style={{ textAlign: 'right' }}>Dur</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.stoppageLog?.map((row, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.85em', color: 'var(--muted-foreground)' }}>{row.Time}</td>
                                            <td style={{ fontWeight: 500 }}>{row.Crusher}</td>
                                            <td>
                                                <span style={{
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75em',
                                                    background: '#fee2e2',
                                                    color: '#991b1b',
                                                    fontWeight: 600
                                                }}>
                                                    {row.Reason}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85em', color: 'var(--muted-foreground)' }}>{row.Remarks}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.Duration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
