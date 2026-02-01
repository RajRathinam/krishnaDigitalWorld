
import { createOTP } from './services/otpService.js';
import dotenv from 'dotenv';
dotenv.config();

console.log("Imports successful");
try {
    console.log("OTP_EXPIRY_MINUTES:", process.env.OTP_EXPIRY_MINUTES);
    console.log("OTP_SECRET_KEY:", process.env.OTP_SECRET_KEY ? "Present" : "Missing");
} catch (e) {
    console.error(e);
}
