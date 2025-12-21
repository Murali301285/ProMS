import React from 'react';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import styles from './CrStoppageCumulative.module.css';

export default function CrStoppageCumulativeTable({ data, date }) {
    if (!data || !data.plants || data.plants.length === 0) return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No Data Found
        </div>
    );

    const { plants, metricsMap, stoppageRows, calculatedTotalStop } = data;

    // Formatters
    const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0';
    const fmtDec0 = (val) => val != null ? Number(val).toFixed(0) : '0';

    // Helper to get metric for plant
    const getMetric = (pId, key) => metricsMap[pId]?.[key] || 0;

    // Helper to sum row values
    const getRowSum = (plantFetcher) => {
        return plants.reduce((sum, p) => sum + Number(plantFetcher(p.id)), 0);
    }
    const getStoppageRowSum = (values) => {
        return plants.reduce((sum, p) => sum + Number(values[p.id] || 0), 0);
    }


    const handlePrint = () => window.print();

    // Excel Export
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Header
        const headerRow = ["SHIFT COAL CRUSHING REPORT", new Date(date).toLocaleDateString('en-GB')];
        wsData.push(headerRow);

        // Columns
        const cols = ["Sl.No.", "Description", ...plants.map(p => p.name)];
        wsData.push(cols);

        let slNo = 1;

        // Metric Rows
        const addMetricRow = (label, key, isInt = false) => {
            const row = [
                slNo++,
                label,
                ...plants.map(p => isInt ? fmtDec0(getMetric(p.id, key)) : fmtDec2(getMetric(p.id, key)))
            ];
            wsData.push(row);
        }

        addMetricRow("Apron Starting. Hour", "startingHour", false);
        addMetricRow("Apron Closing Hour", "closingHour", false);

        // Total Running Hour (Blue)
        const totalRunRow = [
            slNo++,
            "Total Running Hour",
            ...plants.map(p => fmtDec2(getMetric(p.id, "runningHr")))
        ];
        wsData.push(totalRunRow);

        // Stoppages
        stoppageRows.forEach(r => {
            const row = [
                slNo++,
                r.reason,
                ...plants.map(p => fmtDec2(r.values[p.id] || 0))
            ];
            wsData.push(row);
        });

        // Total Stoppage (Yellow)
        const totalStopRow = [
            slNo++,
            "Total stoppage Hour",
            ...plants.map(p => fmtDec2(calculatedTotalStop[p.id] || 0))
        ];
        wsData.push(totalStopRow);

        // Total Shift Hour
        const shiftRow = [
            "",
            "Total Shift Hour",
            ...plants.map(p => fmtDec2(getMetric(p.id, "totalShiftHour")))
        ];
        wsData.push(shiftRow);

        // Remarks Row (Per Plant)
        const remarksRow = [
            "",
            "REMARKS:-",
            ...plants.map(p => getMetric(p.id, "remarks") || "")
        ];
        wsData.push(remarksRow);

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Styling (Basic Widths)
        ws['!cols'] = [{ wch: 5 }, { wch: 30 }, ...plants.map(() => ({ wch: 12 }))];

        // Downloaded On
        const downloadTime = new Date().toLocaleString('en-IN');
        XLSX.utils.sheet_add_aoa(ws, [["Downloaded on: " + downloadTime]], { origin: -1 });

        XLSX.utils.book_append_sheet(wb, ws, "Stoppage Cumulative");
        const fname = `ProMS_Crusher_Stoppage_Cum_Dated_${date}.xlsx`;
        XLSX.writeFile(wb, fname);
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
                <div className={styles.headerRow} style={{ position: 'relative' }}>
                    <h2 className={styles.reportName}>Stoppage cumulative report</h2>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>
                        Date: {new Date(date).toLocaleDateString('en-GB')}
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: '100px', backgroundColor: 'white' }}>SHIFT COAL<br />CRUSHING REPORT</th>
                                <th style={{ minWidth: '200px', backgroundColor: 'white', textAlign: 'center' }}>Description</th>
                                {plants.map(p => (
                                    <th key={p.id} style={{ backgroundColor: 'white' }}>{p.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Fixed Metrics */}
                            <tr>
                                <td>1</td>
                                <td className={styles.tdLeft}>Apron Starting. Hour</td>
                                {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(getMetric(p.id, 'startingHour'))}</td>)}
                            </tr>
                            <tr>
                                <td>2</td>
                                <td className={styles.tdLeft}>Apron Closing Hour</td>
                                {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(getMetric(p.id, 'closingHour'))}</td>)}
                            </tr>

                            {/* Total Running (Blue) */}
                            <tr className={styles.rowBlue}>
                                <td>3</td>
                                <td className={styles.tdLeft}>Total Running Hour</td>
                                {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(getMetric(p.id, 'runningHr'))}</td>)}
                            </tr>

                            {/* Dynamic Stoppages */}
                            {stoppageRows.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{4 + idx}</td>
                                    <td className={styles.tdLeft}>{row.reason}</td>
                                    {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(row.values[p.id] || 0)}</td>)}
                                </tr>
                            ))}

                            {/* Total Stoppage (Yellow) */}
                            <tr className={styles.rowYellow}>
                                <td>{4 + stoppageRows.length}</td>
                                <td className={styles.tdLeft}>Total stoppage Hour</td>
                                {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(calculatedTotalStop[p.id])}</td>)}
                            </tr>

                            {/* Total Shift Hour */}
                            <tr>
                                <td></td>
                                <td className={styles.tdLeft}>Total Shift Hour</td>
                                {plants.map(p => <td key={p.id} className={styles.tdRight}>{fmtDec2(getMetric(p.id, 'totalShiftHour'))}</td>)}
                            </tr>

                            {/* Remarks Row (Per Plant) */}
                            <tr>
                                <td></td>
                                <td className={styles.tdLeft}>REMARKS:-</td>
                                {plants.map(p => (
                                    <td key={p.id} className={styles.tdLeft} style={{ whiteSpace: 'pre-wrap', fontSize: '11px', verticalAlign: 'top' }}>
                                        {getMetric(p.id, 'remarks') || ''}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer Remarks Removed */}
            </div>
        </div>
    );
}
