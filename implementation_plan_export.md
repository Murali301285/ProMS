// In TransactionTable.js
// Change handleExport to:
const handleExportTrigger = () => {
    onExport && onExport();
};

// In page.js
import * as XLSX from 'xlsx-js-style';

const handleExportAll = async () => {
    setLoading(true); // Reuse loading or specific state
    try {
        // 1. Fetch All Data
        const params = new URLSearchParams({
            offset: '0',
            limit: '1000000', // Fetch Max
            fromDate,
            toDate,
            equipmentIds: selectedEquipments.join(','),
            search,
            sortBy,
            sortOrder
        });
        const res = await fetch(`${config.apiEndpoint}?${params}`);
        const result = await res.json();
        
        // 2. Generate Excel
        const headers = config.columns.map(c => c.label);
        const rows = result.data.map(row => config.columns.map(c => {
             let val = row[c.accessor];
             // Formatting...
             return val;
        }));
        // ... XLSX write logic ...
        
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
};
