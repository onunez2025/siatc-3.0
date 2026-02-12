const express = require('express');
const cors = require('cors');
const path = require('path');
const { getConnection, sql, poolPromise } = require('./db'); // Modified: Added poolPromise
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;

// CORS - Permitir todos los orígenes para simplificar (producción)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Rota de prueba básica
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running', version: '3.0.2', build: '2026-02-12', schema: 'SIATC' });
});

// Endpoint: Obtener Clientes (BusinessPartners)
app.get('/api/clients', async (req, res) => {
    try {
        const pool = await getConnection();
        // Fetch BPs with their default address
        const result = await pool.request().query(`
            SELECT 
                BP.Id as id,
                BP.Code as ruc,
                BP.Name as name,
                BP.ContactPerson as contact,
                BP.Email as email,
                BP.Phone as phone,
                BP.Status as status,
                ISNULL(A.Street, 'Sin dirección') as address,
                'Gold SLA' as contractType, -- Placeholder
                (SELECT Name FROM SIATC.[Address] WHERE BusinessPartnerId = BP.Id FOR JSON PATH) as sites_json
            FROM SIATC.BusinessPartner BP
            LEFT JOIN SIATC.[Address] A ON A.BusinessPartnerId = BP.Id AND A.IsDefault = 1
        `);

        // Parse JSON sites if needed, or handle in frontend
        const clients = result.recordset.map(c => ({
            ...c,
            sites: c.sites_json ? JSON.parse(c.sites_json).map(s => s.Name) : []
        }));

        res.json(clients);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching clients' });
    }
});

// Endpoint: Obtener Activos (Assets)
// Endpoint: Obtener Activos (Assets / Equipment)
app.get('/api/assets', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                A.Id as internalId,
                A.Code as id,
                A.Name as name,
                A.SerialNumber as serial,
                A.Model as model,
                BP.Name as client,
                A.LastServiceDate as lastService
            FROM SIATC.[Equipment] A
            JOIN SIATC.BusinessPartner BP ON A.BusinessPartnerId = BP.Id
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching assets' });
    }
});

// Endpoint: Obtener Materiales (Items)
app.get('/api/materials', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                Id as id,
                Code as sku,
                Name as name, 
                Description as description,
                Unit as unit,
                StockLevel as stock,
                Price as price
            FROM SIATC.[Item]
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching materials' });
    }
});

// Endpoint: Obtener Usuarios (SIATC schema)
app.get('/api/users', async (req, res) => {
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
});

// Endpoint: Obtener Roles (SIATC schema)
app.get('/api/roles', async (req, res) => {
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
});

// Endpoint: Crear Rol
app.post('/api/roles', async (req, res) => {
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
});

// Endpoint: Actualizar Rol
app.put('/api/roles/:id', async (req, res) => {
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
});

// Endpoint: Eliminar Rol
app.delete('/api/roles/:id', async (req, res) => {
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
});

// Endpoint: Obtener Empresas (SIATC schema)
app.get('/api/empresas', async (req, res) => {
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
});

// Endpoint: Crear Empresa
app.post('/api/empresas', async (req, res) => {
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
});

// Endpoint: Actualizar Empresa
app.put('/api/empresas/:id', async (req, res) => {
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
});

// Endpoint: Eliminar Empresa
app.delete('/api/empresas/:id', async (req, res) => {
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
});

// Endpoint: Actualizar Usuario (SIATC schema)
app.put('/api/users/:id', async (req, res) => {
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
});

// Endpoint: Crear Usuario (SIATC schema)
app.post('/api/users', async (req, res) => {
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
});

// Endpoint: Eliminar Usuario (SIATC schema)
app.delete('/api/users/:id', async (req, res) => {
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
});


