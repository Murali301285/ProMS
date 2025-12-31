'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import RecoveryChart from './Charts/RecoveryChart';
import SMEChart from './Charts/SMEChart';
import ExplosiveDonut from './Charts/ExplosiveDonut';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import styles from '../../app/dashboard/page.module.css'; // Reusing dashboard styles

export default function DrillingBlasting() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const contentRef = useRef(null);


    // REDESIGN: Enhanced Dummy Data with More Details
    const DUMMY_DATA = {
        drilling: {
            shift: { MaxMeters: 145, EquipmentName: 'Drill-RX', ShiftName: 'Shift A' },
            day: { MaxMeters: 410, EquipmentName: 'Drill-Y' },
            month: { MaxMeters: 5200, EquipmentName: 'Drill-Z' },
            recovery: [
                { Category: 'Coal', TotalMeters: 2100 },
                { Category: 'OB', TotalMeters: 4500 }
            ],
            // NEW: Detailed Drill List
            performance: [
                { EquipmentName: 'Drill-01', ShiftMeters: 45, DayMeters: 120, Target: 150, Achievement: 80 },
                { EquipmentName: 'Drill-02', ShiftMeters: 55, DayMeters: 135, Target: 150, Achievement: 90 },
                { EquipmentName: 'Drill-03', ShiftMeters: 20, DayMeters: 60, Target: 150, Achievement: 40 },
                { EquipmentName: 'Drill-04', ShiftMeters: 65, DayMeters: 155, Target: 160, Achievement: 97 },
                { EquipmentName: 'Drill-05', ShiftMeters: 0, DayMeters: 0, Target: 150, Achievement: 0, Remarks: 'Breakdown' },
            ]
        },
        blasting: {
            supplier: [
                { SupplierName: 'Solar', MaterialType: 'Coal', TotalExplosive: 5000, PowderFactor: 0.45 },
                { SupplierName: 'Solar', MaterialType: 'OB', TotalExplosive: 12000, PowderFactor: 0.65 },
                { SupplierName: 'IDL', MaterialType: 'Coal', TotalExplosive: 3000, PowderFactor: 0.42 },
                { SupplierName: 'IDL', MaterialType: 'OB', TotalExplosive: 7000, PowderFactor: 0.60 }
            ],
            explosive: { TotalSME: 15000, TotalLDE: 5000, TotalANFO: 3000, GrandTotal: 23000 },
            // NEW: Blasting Details Table
            details: [
                { Location: 'Pit-1', Pattern: 'P-101', Holes: 45, Explosive: 4500, Type: 'SME', Supplier: 'Solar' },
                { Location: 'Pit-2', Pattern: 'P-102', Holes: 32, Explosive: 3200, Type: 'SME', Supplier: 'IDL' },
                { Location: 'Pit-3', Pattern: 'P-103', Holes: 20, Explosive: 1500, Type: 'LDE', Supplier: 'Solar' },
                { Location: 'Pit-1', Pattern: 'P-104', Holes: 50, Explosive: 5000, Type: 'SME', Supplier: 'Solar' },
            ]
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Simulate Network Delay
            await new Promise(resolve => setTimeout(resolve, 800));
            // const res = await fetch(`/api/dashboard/drilling?date=${date}`);
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

    const handleDownloadPDF = async () => {
        if (!contentRef.current) return;

        try {
            toast.info('Generating PDF...');
            const canvas = await html2canvas(contentRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Drilling_Blasting_Report_${date}.pdf`);
            toast.success('PDF Downloaded');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate PDF');
        }
    };

    if (loading && !data) return <div className="p-8 text-white">Loading Dashboard...</div>;


    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1>Drilling & Blasting Dashboard</h1>
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
                    <button onClick={handleDownloadPDF} className={`${styles.iconButton} ${styles.btnGreen}`}>
                        <Download size={18} /> PDF
                    </button>
                </div>
            </div>


            <div ref={contentRef} style={{ padding: '1rem' }}>

                {/* Section 1: Drilling */}
                <section>
                    <h2 className={styles.sectionTitle}>1. Drilling Performance Overview</h2>

                    {/* KPI Cards */}
                    <div className={styles.gridThree}>
                        <div className={`${styles.kpiCard} ${styles.cardGreen}`}>
                            <h3 className={styles.kpiLabel}>Highest Drill (Shift)</h3>
                            <div className={styles.kpiValue}>{data?.drilling?.shift?.MaxMeters || 0} m</div>
                            <div className={styles.kpiSubtext}>
                                {data?.drilling?.shift?.EquipmentName || 'N/A'} ({data?.drilling?.shift?.ShiftName})
                            </div>
                        </div>
                        <div className={`${styles.kpiCard} ${styles.cardBlue}`}>
                            <h3 className={styles.kpiLabel}>Highest Drill (Day)</h3>
                            <div className={styles.kpiValue}>{data?.drilling?.day?.MaxMeters || 0} m</div>
                            <div className={styles.kpiSubtext}>
                                {data?.drilling?.day?.EquipmentName || 'N/A'}
                            </div>
                        </div>
                        <div className={`${styles.kpiCard} ${styles.cardPurple}`}>
                            <h3 className={styles.kpiLabel}>Highest Drill (Month)</h3>
                            <div className={styles.kpiValue}>{data?.drilling?.month?.MaxMeters || 0} m</div>
                            <div className={styles.kpiSubtext}>
                                {data?.drilling?.month?.EquipmentName || 'N/A'}
                            </div>
                        </div>
                    </div>


                    {/* Redesign: Chart Left, Detailed Table Right */}
                    <div className={styles.gridTwo} style={{ alignItems: 'start' }}>

                        {/* LEFT: Recovery Chart */}
                        <div className={styles.chartContainer}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Production Recovery</h3>
                            {data?.drilling?.recovery && <RecoveryChart data={data.drilling.recovery} />}
                        </div>

                        {/* RIGHT: Detailed Machine Performance */}
                        <div className={styles.chartContainer} style={{ height: 'auto', minHeight: '400px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Drill-wise Performance (Today)</h3>

                            <table className={styles.detailTable}>
                                <thead>
                                    <tr>
                                        <th>Drill No.</th>
                                        <th style={{ textAlign: 'right' }}>Shift (m)</th>
                                        <th style={{ textAlign: 'right' }}>Day (m)</th>
                                        <th style={{ textAlign: 'right' }}>Ach %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.drilling?.performance?.map((row, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 500 }}>{row.EquipmentName} {row.Remarks && <span style={{ color: 'red', fontSize: '0.7em' }}>({row.Remarks})</span>}</td>
                                            <td style={{ textAlign: 'right' }}>{row.ShiftMeters}</td>
                                            <td style={{ textAlign: 'right' }}>{row.DayMeters}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    background: row.Achievement >= 90 ? '#dcfce7' : row.Achievement >= 50 ? '#fef9c3' : '#fee2e2',
                                                    color: row.Achievement >= 90 ? '#166534' : row.Achievement >= 50 ? '#854d0e' : '#991b1b',
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
                    </div>
                </section>

                {/* Section 2: Blasting */}
                <section style={{ marginTop: '2rem' }}>
                    <h2 className={styles.sectionTitle}>2. Blasting Performance Overview</h2>

                    <div className={styles.gridTwo}>
                        {/* SME Supplier Chart */}
                        <div className={styles.chartContainer}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Supplier Analysis</h3>
                            {data?.blasting?.supplier && <SMEChart data={data.blasting.supplier} />}
                        </div>

                        {/* Explosive Donut */}
                        <div className={styles.chartContainer}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Explosive Type Distribution</h3>
                            <div style={{ width: '60%', margin: '0 auto' }}>
                                {data?.blasting?.explosive && <ExplosiveDonut data={data.blasting.explosive} />}
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Detailed Blasting Log */}
                    <div className={styles.chartContainer} style={{ height: 'auto', marginTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Blasting Patterns Executed</h3>
                        <table className={styles.detailTable}>
                            <thead>
                                <tr>
                                    <th>Location</th>
                                    <th>Pattern ID</th>
                                    <th style={{ textAlign: 'right' }}>Holes</th>
                                    <th style={{ textAlign: 'right' }}>Explosive (Kg)</th>
                                    <th>Type</th>
                                    <th>Supplier</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.blasting?.details?.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.Location}</td>
                                        <td style={{ fontFamily: 'monospace' }}>{row.Pattern}</td>
                                        <td style={{ textAlign: 'right' }}>{row.Holes}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.Explosive.toLocaleString()}</td>
                                        <td>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.7em',
                                                border: '1px solid var(--border)',
                                                background: 'var(--secondary)',
                                                color: 'var(--secondary-foreground)'
                                            }}>
                                                {row.Type}
                                            </span>
                                        </td>
                                        <td>{row.Supplier}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </section>

                <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '2rem', paddingBottom: '1rem' }}>
                    Generated on {new Date().toLocaleString()} | ProMS Dashboard
                </div>
            </div>
        </div>
    );
}
