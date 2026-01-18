// models/Otp.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import CryptoJS from 'crypto-js';

const Otp = sequelize.define('Otp', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  otp: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  purpose: {
    type: DataTypes.ENUM('register', 'login', 'reset'),
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'otps',
  underscored: true, // Add this line - VERY IMPORTANT
  timestamps: true,  // This adds createdAt and updatedAt
  hooks: {
    beforeCreate: (otp) => {
      // Encrypt OTP before storing
      otp.otp = CryptoJS.AES.encrypt(
        otp.otp,
        process.env.OTP_SECRET_KEY
      ).toString();
    }
  }
});

// Instance method to verify OTP
Otp.prototype.verifyOtp = function(inputOtp) {
  const decrypted = CryptoJS.AES.decrypt(
    this.otp,
    process.env.OTP_SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);
  
  return decrypted === inputOtp && !this.isUsed && new Date() < this.expiresAt;
};

export default Otp;