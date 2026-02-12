const cron = require('node-cron');
const { getConnection, sql } = require('../db');

// Configuration
const SYNC_INTERVAL = '*/1 * * * *'; // Every minute
const BATCH_SIZE = 5000;
const LOOKBACK_HOURS = 1; // Always look back 1 hour to catch missed updates

async function getSyncWindowStart(pool) {
    // Strategy: Always look back LOOKBACK_HOURS from now.
    // This ensures that even if FechaModificacionIT didn't change on a record,
    // we still re-compare it as long as it was touched in the last hour.
    // Additionally, cap at GETDATE() to avoid future-date issues.
    const result = await pool.request().query(`
        SELECT DATEADD(HOUR, -${LOOKBACK_HOURS}, GETDATE()) as syncWindowStart
    `);
    return result.recordset[0].syncWindowStart;
}

function cleanString(val) {
    if (val === null || val === undefined) return null;
    return String(val).trim();
}

function cleanDate(val) {
    if (!val) return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
}

function cleanBit(val) {
    if (val === null || val === undefined) return 0;
    const s = String(val).toLowerCase().trim();
    return (s === 'true' || s === '1' || s === 'si' || s === 'yes') ? 1 : 0;
}

function cleanDecimal(val) {
    if (!val) return null;
    // Replace comma with dot if needed
    const s = String(val).replace(',', '.').trim();
    const num = parseFloat(s);
    return isNaN(num) ? null : num;
}

