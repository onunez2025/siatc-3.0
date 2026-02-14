const { getConnection, sql } = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
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
};
