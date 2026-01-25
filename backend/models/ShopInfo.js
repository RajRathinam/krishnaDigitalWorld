// models/ShopInfo.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ShopInfo = sequelize.define('ShopInfo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shopName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    defaultValue: 'Krishna Digital World'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  alternatePhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'India'
  },
  // Live shop locations (array of locations)
  locations: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of shop locations with name, address, coordinates, etc.'
  },
  // Social media links
  socialMedia: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Social media links: {facebook, instagram, twitter, youtube, etc.}'
  },
  // Business hours
  businessHours: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Business hours: {monday: {open: "09:00", close: "18:00"}, ...}'
  },
  // Additional information
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Google Maps embed URL or coordinates
  mapEmbedUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Logo URL
  logoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  // Favicon URL
  faviconUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  // Currency
  currency: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'INR'
  },
  // Tax information
  gstNumber: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  // Support information
  supportEmail: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  supportPhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  // WhatsApp number
  whatsappNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'shop_info',
  timestamps: true,
  // Only one shop info record should exist
  indexes: [
    {
      unique: true,
      fields: ['id']
    }
  ]
});

export default ShopInfo;

