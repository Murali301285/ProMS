const { executeQuery } = require('./lib/db');

async function checkUsers() {
    try {
        console.log("Checking Master.TblUser...");
        const users = await executeQuery(`SELECT TOP 10 UserId, UserName, SlNo FROM [Master].[TblUser]`);
        console.table(users);
    } catch (e) {
        console.error(e);
    }
}

checkUsers();
