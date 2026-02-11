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
    },
    field: 'parent_id'
  },
  subcategories: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  subcategoryImages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    field: 'subcategory_images' // This maps to the correct column name
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  attributesSchema: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'attributes_schema'
  }
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true
});

export default Category;