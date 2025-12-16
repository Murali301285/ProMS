import sql from 'mssql';
import { cookies } from 'next/headers';

const DEFAULT_DB = process.env.DB_DATABASE || 'ProdMS_live';

const getBaseConfig = () => ({
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
});

// Cache for connection pools: { 'ProdMS_live': pool, 'ProdMS_Test': pool }
const pools = {};

export const getDbConnection = async () => {
    try {
        const cookieStore = await cookies();
        const selectedDb = cookieStore.get('current_db')?.value || DEFAULT_DB;

        // Clean db name to prevent SQL injection or path traversal (alphanumeric + underscore only)
        const safeDbName = selectedDb.replace(/[^a-zA-Z0-9_]/g, '');

        if (pools[safeDbName] && pools[safeDbName].connected) {
            return pools[safeDbName];
        }

        console.log(`Connecting to database: ${safeDbName}...`);

        const config = {
            ...getBaseConfig(),
            database: safeDbName,
        };
        console.log(`[DB] Connecting to Server: ${config.server}, DB: ${config.database}, User: ${config.user}`);

        const pool = await new sql.ConnectionPool(config).connect();
        pools[safeDbName] = pool;

        console.log(`Connected to ${safeDbName} successfully.`);
        return pool;
    } catch (err) {
        console.error('Database Connection Failed! Details:', err);
        throw err;
    }
};

export const executeQuery = async (query, params = []) => {
    try {
        const pool = await getDbConnection();
        const request = pool.request();

        params.forEach(param => {
            const type = typeof param.type === 'string' ? sql[param.type] : param.type;
            request.input(param.name, type, param.value);
        });

        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error('Query Execution Error:', error);
        throw error;
    }
};

export { sql };
