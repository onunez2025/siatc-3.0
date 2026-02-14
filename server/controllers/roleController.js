const { getConnection, sql } = require('../db');

exports.getRoles = async (req, res) => {
    try {
        const pool = await getConnection();
        const includeInactive = req.query.all === 'true';
        const whereClause = includeInactive ? '' : 'WHERE Activo = 1';
        const result = await pool.request().query(`
            SELECT IdRol as id, NombreRol as name, Descripcion as description, Activo as active, FechaCreacion as createdAt
            FROM [SIATC].[Roles]
            ${whereClause}
            ORDER BY IdRol
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching roles' });
    }
};

exports.createRole = async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre de rol requerido' });
    try {
        const pool = await getConnection();
        const existing = await pool.request()
            .input('name', sql.NVarChar, name.toUpperCase())
            .query('SELECT IdRol FROM [SIATC].[Roles] WHERE NombreRol = @name');
        if (existing.recordset.length > 0) return res.status(409).json({ error: 'El rol ya existe' });

        await pool.request()
            .input('name', sql.NVarChar, name.toUpperCase())
            .input('desc', sql.NVarChar, description || '')
            .query(`INSERT INTO [SIATC].[Roles] (NombreRol, Descripcion, Activo, FechaCreacion) VALUES (@name, @desc, 1, GETDATE())`);
        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating role' });
    }
};

exports.updateRole = async (req, res) => {
    const { id } = req.params;
    const { name, description, active } = req.body;
    try {
        const pool = await getConnection();
        let setClauses = [];
        const request = pool.request().input('id', sql.Int, parseInt(id));
        if (name !== undefined) { setClauses.push('NombreRol = @name'); request.input('name', sql.NVarChar, name.toUpperCase()); }
        if (description !== undefined) { setClauses.push('Descripcion = @desc'); request.input('desc', sql.NVarChar, description); }
        if (active !== undefined) { setClauses.push('Activo = @active'); request.input('active', sql.Bit, active ? 1 : 0); }
        if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });
        await request.query(`UPDATE [SIATC].[Roles] SET ${setClauses.join(', ')} WHERE IdRol = @id`);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating role' });
    }
};

exports.deleteRole = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        // Check if role is in use
        const inUse = await pool.request()
            .input('id', sql.Int, parseInt(id))
            .query('SELECT COUNT(*) as count FROM [SIATC].[Usuarios] WHERE IdRol = @id');
        if (inUse.recordset[0].count > 0) {
            return res.status(409).json({ error: `No se puede eliminar: ${inUse.recordset[0].count} usuario(s) tienen este rol asignado` });
        }
        await pool.request().input('id', sql.Int, parseInt(id)).query('DELETE FROM [SIATC].[Roles] WHERE IdRol = @id');
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting role' });
    }
};
