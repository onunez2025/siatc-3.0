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

exports.getDashboardData = async (req, res) => {
    try {
        const pool = await getConnection();
        const companyId = req.query.companyId;

        let companyFilter = '';
        if (companyId) {
            companyFilter = 'AND T.IDEmpresa = @companyId';
        }

        const request = pool.request();
        if (companyId) request.input('companyId', sql.Int, parseInt(companyId));

        const [counts, daily] = await Promise.all([
            request.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN T.Estado = 'Abierto' THEN 1 ELSE 0 END) as abiertos,
                    SUM(CASE WHEN T.Estado = 'En Proceso' THEN 1 ELSE 0 END) as enProceso,
                    SUM(CASE WHEN T.Estado = 'Cerrado' THEN 1 ELSE 0 END) as cerrados,
                    SUM(CASE WHEN T.Estado = 'Cancelado' THEN 1 ELSE 0 END) as cancelados
                FROM [SIATC].[Tickets] T
                WHERE 1=1 ${companyFilter}
            `),
            request.query(`
                SELECT 
                    FORMAT(T.FechaVisita, 'yyyy-MM-dd') as date,
                    COUNT(*) as count
                FROM [SIATC].[Tickets] T
                WHERE T.FechaVisita >= DATEADD(day, -30, GETDATE()) ${companyFilter}
                GROUP BY FORMAT(T.FechaVisita, 'yyyy-MM-dd')
                ORDER BY date
            `)
        ]);

        res.json({
            stats: counts.recordset[0],
            dailyStats: daily.recordset
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).json({ error: 'Error fetching dashboard data' });
    }
};
