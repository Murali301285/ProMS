import styles from './TentativeReportTable.module.css';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

/**
 * Custom Layout for Tentative Production Qty Report
 * Mirrors the structure of the PDF design.
 */
export default function TentativeReportTable({ data, loading }) {

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading Report Data...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-slate-400">No Data Generated</div>;
    }

    const { wasteHandling, coalProduction, wp3, obRehandling, coalRehandling, headerInfo } = data;

    // --- Totals Calculation Helpers ---
    const calculateWasteTotal = (arr) => arr.reduce((acc, row) => ({
        OverBurden: acc.OverBurden + (row.OverBurden || 0),
        TopSoil: acc.TopSoil + (row.TopSoil || 0),
        TotalTrip: acc.TotalTrip + (row.TotalTrip || 0),
        QtyBcm: acc.QtyBcm + (row.QtyBcm || 0),
        Diff: acc.Diff + (row.Diff || 0)
    }), { OverBurden: 0, TopSoil: 0, TotalTrip: 0, QtyBcm: 0, Diff: 0 });

    const calculateCoalTotal = (arr) => arr.reduce((acc, row) => ({
        RomCoal: acc.RomCoal + (row.RomCoal || 0),
        Qty: acc.Qty + (row.Qty || 0),
        Diff: acc.Diff + (row.Diff || 0)
    }), { RomCoal: 0, Qty: 0, Diff: 0 });

    const calculateRehandlingTotal = (arr) => arr.reduce((acc, row) => ({
        Trip: acc.Trip + (row.Trip || 0),
        Qty: acc.Qty + (row.Qty || 0)
    }), { Trip: 0, Qty: 0 });


    const wasteTotal = calculateWasteTotal(wasteHandling);
    const wp3Total = calculateWasteTotal(wp3);
    const coalTotal = calculateCoalTotal(coalProduction);
    const obRehandlingTotal = calculateRehandlingTotal(obRehandling);
    const coalRehandlingTotal = calculateRehandlingTotal(coalRehandling);


    // --- Export Logic ---
    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Title
        wsData.push(["Tentative Production Qty"]);
        wsData.push([`Date: ${headerInfo?.Date || '-'}`, "", `Shift: ${headerInfo?.ShiftName || '-'}`]);
        wsData.push([`Relay: ${headerInfo?.Relay || '-'}`]);
        wsData.push([`Shift Incharge: ${headerInfo?.ShiftIncharge || '-'}`]);
        wsData.push([]); // Spacer

        // --- Waste Handling ---
        wsData.push(["Waste Handling", "", "", "", "", "", "Mapio"]);
        wsData.push(["Model", "OB/IB", "Factor", "Top Soil", "Factor", "Total Trip", "Qty (BCM)", "Trip", "Qty (BCM)", "Diff"]);

        wasteHandling.forEach(row => {
            wsData.push([
                row.EquipmentGroup,
                row.OverBurden,
                row.OverBurdenFactor,
                row.TopSoil,
                row.TopSoilFactor,
                row.TotalTrip,
                row.QtyBcm,
                row.MapioTrip,
                row.MapioQty,
                row.Diff
            ]);
        });
        // Total Waste
        wsData.push(["Total", wasteTotal.OverBurden, "", wasteTotal.TopSoil, "", wasteTotal.TotalTrip, wasteTotal.QtyBcm, 0, 0, wasteTotal.Diff]);
        wsData.push([]);

        // --- Coal Production ---
        wsData.push(["Coal Production", "", "", "", "", "Mapio"]);
        wsData.push(["Model", "ROM Coal", "Factor", "Qty (MT)", "", "Trip", "Qty (MT)", "Diff"]);
        coalProduction.forEach(row => {
            wsData.push([
                row.EquipmentGroup,
                row.RomCoal,
                row.Factor,
                row.Qty,
                "",
                row.MapioTrip,
                row.MapioQty,
                row.Diff
            ]);
        });
        wsData.push(["Total", coalTotal.RomCoal, "", coalTotal.Qty, "", 0, 0, coalTotal.Diff]);
        wsData.push([]);

        // --- WP-3 ---
        wsData.push(["WP-3 Quantity"]);
        wsData.push(["Model", "OB/IB", "Factor", "Top Soil", "Factor", "Total Trip", "Qty (BCM)"]);
        wp3.forEach(row => {
            wsData.push([
                row.EquipmentGroup,
                row.OverBurden,
                row.OverBurdenFactor,
                row.TopSoil,
                row.TopSoilFactor,
                row.TotalTrip,
                row.QtyBcm
            ]);
        });
        wsData.push(["Total", wp3Total.OverBurden, "", wp3Total.TopSoil, "", wp3Total.TotalTrip, wp3Total.QtyBcm]);
        wsData.push([]);

        // --- Rehandling ---
        wsData.push(["OB Rehandling/Carpeting Quantity"]);
        wsData.push(["Model", "Trip", "Factor", "Qty (BCM)"]);
        obRehandling.forEach(row => {
            wsData.push([row.EquipmentGroup, row.Trip, row.Factor, row.Qty]);
        });
        wsData.push(["Total", obRehandlingTotal.Trip, "", obRehandlingTotal.Qty]);
        wsData.push([]);

        wsData.push(["Coal Rehandling Quantity"]);
        wsData.push(["Model", "Trip", "Factor", "Qty (MT)"]);
        coalRehandling.forEach(row => {
            wsData.push([row.EquipmentGroup, row.Trip, row.Factor, row.Qty]);
        });
        wsData.push(["Total", coalRehandlingTotal.Trip, "", coalRehandlingTotal.Qty]);


        // Create Sheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Styling
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellRef]) continue;

                // Default Style: Border + Font
                const cellStyle = {
                    font: { name: "Calibri", sz: 10 },
                    border: {
                        top: { style: "thin" },
                        bottom: { style: "thin" },
                        left: { style: "thin" },
                        right: { style: "thin" }
                    },
                    alignment: { vertical: "center", horizontal: "center" } // Center align everything by default
                };

                // Alignment overrides
                // Column 0 (Model) -> Left
                if (C === 0) cellStyle.alignment.horizontal = "left";


                // Header / Label Styling Logic based on Row Content
                const rowVal = wsData[R];

                if (!rowVal) continue;

                const firstColVal = rowVal[0];
                if (typeof firstColVal === 'string' && (
                    firstColVal.includes("Waste Handling") ||
                    firstColVal.includes("Coal Production") ||
                    firstColVal.includes("WP-3") ||
                    firstColVal.includes("Rehandling") ||
                    firstColVal.includes("Top Soil") || // Sub-header row
                    firstColVal === "Model" || // Table Header
                    firstColVal === "Total"
                )) {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "E2E8F0" } }; // Slate-200 (Darker for visibility)

                    if (rowVal.length === 1 || (rowVal[1] === "" && rowVal[2] === "")) {
                        // Section Title - make it slightly distinct slightly darker text?
                        cellStyle.font.sz = 11;
                    }
                    if (firstColVal === "Model") {
                        // Table Header Row 
                        cellStyle.fill = { fgColor: { rgb: "CBD5E1" } }; // Slate-300 for main headers
                    }
                    if (firstColVal === "Total") {
                        // Total Row
                        cellStyle.fill = { fgColor: { rgb: "E0F2FE" } }; // Sky-100
                    }
                }

                // Header Info (Date/Shift) - Bold Labels
                if (R < 4) {
                    cellStyle.border = {}; // No borders for top info
                    cellStyle.font.bold = true;
                }

                ws[cellRef].s = cellStyle;
            }
        }

        // Auto width
        ws['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];

        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `TentativeProduction_${headerInfo?.Date || 'Report'}.xlsx`);
    };

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
                        <h1 className="text-xl font-bold uppercase text-slate-900 mb-2">Tentative Production Qty</h1>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-bold text-slate-900">
                            <p>Date : <span>{headerInfo?.Date}</span></p>
                            <p>Shift : <span>{headerInfo?.ShiftName}</span></p>
                            <p className="col-span-2">Relay : <span>{headerInfo?.Relay || 'N/A'}</span></p>
                            <p className="col-span-2">Shift Incharge : <span>{headerInfo?.ShiftIncharge || 'N/A'}</span></p>
                        </div>
                    </div>
                    <div>
                        {/* Logo Placeholder - User can replace or dynamic */}
                        <div className="text-right">
                            {/* Assuming Logo image logic, but placing text for now */}
                            <div className="text-sky-800 font-bold text-lg">THRIVENI SAINIK</div>
                        </div>
                    </div>
                </div>

                {/* 1. Waste Handling (Merged with Mapio) */}
                <div className="border border-slate-900 mt-4">
                    <div className="bg-white font-extrabold text-center border-b border-slate-900 py-1 flex justify-between px-4 uppercase text-sm">
                        <span>Waste Handling</span>
                        <span className="mr-12">Mapio</span>
                    </div>
                    <table className={`${styles.table} w-full`}>
                        <thead>
                            <tr>
                                <th>Model</th>
                                <th>OB/IB</th>
                                <th>Factor</th>
                                <th>TOP SOIL</th>
                                <th>Factor</th>
                                <th>Total Trip</th>
                                <th>Qty (BCM)</th>
                                {/* Mapio Columns */}
                                <th className="bg-slate-100 border-l-2 border-slate-800">Trip</th>
                                <th>Qty (BCM)</th>
                                <th>Diff.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wasteHandling.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-left pl-2 font-semibold">{row.EquipmentGroup}</td>
                                    <td className="text-center">{row.OverBurden}</td>
                                    <td className="text-center">{row.OverBurdenFactor}</td>
                                    <td className="text-center">{row.TopSoil}</td>
                                    <td className="text-center">{row.TopSoilFactor}</td>
                                    <td className="text-center">{row.TotalTrip}</td>
                                    <td className="text-center">{row.QtyBcm}</td>
                                    {/* Mapio Data */}
                                    <td className="border-l-2 border-slate-800 text-center">{row.MapioTrip}</td>
                                    <td className="text-center">{row.MapioQty}</td>
                                    <td className="text-center">{row.Diff}</td>
                                </tr>
                            ))}
                            {/* Total Row */}
                            <tr className="bg-slate-300 font-extrabold border-t-2 border-slate-800">
                                <td className="text-left pl-2">Total</td>
                                <td className="text-center">{wasteTotal.OverBurden}</td>
                                <td></td>
                                <td className="text-center">{wasteTotal.TopSoil}</td>
                                <td></td>
                                <td className="text-center">{wasteTotal.TotalTrip}</td>
                                <td className="text-center">{wasteTotal.QtyBcm}</td>
                                {/* Mapio Total */}
                                <td className="border-l-2 border-slate-800 text-center">0</td>
                                <td className="text-center">0</td>
                                <td className="text-center">{wasteTotal.Diff}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 2. Coal Production (Merged with Mapio) */}
                <div className="border border-slate-900 mt-4">
                    <div className="bg-white font-extrabold text-center border-b border-slate-900 py-1 flex justify-between px-4 uppercase text-sm">
                        <span>Coal Production</span>
                        <span className="mr-12">Mapio</span>
                    </div>
                    <table className={`${styles.table} w-full`}>
                        <thead>
                            <tr>
                                <th>Model</th>
                                <th>ROM COAL</th>
                                <th>Factor</th>
                                <th>Qty (MT)</th>
                                {/* Mapio Columns */}
                                <th className="bg-slate-100 border-l-2 border-slate-800">Trip</th>
                                <th>Qty (MT)</th>
                                <th>Diff.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coalProduction.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-left pl-2 font-semibold">{row.EquipmentGroup}</td>
                                    <td className="text-center">{row.RomCoal}</td>
                                    <td className="text-center">{row.Factor}</td>
                                    <td className="text-center">{row.Qty}</td>
                                    {/* Mapio Data */}
                                    <td className="border-l-2 border-slate-800 text-center">{row.MapioTrip}</td>
                                    <td className="text-center">{row.MapioQty}</td>
                                    <td className="text-center">{row.Diff}</td>
                                </tr>
                            ))}
                            {/* Total Row */}
                            <tr className="bg-slate-300 font-extrabold border-t-2 border-slate-800">
                                <td className="text-left pl-2">Total</td>
                                <td className="text-center">{coalTotal.RomCoal}</td>
                                <td></td>
                                <td className="text-center">{coalTotal.Qty}</td>
                                {/* Mapio Total */}
                                <td className="border-l-2 border-slate-800 text-center">0</td>
                                <td className="text-center">0</td>
                                <td className="text-center">{coalTotal.Diff}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 3. WP-3 Quantity */}
                <div className="border border-slate-900 mt-4">
                    <div className="bg-white font-extrabold text-center border-b border-slate-900 py-1 uppercase text-sm">WP-3 Quantity</div>
                    <table className={`${styles.table} w-full`}>
                        <thead>
                            <tr>
                                <th>Model</th>
                                <th>OB/IB</th>
                                <th>Factor</th>
                                <th>Top Soil</th>
                                <th>Factor</th>
                                <th>Total Trip</th>
                                <th>Qty (BCM)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wp3.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-left pl-2 font-semibold">{row.EquipmentGroup}</td>
                                    <td className="text-center">{row.OverBurden}</td>
                                    <td className="text-center">{row.OverBurdenFactor}</td>
                                    <td className="text-center">{row.TopSoil}</td>
                                    <td className="text-center">{row.TopSoilFactor}</td>
                                    <td className="text-center">{row.TotalTrip}</td>
                                    <td className="text-center">{row.QtyBcm}</td>
                                </tr>
                            ))}
                            <tr className="bg-slate-300 font-extrabold border-t-2 border-slate-800">
                                <td className="text-left pl-2">Total</td>
                                <td className="text-center">{wp3Total.OverBurden}</td>
                                <td></td>
                                <td className="text-center">{wp3Total.TopSoil}</td>
                                <td></td>
                                <td className="text-center">{wp3Total.TotalTrip}</td>
                                <td className="text-center">{wp3Total.QtyBcm}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 4. Rehandling Tables (Side by Side potentially, or stacked as per PDF flow) */}
                <div className="mt-4 space-y-4">
                    {/* OB Rehandling */}
                    <div className="border border-slate-900">
                        <div className="bg-white font-extrabold text-center border-b border-slate-900 py-1 uppercase text-sm">OB Rehandling/Carpeting Quantity</div>
                        <table className={`${styles.table} w-full`}>
                            <thead>
                                <tr>
                                    <th>Model</th>
                                    <th>Trip</th>
                                    <th>Factor</th>
                                    <th>Qty (BCM)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {obRehandling.map((row, i) => (
                                    <tr key={i}>
                                        <td className="text-left pl-2 font-semibold">{row.EquipmentGroup}</td>
                                        <td className="text-center">{row.Trip}</td>
                                        <td className="text-center">{row.Factor}</td>
                                        <td className="text-center">{row.Qty}</td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-300 font-extrabold border-t-2 border-slate-800">
                                    <td className="text-left pl-2">Total</td>
                                    <td className="text-center">{obRehandlingTotal.Trip}</td>
                                    <td></td>
                                    <td className="text-center">{obRehandlingTotal.Qty}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Coal Rehandling */}
                    <div className="border border-slate-900">
                        <div className="bg-white font-extrabold text-center border-b border-slate-900 py-1 uppercase text-sm">Coal Rehandling Quantity</div>
                        <table className={`${styles.table} w-full`}>
                            <thead>
                                <tr>
                                    <th>Model</th>
                                    <th>Trip</th>
                                    <th>Factor</th>
                                    <th>Qty (MT)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coalRehandling.map((row, i) => (
                                    <tr key={i}>
                                        <td className="text-left pl-2 font-semibold">{row.EquipmentGroup}</td>
                                        <td className="text-center">{row.Trip}</td>
                                        <td className="text-center">{row.Factor}</td>
                                        <td className="text-center">{row.Qty}</td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-300 font-extrabold border-t-2 border-slate-800">
                                    <td className="text-left pl-2">Total</td>
                                    <td className="text-center">{coalRehandlingTotal.Trip}</td>
                                    <td></td>
                                    <td className="text-center">{coalRehandlingTotal.Qty}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
