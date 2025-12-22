import React from 'react';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import styles from '@/app/dashboard/reports/crusher-summary/CrusherSummary.module.css';

export default function MISDrillingTable({ data, date }) {
    if (!data || (!data.coal.length && !data.ob.length)) return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No Data Found
        </div>
    );

    const { coal, ob } = data;

    // Formatters
    const fmtMeters = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
    const fmtDepth = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    const fmtHoles = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';
    const fmtDecimal = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '';

    // Calculate Totals
    const calcTotals = (rows) => {
        return rows.reduce((acc, row) => {
            acc.NoofHoles += row.NoofHoles || 0;
            acc.TotalMeters += row.TotalMeters || 0;
            return acc;
        }, { NoofHoles: 0, TotalMeters: 0 });
    };

    const coalTotals = calcTotals(coal);
    const obTotals = calcTotals(ob);
    const grandTotals = {
        NoofHoles: coalTotals.NoofHoles + obTotals.NoofHoles,
        TotalMeters: coalTotals.TotalMeters + obTotals.TotalMeters
    };

    const handlePrint = () => window.print();

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Title
        wsData.push(["MIS Drilling"]);
        const displayDate = new Date(date).toLocaleDateString('en-GB');
        wsData.push(["Drilling Date", displayDate]);
        wsData.push([]);

        // Helpers
        const headers = ["Material", "Drilling Patch Id", "Location", "Agency", "Remark", "No of Holes", "Total Meters", "Spacing (m)", "Burden (m)", "Avg Depth (m)"];
        const pushRow = (row, materialName = '') => {
            wsData.push([
                materialName || row.Material,
                row.DrillingPatchId,
                row.Location,
                row.Agency,
                row.Remarks,
                row.NoofHoles,
                row.TotalMeters,
                row.Spacing,
                row.Burden,
                row.AverageDepth
            ]);
        };

        wsData.push(headers);

        // COAL
        coal.forEach((row, i) => pushRow(row, i === 0 ? 'Coal' : ''));
        // Coal Total
        wsData.push(["Coal Total", "", "", "", "", coalTotals.NoofHoles, coalTotals.TotalMeters, "", "", ""]);

        // OB
        ob.forEach((row, i) => pushRow(row, i === 0 ? 'OB' : ''));
        // OB Total
        wsData.push(["OB Total", "", "", "", "", obTotals.NoofHoles, obTotals.TotalMeters, "", "", ""]);

        // Grand Total
        wsData.push(["Grand Total", "", "", "", "", grandTotals.NoofHoles, grandTotals.TotalMeters, "", "", ""]);


        const ws = XLSX.utils.aoa_to_sheet(wsData);
        // Styling logic could go here (borders, bold, colors) - Skipped for brevity but accessible via sheet objects

        // Adjust column widths
        ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];

        XLSX.utils.book_append_sheet(wb, ws, "MIS Drilling");
        XLSX.writeFile(wb, `ProMS_MIS_Drilling_${date}.xlsx`);
    };

    const renderRow = (row, i, isFirst) => (
        <tr key={i}>
            <td className={styles.tdLeft} style={{ borderBottom: '1px solid #ccc' }}>{isFirst ? row.Material : ''}</td>
            <td className={styles.tdLeft}>{row.DrillingPatchId}</td>
            <td className={styles.tdLeft}>{row.Location}</td>
            <td className={styles.tdLeft}>{row.Agency}</td>
            <td className={styles.tdLeft}>{row.Remarks}</td>
            <td className={`${styles.tdRight} ${styles.tdBold}`}>{fmtHoles(row.NoofHoles)}</td>
            <td className={`${styles.tdRight} ${styles.tdBold}`}>{fmtMeters(row.TotalMeters)}</td>
            <td className={styles.tdRight}>{fmtDecimal(row.Spacing)}</td>
            <td className={styles.tdRight}>{fmtDecimal(row.Burden)}</td>
            <td className={styles.tdRight}>{fmtDepth(row.AverageDepth)}</td>
        </tr>
    );

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

            <div id="report-content" className={styles.tableContainer}>
                <div className={styles.reportTitle}>
                    <h2 className={styles.reportName} style={{ color: '#003366', textDecoration: 'underline' }}>MIS Drilling</h2>
                    <div className={styles.dateBox} style={{ marginLeft: 'auto', display: 'flex', gap: '10px', border: '1px solid #333', padding: '5px' }}>
                        <div style={{ fontWeight: 'bold' }}>Drilling Date</div>
                        <div>{new Date(date).toLocaleDateString('en-GB')}</div>
                    </div>
                </div>

                <table className={styles.table} style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr>
                            <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Material</th>
                            <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Drilling Patch Id</th>
                            <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Location</th>
                            <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Agency</th>
                            <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Remark</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#a5b4fc', color: '#fff' }}>No of Holes</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#a5b4fc', color: '#fff' }}>Total Meters</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#a5b4fc', color: '#fff' }}>Spacing (m)</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#a5b4fc', color: '#fff' }}>Burden (m)</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#a5b4fc', color: '#fff' }}>Avg Depth (m)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Coal */}
                        {coal.map((row, i) => renderRow(row, i, i === 0))}
                        <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
                            <td colSpan={5} style={{ textAlign: 'left', paddingLeft: '10px' }}>Coal Total</td>
                            <td className={styles.tdRight}>{fmtHoles(coalTotals.NoofHoles)}</td>
                            <td className={styles.tdRight}>{fmtMeters(coalTotals.TotalMeters)}</td>
                            <td colSpan={3}></td>
                        </tr>

                        {/* OB */}
                        {ob.map((row, i) => renderRow(row, i, i === 0))}
                        <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
                            <td colSpan={5} style={{ textAlign: 'left', paddingLeft: '10px' }}>OB Total</td>
                            <td className={styles.tdRight}>{fmtHoles(obTotals.NoofHoles)}</td>
                            <td className={styles.tdRight}>{fmtMeters(obTotals.TotalMeters)}</td>
                            <td colSpan={3}></td>
                        </tr>

                        {/* Grand Total */}
                        <tr style={{ backgroundColor: '#d1d5db', fontWeight: 'bold', borderTop: '2px solid black' }}>
                            <td colSpan={5} style={{ textAlign: 'left', paddingLeft: '10px' }}>Grand Total</td>
                            <td className={styles.tdRight}>{fmtHoles(grandTotals.NoofHoles)}</td>
                            <td className={styles.tdRight}>{fmtMeters(grandTotals.TotalMeters)}</td>
                            <td colSpan={3}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
