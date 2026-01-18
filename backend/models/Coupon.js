import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  discountType: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    defaultValue: 'percentage'
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  maxDiscount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  validFrom: {
    type: DataTypes.DATE,
    allowNull: false
  },
  validUntil: {
    type: DataTypes.DATE,
    allowNull: false
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isSingleUse: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  applicableCategories: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  excludedProducts: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  userIds: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Specific users who can use this coupon'
  }
}, {
  tableName: 'coupons',
  hooks: {
    beforeValidate: (coupon) => {
      // Ensure validUntil is after validFrom
      if (coupon.validFrom && coupon.validUntil) {
        if (new Date(coupon.validUntil) <= new Date(coupon.validFrom)) {
          throw new Error('Valid until must be after valid from');
        }
      }
    }
  }
});

export default Coupon;