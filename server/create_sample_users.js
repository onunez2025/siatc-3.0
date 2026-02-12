// ===================================================================
// Script: Ejecutar SQL para crear usuarios de ejemplo
// Propósito: Crear técnicos, supervisores y usuarios CAS
// Fecha: 2026-02-11
// ===================================================================

const fs = require('fs').promises;
const path = require('path');
const { getConnection, sql } = require('./db');

async function executeSQLFile(pool, scriptPath) {
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
                    
                    // Mostrar resultados si existen
                    if (result.recordsets && result.recordsets.length > 0) {
                        result.recordsets.forEach(recordset => {
                            if (recordset.length > 0) {
                                console.table(recordset);
                            }
                        });
                    }
                } catch (batchError) {
                    console.error(`Error en batch ${i + 1}:`, batchError.message);
                }
            }
        }
        
        console.log(`✓ Script completado exitosamente.`);
        return true;
    } catch (error) {
        console.error(`✗ Error ejecutando script:`, error.message);
        return false;
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   CREAR USUARIOS DE EJEMPLO - SIATC 3.0                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    try {
        console.log('\n🔌 Conectando a Azure SQL Server...');
        const pool = await getConnection();
        console.log('✓ Conexión exitosa');
        
        const scriptPath = path.join(__dirname, 'sql', '09_create_sample_users.sql');
        await executeSQLFile(pool, scriptPath);
        
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║   ✓ USUARIOS DE EJEMPLO CREADOS                           ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        
    } catch (error) {
        console.error('\n✗ Error fatal:', error);
        process.exit(1);
    }
}

main();
