require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { id: 1, roleName: 'ADMIN', username: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
);

console.log(token);
