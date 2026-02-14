const { sql, getConnection } = require('../db');

async function syncServiceTypes() {
    let pool;
    try {
        pool = await getConnection();
        console.log('--- Starting Service Types Sync ---');

        // 1. Create Table if not exists
        const createTableQuery = `
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[SIATC].[ServicioTipo]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [SIATC].[ServicioTipo](
                    [Id] [nvarchar](50) NOT NULL,
                    [Descripcion] [nvarchar](255) NULL,
                    [LastSync] [datetime] DEFAULT GETDATE(),
                    PRIMARY KEY CLUSTERED ([Id] ASC)
                );
                console.log('Table [SIATC].[ServicioTipo] created.');
            END
            ELSE
            BEGIN
                 console.log('Table [SIATC].[ServicioTipo] already exists.');
            END
        `;
        // Note: console.log inside SQL string won't work, removed for execution
        const createTableQueryClean = `
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[SIATC].[ServicioTipo]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [SIATC].[ServicioTipo](
                    [Id] [nvarchar](50) NOT NULL,
                    [Descripcion] [nvarchar](255) NULL,
                    [LastSync] [datetime] DEFAULT GETDATE(),
                    PRIMARY KEY CLUSTERED ([Id] ASC)
                );
            END
        `;

        await pool.request().query(createTableQueryClean);
        console.log('Verified table [SIATC].[ServicioTipo].');

        // 2. Sync Data (Upsert)
        const syncQuery = `
            MERGE [SIATC].[ServicioTipo] AS Target
            USING (SELECT Id, Descripcion FROM [APPGAC].[ServicioTipo]) AS Source
            ON (Target.Id = Source.Id)
            WHEN MATCHED THEN
                UPDATE SET Target.Descripcion = Source.Descripcion, Target.LastSync = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (Id, Descripcion, LastSync)
                VALUES (Source.Id, Source.Descripcion, GETDATE());
        `;

        const result = await pool.request().query(syncQuery);
        console.log(`Sync completed. Rows affected: ${result.rowsAffected}`);

    } catch (err) {
        console.error('Error syncing service types:', err);
    } finally {
        if (pool) pool.close();
        // Only exit if run directly
        if (require.main === module) process.exit();
    }
}

if (require.main === module) {
    syncServiceTypes();
}

module.exports = syncServiceTypes;
