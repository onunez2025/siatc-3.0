const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Configuración de conexión (usando las mismas credenciales de db.js)
const config = {
    server: 'soledbserver.database.windows.net',
    port: 1433,
    database: 'soledb-puntoventa',
    user: 'soledbserveradmin',
    password: '@s0le@dm1nAI#82,',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

async function executeSqlFile(pool, filePath) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Ejecutando: ${path.basename(filePath)}`);
    console.log('='.repeat(60));

    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Dividir por GO (SQL Server batch separator)
    const batches = sqlContent
        .split(/^\s*GO\s*$/im)
        .map(batch => batch.trim())
        .filter(batch => batch.length > 0);

    console.log(`Total de batches a ejecutar: ${batches.length}\n`);

    for (let i = 0; i < batches.length; i++) {
        try {
            console.log(`Ejecutando batch ${i + 1}/${batches.length}...`);
            const request = pool.request();
            request.timeout = 60000; // 60 segundos
            const result = await request.query(batches[i]);
            
            // Mostrar mensajes informativos
            if (result.recordset && result.recordset.length > 0) {
                console.table(result.recordset);
            }
            
            if (result.rowsAffected && result.rowsAffected[0] > 0) {
                console.log(`✓ Filas afectadas: ${result.rowsAffected[0]}`);
            }
        } catch (error) {
            console.error(`✗ Error en batch ${i + 1}:`);
            console.error(error.message);
            console.error('Batch SQL:', batches[i].substring(0, 200) + '...\n');
            throw error;
        }
    }

    console.log(`\n✓ Archivo completado: ${path.basename(filePath)}`);
}

async function setupUsersDatabase() {
    let pool;
    
    try {
        console.log('\n' + '='.repeat(60));
        console.log('CONFIGURACIÓN DE BASE DE DATOS DE USUARIOS');
        console.log('='.repeat(60));
        console.log(`Servidor: ${config.server}`);
        console.log(`Base de datos: ${config.database}`);
        console.log(`Usuario: ${config.user}`);
        console.log('='.repeat(60) + '\n');

        // Conectar a la base de datos
        console.log('Conectando a la base de datos...');
        pool = await sql.connect(config);
        console.log('✓ Conexión establecida\n');

        // Archivos SQL en orden
        const sqlFiles = [
            '03_create_users_table.sql',
            '04_migrate_users_data.sql'
        ];

        // Ejecutar cada archivo
        for (const file of sqlFiles) {
            const filePath = path.join(__dirname, 'sql', file);
            
            if (!fs.existsSync(filePath)) {
                throw new Error(`Archivo no encontrado: ${filePath}`);
            }

            await executeSqlFile(pool, filePath);
        }

        // Reporte final
        console.log('\n' + '='.repeat(60));
        console.log('REPORTE FINAL');
        console.log('='.repeat(60) + '\n');

        // Contar registros
        const stats = await pool.request().query(`
            SELECT 'Empresas' as Tabla, COUNT(*) as Total FROM [SIATC].[Empresas]
            UNION ALL
            SELECT 'Usuarios', COUNT(*) FROM [SIATC].[Usuarios]
            UNION ALL
            SELECT 'Roles', COUNT(*) FROM [SIATC].[Roles]
        `);

        console.table(stats.recordset);

        // Detalle por rol
        const roleStats = await pool.request().query(`
            SELECT 
                R.NombreRol as Rol,
                COUNT(U.IdUsuario) as Cantidad,
                SUM(CASE WHEN U.Activo = 1 THEN 1 ELSE 0 END) as Activos,
                SUM(CASE WHEN U.CodigoTecnico IS NOT NULL THEN 1 ELSE 0 END) as ConCodigoTecnico
            FROM [SIATC].[Roles] R
            LEFT JOIN [SIATC].[Usuarios] U ON R.IdRol = U.IdRol
            GROUP BY R.NombreRol
            ORDER BY COUNT(U.IdUsuario) DESC
        `);

        console.log('\nUsuarios por rol:');
        console.table(roleStats.recordset);

        // Algunos usuarios de ejemplo
        const sampleUsers = await pool.request().query(`
            SELECT TOP 10
                Username,
                Nombre,
                Apellidos,
                Email,
                (SELECT NombreRol FROM [SIATC].[Roles] WHERE IdRol = U.IdRol) as Rol,
                CodigoTecnico,
                CASE WHEN Activo = 1 THEN 'Sí' ELSE 'No' END as Activo
            FROM [SIATC].[Usuarios] U
            ORDER BY FechaCreacion DESC
        `);

        console.log('\nÚltimos 10 usuarios creados:');
        console.table(sampleUsers.recordset);

        console.log('\n' + '='.repeat(60));
        console.log('✓ CONFIGURACIÓN COMPLETADA EXITOSAMENTE');
        console.log('='.repeat(60));
        console.log('\nPRÓXIMOS PASOS:');
        console.log('1. Actualizar server/index.js para usar [SIATC].[Usuarios]');
        console.log('2. Instalar bcryptjs: npm install bcryptjs');
        console.log('3. Implementar hash de contraseñas en login');
        console.log('4. Crear endpoint para cambio de contraseña');
        console.log('5. Actualizar frontend para manejar primer login');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('✗ ERROR EN LA CONFIGURACIÓN');
        console.error('='.repeat(60));
        console.error(error);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.close();
            console.log('Conexión cerrada.');
        }
    }
}

// Ejecutar
setupUsersDatabase();
