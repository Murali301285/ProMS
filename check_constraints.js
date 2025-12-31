// Basic connection without Next.js deps
const fs = require('fs');
const sql = require('mssql');
const path = require('path');

// Manually load .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) {
            process.env[key.trim()] = val.trim();
        }
    });
} catch (e) {
    console.error("Could not read .env.local", e);
}

const config = {
    user: 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42', // Fallback to known dev password if env missing
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false, // Match lib/db.js
        trustServerCertificate: true
    }
};

async function checkConstraints() {
    try {
        await sql.connect(config);
        console.log("Checking FK Constraints on [Trans].[TblLoading]...");
        const query = `
            SELECT 
                fk.name AS ForeignKeyName,
                OBJECT_NAME(fk.parent_object_id) AS TableName,
                c.name AS ColumnName,
                OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable
            FROM 
                sys.foreign_keys AS fk
            INNER JOIN 
                sys.foreign_key_columns AS fkc ON fk.object_id = fkc.constraint_object_id
            INNER JOIN 
                sys.columns AS c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
            WHERE 
                fk.parent_object_id = OBJECT_ID('Trans.TblLoading')
        `;
        const res = await sql.query(query);
        console.table(res.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkConstraints();
