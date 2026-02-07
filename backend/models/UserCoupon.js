import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserCoupon = sequelize.define('UserCoupon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  couponId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'coupons',
      key: 'id'
    }
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    }
  }
}, {
  tableName: 'user_coupons',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'coupon_id'],
      name: 'unique_user_coupon'
    }
  ]
});

export default UserCoupon;