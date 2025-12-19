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

        console.log("Testing Delete with 'undefined'...");
        // Simulate the error
        const id = "undefined";
        const query = `UPDATE [Trans].[TblBlasting] SET IsDelete = 1 WHERE SlNo = ${id}`;

        await sql.query(query);
        console.log("Success (Unexpected)");

    } catch (err) {
        console.error('Expected Error:', err.message);
    } finally {
        await sql.close();
    }
}

run();
