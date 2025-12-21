import React from 'react';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import styles from './CrusherSummary.module.css';

export default function CrusherSummaryTable({ data, meta, date }) {
    if (!data || data.length === 0) return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No Data Found
        </div>
    );

    const { shiftNames } = meta;

    // Formatters
    const fmtQty = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '0.000';
    const fmtHr = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
    const fmtInt = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';

    // Totals Calculation
    const totalProdShift = {};
    shiftNames.forEach(s => totalProdShift[s] = 0);

    const totals = data.reduce((acc, row) => {
        acc.RunningHr += row.RunningHr || 0;
        acc.ProdFTD += row.ProductionQty || 0;
        acc.ProdFTM += row.ProdFTM || 0;
        acc.ProdYTD += row.ProdYTD || 0;

        shiftNames.forEach(s => {
            totalProdShift[s] += (row.shifts[s] || 0);
        });

        // Table 2 Totals
        acc.monthlyCumRHR += row.monthlyCumRHR || 0;
        acc.prodFromBSR += row.monthlyCumBSR || 0;

        return acc;
    }, {
        RunningHr: 0, ProdFTD: 0, ProdFTM: 0, ProdYTD: 0,
        monthlyCumRHR: 0, prodFromBSR: 0
    });

    const handlePrint = () => window.print();

    // EXCEL EXPORT
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Header Info
        wsData.push(["TSMPL PBCMP Operations"]);
        wsData.push(["Crusher Production Report"]);
        wsData.push(["Date :", date]);
        wsData.push([]);

        // Table 1 Headers
        const header1 = [
            "Sl.No.", "Details", "Running Hour Actuals for the day",
            ...shiftNames,
            "Cum Production FTD", "Cum TPH FTD", "Cum Production FTM", "Production YTD 25-26"
        ];

        wsData.push(header1);

        // Body Table 1
        data.forEach((row, i) => {
            const cumTphFtd = row.RunningHr > 0 ? (row.ProductionQty / row.RunningHr) : 0;
            const rowData = [
                i + 1,
                row.PlantName,
                Number(row.RunningHr || 0).toFixed(2),
                ...shiftNames.map(s => Number(row.shifts[s] || 0).toFixed(3)),
                Number(row.ProductionQty || 0).toFixed(3),
                Number(cumTphFtd).toFixed(0),
                Number(row.ProdFTM || 0).toFixed(3),
                Number(row.ProdYTD || 0).toFixed(3)
            ];
            wsData.push(rowData);
        });

        // Totals Table 1
        const totalTphFtd = totals.RunningHr > 0 ? (totals.ProdFTD / totals.RunningHr) : 0;
        const totalRow1 = [
            "Total",
            "",
            Number(totals.RunningHr).toFixed(2),
            ...shiftNames.map(s => Number(totalProdShift[s]).toFixed(3)),
            Number(totals.ProdFTD).toFixed(3),
            Number(totalTphFtd).toFixed(0),
            Number(totals.ProdFTM).toFixed(3),
            Number(totals.ProdYTD).toFixed(3),
            ""
        ];
        wsData.push(totalRow1);
        wsData.push([]);

        // Table 2 Headers
        const header2 = [
            "Sl.No.", "Details", "Month Starting HMR", "As on Date Closing HMR", "Monthly cum RHR",
            "Month Starting BSR", "As on Date Closing BSR", "Monthly cum BSR", "AVG TPH FTM", "Budget FTM"
        ];
        wsData.push(header2);

        // Body Table 2
        data.forEach((row, i) => {
            const rowData = [
                i + 1,
                row.PlantName,
                Number(row.HMR?.MonthStartingHMR || 0).toFixed(2),
                Number(row.HMR?.AsonDateClosingHMR || 0).toFixed(2),
                Number(row.monthlyCumRHR || 0).toFixed(2),
                Number(row.HMR?.MonthStartingBSR || 0).toFixed(0),
                Number(row.HMR?.AsonDateClosingBSR || 0).toFixed(0),
                Number(row.monthlyCumBSR || 0).toFixed(3),
                Number(row.avgTphFtm || 0).toFixed(0),
                Number(row.budgetFtm || 0).toFixed(0)
            ];
            wsData.push(rowData);
        });

        // Totals for Table 2
        const totalRow2 = [
            "Total Production", "", "", "", "", "", "",
            Number(totals.prodFromBSR).toFixed(3),
            "", "-"
        ];
        wsData.push(totalRow2);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const downloadTime = new Date().toLocaleString('en-IN');
        XLSX.utils.sheet_add_aoa(ws, [["Downloaded on: " + downloadTime]], { origin: -1 });
        XLSX.utils.book_append_sheet(wb, ws, "Crusher Summary");
        const fname = `ProMS_Crusher_Summary_DatedFrom_${date}_to_${date}.xlsx`;
        XLSX.writeFile(wb, fname);
    };

    return (
        <div className={styles.container}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
                <button onClick={handlePrint} className={styles.printBtn}>
                    <Printer size={16} /> Print
                </button>
                <button onClick={handleExportExcel} className={styles.excelBtn}>
                    <Download size={16} /> Excel Download
                </button>
            </div>

            {/* Report Content - Print Area */}
            <div id="report-content">

                {/* Header Summary Box */}
                <div className={styles.reportTitle}>
                    <h1 className={styles.companyName}>TSMPL PBCMP Operations</h1>
                    <h2 className={styles.reportName}>Crusher Production Report</h2>

                    <div className={styles.dateBox}>
                        <div className={styles.dateRow}>
                            <div className={styles.dateLabel} style={{ textAlign: 'center' }}>Date :</div>
                            <div className={styles.dateValue} style={{ textAlign: 'center' }}>{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                        </div>
                        <div className={styles.dateRow}>
                            <div className={styles.dateLabel} style={{ textAlign: 'center' }}>Day</div>
                            <div className={styles.dateValue} style={{ textAlign: 'center' }}>{new Date(date).getDate()}</div>
                        </div>
                    </div>
                </div>

                {/* Table 1: Production */}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.thPink} style={{ width: '40px' }}>Sl.No.</th>
                                <th className={styles.thPink} style={{ minWidth: '100px' }}>Details</th>
                                <th className={styles.thPink} style={{ width: '80px' }}>Running Hour<br />Actuals for the day</th>
                                {shiftNames.map(s => (
                                    <th key={s} className={styles.thPink} style={{ width: '60px' }}>{s}</th>
                                ))}
                                <th className={styles.thBlue}>Cum Production FTD</th>
                                <th className={styles.thBlue}>Cum TPH FTD</th>
                                <th className={styles.thGreen}>Cum Production FTM</th>
                                <th className={styles.thYellow}>Production YTD 25-26</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => {
                                const cumTphFtd = row.RunningHr > 0 ? (row.ProductionQty / row.RunningHr) : 0;
                                return (
                                    <tr key={i}>
                                        <td className={styles.tdBold}>{i + 1}</td>
                                        <td className={styles.tdBold} style={{ textAlign: 'left' }}>{row.PlantName}</td>
                                        <td className={styles.tdBold} style={{ textAlign: 'right' }}>{fmtHr(row.RunningHr)}</td>

                                        {shiftNames.map(s => (
                                            <td key={s} className={styles.tdRight}>{fmtQty(row.shifts[s])}</td>
                                        ))}

                                        <td className={`${styles.tdBold} ${styles.tdRight}`}>{fmtQty(row.ProductionQty)}</td>
                                        <td className={`${styles.tdBold} ${styles.tdRight}`}>{fmtInt(cumTphFtd)}</td>
                                        <td className={`${styles.tdBold} ${styles.tdRight} ${styles.bgGreen}`}>{fmtQty(row.ProdFTM)}</td>
                                        <td className={`${styles.tdBold} ${styles.tdRight} ${styles.bgOrange}`}>{fmtQty(row.ProdYTD)}</td>
                                    </tr>
                                )
                            })}

                            {/* Total Row */}
                            <tr style={{ backgroundColor: '#ffffff' }}>
                                <td colSpan={2} className={`${styles.tdBold} ${styles.tdRight}`} style={{ paddingRight: '15px' }}>Total Production</td>
                                <td className={`${styles.tdBold} ${styles.tdRight}`}>{fmtHr(totals.RunningHr)}</td>
                                {shiftNames.map(s => (
                                    <td key={s} className={`${styles.tdRight}`}>{fmtQty(totalProdShift[s])}</td>
                                ))}
                                <td className={`${styles.tdRight}`}>{fmtQty(totals.ProdFTD)}</td>
                                <td className={`${styles.tdRight}`}>-</td>
                                <td className={`${styles.tdBold} ${styles.tdRight} ${styles.bgGreen}`}>{fmtQty(totals.ProdFTM)}</td>
                                <td className={`${styles.tdBold} ${styles.tdRight} ${styles.bgOrange}`}>{fmtQty(totals.ProdYTD)}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Table 2: HMR/BSR (Performance) */}
                <div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={`${styles.thGreen}`} style={{ backgroundColor: '#ecfccb', width: '40px' }}>Sl.No.</th>
                                <th className={`${styles.thGreen}`} style={{ backgroundColor: '#ecfccb' }}>Details</th>
                                <th className={`${styles.thPink}`}>Month Starting<br />HMR</th>
                                <th className={`${styles.thPink}`}>As on Date<br />Closing HMR</th>
                                <th className={`${styles.thPink}`}>Monthly cum<br />RHR</th>
                                <th className={`${styles.thPink}`}>Month Starting BSR</th>
                                <th className={`${styles.thPink}`}>As on Date Closing<br />BSR</th>
                                <th className={`${styles.thPink}`}>Monthly cum<br />RHR (BSR)</th>
                                <th className={`${styles.thBlue}`} style={{ backgroundColor: '#e9d5ff' }}>AVG TPH FTM</th>
                                <th className={`${styles.thYellow}`}>Budget FTM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i}>
                                    <td className={styles.tdBold}>{i + 1}</td>
                                    <td className={`${styles.tdBold} ${styles.tdLeft}`}>{row.PlantName}</td>
                                    <td className={styles.tdRight}>{fmtHr(row.HMR?.MonthStartingHMR)}</td>
                                    <td className={styles.tdRight}>{fmtHr(row.HMR?.AsonDateClosingHMR)}</td>
                                    <td className={`${styles.tdBold} ${styles.tdRight}`}>{fmtHr(row.monthlyCumRHR)}</td>

                                    <td className={styles.tdRight}>{row.HMR?.MonthStartingBSR ?? 'N/A'}</td>
                                    <td className={styles.tdRight}>{row.HMR?.AsonDateClosingBSR ?? 'N/A'}</td>
                                    <td className={`${styles.tdBold} ${styles.tdRight} ${styles.bgGreen}`}>{fmtQty(row.monthlyCumBSR)}</td>

                                    <td className={`${styles.tdBold} ${styles.tdRight}`}>{fmtInt(row.avgTphFtm)}</td>
                                    <td className={`${styles.tdBold} ${styles.tdRight} ${styles.bgYellow}`}>{fmtInt(row.budgetFtm)}</td>
                                </tr>
                            ))}

                            <tr className={styles.tdBold} style={{ borderTop: '2px solid black' }}>
                                <td colSpan={2} style={{ textAlign: 'center', fontSize: '14px', padding: '8px' }}>Total Production</td>
                                <td colSpan={5} style={{ border: '1px solid black' }}></td>
                                <td className={`${styles.tdRight} ${styles.bgGreen}`}>{fmtQty(totals.prodFromBSR)}</td>
                                <td style={{ border: '1px solid black' }}></td>
                                <td className={`${styles.tdRight} ${styles.bgYellow}`}>-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
