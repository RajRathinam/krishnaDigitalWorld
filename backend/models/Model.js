// models/Model.js - Final version
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Model = sequelize.define('Model', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  modelCode: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(250),
    unique: true,
    allowNull: false
  },
  brandId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'brands',
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  baseAttributes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Common attributes shared by all products of this model'
  },
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Technical specifications for this model'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'models',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['brand_id', 'model_code'],  // USE SNAKE_CASE HERE
      name: 'unique_brand_model'
    }
  ]
  // NO underscored: true
});

export default Model;