const { executeQuery } = require('./lib/db');
const { MASTER_CONFIG } = require('./lib/masterConfig');

async function testDDL() {
    console.log("--- DEBUG START ---");

    // 1. Test Equipment Group Lookup
    try {
        console.log("\nTesting Equipment Group Lookup (Filter: IsQtyTripMapping=1)...");
        const eqParams = {
            table: 'equipment-group',
            nameField: 'Name',
            valueField: 'SlNo',
            filter: { IsQtyTripMapping: 1 }
        };

        // Simulate DDL API Logic manually to see query
        const safeTable = eqParams.table.replace(/[^a-zA-Z0-9-]/g, '');
        const fullTableName = `[Master].[TblEquipmentGroup]`; // Hardcoded for test safety

        let query = `
            SELECT ${eqParams.valueField} as id, ${eqParams.nameField} as name
            FROM ${fullTableName}
            WHERE 1=1
             AND (CASE WHEN COL_LENGTH('${fullTableName}', 'IsDelete') IS NOT NULL THEN IsDelete ELSE 0 END) = 0
             AND (CASE WHEN COL_LENGTH('${fullTableName}', 'IsActive') IS NOT NULL THEN IsActive ELSE 1 END) = 1
             AND IsQtyTripMapping = 1
             ORDER BY Name ASC
        `;
        console.log("Query:", query);
        const result = await executeQuery(query);
        console.log("Equipment Group Result Count:", result.length);
        if (result.length > 0) console.log("Sample:", result[0]);

        // Check for specific IDs seen in screenshot 38, 39, 40
        const idsToCheck = [38, 39, 40];
        const found = result.filter(r => idsToCheck.includes(r.id));
        console.log("Found specific IDs (38, 39, 40):", found);

    } catch (e) {
        console.error("Eq Group Error:", e);
    }

    // 2. Test Material Lookup
    try {
        console.log("\nTesting Material Lookup...");
        const matParams = {
            table: 'material',
            nameField: 'MaterialName',
            valueField: 'SlNo'
        };
        const fullMatTable = `[Master].[TblMaterial]`;
        let queryMat = `
            SELECT ${matParams.valueField} as id, ${matParams.nameField} as name
            FROM ${fullMatTable}
            WHERE 1=1
             AND (CASE WHEN COL_LENGTH('${fullMatTable}', 'IsDelete') IS NOT NULL THEN IsDelete ELSE 0 END) = 0
             AND (CASE WHEN COL_LENGTH('${fullMatTable}', 'IsActive') IS NOT NULL THEN IsActive ELSE 1 END) = 1
             ORDER BY MaterialName ASC
        `;
        console.log("Query:", queryMat);
        const resultMat = await executeQuery(queryMat);
        console.log("Material Result Count:", resultMat.length);
        if (resultMat.length > 0) console.log("Sample:", resultMat[0]);

        // Check for ID 10
        const found10 = resultMat.find(r => r.id == 10);
        console.log("Found ID 10:", found10);

    } catch (e) {
        console.error("Material Error:", e);
    }

    console.log("--- DEBUG END ---");
}

testDDL();