// Endpoint: Obtener Servicios (ActivityTypes)
app.get('/api/services', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                Id,
                Code as id,
                Name as name,
                DefaultPriority as priority,
                SlaResponseHours,
                SlaResolutionHours
            FROM SIATC.[ActivityType]
        `);

        const services = result.recordset.map(s => ({
            internalId: s.Id,
            id: s.id, // Code
            name: s.name,
            priority: s.priority,
            slaResponse: s.SlaResponseHours + 'h',
            slaResolution: s.SlaResolutionHours + 'h'
        }));

        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching services' });
    }
});

// Endpoint: Obtener Tipos de Servicio desde APPGAC.ServicioTipo
app.get('/api/service-types', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT Id as id, Descripcion as name FROM [APPGAC].[ServicioTipo] ORDER BY Descripcion');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching service types' });
    }
});

// Endpoint: Obtener Estadísticas de Hoy
app.get('/api/stats/today', async (req, res) => {
    try {
        const pool = await getConnection();
        // Get counts for tickets scheduled today with standardization
        const company = req.query.company;
        let whereClause = "CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)";
        if (company && company !== 'undefined') {
            whereClause += ` AND IDEmpresa = cast(@company as varchar)`;
        }

        const [statsResult, statusDistribution, typeResult] = await Promise.all([
            pool.request().input('company', sql.VarChar, company).query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Estado = 'Ready to plan' THEN 1 ELSE 0 END) as ready,
                    SUM(CASE WHEN Estado = 'Closed' THEN 1 ELSE 0 END) as closed,
                    SUM(CASE WHEN Estado IN ('Cancelled', 'Rechazado por service', 'Reprogramado') THEN 1 ELSE 0 END) as other
                FROM [APPGAC].[Servicios]
                WHERE ${whereClause}
            `),
            pool.request().input('company', sql.VarChar, company).query(`
                SELECT Estado as name, COUNT(*) as value
                FROM [APPGAC].[Servicios]
                WHERE ${whereClause}
                GROUP BY Estado
            `),
            pool.request().input('company', sql.VarChar, company).query(`
                SELECT 
                    ISNULL(TRIM(ST.Descripcion), 'Sin Especificar') as name,
                    COUNT(*) as value
                FROM [APPGAC].[Servicios] S
                LEFT JOIN [APPGAC].[ServicioTipo] ST ON S.IdServicio = ST.Id
                WHERE CAST(S.FechaVisita AS DATE) = CAST(GETDATE() AS DATE) ${company && company !== 'undefined' ? " AND S.IDEmpresa = cast(@company as varchar)" : ""}
                GROUP BY ST.Descripcion
                ORDER BY value DESC
            `)
        ]);

        const stats = statsResult.recordset[0];
        res.json({
            total: stats.total || 0,
            ready: stats.ready || 0,
            closed: stats.closed || 0,
            other: stats.other || 0,
            statusDistribution: statusDistribution.recordset,
            byType: typeResult.recordset
        });
    } catch (err) {
        console.error('CRITICAL ERROR IN /api/stats/today:', err);
        res.status(500).json({ error: 'Error fetching today stats', details: err.message, stack: err.stack });
    }
});

// Endpoint: Obtener Motivos de Cancelación
app.get('/api/cancellation-reasons', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT ID_Cancelados_motivo as id, Motivo as name FROM [dbo].[GAC_APP_TB_CANCELACIONES_MOTIVOS] ORDER BY Motivo');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching cancellation reasons' });
    }
});

// Endpoint: Registrar Cancelación
app.post('/api/tickets/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo, autorizador } = req.body;
        const pool = await getConnection();

        // VALIDATION: Check if ticket is already closed
        const checkResult = await pool.request()
            .input('ticket', sql.VarChar, id)
            .query(`SELECT Estado FROM [APPGAC].[Servicios] WHERE Ticket = @ticket`);

        if (checkResult.recordset.length > 0 && checkResult.recordset[0].Estado === 'Closed') {
            return res.status(400).json({ error: 'No se puede cancelar un ticket cerrado (Closed).' });
        }

        const idCancelados = `CAN-${Date.now()}`;

        await pool.request()
            .input('idCancelados', sql.VarChar, idCancelados)
            .input('ticket', sql.VarChar, id)
            .input('motivo', sql.VarChar, motivo)
            .input('autorizador', sql.VarChar, autorizador)
            .query(`
                INSERT INTO [dbo].[GAC_APP_TB_CANCELACIONES] 
                (ID_Cancelados, Ticket, Motivo_Cancelacion, Autorizador_Cancelacion, Generado_el)
                VALUES 
                (@idCancelados, @ticket, @motivo, @autorizador, GETDATE())
            `);

        // Also update ticket status to 'Cancelled' to maintain consistency
        await pool.request()
            .input('ticket', sql.VarChar, id)
            .query(`UPDATE [APPGAC].[Servicios] SET Estado = 'Cancelled' WHERE Ticket = @ticket`);

        res.json({ success: true, message: 'Servicio cancelado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error registrando la cancelación' });
    }
});

// Endpoint: Estadísticas del Dashboard (optimizado, COUNT directo en SQL)
app.get('/api/tickets/stats', async (req, res) => {
    try {
        const pool = await getConnection();
        
        // Get today's date as string YYYY-MM-DD for SQL comparison
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // "2026-02-11"

        console.log(`[STATS] Fetching stats for today: ${todayStr}`);

        // Get counts by Estado for today's tickets using [SIATC].[Tickets]
        // Using CAST to compare only the DATE part, ignoring time
        const result = await pool.request()
            .input('today', sql.Date, todayStr)
            .query(`
                SELECT 
                    Estado,
                    COUNT(*) as Count
                FROM [SIATC].[Tickets]
                WHERE CAST(FechaVisita AS DATE) = @today
                GROUP BY Estado
            `);

        // Get total count for today
        const totalResult = await pool.request()
            .input('today', sql.Date, todayStr)
            .query(`
                SELECT COUNT(*) as Total
                FROM [SIATC].[Tickets]
                WHERE CAST(FechaVisita AS DATE) = @today
            `);

        // Build stats object
        const stats = {
            total: totalResult.recordset[0].Total,
            readyToPlan: 0,
            released: 0,
            closed: 0,
            cancelled: 0,
            date: todayStr
        };

        // Map results to stats
        result.recordset.forEach(row => {
            const estado = (row.Estado || '').trim();
            switch (estado) {
                case 'Ready to plan':
                    stats.readyToPlan = row.Count;
                    break;
                case 'Released':
                    stats.released = row.Count;
                    break;
                case 'Closed':
                    stats.closed = row.Count;
                    break;
                case 'Cancelled':
                    stats.cancelled = row.Count;
                    break;
            }
        });

        console.log(`[STATS] Today's stats:`, stats);
        res.json(stats);

    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Error fetching statistics' });
    }
});

