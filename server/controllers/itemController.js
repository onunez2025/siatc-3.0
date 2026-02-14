const { getConnection, sql } = require('../db');

exports.getItems = async (req, res) => {
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
};

exports.getItemStats = async (req, res) => {
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
};

exports.getItemFilters = async (req, res) => {
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
};

exports.getItemById = async (req, res) => {
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
};

exports.createItem = async (req, res) => {
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
};

exports.updateItem = async (req, res) => {
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
};

exports.deleteItem = async (req, res) => {
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
};
