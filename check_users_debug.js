const { getDbConnection } = require('./lib/db');

async function checkUsers() {
    try {
        const pool = await getDbConnection();
        const result = await pool.request().query('SELECT TOP 5 SlNo, UserName, IsActive FROM Master.TblUser');
        console.log('Users:', result.recordset);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkUsers();