// Endpoint: Dashboard KPIs completo
app.get('/api/dashboard', async (req, res) => {
    try {
        const pool = await getConnection();
        const todayStr = new Date().toISOString().split('T')[0];

        const [ticketToday, ticketWeek, ticketByStatus, ticketByEmpresa, userStats, empresaStats, ticketTrend] = await Promise.all([
            // 1. Tickets de hoy por estado
            pool.request().input('today', sql.Date, todayStr).query(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN Estado = 'Ready to plan' THEN 1 ELSE 0 END) as readyToPlan,
                    SUM(CASE WHEN Estado = 'Released' THEN 1 ELSE 0 END) as released,
                    SUM(CASE WHEN Estado = 'Closed' THEN 1 ELSE 0 END) as closed,
                    SUM(CASE WHEN Estado = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
                FROM [SIATC].[Tickets]
                WHERE CAST(FechaVisita AS DATE) = @today
            `),
            // 2. Tickets últimos 7 días
            pool.request().query(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN Estado = 'Closed' THEN 1 ELSE 0 END) as closed,
                    SUM(CASE WHEN Estado = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
                FROM [SIATC].[Tickets]
                WHERE CAST(FechaVisita AS DATE) >= CAST(DATEADD(DAY, -7, GETDATE()) AS DATE)
            `),
            // 3. Distribución por estado (todos)
            pool.request().input('today', sql.Date, todayStr).query(`
                SELECT Estado as status, COUNT(*) as count
                FROM [SIATC].[Tickets]
                WHERE CAST(FechaVisita AS DATE) = @today
                GROUP BY Estado
                ORDER BY count DESC
            `),
            // 4. Top 5 empresas con más tickets hoy
            pool.request().input('today', sql.Date, todayStr).query(`
                SELECT TOP 5 IDEmpresa as empresa, COUNT(*) as count
                FROM [SIATC].[Tickets]
                WHERE CAST(FechaVisita AS DATE) = @today AND IDEmpresa IS NOT NULL AND IDEmpresa != ''
                GROUP BY IDEmpresa
                ORDER BY count DESC
            `),
            // 5. Stats de usuarios
            pool.request().query(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN Activo = 1 THEN 1 ELSE 0 END) as active,
                    (SELECT COUNT(DISTINCT IdRol) FROM [SIATC].[Usuarios]) as rolesUsed
                FROM [SIATC].[Usuarios]
            `),
            // 6. Stats de empresas
            pool.request().query(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN TipoEmpresa = 'PROPIA' THEN 1 ELSE 0 END) as propias,
                    SUM(CASE WHEN TipoEmpresa = 'CAS' THEN 1 ELSE 0 END) as cas,
                    SUM(CASE WHEN Activo = 1 THEN 1 ELSE 0 END) as active
                FROM [SIATC].[Empresas]
            `),
            // 7. Tendencia últimos 7 días
            pool.request().query(`
                SELECT
                    CAST(FechaVisita AS DATE) as date,
                    COUNT(*) as total,
                    SUM(CASE WHEN Estado = 'Closed' THEN 1 ELSE 0 END) as closed
                FROM [SIATC].[Tickets]
                WHERE CAST(FechaVisita AS DATE) >= CAST(DATEADD(DAY, -6, GETDATE()) AS DATE)
                    AND CAST(FechaVisita AS DATE) <= CAST(GETDATE() AS DATE)
                GROUP BY CAST(FechaVisita AS DATE)
                ORDER BY date ASC
            `)
        ]);

        const today = ticketToday.recordset[0];
        const week = ticketWeek.recordset[0];
        const users = userStats.recordset[0];
        const empresas = empresaStats.recordset[0];

        res.json({
            date: todayStr,
            ticketsToday: {
                total: today.total || 0,
                readyToPlan: today.readyToPlan || 0,
                released: today.released || 0,
                closed: today.closed || 0,
                cancelled: today.cancelled || 0
            },
            ticketsWeek: {
                total: week.total || 0,
                closed: week.closed || 0,
                cancelled: week.cancelled || 0
            },
            statusDistribution: ticketByStatus.recordset.map(r => ({ status: r.status, count: r.count })),
            topEmpresas: ticketByEmpresa.recordset.map(r => ({ empresa: r.empresa, count: r.count })),
            users: { total: users.total || 0, active: users.active || 0, rolesUsed: users.rolesUsed || 0 },
            empresas: { total: empresas.total || 0, propias: empresas.propias || 0, cas: empresas.cas || 0, active: empresas.active || 0 },
            trend: ticketTrend.recordset.map(r => ({ date: r.date, total: r.total, closed: r.closed }))
        });
    } catch (err) {
        console.error('Error in /api/dashboard:', err);
        res.status(500).json({ error: 'Error fetching dashboard data' });
    }
});

