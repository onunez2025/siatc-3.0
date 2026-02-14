const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3001/api';
const CREDENTIALS = {
    username: 'null',
    password: '123'
};

async function verifyTechnicianRestriction() {
    try {
        console.log('1. Logging in as Technician...');
        const loginRes = await axios.post(`${BASE_URL}/login`, CREDENTIALS);

        const token = loginRes.data.token;
        const user = loginRes.data.user;

        console.log('✅ Login successful.');
        console.log(`   User: ${user.username}`);
        console.log(`   Rol: ${user.roleName}`);
        console.log(`   CodigoTecnico: ${user.codigoTecnico}`);

        // Verify JWT Payload locally
        const decoded = jwt.decode(token);
        if (!decoded.codigoTecnico) {
            throw new Error('❌ JWT does not contain codigoTecnico!');
        }
        console.log('✅ JWT contains codigoTecnico.');

        console.log('\n2. Fetching Tickets...');
        const ticketsRes = await axios.get(`${BASE_URL}/tickets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const tickets = ticketsRes.data.data;
        console.log(`   Fetched ${tickets.length} tickets.`);

        // Verify all tickets belong to this technician
        const invalidTickets = tickets.filter(t => t.CodigoTecnico !== user.codigoTecnico);

        if (invalidTickets.length > 0) {
            console.error(`❌ FOUND ${invalidTickets.length} TICKETS NOT BELONGING TO TECHNICIAN!`);
            console.error('Example Invalid Ticket:', invalidTickets[0]);
            process.exit(1);
        } else {
            console.log('✅ All fetched tickets belong to this technician.');
        }

        console.log('\n✅ VERIFICATION SUCCESSFUL: Restriction is working.');
        process.exit(0);

    } catch (error) {
        if (error.response) {
            console.error(`❌ Verification Failed: ${error.response.status} ${error.response.statusText}`);
            console.error('Data:', error.response.data);
        } else {
            console.error('❌ Verification Failed:', error.message);
        }
        process.exit(1);
    }
}

verifyTechnicianRestriction();
