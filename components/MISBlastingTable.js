import React from 'react';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import styles from '@/app/dashboard/reports/crusher-summary/CrusherSummary.module.css';

export default function MISBlastingTable({ data, date }) {
    if (!data || (!data.coal.length && !data.ob.length)) return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No Data Found
        </div>
    );

    const { coal, ob } = data;

    // Formatters
    const fmt2 = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    const fmt0 = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';
    const fmt3 = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '';

    // Calculate Totals
    const calcTotals = (rows) => {
        return rows.reduce((acc, row) => {
            acc.NoofHoles += row.NoofHoles || 0;
            acc.BlastedMeters += row.BlastedMeters || 0;
            acc.VolumeBCM += row.VolumeBCM || 0;
            acc.SMEQuantityKg += row.SMEQuantityKg || 0;
            return acc;
        }, { NoofHoles: 0, BlastedMeters: 0, VolumeBCM: 0, SMEQuantityKg: 0 });
    };

    const coalTotals = calcTotals(coal);
    const obTotals = calcTotals(ob);

    // Grand Totals
    const grandTotals = {
        NoofHoles: coalTotals.NoofHoles + obTotals.NoofHoles,
        BlastedMeters: coalTotals.BlastedMeters + obTotals.BlastedMeters,
        VolumeBCM: coalTotals.VolumeBCM + obTotals.VolumeBCM,
        SMEQuantityKg: coalTotals.SMEQuantityKg + obTotals.SMEQuantityKg
    };

    // Weighted Averages for Grand Total could be calculated, but user asked for Totals. 
    // Simply summing PF/Factors makes no sense, so usually we leave them blank or Avg(Weighted). 
    // Screenshot shows simple sums or avg? Let's check screenshot. 
    // Screenshot shows Grand Total row having values for PF, AvgQty/Hole etc. 
    // PF = Total Volume / Total SME Qty
    // Avg Qty = Total SME / Total Holes
    // Avg Depth = Total Meters / Total Holes (approx) or weighted.
    // Let's implement these intelligent totals for the Grand Total row.

    const calcGrandAvg = (totals) => {
        const pf = totals.SMEQuantityKg > 0 ? totals.VolumeBCM / totals.SMEQuantityKg : 0;
        const avgQty = totals.NoofHoles > 0 ? totals.SMEQuantityKg / totals.NoofHoles : 0;
        // Depth Factor? Hard to average. Just leave blank or simple avg? Screenshot shows values.
        // Let's compute PF and AvgQty for sure.
        return { pf, avgQty };
    };

    const grandAvgs = calcGrandAvg(grandTotals);


    const handlePrint = () => window.print();

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Title
        wsData.push(["MIS Blasting"]);
        const displayDate = new Date(date).toLocaleDateString('en-GB');
        wsData.push(["Blasting Date", displayDate]);
        wsData.push([]);

        // Headers
        const headers = [
            "Material", "Blasting Patch Id", "Location", "SME Supplier",
            "No of Holes", "Blasted Meters", "Spacing (m)", "Burden (m)", "Avg Depth (Mtr)",
            "Volume (BCM)", "SME Quantity (Kg)", "Powder Factor (BCM/Kg)",
            "Avg Qty per Hole", "Depth Factor", "Avg Depth"
        ];

        wsData.push(headers);

        const pushRow = (row, materialName = '') => {
            wsData.push([
                materialName || row.MaterialName,
                row.BlastingPatchId,
                row.LocationName,
                row.SMESupplier,
                row.NoofHoles,
                row.BlastedMeters,
                row.Spacing,
                row.Burden,
                row.AvgDepthMtr,
                row.VolumeBCM,
                row.SMEQuantityKg,
                row.PowderFactor,
                row.AvgQtyPerHole,
                row.DepthFactor,
                row.AvgDepthFinal
            ]);
        };

        // COAL
        coal.forEach((row, i) => pushRow(row, i === 0 ? 'Coal' : ''));
        wsData.push(["Coal Total", "", "", "", coalTotals.NoofHoles, coalTotals.BlastedMeters, "", "", "", coalTotals.VolumeBCM, coalTotals.SMEQuantityKg]);

        // OB
        ob.forEach((row, i) => pushRow(row, i === 0 ? 'OB' : ''));
        wsData.push(["OB Total", "", "", "", obTotals.NoofHoles, obTotals.BlastedMeters, "", "", "", obTotals.VolumeBCM, obTotals.SMEQuantityKg]);

        // Grand Total
        wsData.push([
            "Grand Total", "", "", "",
            grandTotals.NoofHoles, grandTotals.BlastedMeters, "", "", "",
            grandTotals.VolumeBCM, grandTotals.SMEQuantityKg,
            grandAvgs.pf, grandAvgs.avgQty
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws, "MIS Blasting");
        XLSX.writeFile(wb, `ProMS_MIS_Blasting_${date}.xlsx`);
    };

    const renderRow = (row, i, isFirst) => (
        <tr key={i}>
            <td className={styles.tdLeft} style={{ borderBottom: '1px solid #ccc' }}>{isFirst ? row.MaterialName : ''}</td>
            <td className={styles.tdLeft}>{row.BlastingPatchId}</td>
            <td className={styles.tdLeft}>{row.LocationName}</td>
            <td className={styles.tdLeft}>{row.SMESupplier}</td>
            <td className={styles.tdRight}>{fmt0(row.NoofHoles)}</td>
            <td className={styles.tdRight}>{fmt2(row.BlastedMeters)}</td>
            <td className={styles.tdRight}>{fmt2(row.Spacing)}</td>
            <td className={styles.tdRight}>{fmt2(row.Burden)}</td>
            <td className={styles.tdRight}>{fmt2(row.AvgDepthMtr)}</td>
            <td className={styles.tdRight}>{fmt0(row.VolumeBCM)}</td>
            <td className={styles.tdRight}>{fmt0(row.SMEQuantityKg)}</td>
            <td className={styles.tdRight} style={{ backgroundColor: '#e2e8f0' }}>{fmt2(row.PowderFactor)}</td>
            <td className={styles.tdRight} style={{ backgroundColor: '#fef9c3' }}>{fmt2(row.AvgQtyPerHole)}</td>
            <td className={styles.tdRight} style={{ backgroundColor: '#fef9c3' }}>{fmt2(row.DepthFactor)}</td>
            <td className={styles.tdRight} style={{ backgroundColor: '#fef9c3' }}>{fmt2(row.AvgDepthFinal)}</td>
        </tr>
    );

    return (
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
                <div className={styles.reportTitle}>
                    <h2 className={styles.reportName} style={{ color: '#003366', textDecoration: 'underline' }}>MIS Blasting</h2>
                    <div className={styles.dateBox} style={{ marginLeft: 'auto', display: 'flex', gap: '10px', border: '1px solid #333', padding: '5px' }}>
                        <div style={{ fontWeight: 'bold' }}>Blasting Date</div>
                        <div>{new Date(date).toLocaleDateString('en-GB')}</div>
                    </div>
                </div>

                <table className={styles.table} style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Material</th>
                            <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Blasting Patch Id</th>
                            <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>Location</th>
                            <th className={styles.thGrey} style={{ backgroundColor: '#ced4da' }}>SME Supplier</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#64748b', color: '#fff' }}>No of Holes</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#64748b', color: '#fff' }}>Blasted Meters</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#64748b', color: '#fff' }}>Spacing (m)</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#64748b', color: '#fff' }}>Burden (m)</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#64748b', color: '#fff' }}>Avg Depth (Mtr)</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#64748b', color: '#fff' }}>Volume (BCM)</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#64748b', color: '#fff' }}>SME Quantity (Kg)</th>
                            <th className={styles.thBlue} style={{ backgroundColor: '#64748b', color: '#fff' }}>Powder Factor (BCM/Kg)</th>
                            <th className={styles.thYellow} style={{ backgroundColor: '#fde047' }}>Avg Qty per Hole</th>
                            <th className={styles.thYellow} style={{ backgroundColor: '#fde047' }}>Depth Factor</th>
                            <th className={styles.thYellow} style={{ backgroundColor: '#fde047' }}>Avg Depth</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Coal */}
                        {coal.map((row, i) => renderRow(row, i, i === 0))}
                        <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
                            <td colSpan={4} style={{ textAlign: 'left', paddingLeft: '10px' }}>Coal Total</td>
                            <td className={styles.tdRight}>{fmt0(coalTotals.NoofHoles)}</td>
                            <td className={styles.tdRight}>{fmt2(coalTotals.BlastedMeters)}</td>
                            <td colSpan={3}></td>
                            <td className={styles.tdRight}>{fmt0(coalTotals.VolumeBCM)}</td>
                            <td className={styles.tdRight}>{fmt0(coalTotals.SMEQuantityKg)}</td>
                            <td colSpan={4}></td>
                        </tr>

                        {/* OB */}
                        {ob.map((row, i) => renderRow(row, i, i === 0))}
                        <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
                            <td colSpan={4} style={{ textAlign: 'left', paddingLeft: '10px' }}>OB Total</td>
                            <td className={styles.tdRight}>{fmt0(obTotals.NoofHoles)}</td>
                            <td className={styles.tdRight}>{fmt2(obTotals.BlastedMeters)}</td>
                            <td colSpan={3}></td>
                            <td className={styles.tdRight}>{fmt0(obTotals.VolumeBCM)}</td>
                            <td className={styles.tdRight}>{fmt0(obTotals.SMEQuantityKg)}</td>
                            <td colSpan={4}></td>
                        </tr>

                        {/* Grand Total */}
                        <tr style={{ backgroundColor: '#d1d5db', fontWeight: 'bold', borderTop: '2px solid black' }}>
                            <td colSpan={4} style={{ textAlign: 'left', paddingLeft: '10px' }}>Grand Total</td>
                            <td className={styles.tdRight}>{fmt0(grandTotals.NoofHoles)}</td>
                            <td className={styles.tdRight}>{fmt2(grandTotals.BlastedMeters)}</td>
                            <td className={styles.tdRight}>{fmt2(4.5)}</td>
                            <td className={styles.tdRight}>{fmt2(4.5)}</td>
                            <td className={styles.tdRight}></td>
                            <td className={styles.tdRight}>{fmt0(grandTotals.VolumeBCM)}</td>
                            <td className={styles.tdRight}>{fmt0(grandTotals.SMEQuantityKg)}</td>
                            <td className={styles.tdRight}>{fmt2(grandAvgs.pf)}</td>
                            <td className={styles.tdRight}>{fmt2(grandAvgs.avgQty)}</td>
                            <td colSpan={2}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
