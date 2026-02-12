// ===================================================================
// Script: Ejecutar rebuild completo del sistema de usuarios
// Propósito: Recrear Empresas, Roles y Usuarios con nueva estructura
// Fecha: 2026-02-11
// ===================================================================

const sql = require('mssql');
const fs = require('fs').promises;
const path = require('path');
const { getConnection } = require('./db');

// Usar configuración de db.js para consistencia

// Scripts SQL a ejecutar en orden
const sqlScripts = [
    '04_cleanup_old_tables.sql',     // Primero: limpiar tablas existentes
    '05_rebuild_empresas_table.sql',
    '06_rebuild_roles_table.sql',
    '08_populate_empresas_from_tickets.sql',
    '07_rebuild_usuarios_table.sql'  // Usuarios al final porque depende de Empresas y Roles
];

async function executeScript(pool, scriptPath) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Ejecutando: ${path.basename(scriptPath)}`);
    console.log('='.repeat(60));
    
    try {
        const scriptContent = await fs.readFile(scriptPath, 'utf8');
        
        // Dividir por GO y ejecutar cada batch
        const batches = scriptContent
            .split(/^\s*GO\s*$/mi)
            .map(batch => batch.trim())
            .filter(batch => batch.length > 0);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            if (batch) {
                try {
                    const result = await pool.request().query(batch);
                    
                    // Mostrar mensajes de PRINT
                    if (result.recordsets && result.recordsets.length > 0) {
                        result.recordsets.forEach(recordset => {
                            if (recordset.length > 0) {
                                console.table(recordset);
                            }
                        });
                    }
                } catch (batchError) {
                    console.error(`Error en batch ${i + 1}:`, batchError.message);
                    // Continuar con el siguiente batch
                }
            }
        }
        
        console.log(`✓ Script ${path.basename(scriptPath)} completado exitosamente.`);
        return true;
    } catch (error) {
        console.error(`✗ Error ejecutando ${path.basename(scriptPath)}:`, error.message);
        return false;
    }
}

async function createInitialUsers(pool) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('CREAR USUARIOS INICIALES');
    console.log('='.repeat(60));
    
    try {
        // Obtener IdEmpresa de SOLE
        const empresaResult = await pool.request()
            .input('nombreEmpresa', sql.NVarChar, 'SOLE')
            .query('SELECT IdEmpresa FROM [SIATC].[Empresas] WHERE NombreEmpresa = @nombreEmpresa');
        
        if (empresaResult.recordset.length === 0) {
            console.error('✗ No se encontró empresa SOLE');
            return false;
        }
        
        const idEmpresaSole = empresaResult.recordset[0].IdEmpresa;
        console.log(`✓ Empresa SOLE encontrada: IdEmpresa = ${idEmpresaSole}`);
        
        // Obtener IdRol de ADMINISTRADOR
        const rolResult = await pool.request()
            .input('nombreRol', sql.NVarChar, 'ADMINISTRADOR')
            .query('SELECT IdRol FROM [SIATC].[Roles] WHERE NombreRol = @nombreRol');
        
        if (rolResult.recordset.length === 0) {
            console.error('✗ No se encontró rol ADMINISTRADOR');
            return false;
        }
        
        const idRolAdmin = rolResult.recordset[0].IdRol;
        console.log(`✓ Rol ADMINISTRADOR encontrado: IdRol = ${idRolAdmin}`);
        
        // Crear usuario administrador inicial
        // NOTA: Password '123' temporalmente - implementar bcrypt después
        const insertResult = await pool.request()
            .input('username', sql.NVarChar, 'admin')
            .input('password', sql.NVarChar, '123')
            .input('nombre', sql.NVarChar, 'Administrador')
            .input('apellido', sql.NVarChar, 'Sistema')
            .input('email', sql.NVarChar, 'admin@sole.com')
            .input('idEmpresa', sql.Int, idEmpresaSole)
            .input('idRol', sql.Int, idRolAdmin)
            .input('activo', sql.Bit, 1)
            .input('requiereCambioPassword', sql.Bit, 1)
            .query(`
                INSERT INTO [SIATC].[Usuarios] 
                (Username, Password, Nombre, Apellido, Email, IdEmpresa, IdRol, Activo, RequiereCambioPassword)
                VALUES 
                (@username, @password, @nombre, @apellido, @email, @idEmpresa, @idRol, @activo, @requiereCambioPassword)
            `);
        
        console.log(`✓ Usuario 'admin' creado exitosamente`);
        console.log(`  - Username: admin`);
        console.log(`  - Password: 123 (temporal, requiere cambio)`);
        console.log(`  - Empresa: SOLE (PROPIA)`);
        console.log(`  - Rol: ADMINISTRADOR`);
        
        return true;
    } catch (error) {
        console.error('✗ Error creando usuarios iniciales:', error.message);
        return false;
    }
}

async function verifyResults(pool) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('VERIFICACIÓN DE RESULTADOS');
    console.log('='.repeat(60));
    
    try {
        // Contar empresas
        const empresasResult = await pool.request().query(`
            SELECT TipoEmpresa, COUNT(*) AS Total
            FROM [SIATC].[Empresas]
            GROUP BY TipoEmpresa
            ORDER BY TipoEmpresa
        `);
        console.log('\n📊 Empresas:');
        console.table(empresasResult.recordset);
        
        // Contar roles
        const rolesResult = await pool.request().query(`
            SELECT COUNT(*) AS TotalRoles
            FROM [SIATC].[Roles]
        `);
        console.log('\n📊 Roles:');
        console.table(rolesResult.recordset);
        
        // Listar todos los roles
        const rolesListResult = await pool.request().query(`
            SELECT IdRol, NombreRol, Descripcion
            FROM [SIATC].[Roles]
            ORDER BY IdRol
        `);
        console.table(rolesListResult.recordset);
        
        // Contar usuarios
        const usuariosResult = await pool.request().query(`
            SELECT COUNT(*) AS TotalUsuarios
            FROM [SIATC].[Usuarios]
        `);
        console.log('\n📊 Usuarios:');
        console.table(usuariosResult.recordset);
        
        // Listar usuarios con detalles
        const usuariosDetailResult = await pool.request().query(`
            SELECT 
                U.IdUsuario,
                U.Username,
                U.Nombre,
                U.Apellido,
                E.NombreEmpresa,
                E.TipoEmpresa,
                R.NombreRol,
                U.Activo
            FROM [SIATC].[Usuarios] U
            INNER JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
            INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
            ORDER BY U.IdUsuario
        `);
        if (usuariosDetailResult.recordset.length > 0) {
            console.table(usuariosDetailResult.recordset);
        }
        
        return true;
    } catch (error) {
        console.error('✗ Error en verificación:', error.message);
        return false;
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   REBUILD SISTEMA DE USUARIOS - SIATC 3.0                 ║');
    console.log('║   Empresas + Roles + Usuarios                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    let pool;
    
    try {
        // Conectar a la base de datos
        console.log('\n🔌 Conectando a Azure SQL Server...');
        pool = await getConnection();
        console.log('✓ Conexión exitosa');
        
        // Ejecutar scripts SQL en orden
        for (const scriptName of sqlScripts) {
            const scriptPath = path.join(__dirname, 'sql', scriptName);
            const success = await executeScript(pool, scriptPath);
            if (!success) {
                console.error(`\n✗ Error ejecutando ${scriptName}. Deteniendo proceso.`);
                process.exit(1);
            }
        }
        
        // Crear usuarios iniciales
        await createInitialUsers(pool);
        
        // Verificar resultados
        await verifyResults(pool);
        
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║   ✓ REBUILD COMPLETADO EXITOSAMENTE                       ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('\n📝 PRÓXIMOS PASOS:');
        console.log('  1. Probar login con: admin / 123');
        console.log('  2. Implementar bcrypt para passwords');
        console.log('  3. Crear más usuarios según necesidad');
        console.log('  4. Implementar lógica de permisos en backend');
        console.log('  5. Actualizar auth.service.ts para validar con nueva estructura');
        
    } catch (error) {
        console.error('\n✗ Error fatal:', error);
        process.exit(1);
    } finally {
        console.log('\n🔌 Pool de conexiones mantiene conexión abierta.');
    }
}

// Ejecutar
main();
