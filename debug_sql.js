const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(config);

        console.log("--- TblLoading Columns ---");
        const resCol = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblLoading' AND TABLE_SCHEMA = 'Trans'
        `);
        console.log("COLUMNS:", resCol.recordset.map(r => r.COLUMN_NAME).join(', '));

        console.log("\n--- Activity List ---");
        const resAct = await sql.query('SELECT SlNo, Name FROM Master.TblActivity');
        console.table(resAct.recordset);

        console.log("\n--- Sample Loading Join Activity ---");
        const resJoin = await sql.query(`
            SELECT TOP 5 
                L.SlNo,
                L.LoadingMachineEquipmentId,
                Eq.EquipmentName,
                Eq.ActivityId
            FROM Trans.TblLoading L
            LEFT JOIN Master.TblEquipment Eq ON L.LoadingMachineEquipmentId = Eq.SlNo
        `);
        console.table(resJoin.recordset);

    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await sql.close();
    }
}

run();
