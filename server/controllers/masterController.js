const { getConnection, sql } = require('../db');

exports.getClients = async (req, res) => {
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
};

exports.getAssets = async (req, res) => {
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
};

exports.getMaterials = async (req, res) => {
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
};

exports.getServices = async (req, res) => {
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
};

exports.getServiceTypes = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT Id as id, Descripcion as name FROM [APPGAC].[ServicioTipo] ORDER BY Descripcion');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching service types' });
    }
};

exports.getCancellationReasons = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT ID_Cancelados_motivo as id, Motivo as name FROM [dbo].[GAC_APP_TB_CANCELACIONES_MOTIVOS] ORDER BY Motivo');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching cancellation reasons' });
    }
};
