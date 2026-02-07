import { Otp } from '../models/index.js';
import { Op } from 'sequelize';
import CryptoJS from 'crypto-js';
import { sendOTPSMS } from './smsService.js';


/**
 * Generate a 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


/**
 * Create OTP record + send SMS
 */
export const createOTP = async (phone, purpose) => {
  try {
    // delete old OTPs
    await Otp.destroy({
      where: { phone, purpose }
    });

    const otp = generateOTP();

    const expiresAt = new Date(
      Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000
    );

    const otpRecord = await Otp.create({
      phone,
      otp,
      purpose,
      expiresAt,
      isUsed: false
    });

    // ✅ SEND SMS HERE
    await sendOTPSMS(phone, otp, purpose);

    return {
      success: true,
      otpRecord,
      otp // keep only for development testing
    };

  } catch (error) {
    console.error('Error creating OTP:', error);
    throw error;
  }
};


/**
 * Verify OTP
 */
export const verifyOTP = async (phone, inputOtp, purpose) => {
  try {
    const otpRecord = await Otp.findOne({
      where: {
        phone,
        purpose,
        isUsed: false
      },
      order: [['id', 'DESC']]
    });

    if (!otpRecord) {
      return { success: false, message: 'OTP not found or used' };
    }

    if (new Date() > otpRecord.expiresAt) {
      await otpRecord.update({ isUsed: true });
      return { success: false, message: 'OTP expired' };
    }

    const isValid = otpRecord.verifyOtp(inputOtp);

    if (!isValid) {
      return { success: false, message: 'Invalid OTP' };
    }

    await otpRecord.update({ isUsed: true });

    return { success: true, message: 'OTP verified' };

  } catch (error) {
    console.error('Verify error:', error);
    throw error;
  }
};


/**
 * Resend OTP
 */
export const resendOTP = async (phone, purpose) => {
  await Otp.destroy({
    where: { phone, purpose, isUsed: false }
  });

  return await createOTP(phone, purpose);
};


/**
 * Cleanup expired OTPs
 */
export const cleanupExpiredOTPs = async () => {
  return await Otp.destroy({
    where: {
      expiresAt: { [Op.lt]: new Date() }
    }
  });
};


/**
 * Debug helper
 */
export const getOTPDetails = async (phone, purpose) => {
  const otpRecord = await Otp.findOne({
    where: { phone, purpose },
    order: [['createdAt', 'DESC']]
  });

  if (!otpRecord) return null;

  const decryptedOTP = CryptoJS.AES.decrypt(
    otpRecord.otp,
    process.env.OTP_SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);

  return {
    phone,
    otp: decryptedOTP,
    expiresAt: otpRecord.expiresAt
  };
};
