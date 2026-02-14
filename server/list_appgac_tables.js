const { sql, getConnection } = require('./db');

async function inspect() {
    try {
        const pool = await getConnection();

        console.log('--- Tables in APPGAC Schema ---');
        const tables = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'APPGAC'
            ORDER BY TABLE_NAME
        `);
        console.log(JSON.stringify(tables.recordset, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspect();
