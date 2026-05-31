'use client';

import { useRef, useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Download, Search, ArrowUpDown, Filter, X, Check, ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight, ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react';
import styles from './TransactionTable.module.css';
import * as XLSX from 'xlsx-js-style';
import Modal from '@/components/Modal/Modal';

export default function TransactionTable({
    config,
    title = "Recent Transactions",
    data = [],
    isLoading,
    onDelete,
    onEdit,
    userRole,
}) {
    const tableContainerRef = useRef(null);
    const router = useRouter();

    // Helper to get case-insensitive row values and map formatted display strings
    const getCellValue = (row, col, idx) => {
        if (!row || !col) return '';
        
        let val = row[col.accessor];
        if (val === undefined) {
            const lowerKey = String(col.accessor).toLowerCase();
            const foundKey = Object.keys(row).find(k => k.toLowerCase() === lowerKey);
            if (foundKey) val = row[foundKey];
        }
        
        if (col.accessor === 'SlNo') val = idx + 1;
        else if (col.type === 'date' && val) {
            val = new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
        } else if (col.type === 'datetime' && val) {
            val = String(val).replace('T', ' ').split('.')[0];
        }
        
        return val !== null && val !== undefined ? String(val).trim() : '';
    };

    // --- Local State ---
    const [globalSearch, setGlobalSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: config.defaultSort || null, direction: 'desc' });
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterCol, setActiveFilterCol] = useState(null);
    const [activeFilterSearch, setActiveFilterSearch] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [deleteRow, setDeleteRow] = useState(null); // State for delete modal

    // --- Derived Data ---

    const uniqueValues = useMemo(() => {
        const values = {};
        config.columns.forEach(col => {
            const distinct = new Set(data.map((row, idx) => {
                return getCellValue(row, col, idx);
            }));
            values[col.accessor] = Array.from(distinct).filter(v => v !== null && v !== undefined && v !== '').sort();
        });
        return values;
    }, [data, config.columns]);

    const filteredData = useMemo(() => {
        let res = data;
        if (globalSearch) {
            const lowerSearch = globalSearch.toLowerCase();
            res = res.filter(row =>
                Object.values(row).some(v => String(v).toLowerCase().includes(lowerSearch))
            );
        }
        Object.keys(columnFilters).forEach(key => {
            const selectedSet = columnFilters[key];
            if (selectedSet && selectedSet.size > 0) {
                const col = config.columns.find(c => c.accessor === key);
                res = res.filter((row, idx) => {
                    const val = getCellValue(row, col, idx);
                    return selectedSet.has(val);
                });
            }
        });
        return res;
    }, [data, globalSearch, columnFilters, config.columns]);

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;
        const sorted = [...filteredData].sort((a, b) => {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredData, sortConfig]);

    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedData = useMemo(() => {
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

    const toggleRow = (id) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleDeleteClick = (row) => {
        setDeleteRow(row);
    };

    const confirmDelete = () => {
        if (deleteRow && onDelete) {
            onDelete(deleteRow[config.idField]);
        }
        setDeleteRow(null);
    };

    const handleExport = () => {
        const headers = config.columns.map(c => c.label);
        const rows = sortedData.map(row => config.columns.map(c => {
            let val = row[c.accessor];
            if (c.type === 'date' && val) val = new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
            else if (c.type === 'datetime' && val) val = new Date(val).toLocaleString('en-GB');
            return val || '';
        }));
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const colWidths = headers.map(h => ({ wch: Math.max(h.length + 5, 15) }));
        ws['!cols'] = colWidths;
        headers.forEach((h, i) => {
            const cellRef = XLSX.utils.encode_cell({ c: i, r: 0 });
            if (ws[cellRef]) ws[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } } };
        });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `Filtered_Export.xlsx`);
    };

    const canEdit = (createdDate) => {
        return true;
    };

    function getLeftOffset(index) {
        let offset = 0;
        for (let i = 0; i < index; i++) offset += config.columns[i].width || 100;
        return offset;
    }

    return (
        <div className={styles.wrapper}>
            <div className="px-4 pt-3 pb-1 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700 text-xs flex items-center gap-2">
                    {title}
                </h3>
            </div>
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
                            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                            className={styles.limitSelect}
                        >
                            <option value={10}>10</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                            <option value={1000000}>All</option>
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
                        <Download size={14} /> Export View
                    </button>
                </div>
            </div>

            <div className={styles.tableContainer} ref={tableContainerRef} style={{ height: '456px', flex: 'none', display: 'block', overflowY: 'auto' }}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {config.columns.map((col, index) => {
                                const isSticky = index < 4;
                                const left = getLeftOffset(index);
                                const isFiltered = columnFilters[col.accessor]?.size > 0;
                                let filterOptions = uniqueValues[col.accessor] || [];
                                if (activeFilterSearch && activeFilterCol === col.accessor) {
                                    filterOptions = filterOptions.filter(v =>
                                        String(v).toLowerCase().includes(activeFilterSearch.toLowerCase())
                                    );
                                }
                                const selectedSet = columnFilters[col.accessor] || new Set();
                                const displayOptions = [...filterOptions].sort((a, b) => {
                                    const aSelected = selectedSet.has(a);
                                    const bSelected = selectedSet.has(b);
                                    if (aSelected && !bSelected) return -1;
                                    if (!aSelected && bSelected) return 1;
                                    return String(a).localeCompare(String(b));
                                });

                                return (
                                     <th
                                         key={col.accessor}
                                         style={{
                                             width: col.width,
                                             position: 'sticky',
                                             top: 0,
                                             left: isSticky ? left : undefined,
                                             zIndex: activeFilterCol === col.accessor ? 60 : (isSticky ? 40 : 30),
                                             backgroundColor: isFiltered ? '#bfdbfe' : '#e2e8f0',
                                             boxShadow: '0 1px 0 #cbd5e1'
                                         }}
                                         className={styles.th}
                                     >
                                         <div className="flex items-center justify-between">
                                             <span onClick={() => handleSort(col.accessor)} className="cursor-pointer flex items-center gap-1 hover:text-blue-600">
                                                 {col.label}
                                                 {sortConfig.key === col.accessor && <span className="text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                                             </span>
                                             {col.accessor !== 'SlNo' && !col.disableFilter && (
                                                 <div className="relative">
                                                     <Filter
                                                         size={12}
                                                         className={`cursor-pointer ${columnFilters[col.accessor]?.size > 0 ? 'text-blue-600 fill-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                         onClick={(e) => {
                                                             e.stopPropagation();
                                                             if (activeFilterCol === col.accessor) {
                                                                 setActiveFilterCol(null);
                                                             } else {
                                                                 setActiveFilterCol(col.accessor);
                                                                 setActiveFilterSearch('');
                                                             }
                                                         }}
                                                     />
                                                     {activeFilterCol === col.accessor && (
                                                         <div 
                                                             className={styles.filterDropdown} 
                                                             style={{
                                                                 position: 'absolute',
                                                                 top: '100%',
                                                                 marginTop: '4px',
                                                                 zIndex: 100,
                                                                 ...(index < 3 ? { left: 0, right: 'auto' } : (index >= config.columns.length - 2 ? { right: 0, left: 'auto' } : (index < config.columns.length / 2 ? { left: 0, right: 'auto' } : { right: 0, left: 'auto' })))
                                                             }}
                                                             onClick={e => e.stopPropagation()}
                                                         >
                                                             <div className={styles.filterHeader}>
                                                                 <span onClick={() => handleSelectAll(col.accessor)} className="cursor-pointer text-blue-600 text-xs hover:underline">Select All</span>
                                                                 <span onClick={() => handleClearFilter(col.accessor)} className="cursor-pointer text-red-500 text-xs hover:underline">Clear</span>
                                                                 <X size={12} className="cursor-pointer ml-auto" onClick={() => setActiveFilterCol(null)} />
                                                             </div>
                                                             <div style={{ padding: '4px 8px', borderBottom: '1px solid #e2e8f0' }}>
                                                                 <input
                                                                     type="text"
                                                                     placeholder="Search..."
                                                                     value={activeFilterSearch}
                                                                     onChange={(e) => setActiveFilterSearch(e.target.value)}
                                                                     style={{ width: '100%', fontSize: '11px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                                                                     autoFocus
                                                                     onClick={e => e.stopPropagation()}
                                                                 />
                                                             </div>
                                                             <div className={styles.filterList}>
                                                                 {displayOptions.map(val => (
                                                                     <label 
                                                                         key={val} 
                                                                         className={styles.filterItem}
                                                                         style={{
                                                                             display: 'flex',
                                                                             alignItems: 'center',
                                                                             justifyContent: 'flex-start',
                                                                             gap: '8px',
                                                                             width: '100%',
                                                                             padding: '6px 8px',
                                                                             cursor: 'pointer',
                                                                             boxSizing: 'border-box'
                                                                         }}
                                                                     >
                                                                         <input
                                                                             type="checkbox"
                                                                             checked={columnFilters[col.accessor]?.has(val) || false}
                                                                             onChange={() => toggleFilter(col.accessor, val)}
                                                                             onClick={e => e.stopPropagation()}
                                                                             style={{ margin: 0, cursor: 'pointer' }}
                                                                         />
                                                                         <span 
                                                                             title={val}
                                                                             style={{
                                                                                 color: '#334155',
                                                                                 fontSize: '12px',
                                                                                 flex: 1,
                                                                                 textAlign: 'left',
                                                                                 whiteSpace: 'normal',
                                                                                 wordBreak: 'break-word'
                                                                             }}
                                                                         >
                                                                             {val}
                                                                         </span>
                                                                     </label>
                                                                 ))}
                                                                 {displayOptions.length === 0 && <span className="text-gray-400 italic p-2">No options</span>}
                                                             </div>
                                                         </div>
                                                     )}
                                                 </div>
                                             )}
                                         </div>
                                     </th>
                                );
                            })}
                            <th className={styles.th} style={{ position: 'sticky', right: 0, top: 0, zIndex: 40, backgroundColor: '#e2e8f0', width: 80, boxShadow: '0 1px 0 #cbd5e1' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="100" className="p-8 text-center text-gray-500">Loading data...</td></tr>
                        ) : paginatedData.map((row, rowIndex) => {
                            const listIndex = (currentPage - 1) * pageSize + rowIndex + 1;
                            const isEditable = canEdit(row.CreatedDate);
                            return (
                                <Fragment key={row[config.idField] || rowIndex}>
                                    <tr className={styles.tr}>
                                        {config.columns.map((col, cIndex) => {
                                            const isSticky = cIndex < 4;
                                            const left = getLeftOffset(cIndex);
                                            let val = row[col.accessor];
                                            if (col.accessor === 'SlNo') val = listIndex;
                                            if (col.type === 'date' && val) val = new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
                                            if (col.type === 'datetime' && val) val = String(val).replace('T', ' ').split('.')[0];
                                            return (
                                                <td
                                                    key={col.accessor}
                                                    className={styles.td}
                                                    style={{
                                                        position: isSticky ? 'sticky' : 'relative',
                                                        left: isSticky ? left : undefined,
                                                        zIndex: isSticky ? 10 : 1,
                                                        background: rowIndex % 2 === 0 ? '#f8fafc' : (isSticky ? '#e2e8f0' : 'transparent'),
                                                        backgroundColor: isSticky ? (rowIndex % 2 === 0 ? '#f1f5f9' : '#e2e8f0') : (rowIndex % 2 === 0 ? '#f8fafc' : 'transparent')
                                                    }}
                                                >
                                                    <div className={styles.cellContent}>
                                                        {cIndex === 0 && config.expandable && (
                                                            <span
                                                                onClick={(e) => { e.stopPropagation(); toggleRow(row[config.idField]); }}
                                                                className="cursor-pointer mr-2 inline-flex align-middle hover:bg-slate-200 rounded p-0.5"
                                                            >
                                                                {expandedRows.has(row[config.idField]) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                            </span>
                                                        )}
                                                        {val}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className={styles.td} style={{ position: 'sticky', right: 0, zIndex: 10, backgroundColor: rowIndex % 2 === 0 ? '#f1f5f9' : '#e2e8f0', textAlign: 'center' }}>
                                            <div className={styles.actions}>
                                                <button
                                                    disabled={!isEditable}
                                                    onClick={() => isEditable && onEdit && onEdit(row)}
                                                    className={styles.actionBtn}
                                                    style={{ cursor: isEditable ? 'pointer' : 'not-allowed' }}
                                                    title={isEditable ? "Edit Record" : "Edit Disabled (Older than 24h)"}
                                                >
                                                    <Edit size={14} color={isEditable ? '#2563eb' : '#cbd5e1'} />
                                                </button>
                                                <button
                                                    disabled={!isEditable}
                                                    className={styles.actionBtn}
                                                    onClick={() => isEditable && handleDeleteClick(row)}
                                                    style={{ cursor: isEditable ? 'pointer' : 'not-allowed' }}
                                                    title={isEditable ? "Delete Record" : "Delete Disabled (Older than 24h)"}
                                                >
                                                    <Trash2 size={14} color={isEditable ? '#ef4444' : '#cbd5e1'} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {config.expandable && expandedRows.has(row[config.idField]) && (
                                        <tr key={`${row[config.idField]}-ex`} className={styles.tr}>
                                            <td colSpan="100" style={{ padding: '10px 20px', backgroundColor: '#f0f9ff', borderBottom: '1px solid #e2e8f0' }}>
                                                {config.subTable && (
                                                    <>
                                                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#0369a1' }}>{config.subTable.title}:</div>
                                                        {row[config.subTable.accessor] && row[config.subTable.accessor].length > 0 ? (
                                                            <table style={{ width: '100%', maxWidth: '800px', borderCollapse: 'collapse', fontSize: '11px', backgroundColor: 'white', border: '1px solid #cbd5e1' }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#e0f2fe' }}>
                                                                        {config.subTable.columns.map((subCol, scIdx) => (
                                                                            <th key={scIdx} style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{subCol.label}</th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {row[config.subTable.accessor].map((childRow, crIdx) => (
                                                                        <tr key={crIdx}>
                                                                            {config.subTable.columns.map((subCol, scIdx) => {
                                                                                let cellVal = childRow[subCol.accessor];
                                                                                if (subCol.type === 'time' && cellVal) {
                                                                                    const timeDate = new Date(cellVal);
                                                                                    if (!isNaN(timeDate)) {
                                                                                        cellVal = timeDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                                                                    }
                                                                                }
                                                                                return (
                                                                                    <td key={scIdx} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: subCol.align || 'left' }}>
                                                                                        {cellVal}
                                                                                    </td>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        ) : (
                                                            <div className="text-gray-500 italic">No records found.</div>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {activeFilterCol && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 25 }}
                    onClick={() => setActiveFilterCol(null)}
                />
            )}

            <Modal
                isOpen={!!deleteRow}
                onClose={() => setDeleteRow(null)}
                title="Confirm Delete"
            >
                <div>
                    <p style={{ marginBottom: '20px', color: '#374151' }}>
                        Are you sure you want to delete this record? <br />
                        <b>ID: {deleteRow ? deleteRow[config.idField] : ''}</b> <br />
                        Date: <b>{deleteRow ? new Date(deleteRow[config.columns.find(c => c.type === 'date')?.accessor || 'LoadingDate']).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : ''}</b>
                    </p>
                    <div className={styles.buttonGroup} style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                            onClick={() => setDeleteRow(null)}
                            style={{
                                padding: '8px 16px',
                                background: 'white',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: '#334155'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