async function syncTickets() {
    let pool;
    try {
        console.log(`[SYNC] Starting synchronization at ${new Date().toISOString()}...`);
        pool = await getConnection();

        // 1. Get sync window (1 hour lookback)
        const syncWindowStart = await getSyncWindowStart(pool);
        console.log(`[SYNC] Sync window: from ${syncWindowStart.toISOString()} (${LOOKBACK_HOURS}h lookback)`);

        // 2. Fetch records that need syncing:
        //    a) Records modified in the source within the lookback window
        //    b) Records that exist in source but not in target (new records)
        //    c) Records where Estado differs between source and target (stale data)
        const updatesResult = await pool.request()
            .input('syncWindowStart', sql.DateTime, syncWindowStart)
            .query(`
                SELECT TOP (${BATCH_SIZE}) s.*
                FROM [APPGAC].[Servicios] s
                LEFT JOIN [SIATC].[Tickets] t ON t.Ticket = TRIM(s.Ticket)
                WHERE TRY_CAST(s.FechaModificacionIT AS DATETIME) > @syncWindowStart
                   OR t.Ticket IS NULL
                   OR TRIM(s.Estado) != t.Estado
                   OR ISNULL(TRIM(s.CodigoTecnico),'') != ISNULL(t.CodigoTecnico,'')
                   OR ISNULL(TRIM(s.NombreTecnico),'') != ISNULL(t.NombreTecnico,'')
                   OR TRY_CAST(s.FechaUltimaModificacion AS DATETIME) != t.FechaUltimaModificacion
                ORDER BY TRY_CAST(s.FechaModificacionIT AS DATETIME) ASC
            `);

        const updates = updatesResult.recordset;
        console.log(`[SYNC] Found ${updates.length} records to update.`);

        if (updates.length === 0) {
            console.log('[SYNC] No updates found. Sleeping.');
            return;
        }

        // 3. Upsert into Target
        // We use a transaction or just loop for simplicity in this MVP.
        // For performance with 1000 rows, a loop is okay, but bulk insert/merge is better.
        // Let's use a Merge-like approach via sp_executesql or individual upserts.
        // Given complexity of SQL Merge string construction, individual upserts are safer for now.

        let upsertCount = 0;
        let errorCount = 0;

        for (const row of updates) {
            try {
                // Transform
                const ticket = {
                    Ticket: cleanString(row.Ticket),
                    LlamadaFSM: cleanString(row.LlamadaFSM),
                    IdServicio: cleanString(row.IdServicio),
                    IdCliente: cleanString(row.IdCliente),
                    IDEmpresa: cleanString(row.IDEmpresa), // Now String
                    Estado: cleanString(row.Estado),
                    FechaVisita: cleanDate(row.FechaVisita),
                    FechaUltimaModificacion: cleanDate(row.FechaUltimaModificacion),
                    NombreCliente: cleanString(row.NombreCliente),
                    CodigoExternoCliente: cleanString(row.CodigoExternoCliente),
                    Email: cleanString(row.Email),
                    Celular1: cleanString(row.Celular1),
                    Celular2: cleanString(row.Celular2),
                    Telefono1: cleanString(row.Telefono1),
                    Calle: cleanString(row.Calle),
                    NumeroCalle: cleanString(row.NumeroCalle),
                    Distrito: cleanString(row.Distrito),
                    Ciudad: cleanString(row.Ciudad),
                    Pais: cleanString(row.Pais),
                    CodigoPostal: cleanString(row.CodigoPostal),
                    Latitud: cleanDecimal(row.Latitud),
                    Longitud: cleanDecimal(row.Longitud),
                    Referencia: cleanString(row.Referencia),
                    IdEquipo: cleanString(row.IdEquipo),
                    NombreEquipo: cleanString(row.NombreEquipo),
                    CodigoExternoEquipo: cleanString(row.CodigoExternoEquipo),
                    Asunto: cleanString(row.Asunto),
                    CodigoTecnico: cleanString(row.CodigoTecnico),
                    NombreTecnico: cleanString(row.NombreTecnico),
                    ApellidoTecnico: cleanString(row.ApellidoTecnico),
                    VisitaRealizada: cleanBit(row.VisitaRealizada),
                    TrabajoRealizado: cleanBit(row.TrabajoRealizado),
                    SolicitaNuevaVisita: cleanBit(row.SolicitaNuevaVisita),
                    MotivoNuevaVisita: cleanString(row.MotivoNuevaVisita),
                    CodMotivoIncidente: cleanString(row.CodMotivoIncidente),
                    ComentarioProgramador: cleanString(row.ComentarioProgramador),
                    ComentarioTecnico: cleanString(row.ComentarioTecnico),
                    CheckOut: cleanDate(row.CheckOut),
                    FechaModificacionIT: cleanDate(row.FechaModificacionIT)
                };

                if (!ticket.Ticket) {
                    console.warn('[SYNC] Skipping row with missing Ticket ID', row);
                    continue;
                }

                // Upsert Query
                await pool.request()
                    .input('Ticket', sql.VarChar, ticket.Ticket)
                    .input('LlamadaFSM', sql.VarChar, ticket.LlamadaFSM)
                    .input('IdServicio', sql.VarChar, ticket.IdServicio)
                    .input('IdCliente', sql.VarChar, ticket.IdCliente)
                    .input('IDEmpresa', sql.VarChar, ticket.IDEmpresa)
                    .input('Estado', sql.NVarChar, ticket.Estado)
                    .input('FechaVisita', sql.DateTime, ticket.FechaVisita)
                    .input('FechaUltimaModificacion', sql.DateTime, ticket.FechaUltimaModificacion)
                    .input('NombreCliente', sql.NVarChar, ticket.NombreCliente)
                    .input('CodigoExternoCliente', sql.VarChar, ticket.CodigoExternoCliente)
                    .input('Email', sql.NVarChar, ticket.Email)
                    .input('Celular1', sql.VarChar, ticket.Celular1)
                    .input('Celular2', sql.VarChar, ticket.Celular2)
                    .input('Telefono1', sql.VarChar, ticket.Telefono1)
                    .input('Calle', sql.NVarChar, ticket.Calle)
                    .input('NumeroCalle', sql.NVarChar, ticket.NumeroCalle)
                    .input('Distrito', sql.NVarChar, ticket.Distrito)
                    .input('Ciudad', sql.NVarChar, ticket.Ciudad)
                    .input('Pais', sql.NVarChar, ticket.Pais)
                    .input('CodigoPostal', sql.VarChar, ticket.CodigoPostal)
                    .input('Latitud', sql.Decimal(10, 7), ticket.Latitud)
                    .input('Longitud', sql.Decimal(10, 7), ticket.Longitud)
                    .input('Referencia', sql.NVarChar, ticket.Referencia)
                    .input('IdEquipo', sql.VarChar, ticket.IdEquipo)
                    .input('NombreEquipo', sql.NVarChar, ticket.NombreEquipo)
                    .input('CodigoExternoEquipo', sql.VarChar, ticket.CodigoExternoEquipo)
                    .input('Asunto', sql.NVarChar, ticket.Asunto)
                    .input('CodigoTecnico', sql.VarChar, ticket.CodigoTecnico)
                    .input('NombreTecnico', sql.NVarChar, ticket.NombreTecnico)
                    .input('ApellidoTecnico', sql.NVarChar, ticket.ApellidoTecnico)
                    .input('VisitaRealizada', sql.Bit, ticket.VisitaRealizada)
                    .input('TrabajoRealizado', sql.Bit, ticket.TrabajoRealizado)
                    .input('SolicitaNuevaVisita', sql.Bit, ticket.SolicitaNuevaVisita)
                    .input('MotivoNuevaVisita', sql.NVarChar, ticket.MotivoNuevaVisita)
                    .input('CodMotivoIncidente', sql.VarChar, ticket.CodMotivoIncidente)
                    .input('ComentarioProgramador', sql.NVarChar, ticket.ComentarioProgramador)
                    .input('ComentarioTecnico', sql.NVarChar, ticket.ComentarioTecnico)
                    .input('CheckOut', sql.DateTime, ticket.CheckOut)
                    .input('FechaModificacionIT', sql.DateTime, ticket.FechaModificacionIT)
                    .query(`
                        MERGE [SIATC].[Tickets] AS Target
                        USING (SELECT @Ticket AS Ticket) AS Source
                        ON (Target.Ticket = Source.Ticket)
                        WHEN MATCHED THEN
                            UPDATE SET
                                LlamadaFSM = @LlamadaFSM, IdServicio = @IdServicio, IdCliente = @IdCliente, IDEmpresa = @IDEmpresa,
                                Estado = @Estado, FechaVisita = @FechaVisita, FechaUltimaModificacion = @FechaUltimaModificacion,
                                NombreCliente = @NombreCliente, CodigoExternoCliente = @CodigoExternoCliente, Email = @Email,
                                Celular1 = @Celular1, Celular2 = @Celular2, Telefono1 = @Telefono1,
                                Calle = @Calle, NumeroCalle = @NumeroCalle, Distrito = @Distrito, Ciudad = @Ciudad, Pais = @Pais, CodigoPostal = @CodigoPostal,
                                Latitud = @Latitud, Longitud = @Longitud, Referencia = @Referencia,
                                IdEquipo = @IdEquipo, NombreEquipo = @NombreEquipo, CodigoExternoEquipo = @CodigoExternoEquipo, Asunto = @Asunto,
                                CodigoTecnico = @CodigoTecnico, NombreTecnico = @NombreTecnico, ApellidoTecnico = @ApellidoTecnico,
                                VisitaRealizada = @VisitaRealizada, TrabajoRealizado = @TrabajoRealizado, SolicitaNuevaVisita = @SolicitaNuevaVisita,
                                MotivoNuevaVisita = @MotivoNuevaVisita, CodMotivoIncidente = @CodMotivoIncidente,
                                ComentarioProgramador = @ComentarioProgramador, ComentarioTecnico = @ComentarioTecnico,
                                CheckOut = @CheckOut, FechaModificacionIT = @FechaModificacionIT,
                                LastSync = GETDATE()
                        WHEN NOT MATCHED THEN
                            INSERT (
                                Ticket, LlamadaFSM, IdServicio, IdCliente, IDEmpresa,
                                Estado, FechaVisita, FechaUltimaModificacion,
                                NombreCliente, CodigoExternoCliente, Email,
                                Celular1, Celular2, Telefono1,
                                Calle, NumeroCalle, Distrito, Ciudad, Pais, CodigoPostal,
                                Latitud, Longitud, Referencia,
                                IdEquipo, NombreEquipo, CodigoExternoEquipo, Asunto,
                                CodigoTecnico, NombreTecnico, ApellidoTecnico,
                                VisitaRealizada, TrabajoRealizado, SolicitaNuevaVisita,
                                MotivoNuevaVisita, CodMotivoIncidente,
                                ComentarioProgramador, ComentarioTecnico,
                                CheckOut, FechaModificacionIT, LastSync
                            ) VALUES (
                                @Ticket, @LlamadaFSM, @IdServicio, @IdCliente, @IDEmpresa,
                                @Estado, @FechaVisita, @FechaUltimaModificacion,
                                @NombreCliente, @CodigoExternoCliente, @Email,
                                @Celular1, @Celular2, @Telefono1,
                                @Calle, @NumeroCalle, @Distrito, @Ciudad, @Pais, @CodigoPostal,
                                @Latitud, @Longitud, @Referencia,
                                @IdEquipo, @NombreEquipo, @CodigoExternoEquipo, @Asunto,
                                @CodigoTecnico, @NombreTecnico, @ApellidoTecnico,
                                @VisitaRealizada, @TrabajoRealizado, @SolicitaNuevaVisita,
                                @MotivoNuevaVisita, @CodMotivoIncidente,
                                @ComentarioProgramador, @ComentarioTecnico,
                                @CheckOut, @FechaModificacionIT, GETDATE()
                            );
                    `);

                upsertCount++;

            } catch (err) {
                console.error(`[SYNC] Error processing ticket ${row.Ticket}:`, err.message);
                errorCount++;
            }
        }

        console.log(`[SYNC] Completed batch. Upserted: ${upsertCount}, Errors: ${errorCount}`);

        // If we fetched the limit, maybe there are more. We could loop immediately, but keeping it simple for Cron (every minute).

    } catch (err) {
        console.error('[SYNC] Critical Error:', err);
    }
}

// Start Cron Job
function startSyncService() {
    console.log(`[SYNC] Service started. Schedule: ${SYNC_INTERVAL}`);

    // Run once immediately on start
    syncTickets();

    // Schedule
    cron.schedule(SYNC_INTERVAL, () => {
        syncTickets();
    });
}

module.exports = { startSyncService };
