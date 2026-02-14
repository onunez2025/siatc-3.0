const { getConnection, sql } = require('../db');

exports.getUsers = async (req, res) => {
    try {
        const { search, role, page = 1, limit = 20, sortBy, sortDir } = req.query;
        const pool = await getConnection();
        const request = pool.request();

        let where = ' WHERE 1=1 ';
        if (search) {
            request.input('search', sql.NVarChar, `%${search}%`);
            where += ` AND (U.Username LIKE @search OR U.Nombre LIKE @search OR U.Apellido LIKE @search OR U.Email LIKE @search)`;
        }
        if (role) {
            request.input('role', sql.Int, parseInt(role));
            where += ` AND U.IdRol = @role`;
        }

        // Count
        const countReq = pool.request();
        if (search) countReq.input('search', sql.NVarChar, `%${search}%`);
        if (role) countReq.input('role', sql.Int, parseInt(role));
        const countResult = await countReq.query(`
            SELECT COUNT(*) as total
            FROM [SIATC].[Usuarios] U
            ${where}
        `);
        const total = countResult.recordset[0].total;

        // Sort
        const sortWhitelist = ['username', 'name', 'role', 'email', 'lastLogin', 'active'];
        let orderBy = 'U.Nombre ASC';
        if (sortBy && sortWhitelist.includes(sortBy)) {
            const dir = sortDir === 'desc' ? 'DESC' : 'ASC';
            const colMap = { username: 'U.Username', name: 'U.Nombre', role: 'R.NombreRol', email: 'U.Email', lastLogin: 'U.UltimoLogin', active: 'U.Activo' };
            orderBy = `${colMap[sortBy] || 'U.Nombre'} ${dir}`;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const result = await request.query(`
            SELECT 
                U.IdUsuario as id,
                U.Username as username,
                U.Nombre as firstName,
                U.Apellido as lastName,
                U.Nombre + ' ' + U.Apellido as name,
                R.NombreRol as roleName,
                R.IdRol as roleId,
                R.Descripcion as roleDesc,
                U.Email as email,
                U.IdEmpresa as empresaId,
                E.NombreEmpresa as empresaName,
                U.CodigoTecnico as codigoTecnico,
                U.Activo as active,
                U.UltimoLogin as lastLogin,
                U.FechaCreacion as createdAt
            FROM [SIATC].[Usuarios] U
            LEFT JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
            LEFT JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
            ${where}
            ORDER BY ${orderBy}
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        const users = result.recordset.map(u => ({
            id: u.id,
            username: u.username,
            firstName: u.firstName,
            lastName: u.lastName,
            name: u.name,
            roleId: u.roleId,
            roleName: u.roleName,
            roleDesc: u.roleDesc,
            email: u.email,
            empresaId: u.empresaId,
            empresaName: u.empresaName,
            codigoTecnico: u.codigoTecnico,
            active: u.active,
            lastLogin: u.lastLogin || null,
            createdAt: u.createdAt || null
        }));

        res.json({
            data: users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching users' });
    }
};

exports.createUser = async (req, res) => {
    const { username, firstName, lastName, email, roleId, empresaId, codigoTecnico, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username y contraseña son requeridos' });
    }
    try {
        const pool = await getConnection();
        const existing = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT IdUsuario FROM [SIATC].[Usuarios] WHERE Username = @username');
        if (existing.recordset.length > 0) {
            return res.status(409).json({ error: 'El usuario ya existe' });
        }

        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('firstName', sql.NVarChar, firstName || '')
            .input('lastName', sql.NVarChar, lastName || '')
            .input('email', sql.NVarChar, email || '')
            .input('roleId', sql.Int, parseInt(roleId) || 7)
            .input('empresaId', sql.Int, parseInt(empresaId) || 1)
            .input('codigoTecnico', sql.NVarChar, codigoTecnico || null)
            .input('password', sql.NVarChar, password)
            .query(`
                INSERT INTO [SIATC].[Usuarios] (Username, Password, Nombre, Apellido, Email, IdEmpresa, IdRol, CodigoTecnico, Activo, RequiereCambioPassword, FechaCreacion)
                VALUES (@username, @password, @firstName, @lastName, @email, @empresaId, @roleId, @codigoTecnico, 1, 1, GETDATE())
            `);

        res.status(201).json({ success: true, message: 'User created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating user' });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, roleId, empresaId, codigoTecnico, active, password } = req.body;

    try {
        const pool = await getConnection();

        let setClauses = [];
        const request = pool.request().input('id', sql.Int, parseInt(id));

        if (firstName !== undefined) { setClauses.push('Nombre = @firstName'); request.input('firstName', sql.NVarChar, firstName); }
        if (lastName !== undefined) { setClauses.push('Apellido = @lastName'); request.input('lastName', sql.NVarChar, lastName); }
        if (email !== undefined) { setClauses.push('Email = @email'); request.input('email', sql.NVarChar, email); }
        if (roleId !== undefined) { setClauses.push('IdRol = @roleId'); request.input('roleId', sql.Int, parseInt(roleId)); }
        if (empresaId !== undefined) { setClauses.push('IdEmpresa = @empresaId'); request.input('empresaId', sql.Int, parseInt(empresaId)); }
        if (codigoTecnico !== undefined) { setClauses.push('CodigoTecnico = @codigoTecnico'); request.input('codigoTecnico', sql.NVarChar, codigoTecnico); }
        if (active !== undefined) { setClauses.push('Activo = @active'); request.input('active', sql.Bit, active ? 1 : 0); }
        if (password && password.trim() !== '') { setClauses.push('Password = @password'); request.input('password', sql.NVarChar, password); }
        setClauses.push('FechaModificacion = GETDATE()');

        if (setClauses.length === 1) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        await request.query(`UPDATE [SIATC].[Usuarios] SET ${setClauses.join(', ')} WHERE IdUsuario = @id`);
        res.json({ success: true, message: 'User updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating user' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, parseInt(id))
            .query('DELETE FROM [SIATC].[Usuarios] WHERE IdUsuario = @id');
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting user' });
    }
};
