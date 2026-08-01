"use client";
import { useState, useEffect } from 'react';
import LoadingOverlay from '@/components/LoadingOverlay';
import { RotateCcw, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';
import MISBlastingTable from './MISBlastingTable';
import styles from './MisBlasting.module.css';

export default function MISBlastingPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/mis-blasting?date=${date}`);
            const result = await res.json();
            if (result.error) throw new Error(result.error);
            setData(result);
            toast.success("Report loaded successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to load report");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleShow = () => fetchData();
    const handleReset = () => {
        setDate(today);
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `MIS_Blasting_Report_${date}`;
        setTimeout(() => {
            window.print();
            document.title = originalTitle;
        }, 500);
    };

    const handleExportExcel = async () => {
        if (!data) return;
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const { coal, ob } = data;
            const calcTotals = (rows) => rows.reduce((acc, row) => ({
                NoofHoles: acc.NoofHoles + (row.NoofHoles || 0),
                BlastedMeters: acc.BlastedMeters + (row.BlastedMeters || 0),
                VolumeBCM: acc.VolumeBCM + (row.VolumeBCM || 0),
                SMEQuantityKg: acc.SMEQuantityKg + (row.SMEQuantityKg || 0)
            }), { NoofHoles: 0, BlastedMeters: 0, VolumeBCM: 0, SMEQuantityKg: 0 });

            const coalTotals = calcTotals(coal || []);
            const obTotals = calcTotals(ob || []);
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

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('MIS Blasting');

            // 1. Column Widths Setup
            ws.columns = [
                { width: 3 },  // A: Padding
                { width: 14 }, // B: Material
                { width: 20 }, // C: Blasting Patch Id
                { width: 18 }, // D: Location
                { width: 18 }, // E: SME Supplier
                { width: 14 }, // F: No of Holes
                { width: 16 }, // G: Blasted Meters
                { width: 14 }, // H: Spacing
                { width: 14 }, // I: Burden
                { width: 16 }, // J: Avg Depth (Mtr)
                { width: 16 }, // K: Volume (BCM)
                { width: 18 }, // L: SME Quantity (Kg)
                { width: 22 }, // M: Powder Factor
                { width: 18 }, // N: Avg Qty per Hole
                { width: 14 }, // O: Depth Factor
                { width: 14 }, // P: Avg Depth
            ];

            // Add Logo
            let logoId;
            try {
                const logoRes = await fetch('/Asset/Logo.png');
                const arrayBuffer = await logoRes.arrayBuffer();
                logoId = wb.addImage({
                    buffer: arrayBuffer,
                    extension: 'png',
                });
            } catch (e) {
                console.error('Logo add failed', e);
            }

            const setCell = (cell, value, opts = {}) => {
                if (value !== undefined) cell.value = value;
                cell.font = {
                    name: 'Calibri',
                    size: opts.fontSize || 10,
                    bold: opts.bold || false,
                    underline: opts.underline || false,
                    color: { argb: opts.color || 'FF000000' }
                };
                cell.alignment = {
                    horizontal: opts.align || 'center',
                    vertical: 'middle',
                    wrapText: true
                };
                if (opts.bg) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.bg } };
                }
                if (opts.border !== false) {
                    cell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' },
                        bottom: { style: 'thin' }, right: { style: 'thin' }
                    };
                }
                if (opts.numFmt) {
                    cell.numFmt = opts.numFmt;
                }
            };

            // 2. Headers
            ws.getRow(1).height = 15;

            ws.mergeCells(`B2:P2`);
            setCell(ws.getCell('B2'), (process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"), { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(`B3:P3`);
            setCell(ws.getCell('B3'), (process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"), { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(`B4:P4`);
            setCell(ws.getCell('B4'), "MIS BLASTING REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 13, color: 'FFDC2626' });

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 160, height: 60 }
                });
            }

            ws.mergeCells('B5:D5');
            const fmtDate = date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';
            setCell(ws.getCell('B5'), `Blasting Date: ${fmtDate}`, { bold: true, align: 'left', border: false });

            // Space
            ws.getRow(6).height = 10;

            // 3. Table Headers
            const headerRow = ws.getRow(7);
            headerRow.height = 30;
            const headers = [
                "Material", "Blasting Patch Id", "Location", "SME Supplier",
                "No of Holes", "Blasted Meters", "Spacing (m)", "Burden (m)", "Avg Depth (Mtr)",
                "Volume (BCM)", "SME Quantity (Kg)", "Powder Factor (BCM/Kg)",
                "Avg Qty per Hole", "Depth Factor", "Avg Depth"
            ];
            headers.forEach((h, i) => {
                setCell(ws.getCell(7, i + 2), h, { bold: true, bg: 'FFEAEAEA' });
            });

            // Freeze panes
            ws.views = [
                { state: 'frozen', xSplit: 0, ySplit: 7 }
            ];

            let currentRow = 8;
            const fmtDec2 = '#,##0.00';
            const fmtDec0 = '#,##0';

            const addDataRow = (row, materialName = '', isTotal = false, bg = null) => {
                let startCol = 2;
                setCell(ws.getCell(currentRow, startCol++), materialName || row.MaterialName, { align: 'left', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.BlastingPatchId || "", { align: 'left', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.LocationName || "", { align: 'left', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.SMESupplier || "", { align: 'left', bold: isTotal, bg: bg });

                setCell(ws.getCell(currentRow, startCol++), row.NoofHoles || 0, { numFmt: fmtDec0, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.BlastedMeters || 0, { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), isTotal ? "" : ((row.Spacing == null || row.Spacing === 0 || row.Spacing === '') ? "-" : row.Spacing), { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), isTotal ? "" : ((row.Burden == null || row.Burden === 0 || row.Burden === '') ? "-" : row.Burden), { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.AvgDepthMtr || "", { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });

                setCell(ws.getCell(currentRow, startCol++), row.VolumeBCM || 0, { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.SMEQuantityKg || 0, { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.PowderFactor || "", { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.AvgQtyPerHole || "", { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.DepthFactor || "", { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.AvgDepthFinal || "", { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });

                currentRow++;
            };

            // COAL Data
            if (coal && coal.length > 0) {
                coal.forEach((row, i) => addDataRow(row, i === 0 ? 'Coal' : ''));
            }
            addDataRow({ NoofHoles: coalTotals.NoofHoles, BlastedMeters: coalTotals.BlastedMeters, VolumeBCM: coalTotals.VolumeBCM, SMEQuantityKg: coalTotals.SMEQuantityKg }, "Coal Total", true, "FFF5F5F5");

            // Empty row inside table mapping
            let startCol = 2;
            for (let i = 0; i < 15; i++) setCell(ws.getCell(currentRow, startCol++), "");
            currentRow++;

            // OB Data
            if (ob && ob.length > 0) {
                ob.forEach((row, i) => addDataRow(row, i === 0 ? 'OB' : ''));
            }
            addDataRow({ NoofHoles: obTotals.NoofHoles, BlastedMeters: obTotals.BlastedMeters, VolumeBCM: obTotals.VolumeBCM, SMEQuantityKg: obTotals.SMEQuantityKg }, "OB Total", true, "FFF5F5F5");

            // Empty row inside table mapping
            startCol = 2;
            for (let i = 0; i < 15; i++) setCell(ws.getCell(currentRow, startCol++), "");
            currentRow++;

            // Grand Total
            ws.getRow(currentRow).height = 20;
            addDataRow({
                NoofHoles: grandTotals.NoofHoles,
                BlastedMeters: grandTotals.BlastedMeters,
                VolumeBCM: grandTotals.VolumeBCM,
                SMEQuantityKg: grandTotals.SMEQuantityKg,
                PowderFactor: grandAvgs.pf,
                AvgQtyPerHole: grandAvgs.avgQty
            }, "Grand Total", true, "FFEAEAEA");

            const buf = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buf]), `MIS_Blasting_Report_${date}.xlsx`);
            toast.success("Excel Downloaded Successfully");

        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error("Failed to export Excel");
        }
    };

    return (
        <div className={styles.container}>
            {loading && <LoadingOverlay message="Generating Report..." />}

            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>MIS Blasting Report</h1>
                <p className={styles.subtitle}>Daily blasting and performance summary</p>
            </div>

            <div className={styles.filterContainer}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Date</label>
                    <input type="date" className={styles.input} value={date} max={today} onChange={e => setDate(e.target.value)} />
                </div>
                <button onClick={handleShow} className={styles.generateBtn}>Show Report</button>
                <div style={{ flex: 1 }}></div>
                {data && (
                    <>
                        <button onClick={handlePrint} className={styles.actionBtn}>
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={handleExportExcel} className={`${styles.actionBtn} ${styles.excel}`}>
                            <Download size={16} /> Excel
                        </button>
                    </>
                )}
            </div>

            {data && (
                <div className={styles.reportSheet} id="print-area">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', width: '100%', position: 'relative', minHeight: '110px' }}>
                        {/* Logo - Positioned left */}
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                            <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '96px', objectFit: 'contain' }} />
                        </div>

                        {/* Text Block - Centered */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <h1 style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"}</h1>
                            <h2 style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginTop: '0.25rem' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"}</h2>
                            <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase', marginTop: '0.25rem', marginBottom: '0.5rem', textDecoration: 'underline' }}>MIS Blasting Report</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', fontSize: '0.875rem', lineHeight: '1.25rem', color: '#334155', fontWeight: '500' }}>
                                <div>Date: {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').replace(/\//g, '-')}</div>
                            </div>
                        </div>
                    </div>
                    <MISBlastingTable data={data} date={date} />
                </div>
            )}
        </div>
    );
}

