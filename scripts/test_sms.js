const axios = require('axios');
require('dotenv').config();

const testSms = async () => {
    const token = process.env.GEEZSMS_TOKEN;
    if (!token || token === 'your_geezsms_api_token') {
        console.error('ERROR: GEEZSMS_TOKEN is not set or is using the default value.');
        return;
    }

    console.log(`Token found (length: ${token.length})`);

    const phone = '0911000000'; // Dummy number, or maybe I should ask user? 
    // Better to use a dummy that might fail validation but at least hit the server, 
    // or use the user's number if I knew it. 
    // Let's use a standard Eth format.

    const code = '123456';
    const msg = `Your verification code is ${code}`;

    // Try Endpoint 1: /sms/send (GET)
    try {
        console.log('\nTesting /sms/send (GET)...');
        const url = 'https://api.geezsms.com/api/v1/sms/send';
        const response = await axios.get(url, {
            params: { token, phone, msg }
        });
        console.log('Success:', response.status, response.data);
    } catch (error) {
        console.error('Failed /sms/send:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }

    // Try Endpoint 2: /sms/otp (GET)
    try {
        console.log('\nTesting /sms/otp (GET)...');
        const url = 'https://api.geezsms.com/api/v1/sms/otp';
        const response = await axios.get(url, {
            params: { token, phone, code } // Note: otp endpoint might expect 'code' not 'msg'
        });
        console.log('Success:', response.status, response.data);
    } catch (error) {
        console.error('Failed /sms/otp:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
};

testSms();