// Helper: Formatear Ticket desde el objeto de la base de datos
app.get('/api/tickets', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;
        const company = req.query.company;
        const tecnicoSearch = req.query.tecnico;
        const telefonoSearch = req.query.telefono;
        const fechaDesde = req.query.fechaDesde;
        const fechaHasta = req.query.fechaHasta;
        const sortBy = req.query.sortBy;
        const sortDir = (req.query.sortDir || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Whitelist of allowed sort columns to prevent SQL injection
        const allowedSortColumns = ['Ticket', 'NombreCliente', 'NombreEquipo', 'Estado', 'NombreTecnico', 'FechaVisita', 'IDEmpresa', 'Distrito', 'IdServicio'];
        const safeSortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'FechaVisita';
        const safeSortDir = sortDir === 'ASC' ? 'ASC' : 'DESC';

        // Dynamic Column filters (whitelisted to prevent SQL injection)
        const allowedColFilters = ['NombreCliente', 'IDEmpresa', 'CodigoExternoCliente', 'Distrito', 'CodigoPostal', 'NombreEquipo', 'Estado'];
        const colFilters = {};
        Object.keys(req.query).forEach(key => {
            if (key.startsWith('col_')) {
                const col = key.replace('col_', '');
                if (allowedColFilters.includes(col)) {
                    colFilters[col] = req.query[key];
                }
            }
        });

        const pool = await getConnection();

        // Base Query using optimized [SIATC].[Tickets] table (indexed, correct data types)
        // This is a mirror of [APPGAC].[Servicios] synced by sync-service.js
        let baseQuery = `
            FROM [SIATC].[Tickets] T
            LEFT JOIN [dbo].[GAC_APP_TB_CANCELACIONES] C ON T.Ticket = C.Ticket
            WHERE 1=1
        `;

        // Build WHERE clauses dynamically
        if (status && status !== 'Todos') {
            baseQuery += ` AND T.Estado = @status`;
        }
        if (company && company !== 'undefined') {
            baseQuery += ` AND T.IDEmpresa = @company`;
        }
        if (search) {
            baseQuery += ` AND (
                T.Ticket LIKE @search 
                OR T.NombreCliente LIKE @search 
                OR T.NombreEquipo LIKE @search
                OR T.NombreTecnico LIKE @search
                OR T.ApellidoTecnico LIKE @search
                OR T.CodigoExternoCliente LIKE @search
                OR T.Telefono1 LIKE @search
                OR T.Celular1 LIKE @search
                OR T.Celular2 LIKE @search
                OR T.Distrito LIKE @search
                OR T.CodigoPostal LIKE @search
                OR T.Email LIKE @search
            )`;
        }

        // Dynamic column filters
        Object.keys(colFilters).forEach((col, index) => {
            baseQuery += ` AND T.${col} LIKE @col_${index}`;
        });

        // Compound tecnico filter (searches NombreTecnico + ApellidoTecnico)
        if (tecnicoSearch) {
            baseQuery += ` AND (T.NombreTecnico LIKE @tecnicoSearch OR T.ApellidoTecnico LIKE @tecnicoSearch)`;
        }

        // Compound telefono filter (searches Telefono1 + Celular1 + Celular2)
        if (telefonoSearch) {
            baseQuery += ` AND (T.Telefono1 LIKE @telefonoSearch OR T.Celular1 LIKE @telefonoSearch OR T.Celular2 LIKE @telefonoSearch)`;
        }

        // Date range filters
        if (fechaDesde) {
            baseQuery += ` AND T.FechaVisita >= @fechaDesde`;
        }
        if (fechaHasta) {
            baseQuery += ` AND T.FechaVisita <= @fechaHasta`;
        }

        // Helper to populate request inputs
        const populateInputs = (req) => {
            if (status && status !== 'Todos') req.input('status', sql.NVarChar, status);
            if (company && company !== 'undefined') req.input('company', sql.VarChar, company);
            if (search) req.input('search', sql.NVarChar, `%${search}%`);
            if (tecnicoSearch) req.input('tecnicoSearch', sql.NVarChar, `%${tecnicoSearch}%`);
            if (telefonoSearch) req.input('telefonoSearch', sql.NVarChar, `%${telefonoSearch}%`);
            if (fechaDesde) req.input('fechaDesde', sql.DateTime, new Date(fechaDesde));
            if (fechaHasta) req.input('fechaHasta', sql.DateTime, new Date(fechaHasta + 'T23:59:59'));
            Object.keys(colFilters).forEach((col, index) => {
                req.input(`col_${index}`, sql.NVarChar, `%${colFilters[col]}%`);
            });
        };

        // 1. Get Total Count (fast with proper indexes)
        const countReq = pool.request();
        populateInputs(countReq);
        const countResult = await countReq.query(`SELECT COUNT(DISTINCT T.Ticket) as total ${baseQuery}`);
        const total = countResult.recordset[0].total;

        // 2. Get Data with pagination
        const validOffset = Math.max(0, offset);
        const dataReq = pool.request();
        populateInputs(dataReq);

        console.log('[SIATC.Tickets] Executing optimized query...', { page, limit, status, search, company, fechaDesde, fechaHasta, sortBy: safeSortColumn, sortDir: safeSortDir, colFilters, total });
        const result = await dataReq.query(`
            SELECT 
                T.Ticket,
                T.LlamadaFSM,
                T.Asunto,
                T.Estado,
                T.FechaVisita,
                T.CheckOut,
                T.FechaUltimaModificacion,
                T.IdServicio,
                T.IdCliente,
                T.CodigoExternoCliente,
                T.NombreCliente,
                T.Email,
                T.Celular1,
                T.Celular2,
                T.Telefono1,
                T.Calle,
                T.NumeroCalle,
                T.Distrito,
                T.Ciudad,
                T.Pais,
                T.CodigoPostal,
                T.Latitud,
                T.Longitud,
                T.Referencia,
                T.IdEquipo,
                T.CodigoExternoEquipo,
                T.NombreEquipo,
                T.ComentarioProgramador,
                T.IDEmpresa,
                T.CodigoTecnico,
                T.NombreTecnico,
                T.ApellidoTecnico,
                T.VisitaRealizada,
                T.TrabajoRealizado,
                T.SolicitaNuevaVisita,
                T.MotivoNuevaVisita,
                T.CodMotivoIncidente,
                T.FechaModificacionIT,
                T.ComentarioTecnico,
                T.LastSync,
                C.Motivo_Cancelacion, 
                C.Autorizador_Cancelacion, 
                C.Generado_el as FechaCancelacion
            ${baseQuery}
            ORDER BY T.${safeSortColumn} ${safeSortDir}
            OFFSET ${validOffset} ROWS FETCH NEXT ${limit} ROWS ONLY
        `);
        console.log('[SIATC.Tickets] Query executed. Rows:', result.recordset.length);

        // Transform Data - booleans are already BIT type in SIATC.Tickets, no parsing needed
        const tickets = result.recordset.map(t => ({
            ...t,
            id: t.Ticket,
            subject: `${t.IdServicio || 'Servicio'} - ${t.NombreEquipo || 'General'}`,
            date: t.FechaVisita || new Date().toISOString(),
            // BIT fields are already boolean, but ensure consistency
            VisitaRealizada: !!t.VisitaRealizada,
            TrabajoRealizado: !!t.TrabajoRealizado,
            SolicitaNuevaVisita: !!t.SolicitaNuevaVisita
        }));

        res.json({
            data: tickets,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('CRITICAL ERROR IN /api/tickets:', err);
        res.status(500).json({ error: 'Error fetching tickets', details: err.message, stack: err.stack });
    }
});


// =============================================
// ITEMS (SIATC.Items)
// =============================================

// GET /api/items — List with pagination, search, filters, sorting
app.get('/api/items', async (req, res) => {
    try {
        const pool = await getConnection();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const offset = (page - 1) * limit;
        const search = (req.query.search || '').trim();
        const categoria = (req.query.categoria || '').trim();
        const tipo = (req.query.tipo || '').trim();
        const estado = (req.query.estado || '').trim();
        const sector = (req.query.sector || '').trim();

        // Sorting
        const allowedSort = ['IdItem', 'CodigoSAP', 'CodigoExterno', 'Nombre', 'Categoria', 'UnidadMedida', 'Tipo', 'Estado', 'Sector', 'FechaCreacion'];
        let sortBy = allowedSort.includes(req.query.sortBy) ? req.query.sortBy : 'Nombre';
        const sortDir = req.query.sortDir === 'desc' ? 'DESC' : 'ASC';

        let whereClauses = [];
        const request = pool.request();

        if (search) {
            whereClauses.push(`(I.Nombre LIKE @search OR I.CodigoSAP LIKE @search OR I.CodigoExterno LIKE @search OR I.Categoria LIKE @search)`);
            request.input('search', sql.NVarChar, `%${search}%`);
        }
        if (categoria) {
            whereClauses.push(`I.Categoria = @categoria`);
            request.input('categoria', sql.NVarChar, categoria);
        }
        if (tipo) {
            whereClauses.push(`I.Tipo = @tipo`);
            request.input('tipo', sql.NVarChar, tipo);
        }
        if (estado) {
            whereClauses.push(`I.Estado = @estado`);
            request.input('estado', sql.NVarChar, estado);
        }
        if (sector) {
            whereClauses.push(`I.Sector = @sector`);
            request.input('sector', sql.NVarChar, sector);
        }

        const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Count
        const countResult = await request.query(`SELECT COUNT(*) as total FROM [SIATC].[Items] I ${whereSQL}`);
        const total = countResult.recordset[0].total;

        // Data
        const dataRequest = pool.request();
        if (search) dataRequest.input('search', sql.NVarChar, `%${search}%`);
        if (categoria) dataRequest.input('categoria', sql.NVarChar, categoria);
        if (tipo) dataRequest.input('tipo', sql.NVarChar, tipo);
        if (estado) dataRequest.input('estado', sql.NVarChar, estado);
        if (sector) dataRequest.input('sector', sql.NVarChar, sector);

        const dataResult = await dataRequest
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT 
                    I.IdItem as id,
                    I.CodigoSAP as codigoSAP,
                    I.CodigoExterno as codigoExterno,
                    I.Nombre as nombre,
                    I.Categoria as categoria,
                    I.UnidadMedida as unidadMedida,
                    I.Tipo as tipo,
                    I.Estado as estado,
                    I.Garantia as garantia,
                    I.Sector as sector,
                    I.Descuento as descuento,
                    I.EstadoEnCatalogo as estadoEnCatalogo,
                    I.FechaCreacion as fechaCreacion,
                    I.FechaModificacion as fechaModificacion
                FROM [SIATC].[Items] I
                ${whereSQL}
                ORDER BY CASE WHEN I.${sortBy} IS NULL THEN 1 ELSE 0 END, I.${sortBy} ${sortDir}
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `);

        res.json({
            data: dataResult.recordset,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: 'Error fetching items', details: err.message });
    }
});

// GET /api/items/stats — KPI stats
app.get('/api/items/stats', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN Estado = 'Activo' THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN Estado = 'Inactivo' THEN 1 ELSE 0 END) as inactivos,
                SUM(CASE WHEN Tipo = 'Pieza' THEN 1 ELSE 0 END) as piezas,
                SUM(CASE WHEN Tipo = 'Servicio' THEN 1 ELSE 0 END) as servicios,
                SUM(CASE WHEN Tipo = 'Catálogo' THEN 1 ELSE 0 END) as catalogo,
                COUNT(DISTINCT Categoria) as categorias,
                COUNT(DISTINCT Sector) as sectores
            FROM [SIATC].[Items]
        `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching item stats:', err);
        res.status(500).json({ error: 'Error fetching item stats' });
    }
});

// GET /api/items/filters — Distinct values for filters
app.get('/api/items/filters', async (req, res) => {
    try {
        const pool = await getConnection();
        const [categorias, tipos, estados, sectores] = await Promise.all([
            pool.request().query(`SELECT DISTINCT Categoria as value FROM [SIATC].[Items] WHERE Categoria IS NOT NULL ORDER BY Categoria`),
            pool.request().query(`SELECT DISTINCT Tipo as value FROM [SIATC].[Items] ORDER BY Tipo`),
            pool.request().query(`SELECT DISTINCT Estado as value FROM [SIATC].[Items] ORDER BY Estado`),
            pool.request().query(`SELECT DISTINCT Sector as value FROM [SIATC].[Items] WHERE Sector IS NOT NULL ORDER BY Sector`)
        ]);
        res.json({
            categorias: categorias.recordset.map(r => r.value),
            tipos: tipos.recordset.map(r => r.value),
            estados: estados.recordset.map(r => r.value),
            sectores: sectores.recordset.map(r => r.value)
        });
    } catch (err) {
        console.error('Error fetching item filters:', err);
        res.status(500).json({ error: 'Error fetching item filters' });
    }
});

// GET /api/items/:id — Single item detail
app.get('/api/items/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, parseInt(req.params.id))
            .query(`
                SELECT 
                    IdItem as id,
                    CodigoSAP as codigoSAP,
                    CodigoExterno as codigoExterno,
                    Nombre as nombre,
                    Categoria as categoria,
                    UnidadMedida as unidadMedida,
                    Tipo as tipo,
                    Estado as estado,
                    Garantia as garantia,
                    Sector as sector,
                    Descuento as descuento,
                    EstadoEnCatalogo as estadoEnCatalogo,
                    FechaCreacion as fechaCreacion,
                    FechaModificacion as fechaModificacion
                FROM [SIATC].[Items]
                WHERE IdItem = @id
            `);
        if (!result.recordset[0]) {
            return res.status(404).json({ error: 'Item no encontrado' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching item:', err);
        res.status(500).json({ error: 'Error fetching item' });
    }
});

// POST /api/items — Create item
app.post('/api/items', async (req, res) => {
    try {
        const { codigoSAP, codigoExterno, nombre, categoria, unidadMedida, tipo, estado, garantia, sector, descuento, estadoEnCatalogo } = req.body;
        if (!codigoSAP || !nombre) {
            return res.status(400).json({ error: 'CodigoSAP y Nombre son requeridos' });
        }
        const pool = await getConnection();

        // Duplicate check
        const existing = await pool.request()
            .input('codigoSAP', sql.NVarChar, codigoSAP)
            .query('SELECT IdItem FROM [SIATC].[Items] WHERE CodigoSAP = @codigoSAP');
        if (existing.recordset.length > 0) {
            return res.status(409).json({ error: 'Ya existe un item con ese Código SAP' });
        }

        const result = await pool.request()
            .input('codigoSAP', sql.NVarChar, codigoSAP)
            .input('codigoExterno', sql.NVarChar, codigoExterno || null)
            .input('nombre', sql.NVarChar, nombre)
            .input('categoria', sql.NVarChar, categoria || null)
            .input('unidadMedida', sql.NVarChar, unidadMedida || 'Unidad')
            .input('tipo', sql.NVarChar, tipo || 'Pieza')
            .input('estado', sql.NVarChar, estado || 'Activo')
            .input('garantia', sql.NVarChar, garantia || null)
            .input('sector', sql.NVarChar, sector || null)
            .input('descuento', sql.Decimal(5, 2), descuento ? parseFloat(descuento) : null)
            .input('estadoEnCatalogo', sql.NVarChar, estadoEnCatalogo || null)
            .query(`
                INSERT INTO [SIATC].[Items] (CodigoSAP, CodigoExterno, Nombre, Categoria, UnidadMedida, Tipo, Estado, Garantia, Sector, Descuento, EstadoEnCatalogo)
                OUTPUT INSERTED.IdItem
                VALUES (@codigoSAP, @codigoExterno, @nombre, @categoria, @unidadMedida, @tipo, @estado, @garantia, @sector, @descuento, @estadoEnCatalogo)
            `);

        res.status(201).json({ success: true, id: result.recordset[0].IdItem, message: 'Item creado' });
    } catch (err) {
        console.error('Error creating item:', err);
        res.status(500).json({ error: 'Error creating item', details: err.message });
    }
});

// PUT /api/items/:id — Update item
app.put('/api/items/:id', async (req, res) => {
    try {
        const { codigoSAP, codigoExterno, nombre, categoria, unidadMedida, tipo, estado, garantia, sector, descuento, estadoEnCatalogo } = req.body;
        const id = parseInt(req.params.id);
        const pool = await getConnection();

        // Check SAP code uniqueness (exclude current item)
        if (codigoSAP) {
            const dup = await pool.request()
                .input('codigoSAP', sql.NVarChar, codigoSAP)
                .input('id', sql.Int, id)
                .query('SELECT IdItem FROM [SIATC].[Items] WHERE CodigoSAP = @codigoSAP AND IdItem != @id');
            if (dup.recordset.length > 0) {
                return res.status(409).json({ error: 'Ya existe otro item con ese Código SAP' });
            }
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('codigoSAP', sql.NVarChar, codigoSAP)
            .input('codigoExterno', sql.NVarChar, codigoExterno || null)
            .input('nombre', sql.NVarChar, nombre)
            .input('categoria', sql.NVarChar, categoria || null)
            .input('unidadMedida', sql.NVarChar, unidadMedida || 'Unidad')
            .input('tipo', sql.NVarChar, tipo || 'Pieza')
            .input('estado', sql.NVarChar, estado || 'Activo')
            .input('garantia', sql.NVarChar, garantia || null)
            .input('sector', sql.NVarChar, sector || null)
            .input('descuento', sql.Decimal(5, 2), descuento ? parseFloat(descuento) : null)
            .input('estadoEnCatalogo', sql.NVarChar, estadoEnCatalogo || null)
            .query(`
                UPDATE [SIATC].[Items] SET
                    CodigoSAP = @codigoSAP,
                    CodigoExterno = @codigoExterno,
                    Nombre = @nombre,
                    Categoria = @categoria,
                    UnidadMedida = @unidadMedida,
                    Tipo = @tipo,
                    Estado = @estado,
                    Garantia = @garantia,
                    Sector = @sector,
                    Descuento = @descuento,
                    EstadoEnCatalogo = @estadoEnCatalogo,
                    FechaModificacion = GETDATE()
                WHERE IdItem = @id
            `);

        res.json({ success: true, message: 'Item actualizado' });
    } catch (err) {
        console.error('Error updating item:', err);
        res.status(500).json({ error: 'Error updating item', details: err.message });
    }
});

// DELETE /api/items/:id — Delete item
app.delete('/api/items/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id))
            .query('DELETE FROM [SIATC].[Items] WHERE IdItem = @id');
        res.json({ success: true, message: 'Item eliminado' });
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).json({ error: 'Error deleting item' });
    }
});


