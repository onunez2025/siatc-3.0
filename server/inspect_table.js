const { getConnection } = require('./db');
const fs = require('fs');

async function inspectTable() {
    try {
        const pool = await getConnection();
        // Allow passing full table name like [APPGAC].[Servicios]
        const tableNameRaw = process.argv[2] || '[APPGAC].[Servicios]';
        // Remove brackets for SCHEMA query
        const cleanName = tableNameRaw.replace('[', '').replace(']', '').replace('[', '').replace(']', '');
        const parts = cleanName.split('.');
        const schema = parts.length > 1 ? parts[0] : 'dbo';
        const table = parts.length > 1 ? parts[1] : parts[0];

        console.log(`Inspecting table: ${schema}.${table}`);

        // 1. Get Column Types
        const types = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = '${table}'
        `);

        // 2. Get Sample Data
        const result = await pool.request().query(`SELECT TOP 5 * FROM ${tableNameRaw}`);

        const report = {
            schema: types.recordset,
            data: result.recordset
        };

        fs.writeFileSync('server/table_inspection.json', JSON.stringify(report, null, 2));
        console.log('Report written to server/table_inspection.json');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

inspectTable();
