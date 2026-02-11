const { getConnection } = require('./db');
const fs = require('fs');
const path = require('path');

async function runSqlFile() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Please provide a file path');
        process.exit(1);
    }

    try {
        const pool = await getConnection();
        const sqlContent = fs.readFileSync(filePath, 'utf-8');

        console.log(`Executing SQL from ${filePath}...`);
        const req = pool.request();
        req.setTimeout(300000); // 5 minutes
        await req.query(sqlContent);
        console.log('SQL executed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error executing SQL:', err);
        process.exit(1);
    }
}

runSqlFile();
