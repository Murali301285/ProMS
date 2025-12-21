import React, { useMemo } from 'react';
import styles from '../daily-production/DailyProduction.module.css';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function SectorWiseProductionTable({ data, date }) {
    if (!data) return null;

    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';
    const fmtDec = (val) => val != null ? Number(val).toFixed(2) : '0.00';

    // Group Data by Sector
    const groupedData = useMemo(() => {
        const groups = {};
        data.forEach(row => {
            const sector = row.SectorName || 'Unknown';
            if (!groups[sector]) groups[sector] = [];
            groups[sector].push(row);
        });
        return groups;
    }, [data]);

    const sectors = Object.keys(groupedData).sort();

    const handlePrint = () => window.print();

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["THRIVENI SAINIK MINING PRIVATE LIMITED"],
            ["PAKRI BARWADIH COAL MINING PROJECT"],
            [`SECTOR WISE PRODUCTION REPORT`, "", "", `Date: ${date}`],
            [],
            ["Si No", "Equipment Name", "Patch", "Trip", "Qty(BCM)", "OB Hrs", "Target BCM/Hr", "BCM/Hr", "Method"]
        ];

        let grandTrips = 0, grandQty = 0, grandHrs = 0;

        sectors.forEach((sector, sIdx) => {
            const rows = groupedData[sector];
            // Sector Header
            wsData.push([String.fromCharCode(65 + sIdx) + ". " + sector, "", "", "", "", "", "", "", ""]); // A. Sector-1

            let secTrips = 0, secQty = 0, secHrs = 0;

            rows.forEach((r, rIdx) => {
                wsData.push([
                    rIdx + 1,
                    r.EquipmentName,
                    r.PatchName,
                    r.Trips,
                    r.QtyBCM,
                    r.OBHrs,
                    r.TargetBCMHr,
                    Number(r.BCMHr).toFixed(2),
                    r.MethodName
                ]);
                secTrips += (r.Trips || 0);
                secQty += (r.QtyBCM || 0);
                secHrs += (r.OBHrs || 0);
            });

            // Sector Total
            wsData.push([
                "Total", "", "",
                secTrips,
                secQty,
                secHrs.toFixed(1),
                "-",
                secHrs > 0 ? (secQty / secHrs).toFixed(2) : "0.00",
                ""
            ]);

            grandTrips += secTrips;
            grandQty += secQty;
            grandHrs += secHrs;
        });

        // Grand Total
        wsData.push([
            "Grand Total", "", "",
            grandTrips,
            grandQty,
            grandHrs.toFixed(1),
            "-",
            grandHrs > 0 ? (grandQty / grandHrs).toFixed(2) : "0.00",
            ""
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "SectorWise");
        XLSX.writeFile(wb, `SectorWiseProduction_${date}.xlsx`);
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
                <div className="text-center mb-6 uppercase font-bold text-slate-800">
                    <h1 className="text-xl">THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                    <h2 className="text-lg">PAKRI BARWADIH COAL MINING PROJECT</h2>
                    <h3 className="text-lg mt-2 text-blue-700 decoration-slate-900 underline underline-offset-4">SECTOR WISE PRODUCTION REPORT</h3>
                    <div className="mt-2 text-sm text-slate-600">Date: {date}</div>
                </div>

                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead className="bg-orange-100 text-slate-800">
                            <tr>
                                <th className="w-12">Si No</th>
                                <th>Equipment Name</th>
                                <th>Patch</th>
                                <th>Trip</th>
                                <th>Qty(BCM)</th>
                                <th>OB Hrs</th>
                                <th>Target BCM/Hr</th>
                                <th>BCM/Hr</th>
                                <th>Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sectors.map((sector, sIdx) => {
                                const rows = groupedData[sector];

                                // Sector Totals
                                const secTrips = rows.reduce((s, r) => s + (r.Trips || 0), 0);
                                const secQty = rows.reduce((s, r) => s + (r.QtyBCM || 0), 0);
                                const secHrs = rows.reduce((s, r) => s + (r.OBHrs || 0), 0);
                                const secEff = secHrs > 0 ? secQty / secHrs : 0;

                                return (
                                    <React.Fragment key={sector}>
                                        {/* Sector Header - Inline Style Force */}
                                        <tr style={{ backgroundColor: '#C7D2FE', borderBottom: '1px solid #818CF8' }}>
                                            <td colSpan="9" className="pl-4 py-2" style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1E1B4B' }}>
                                                {String.fromCharCode(65 + sIdx)}. <span style={{ textDecoration: 'underline' }}>{sector}</span>
                                            </td>
                                        </tr>
                                        {/* Rows */}
                                        {rows.map((r, rIdx) => (
                                            <tr key={rIdx} className="bg-white hover:bg-slate-50 border-b border-slate-100">
                                                <td className="text-center">{rIdx + 1}</td>
                                                <td className="text-left pl-2 font-medium">{r.EquipmentName}</td>
                                                <td>{r.PatchName}</td>
                                                <td>{r.Trips}</td>
                                                <td>{fmt(r.QtyBCM)}</td>
                                                <td>{r.OBHrs?.toFixed(1) || '-'}</td>
                                                <td>{r.TargetBCMHr || 0}</td>
                                                <td className="font-bold text-slate-700">{fmtDec(r.BCMHr)}</td>
                                                <td>{r.MethodName}</td>
                                            </tr>
                                        ))}
                                        {/* Sector Subtotal - Inline Style Force */}
                                        <tr style={{ backgroundColor: '#A5B4FC', borderTop: '1px solid #6366F1', color: '#1E1B4B' }}>
                                            <td colSpan="3" className="text-right pr-4 py-2" style={{ fontWeight: '800' }}>Total ({sector})</td>
                                            <td style={{ fontWeight: '700' }}>{secTrips}</td>
                                            <td style={{ fontWeight: '700' }}>{fmt(secQty)}</td>
                                            <td style={{ fontWeight: '700' }}>{secHrs.toFixed(1)}</td>
                                            <td>-</td>
                                            <td style={{ fontWeight: '700' }}>{fmtDec(secEff)}</td>
                                            <td></td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}

                            {/* Grand Total - Inline Style Force */}
                            <tr style={{ backgroundColor: '#FACC15', borderTop: '2px solid black', color: 'black' }}>
                                <td colSpan="3" className="text-right pr-4 py-3" style={{ fontWeight: '900', fontSize: '1.1rem' }}>Grand Total</td>
                                <td style={{ fontWeight: '900' }}>{data.reduce((s, r) => s + (r.Trips || 0), 0)}</td>
                                <td style={{ fontWeight: '900' }}>{fmt(data.reduce((s, r) => s + (r.QtyBCM || 0), 0))}</td>
                                <td style={{ fontWeight: '900' }}>{data.reduce((s, r) => s + (r.OBHrs || 0), 0).toFixed(1)}</td>
                                <td>-</td>
                                <td style={{ fontWeight: '900' }}>
                                    {(() => {
                                        const tQty = data.reduce((s, r) => s + (r.QtyBCM || 0), 0);
                                        const tHrs = data.reduce((s, r) => s + (r.OBHrs || 0), 0);
                                        return tHrs > 0 ? fmtDec(tQty / tHrs) : "0.00";
                                    })()}
                                </td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
