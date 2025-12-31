
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkFK() {
    try {
        await sql.connect(config);

        const query = `
            SELECT 
                fk.name AS ForeignKeyName,
                tp.name AS TableName,
                cp.name AS ColumnName,
                ref_t.name AS ReferencedTableName,
                ref_c.name AS ReferencedColumnName
            FROM 
                sys.foreign_keys AS fk
            INNER JOIN 
                sys.tables AS tp ON fk.parent_object_id = tp.object_id
            INNER JOIN 
                sys.tables AS ref_t ON fk.referenced_object_id = ref_t.object_id
            INNER JOIN 
                sys.foreign_key_columns AS fkc ON fk.object_id = fkc.constraint_object_id
            INNER JOIN 
                sys.columns AS cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
            INNER JOIN 
                sys.columns AS ref_c ON fkc.referenced_object_id = ref_c.object_id AND fkc.referenced_column_id = ref_c.column_id
            WHERE 
                tp.name = 'TblLoading' AND (cp.name = 'CreatedBy' OR cp.name = 'UpdatedBy');
        `;

        const res = await sql.query(query);

        console.log("Foreign Keys on TblLoading (CreatedBy/UpdatedBy):");
        if (res.recordset.length === 0) {
            console.log("No Foreign Keys found for CreatedBy/UpdatedBy on TblLoading.");
        } else {
            console.table(res.recordset);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkFK();
