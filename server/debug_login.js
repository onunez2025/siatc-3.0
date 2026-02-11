const { getConnection, sql } = require('./db');
require('dotenv').config();

async function debugLogin() {
    try {
        const pool = await getConnection();
        const username = 'ONUNEZ';

        console.log(`Querying for user: '${username}'...`);

        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT [ID Usuario], [Cod_usuario], [Contraseña]
                FROM [dbo].[GAC_APP_TB_USUARIOS]
                WHERE [ID Usuario] = @username
            `);

        if (result.recordset.length === 0) {
            console.log('User NOT FOUND in database.');
        } else {
            const user = result.recordset[0];
            const fs = require('fs');
            const output = `
User FOUND:
ID Usuario: '${user['ID Usuario']}'
Contraseña: '${user['Contraseña']}'
Password length: ${user['Contraseña'].length}
Comparision '123': ${user['Contraseña'] === '123'}
Comparison '123' (trimmed): ${user['Contraseña']?.trim() === '123'}
`;
            fs.writeFileSync('debug_output.txt', output);
            console.log(output);
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

debugLogin();
