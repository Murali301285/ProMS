
'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import styles from './DataTable.module.css';

export default function DataTable({ columns, data, searchable = true, defaultSort = null, fileName = 'export', loading = false }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState(defaultSort || { key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filter
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        return data.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [data, searchTerm]);

    // Sort
    const sortedData = useMemo(() => {
        let sortableItems = [...filteredData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredData, sortConfig]);

    // Pagination
    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(sortedData.length / pageSize);
    const paginatedData = useMemo(() => {
        if (pageSize === 'ALL') return sortedData;
        const startIndex = (currentPage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, currentPage, pageSize]);

    // Handlers
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
        setCurrentPage(1);
    };

    const handleDownload = () => {
        if (!sortedData.length) return;
        const headers = columns.filter(c => c.accessor !== 'actions').map(col => col.header).join(',');
        const rows = sortedData.map((row, index) =>
            columns.filter(c => c.accessor !== 'actions').map(col => {
                // Special handling for SlNo
                if (col.accessor === 'SlNo') return index + 1;

                let cellData = row[col.accessor];
                // Special handling for Booleans
                if (typeof cellData === 'boolean') {
                    if (col.header?.includes('Status') || col.accessor?.includes('IsActive') || col.accessor?.includes('IsDetail')) {
                        return cellData ? 'Active' : 'Inactive';
                    }
                    return cellData ? 'Yes' : 'No';
                }

                if (cellData === null || cellData === undefined) return '';
                return `"${String(cellData).replace(/"/g, '""')}"`;
            }).join(',')
        );
        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleExcelDownload = () => {
        if (!sortedData.length) return;

        // 1. Prepare Data
        // Filter out 'Actions' column
        const validCols = columns.filter(c => c.accessor !== 'actions');

        // Map data to simple objects
        const tableData = sortedData.map((row, index) => {
            const obj = {};
            validCols.forEach(col => {
                let val = row[col.accessor];

                // Special handling for SlNo
                if (col.accessor === 'SlNo') {
                    val = index + 1;
                }
                // Special handling for Booleans
                else if (typeof val === 'boolean') {
                    if (col.header?.includes('Status') || col.accessor?.includes('IsActive') || col.accessor?.includes('IsDetail')) {
                        val = val ? 'Active' : 'Inactive';
                    } else {
                        val = val ? 'Yes' : 'No';
                    }
                }
                else if (val === null || val === undefined) {
                    val = '';
                }

                obj[col.header] = val;
            });
            return obj;
        });

        // 2. Create Worksheet
        const ws = XLSX.utils.json_to_sheet(tableData, { origin: 'A2' }); // Start at A2 to leave room for Title

        // 3. Add Page Header (Merged Title)
        XLSX.utils.sheet_add_aoa(ws, [[`Master Report: ${fileName}`]], { origin: 'A1' });

        // Merge A1 across all columns
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: validCols.length - 1 } });

        // STYLE: Apply Bold to Title (A1)
        if (!ws['A1'].s) ws['A1'].s = {};
        ws['A1'].s = { font: { bold: true, sz: 14 } };

        // STYLE: Apply Bold to Headers (Row 2, i.e., index 1)
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: 1, c: C });
            if (!ws[address]) continue;
            if (!ws[address].s) ws[address].s = {};
            ws[address].s = { font: { bold: true }, fill: { fgColor: { rgb: "EEEEEE" } } };
        }

        // 4. Auto-Fit Columns
        const colWidths = validCols.map(col => {
            // Header width
            let maxLen = col.header.length;
            // Content width (check first 50 rows for performance)
            sortedData.slice(0, 50).forEach(row => {
                const val = String(row[col.accessor] || '');
                if (val.length > maxLen) maxLen = val.length;
            });
            return { wch: maxLen + 2 }; // +2 padding
        });
        ws['!cols'] = colWidths;

        // 5. Add Footer (Timestamp)
        const footerRow = tableData.length + 3; // 1 (Title) + 1 (Header) + Data + 1 (Spacer)
        const footerVal = `Downloaded on: ${new Date().toLocaleString()}`;
        XLSX.utils.sheet_add_aoa(ws, [[footerVal]], { origin: `A${footerRow}` });

        // STYLE: Apply Bold to Footer
        const footerAddress = `A${footerRow}`;
        if (ws[footerAddress]) {
            if (!ws[footerAddress].s) ws[footerAddress].s = {};
            ws[footerAddress].s = { font: { bold: true, italic: true } };
        }

        // 6. Style Fixes (Bold Headers - Basic XLSX doesn't support styles in free version, but structure helps)
        // Note: SheetJS Pro is needed for full styling, but this structure provides the layout requested.

        // 7. Save File
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, fileName.substring(0, 30)); // Sheet name max 31 chars
        XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className={styles.container}>
            {/* Top Bar: Search & Actions */}
            <div className={styles.topBar}>
                {searchable && (
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className={styles.searchInput}
                        />
                    </div>
                )}

                <div className={styles.actions}>
                    <button
                        onClick={handleExcelDownload}
                        className={styles.exportBtn}
                        title="Download Excel"
                        style={{ marginRight: '8px', color: '#16a34a', borderColor: '#16a34a' }}
                    >
                        <FileSpreadsheet size={16} /> Excel
                    </button>
                    <button
                        onClick={handleDownload}
                        className={styles.exportBtn}
                        title="Download CSV"
                    >
                        <Download size={16} /> CSV
                    </button>

                    <select
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        className={styles.pageSize}
                    >
                        <option value={10}>Show 10</option>
                        <option value={20}>Show 20</option>
                        <option value={50}>Show 50</option>
                        <option value="ALL">Show All</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
                {loading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner}></div>
                        <span>Loading data...</span>
                    </div>
                )}
                <table className={styles.table}>
                    <thead className={styles.thead}>
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={styles.th}
                                    onClick={() => col.sortable !== false && requestSort(col.accessor)}
                                    style={{ width: col.width }}
                                >
                                    <div className={styles.thContent} style={{ justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                                        {col.header}
                                        {col.sortable !== false && (
                                            <ArrowUpDown
                                                size={12}
                                                className={`${styles.sortIcon} ${sortConfig.key === col.accessor ? styles.active : ''}`}
                                            />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={styles.tbody}>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, rIdx) => (
                                <tr key={row.id || row.SlNo || rIdx} className={styles.tr}>
                                    {columns.map((col, cIdx) => (
                                        <td key={cIdx} className={styles.td} style={{ textAlign: col.align || 'left' }}>
                                            {col.render ? col.render(row, (pageSize === 'ALL' ? 0 : (currentPage - 1) * pageSize) + rIdx + 1) : (row[col.accessor] !== null && row[col.accessor] !== undefined ? row[col.accessor] : '-')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className={styles.emptyRow}>
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Stats & Pagination */}
            <div className={styles.footer}>
                <div>
                    Showing {pageSize === 'ALL' ? 1 : Math.min((currentPage - 1) * pageSize + 1, sortedData.length)} to {pageSize === 'ALL' ? sortedData.length : Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
                </div>

                {pageSize !== 'ALL' && totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className={styles.pageBtn}
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={styles.pageBtn}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={styles.pageBtn}
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className={styles.pageBtn}
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
