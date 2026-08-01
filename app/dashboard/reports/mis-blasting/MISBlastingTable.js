import React from 'react';
import styles from './MisBlasting.module.css';

export default function MISBlastingTable({ data, date }) {
    const { coal = [], ob = [] } = data || {};

    // Formatters
    const fmt2 = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    const fmt0 = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';

    // Calculate Totals
    const calcTotals = (rows) => {
        return rows.reduce((acc, row) => {
            acc.NoofHoles += row.NoofHoles || 0;
            acc.BlastedMeters += row.BlastedMeters || 0;
            acc.VolumeBCM += row.VolumeBCM || 0;
            acc.SMEQuantityKg += row.SMEQuantityKg || 0;
            return acc;
        }, { NoofHoles: 0, BlastedMeters: 0, VolumeBCM: 0, SMEQuantityKg: 0 });
    };

    const coalTotals = calcTotals(coal);
    const obTotals = calcTotals(ob);
    const grandTotals = {
        NoofHoles: coalTotals.NoofHoles + obTotals.NoofHoles,
        BlastedMeters: coalTotals.BlastedMeters + obTotals.BlastedMeters,
        VolumeBCM: coalTotals.VolumeBCM + obTotals.VolumeBCM,
        SMEQuantityKg: coalTotals.SMEQuantityKg + obTotals.SMEQuantityKg
    };

    const calcGrandAvg = (totals) => {
        const pf = totals.SMEQuantityKg > 0 ? totals.VolumeBCM / totals.SMEQuantityKg : 0;
        const avgQty = totals.NoofHoles > 0 ? totals.SMEQuantityKg / totals.NoofHoles : 0;
        return { pf, avgQty };
    };
    const grandAvgs = calcGrandAvg(grandTotals);

    const formatSpacingBurden = (val) => {
        if (val == null || val === '' || Number(val) === 0) return '-';
        return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const renderRow = (row, i, isFirst, type) => (
        <tr key={`${type}-${i}`}>
            <td className="text-left pl-2 border border-slate-400">{isFirst ? type : ''}</td>
            <td className="text-left pl-2 border border-slate-400">{row.BlastingPatchId}</td>
            <td className="text-left pl-2 border border-slate-400">{row.LocationName}</td>
            <td className="text-left pl-2 border border-slate-400">{row.SMESupplier}</td>
            <td className="text-right pr-2 font-bold border border-slate-400">{fmt0(row.NoofHoles)}</td>
            <td className="text-right pr-2 font-bold border border-slate-400">{fmt2(row.BlastedMeters)}</td>
            <td className="text-right pr-2 border border-slate-400">{formatSpacingBurden(row.Spacing)}</td>
            <td className="text-right pr-2 border border-slate-400">{formatSpacingBurden(row.Burden)}</td>
            <td className="text-right pr-2 border border-slate-400">{fmt2(row.AvgDepthMtr)}</td>
            <td className="text-right pr-2 border border-slate-400">{fmt0(row.VolumeBCM)}</td>
            <td className="text-right pr-2 border border-slate-400">{fmt0(row.SMEQuantityKg)}</td>
            <td className="text-right pr-2 bg-slate-100 border border-slate-400">{fmt2(row.PowderFactor)}</td>
            <td className="text-right pr-2 bg-yellow-100 border border-slate-400">{fmt2(row.AvgQtyPerHole)}</td>
            <td className="text-right pr-2 bg-yellow-100 border border-slate-400">{fmt2(row.DepthFactor)}</td>
            <td className="text-right pr-2 bg-yellow-100 border border-slate-400">{fmt2(row.AvgDepthFinal)}</td>
        </tr>
    );

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr className={styles.blueHeader}>
                        <th className="bg-white">Material</th>
                        <th className="bg-white">Blasting Patch Id</th>
                        <th className="bg-white">Location</th>
                        <th className="bg-white">SME Supplier</th>
                        <th className="bg-white">No of Holes</th>
                        <th className="bg-white">Blasted Meters</th>
                        <th className="bg-white">Spacing (m)</th>
                        <th className="bg-white">Burden (m)</th>
                        <th className="bg-white">Avg Depth (Mtr)</th>
                        <th className="bg-white">Volume (BCM)</th>
                        <th className="bg-white">SME Quantity (Kg)</th>
                        <th className="bg-white">Powder Factor (BCM/Kg)</th>
                        <th className="bg-white">Avg Qty per Hole</th>
                        <th className="bg-white">Depth Factor</th>
                        <th className="bg-white">Avg Depth</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Coal */}
                    {coal.length > 0 ? (
                        coal.map((row, i) => renderRow(row, i, i === 0, 'Coal'))
                    ) : (
                        <tr>
                            <td className="text-left pl-2 border border-slate-400">Coal</td>
                            <td colSpan={14} className="border border-slate-400"></td>
                        </tr>
                    )}
                    <tr className="bg-gray-200" style={{ fontWeight: 'bold' }}>
                        <td colSpan={4} className="text-left pl-2 border border-slate-400" style={{ fontWeight: 'bold' }}>Coal Total</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt0(coalTotals.NoofHoles)}</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt2(coalTotals.BlastedMeters)}</td>
                        <td colSpan={3} className="border border-slate-400"></td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt0(coalTotals.VolumeBCM)}</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt0(coalTotals.SMEQuantityKg)}</td>
                        <td colSpan={4} className="border border-slate-400"></td>
                    </tr>

                    {/* OB */}
                    {ob.length > 0 ? (
                        ob.map((row, i) => renderRow(row, i, i === 0, 'OB'))
                    ) : (
                        <tr>
                            <td className="text-left pl-2 border border-slate-400">OB</td>
                            <td colSpan={14} className="border border-slate-400"></td>
                        </tr>
                    )}
                    <tr className="bg-gray-200" style={{ fontWeight: 'bold' }}>
                        <td colSpan={4} className="text-left pl-2 border border-slate-400" style={{ fontWeight: 'bold' }}>OB Total</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt0(obTotals.NoofHoles)}</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt2(obTotals.BlastedMeters)}</td>
                        <td colSpan={3} className="border border-slate-400"></td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt0(obTotals.VolumeBCM)}</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt0(obTotals.SMEQuantityKg)}</td>
                        <td colSpan={4} className="border border-slate-400"></td>
                    </tr>

                    {/* Grand Total */}
                    <tr className="bg-yellow-200 border-t-2 border-black" style={{ fontWeight: 'bold' }}>
                        <td colSpan={4} className="text-left pl-2 border border-slate-400" style={{ fontWeight: 'bold' }}>Grand Total</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt0(grandTotals.NoofHoles)}</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt2(grandTotals.BlastedMeters)}</td>
                        <td colSpan={3} className="border border-slate-400"></td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt0(grandTotals.VolumeBCM)}</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt0(grandTotals.SMEQuantityKg)}</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt2(grandAvgs.pf)}</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmt2(grandAvgs.avgQty)}</td>
                        <td colSpan={2} className="border border-slate-400"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
