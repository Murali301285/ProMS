'use client';
import styles from '../tentative-production/TentativeReportTable.module.css'; // Reusing styles
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function ProductionNtpcTable({ data, loading }) {

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
        wsData.push(["Production NTPC"]);
        wsData.push([`Date: ${headerInfo?.Date || '-'}`, "", `Shift: ${headerInfo?.ShiftName || '-'}`]);
        wsData.push([]);

        // 1. Production Quantity using Summary Data
        wsData.push(["Production Quantity"]);
        wsData.push(["COAL", `${summary.ProdCoal} MT`]);
        wsData.push(["OB", `${summary.ProdOB} BCM`]);
        wsData.push([]);

        // 2. WP-3 Quantity
        wsData.push(["WP-3 Quantity"]);
        wsData.push(["COAL", `${summary.WPCoalQty} MT`]);
        wsData.push(["OB", `${summary.WPObQty} BCM`]);
        wsData.push([]);

        // 3. Crusher Details
        wsData.push(["Crusher Details"]);
        wsData.push(["PLANT", "HRS", "QTY (MT)"]);

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

                // Section Headers (Blue Background)
                if (firstColVal === "Production Quantity" || firstColVal === "WP-3 Quantity" || firstColVal === "Crusher Details") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "B4C6E7" } }; // Light Blue
                    // Merge cells logic would be outside loop, but this is simple enough
                }

                // Table Headers inside Crusher
                if (firstColVal === "PLANT") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "D9D9D9" } }; // Gray
                }

                // Left Align Labels (COAL, OB) in first 2 sections
                if ((firstColVal === "COAL" || firstColVal === "OB") && C === 0) {
                    cellStyle.font.bold = true;
                    cellStyle.alignment.horizontal = "center"; // Image shows center or left? Image shows center for labels like COAL/OB but left for Plant?
                    // Let's stick to standard behavior: Text labels center if simple, left if detailed.
                    // Image shows "COAL" centered in its cell? Actually looks centered.
                }

                // Plant column left align
                if (R > range.s.r && C === 0 && rowVal.length === 3 && firstColVal !== "Total" && firstColVal !== "PLANT") {
                    cellStyle.alignment.horizontal = "left";
                }

                // Crusher Data Columns (HRS, QTY) - Left Align
                if (rowVal.length === 3 && (C === 1 || C === 2)) {
                    cellStyle.alignment.horizontal = "left";
                }

                // Total Row
                if (firstColVal === "Total") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };
                }

                ws[cellRef].s = cellStyle;
            }
        }

        // Auto width
        ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }];

        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `ProductionNTPC_${headerInfo?.Date || 'Report'}.xlsx`);
    };


    // Helper for Total calculation
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
                        <h1 className="text-xl font-bold uppercase text-slate-900 mb-2">Production NTPC</h1>
                        <div className="grid grid-cols-1 gap-y-1 text-sm font-bold text-slate-900">
                            <p>Date : <span>{headerInfo?.Date}</span></p>
                            <p>Shift : <span>{headerInfo?.ShiftName}</span></p>
                        </div>
                    </div>
                    <div>
                        <div className="text-right">
                            <div className="text-sky-800 font-bold text-lg">THRIVENI SAINIK</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">

                    {/* 1. Production Quantity */}
                    <div className="border-2 border-slate-900">
                        <div className="bg-blue-200 font-bold text-center border-b-2 border-slate-900 py-1 text-slate-900">Production Quantity</div>
                        <table className={`${styles.table} w-full`}>
                            <tbody>
                                <tr>
                                    <th className="w-1/2 text-center">COAL</th>
                                    <td className="font-bold text-left pl-4">{summary.ProdCoal} MT</td>
                                </tr>
                                <tr>
                                    <th className="text-center">OB</th>
                                    <td className="font-bold text-left pl-4">{summary.ProdOB} BCM</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 2. WP-3 Quantity */}
                    <div className="border-2 border-slate-900">
                        <div className="bg-blue-200 font-bold text-center border-b-2 border-slate-900 py-1 text-slate-900">WP-3 Quantity</div>
                        <table className={`${styles.table} w-full`}>
                            <tbody>
                                <tr>
                                    <th className="w-1/2 text-center">COAL</th>
                                    <td className="font-bold text-left pl-4">{summary.WPCoalQty} MT</td>
                                </tr>
                                <tr>
                                    <th className="text-center">OB</th>
                                    <td className="font-bold text-left pl-4">{summary.WPObQty} BCM</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 3. Crusher Details */}
                    <div className="border-2 border-slate-900">
                        <div className="bg-blue-200 font-bold text-center border-b-2 border-slate-900 py-1 text-slate-900">Crusher Details</div>
                        <table className={`${styles.table} w-full`}>
                            <thead>
                                <tr className="bg-slate-300">
                                    <th className="text-left pl-2">PLANT</th>
                                    <th>HRS</th>
                                    <th>QTY (MT)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {crusher.map((row, i) => (
                                    <tr key={i}>
                                        <td className="text-left pl-2 font-semibold">{row.Plant}</td>
                                        <td className="text-left pl-10 font-bold">{row.RunningHr?.toFixed(2)}</td>
                                        <td className="text-left pl-10 font-bold">{row.TotalQty}</td>
                                    </tr>
                                ))}
                                <tr className="bg-blue-200 font-extrabold border-t-2 border-slate-900">
                                    <td className="text-left pl-2">Total</td>
                                    <td className="text-left pl-10">{totalCrusherHrs.toFixed(2)}</td>
                                    <td className="text-left pl-10">{totalCrusherQty}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

            </div>
        </div>
    );
}
