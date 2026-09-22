import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Gift = sequelize.define('Gift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  cadre: {
    type: DataTypes.ENUM('Basic', 'Economy', 'Standard', 'Premium', 'Elite', 'Luxury', 'Platinum'),
    defaultValue: 'Basic'
  }
}, {
  tableName: 'gifts',
  timestamps: true
});

export default Gift;
