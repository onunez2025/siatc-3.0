const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'soledbserveradmin',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'soledbserver.database.windows.net',
    database: process.env.DB_NAME || 'soledb-puntoventa',
    options: {
        encrypt: true,
        trustServerCertificate: process.env.NODE_ENV !== 'production'
    }
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', err => {
    console.error('SQL Connection Pool Error:', err);
});

async function getConnection() {
    await poolConnect;
    return pool;
}

module.exports = {
    sql,
    getConnection
};
