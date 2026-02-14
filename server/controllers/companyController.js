const { getConnection, sql } = require('../db');

exports.getCompanies = async (req, res) => {
    try {
        const pool = await getConnection();
        const includeInactive = req.query.all === 'true';
        const whereClause = includeInactive ? '' : 'WHERE E.Activo = 1';
        const result = await pool.request().query(`
            SELECT E.IdEmpresa as id, E.NombreEmpresa as name, E.TipoEmpresa as type,
                   E.Activo as active, E.CodigoFSM as codigoFSM,
                   E.FechaCreacion as createdAt, E.FechaModificacion as updatedAt,
                   (SELECT COUNT(*) FROM [SIATC].[Usuarios] U WHERE U.IdEmpresa = E.IdEmpresa) as userCount
            FROM [SIATC].[Empresas] E
            ${whereClause}
            ORDER BY E.NombreEmpresa
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching empresas' });
    }
};

exports.createCompany = async (req, res) => {
    const { name, type, codigoFSM, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre de empresa requerido' });

    try {
        const pool = await getConnection();
        // Check duplicate
        const dup = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .query('SELECT IdEmpresa FROM [SIATC].[Empresas] WHERE NombreEmpresa = @name');
        if (dup.recordset.length > 0) return res.status(409).json({ error: 'La empresa ya existe' });

        const result = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .input('type', sql.NVarChar, (type || 'CAS').toUpperCase())
            .input('codigoFSM', sql.NVarChar, codigoFSM || null)
            .input('active', sql.Bit, active !== undefined ? active : true)
            .query(`INSERT INTO [SIATC].[Empresas] (NombreEmpresa, TipoEmpresa, CodigoFSM, Activo, FechaCreacion, FechaModificacion)
                    OUTPUT INSERTED.IdEmpresa as id
                    VALUES (@name, @type, @codigoFSM, @active, GETDATE(), GETDATE())`);
        res.status(201).json({ id: result.recordset[0].id, message: 'Empresa creada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating empresa' });
    }
};

exports.updateCompany = async (req, res) => {
    const { id } = req.params;
    const { name, type, codigoFSM, active } = req.body;

    try {
        const pool = await getConnection();
        let setClauses = [];
        const request = pool.request().input('id', sql.Int, parseInt(id));

        if (name !== undefined) { setClauses.push('NombreEmpresa = @name'); request.input('name', sql.NVarChar, name.trim()); }
        if (type !== undefined) { setClauses.push('TipoEmpresa = @type'); request.input('type', sql.NVarChar, type.toUpperCase()); }
        if (codigoFSM !== undefined) { setClauses.push('CodigoFSM = @codigoFSM'); request.input('codigoFSM', sql.NVarChar, codigoFSM); }
        if (active !== undefined) { setClauses.push('Activo = @active'); request.input('active', sql.Bit, active); }

        if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });

        setClauses.push('FechaModificacion = GETDATE()');
        await request.query(`UPDATE [SIATC].[Empresas] SET ${setClauses.join(', ')} WHERE IdEmpresa = @id`);
        res.json({ message: 'Empresa actualizada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating empresa' });
    }
};

exports.deleteCompany = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        // Check if empresa has users
        const usersCheck = await pool.request()
            .input('id', sql.Int, parseInt(id))
            .query('SELECT COUNT(*) as count FROM [SIATC].[Usuarios] WHERE IdEmpresa = @id');
        if (usersCheck.recordset[0].count > 0) {
            return res.status(409).json({ error: `No se puede eliminar: ${usersCheck.recordset[0].count} usuario(s) pertenecen a esta empresa` });
        }
        await pool.request().input('id', sql.Int, parseInt(id)).query('DELETE FROM [SIATC].[Empresas] WHERE IdEmpresa = @id');
        res.json({ message: 'Empresa eliminada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting empresa' });
    }
};
