const { getConnection, sql } = require('../db');

exports.getTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;
        const company = req.query.company;
        const tecnicoSearch = req.query.tecnico;
        const telefonoSearch = req.query.telefono;
        const visitaFilter = req.query.visita;
        const trabajoFilter = req.query.trabajo;
        const fechaDesde = req.query.fechaDesde;
        const fechaHasta = req.query.fechaHasta;
        const sortBy = req.query.sortBy;
        const sortDir = (req.query.sortDir || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const serviceType = req.query.serviceType;

        // Whitelist of allowed sort columns
        const allowedSortColumns = ['Ticket', 'NombreCliente', 'NombreEquipo', 'Estado', 'NombreTecnico', 'FechaVisita', 'IDEmpresa', 'Distrito', 'IdServicio', 'TipoServicio'];
        const safeSortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'FechaVisita';
        const safeSortDir = sortDir === 'ASC' ? 'ASC' : 'DESC';

        // Dynamic Column filters
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

        // Base Query
        let baseQuery = `
            FROM [SIATC].[Tickets] T
            LEFT JOIN [dbo].[GAC_APP_TB_CANCELACIONES] C ON T.Ticket = C.Ticket
            LEFT JOIN [SIATC].[ServicioTipo] ST ON T.IdServicio = ST.Id
            WHERE 1=1
        `;

        // [SECURITY] Technician View Restriction
        // Agnostic of UI filters, if the user is a technician, they ONLY see their tickets.
        if (req.user && req.user.roleName === 'TECNICO') {
            if (req.user.codigoTecnico) {
                baseQuery += ` AND T.CodigoTecnico = @security_codTecnico`;
            } else {
                // Technician without code should see nothing
                baseQuery += ` AND 1=0`;
            }
        }

        // WHERE clauses
        if (status && status !== 'Todos') baseQuery += ` AND T.Estado = @status`;
        if (company && company !== 'undefined') baseQuery += ` AND T.IDEmpresa = @company`;
        if (serviceType && serviceType !== 'Todos') baseQuery += ` AND T.IdServicio = @serviceType`;
        if (search) {
            baseQuery += ` AND (
                T.Ticket LIKE @search OR T.NombreCliente LIKE @search OR T.NombreEquipo LIKE @search
                OR T.NombreTecnico LIKE @search OR T.ApellidoTecnico LIKE @search OR T.CodigoExternoCliente LIKE @search
                OR T.Telefono1 LIKE @search OR T.Celular1 LIKE @search OR T.Celular2 LIKE @search
                OR T.Distrito LIKE @search OR T.CodigoPostal LIKE @search OR T.Email LIKE @search
                OR ST.Descripcion LIKE @search
            )`;
        }
        Object.keys(colFilters).forEach((col, index) => {
            baseQuery += ` AND T.${col} LIKE @col_${index}`;
        });
        if (tecnicoSearch) baseQuery += ` AND (T.NombreTecnico LIKE @tecnicoSearch OR T.ApellidoTecnico LIKE @tecnicoSearch)`;
        if (telefonoSearch) baseQuery += ` AND (T.Telefono1 LIKE @telefonoSearch OR T.Celular1 LIKE @telefonoSearch OR T.Celular2 LIKE @telefonoSearch)`;
        if (fechaDesde) baseQuery += ` AND T.FechaVisita >= @fechaDesde`;
        if (fechaHasta) baseQuery += ` AND T.FechaVisita <= @fechaHasta`;
        if (visitaFilter === '1' || visitaFilter === '0') baseQuery += ` AND T.VisitaRealizada = @visitaFilter`;
        if (trabajoFilter === '1' || trabajoFilter === '0') baseQuery += ` AND T.TrabajoRealizado = @trabajoFilter`;

        // Helper to populate inputs
        const populateInputs = (sqlReq) => {
            if (status && status !== 'Todos') sqlReq.input('status', sql.NVarChar, status);
            if (company && company !== 'undefined') sqlReq.input('company', sql.VarChar, company);
            if (serviceType && serviceType !== 'Todos') sqlReq.input('serviceType', sql.NVarChar, serviceType);
            if (search) sqlReq.input('search', sql.NVarChar, `%${search}%`);
            if (tecnicoSearch) sqlReq.input('tecnicoSearch', sql.NVarChar, `%${tecnicoSearch}%`);
            if (telefonoSearch) sqlReq.input('telefonoSearch', sql.NVarChar, `%${telefonoSearch}%`);
            if (fechaDesde) sqlReq.input('fechaDesde', sql.DateTime, new Date(fechaDesde));
            if (fechaHasta) sqlReq.input('fechaHasta', sql.DateTime, new Date(fechaHasta + 'T23:59:59'));
            if (visitaFilter === '1' || visitaFilter === '0') sqlReq.input('visitaFilter', sql.Bit, parseInt(visitaFilter));
            if (trabajoFilter === '1' || trabajoFilter === '0') sqlReq.input('trabajoFilter', sql.Bit, parseInt(trabajoFilter));
            Object.keys(colFilters).forEach((col, index) => {
                sqlReq.input(`col_${index}`, sql.NVarChar, `%${colFilters[col]}%`);
            });
            // [SECURITY] Input binding for technician
            // Uses Express 'req' from parent scope for user info, and 'sqlReq' for binding
            if (req.user && req.user.roleName === 'TECNICO' && req.user.codigoTecnico) {
                sqlReq.input('security_codTecnico', sql.NVarChar, req.user.codigoTecnico);
            }
        };

        // 1. Get Total Count
        const countReq = pool.request();
        populateInputs(countReq);
        const countResult = await countReq.query(`SELECT COUNT(DISTINCT T.Ticket) as total ${baseQuery}`);
        const total = countResult.recordset[0].total;

        // 2. Get Data
        const validOffset = Math.max(0, offset);
        const dataReq = pool.request();
        populateInputs(dataReq);

        console.log('[SIATC.Tickets] Executing optimized query...', { page, limit, total });
        const result = await dataReq.query(`
            SELECT 
                T.Ticket, T.LlamadaFSM, T.Asunto, T.Estado, T.FechaVisita, T.CheckOut, T.FechaUltimaModificacion,
                T.IdServicio, T.IdCliente, T.CodigoExternoCliente, T.NombreCliente, T.Email,
                T.Celular1, T.Celular2, T.Telefono1, T.Calle, T.NumeroCalle, T.Distrito, T.Ciudad, T.Pais, T.CodigoPostal,
                T.Latitud, T.Longitud, T.Referencia, T.IdEquipo, T.CodigoExternoEquipo, T.NombreEquipo,
                T.ComentarioProgramador, T.IDEmpresa, T.CodigoTecnico, T.NombreTecnico, T.ApellidoTecnico,
                T.VisitaRealizada, T.TrabajoRealizado, T.SolicitaNuevaVisita, T.MotivoNuevaVisita,
                T.CodMotivoIncidente, T.FechaModificacionIT, T.ComentarioTecnico, T.LastSync,
                C.Motivo_Cancelacion, C.Autorizador_Cancelacion, C.Generado_el as FechaCancelacion,
                ST.Descripcion as TipoServicio
            ${baseQuery}
            ORDER BY ${safeSortColumn === 'TipoServicio' ? 'ST.Descripcion' : 'T.' + safeSortColumn} ${safeSortDir}
            OFFSET ${validOffset} ROWS FETCH NEXT ${limit} ROWS ONLY
        `);

        // Transform Data
        const tickets = result.recordset.map(t => ({
            ...t,
            id: t.Ticket,
            subject: `${t.TipoServicio || t.IdServicio || 'Servicio'} - ${t.NombreEquipo || 'General'}`,
            date: t.FechaVisita || new Date().toISOString(),
            VisitaRealizada: !!t.VisitaRealizada,
            TrabajoRealizado: !!t.TrabajoRealizado,
            SolicitaNuevaVisita: !!t.SolicitaNuevaVisita,
            TipoServicio: t.TipoServicio
        }));

        // if (tickets.length > 0) {
        //     console.log('[DEBUG] First ticket sample:', {
        //         id: tickets[0].Ticket,
        //         IdServicio: tickets[0].IdServicio,
        //         TipoServicio: tickets[0].TipoServicio
        //     });
        // }

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
        res.status(500).json({ error: 'Error fetching tickets', details: err.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const pool = await getConnection();
        // Use the same table as getTickets: [SIATC].[Tickets]
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN Estado = 'Ready to plan' THEN 1 ELSE 0 END) as readyToPlan,
                SUM(CASE WHEN Estado = 'Released' THEN 1 ELSE 0 END) as released,
                SUM(CASE WHEN Estado = 'Closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN Estado = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM [SIATC].[Tickets]
        `);

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching ticket stats:', err);
        res.status(500).json({ error: 'Error fetching ticket stats' });
    }
};

exports.createTicket = async (req, res) => {
    try {
        const ticketData = req.body;
        const pool = await getConnection();
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
};

exports.updateTicket = async (req, res) => {
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
};

exports.deleteTicket = async (req, res) => {
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
};
