import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { generateSlug } from '../utils/slugGenerator.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerCode: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(150),
    unique: true,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    validate: {
      is: /^\+?[\d\s\-\(\)]+$/ // Basic phone validation
    }
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.ENUM('customer', 'admin'),
    defaultValue: 'customer'
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  address: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    get() {
      let rawValue = this.getDataValue('address');
      if (!rawValue) return null;

      // Handle stringified JSON
      if (typeof rawValue === 'string') {
        try {
          rawValue = JSON.parse(rawValue);
        } catch (e) {
          // ignore
        }
      }

      // Ensure address is properly structured
      if (typeof rawValue === 'object') {
        return {
          street: rawValue.street || '',
          city: rawValue.city || rawValue.district || '',
          state: rawValue.state || '',
          pincode: rawValue.pincode || '',
          fullAddress: rawValue.fullAddress ||
            `${rawValue.street || ''}${rawValue.city ? `, ${rawValue.city}` : ''}${rawValue.pincode ? `, ${rawValue.pincode}` : ''}`
        };
      }
      return rawValue;
    },
    set(value) {
      if (typeof value === 'object' && value !== null) {
        // Ensure proper structure
        this.setDataValue('address', {
          street: value.street || '',
          city: value.city || value.district || '',
          state: value.state || '',
          pincode: value.pincode || '',
          fullAddress: value.fullAddress ||
            `${value.street || ''}${value.city ? `, ${value.city}` : ''}${value.pincode ? `, ${value.pincode}` : ''}`
        });
      } else {
        this.setDataValue('address', value);
      }
    }
  },
  additionalAddresses: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      let rawValue = this.getDataValue('additionalAddresses');

      // Handle stringified JSON
      if (typeof rawValue === 'string') {
        try {
          rawValue = JSON.parse(rawValue);
        } catch (e) {
          rawValue = [];
        }
      }

      if (!rawValue || !Array.isArray(rawValue)) return [];

      return rawValue.map(addr => ({
        id: addr.id || String(Math.random()),
        name: addr.name || '',
        phone: addr.phone || '',
        street: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
        isDefault: Boolean(addr.isDefault),
        type: addr.type || 'other',
        createdAt: addr.createdAt || new Date().toISOString(),
        updatedAt: addr.updatedAt || new Date().toISOString()
      }));
    },
    set(value) {
      if (!value || !Array.isArray(value)) {
        this.setDataValue('additionalAddresses', []);
      } else {
        const processedAddresses = value.map(addr => ({
          id: addr.id || String(Math.random()),
          name: addr.name || '',
          phone: addr.phone || '',
          street: addr.street || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: addr.pincode || '',
          isDefault: Boolean(addr.isDefault),
          type: addr.type || 'other',
          createdAt: addr.createdAt || new Date().toISOString(),
          updatedAt: addr.updatedAt || new Date().toISOString()
        }));
        this.setDataValue('additionalAddresses', processedAddresses);
      }
    }
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  giftReceived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      // Generate slug if not provided
      if (!user.slug) {
        const allSlugs = await User.findAll({
          attributes: ['slug'],
          raw: true
        }).then(users => users.map(user => user.slug));
        user.slug = generateSlug(user.name, allSlugs);
      }

      // Generate customer code for customers
      if (user.role === 'customer' && !user.customerCode) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        user.customerCode = `CUST${timestamp}${random}`;
      }

      // Ensure additionalAddresses is an array
      if (user.additionalAddresses === null || user.additionalAddresses === undefined) {
        user.additionalAddresses = [];
      }
    },
    beforeUpdate: async (user) => {
      // Ensure additionalAddresses is always an array
      if (user.additionalAddresses === null || user.additionalAddresses === undefined) {
        user.additionalAddresses = [];
      }

      // Ensure each address has required fields
      if (Array.isArray(user.additionalAddresses)) {
        user.additionalAddresses = user.additionalAddresses.map(addr => {
          if (!addr.id) {
            addr.id = crypto.randomUUID ? crypto.randomUUID() :
              Date.now().toString(36) + Math.random().toString(36).substr(2);
          }
          if (!addr.createdAt) addr.createdAt = new Date().toISOString();
          addr.updatedAt = new Date().toISOString();
          return addr;
        });
      }
    },
    afterFind: async (users) => {
      // Ensure all users have proper address structure
      const processUser = (user) => {
        if (!user) return;

        if (user.additionalAddresses === null || user.additionalAddresses === undefined) {
          user.additionalAddresses = [];
        }

        // Convert to plain object if needed
        if (user.dataValues) {
          user.dataValues.additionalAddresses = user.additionalAddresses;
        }
      };

      if (Array.isArray(users)) {
        users.forEach(processUser);
      } else {
        processUser(users);
      }
    }
  }
});

export default User;