// models/Category.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  subcategories: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of subcategory names like ["TV", "Washing Machine", "Refrigerator"]'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  attributesSchema: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Schema for product attributes specific to this category'
  }
}, {
  tableName: 'categories',
  timestamps: true
});

export default Category;