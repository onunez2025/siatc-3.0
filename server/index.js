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
    res.json({ status: 'ok', message: 'API is running' });
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

// Endpoint: Obtener Usuarios
app.get('/api/users', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                U.[ID Usuario] as username,
                U.Nombre + ' ' + U.Apellido as name,
                UT.[Tipo de Usuario] as dbRole,
                U.Correo as email,
                U.LastLogin as lastLogin
            FROM [dbo].[GAC_APP_TB_USUARIOS] U
            LEFT JOIN [dbo].[GAC_APP_TB_USUARIOS_TIPO] UT ON U.Tipo = UT.[ID Tipo de Usuario]
        `);

        // Map DB roles to Frontend roles
        const users = result.recordset.map(u => {
            let role = 'OPERADOR'; // Default
            const dbRole = (u.dbRole || '').toUpperCase();

            if (dbRole.includes('ADMINISTRADOR')) {
                role = 'ADMIN';
            } else if (dbRole.includes('TECNICO') || dbRole.includes('CHOFER')) {
                role = 'TECNICO';
            } else if (dbRole.includes('SUPERVISOR') || dbRole.includes('ASISTENTE')) {
                role = 'OPERADOR';
            }

            return {
                id: u.username,
                username: u.username,
                name: u.name,
                role: role,
                originalRole: u.dbRole, // Keep original for reference
                email: u.email,
                lastLogin: u.lastLogin || '-'
            };
        });

        res.json(users);
    } catch (err) {
        console.error(err);
    }
});

// Endpoint: Obtener Tipos de Usuario
app.get('/api/user-types', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                [ID Tipo de Usuario] as id,
                [Tipo de Usuario] as name
            FROM [dbo].[GAC_APP_TB_USUARIOS_TIPO]
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching user types' });
    }
});

// Endpoint: Actualizar Usuario
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params; // This is the username/ID
    const { name, email, typeId, password } = req.body;

    try {
        const pool = await getConnection();

        // Basic update query
        let query = `
            UPDATE [dbo].[GAC_APP_TB_USUARIOS]
            SET 
                Correo = @email,
                Tipo = @typeId
        `;

        if (password && password.trim() !== '') {
            query += `, Contraseña = @password`;
        }

        // Handle name splitting
        const nameParts = name ? name.split(' ') : ['', ''];
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        query += `, Nombre = @firstName, Apellido = @lastName`;
        query += ` WHERE [ID Usuario] = @id`;

        const request = pool.request()
            .input('id', sql.NVarChar, id)
            .input('email', sql.NVarChar, email)
            .input('typeId', sql.NVarChar, typeId)
            .input('firstName', sql.NVarChar, firstName)
            .input('lastName', sql.NVarChar, lastName);

        if (password && password.trim() !== '') {
            request.input('password', sql.NVarChar, password);
        }

        await request.query(query);

        res.json({ success: true, message: 'User updated' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating user' });
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

// Helper: Formatear Ticket desde el objeto de la base de datos
app.get('/api/tickets', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;
        const company = req.query.company;

        // Dynamic Column filters
        const colFilters = {};
        Object.keys(req.query).forEach(key => {
            if (key.startsWith('col_')) {
                colFilters[key.replace('col_', '')] = req.query[key];
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
                OR T.Distrito LIKE @search
            )`;
        }

        // Dynamic column filters
        Object.keys(colFilters).forEach((col, index) => {
            baseQuery += ` AND T.${col} LIKE @col_${index}`;
        });

        // Helper to populate request inputs
        const populateInputs = (req) => {
            if (status && status !== 'Todos') req.input('status', sql.NVarChar, status);
            if (company && company !== 'undefined') req.input('company', sql.VarChar, company);
            if (search) req.input('search', sql.NVarChar, `%${search}%`);
            Object.keys(colFilters).forEach((col, index) => {
                req.input(`col_${index}`, sql.NVarChar, `%${colFilters[col]}%`);
            });
        };

        // 1. Get Total Count (fast with proper indexes)
        const countReq = pool.request();
        populateInputs(countReq);
        const countResult = await countReq.query(`SELECT COUNT(*) as total ${baseQuery}`);
        const total = countResult.recordset[0].total;

        // 2. Get Data with pagination
        const validOffset = Math.max(0, offset);
        const dataReq = pool.request();
        populateInputs(dataReq);

        console.log('[SIATC.Tickets] Executing optimized query...');
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
            ORDER BY T.FechaVisita DESC
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


// Endpoint: Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Login attempt for: '${username}' with password length: ${password?.length}`);

        const pool = await getConnection();

        // Query fetching user and role details
        // Linking GAC_APP_TB_USUARIOS.Tipo -> GAC_APP_TB_USUARIOS_TIPO.[ID Tipo de Usuario]
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT 
                    U.[ID Usuario] as Id,
                    U.Nombre, 
                    U.Apellido, 
                    U.Cod_usuario, 
                    U.[Contraseña] as Password,
                    T.[Tipo de Usuario] as Role,
                    C.Nombre_CAS as CompanyName,
                    C.Codigo_FSM as FsmCode
                FROM [dbo].[GAC_APP_TB_USUARIOS] U
                LEFT JOIN [dbo].[GAC_APP_TB_USUARIOS_TIPO] T ON U.Tipo = T.[ID Tipo de Usuario]
                LEFT JOIN [dbo].[GAC_APP_TB_CAS] C ON U.Empresa = C.ID_CAS
                WHERE U.[ID Usuario] = @username
            `);

        const user = result.recordset[0];
        if (!user) {
            console.log('User not found in DB');
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // Verify password (Plain text based on sample "123")
        // Using trim() on both sides to be safe against whitespace
        const dbPassword = (user.Password || '').trim();
        const inputPassword = (password || '').trim();

        if (dbPassword !== inputPassword) {
            console.log(`Password mismatch. DB: '${dbPassword}', Input: '${inputPassword}'`);
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const fullName = `${user.Nombre || ''} ${user.Apellido || ''}`.trim();

        // Map DB Roles to Frontend Roles (ADMIN, TECNICO, OPERADOR)
        let role = 'OPERADOR'; // Default
        const dbRole = (user.Role || '').toUpperCase();

        if (dbRole.includes('ADMINISTRADOR')) {
            role = 'ADMIN';
        } else if (dbRole.includes('TECNICO') || dbRole.includes('CHOFER')) {
            role = 'TECNICO';
        } else if (dbRole.includes('SUPERVISOR') || dbRole.includes('ASISTENTE')) {
            role = 'OPERADOR';
        }


        const token = jwt.sign(
            { id: user.Id, username: user.Cod_usuario, role: role },
            process.env.JWT_SECRET || 'secret_key_123',
            { expiresIn: '24h' }
        );

        // Update Last Login Time
        await pool.request()
            .input('username', sql.VarChar, user.Id)
            .query('UPDATE [dbo].[GAC_APP_TB_USUARIOS] SET LastLogin = GETDATE() WHERE [ID Usuario] = @username');

        res.json({
            token,
            user: {
                id: user.Id,
                username: user.Cod_usuario,
                name: fullName,
                role: role,
                companyName: user.CompanyName,
                fsmCode: user.FsmCode
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
