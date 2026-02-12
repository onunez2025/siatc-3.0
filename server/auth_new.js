// ===================================================================
// Auth Endpoints - Nueva Implementación con Empresas y Roles
// Propósito: Reemplazar login actual al activar nuevo sistema de usuarios
// Fecha: 2026-02-11
// ===================================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('./db');

// ===================================================================
// MIDDLEWARE: Verificar Token JWT
// ===================================================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        req.user = user; // Adjuntar datos del usuario al request
        next();
    });
}

// ===================================================================
// ENDPOINT: Login con nueva estructura
// POST /api/auth/login
// ===================================================================
async function login(req, res, pool) {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username y password son requeridos' });
        }

        console.log(`[LOGIN] Intento de login para: '${username}'`);

        // Query con JOINs a Empresas y Roles
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
                    U.CodigoTecnico,
                    U.Activo,
                    U.RequiereCambioPassword,
                    U.UltimoLogin,
                    E.IdEmpresa,
                    E.CodigoFSM,
                    E.NombreEmpresa,
                    E.TipoEmpresa,
                    R.IdRol,
                    R.NombreRol,
                    R.Descripcion as RolDescripcion
                FROM [SIATC].[Usuarios] U
                INNER JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
                INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
                WHERE U.Username = @username
                    AND U.Activo = 1
            `);

        if (result.recordset.length === 0) {
            console.log('[LOGIN] Usuario no encontrado o inactivo');
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = result.recordset[0];

        // Verificar password
        // TODO: Usar bcrypt.compare() cuando se implementen passwords hasheados
        // const passwordMatch = await bcrypt.compare(password, user.Password);
        const passwordMatch = password.trim() === user.Password.trim();

        if (!passwordMatch) {
            console.log('[LOGIN] Contraseña incorrecta');
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Actualizar último login
        await pool.request()
            .input('userId', sql.Int, user.IdUsuario)
            .query('UPDATE [SIATC].[Usuarios] SET UltimoLogin = GETDATE() WHERE IdUsuario = @userId');

        // Generar token JWT con información completa
        const tokenPayload = {
            userId: user.IdUsuario,
            username: user.Username,
            empresa: {
                id: user.IdEmpresa,
                codigoFSM: user.CodigoFSM, // Para matching con tickets
                nombre: user.NombreEmpresa, // Nombre real para mostrar
                tipo: user.TipoEmpresa // PROPIA o CAS
            },
            rol: {
                id: user.IdRol,
                nombre: user.NombreRol
            },
            codigoTecnico: user.CodigoTecnico // null si no es técnico
        };

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET || 'secret_key_123',
            { expiresIn: '24h' }
        );

        const fullName = `${user.Nombre || ''} ${user.Apellido || ''}`.trim();

        console.log(`[LOGIN] ✓ Login exitoso: ${user.Username} (${user.NombreRol} - ${user.NombreEmpresa})`);

        res.json({
            token,
            user: {
                id: user.IdUsuario,
                username: user.Username,
                name: fullName,
                email: user.Email,
                empresa: {
                    id: user.IdEmpresa,
                    codigoFSM: user.CodigoFSM,
                    nombre: user.NombreEmpresa,
                    tipo: user.TipoEmpresa
                },
                rol: {
                    id: user.IdRol,
                    nombre: user.NombreRol,
                    descripcion: user.RolDescripcion
                },
                codigoTecnico: user.CodigoTecnico,
                requiereCambioPassword: user.RequiereCambioPassword,
                ultimoLogin: user.UltimoLogin
            }
        });

    } catch (error) {
        console.error('[LOGIN] Error:', error);
        res.status(500).json({ error: 'Error interno al iniciar sesión' });
    }
}

// ===================================================================
// HELPER: Construir filtro de permisos para tickets
// ===================================================================
function buildPermissionFilter(userFromToken) {
    const { rol, empresa, codigoTecnico } = userFromToken;

    // Caso 1: Técnico - solo sus tickets
    if (rol.nombre === 'TECNICO') {
        return {
            where: 'T.CodigoTecnico = @codigoTecnico',
            params: { codigoTecnico }
        };
    }

    // Caso 2: Empresa PROPIA - ve todo
    if (empresa.tipo === 'PROPIA') {
        return {
            where: '1=1', // Sin filtro
            params: {}
        };
    }

    // Caso 3: Empresa CAS - solo su empresa
    return {
        where: 'T.IDEmpresa = @codigoFSM',
        params: { codigoFSM: empresa.codigoFSM } // Usar CodigoFSM para matching con tickets
    };
}

// ===================================================================
// ENDPOINT: Obtener tickets con permisos
// GET /api/auth/tickets
// ===================================================================
async function getTicketsWithPermissions(req, res, pool) {
    try {
        const user = req.user; // Del middleware authenticateToken
        const filter = buildPermissionFilter(user);

        console.log(`[TICKETS] Usuario: ${user.username}, Rol: ${user.rol.nombre}, Empresa: ${user.empresa.nombre} (${user.empresa.tipo})`);
        console.log(`[TICKETS] Filtro aplicado: ${filter.where}`);

        // Query base con filtro dinámico
        const request = pool.request();

        // Agregar parámetros según filtro
        if (filter.params.codigoTecnico) {
            request.input('codigoTecnico', sql.NVarChar, filter.params.codigoTecnico);
        }
        if (filter.params.codigoFSM) {
            request.input('codigoFSM', sql.NVarChar, filter.params.codigoFSM);
        }

        const query = `
            SELECT 
                T.IdTicket,
                T.IDEmpresa,
                T.FechaVisita,
                T.CodigoTecnico,
                T.Estado,
                T.Direccion,
                T.Latitud,
                T.Longitud
            FROM [SIATC].[Tickets] T
            WHERE ${filter.where}
                AND T.FechaVisita = CAST(GETDATE() AS DATE)
            ORDER BY T.FechaVisita DESC, T.CodigoTecnico
        `;

        const result = await request.query(query);

        console.log(`[TICKETS] ✓ Retornando ${result.recordset.length} tickets`);

        res.json({
            tickets: result.recordset,
            permissions: {
                rol: user.rol.nombre,
                empresaTipo: user.empresa.tipo,
                totalTickets: result.recordset.length
            }
        });

    } catch (error) {
        console.error('[TICKETS] Error:', error);
        res.status(500).json({ error: 'Error al obtener tickets' });
    }
}

// ===================================================================
// ENDPOINT: Cambiar password (primer login)
// POST /api/auth/change-password
// ===================================================================
async function changePassword(req, res, pool) {
    try {
        const user = req.user; // Del middleware
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Contraseñas requeridas' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }

        // Obtener password actual
        const userResult = await pool.request()
            .input('userId', sql.Int, user.userId)
            .query('SELECT Password FROM [SIATC].[Usuarios] WHERE IdUsuario = @userId');

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const currentPassword = userResult.recordset[0].Password;

        // Verificar password antigua
        // TODO: bcrypt.compare()
        if (oldPassword.trim() !== currentPassword.trim()) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        // Actualizar password
        // TODO: Hash con bcrypt antes de guardar
        // const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.request()
            .input('userId', sql.Int, user.userId)
            .input('newPassword', sql.NVarChar, newPassword)
            .query(`
                UPDATE [SIATC].[Usuarios] 
                SET Password = @newPassword, 
                    RequiereCambioPassword = 0,
                    FechaModificacion = GETDATE()
                WHERE IdUsuario = @userId
            `);

        console.log(`[PASSWORD] ✓ Password cambiado para user: ${user.username}`);

        res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        console.error('[PASSWORD] Error:', error);
        res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
}

// ===================================================================
// ENDPOINT: Obtener perfil de usuario
// GET /api/auth/profile
// ===================================================================
async function getProfile(req, res, pool) {
    try {
        const user = req.user; // Del middleware

        // Re-fetch datos actualizados del usuario
        const result = await pool.request()
            .input('userId', sql.Int, user.userId)
            .query(`
                SELECT 
                    U.IdUsuario,
                    U.Username,
                    U.Nombre,
                    U.Apellido,
                    U.Email,
                    U.CodigoTecnico,
                    U.RequiereCambioPassword,
                    U.UltimoLogin,
                    E.CodigoFSM,
                    E.NombreEmpresa,
                    E.TipoEmpresa,
                    R.NombreRol,
                    R.Descripcion as RolDescripcion
                FROM [SIATC].[Usuarios] U
                INNER JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
                INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
                WHERE U.IdUsuario = @userId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const userData = result.recordset[0];

        res.json({
            user: {
                id: userData.IdUsuario,
                username: userData.Username,
                name: `${userData.Nombre || ''} ${userData.Apellido || ''}`.trim(),
                email: userData.Email,
                empresa: {
                    codigoFSM: userData.CodigoFSM,
                    nombre: userData.NombreEmpresa,
                    tipo: userData.TipoEmpresa
                },
                rol: {
                    nombre: userData.NombreRol,
                    descripcion: userData.RolDescripcion
                },
                codigoTecnico: userData.CodigoTecnico,
                requiereCambioPassword: userData.RequiereCambioPassword,
                ultimoLogin: userData.UltimoLogin
            }
        });

    } catch (error) {
        console.error('[PROFILE] Error:', error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
}

// ===================================================================
// EXPORTAR FUNCIONES
// ===================================================================
module.exports = {
    authenticateToken,
    login,
    getTicketsWithPermissions,
    changePassword,
    getProfile,
    buildPermissionFilter
};

// ===================================================================
// USO EN index.js:
// ===================================================================
// const auth = require('./auth_new');
// 
// // Login
// app.post('/api/auth/login', (req, res) => auth.login(req, res, pool));
// 
// // Rutas protegidas
// app.get('/api/auth/tickets', auth.authenticateToken, (req, res) => auth.getTicketsWithPermissions(req, res, pool));
// app.post('/api/auth/change-password', auth.authenticateToken, (req, res) => auth.changePassword(req, res, pool));
// app.get('/api/auth/profile', auth.authenticateToken, (req, res) => auth.getProfile(req, res, pool));
