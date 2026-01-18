// services/otpService.js
import { Otp } from '../models/index.js';
import { Sequelize } from 'sequelize';
import CryptoJS from 'crypto-js';

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create OTP record
 */
export const createOTP = async (phone, purpose) => {
  try {
    // Delete any existing OTPs for this phone and purpose
    await Otp.destroy({
      where: {
        phone,
        purpose
      }
    });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

    const otpRecord = await Otp.create({
      phone,
      otp,
      purpose,
      expiresAt,
      isUsed: false
    });

    return {
      success: true,
      otpRecord,
      otp // In development, return OTP. In production, send via SMS/Email
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
    // FIXED: Use the correct field name - let Sequelize handle the conversion
    const otpRecord = await Otp.findOne({
      where: {
        phone,
        purpose,
        isUsed: false
      },
      order: [['created_at', 'DESC']] // Use JavaScript field name - Sequelize will convert it
    });

    if (!otpRecord) {
      return {
        success: false,
        message: 'OTP not found or already used'
      };
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      // Mark as used
      await otpRecord.update({ isUsed: true });
      return {
        success: false,
        message: 'OTP has expired'
      };
    }

    // Verify OTP using instance method
    const isValid = otpRecord.verifyOtp(inputOtp);

    if (!isValid) {
      return {
        success: false,
        message: 'Invalid OTP'
      };
    }

    // Mark OTP as used
    await otpRecord.update({ isUsed: true });

    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

/**
 * Resend OTP
 */
export const resendOTP = async (phone, purpose) => {
  try {
    // Delete any existing unused OTPs for this phone
    await Otp.destroy({
      where: {
        phone,
        purpose,
        isUsed: false
      }
    });

    return await createOTP(phone, purpose);
  } catch (error) {
    console.error('Error resending OTP:', error);
    throw error;
  }
};

/**
 * Clean up expired OTPs
 */
export const cleanupExpiredOTPs = async () => {
  try {
    const result = await Otp.destroy({
      where: {
        expiresAt: {
          [Sequelize.Op.lt]: new Date()
        }
      }
    });

    console.log(`Cleaned up ${result} expired OTPs`);
    return result;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    throw error;
  }
};

/**
 * Get OTP details (for debugging)
 */
export const getOTPDetails = async (phone, purpose) => {
  try {
    const otpRecord = await Otp.findOne({
      where: {
        phone,
        purpose
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      return null;
    }

    // Decrypt OTP for display (development only)
    const decryptedOTP = CryptoJS.AES.decrypt(
      otpRecord.otp,
      process.env.OTP_SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);

    return {
      id: otpRecord.id,
      phone: otpRecord.phone,
      otp: decryptedOTP,
      purpose: otpRecord.purpose,
      expiresAt: otpRecord.expiresAt,
      isUsed: otpRecord.isUsed,
      createdAt: otpRecord.createdAt
    };
  } catch (error) {
    console.error('Error getting OTP details:', error);
    throw error;
  }
};