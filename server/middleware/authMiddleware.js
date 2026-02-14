const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    // 2. Verify token
    try {
        const secret = process.env.JWT_SECRET || 'secret_key_123';
        const decoded = jwt.verify(token, secret);

        // 3. Attach user to request
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Auth Error:', err.message);
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};
