import React from 'react';
import styles from '../daily-production/DailyProduction.module.css';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function DayWiseProductionTable({ data, date }) {
    if (!data) return null;

    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';
    const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0.00';
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

    // Calculate Grand Total
    const grand = data.reduce((acc, r) => ({
        coal: acc.coal + (r.Coal_MT || 0),
        ob: acc.ob + (r.OB_BCM || 0),
        dispatch: acc.dispatch + (r.Dispatch_MT || 0),
        total: acc.total + (r.TotalProduction_BCM || 0)
    }), { coal: 0, ob: 0, dispatch: 0, total: 0 });

    const handlePrint = () => window.print();

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const reportDate = new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' });

        const wsData = [
            ["THRIVENI SAINIK MINING PRIVATE LIMITED"],
            ["DAY WISE PRODUCTION REPORT"],
            [`Month: ${reportDate}`, "", "", "", "", `Date: ${date}`],
            [],
            ["Date", "Coal (MT)", "OB (BCM)", "Total Production", "Dispatch", "HSD (Ltr)", "Ltr/BCM", "HEMM Lead", "Mid Scale Lead", "OB Lead KM", "Coal Lead KM"]
        ];

        data.forEach(r => {
            wsData.push([
                fmtDate(r.Date),
                r.Coal_MT,
                r.OB_BCM,
                r.TotalProduction_BCM,
                r.Dispatch_MT,
                "-", "-", "-", "-", "-", "-"
            ]);
        });

        // Grand Total in Excel
        wsData.push([
            "Grand Total",
            grand.coal,
            grand.ob,
            grand.total,
            grand.dispatch,
            "-", "-", "-", "-", "-", "-"
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        // ... Styling logic omitted for brevity (similar to others) ...
        XLSX.utils.book_append_sheet(wb, ws, "DayWiseProd");
        XLSX.writeFile(wb, `DayWiseProduction_${date}.xlsx`);
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
                    <h3 className="text-lg mt-2 text-blue-700 decoration-slate-900 underline underline-offset-4">DAY WISE PRODUCTION REPORT</h3>
                    <div className="mt-2 text-sm text-slate-600">Month: {new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                </div>

                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead>
                            <tr className="bg-slate-100 text-xs font-bold text-slate-700 text-center">
                                <th className="bg-white border px-4 py-2">Date</th>
                                <th className="w-28 text-blue-700">Coal (MT)</th>
                                <th className="w-28 text-blue-700">OB (BCM)</th>
                                <th className="w-32 bg-yellow-50 text-blue-800">Total Production</th>
                                <th className="w-28 text-green-700">Dispatch</th>

                                <th className="w-24 text-slate-400">HSD (Ltr)</th>
                                <th className="w-24 text-slate-400">Ltr / BCM</th>
                                <th className="w-24 text-slate-400">HEMM Lead</th>
                                <th className="w-24 text-slate-400">Mid Scale</th>
                                <th className="w-24 text-slate-400">OB Lead KM</th>
                                <th className="w-24 text-slate-400">Coal Lead KM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((r, idx) => (
                                <tr key={idx} className="bg-white hover:bg-blue-50 border-b text-center text-sm">
                                    <td className="border-r font-medium">{fmtDate(r.Date)}</td>

                                    <td className="font-bold">{fmt(r.Coal_MT)}</td>
                                    <td className="font-bold">{fmt(r.OB_BCM)}</td>
                                    <td className="bg-yellow-50 font-bold text-blue-900">{fmt(r.TotalProduction_BCM)}</td>
                                    <td className="font-bold text-green-800">{fmt(r.Dispatch_MT)}</td>

                                    <td className="text-slate-400">-</td>
                                    <td className="text-slate-400">-</td>
                                    <td className="text-slate-400">-</td>
                                    <td className="text-slate-400">-</td>
                                    <td className="text-slate-400">-</td>
                                    <td className="text-slate-400">-</td>
                                </tr>
                            ))}

                            {/* Grand Total Row */}
                            <tr style={{ backgroundColor: '#FACC15', borderTop: '2px solid black' }}>
                                <td className="text-right pr-4 font-extrabold" style={{ color: 'black', fontSize: '1.2em' }}>Grand Total</td>

                                <td className="font-bold" style={{ color: 'black' }}>{fmt(grand.coal)}</td>
                                <td className="font-bold" style={{ color: 'black' }}>{fmt(grand.ob)}</td>
                                <td className="font-bold" style={{ color: 'black' }}>{fmt(grand.total)}</td>
                                <td className="font-bold" style={{ color: 'black' }}>{fmt(grand.dispatch)}</td>

                                <td style={{ color: 'black' }}>-</td>
                                <td style={{ color: 'black' }}>-</td>
                                <td style={{ color: 'black' }}>-</td>
                                <td style={{ color: 'black' }}>-</td>
                                <td style={{ color: 'black' }}>-</td>
                                <td style={{ color: 'black' }}>-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
