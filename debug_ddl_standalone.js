const { executeQuery } = require('./lib/db'); // This won't work in node script due to 'next/headers' dependency in lib/db.
// Instead, I will use fetch to hit the running server if possible, or just mock the db call if I can run standalone.
// Since 'next/headers' is Next.js specific, standard node script cannot import lib/db directly easily.
// I will try to use the 'check_schema.js' style which likely uses direct sql connection.
// But the error is likely in the API route logic or the query it generates.

// Let's create a script that calls the API endpoint if the server is running.
// If server is not running (it should be), I can use fetch.

/* 
   Actually, I can't easily fetch localhost:3000 from this environment context unless checks allow.
   I will try to read the server logs from the terminal output first if possible, but I don't have recent logs of the failure.
   
   Better approach: Create a standalone script that replicates the logic of `app/api/settings/ddl/route.js` BUT uses a direct SQL connection (bypassing `lib/db` cookies) to see if the QUERY is valid.
*/

const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function testDDL() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        // Simulate Equipment Group Query
        // Logic from route.js:
        /*
          SELECT SlNo as id, Name as name
          FROM [Master].[TblEquipmentGroup]
          WHERE 1=1 AND IsDelete = 0 AND IsActive = 1
          ORDER BY Name ASC
        */
        const query = `
            SELECT SlNo as id, Name as name
            FROM [Master].[TblEquipmentGroup]
            WHERE 1=1 
            -- AND (CASE WHEN COL_LENGTH('[Master].[TblEquipmentGroup]', 'IsDelete') IS NOT NULL THEN IsDelete ELSE 0 END) = 0
            -- AND (CASE WHEN COL_LENGTH('[Master].[TblEquipmentGroup]', 'IsActive') IS NOT NULL THEN IsActive ELSE 1 END) = 1
            ORDER BY Name ASC
        `;

        console.log("Running Query:", query);
        const result = await sql.query(query);
        console.log("Groups Found:", result.recordset.length);
        if (result.recordset.length > 0) console.log("Sample:", result.recordset[0]);

    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await sql.close();
    }
}

testDDL();
