const axios = require('axios');

async function testRemoteLogin() {
    const url = 'https://fish-arot.onrender.com/api/auth/login';
    console.log(`Testing login at ${url}...`);
    try {
        const response = await axios.post(url, {
            username: 'admin',
            password: 'admin123'
        });
        console.log('SUCCESS:', response.data);
    } catch (error) {
        console.error('FAILED:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('RESPONSE DATA:', error.response.data);
        }
    }
}

testRemoteLogin();
