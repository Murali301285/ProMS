import React from 'react';
import styles from '../daily-production/DailyProduction.module.css'; // Reusing Daily Production styles for table look
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function ShiftReportTable({ data, date, shiftName }) {
    if (!data) return null;

    // Destructure Data
    const {
        incharge,
        sectionA_Coal, sectionA_Waste,
        sectionB_Loading,
        sectionC_Coal, sectionC_Waste,
        sectionD_Coal, sectionD_Waste,
        sectionE_Coal, sectionE_Waste
    } = data;

    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';

    const handlePrint = () => window.print();

    const handleExportExcel = () => {
        // Basic implementation
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["THRIVENI SAINIK MINING PRIVATE LIMITED"],
            ["PAKRI BARWADIH COAL MINING PROJECT"],
            [`SHIFT REPORT - ${shiftName}`, "", "", `Date: ${date}`],
            [],
            ["A. TRIP-QUANTITY DETAILS"]
        ];
        // TODO: Populate full Excel logic similar to Daily Production
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "ShiftReport");
        XLSX.writeFile(wb, `ShiftReport_${date}_${shiftName}.xlsx`);
    };

    return (
        <div className={styles.container}>
            <div className="flex justify-end gap-2 mb-4 no-print">
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
                    <h3 className="text-md mt-2 text-red-600 font-extrabold">SHIFT REPORT</h3>
                    <div className="flex justify-between items-end mt-2 px-4">
                        <div className="text-left font-bold">
                            <div>SHIFT: {shiftName}</div>
                            {/* Incharge Details - Table Layout */}
                            <div className="mt-2 text-xs">
                                <div className="font-bold border-b border-black mb-1 w-fit">Incharge</div>
                                <table className="text-left border-collapse">
                                    <tbody>
                                        {incharge.map((inc, i) => (
                                            <tr key={i}>
                                                <td className="font-bold pr-2 align-top">{inc.scalename}:</td>
                                                <td>{inc.ShiftInchare || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="text-right">Date: {date}</div>
                    </div>
                </div>

                {/* SECTION A: TRIP-QUANTITY */}
                <h3 className="font-bold text-blue-700 mb-1">A. TRIP-QUANTITY DETAILS</h3>
                <div className="flex gap-4 mb-6">
                    {/* Coal */}
                    <div className="flex-1">
                        <table className={styles.table}>
                            <thead>
                                <tr className="bg-green-100">
                                    <th className="bg-green-200">Coal</th>
                                    <th colSpan="2" className="text-red-700">SHIFT Production</th>
                                    <th colSpan="2" className="text-red-700">FTD Production</th>
                                </tr>
                                <tr>
                                    <th>Segment</th>
                                    <th>Trip</th><th>MT</th>
                                    <th>Trip</th><th>MT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sectionA_Coal.map((r, i) => (
                                    <tr key={i}>
                                        <td className="font-bold text-left pl-2">{r.Scale}</td>
                                        <td>{fmt(r.Shift_Trips)}</td><td>{fmt(r.Shift_Qty)}</td>
                                        <td>{fmt(r.FTD_Trips)}</td><td>{fmt(r.FTD_Qty)}</td>
                                    </tr>
                                ))}
                                {/* Total */}
                                <tr className="font-bold bg-yellow-200">
                                    <td className="text-right pr-2">Total</td>
                                    <td>{fmt(sectionA_Coal.reduce((s, r) => s + r.Shift_Trips, 0))}</td>
                                    <td>{fmt(sectionA_Coal.reduce((s, r) => s + r.Shift_Qty, 0))}</td>
                                    <td>{fmt(sectionA_Coal.reduce((s, r) => s + r.FTD_Trips, 0))}</td>
                                    <td>{fmt(sectionA_Coal.reduce((s, r) => s + r.FTD_Qty, 0))}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Waste */}
                    <div className="flex-1">
                        <table className={styles.table}>
                            <thead>
                                <tr className="bg-green-100">
                                    <th className="bg-green-200">Waste</th>
                                    <th colSpan="2" className="text-red-700">SHIFT Production</th>
                                    <th colSpan="2" className="text-red-700">FTD Production</th>
                                </tr>
                                <tr>
                                    <th>Segment</th>
                                    <th>Trip</th><th>BCM</th>
                                    <th>Trip</th><th>BCM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sectionA_Waste.map((r, i) => (
                                    <tr key={i}>
                                        <td className="font-bold text-left pl-2">{r.Scale}</td>
                                        <td>{fmt(r.Shift_Trips)}</td><td>{fmt(r.Shift_Qty)}</td>
                                        <td>{fmt(r.FTD_Trips)}</td><td>{fmt(r.FTD_Qty)}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold bg-yellow-200">
                                    <td className="text-right pr-2">Total</td>
                                    <td>{fmt(sectionA_Waste.reduce((s, r) => s + r.Shift_Trips, 0))}</td>
                                    <td>{fmt(sectionA_Waste.reduce((s, r) => s + r.Shift_Qty, 0))}</td>
                                    <td>{fmt(sectionA_Waste.reduce((s, r) => s + r.FTD_Trips, 0))}</td>
                                    <td>{fmt(sectionA_Waste.reduce((s, r) => s + r.FTD_Qty, 0))}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SECTION B: LOADING EQUIPMENTS */}
                <h3 className="font-bold text-blue-700 mb-1">B. LOADING EQUIPMENT'S TRIP DETAILS</h3>
                <table className={`${styles.table} mb-6`}>
                    <thead>
                        <tr className="bg-slate-200">
                            <th>LOADING EQP.</th>
                            <th>OB/IB</th>
                            <th>TOP SOIL</th>
                            <th>COAL</th>
                            <th>Total Trip</th>
                            <th>BCM</th>
                            <th>MT</th>
                            <th>W. Hr</th>
                            <th>Target Trip/Hr</th>
                            <th>Trip/Hr</th>
                            <th>Target BCM/Hr</th>
                            <th>BCM/Hr</th>
                            <th>LOCATION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sectionB_Loading.map((r, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                                <td className="font-bold text-left pl-2">{r.LoadingEquipment}</td>
                                <td>{r.OBIB_Trip || '-'}</td>
                                <td>{r.TopSoil_Trip || '-'}</td>
                                <td>{r.Coal_Trip || '-'}</td>
                                <td className="font-bold">{r.Total_Trip}</td>
                                <td>{fmt(r.BCM)}</td>
                                <td>{fmt(r.MT)}</td>
                                <td>{r.WHr}</td>
                                <td>-</td>
                                <td>{r.WHr > 0 ? (r.Total_Trip / r.WHr).toFixed(1) : '-'}</td>
                                <td>-</td>
                                <td>{r.WHr > 0 ? (r.BCM / r.WHr).toFixed(1) : '-'}</td>
                                <td className="text-xs">{r.Location}</td>
                            </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-yellow-200 font-bold border-t border-slate-900">
                            <td>TOTAL</td>
                            <td>{sectionB_Loading.reduce((s, r) => s + r.OBIB_Trip, 0)}</td>
                            <td>{sectionB_Loading.reduce((s, r) => s + r.TopSoil_Trip, 0)}</td>
                            <td>{sectionB_Loading.reduce((s, r) => s + r.Coal_Trip, 0)}</td>
                            <td>{sectionB_Loading.reduce((s, r) => s + r.Total_Trip, 0)}</td>
                            <td>{fmt(sectionB_Loading.reduce((s, r) => s + r.BCM, 0))}</td>
                            <td>{fmt(sectionB_Loading.reduce((s, r) => s + r.MT, 0))}</td>
                            <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
                        </tr>
                    </tbody>
                </table>

                {/* SECTION C: LOADING EQUIPMENT SUMMARY */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* C.1 Coal */}
                    <div>
                        <h3 className="font-bold text-blue-700 mb-1">C.1. Loading Equipment (in Coal)</h3>
                        <table className={styles.table}>
                            <thead className="bg-orange-100">
                                <tr>
                                    <th>Equip. Model</th>
                                    <th>No's</th>
                                    <th>MT/Hr</th>
                                    <th>Hr/Eq.</th>
                                    <th>MT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sectionC_Coal.map((r, i) => (
                                    <tr key={i}>
                                        <td className="text-left pl-2">{r.EquipmentModel}</td>
                                        <td>{r.EqCount}</td>
                                        <td>{(r.TotalHrs > 0 ? r.MT / r.TotalHrs : 0).toFixed(0)}</td>
                                        <td>{(r.EqCount > 0 ? r.TotalHrs / r.EqCount : 0).toFixed(1)}</td>
                                        <td>{fmt(r.MT)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* C.2 Waste */}
                    <div>
                        <h3 className="font-bold text-blue-700 mb-1">C.2. Loading Equipment (in Waste)</h3>
                        <table className={styles.table}>
                            <thead className="bg-orange-100">
                                <tr>
                                    <th>Equip. Model</th>
                                    <th>No's</th>
                                    <th>BCM/Hr</th>
                                    <th>Hr/Eq.</th>
                                    <th>BCM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sectionC_Waste.map((r, i) => (
                                    <tr key={i}>
                                        <td className="text-left pl-2">{r.EquipmentModel}</td>
                                        <td>{r.EqCount}</td>
                                        <td>{(r.TotalHrs > 0 ? r.BCM / r.TotalHrs : 0).toFixed(0)}</td>
                                        <td>{(r.EqCount > 0 ? r.TotalHrs / r.EqCount : 0).toFixed(1)}</td>
                                        <td>{fmt(r.BCM)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SECTION D: HAULING SUMMARY */}
                <h3 className="font-bold text-blue-700 mb-1">D. Hauling Equipment</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <table className={styles.table}>
                        <thead>
                            <tr className="bg-slate-100"><th colSpan="3">COAL</th><th colSpan="2">WASTE</th></tr>
                            <tr>
                                <th>Equip.</th>
                                <th>Trip</th><th>MT</th>
                                <th>Trip</th><th>BCM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Combine Equip Names? Or separate list. User image shows one list. LEFT JOIN logic implies distinct lists.
                                 Let's simulate a combined list for now or side-by-side. 
                                 Image shows: "Equip | Coal (Trip, MT) | Waste (Trip, BCM)"
                                 We have two arrays. Let's merge them by Equip Name.
                             */}
                            {(() => {
                                const models = new Set([...sectionD_Coal.map(r => r.Equip), ...sectionD_Waste.map(r => r.Equip)]);
                                return Array.from(models).map((m, i) => {
                                    const c = sectionD_Coal.find(x => x.Equip === m) || {};
                                    const w = sectionD_Waste.find(x => x.Equip === m) || {};
                                    return (
                                        <tr key={i}>
                                            <td className="text-left pl-2">{m}</td>
                                            <td>{c.Trip || '-'}</td><td>{fmt(c.MT)}</td>
                                            <td>{w.Trip || '-'}</td><td>{fmt(w.BCM)}</td>
                                        </tr>
                                    )
                                })
                            })()}
                        </tbody>
                    </table>
                </div>

                {/* SECTION E: DUMP WISE */}
                <h3 className="font-bold text-blue-700 mb-1">E. Dump Wise Quantity</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <table className={styles.table}>
                            <thead>
                                <tr className="bg-green-100"><th colSpan="3">COAL</th></tr>
                                <tr><th>Dump</th><th>Trip</th><th>MT</th></tr>
                            </thead>
                            <tbody>
                                {sectionE_Coal.map((r, i) => (
                                    <tr key={i}><td>{r.DumpWise}</td><td>{r.Trips}</td><td>{fmt(r.MT)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <table className={styles.table}>
                            <thead>
                                <tr className="bg-green-100"><th colSpan="3">WASTE</th></tr>
                                <tr><th>Dump</th><th>Trip</th><th>BCM</th></tr>
                            </thead>
                            <tbody>
                                {sectionE_Waste.map((r, i) => (
                                    <tr key={i}><td>{r.DumpWise}</td><td>{r.Trips}</td><td>{fmt(r.BCM)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