// Endpoint: Login (SIATC.Usuarios)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Login attempt for: '${username}'`);

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        const pool = await getConnection();

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT 
                    U.IdUsuario,
                    U.Username,
                    U.Password,
                    U.Nombre,
                    U.Apellido,
                    U.Email,
                    U.IdEmpresa,
                    U.IdRol,
                    U.CodigoTecnico,
                    U.Activo,
                    U.RequiereCambioPassword,
                    R.NombreRol,
                    E.NombreEmpresa,
                    E.TipoEmpresa
                FROM [SIATC].[Usuarios] U
                LEFT JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
                LEFT JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
                WHERE U.Username = @username
            `);

        const user = result.recordset[0];
        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // Check if user is active
        if (!user.Activo) {
            return res.status(403).json({ error: 'Usuario desactivado. Contacte al administrador.' });
        }

        // Verify password (plain text comparison — passwords stored as plain text)
        const dbPassword = (user.Password || '').trim();
        const inputPassword = (password || '').trim();

        if (dbPassword !== inputPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const fullName = `${user.Nombre || ''} ${user.Apellido || ''}`.trim();
        const roleName = (user.NombreRol || 'INVITADO').toUpperCase();

        const token = jwt.sign(
            { id: user.IdUsuario, username: user.Username, roleId: user.IdRol, roleName },
            process.env.JWT_SECRET || 'secret_key_123',
            { expiresIn: '24h' }
        );

        // Update UltimoLogin
        await pool.request()
            .input('id', sql.Int, user.IdUsuario)
            .query('UPDATE [SIATC].[Usuarios] SET UltimoLogin = GETDATE() WHERE IdUsuario = @id');

        res.json({
            token,
            user: {
                id: user.IdUsuario,
                username: user.Username,
                name: fullName,
                firstName: user.Nombre,
                lastName: user.Apellido,
                email: user.Email,
                role: roleName,
                roleId: user.IdRol,
                roleName: user.NombreRol,
                empresaId: user.IdEmpresa,
                empresaName: user.NombreEmpresa,
                tipoEmpresa: user.TipoEmpresa,
                codigoTecnico: user.CodigoTecnico,
                requirePasswordChange: !!user.RequiereCambioPassword
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Error interno al iniciar sesión' });
    }
});

// Endpoint: Crear Ticket en APPGAC.Servicios
app.post('/api/tickets', async (req, res) => {
    try {
        const ticketData = req.body;
        const pool = await getConnection();

        // Note: APPGAC.Servicios might have many fields. 
        // For simplicity, we map the core ones. In a real scenario, we'd map all fields.
        const query = `
            INSERT INTO [APPGAC].[Servicios] (
                Ticket, IdServicio, Estado, FechaVisita, NombreCliente, 
                NombreEquipo, ComentarioTecnico, CodigoTecnico, 
                NombreTecnico, ApellidoTecnico, Distrito, Ciudad, Email
            ) VALUES (
                @Ticket, @IdServicio, @Estado, @FechaVisita, @NombreCliente, 
                @NombreEquipo, @ComentarioTecnico, @CodigoTecnico, 
                @NombreTecnico, @ApellidoTecnico, @Distrito, @Ciudad, @Email
            )
        `;

        await pool.request()
            .input('Ticket', sql.NVarChar, ticketData.Ticket)
            .input('IdServicio', sql.NVarChar, ticketData.IdServicio)
            .input('Estado', sql.NVarChar, ticketData.Estado || 'Pendiente')
            .input('FechaVisita', sql.DateTime, ticketData.FechaVisita || new Date())
            .input('NombreCliente', sql.NVarChar, ticketData.NombreCliente)
            .input('NombreEquipo', sql.NVarChar, ticketData.NombreEquipo)
            .input('ComentarioTecnico', sql.NVarChar, ticketData.ComentarioTecnico)
            .input('CodigoTecnico', sql.NVarChar, ticketData.CodigoTecnico)
            .input('NombreTecnico', sql.NVarChar, ticketData.NombreTecnico)
            .input('ApellidoTecnico', sql.NVarChar, ticketData.ApellidoTecnico)
            .input('Distrito', sql.NVarChar, ticketData.Distrito)
            .input('Ciudad', sql.NVarChar, ticketData.Ciudad)
            .input('Email', sql.NVarChar, ticketData.Email)
            .query(query);

        res.status(201).json({ success: true, message: 'Ticket created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating ticket in APPGAC.Servicios' });
    }
});

// Endpoint: Actualizar Ticket en APPGAC.Servicios
app.put('/api/tickets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const ticketData = req.body;
        const pool = await getConnection();

        const query = `
            UPDATE [APPGAC].[Servicios] 
            SET 
                Estado = @Estado,
                FechaVisita = @FechaVisita,
                NombreCliente = @NombreCliente,
                NombreEquipo = @NombreEquipo,
                ComentarioTecnico = @ComentarioTecnico,
                CodigoTecnico = @CodigoTecnico,
                NombreTecnico = @NombreTecnico,
                ApellidoTecnico = @ApellidoTecnico,
                Distrito = @Distrito,
                Ciudad = @Ciudad,
                Email = @Email
            WHERE Ticket = @Id
        `;

        await pool.request()
            .input('Id', sql.NVarChar, id)
            .input('Estado', sql.NVarChar, ticketData.Estado)
            .input('FechaVisita', sql.DateTime, ticketData.FechaVisita)
            .input('NombreCliente', sql.NVarChar, ticketData.NombreCliente)
            .input('NombreEquipo', sql.NVarChar, ticketData.NombreEquipo)
            .input('ComentarioTecnico', sql.NVarChar, ticketData.ComentarioTecnico)
            .input('CodigoTecnico', sql.NVarChar, ticketData.CodigoTecnico)
            .input('NombreTecnico', sql.NVarChar, ticketData.NombreTecnico)
            .input('ApellidoTecnico', sql.NVarChar, ticketData.ApellidoTecnico)
            .input('Distrito', sql.NVarChar, ticketData.Distrito)
            .input('Ciudad', sql.NVarChar, ticketData.Ciudad)
            .input('Email', sql.NVarChar, ticketData.Email)
            .query(query);

        res.json({ success: true, message: 'Ticket updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating ticket in APPGAC.Servicios' });
    }
});

// Endpoint: Eliminar Ticket de APPGAC.Servicios
app.delete('/api/tickets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        await pool.request()
            .input('Id', sql.NVarChar, id)
            .query('DELETE FROM [APPGAC].[Servicios] WHERE Ticket = @Id');

        res.json({ success: true, message: 'Ticket deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting ticket from APPGAC.Servicios' });
    }
});

const { startSyncService } = require('./services/sync-service');

app.listen(port, () => {
    console.log(`Server running on port ${port}`);

    // Start Background Sync Service
    startSyncService();
});
