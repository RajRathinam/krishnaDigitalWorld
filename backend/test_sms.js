
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const testSMS = async () => {
    const phone = '9789251221'; // User's phone number from screenshot
    const otp = '123456';

    console.log(`Testing Fast2SMS for ${phone} with OTP ${otp}...`);
    console.log(`API Key: ${process.env.FAST2SMS_API_KEY ? 'Present' : 'Missing'}`);
    console.log(`Sender ID: ${process.env.FAST2SMS_SENDER_ID}`);
    console.log(`Template ID: ${process.env.FAST2SMS_TEMPLATE_ID}`);

    try {
        const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
            params: {
                authorization: process.env.FAST2SMS_API_KEY,
                route: "dlt",
                sender_id: process.env.FAST2SMS_SENDER_ID,
                message: process.env.FAST2SMS_TEMPLATE_ID,
                variables_values: otp,
                numbers: phone
            }
        });

        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Error sending SMS:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
};

testSMS();
