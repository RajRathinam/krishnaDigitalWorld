import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  orderItems: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false
  },
  billingAddress: {
    type: DataTypes.JSON,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.ENUM('cod', 'card', 'upi'),
    defaultValue: 'cod'
  },
  // REMOVED emiTenure
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  orderStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shippingCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  finalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  trackingId: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  couponId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'coupons',
      key: 'id'
    }
  }
}, {
  tableName: 'orders',
  timestamps: true, // This enables createdAt and updatedAt
  createdAt: 'created_at', // Maps to database column
  updatedAt: 'updated_at',
  hooks: {
    beforeValidate: (order) => {
      // Generate order number if not provided
      if (!order.orderNumber) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        order.orderNumber = `ORD${timestamp}${random}`;
      }

      // Generate tracking ID if not provided and order is shipped
      if (!order.trackingId && order.orderStatus === 'shipped') {
        order.trackingId = `TRK${Date.now()}${Math.floor(Math.random() * 10000)}`;
      }

      // Calculate final amount
      if (order.totalPrice !== undefined) {
        const shipping = order.shippingCost || 0;
        const tax = order.taxAmount || 0;
        const discount = order.discountAmount || 0;
        order.finalAmount = order.totalPrice + shipping + tax - discount;
      }
    }
  }
});

export default Order;