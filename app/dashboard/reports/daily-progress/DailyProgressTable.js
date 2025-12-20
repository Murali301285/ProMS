"use client";
import React, { useRef } from 'react';
import styles from '../tentative-production/TentativeReportTable.module.css';
import controlStyles from './DailyProgressPage.module.css';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx-js-style';

const DailyProgressTable = ({ data, date }) => {
    const tableRef = useRef(null);

    // Parse date if it's in ISO format to be more readable
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    const displayDate = data?.headerInfo?.Date ? formatDate(data.headerInfo.Date) : formatDate(date);

    if (!data) return null;

    const { production, drilling, blasting, crusher } = data;

    // --- Export Logic ---
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Styles
        const headerStyle = { font: { bold: true, sz: 12 }, alignment: { horizontal: "center" }, fill: { fgColor: { rgb: "E0E0E0" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
        const subHeaderStyle = { font: { bold: true }, alignment: { horizontal: "center" }, fill: { fgColor: { rgb: "F0F0F0" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
        const centerStyle = { alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
        const leftStyle = { alignment: { horizontal: "left" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
        const rightStyle = { alignment: { horizontal: "right" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };

        // Title
        wsData.push([{ v: "DAILY PROGRESS REPORT", s: { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } } }]);
        wsData.push([{ v: `Date: ${displayDate}`, s: { alignment: { horizontal: "center" } } }]);
        wsData.push([""]);

        // --- Production Details ---
        wsData.push([{ v: "PRODUCTION DETAILS", s: { font: { bold: true } } }]);
        const prodHeaders = ["Sl No.", "Material", "Unit", "For The Day", "", "For The Month", "", "For The Year", ""];
        const prodSubHeaders = ["", "", "", "Trips", "Qty", "Trips", "Qty", "Trips", "Qty"];

        wsData.push(prodHeaders.map(h => ({ v: h, s: headerStyle })));
        wsData.push(prodSubHeaders.map(h => ({ v: h, s: subHeaderStyle })));

        production.forEach(row => {
            wsData.push([
                { v: row.SlNo, s: centerStyle },
                { v: row.MaterialName, s: leftStyle },
                { v: row.Unit, s: centerStyle },
                { v: row.DayTrip, s: centerStyle },
                { v: row.DayQty, s: rightStyle },
                { v: row.MonthTrip, s: centerStyle },
                { v: row.MonthQty, s: rightStyle },
                { v: row.YearTrip, s: centerStyle },
                { v: row.YearQty, s: rightStyle }
            ]);
        });
        wsData.push([""]);

        // --- Drilling Details ---
        wsData.push([{ v: "DRILLING DETAILS", s: { font: { bold: true } } }]);
        const drillHeaders = ["Sl No.", "Material Type", "No. of Holes Drilled", "", "", "Drilled Meters", "", "", "Total Hrs", "", "", "Meters/Hr", "", ""];
        const drillSubHeaders = ["", "", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD"];

        wsData.push(drillHeaders.map(h => ({ v: h, s: headerStyle })));
        wsData.push(drillSubHeaders.map(h => ({ v: h, s: subHeaderStyle })));

        drilling.forEach(row => {
            wsData.push([
                { v: row.SlNo, s: centerStyle },
                { v: row.MaterialType, s: leftStyle },
                { v: row.Holes_FTD, s: centerStyle },
                { v: row.Holes_MTD, s: centerStyle },
                { v: row.Holes_YTD, s: centerStyle },
                { v: row.Drilling_FTD, s: centerStyle },
                { v: row.Drilling_MTD, s: centerStyle },
                { v: row.Drilling_YTD, s: centerStyle },
                { v: row.Hrs_FTD, s: centerStyle },
                { v: row.Hrs_MTD, s: centerStyle },
                { v: row.Hrs_YTD, s: centerStyle },
                { v: "", s: centerStyle }, { v: "", s: centerStyle }, { v: "", s: centerStyle }
            ]);
        });
        wsData.push([""]);

        // --- Blasting Details ---
        wsData.push([{ v: "BLASTING DETAILS", s: { font: { bold: true } } }]);
        const blastHeaders = ["Sl No.", "No. of Holes", "", "", "Total Explosive Used", "", "", "Blasted Volume", "", "", "Powder Factor", "", ""];
        const blastSubHeaders = ["", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD"];

        wsData.push(blastHeaders.map(h => ({ v: h, s: headerStyle })));
        wsData.push(blastSubHeaders.map(h => ({ v: h, s: subHeaderStyle })));

        blasting.forEach(row => {
            wsData.push([
                { v: row.SlNo, s: centerStyle },
                { v: row.Holes_FTD, s: centerStyle },
                { v: row.Holes_MTD, s: centerStyle },
                { v: row.Holes_YTD, s: centerStyle },
                { v: row.Exp_FTD, s: centerStyle },
                { v: row.Exp_MTD, s: centerStyle },
                { v: row.Exp_YTD, s: centerStyle },
                { v: row.TotalVolume_FTD, s: centerStyle },
                { v: row.TotalVolume_MTD, s: centerStyle },
                { v: row.TotalVolume_YTD, s: centerStyle },
                { v: row.PowderFactor_FTD, s: centerStyle },
                { v: row.PowderFactor_MTD, s: centerStyle },
                { v: row.PowderFactor_YTD, s: centerStyle },
            ]);
        });
        wsData.push([""]);

        // --- Crusher Details ---
        wsData.push([{ v: "CRUSHER PRODUCTION", s: { font: { bold: true } } }]);
        const crushHeaders = ["Plant", "Hrs Run", "", "", "Production Qty.", "", "", "KWH", "", "", "KWH/Hrs", "", ""];
        const crushSubHeaders = ["", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD"];

        wsData.push(crushHeaders.map(h => ({ v: h, s: headerStyle })));
        wsData.push(crushSubHeaders.map(h => ({ v: h, s: subHeaderStyle })));

        crusher.forEach(row => {
            wsData.push([
                { v: row.Plant, s: leftStyle },
                { v: row.Hrs_FTD, s: centerStyle },
                { v: row.Hrs_MTD, s: centerStyle },
                { v: row.Hrs_YTD, s: centerStyle },
                { v: row.Qty_FTD, s: centerStyle },
                { v: row.Qty_MTD, s: centerStyle },
                { v: row.Qty_YTD, s: centerStyle },
                { v: row.KWH_FTD, s: centerStyle },
                { v: row.KWH_MTD, s: centerStyle },
                { v: row.KWH_YTD, s: centerStyle },
                { v: row.KWH_HR_FTD, s: centerStyle },
                { v: row.KWH_HR_MTD, s: centerStyle },
                { v: row.KWH_HR_YTD, s: centerStyle },
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
            { wch: 8 }, { wch: 20 }, { wch: 10 },
            { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Daily Progress");
        XLSX.writeFile(wb, `Daily_Progress_Report_${displayDate}.xlsx`);
        toast.success("Excel exported successfully!");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${controlStyles.actionBar}`}>
                <button onClick={handlePrint} className={`${controlStyles.button} ${controlStyles.printButton}`}>
                    <Printer size={16} /> Print / PDF
                </button>
                <button onClick={handleExportExcel} className={`${controlStyles.button} ${controlStyles.excelButton}`}>
                    <Download size={16} /> Export Excel
                </button>
            </div>

            <div ref={tableRef} className={styles.reportSheet} id="print-area">

                {/* Header */}
                <div className={styles.header}>
                    <div className="flex-1 text-center">
                        <div className="text-sky-800 font-bold text-lg mb-1">THRIVENI SAINIK MINING PRIVATE LIMITED</div>
                        <div className="text-sm font-bold text-slate-900 mb-1">Pakri Barwadih Coal Mining Project (NTPC Ltd., Barkagaon, Hazaribagh)</div>
                        <h1 className="text-xl font-bold uppercase text-slate-900 mb-1 underline">DAILY PROGRESS REPORT</h1>
                        <p className="text-sm font-bold">DATE: {displayDate}</p>
                    </div>
                </div>

                <div className="space-y-6 mt-4">

                    {/* 1. Production Table */}
                    <div >
                        <div className="bg-transparent font-bold text-left px-2 py-1 text-slate-900 text-sm border-b border-l border-r border-t border-slate-700 uppercase" style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #334155' }}>Production Details</div>
                        <table className={`${styles.table} w-full text-center text-xs`}>
                            <thead>
                                <tr>
                                    <th rowSpan="2">Sl No.</th>
                                    <th rowSpan="2" className="w-48">Material</th>
                                    <th rowSpan="2">Unit</th>
                                    <th colSpan="2">For The Day</th>
                                    <th colSpan="2">For The Month</th>
                                    <th colSpan="2">For The Year</th>
                                </tr>
                                <tr>
                                    <th>Trips</th>
                                    <th>Qty</th>
                                    <th>Trips</th>
                                    <th>Qty</th>
                                    <th>Trips</th>
                                    <th>Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {production.map((row, i) => (
                                    <tr key={i} style={row.MaterialName.includes("TOTAL") || row.MaterialName.includes("Total") ? { fontWeight: 'bold', backgroundColor: '#f1f5f9' } : {}}>
                                        <td>{row.SlNo || ''}</td>
                                        <td className="text-left" style={{ textAlign: 'left' }}>{row.MaterialName}</td>
                                        <td>{row.Unit}</td>
                                        <td>{row.DayTrip}</td>
                                        <td className="text-right" style={{ textAlign: 'right' }}>{row.DayQty}</td>
                                        <td>{row.MonthTrip}</td>
                                        <td className="text-right" style={{ textAlign: 'right' }}>{row.MonthQty}</td>
                                        <td>{row.YearTrip}</td>
                                        <td className="text-right" style={{ textAlign: 'right' }}>{row.YearQty}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 2. Drilling Table */}
                    <div>
                        <div className="bg-transparent font-bold text-left px-2 py-1 text-slate-900 text-sm border-b border-l border-r border-t border-slate-700 uppercase" style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #334155' }}>Drilling Details</div>
                        <table className={`${styles.table} w-full text-center text-xs`}>
                            <thead>
                                <tr>
                                    <th rowSpan="2">Sl No.</th>
                                    <th rowSpan="2" className="w-48">Material Type</th>
                                    <th colSpan="3">No. of Holes Drilled</th>
                                    <th colSpan="3">Drilled Meters</th>
                                    <th colSpan="3">Total Hrs</th>
                                    <th colSpan="3">Meters/Hr</th>
                                </tr>
                                <tr>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drilling.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.SlNo}</td>
                                        <td className="text-left" style={{ textAlign: 'left' }}>{row.MaterialType}</td>
                                        <td>{row.Holes_FTD}</td>
                                        <td>{row.Holes_MTD}</td>
                                        <td>{row.Holes_YTD}</td>
                                        <td>{row.Drilling_FTD}</td>
                                        <td>{row.Drilling_MTD}</td>
                                        <td>{row.Drilling_YTD}</td>
                                        <td>{row.Hrs_FTD}</td>
                                        <td>{row.Hrs_MTD}</td>
                                        <td>{row.Hrs_YTD}</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 3. Blasting Table */}
                    <div>
                        <div className="bg-transparent font-bold text-left px-2 py-1 text-slate-900 text-sm border-b border-l border-r border-t border-slate-700 uppercase" style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #334155' }}>Blasting Details</div>
                        <table className={`${styles.table} w-full text-center text-xs`}>
                            <thead>
                                <tr>
                                    <th rowSpan="2">Sl No.</th>
                                    <th colSpan="3">No. of Holes</th>
                                    <th colSpan="3">Total Explosive Used</th>
                                    <th colSpan="3">Blasted Volume</th>
                                    <th colSpan="3">Powder Factor</th>
                                </tr>
                                <tr>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blasting.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.SlNo}</td>
                                        <td>{row.Holes_FTD}</td>
                                        <td>{row.Holes_MTD}</td>
                                        <td>{row.Holes_YTD}</td>
                                        <td>{row.Exp_FTD}</td>
                                        <td>{row.Exp_MTD}</td>
                                        <td>{row.Exp_YTD}</td>
                                        <td>{row.TotalVolume_FTD}</td>
                                        <td>{row.TotalVolume_MTD}</td>
                                        <td>{row.TotalVolume_YTD}</td>
                                        <td>{row.PowderFactor_FTD}</td>
                                        <td>{row.PowderFactor_MTD}</td>
                                        <td>{row.PowderFactor_YTD}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Crusher Table */}
                    <div>
                        <div className="bg-transparent font-bold text-left px-2 py-1 text-slate-900 text-sm border-b border-l border-r border-t border-slate-700 uppercase" style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #334155' }}>Crusher Production</div>
                        <table className={`${styles.table} w-full text-center text-xs`}>
                            <thead>
                                <tr>
                                    <th rowSpan="2" className="w-48 text-left pl-2" style={{ textAlign: 'left' }}>Plant</th>
                                    <th colSpan="3">Hrs Run</th>
                                    <th colSpan="3">Production Qty.</th>
                                    <th colSpan="3">KWH</th>
                                    <th colSpan="3">KWH/Hrs</th>
                                </tr>
                                <tr>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>YTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {crusher.map((row, i) => (
                                    <tr key={i}>
                                        <td className="text-left pl-2 font-bold" style={{ textAlign: 'left' }}>{row.Plant}</td>
                                        <td>{row.Hrs_FTD}</td>
                                        <td>{row.Hrs_MTD}</td>
                                        <td>{row.Hrs_YTD}</td>
                                        <td>{row.Qty_FTD}</td>
                                        <td>{row.Qty_MTD}</td>
                                        <td>{row.Qty_YTD}</td>
                                        <td>{row.KWH_FTD}</td>
                                        <td>{row.KWH_MTD}</td>
                                        <td>{row.KWH_YTD}</td>
                                        <td>{row.KWH_HR_FTD}</td>
                                        <td>{row.KWH_HR_MTD}</td>
                                        <td>{row.KWH_HR_YTD}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Signature */}
                    <div className="flex justify-between mt-12 px-12 pb-4">
                        <div className="text-center font-bold border-t border-black w-48 pt-2">Production Head</div>
                        <div className="text-center font-bold border-t border-black w-48 pt-2">Operation Head</div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DailyProgressTable;
