const { getConnection, sql } = require('../db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function diagnoseLogin() {
    try {
        console.log('Connecting to database...');
        const pool = await getConnection();
        console.log('Connected.');

        const username = 'TEC_1211';
        console.log(`Testing query for user: ${username}`);

        const result = await pool.request()
            .query(`
                SELECT TOP 1
                    U.IdUsuario,
                    U.Username,
                    U.Password,
                    U.CodigoTecnico,
                    R.NombreRol
                FROM [SIATC].[Usuarios] U
                INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
                INNER JOIN [SIATC].[Tickets] T ON U.CodigoTecnico = T.CodigoTecnico
                WHERE R.NombreRol = 'TECNICO'
            `);

        console.log('Query successful!');
        console.table(result.recordset);
        console.log('First record:', result.recordset[0]);

    } catch (err) {
        console.error('❌ SQL ERROR:', err);
    } finally {
        process.exit(0);
    }
}

diagnoseLogin();
