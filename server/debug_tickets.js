const { getConnection, sql } = require('./db');

async function debugTickets() {
    try {
        console.log('Connecting...');
        const pool = await getConnection();

        // Mock query params
        const status = 'Todos';
        const search = '';
        const company = undefined;
        const page = 1;
        const limit = 10;
        const offset = 0;
        const colFilters = {};

        // Base Query without SELECT/ORDER BY/OFFSET
        let baseQuery = `
            FROM [APPGAC].[Servicios] S
            LEFT JOIN [APPGAC].[ServicioTipo] ST ON TRIM(S.IdServicio) = TRIM(ST.Id)
            LEFT JOIN [dbo].[GAC_APP_TB_CANCELACIONES] C ON S.Ticket = C.Ticket
            WHERE 1=1
        `;

        // Apply filters to build query string
        if (status && status !== 'Todos') {
            baseQuery += ` AND S.Estado = @status`;
        }
        if (company && company !== 'undefined') {
            baseQuery += ` AND S.IDEmpresa = cast(@company as varchar)`;
        }
        if (search) {
            baseQuery += ` AND (S.Ticket LIKE @search OR S.NombreCliente LIKE @search OR ST.Descripcion LIKE @search OR S.IdServicio LIKE @search)`;
        }
        Object.keys(colFilters).forEach((col, index) => {
            let sqlCol = `S.[${col}]`;
            if (col === 'TipoServicio') sqlCol = 'ST.Descripcion';
            if (col === 'Ticket') sqlCol = 'S.Ticket';
            baseQuery += ` AND ${sqlCol} LIKE @col_${index}`;
        });

        const populateInputs = (req) => {
            if (status && status !== 'Todos') req.input('status', sql.NVarChar, status);
            if (company && company !== 'undefined') req.input('company', sql.VarChar, company);
            if (search) req.input('search', sql.NVarChar, `%${search}%`);
            Object.keys(colFilters).forEach((col, index) => {
                req.input(`col_${index}`, sql.NVarChar, `%${colFilters[col]}%`);
            });
        };

        console.log('Testing Count Query...');
        const countReq = pool.request();
        populateInputs(countReq);
        const countQueryText = `SELECT COUNT(*) as total ${baseQuery}`;
        console.log('Query:', countQueryText);

        const countResult = await countReq.query(countQueryText);
        console.log('Count Result:', countResult.recordset[0]);

        console.log('Testing Data Query...');
        const dataReq = pool.request();
        populateInputs(dataReq);

        const validOffset = Math.max(0, offset);
        const dataQueryText = `
            SELECT 
                S.*, 
                TRIM(ST.Descripcion) as TipoServicio, 
                C.Motivo_Cancelacion, 
                C.Autorizador_Cancelacion, 
                C.Generado_el as FechaCancelacion
            ${baseQuery}
            ORDER BY S.FechaVisita DESC
            OFFSET ${validOffset} ROWS FETCH NEXT ${limit} ROWS ONLY
        `;

        const result = await dataReq.query(dataQueryText);
        console.log('Data Rows:', result.recordset.length);
        if (result.recordset.length > 0) {
            console.log('Sample Row Keys:', Object.keys(result.recordset[0]));
        }

    } catch (err) {
        console.error('ERROR CAUGHT:', err);
    }
}

debugTickets();
