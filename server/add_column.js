const { getConnection } = require('./db');

async function addColumn() {
    try {
        const pool = await getConnection();
        await pool.request().query(`
            ALTER TABLE [dbo].[GAC_APP_TB_USUARIOS]
            ADD LastLogin DATETIME NULL;
        `);
        console.log('Column LastLogin added successfully.');
    } catch (err) {
        if (err.message.includes('column already exists')) {
            console.log('Column LastLogin already exists.');
        } else {
            console.error('Error adding column:', err.message);
        }
    }
}

addColumn();
