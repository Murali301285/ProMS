import React, { useMemo } from 'react';
import styles from '../daily-production/DailyProduction.module.css';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function ElectricalMonitoringTable({ data, date }) {
    if (!data) return null;

    const dateObj = new Date(date);
    const monthName = dateObj.toLocaleString('default', { month: 'short' }) + '-' + dateObj.getFullYear().toString().slice(-2);
    const dayOfMonth = dateObj.getDate();

    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';
    const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0.00';
    const fmtDec3 = (val) => val != null ? Number(val).toFixed(3) : '0.000';

    // Process Data (Flat)
    const processedData = useMemo(() => {
        return data.map(row => {
            const ftdHrs = row.FTD_WorkingHr || 0;
            const ftdTrips = row.FTD_Trips || 0;
            const ftdQty = row.FTD_Qty || 0;

            const ftmHrs = row.FTM_WorkingHr || 0;
            const ftmTrips = row.FTM_Trips || 0;
            const ftmQty = row.FTM_Qty || 0;

            const ftdTripsHr = ftdHrs > 0 ? ftdTrips / ftdHrs : 0;
            const ftdBCMHr = ftdHrs > 0 ? ftdQty / ftdHrs : 0;

            const ftmTripsHr = ftmHrs > 0 ? ftmTrips / ftmHrs : 0;
            const ftmBCMHr = ftmHrs > 0 ? ftmQty / ftmHrs : 0;

            const dom = row.DayOfMonth || dayOfMonth || 1;
            const mtdAvgBCMDay = ftmQty / dom;

            return {
                ...row,
                metrics: {
                    ftdTripsHr,
                    ftdBCMHr,
                    ftmTripsHr,
                    ftmBCMHr,
                    mtdAvgBCMDay
                }
            };
        });
    }, [data, dayOfMonth]);

    // Calculate Grand Total
    const grand = data.reduce((acc, r) => ({
        ftdHrs: acc.ftdHrs + (r.FTD_WorkingHr || 0),
        ftdTrips: acc.ftdTrips + (r.FTD_Trips || 0),
        ftdQty: acc.ftdQty + (r.FTD_Qty || 0),
        ftmHrs: acc.ftmHrs + (r.FTM_WorkingHr || 0),
        ftmTrips: acc.ftmTrips + (r.FTM_Trips || 0),
        ftmQty: acc.ftmQty + (r.FTM_Qty || 0),
    }), { ftdHrs: 0, ftdTrips: 0, ftdQty: 0, ftmHrs: 0, ftmTrips: 0, ftmQty: 0 });

    const grandFtdTripsHr = grand.ftdHrs > 0 ? grand.ftdTrips / grand.ftdHrs : 0;
    const grandFtdBCMHr = grand.ftdHrs > 0 ? grand.ftdQty / grand.ftdHrs : 0;
    const grandFtmTripsHr = grand.ftmHrs > 0 ? grand.ftmTrips / grand.ftmHrs : 0;
    const grandFtmBCMHr = grand.ftmHrs > 0 ? grand.ftmQty / grand.ftmHrs : 0;
    const grandMtdAvg = grand.ftmQty / (dayOfMonth || 1);

    const handlePrint = () => window.print();

    const handleExportExcel = () => {
        alert("Excel Export to be implemented after UI verification.");
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
                    <h3 className="text-lg mt-2 text-blue-700 decoration-slate-900 underline underline-offset-4">ELECTRICAL EQUIPMENTS MONITORING REPORT</h3>
                    <div className="mt-2 text-sm text-slate-600">Date: {date}</div>
                </div>

                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead>
                            <tr className="bg-orange-100 text-slate-800">
                                <th colSpan="2" className="bg-white border-none"></th>
                                <th colSpan="10" className="bg-rose-100 text-center border font-bold">F. T. D ({date})</th>
                                <th colSpan="5" className="bg-amber-100 text-center border font-bold">F. T. M : {monthName}</th>
                            </tr>

                            <tr className="bg-slate-100 text-xs font-bold text-slate-700 text-center">
                                <th className="bg-white border text-left px-2">Equipment Name</th>
                                <th className="bg-white border text-left px-2">Sector</th>

                                {/* FTD 10 Cols */}
                                <th className="w-20 text-red-600">Target Trip/Hr</th>
                                <th className="w-20">Achieved Trip/Hr</th>
                                <th className="w-24 text-red-600">Target BCM/Hr</th>
                                <th className="w-24">Achieved BCM/Hr</th>
                                <th className="w-20 text-red-600">Target Unit/Hr</th>
                                <th className="w-20">Achieved Unit/Hr</th>
                                <th className="w-20 text-red-600">Target Unit/BCM</th>
                                <th className="w-20">Achieved Unit/BCM</th>
                                <th className="w-24">Total BCM</th>
                                <th className="w-20">OB Hrs</th>

                                {/* FTM 5 Cols */}
                                <th className="w-20">Achieved Trip/Hr</th>
                                <th className="w-24">Achieved BCM(MT)/Hr</th>
                                <th className="w-20">Achieved Unit/Hr</th>
                                <th className="w-20">Achieved Unit/BCM</th>
                                <th className="w-24">MTD Average BCM/Day</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.map((r, idx) => (
                                <tr key={idx} className="bg-white hover:bg-blue-50 border-b text-center text-sm">
                                    <td className="text-left pl-2 font-medium border-r">{r.EquipmentName}</td>
                                    <td className="text-left pl-2 text-slate-600 border-r">{r.SectorName}</td>

                                    {/* FTD */}
                                    <td className="text-red-500">-</td>
                                    <td className="font-bold text-blue-700">{fmtDec2(r.metrics.ftdTripsHr)}</td>
                                    <td className="text-red-500">-</td>
                                    <td className="font-bold text-blue-700">{fmtDec2(r.metrics.ftdBCMHr)}</td>
                                    <td className="text-red-500">-</td>
                                    <td>-</td>
                                    <td className="text-red-500">-</td>
                                    <td>-</td>
                                    <td className="font-bold">{fmt(r.FTD_Qty)}</td>
                                    <td>{fmtDec2(r.FTD_WorkingHr)}</td>

                                    {/* FTM */}
                                    <td className="bg-amber-50 font-bold">{fmtDec2(r.metrics.ftmTripsHr)}</td>
                                    <td className="bg-amber-50 font-bold">{fmtDec2(r.metrics.ftmBCMHr)}</td>
                                    <td className="bg-amber-50">-</td>
                                    <td className="bg-amber-50">-</td>
                                    <td className="bg-amber-50 font-bold">{fmtDec2(r.metrics.mtdAvgBCMDay)}</td>
                                </tr>
                            ))}

                            {/* Grand Total Row */}
                            <tr style={{ backgroundColor: '#FACC15', borderTop: '2px solid black' }}>
                                <td colSpan="2" className="text-right pr-4 font-extrabold" style={{ color: 'black', fontSize: '1.2em' }}>Grand Total</td>

                                {/* FTD */}
                                <td>-</td>
                                <td className="font-bold" style={{ color: 'black' }}>{fmtDec2(grandFtdTripsHr)}</td>
                                <td>-</td>
                                <td className="font-bold" style={{ color: 'black' }}>{fmtDec2(grandFtdBCMHr)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td className="font-bold" style={{ color: 'black' }}>{fmt(grand.ftdQty)}</td>
                                <td className="font-bold" style={{ color: 'black' }}>{fmtDec2(grand.ftdHrs)}</td>

                                {/* FTM */}
                                <td className="font-bold" style={{ color: 'black' }}>{fmtDec2(grandFtmTripsHr)}</td>
                                <td className="font-bold" style={{ color: 'black' }}>{fmtDec2(grandFtmBCMHr)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td className="font-bold" style={{ color: 'black' }}>{fmtDec2(grandMtdAvg)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
