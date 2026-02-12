const sql = require('mssql');
const { getConnection } = require('./db');

async function compareTicketsByState() {
    try {
        console.log('='.repeat(70));
        console.log('COMPARACIÓN DE TICKETS POR ESTADO - HOY (11 FEB 2026)');
        console.log('='.repeat(70) + '\n');

        const pool = await getConnection();

        // 1. Tickets en tabla ORIGEN [APPGAC].[Servicios]
        console.log('📊 TABLA ORIGEN: [APPGAC].[Servicios]');
        console.log('-'.repeat(70));
        const origen = await pool.request().query(`
            SELECT 
                ISNULL(TRIM(Estado), 'Sin Estado') as Estado,
                COUNT(*) as Cantidad
            FROM [APPGAC].[Servicios]
            WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
                OR CAST(FechaUltimaModificacion AS DATE) = CAST(GETDATE() AS DATE)
            GROUP BY TRIM(Estado)
            ORDER BY COUNT(*) DESC
        `);

        console.table(origen.recordset);
        const totalOrigen = origen.recordset.reduce((sum, row) => sum + row.Cantidad, 0);
        console.log(`TOTAL ORIGEN: ${totalOrigen}\n`);

        // 2. Tickets en tabla DESTINO [SIATC].[Tickets]
        console.log('📊 TABLA DESTINO: [SIATC].[Tickets]');
        console.log('-'.repeat(70));
        const destino = await pool.request().query(`
            SELECT 
                ISNULL(TRIM(Estado), 'Sin Estado') as Estado,
                COUNT(*) as Cantidad
            FROM [SIATC].[Tickets]
            WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
            GROUP BY TRIM(Estado)
            ORDER BY COUNT(*) DESC
        `);

        console.table(destino.recordset);
        const totalDestino = destino.recordset.reduce((sum, row) => sum + row.Cantidad, 0);
        console.log(`TOTAL DESTINO: ${totalDestino}\n`);

        // 3. Comparación lado a lado
        console.log('📊 COMPARACIÓN LADO A LADO');
        console.log('='.repeat(70));

        // Crear un mapa de estados
        const estadosMap = new Map();
        
        origen.recordset.forEach(row => {
            estadosMap.set(row.Estado, { origen: row.Cantidad, destino: 0, diferencia: 0 });
        });

        destino.recordset.forEach(row => {
            if (estadosMap.has(row.Estado)) {
                estadosMap.get(row.Estado).destino = row.Cantidad;
            } else {
                estadosMap.set(row.Estado, { origen: 0, destino: row.Cantidad, diferencia: 0 });
            }
        });

        // Calcular diferencias
        const comparison = [];
        estadosMap.forEach((valores, estado) => {
            valores.diferencia = valores.destino - valores.origen;
            comparison.push({
                Estado: estado,
                Origen: valores.origen,
                Destino: valores.destino,
                Diferencia: valores.diferencia,
                Match: valores.diferencia === 0 ? '✓' : '✗'
            });
        });

        // Ordenar por cantidad en origen (descendente)
        comparison.sort((a, b) => b.Origen - a.Origen);

        console.table(comparison);

        // 4. Resumen
        console.log('\n' + '='.repeat(70));
        console.log('📋 RESUMEN');
        console.log('='.repeat(70));
        console.log(`Total Origen:  ${totalOrigen}`);
        console.log(`Total Destino: ${totalDestino}`);
        console.log(`Diferencia:    ${totalDestino - totalOrigen} tickets`);
        
        const descuadrados = comparison.filter(c => c.Diferencia !== 0);
        if (descuadrados.length > 0) {
            console.log(`\n⚠️  Estados descuadrados: ${descuadrados.length}`);
            descuadrados.forEach(d => {
                console.log(`   - ${d.Estado}: ${d.Diferencia > 0 ? '+' : ''}${d.Diferencia}`);
            });
        } else {
            console.log('\n✓ Todos los estados coinciden perfectamente');
        }

        // 5. Tickets que están en destino pero NO en origen (tickets viejos)
        console.log('\n' + '='.repeat(70));
        console.log('🔍 INVESTIGACIÓN: ¿Tickets de días anteriores en destino?');
        console.log('='.repeat(70));
        
        const ticketsAnteriores = await pool.request().query(`
            SELECT 
                CAST(FechaVisita AS DATE) as Fecha,
                COUNT(*) as Cantidad
            FROM [SIATC].[Tickets]
            WHERE CAST(FechaVisita AS DATE) < CAST(GETDATE() AS DATE)
            GROUP BY CAST(FechaVisita AS DATE)
            ORDER BY CAST(FechaVisita AS DATE) DESC
        `);

        if (ticketsAnteriores.recordset.length > 0) {
            console.log('\nTickets de días anteriores en [SIATC].[Tickets]:');
            console.table(ticketsAnteriores.recordset.slice(0, 10)); // Mostrar últimos 10 días
            const totalAnteriores = ticketsAnteriores.recordset.reduce((sum, row) => sum + row.Cantidad, 0);
            console.log(`Total tickets de días anteriores: ${totalAnteriores}`);
        } else {
            console.log('\n✓ No hay tickets de días anteriores en destino');
        }

        console.log('\n' + '='.repeat(70));

    } catch (error) {
        console.error('\n' + '='.repeat(70));
        console.error('✗ ERROR EN COMPARACIÓN');
        console.error('='.repeat(70));
        console.error(error);
        process.exit(1);
    }
}

compareTicketsByState();
