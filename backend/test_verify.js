
import axios from 'axios';
import { createOTP } from './services/otpService.js';
import { User, sequelize } from './models/index.js';
import dotenv from 'dotenv';
dotenv.config();

const testVerify = async () => {
    const phone = '9789251221';

    try {
        console.log("1. Creating OTP directly (to know the code)...");
        const otpResult = await createOTP(phone, 'login');
        const otpCode = otpResult.otp;
        console.log(`   Generated OTP: ${otpCode}`);

        console.log("2. Testing Verify Login API...");
        const response = await axios.post('http://localhost:5000/api/auth/verify-login', {
            phone: phone,
            otp: otpCode
        });

        console.log("   Success:", response.data);
    } catch (error) {
        console.error("   Error:");
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("   Message:", error.message);
            console.error("   Stack:", error.stack);
        }
    } finally {
        // await sequelize.close(); // Don't close if server is running separately? 
        // Actually this script imports models so it creates its own connection pool.
        // We should close it to exit cleanly, but axios request is to external server.
        // The createOTP call *does* use the DB.
    }
};

testVerify();
