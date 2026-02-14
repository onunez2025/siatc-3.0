const { getConnection, sql } = require('../db');

exports.getStats = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN Estado = 'Pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN Estado = 'En Proceso' THEN 1 ELSE 0 END) as enProceso,
                SUM(CASE WHEN Estado = 'Completado' THEN 1 ELSE 0 END) as completados,
                SUM(CASE WHEN Estado = 'Cancelado' THEN 1 ELSE 0 END) as cancelados
            FROM [SIATC].[Tickets]
        `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching stats' });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        const pool = await getConnection();
        const request = pool.request();

        // Parallel queries for performance
        const [todayStats, weekStats, statusDist, trend, topEmpresas, users, companies] = await Promise.all([
            // 1. Tickets Today
            request.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Estado = 'Ready to plan' THEN 1 ELSE 0 END) as readyToPlan,
                    SUM(CASE WHEN Estado = 'Released' THEN 1 ELSE 0 END) as released,
                    SUM(CASE WHEN Estado = 'Closed' THEN 1 ELSE 0 END) as closed,
                    SUM(CASE WHEN Estado = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
                FROM [SIATC].[Tickets]
                WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
            `),
            // 2. Tickets Week
            request.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Estado = 'Closed' THEN 1 ELSE 0 END) as closed,
                    SUM(CASE WHEN Estado = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
                FROM [SIATC].[Tickets]
                WHERE FechaVisita >= DATEADD(wk, DATEDIFF(wk, 0, GETDATE()), 0)
            `),
            // 3. Status Distribution (Today)
            request.query(`
                SELECT Estado as status, COUNT(*) as count
                FROM [SIATC].[Tickets]
                WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
                GROUP BY Estado
            `),
            // 4. Trend (Last 7 Days)
            request.query(`
                SELECT 
                    FORMAT(FechaVisita, 'yyyy-MM-dd') as date,
                    COUNT(*) as total,
                    SUM(CASE WHEN Estado = 'Closed' THEN 1 ELSE 0 END) as closed
                FROM [SIATC].[Tickets]
                WHERE FechaVisita >= DATEADD(day, -7, GETDATE())
                GROUP BY FORMAT(FechaVisita, 'yyyy-MM-dd')
                ORDER BY date
            `),
            // 5. Top Empresas (Today)
            request.query(`
                SELECT TOP 5 NombreCliente as empresa, COUNT(*) as count
                FROM [SIATC].[Tickets]
                WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
                GROUP BY NombreCliente
                ORDER BY count DESC
            `),
            // 6. Users Stats
            request.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Activo = 1 THEN 1 ELSE 0 END) as active,
                    COUNT(DISTINCT IdRol) as rolesUsed
                FROM [SIATC].[Usuarios]
            `),
            // 7. Companies Stats
            request.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Activo = 1 THEN 1 ELSE 0 END) as active
                FROM [SIATC].[Empresas]
            `)
        ]);

        const data = {
            date: new Date().toISOString().split('T')[0],
            ticketsToday: todayStats.recordset[0],
            ticketsWeek: weekStats.recordset[0],
            statusDistribution: statusDist.recordset,
            topEmpresas: topEmpresas.recordset,
            users: users.recordset[0] || { total: 0, active: 0, rolesUsed: 0 },
            empresas: {
                ...companies.recordset[0],
                propias: 0, // Placeholder
                cas: 0      // Placeholder
            },
            trend: trend.recordset
        };

        res.json(data);
    } catch (err) {
        console.error('Error in getDashboard:', err);
        res.status(500).json({ error: 'Error processing dashboard data' });
    }
};
