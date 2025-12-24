'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Search, ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight, Filter, X, Download } from 'lucide-react';
import styles from './DataTable.module.css';
import * as XLSX from 'xlsx-js-style';

/**
 * Standardized DataTable Component
 * Features: Sticky Header, Internal Filtering, Advanced Pagination, Sorting, Excel Export
 */
export default function DataTable({
    columns = [],
    data = [],
    loading = false,
    fileName = 'Export',
    defaultSort = { key: 'SlNo', direction: 'asc' },
    showSerialNo = true, // New Prop: Toggle Serial Number
    reportHeader = null, // New Prop: For Fancy Export Header { title, fromDate, toDate }
    enableColumnVisibility = false, // New Prop: Helper to show/hide column toggle if needed (default visible in my implementation above)
    customHeight = null, // New Prop: Allow overriding default height
    stickyLeft = 0 // New Prop: Number of columns to stick to the left
}) {
    const tableContainerRef = useRef(null);

    // --- Local State ---
    const [globalSearch, setGlobalSearch] = useState('');
    const [sortConfig, setSortConfig] = useState(defaultSort);
    const [columnFilters, setColumnFilters] = useState({}); // { key: Set([val1, val2]) }
    const [columnVisibility, setColumnVisibility] = useState({}); // { key: true/false }
    const [activeFilterCol, setActiveFilterCol] = useState(null); // Which dropdown is open

    const [activeFilterSearch, setActiveFilterSearch] = useState(''); // Search text for open filter
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // --- Derived Data (Memoized) ---

    // 1. Get Unique Values for Filters
    const uniqueValues = useMemo(() => {
        const values = {};
        columns.forEach(col => {
            if (col.accessor) {
                const distinct = new Set(data.map(row => {
                    // Start render logic simulation for lookup values
                    // Actually, data passed to DataTable is usually pre-rendered or raw? 
                    // MasterTable passes raw data. The filtering should happen on raw values or rendered?
                    // Usually filtering on DISPLAY values is more user friendly, but checking raw is faster.
                    // For now, let's filter on raw values.
                    return row[col.accessor];
                }));
                values[col.accessor] = Array.from(distinct)
                    .filter(v => v !== null && v !== undefined && v !== '')
                    .sort();
            }
        });
        return values;
    }, [data, columns]);

    // 2. Filter & Global Search
    const filteredData = useMemo(() => {
        let res = data;

        // Global Search
        if (globalSearch) {
            const lowerSearch = globalSearch.toLowerCase();
            res = res.filter(row =>
                Object.values(row).some(v => String(v).toLowerCase().includes(lowerSearch))
            );
        }

        // Column Filters
        Object.keys(columnFilters).forEach(key => {
            const selectedSet = columnFilters[key];
            if (selectedSet && selectedSet.size > 0) {
                res = res.filter(row => selectedSet.has(row[key]));
            }
        });

        return res;
    }, [data, globalSearch, columnFilters]);

    // 3. Sort
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;
        const sorted = [...filteredData].sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredData, sortConfig]);

    // 4. Pagination
    const totalItems = sortedData.length;
    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(totalItems / pageSize);
    const paginatedData = useMemo(() => {
        if (pageSize === 'ALL') return sortedData;
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    // --- Handlers ---

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const toggleFilter = (colKey, value) => {
        setColumnFilters(prev => {
            const prevSet = prev[colKey] || new Set();
            const newSet = new Set(prevSet);
            if (newSet.has(value)) newSet.delete(value);
            else newSet.add(value);

            // If empty, remove key
            if (newSet.size === 0) {
                const { [colKey]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [colKey]: newSet };
        });
        setCurrentPage(1);
    };

    const handleSelectAll = (colKey) => {
        const allVals = uniqueValues[colKey];
        setColumnFilters(prev => ({ ...prev, [colKey]: new Set(allVals) }));
        setCurrentPage(1);
    };

    const handleClearFilter = (colKey) => {
        setColumnFilters(prev => {
            const { [colKey]: _, ...rest } = prev;
            return rest;
        });
        setCurrentPage(1);
    };

    const toggleColumnVisibility = (key) => {
        setColumnVisibility(prev => ({
            ...prev,
            [key]: prev[key] === undefined ? false : !prev[key]
        }));
    };

    const handleExport = () => {
        // Export logic (Excel)
        const visibleCols = columns.filter(c => c.accessor !== 'actions' && (c.accessor !== 'SlNo' || showSerialNo) && columnVisibility[c.accessor] !== false);
        const headers = visibleCols.map(c => c.header || c.accessor);

        // Use filteredData (all rows matching filter) instead of sortedData (which is also filtered but sorted)
        // Actually usually export respect sort too. So sortedData is fine.
        const rows = sortedData.map((row, idx) => visibleCols.map(c => {
            let val = row[c.accessor];
            if (c.accessor === 'SlNo') val = idx + 1;
            return val || '';
        }));

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

        // --- Custom Styling if ReportHeader is present ---
        if (reportHeader) {
            // Unshift Headers for Report Title
            XLSX.utils.sheet_add_aoa(ws, [
                [`${reportHeader.title} - From: ${reportHeader.fromDate} To: ${reportHeader.toDate}`],
                headers // Re-add headers at row 2
            ], { origin: "A1" });

            // Re-add data starting at A3
            XLSX.utils.sheet_add_aoa(ws, rows, { origin: "A3" });

            // Merge First Row
            if (!ws['!merges']) ws['!merges'] = [];
            ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } });

            // Style Title (Row 0)
            const titleCell = ws[XLSX.utils.encode_cell({ c: 0, r: 0 })];
            if (titleCell) {
                titleCell.s = {
                    font: { bold: true, sz: 14, color: { rgb: "000000" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
            }
        } else {
            // Standard Export (Headers at A1)
            // Already done by aoa_to_sheet
            // Just Style Headers
        }

        // Style Column Headers (Row 1 if reportHeader, else Row 0)
        const headerRowIdx = reportHeader ? 1 : 0;
        headers.forEach((_, i) => {
            const cellRef = XLSX.utils.encode_cell({ c: i, r: headerRowIdx });
            if (!ws[cellRef]) return;
            ws[cellRef].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4F81BD" } },
                alignment: { horizontal: "center" }
            };
        });

        // Add Footer: Downloaded On
        const footerRowIdx = (reportHeader ? 2 : 1) + rows.length + 1; // Empty row then footer
        const downloadedText = `Downloaded on: ${new Date().toLocaleString()}`;
        XLSX.utils.sheet_add_aoa(ws, [[downloadedText]], { origin: { r: footerRowIdx, c: 0 } });

        // Auto Width
        const colWidths = headers.map(h => ({ wch: Math.max(h.length + 5, 15) }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `${fileName}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
    };

    const getLeftOffset = (index) => {
        let offset = 0;
        for (let i = 0; i < index; i++) offset += (columns[i].width ? parseInt(columns[i].width) : 100);
        return offset;
    }

    return (
        <div className={styles.wrapper}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.leftTools}>
                    <div className={styles.searchBox}>
                        <Search size={14} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Local Search..."
                            value={globalSearch}
                            onChange={e => { setGlobalSearch(e.target.value); setCurrentPage(1); }}
                            className={styles.searchInput}
                        />
                    </div>
                    <div className={styles.limitBox}>
                        <span>Rows:</span>
                        <select
                            value={pageSize}
                            onChange={e => { setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)); setCurrentPage(1); }}
                            className={styles.limitSelect}
                        >
                            <option value={10}>10</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                            <option value="ALL">All</option>
                        </select>
                    </div>
                </div>

                <div className={styles.stats}>
                    <span>Showing <b>{paginatedData.length}</b> of <b>{totalItems}</b> (Total: {data.length})</span>
                </div>

                <div className={styles.rightTools}>
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={styles.navBtn} title="First Page">
                        <ChevronsLeft size={16} />
                    </button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={styles.navBtn} title="Previous Page">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-semibold mx-2">Page {currentPage} / {totalPages || 1}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={styles.navBtn} title="Next Page">
                        <ChevronRight size={16} />
                    </button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={styles.navBtn} title="Last Page">
                        <ChevronsRight size={16} />
                    </button>
                    <button onClick={handleExport} className={styles.exportBtn}>
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* TableContainer */}
            <div className={styles.tableContainer} ref={tableContainerRef} style={customHeight ? { height: customHeight } : {}}>
                {/* Column Visibility Toggle */}
                <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>

                    {/* Column Visibility Dropdown */}
                    <div style={{ position: 'relative' }}>
                        {(() => {
                            const isAnyColumnHidden = Object.values(columnVisibility).some(v => v === false);
                            return (
                                <button
                                    onClick={() => setActiveFilterCol(activeFilterCol === 'COL_VISIBILITY' ? null : 'COL_VISIBILITY')}
                                    className={styles.exportBtn}
                                    style={{
                                        backgroundColor: isAnyColumnHidden ? '#fef9c3' : 'white',
                                        border: isAnyColumnHidden ? '1px solid #eab308' : '1px solid #cbd5e1',
                                        color: isAnyColumnHidden ? '#854d0e' : '#64748b'
                                    }}
                                >
                                    <Filter size={14} className={isAnyColumnHidden ? "fill-yellow-600 text-yellow-600" : ""} /> Columns
                                </button>
                            );
                        })()}
                        {activeFilterCol === 'COL_VISIBILITY' && (
                            <div className={styles.filterDropdown} style={{ right: 0, left: 'auto', width: '200px' }}>
                                <div className={styles.filterHeader}>
                                    <span className="font-semibold text-xs">Show/Hide Columns</span>
                                    <X size={12} className="cursor-pointer ml-auto" onClick={() => setActiveFilterCol(null)} />
                                </div>
                                <div className={styles.filterList}>
                                    {columns.map((col, idx) => col.accessor !== 'actions' && col.accessor !== 'SlNo' && (
                                        <label key={col.accessor} className={styles.filterItem}>
                                            <input
                                                type="checkbox"
                                                checked={columnVisibility[col.accessor] !== false}
                                                onChange={() => toggleColumnVisibility(col.accessor)}
                                            />
                                            <span className="truncate">{col.header || col.accessor}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            {columns.map((col, index) => {
                                if (col.accessor === 'SlNo' && !showSerialNo) return null;
                                if (columnVisibility[col.accessor] === false) return null;

                                const isSticky = index < (stickyLeft || 0);
                                const isAction = col.accessor === 'actions';
                                const leftOffset = isSticky ? getLeftOffset(index) : undefined;
                                const isFiltered = columnFilters[col.accessor]?.size > 0;

                                return (
                                    <th
                                        key={index}
                                        className={styles.th}
                                        style={{
                                            position: (isSticky || isAction) ? 'sticky' : 'sticky',
                                            top: 0,
                                            left: isSticky ? leftOffset : undefined,
                                            right: isAction ? 0 : undefined,
                                            maxWidth: col.width,
                                            minWidth: col.width,
                                            width: col.width,
                                            zIndex: isAction ? 41 : (isSticky ? 40 : 30),
                                            backgroundColor: isFiltered ? '#fef9c3' : (isSticky || isAction ? '#f8fafc' : undefined),
                                            borderBottom: isFiltered ? '2px solid #eab308' : undefined,
                                            boxShadow: isSticky ? '2px 0 5px -2px rgba(0,0,0,0.1)' : (isAction ? '-2px 0 5px -2px rgba(0,0,0,0.1)' : undefined)
                                        }}
                                    >
                                        <div className="flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span
                                                onClick={() => !isAction && handleSort(col.accessor)}
                                                className={`cursor-pointer flex items-center gap-1 hover:text-blue-600 ${isAction ? '' : 'cursor-pointer'}`}
                                            >
                                                {col.header}
                                                {sortConfig.key === col.accessor && <span className="text-[10px] ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                                            </span>

                                            {col.accessor !== 'SlNo' && col.accessor !== 'actions' && (
                                                <Filter
                                                    size={12}
                                                    className={`cursor-pointer ${columnFilters[col.accessor]?.size > 0 ? 'text-blue-600 fill-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (activeFilterCol === col.accessor) {
                                                            setActiveFilterCol(null);
                                                        } else {
                                                            setActiveFilterCol(col.accessor);
                                                            setActiveFilterSearch(''); // Reset Search
                                                        }
                                                    }}
                                                />
                                            )}

                                            {activeFilterCol === col.accessor && col.accessor !== 'SlNo' && col.accessor !== 'actions' && (
                                                <div className={styles.filterDropdown} onClick={e => e.stopPropagation()}>
                                                    <div className={styles.filterHeader}>
                                                        <span onClick={() => handleSelectAll(col.accessor)} className="cursor-pointer text-blue-600 text-xs hover:underline">Select All</span>
                                                        <span onClick={() => handleClearFilter(col.accessor)} className="cursor-pointer text-red-500 text-xs hover:underline">Clear</span>
                                                        <X size={12} className="cursor-pointer ml-auto" onClick={() => setActiveFilterCol(null)} />
                                                    </div>
                                                    {/* Filter Search Input */}
                                                    <div style={{ padding: '4px 8px', borderBottom: '1px solid #e2e8f0' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Search..."
                                                            value={activeFilterSearch}
                                                            onChange={(e) => setActiveFilterSearch(e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                fontSize: '11px',
                                                                padding: '4px',
                                                                border: '1px solid #cbd5e1',
                                                                borderRadius: '4px',
                                                                outline: 'none'
                                                            }}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className={styles.filterList}>
                                                        {(() => {
                                                            let options = uniqueValues[col.accessor] || [];

                                                            // 1. Filter by Search
                                                            if (activeFilterSearch) {
                                                                options = options.filter(v =>
                                                                    String(v).toLowerCase().includes(activeFilterSearch.toLowerCase())
                                                                );
                                                            }

                                                            // 2. Sort: Selected First, then Alpha
                                                            const selectedSet = columnFilters[col.accessor] || new Set();
                                                            options.sort((a, b) => {
                                                                const aSelected = selectedSet.has(a);
                                                                const bSelected = selectedSet.has(b);
                                                                if (aSelected && !bSelected) return -1;
                                                                if (!aSelected && bSelected) return 1;
                                                                return String(a).localeCompare(String(b));
                                                            });

                                                            if (!options || options.length === 0) return <span className="text-gray-400 italic p-2">No options</span>;

                                                            return options.map(val => (
                                                                <label key={val} className={styles.filterItem}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={columnFilters[col.accessor]?.has(val) || false}
                                                                        onChange={() => toggleFilter(col.accessor, val)}
                                                                        onClick={e => e.stopPropagation()}
                                                                    />
                                                                    <span className="truncate" title={val} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
                                                                </label>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={columns.length} className="p-8 text-center text-gray-500" style={{ padding: '20px', textAlign: 'center' }}>Loading data...</td></tr>
                        ) : paginatedData.map((row, rIdx) => {
                            const listIndex = (currentPage - 1) * (pageSize === 'ALL' ? sortedData.length : pageSize) + rIdx + 1;

                            return (
                                <tr key={rIdx} className={styles.tr}>
                                    {columns.map((col, cIdx) => {
                                        if (col.accessor === 'SlNo' && !showSerialNo) return null;
                                        if (columnVisibility[col.accessor] === false) return null;

                                        const isSticky = cIdx < (stickyLeft || 0);
                                        const leftOffset = isSticky ? getLeftOffset(cIdx) : undefined;

                                        return (
                                            <td
                                                key={cIdx}
                                                className={styles.td}
                                                style={{
                                                    position: (col.accessor === 'actions' || isSticky) ? 'sticky' : undefined,
                                                    right: col.accessor === 'actions' ? 0 : undefined,
                                                    left: isSticky ? leftOffset : undefined,
                                                    backgroundColor: (col.accessor === 'actions' || isSticky) ? (rIdx % 2 === 0 ? '#f8fafc' : 'white') : undefined,
                                                    zIndex: col.accessor === 'actions' ? 10 : (isSticky ? 5 : 1),
                                                    boxShadow: isSticky ? '2px 0 5px -2px rgba(0,0,0,0.1)' : (col.accessor === 'actions' ? '-2px 0 5px -2px rgba(0,0,0,0.1)' : undefined)
                                                }}
                                            >
                                                <div className={styles.cellContent}>
                                                    {col.accessor === 'SlNo' ? listIndex : (col.render ? col.render(row, listIndex) : row[col.accessor])}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            );
                        })}
                        {!loading && paginatedData.length === 0 && (
                            <tr><td colSpan={columns.length} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Click Backdrop for closing filters */}
            {
                activeFilterCol && (
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 25 }}
                        onClick={() => setActiveFilterCol(null)}
                    />
                )
            }
        </div >
    );
}

function ChevronLeft({ size }) { return <ArrowLeft size={size} />; }
function ChevronRight({ size }) { return <ArrowRight size={size} />; }
