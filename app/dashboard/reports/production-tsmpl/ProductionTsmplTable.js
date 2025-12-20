'use client';
import styles from '../tentative-production/TentativeReportTable.module.css'; // Reusing base styles
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function ProductionTsmplTable({ data, loading }) {

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading Report Data...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-slate-400">No Data Generated</div>;
    }

    const { summary, crusher, headerInfo } = data;

    // --- Export Logic ---
    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Title & Header Info
        wsData.push(["Production TSMPL"]);
        wsData.push([`Date: ${headerInfo?.Date || '-'}`, "", `Shift: ${headerInfo?.ShiftName || '-'}`]);
        wsData.push([]);

        // 1. Time Breakdown Table
        wsData.push(["Participle", "Shift Change", "Break fast/Tea Time", "Blasting", "Others", "Total"]);
        wsData.push(["Mins", summary.ShiftChange, summary.BreakTime, summary.Blasting, summary.Others, summary.Totalmin]);
        wsData.push(["Hrs", summary.TotalShiftChangeHrs, summary.TotalBreakTimeHrs, summary.TotalBlastingHrs, summary.TotalOthersHrs, summary.TotalHrs]);
        wsData.push(["Total working hrs", "", "", "", "", summary.TotalWorkingHrs]);
        wsData.push([]);

        // 2. Production Quantity
        wsData.push(["Production Quantity"]);
        wsData.push(["Material", "Shift Qty.", "Per Hour"]);
        wsData.push(["COAL", `${summary.ProdCoal} MT`, `${summary.ProdCoalPerHrs} MT`]);
        wsData.push(["OB", `${summary.ProdOB} BCM`, `${summary.ProdOBPerHrs} BCM`]);
        wsData.push([]);

        // 3. WP-3 Quantity
        wsData.push(["WP-3 Quantity"]);
        wsData.push(["COAL", `${summary.WPCoalQty} MT`]);
        wsData.push(["OB", `${summary.WPObQty} BCM`]);
        wsData.push([]);

        // 4. Carpeting Quantity
        wsData.push(["Carpeting Quantity"]);
        wsData.push(["Material", "Shift Qty."]);
        wsData.push(["OB", `${summary.CarpettingObQty} BCM`]);
        wsData.push([]);


        // 5. Crusher Details
        wsData.push(["Crusher Details"]);
        wsData.push(["Plant", "W. Hours", "Quantity (MT)"]);

        // Calculate Total
        let totalHrs = 0;
        let totalQty = 0;

        crusher.forEach(row => {
            wsData.push([row.Plant, row.RunningHr, row.TotalQty]);
            totalHrs += (row.RunningHr || 0);
            totalQty += (row.TotalQty || 0);
        });

        wsData.push(["Total", totalHrs.toFixed(2), totalQty]);


        // Create Sheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Styling Loop
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellRef]) continue;

                const cellStyle = {
                    font: { name: "Calibri", sz: 11 },
                    border: {
                        top: { style: "thin" },
                        bottom: { style: "thin" },
                        left: { style: "thin" },
                        right: { style: "thin" }
                    },
                    alignment: { vertical: "center", horizontal: "center" }
                };

                const rowVal = wsData[R];
                const firstColVal = rowVal[0];

                // --- TSMPL Specific Styling ---

                // Section Headers (Blue/Gray)
                if (firstColVal === "Production Quantity" || firstColVal === "WP-3 Quantity" || firstColVal === "Carpeting Quantity" || firstColVal === "Crusher Details") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };
                }

                // Table Headers (Gray)
                if (firstColVal === "Material" || firstColVal === "Plant" || firstColVal === "Participle") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "D9D9D9" } };
                }

                // Left Align Labels
                if ((firstColVal === "COAL" || firstColVal === "OB" || firstColVal === "Mins" || firstColVal === "Hrs" || firstColVal === "Total working hrs") && C === 0) {
                    cellStyle.font.bold = true;
                    // Mins/Hrs are effectively headers too
                }

                // Crusher Plant Left Align
                if (R > range.s.r && C === 0 && rowVal.length === 3 && firstColVal !== "Total" && firstColVal !== "Plant") {
                    cellStyle.alignment.horizontal = "left";
                }

                // Total Row
                if (firstColVal === "Total" || firstColVal === "Total working hrs") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };
                }

                ws[cellRef].s = cellStyle;
            }
        }

        // Auto width
        ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `ProductionTSMPL_${headerInfo?.Date || 'Report'}.xlsx`);
    };


    const totalCrusherHrs = crusher.reduce((sum, row) => sum + (row.RunningHr || 0), 0);
    const totalCrusherQty = crusher.reduce((sum, row) => sum + (row.TotalQty || 0), 0);


    return (
        <div className={styles.container}>
            {/* Action Bar */}
            <div className="flex justify-end gap-2 mb-4 print:hidden">
                <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 border border-slate-300">
                    <Printer size={14} /> Print / PDF
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-sm">
                    <Download size={14} /> Export Excel
                </button>
            </div>

            <div className={styles.reportSheet} id="print-area">

                {/* Header */}
                <div className={styles.header}>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold uppercase text-slate-900 mb-2">Production TSMPL</h1>
                        <div className="grid grid-cols-1 gap-y-1 text-sm font-bold text-slate-900">
                            <p>Date : <span>{headerInfo?.Date}</span></p>
                            <p>Shift : <span>{headerInfo?.ShiftName}</span></p>
                        </div>
                    </div>
                    <div>
                        <div className="text-right">
                            {/* Placeholder Logo or Text */}
                            <div className="flex flex-col items-end">
                                <div className="font-bold text-2xl text-blue-900">TS</div>
                                <div className="text-sky-800 font-bold text-sm">THRIVENI SAINIK</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">

                    {/* 1. Time Breakdown Table */}
                    <div className="border-2 border-slate-900">
                        <table className={`${styles.table} w-full`}>
                            <thead>
                                <tr className="bg-slate-300">
                                    <th className="text-left pl-2">Participle</th>
                                    <th>Shift Change</th>
                                    <th>Break fast/Tea Time</th>
                                    <th>Blasting</th>
                                    <th>Others</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th className="text-left pl-2">Mins</th>
                                    <td className="text-center">{summary.ShiftChange}</td>
                                    <td className="text-center">{summary.BreakTime}</td>
                                    <td className="text-center">{summary.Blasting}</td>
                                    <td className="text-center">{summary.Others}</td>
                                    <td className="text-center font-bold">{summary.Totalmin}</td>
                                </tr>
                                <tr className="bg-slate-200 font-bold">
                                    <th className="text-left pl-2">Hrs</th>
                                    <td className="text-center">{summary.TotalShiftChangeHrs}</td>
                                    <td className="text-center">{summary.TotalBreakTimeHrs}</td>
                                    <td className="text-center">{summary.TotalBlastingHrs}</td>
                                    <td className="text-center">{summary.TotalOthersHrs}</td>
                                    <td className="text-center">{summary.TotalHrs}</td>
                                </tr>
                                <tr className="bg-slate-300 font-bold border-t-2 border-slate-900">
                                    <td colSpan={5} className="text-left pl-2">Total working hrs</td>
                                    <td className="text-center text-lg">{summary.TotalWorkingHrs}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 2. Production Quantity */}
                    <div className="border-2 border-slate-900">
                        <div className="bg-blue-200 font-bold text-center border-b-2 border-slate-900 py-1 text-slate-900 text-lg">Production Quantity</div>
                        <table className={`${styles.table} w-full`}>
                            <thead>
                                <tr className="bg-slate-300">
                                    <th className="text-center w-1/4">Material</th>
                                    <th className="text-left pl-4">Shift Qty.</th>
                                    <th className="text-left pl-4">Per Hour</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th className="text-center">COAL</th>
                                    <td className="font-bold text-left pl-4">{summary.ProdCoal} MT</td>
                                    <td className="font-bold text-left pl-4">{summary.ProdCoalPerHrs} MT</td>
                                </tr>
                                <tr>
                                    <th className="text-center">OB</th>
                                    <td className="font-bold text-left pl-4">{summary.ProdOB} BCM</td>
                                    <td className="font-bold text-left pl-4">{summary.ProdOBPerHrs} BCM</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 3. WP-3 Quantity */}
                    <div className="border-2 border-slate-900">
                        <div className="bg-blue-200 font-bold text-center border-b-2 border-slate-900 py-1 text-slate-900 text-lg">WP-3 Quantity</div>
                        <table className={`${styles.table} w-full`}>
                            <tbody>
                                <tr>
                                    <th className="text-center w-1/4">COAL</th>
                                    <td className="font-bold text-left pl-4">{summary.WPCoalQty} MT</td>
                                </tr>
                                <tr>
                                    <th className="text-center">OB</th>
                                    <td className="font-bold text-left pl-4">{summary.WPObQty} BCM</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Carpeting Quantity */}
                    <div className="border-2 border-slate-900">
                        <div className="bg-blue-200 font-bold text-center border-b-2 border-slate-900 py-1 text-slate-900 text-lg">Carpeting Quantity</div>
                        <table className={`${styles.table} w-full`}>
                            <thead>
                                <tr className="bg-slate-300">
                                    <th className="text-center w-1/4">Material</th>
                                    <th className="text-left pl-4">Shift Qty.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th className="text-center">OB</th>
                                    <td className="font-bold text-left pl-4">{summary.CarpettingObQty} BCM</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 5. Crusher Details */}
                    <div className="border-2 border-slate-900">
                        <div className="bg-blue-200 font-bold text-center border-b-2 border-slate-900 py-1 text-slate-900 text-lg">Crusher Details</div>
                        <table className={`${styles.table} w-full`}>
                            <thead>
                                <tr className="bg-slate-300">
                                    <th className="text-left pl-2">Plant</th>
                                    <th className="text-center">W. Hours</th>
                                    <th className="text-center">Quantity (MT)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {crusher.map((row, i) => (
                                    <tr key={i}>
                                        <td className="text-left pl-2 font-semibold">{row.Plant}</td>
                                        <td className="text-center font-bold">{row.RunningHr?.toFixed(2)}</td>
                                        <td className="text-center font-bold">{row.TotalQty}</td>
                                    </tr>
                                ))}
                                <tr className="bg-blue-200 font-extrabold border-t-2 border-slate-900">
                                    <td className="text-left pl-2">Total</td>
                                    <td className="text-center">{totalCrusherHrs.toFixed(2)}</td>
                                    <td className="text-center">{totalCrusherQty}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

            </div>
        </div>
    );
}
