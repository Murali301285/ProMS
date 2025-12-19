const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(config);
        const query = `
            SELECT 
                B.*,
                Sh.ShiftName,
                SS.Name as SMESupplierName
            FROM [Trans].[TblBlasting] B
            LEFT JOIN [Master].[TblShift] Sh ON B.ShiftId = Sh.SlNo
            LEFT JOIN [Master].[TblSMESupplier] SS ON B.SMESupplierId = SS.SlNo
            WHERE B.IsDelete = 0
        `;
        const result = await sql.query(query);
        if (result.recordset.length > 0) {
            console.log("Keys in first row:", Object.keys(result.recordset[0]));
            console.log("SlNo value:", result.recordset[0].SlNo);
        } else {
            console.log("No data found");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

run();
