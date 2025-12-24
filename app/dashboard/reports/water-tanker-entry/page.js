
'use client';

import { useState, useEffect } from 'react';
import LoadingOverlay from '@/components/LoadingOverlay';
import { RotateCcw, Printer, Download } from 'lucide-react'; // Added icons
import { toast } from 'sonner';
import * as XLSX from 'xlsx-js-style';
import styles from '@/app/dashboard/reports/crusher-summary/CrusherSummary.module.css';

export default function WaterTankerReport() {
    const today = new Date().toISOString().split('T')[0];
    const [filter, setFilter] = useState({
        date: today,
        shiftId: ''
    });
    const [data, setData] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    // Load Shifts on Mount
    useEffect(() => {
        fetch('/api/master/shift')
            .then(r => r.json())
            .then(res => {
                if (Array.isArray(res)) setShifts(res);
                else if (res.success && res.data) setShifts(res.data);
            })
            .catch(err => console.error("Failed to load shifts", err));
    }, []);

    const fetchData = async () => {
        if (!filter.date) return toast.error('Please select a date');

        setLoading(true);
        try {
            const res = await fetch('/api/reports/water-tanker-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: filter.date, shiftId: filter.shiftId })
            });
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                if (!generated) setGenerated(true);
            } else {
                toast.error(result.message || 'Failed to fetch report');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching report');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFilter({ date: today, shiftId: '' });
        setData([]);
        setGenerated(false);
    };

    // Calculations
    const totalTrips = data.reduce((acc, row) => acc + (row.Trip || 0), 0);
    const totalQty = data.reduce((acc, row) => acc + (row.Qty || 0), 0);

    // Formatters
    const fmt0 = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';
    const fmt3 = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '0.000';

    // Print
    const handlePrint = () => window.print();

    // Excel Export
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Title Section
        wsData.push(["WATER TANKER PERFORMANCE REPORT"]);
        wsData.push([]);

        const shiftName = filter.shiftId ? shifts.find(s => s.SlNo == filter.shiftId)?.ShiftName : "All Shifts";
        wsData.push(["Date:", new Date(filter.date).toLocaleDateString('en-GB'), "Shift:", shiftName]);
        wsData.push([]);

        // Headers
        const headers = ["S.N.", "Water Tanker Equipment", "Trip", "Tanker Capacity (Cub mtr)", "Qty.", "Filling Point", "Filling Pump", "Destination", "Remarks"];
        wsData.push(headers);

        // Body
        data.forEach((row) => {
            wsData.push([
                row.SlNo,
                row.WaterTankerEquipment,
                row.Trip,
                row.TankerCapacity,
                row.Qty,
                row.FillingPoint,
                row.FillingPump,
                row.Destination,
                row.Remarks
            ]);
        });

        // Totals
        wsData.push(["Total", "", totalTrips, "", totalQty, "", "", "", ""]);

        // Create Sheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Column Widths
        ws['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];

        // Header Style (Simple Bold)
        // Note: xlsx-js-style allows styling but keeping it simple for now to match basic requirement.

        XLSX.utils.book_append_sheet(wb, ws, "Water Tanker Report");
        XLSX.writeFile(wb, `Water_Tanker_Report_${filter.date}.xlsx`);
    };

    const getShiftLabel = () => {
        if (!filter.shiftId) return "All Shifts";
        const s = shifts.find(x => x.SlNo == filter.shiftId);
        return s ? s.ShiftName : filter.shiftId;
    }

    return (
        <div className={styles.container}>
            {loading && <LoadingOverlay message="Generating Report..." />}

            {/* Controls Bar */}
            <div className={styles.controlsContainer}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={filter.date}
                        onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Shift</label>
                    <select
                        className={styles.input}
                        value={filter.shiftId}
                        onChange={(e) => setFilter({ ...filter, shiftId: e.target.value })}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="">All Shifts</option>
                        {shifts.map(s => (
                            <option key={s.SlNo} value={s.SlNo}>{s.ShiftName}</option>
                        ))}
                    </select>
                </div>

                <button onClick={fetchData} className={styles.showBtn}>Show</button>
                <button onClick={handleReset} className={styles.showBtn} style={{ backgroundColor: '#64748b' }}>
                    <RotateCcw size={16} />
                </button>
            </div>

            {/* Only show report content if generated or data exists */}
            {(generated || data.length > 0) && (
                <div className={styles.tableContainer}>
                    <div className={styles.toolbar}>
                        <button onClick={handlePrint} className={styles.printBtn}>
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={handleExportExcel} className={styles.excelBtn}>
                            <Download size={16} /> Excel Download
                        </button>
                    </div>

                    <div id="report-content">
                        {/* Report Header Block */}
                        <div className={styles.reportTitle}>
                            <h2 className={styles.reportName} style={{ color: '#003366', textDecoration: 'underline' }}>
                                WATER TANKER PERFORMANCE REPORT
                            </h2>
                            <div className={styles.dateBox} style={{ marginLeft: 'auto', display: 'flex', gap: '0', border: '1px solid #333' }}>
                                <div className={styles.dateLabel}>Date</div>
                                <div className={styles.dateValue}>{new Date(filter.date).toLocaleDateString('en-GB')}</div>
                                <div className={styles.dateLabel} style={{ borderLeft: '1px solid #333' }}>Shift</div>
                                <div className={styles.dateValue}>{getShiftLabel()}</div>
                            </div>
                        </div>

                        {/* Table */}
                        <table className={styles.table} style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>S.N.</th>
                                    <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Water Tanker Equipment</th>
                                    <th className={styles.thBlue} style={{ backgroundColor: '#64748b', color: '#fff' }}>Trip</th>
                                    <th className={styles.thBlue} style={{ backgroundColor: '#64748b', color: '#fff' }}>Tanker Capacity (Cub mtr)</th>
                                    <th className={styles.thBlue} style={{ backgroundColor: '#64748b', color: '#fff' }}>Qty.</th>
                                    <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Filling Point</th>
                                    <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Filling Pump</th>
                                    <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Destination</th>
                                    <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, i) => (
                                    <tr key={i}>
                                        <td className={styles.tdLeft}>{row.SlNo}</td>
                                        <td className={styles.tdLeft}>{row.WaterTankerEquipment}</td>
                                        <td className={styles.tdRight}>{fmt0(row.Trip)}</td>
                                        <td className={styles.tdRight}>{fmt0(row.TankerCapacity)}</td>
                                        <td className={styles.tdRight}>{fmt3(row.Qty)}</td>
                                        <td className={styles.tdLeft}>{row.FillingPoint}</td>
                                        <td className={styles.tdLeft}>{row.FillingPump}</td>
                                        <td className={styles.tdLeft}>{row.Destination}</td>
                                        <td className={styles.tdLeft}>{row.Remarks}</td>
                                    </tr>
                                ))}

                                {/* Total Row */}
                                <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
                                    <td colSpan={2} style={{ textAlign: 'center' }}>Total</td>
                                    <td className={styles.tdRight}>{fmt0(totalTrips)}</td>
                                    <td></td>
                                    <td className={styles.tdRight}>{fmt3(totalQty)}</td>
                                    <td colSpan={4}></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {generated && data.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No Data Found
                </div>
            )}
        </div>
    );
}
