const axios = require('axios');

const GEEZSMS_API_URL = 'https://api.geezsms.com/api/v1/sms/send';

exports.sendOtp = async (phone, code) => {
  try {
    const token = process.env.GEEZSMS_TOKEN;
    if (!token) {
      console.warn('GEEZSMS_TOKEN is not set. OTP will not be sent.');
      return;
    }

    // Use generic send endpoint
    const payload = {
      token: token,
      phone: phone,
      msg: `Your verification code is ${code}`,
    };

    console.log(`Sending SMS to: ${phone}`);

    // GeezSMS supports GET for sending SMS
    const response = await axios.get(GEEZSMS_API_URL, {
      params: payload,
      timeout: 5000 // 5 second timeout
    });

    console.log('GeezSMS response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending OTP via GeezSMS:', error.message);
    if (error.response) {
      console.error('GeezSMS Error Response:', error.response.data);
    }
    // Don't throw, just log, so we don't break the flow if SMS fails (for now)
    // or throw if strict.
    throw new Error('Failed to send OTP');
  }
};
