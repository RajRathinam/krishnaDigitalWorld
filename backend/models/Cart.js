import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cart = sequelize.define('Cart', {
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
    items: {
    type: DataTypes.JSON, // Should be JSON type
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidItems(value) {
        if (!Array.isArray(value)) {
          throw new Error('Items must be an array');
        }
        value.forEach(item => {
          if (!item.productId || !item.quantity || item.quantity < 1) {
            throw new Error('Each item must have productId and quantity >= 1');
          }
        });
      }
    }
  },
  
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'carts',
  hooks: {
    beforeSave: async (cart) => {
      // Calculate total amount
      if (cart.items && Array.isArray(cart.items)) {
        let total = 0;
        
        // In a real app, you would fetch product prices from database
        // For now, we assume price is included in each item
        cart.items.forEach(item => {
          const itemTotal = (item.price || 0) * (item.quantity || 0);
          total += itemTotal;
        });
        
        cart.totalAmount = total;
      }
    }
  }
});

export default Cart;