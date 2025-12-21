import React, { useMemo, useState, useEffect } from 'react';
import styles from './DailyProduction.module.css';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function DailyProductionTable({ data, date }) {
    // State variables for data received from the SP
    const [shiftProdCoal, setShiftProdCoal] = useState([]);
    const [shiftProdWaste, setShiftProdWaste] = useState([]);
    const [coalDetails, setCoalDetails] = useState([]);
    const [wasteDetails, setWasteDetails] = useState([]);
    const [crushedCoal, setCrushedCoal] = useState([]);
    const [coalCrushing, setCoalCrushing] = useState([]);
    const [coalCrushingSummary, setCoalCrushingSummary] = useState([]); // New state
    const [blasting, setBlasting] = useState([]);
    const [itizRehandling, setItizRehandling] = useState([]); // New state, replaces dumpRehandling
    const [dumperLoaderDetails, setDumperLoaderDetails] = useState([]); // New state for Section H
    const [remarks, setRemarks] = useState([]);

    useEffect(() => {
        if (data && Array.isArray(data)) { // Ensure data is an array as expected by the new structure
            setShiftProdCoal(data[0] || []);
            setShiftProdWaste(data[1] || []);
            setCoalDetails(data[2] || []);
            setWasteDetails(data[3] || []);
            setCrushedCoal(data[4] || []);
            setCoalCrushing(data[5] || []);
            setCoalCrushingSummary(data[6] || []);
            setBlasting(data[7] || []);
            setItizRehandling(data[8] || []);
            setDumperLoaderDetails(data[9] || []); // Section H
            // Assuming remarks is now at index 13 based on the comment
            setRemarks(data[13] || []);
        }
    }, [data]);

    if (!data) return null;

    // Process Dumper-Loader Pivot (Section H)
    const dumperPivot = useMemo(() => {
        if (!dumperLoaderDetails || dumperLoaderDetails.length === 0) return { headers: [], rows: [], grandTotals: {} };

        // 1. Get Unique Shifts and Loaders per Shift
        // structure: { "SHIFTA": ["Loader1", "Loader2"], "SHIFTB": ... }
        const shiftLoaders = { "SHIFTA": new Set(), "SHIFTB": new Set(), "SHIFTC": new Set() };
        const allLoaders = new Set();

        dumperLoaderDetails.forEach(r => {
            const s = r.ShiftName?.toUpperCase().replace('-', '').trim();
            if (shiftLoaders[s]) {
                shiftLoaders[s].add(r.Loader || 'Unknown');
            }
            if (r.Loader) allLoaders.add(r.Loader);
        });

        // Convert Sets to Arrays and Logic to Align columns
        // Option A: Distinct headers per shift (as per image likely)
        // Option B: Consistent columns (all loaders in all shifts)
        // User image shows distinct columns but let's stick to active loaders per shift for compactness usually, 
        // BUT user asked for cross tab. Let's start with unique loaders per shift sorted.

        const shifts = ["SHIFTA", "SHIFTB", "SHIFTC"];
        const headers = []; // [{ name: "SHIFTA", loaders: ["L1", "L2"] }, ...]

        shifts.forEach(s => {
            const loaders = Array.from(shiftLoaders[s]).sort();
            // If no loaders, maybe keep empty or skip? Layout implies fixed 3 shifts usually.
            // Let's keep 3 shifts fixed. If empty, just show empty or 1 placeholder?
            // User image has data in all.
            headers.push({ name: s, loaders });
        });

        // 2. Build Rows (Group by Dumper)
        const dumperMap = {};
        dumperLoaderDetails.forEach(r => {
            if (!dumperMap[r.Dumper]) {
                dumperMap[r.Dumper] = {
                    Dumper: r.Dumper,
                    Factor: r.FACTOR,
                    Total: 0,
                    ...shifts.reduce((acc, s) => ({ ...acc, [s]: {} }), {})
                };
            }
            const s = r.ShiftName?.toUpperCase().replace('-', '').trim();
            const loader = r.Loader || 'Unknown';

            if (dumperMap[r.Dumper][s]) {
                dumperMap[r.Dumper][s][loader] = (dumperMap[r.Dumper][s][loader] || 0) + r.Trip;
            }
            dumperMap[r.Dumper].Total += r.Trip;
        });

        const rows = Object.values(dumperMap).sort((a, b) => a.Dumper.localeCompare(b.Dumper));

        // 3. Calculate Column Totals (Grand Totals)
        const grandTotals = { Total: 0 }; // { "SHIFTA": { "L1": 10, "L2": 5 }, "Total": 100 }

        headers.forEach(h => {
            grandTotals[h.name] = {};
            h.loaders.forEach(l => {
                grandTotals[h.name][l] = 0;
            });
        });

        rows.forEach(r => {
            grandTotals.Total += r.Total;
            headers.forEach(h => {
                h.loaders.forEach(l => {
                    const val = r[h.name][l] || 0;
                    grandTotals[h.name][l] += val;
                });
            });
        });

        return { headers, rows, grandTotals };

    }, [dumperLoaderDetails]);

    // --- Data Processing for Pivot Layout (Section A) ---
    // Goal: Rows by Scale/EquipmentGroup. Cols: Shift A (Trip, Qty), Shift B, Shift C.
    // Since SP returns: { Scale, ShiftName, Material, Trip... }

    // Process Coal Shift Data
    const coalShiftPivot = useMemo(() => {
        const rows = {}; // Key: "ScaleName" -> { Scale, ShiftA: {}, ShiftB: {}, ShiftC: {} }
        shiftProdCoal.forEach(r => {
            const key = r.Scale;
            if (!rows[key]) rows[key] = { Scale: key, ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };

            const shift = r.ShiftName?.toUpperCase().replace('-', '').trim(); // "SHIFT A" -> "SHIFTA"
            let target = null;
            if (shift === 'SHIFTA') target = rows[key].ShiftA;
            else if (shift === 'SHIFTB') target = rows[key].ShiftB;
            else if (shift === 'SHIFTC') target = rows[key].ShiftC;

            if (target) {
                target.Trip = (target.Trip || 0) + r.Trip;
                target.Qty = (target.Qty || 0) + r.mngQty; // Using mngQty as Qty
            }
        });
        // Calculate Totals per row
        Object.values(rows).forEach(row => {
            row.Total.Trip = (row.ShiftA.Trip || 0) + (row.ShiftB.Trip || 0) + (row.ShiftC.Trip || 0);
            row.Total.Qty = (row.ShiftA.Qty || 0) + (row.ShiftB.Qty || 0) + (row.ShiftC.Qty || 0);
        });
        return Object.values(rows);
    }, [shiftProdCoal]);

    // Process Coal Crushing Shift Data (Section D)
    const coalCrushingPivot = useMemo(() => {
        const rows = {};
        coalCrushing.forEach(r => {
            const key = r.PlantName;
            if (!rows[key]) rows[key] = { PlantName: key, ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };

            const shift = r.ShiftName?.toUpperCase().replace('-', '').trim();
            let target = null;
            if (shift === 'SHIFTA') target = rows[key].ShiftA;
            else if (shift === 'SHIFTB') target = rows[key].ShiftB;
            else if (shift === 'SHIFTC') target = rows[key].ShiftC;

            if (target) {
                target.Hr = (target.Hr || 0) + r.Hr;
                target.Qty = (target.Qty || 0) + r.EstQty;
            }
        });

        // Calculate Totals per row and Column Totals
        const grandTotal = { ShiftA: { Hr: 0, Qty: 0 }, ShiftB: { Hr: 0, Qty: 0 }, ShiftC: { Hr: 0, Qty: 0 }, Total: { Hr: 0, Qty: 0 } };

        Object.values(rows).forEach(row => {
            row.Total.Hr = (row.ShiftA.Hr || 0) + (row.ShiftB.Hr || 0) + (row.ShiftC.Hr || 0);
            row.Total.Qty = (row.ShiftA.Qty || 0) + (row.ShiftB.Qty || 0) + (row.ShiftC.Qty || 0);

            grandTotal.ShiftA.Hr += (row.ShiftA.Hr || 0);
            grandTotal.ShiftA.Qty += (row.ShiftA.Qty || 0);

            grandTotal.ShiftB.Hr += (row.ShiftB.Hr || 0);
            grandTotal.ShiftB.Qty += (row.ShiftB.Qty || 0);

            grandTotal.ShiftC.Hr += (row.ShiftC.Hr || 0);
            grandTotal.ShiftC.Qty += (row.ShiftC.Qty || 0);

            grandTotal.Total.Hr += row.Total.Hr;
            grandTotal.Total.Qty += row.Total.Qty;
        });

        return { rows: Object.values(rows), grandTotal };
    }, [coalCrushing]);


    // Process Waste Shift Data (Similar logic)
    const wasteShiftPivot = useMemo(() => {
        const rows = {};
        shiftProdWaste.forEach(r => {
            const key = r.Scale;
            if (!rows[key]) rows[key] = { Scale: key, ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };

            const shift = r.ShiftName?.toUpperCase().replace('-', '').trim();
            let target = null;
            if (shift === 'SHIFTA') target = rows[key].ShiftA;
            else if (shift === 'SHIFTB') target = rows[key].ShiftB;
            else if (shift === 'SHIFTC') target = rows[key].ShiftC;

            if (target) {
                target.Trip = (target.Trip || 0) + r.Trip;
                target.Qty = (target.Qty || 0) + r.mngQty;
            }
        });
        Object.values(rows).forEach(row => {
            row.Total.Trip = (row.ShiftA.Trip || 0) + (row.ShiftB.Trip || 0) + (row.ShiftC.Trip || 0);
            row.Total.Qty = (row.ShiftA.Qty || 0) + (row.ShiftB.Qty || 0) + (row.ShiftC.Qty || 0);
        });
        return Object.values(rows);
    }, [shiftProdWaste]);


    // Helper for formatting
    const fmt = (val, decimals = 2) => {
        if (val === null || val === undefined) return '0';
        // Check if value is integer-like for Trips, else decimals
        if (val % 1 === 0 && val < 1000) return val;
        return Number(val).toLocaleString('en-IN', { maximumFractionDigits: decimals });
    };

    const handlePrint = () => window.print();

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Header
        wsData.push(["THRIVENI SAINIK MINING PRIVATE LIMITED"]);
        wsData.push(["PAKRI BARWADIH COAL MINING PROJECT"]);
        wsData.push(["DAILY PRODUCTION REPORT", "", "", "Date: " + date]);
        wsData.push([]);

        // --- SECTION A: SHIFT PRODUCTION ---
        wsData.push(["A. SHIFT PRODUCTION DETAILS"]);
        // Headers need to be manually constructed to match the merged cell layout
        wsData.push(["", "SHIFT-A", "", "SHIFT-B", "", "SHIFT-C", "", "TOTAL"]);
        wsData.push(["COAL", "", "WASTE", "", "COAL", "", "WASTE", "", "COAL", "", "WASTE", ""]); // Conceptual layout differs from UI
        // Simplified Excel Layout: Scale | Shift A Coal Trip | Shift A Coal Qty | Shift A Waste Trip... 
        // This effectively requires merging Coal and Waste tables OR putting them side by side.
        // Given the complexity of side-by-side tables in Excel generation via simple array, we will stack them or try to align.
        // User image shows: "Shift A (Coal | Waste)" merged. 
        // My Logic above split Coal and Waste tables. 
        // Let's output two separate blocks for Coal and Waste in Excel for clarity, or try to merge.
        // Merging logic: Row = Scale. Cols = Shift A Coal Trip, Shift A Coal Qty, Shift A Waste Trip, Shift A Waste Qty...

        // Let's create a combined list of Scales
        const allScales = new Set([...coalShiftPivot.map(r => r.Scale), ...wasteShiftPivot.map(r => r.Scale)]);

        wsData.push(["", "SHIFT-A", "", "", "", "SHIFT-B", "", "", "", "SHIFT-C", "", "", "", "TOTAL"]);
        wsData.push(["SI No.", "Scale", "COAL", "", "WASTE", "", "COAL", "", "WASTE", "", "COAL", "", "WASTE", "", "COAL", "", "WASTE", ""]);
        wsData.push(["", "", "Trips", "Qty", "Trips", "Qty", "Trips", "Qty", "Trips", "Qty", "Trips", "Qty", "Trips", "Qty", "Trips", "Qty", "Trips", "Qty"]);

        let si = 1;
        allScales.forEach(scale => {
            const c = coalShiftPivot.find(r => r.Scale === scale) || { ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };
            const w = wasteShiftPivot.find(r => r.Scale === scale) || { ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };

            wsData.push([
                si++,
                scale,
                c.ShiftA.Trip, c.ShiftA.Qty, w.ShiftA.Trip, w.ShiftA.Qty,
                c.ShiftB.Trip, c.ShiftB.Qty, w.ShiftB.Trip, w.ShiftB.Qty,
                c.ShiftC.Trip, c.ShiftC.Qty, w.ShiftC.Trip, w.ShiftC.Qty,
                c.Total.Trip, c.Total.Qty, w.Total.Trip, w.Total.Qty
            ]);
        });
        wsData.push([]);

        // --- SECTION B: TRIP-QTY DETAILS ---
        wsData.push(["B. TRIP-QUANTITY DETAILS"]);
        wsData.push(["", "", "FTD", "", "MTD", "", "YTD", ""]);
        wsData.push(["Type", "Scale/Mat", "Trip", "Qty", "Trip", "Qty", "Trip", "Qty"]);

        coalDetails.forEach(r => {
            wsData.push(["COAL", r.MaterialName, r.Trip_FTD, r.Qty_FTD, r.Trip_MTD, r.Qty_MTD, r.Trip_YTD, r.Qty_YTD]);
        });
        wasteDetails.forEach(r => {
            wsData.push(["WASTE", r.Scale, r.Trip_FTD, r.Qty_FTD, r.Trip_MTD, r.Qty_MTD, r.Trip_YTD, r.Qty_YTD]);
        });
        wsData.push([]);

        // --- Just basic export for now, exact styling requires byte-level manipulation or complex lib usage ---

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        // Basic Merges for Header
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Company Name
            { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Project
        ];

        // Column Widths
        ws['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];

        XLSX.utils.book_append_sheet(wb, ws, "DailyProduction");
        XLSX.writeFile(wb, `DailyProduction_${date}.xlsx`);
    };

    return (
        <div className={styles.container}>
            <div className="flex justify-end gap-2 mb-4 no-print" style={{ marginBottom: '10px' }}>
                <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1 bg-slate-100 border rounded cursor-pointer">
                    <Printer size={16} /> Print
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded cursor-pointer">
                    <Download size={16} /> Excel
                </button>
            </div>

            <div className={styles.reportSheet}>
                {/* HEADERS */}
                <div className="text-center mb-4 uppercase font-bold text-slate-800">
                    <h1 className="text-lg">THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                    <h2 className="text-md">PAKRI BARWADIH COAL MINING PROJECT</h2>
                    <h3 className="text-md mt-2 underline">DAILY PRODUCTION REPORT</h3>
                    <div className="text-right text-sm text-red-600 mt-2">Date: {date}</div>
                </div>

                {/* SECTION A */}
                <div className="mb-6">
                    <h3 className="font-bold text-blue-700 mb-1">A. SHIFT PRODUCTION DETAILS</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th rowSpan="3">SI No.</th>
                                <th rowSpan="3" className="text-left pl-2">Scale / Model</th>
                                <th colSpan="4" className="text-red-600">SHIFT-A</th>
                                <th colSpan="4" className="text-red-600">SHIFT-B</th>
                                <th colSpan="4" className="text-red-600">SHIFT-C</th>
                            </tr>
                            <tr>
                                <th colSpan="2">COAL</th>
                                <th colSpan="2">WASTE</th>
                                <th colSpan="2">COAL</th>
                                <th colSpan="2">WASTE</th>
                                <th colSpan="2">COAL</th>
                                <th colSpan="2">WASTE</th>
                            </tr>
                            <tr>
                                <th>TRIPS</th><th>QTY.</th>
                                <th>TRIP</th><th>QTY.</th>
                                <th>TRIP</th><th>QTY.</th>
                                <th>TRIP</th><th>QTY.</th>
                                <th>TRIP</th><th>QTY.</th>
                                <th>TRIP</th><th>QTY.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Merge Scale Names from Coal/Waste Pivots */}
                            {Array.from(new Set([...coalShiftPivot.map(r => r.Scale), ...wasteShiftPivot.map(r => r.Scale)])).map((scale, i) => {
                                const c = coalShiftPivot.find(r => r.Scale === scale) || { ShiftA: {}, ShiftB: {}, ShiftC: {} };
                                const w = wasteShiftPivot.find(r => r.Scale === scale) || { ShiftA: {}, ShiftB: {}, ShiftC: {} };
                                return (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td className="text-left font-bold">{scale}</td>

                                        {/* Shift A */}
                                        <td>{fmt(c.ShiftA.Trip)}</td><td>{fmt(c.ShiftA.Qty)}</td>
                                        <td>{fmt(w.ShiftA.Trip)}</td><td>{fmt(w.ShiftA.Qty)}</td>

                                        {/* Shift B */}
                                        <td>{fmt(c.ShiftB.Trip)}</td><td>{fmt(c.ShiftB.Qty)}</td>
                                        <td>{fmt(w.ShiftB.Trip)}</td><td>{fmt(w.ShiftB.Qty)}</td>

                                        {/* Shift C */}
                                        <td>{fmt(c.ShiftC.Trip)}</td><td>{fmt(c.ShiftC.Qty)}</td>
                                        <td>{fmt(w.ShiftC.Trip)}</td><td>{fmt(w.ShiftC.Qty)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* SECTION B */}
                <div className="mb-8">
                    <h3 className="font-bold text-blue-700 mb-4">B. TRIP-QUANTITY DETAILS</h3>

                    <div className="flex gap-8">
                        {/* COAL TABLE */}
                        <div className="flex-1">
                            {/* Label Above Table */}
                            <div className="font-bold text-center border border-b-0 border-slate-900 bg-slate-200 py-1">COAL</div>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        {/* Vertical Header Removed */}
                                        <th rowSpan="2" className="min-w-[120px]">Scale / Model</th>
                                        <th colSpan="2" className="text-red-600 bg-blue-50">FTD</th>
                                        <th colSpan="2" className="text-red-600 bg-blue-50">MTD</th>
                                        <th colSpan="2" className="text-red-600 bg-blue-50">YTD</th>
                                    </tr>
                                    <tr>
                                        <th>TRIP</th><th>QTY.</th>
                                        <th>TRIPS</th><th>QTY.</th>
                                        <th>TRIPS</th><th>QTY.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coalDetails.map((row, i) => (
                                        <tr key={i}>
                                            <td className="font-bold text-left pl-2">{row.Scale}</td>
                                            <td>{fmt(row.Trip_FTD)}</td><td>{fmt(row.Qty_FTD)}</td>
                                            <td>{fmt(row.Trip_MTD)}</td><td>{fmt(row.Qty_MTD)}</td>
                                            <td>{fmt(row.Trip_YTD)}</td><td>{fmt(row.Qty_YTD)}</td>
                                        </tr>
                                    ))}
                                    {/* Total Row for Coal */}
                                    <tr className="bg-yellow-200 font-extrabold border-t border-slate-400">
                                        <td className="text-right pr-2">Total</td>
                                        <td>{fmt(coalDetails.reduce((s, r) => s + r.Trip_FTD, 0))}</td>
                                        <td>{fmt(coalDetails.reduce((s, r) => s + r.Qty_FTD, 0))}</td>
                                        <td>{fmt(coalDetails.reduce((s, r) => s + r.Trip_MTD, 0))}</td>
                                        <td>{fmt(coalDetails.reduce((s, r) => s + r.Qty_MTD, 0))}</td>
                                        <td>{fmt(coalDetails.reduce((s, r) => s + r.Trip_YTD, 0))}</td>
                                        <td>{fmt(coalDetails.reduce((s, r) => s + r.Qty_YTD, 0))}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="h-8"></div>

                    {/* WASTE TABLE */}
                    <div className="flex gap-8">
                        <div className="flex-1">
                            {/* Label Above Table */}
                            <div className="font-bold text-center border border-b-0 border-slate-900 bg-slate-200 py-1">WASTE</div>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        {/* Vertical Header Removed */}
                                        <th rowSpan="2" className="min-w-[120px]">Scale / Model</th>
                                        <th colSpan="2" className="text-red-600 bg-blue-50">FTD</th>
                                        <th colSpan="2" className="text-red-600 bg-blue-50">MTD</th>
                                        <th colSpan="2" className="text-red-600 bg-blue-50">YTD</th>
                                    </tr>
                                    <tr>
                                        <th>TRIP</th><th>QTY (BCM)</th>
                                        <th>TRIPS</th><th>QTY (BCM)</th>
                                        <th>TRIPS</th><th>QTY (BCM)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {wasteDetails.map((row, i) => (
                                        <tr key={i}>
                                            <td className="font-bold text-left pl-2">{row.Scale}</td>
                                            <td>{fmt(row.Trip_FTD)}</td><td>{fmt(row.Qty_FTD)}</td>
                                            <td>{fmt(row.Trip_MTD)}</td><td>{fmt(row.Qty_MTD)}</td>
                                            <td>{fmt(row.Trip_YTD)}</td><td>{fmt(row.Qty_YTD)}</td>
                                        </tr>
                                    ))}
                                    {/* Total Row for Waste */}
                                    <tr className="bg-yellow-200 font-extrabold border-t border-slate-400">
                                        <td className="text-right pr-2">Total</td>
                                        <td>{fmt(wasteDetails.reduce((s, r) => s + r.Trip_FTD, 0))}</td>
                                        <td>{fmt(wasteDetails.reduce((s, r) => s + r.Qty_FTD, 0))}</td>
                                        <td>{fmt(wasteDetails.reduce((s, r) => s + r.Trip_MTD, 0))}</td>
                                        <td>{fmt(wasteDetails.reduce((s, r) => s + r.Qty_MTD, 0))}</td>
                                        <td>{fmt(wasteDetails.reduce((s, r) => s + r.Trip_YTD, 0))}</td>
                                        <td>{fmt(wasteDetails.reduce((s, r) => s + r.Qty_YTD, 0))}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* STRIPING RATIO ROW */}
                <div className="flex justify-between border border-slate-900 p-2 font-bold text-sm mb-8 bg-slate-50">
                    <div>STRIPING RATIO</div>
                    {/* Placeholder Logic for Ratio: Waste / Coal? Need logic but UI shows static placeholders in snippet */}
                    <div>1 : 1.97</div>
                    <div>1 : 4.95</div>
                    <div>1 : 4.12</div>
                </div>

                {/* OTHER SECTIONS (C, D, F, G) - Simplified Layouts */}
                <div className="grid grid-cols-2 gap-4">
                    {/* C. CRUSHED COAL */}
                    <div>
                        {/* Header with vertical text logic similar to Coal/Waste? Not in image, image shows standard headers. 
                             Image shows FTD/MTD/YTD headers for Crushed Coal. */}
                        <div className="flex gap-2">
                            <div className="bg-white border-none w-8 relative">
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 font-bold tracking-widest whitespace-nowrap text-xs">CRUSHED COAL</span>
                            </div>
                            <div className="flex-1">
                                <table className={styles.table}>
                                    <thead>
                                        <tr className="bg-blue-50">
                                            <th rowSpan="2">Source / Type</th>
                                            <th colSpan="2" className="text-red-600">FTD</th>
                                            <th colSpan="2" className="text-red-600">MTD</th>
                                            <th colSpan="2" className="text-red-600">YTD</th>
                                        </tr>
                                        <tr>
                                            <th>TRIP</th><th>QTY</th>
                                            <th>TRIPS</th><th>QTY</th>
                                            <th>TRIPS</th><th>QTY</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {crushedCoal.map((r, i) => (
                                            <tr key={i}>
                                                <td className="font-bold">{r.sourceName}</td>
                                                <td>{fmt(r.Trip_FTD)}</td><td>{fmt(r.Qty_FTD)}</td>
                                                <td>{fmt(r.Trip_MTD)}</td><td>{fmt(r.Qty_MTD)}</td>
                                                <td>{fmt(r.Trip_YTD)}</td><td>{fmt(r.Qty_YTD)}</td>
                                            </tr>
                                        ))}
                                        {/* Total Row */}
                                        <tr className="bg-yellow-200 font-extrabold border-t border-slate-400">
                                            <td className="text-right pr-2">Total</td>
                                            <td>{fmt(crushedCoal.reduce((s, r) => s + r.Trip_FTD, 0))}</td>
                                            <td>{fmt(crushedCoal.reduce((s, r) => s + r.Qty_FTD, 0))}</td>
                                            <td>{fmt(crushedCoal.reduce((s, r) => s + r.Trip_MTD, 0))}</td>
                                            <td>{fmt(crushedCoal.reduce((s, r) => s + r.Qty_MTD, 0))}</td>
                                            <td>{fmt(crushedCoal.reduce((s, r) => s + r.Trip_YTD, 0))}</td>
                                            <td>{fmt(crushedCoal.reduce((s, r) => s + r.Qty_YTD, 0))}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spacer between sections */}
                <div className="h-8"></div>

                {/* D. COAL CRUSHING */}
                <div className="col-span-2 mt-4">
                    <h3 className="font-bold text-blue-700 mb-1">D. COAL CRUSHING DETAILS</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th rowSpan="2">Plant / Crusher</th>
                                <th colSpan="2" className="text-red-600 border-l border-slate-600">SHIFT-A</th>
                                <th colSpan="2" className="text-red-600 border-l border-slate-600">SHIFT-B</th>
                                <th colSpan="2" className="text-red-600 border-l border-slate-600">SHIFT-C</th>
                                <th colSpan="2" className="bg-slate-200 border-l border-slate-800">TOTAL</th>
                            </tr>
                            <tr>
                                {/* Sub headers */}
                                <th className="border-l border-slate-600">Hr.</th><th>Est.Qty</th>
                                <th className="border-l border-slate-600">Hr.</th><th>Est.Qty</th>
                                <th className="border-l border-slate-600">Hr.</th><th>Est.Qty</th>
                                <th className="bg-slate-200 border-l border-slate-800">Hr.</th><th className="bg-slate-200">Est.Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coalCrushingPivot.rows.map((r, i) => (
                                <tr key={i}>
                                    <td className="font-bold text-left pl-2">{r.PlantName}</td>

                                    <td className="border-l border-slate-600">{fmt(r.ShiftA.Hr)}</td><td>{fmt(r.ShiftA.Qty)}</td>

                                    <td className="border-l border-slate-600">{fmt(r.ShiftB.Hr)}</td><td>{fmt(r.ShiftB.Qty)}</td>

                                    <td className="border-l border-slate-600">{fmt(r.ShiftC.Hr)}</td><td>{fmt(r.ShiftC.Qty)}</td>

                                    <td className="border-l border-slate-800 font-bold bg-slate-50">{fmt(r.Total.Hr)}</td><td className="font-bold bg-slate-50">{fmt(r.Total.Qty)}</td>
                                </tr>
                            ))}
                            {/* Grand Total Row */}
                            <tr className="bg-slate-300 font-extrabold border-t-2 border-slate-800">
                                <td className="text-right pr-2">Total</td>
                                <td className="border-l border-slate-600">{fmt(coalCrushingPivot.grandTotal.ShiftA.Hr)}</td><td>{fmt(coalCrushingPivot.grandTotal.ShiftA.Qty)}</td>
                                <td className="border-l border-slate-600">{fmt(coalCrushingPivot.grandTotal.ShiftB.Hr)}</td><td>{fmt(coalCrushingPivot.grandTotal.ShiftB.Qty)}</td>
                                <td className="border-l border-slate-600">{fmt(coalCrushingPivot.grandTotal.ShiftC.Hr)}</td><td>{fmt(coalCrushingPivot.grandTotal.ShiftC.Qty)}</td>
                                <td className="border-l border-slate-800">{fmt(coalCrushingPivot.grandTotal.Total.Hr)}</td><td>{fmt(coalCrushingPivot.grandTotal.Total.Qty)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* F & G */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* F. BLASTING */}
                    <div>
                        <h3 className="font-bold text-blue-700 mb-1">F. BLASTING DETAILS</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Parameters</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blasting.map((r, i) => (
                                    <React.Fragment key={i}>
                                        <tr><td>No. of Holes</td><td>{r.Noofholesblasted}</td></tr>
                                        <tr><td>Explosive (kg)</td><td>{fmt(r.ExplosiveCosumed)}</td></tr>
                                        <tr><td>Drilling (Mtr)</td><td>{fmt(r.TotalMetersDrilled)}</td></tr>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* G. REHANDLING */}
                    <div>
                        <h3 className="font-bold text-blue-700 mb-1">G. ITIZ DUMP REHANDLING</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itizRehandling.map((r, i) => (
                                    <tr key={i}>
                                        <td>Total Qty</td>
                                        <td>{fmt(r.mangQty)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* H. DUMPER-LOADER TRIP DETAILS (New Section) */}
                <div className="mt-8">
                    {/* Remarks Section moved here as requested: "Add, Remarks Below... just below that add section" 
                         Actually user said "Add, Remarks Below the ITIZ DUMP REHANDLING, just below that add section as per attachment"
                         So Section -> Remarks -> New Table? Or New Table -> Remarks?
                         "Remarks :- HEMM operation was suspended..." is shown in image ABOVE the table.
                         So Order: Itiz Rehandling -> Remarks -> New Table.
                     */}

                    {remarks.length > 0 && (
                        <div className="mb-2 p-2 border border-slate-300 bg-yellow-50 text-sm font-bold text-slate-800">
                            Remarks :- {remarks.map(r => r.Remarks).join(' | ')}
                        </div>
                    )}

                    <table className={`${styles.table} w-full text-xs`}>
                        <thead>
                            <tr style={{ backgroundColor: '#fef9c3' }}> {/* bg-yellow-100 */}
                                <th rowSpan="2" className="w-8 relative p-0 border border-slate-400" style={{ backgroundColor: '#fef9c3' }}>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold tracking-widest whitespace-nowrap" style={{ transform: 'translate(-50%, -50%) rotate(-90deg)' }}>Dumper</div>
                                </th>
                                <th rowSpan="2" className="border border-slate-400" style={{ backgroundColor: '#fef9c3' }}>FACTOR</th>
                                {dumperPivot.headers.map(h => (
                                    <th key={h.name} colSpan={h.loaders.length > 0 ? h.loaders.length : 1} className="border border-slate-400 text-red-600 font-bold" style={{ backgroundColor: '#fef9c3' }}>
                                        {h.name === 'SHIFTA' ? 'SHIFT-A' : h.name === 'SHIFTB' ? 'SHIFT-B' : 'SHIFT-C'}
                                    </th>
                                ))}
                                <th rowSpan="2" className="border border-slate-400 w-12 text-red-600 font-bold" style={{ backgroundColor: '#fef08a' }}> {/* bg-yellow-200 */}
                                    TOTAL
                                </th>
                            </tr>
                            <tr style={{ backgroundColor: '#fefce8' }}> {/* bg-yellow-50 */}
                                {dumperPivot.headers.map(h => (
                                    h.loaders.length > 0 ?
                                        h.loaders.map(l => (
                                            <th key={l} className="border border-slate-400 min-w-[30px] align-bottom h-24" style={{ backgroundColor: '#fefce8' }}>
                                                <div className="mx-auto whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                                    {l}
                                                </div>
                                            </th>
                                        ))
                                        : <th key={h.name + '-empty'} className="border border-slate-400" style={{ backgroundColor: '#fefce8' }}></th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dumperPivot.rows.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="font-bold text-left pl-1 border border-slate-300 bg-slate-50">{row.Dumper}</td>
                                    <td className="border border-slate-300">{row.Factor}</td>

                                    {dumperPivot.headers.map(h => (
                                        h.loaders.length > 0 ?
                                            h.loaders.map(l => {
                                                const val = row[h.name][l];
                                                return <td key={l} className="border border-slate-300 text-center">{val || ''}</td>
                                            })
                                            : <td key={h.name} className="border border-slate-300"></td>
                                    ))}

                                    <td className="font-bold border border-slate-300" style={{ backgroundColor: '#fef08a' }}>{row.Total}</td>
                                </tr>
                            ))}

                            {/* SUB TOTAL ROW */}
                            <tr className="font-extrabold border-t-2 border-slate-900" style={{ backgroundColor: '#fef08a' }}>
                                <td colSpan="2" className="text-right pr-2 border border-slate-400">SUB TOTAL</td>

                                {dumperPivot.headers.map(h => (
                                    h.loaders.length > 0 ?
                                        h.loaders.map(l => (
                                            <td key={l} className="border border-slate-400 text-center">
                                                {dumperPivot.grandTotals[h.name][l] || 0}
                                            </td>
                                        ))
                                        : <td key={h.name} className="border border-slate-400"></td>
                                ))}

                                <td className="border border-slate-400 text-red-600" style={{ backgroundColor: '#fef08a' }}>{dumperPivot.grandTotals.Total}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
