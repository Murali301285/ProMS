import React from 'react';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import styles from './CrDailyShift.module.css';

export default function CrDailyShiftTable({ shifts, date }) {
    if (!shifts || shifts.length === 0) return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No Data Found
        </div>
    );

    // Formatters
    const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0.00';
    const fmtDec0 = (val) => val != null ? Number(val).toFixed(0) : '0';
    const fmtQty = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '0.000';

    const handlePrint = () => window.print();

    // Excel Export
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Report Title
        wsData.push(["TSMPL PBCMP Operations"]);
        wsData.push(["Crusher Daily Shift Report"]);
        wsData.push(["Date:", new Date(date).toLocaleDateString('en-GB')]);
        wsData.push([]);

        shifts.forEach(shift => {
            // Shift Header
            const plants = shift.plants;

            // Header Row 1: Date | Shift | Shift Incharge
            wsData.push([
                `Date: ${new Date(date).toLocaleDateString('en-GB')}`,
                `SHIFT - ${shift.name}`,
                "SHIFT INCHARGE",
                shift.inCharge || ""
            ]);

            // Header Row 2: Report Name | Description | Plants...
            wsData.push([
                "SHIFT COAL CRUSHING REPORT",
                "Description",
                ...plants.map(p => p.name)
            ]);

            let slNo = 1;

            // Helper to add row
            const addRow = (desc, getValue, format = fmtDec2, style = null) => {
                const row = [
                    slNo++,
                    desc,
                    ...plants.map(p => {
                        const val = getValue(p.id);
                        return format(val);
                    })
                ];
                wsData.push(row);
            };

            // 1. Time From / To
            // Logic: Shift A 6-2, Shift B 2-10, Shift C 10-6. General 8:30-5.
            // Simplified static mapping based on name
            let timeFrom = "", timeTo = "";
            const sn = shift.name.toUpperCase();
            if (sn.includes('A')) { timeFrom = '6:00 am'; timeTo = '2:00 pm'; }
            else if (sn.includes('B')) { timeFrom = '2:00 pm'; timeTo = '10:00 pm'; }
            else if (sn.includes('C')) { timeFrom = '10:00 pm'; timeTo = '6:00 am'; }
            else { timeFrom = '8:30 am'; timeTo = '5:00 pm'; }

            wsData.push([slNo++, "Time From", ...plants.map(() => timeFrom)]);
            wsData.push([slNo++, "Time To", ...plants.map(() => timeTo)]);

            // 2. SBS / CBS
            addRow("S.B.S. Reading", (id) => shift.plantMetrics[id]?.SBS_Reading, fmtDec0);
            addRow("C.B.S. Reading", (id) => shift.plantMetrics[id]?.CBS_Reading, fmtDec0);

            // 3. Total Production (Yellow)
            const prodRow = [
                slNo++,
                "Total Production In MT",
                ...plants.map(p => fmtQty(shift.plantMetrics[p.id]?.TotalProductionMT))
            ];
            wsData.push(prodRow); // Need style applied later

            // 4. Trips
            addRow("No of Trip Unloaded", (id) => shift.plantMetrics[id]?.NoofTripUnloaded, fmtDec0);

            // 5. Apron HMR
            addRow("Apron Starting. Hour", (id) => shift.plantMetrics[id]?.ApronStartingHour, fmtDec2);
            addRow("Apron Closing Hour", (id) => shift.plantMetrics[id]?.ApronClosingHour, fmtDec2);

            // 6. Running Hour (Blue)
            const runRow = [
                slNo++,
                "Total Running Hour",
                ...plants.map(p => fmtDec2(shift.plantMetrics[p.id]?.RunningHr))
            ];
            wsData.push(runRow);

            // 7. TPH
            addRow("TPH", (id) => {
                const m = shift.plantMetrics[id];
                if (m && m.RunningHr > 0) return m.TotalProductionMT / m.RunningHr;
                return 0;
            }, fmtDec2);

            // 8. Stoppages
            shift.stoppages.forEach(reason => {
                const row = [
                    slNo++,
                    reason,
                    ...plants.map(p => fmtDec2(shift.stoppageValues[reason]?.[p.id] || 0))
                ];
                wsData.push(row);
            });

            // 9. Total Stoppage (Yellow)
            const totalStopRow = [
                slNo++,
                "Total stoppage Hour",
                ...plants.map(p => {
                    // Sum stoppages for this plant
                    return fmtDec2(shift.stoppages.reduce((sum, r) => sum + (shift.stoppageValues[r]?.[p.id] || 0), 0));
                })
            ];
            wsData.push(totalStopRow);

            // 10. Total Shift Hour
            wsData.push([slNo++, "Total Shift Hour", ...plants.map(() => "8.00")]);

            // 11. Total Production Footer Row (Shift Total)
            // User image has "Total Production" merging columns? 
            // "Total Production" | 11,681 (at the end)
            // Let's create a row "Total Production" and sum all productions
            const shiftTotalProd = plants.reduce((sum, p) => sum + (shift.plantMetrics[p.id]?.TotalProductionMT || 0), 0);
            wsData.push(["Total Production", "", ...plants.map(() => ""), fmtQty(shiftTotalProd)]);

            // 12. Remarks
            const remarksRow = ["", "REMARKS:-", ...plants.map(p => shift.remarks[p.id] || "")];
            wsData.push(remarksRow);

            wsData.push([]); // Spacer
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.sheet_add_aoa(ws, [["Downloaded on: " + new Date().toLocaleString('en-IN')]], { origin: -1 });
        XLSX.utils.book_append_sheet(wb, ws, "Daily Shift Report");
        XLSX.writeFile(wb, `ProMS_Cr_Daily_Shift_${date}.xlsx`);
    };

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <button onClick={handlePrint} className={styles.printBtn}>
                    <Printer size={16} /> Print
                </button>
                <button onClick={handleExportExcel} className={styles.excelBtn}>
                    <Download size={16} /> Excel Download
                </button>
            </div>

            <div id="report-content">
                <div className={styles.headerRow}>
                    <h2 className={styles.reportName}>Crusher Daily Shift Report</h2>
                    <div>Date: {new Date(date).toLocaleDateString('en-GB')}</div>
                </div>

                {shifts.map((shift, idx) => {
                    const { plants, name: shiftName, inCharge } = shift;

                    // Time Logic
                    let timeFrom = "", timeTo = "";
                    const sn = shiftName.toUpperCase();
                    if (sn.includes('A')) { timeFrom = '6:00 am'; timeTo = '2:00 pm'; }
                    else if (sn.includes('B')) { timeFrom = '2:00 pm'; timeTo = '10:00 pm'; }
                    else if (sn.includes('C')) { timeFrom = '10:00 pm'; timeTo = '6:00 am'; }
                    else { timeFrom = '8:30 am'; timeTo = '5:00 pm'; }

                    const shiftTotalProd = plants.reduce((sum, p) => sum + (shift.plantMetrics[p.id]?.TotalProductionMT || 0), 0);

                    // Calculations
                    const getMetric = (pId, key) => shift.plantMetrics[pId]?.[key] || 0;
                    const getStoppageVal = (reason, pId) => shift.stoppageValues[reason]?.[pId] || 0;
                    const getTotalStop = (pId) => shift.stoppages.reduce((sum, r) => sum + (shift.stoppageValues[r]?.[pId] || 0), 0);
                    const getTPH = (pId) => {
                        const m = shift.plantMetrics[pId];
                        return (m && m.RunningHr > 0) ? m.TotalProductionMT / m.RunningHr : 0;
                    };

                    let rowNum = 1;

                    return (
                        <div key={idx} className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '100px', backgroundColor: 'white' }}>Date:- {new Date(date).toLocaleDateString('en-GB')}</th>
                                        <th style={{ minWidth: '200px', backgroundColor: 'white' }}>SHIFT - {shiftName}</th>
                                        <th style={{ backgroundColor: 'white' }}>SHIFT INCHARGE</th>
                                        <th colSpan={plants.length} style={{ backgroundColor: 'white' }}>{inCharge || '-'}</th>
                                    </tr>
                                    <tr>
                                        <th style={{ backgroundColor: 'white' }}>SHIFT COAL<br />CRUSHING REPORT</th>
                                        <th style={{ backgroundColor: 'white', textAlign: 'center' }}>Description</th>
                                        {plants.map(p => <th key={p.id} style={{ backgroundColor: 'white' }}>{p.name}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* 1. Time */}
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className={styles.tdLeft}>Time From</td>
                                        {plants.map(p => <td key={p.id}>{timeFrom}</td>)}
                                    </tr>
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className={styles.tdLeft}>Time To</td>
                                        {plants.map(p => <td key={p.id}>{timeTo}</td>)}
                                    </tr>

                                    {/* 2. Readings */}
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className={styles.tdLeft}>S.B.S. Reading</td>
                                        {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec0(getMetric(p.id, 'SBS_Reading'))}</td>)}
                                    </tr>
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className={styles.tdLeft}>C.B.S. Reading</td>
                                        {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec0(getMetric(p.id, 'CBS_Reading'))}</td>)}
                                    </tr>

                                    {/* 3. Prod (Yellow) */}
                                    <tr className={styles.rowYellow}>
                                        <td>{rowNum++}</td>
                                        <td className={styles.tdLeft}>Total Production In MT</td>
                                        {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtQty(getMetric(p.id, 'TotalProductionMT'))}</td>)}
                                    </tr>

                                    {/* 4. Trips */}
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className={styles.tdLeft}>No of Trip Unloaded</td>
                                        {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec0(getMetric(p.id, 'NoofTripUnloaded'))}</td>)}
                                    </tr>

                                    {/* 5. Apron HMR */}
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className={styles.tdLeft}>Apron Starting. Hour</td>
                                        {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(getMetric(p.id, 'ApronStartingHour'))}</td>)}
                                    </tr>
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className={styles.tdLeft}>Apron Closing Hour</td>
                                        {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(getMetric(p.id, 'ApronClosingHour'))}</td>)}
                                    </tr>

                                    {/* 6. Running (Blue) */}
                                    <tr className={styles.rowBlue}>
                                        <td>{rowNum++}</td>
                                        <td className={styles.tdLeft}>Total Running Hour</td>
                                        {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(getMetric(p.id, 'RunningHr'))}</td>)}
                                    </tr>

                                    {/* 7. TPH */}
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className={styles.tdLeft}>TPH</td>
                                        {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(getTPH(p.id))}</td>)}
                                    </tr>

                                    {/* 8. Stoppages */}
                                    {shift.stoppages.map(reason => (
                                        <tr key={reason}>
                                            <td>{rowNum++}</td>
                                            <td className={styles.tdLeft}>{reason}</td>
                                            {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(getStoppageVal(reason, p.id))}</td>)}
                                        </tr>
                                    ))}

                                    {/* 9. Total Stop (Yellow) */}
                                    <tr className={styles.rowYellow}>
                                        <td>{rowNum++}</td>
                                        <td className={styles.tdLeft}>Total stoppage Hour</td>
                                        {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(getTotalStop(p.id))}</td>)}
                                    </tr>

                                    {/* 10. Shift Hour */}
                                    <tr>
                                        <td></td>
                                        <td className={styles.tdLeft}>Total Shift Hour</td>
                                        {plants.map(p => <td key={p.id} className={styles.tdRight}>8.00</td>)}
                                    </tr>

                                    {/* 11. Total Prod Footer */}
                                    <tr className={styles.rowYellow}>
                                        <td colSpan={2} className={`${styles.tdLeft} ${styles.tdBold}`}>Total Production</td>
                                        <td colSpan={plants.length} className={styles.tdRight}>{fmtQty(shiftTotalProd)}</td>
                                    </tr>

                                    {/* 12. Remarks */}
                                    <tr>
                                        <td></td>
                                        <td className={styles.tdLeft}>REMARKS:-</td>
                                        {plants.map(p => (
                                            <td key={p.id} className={styles.tdLeft} style={{ whiteSpace: 'pre-wrap', fontSize: '11px', verticalAlign: 'top' }}>
                                                {shift.remarks[p.id] || ''}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
