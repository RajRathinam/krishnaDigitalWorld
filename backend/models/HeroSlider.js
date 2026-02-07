// models/HeroSlider.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HeroSlider = sequelize.define('HeroSlider', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  subtitle: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cta: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  ctaLink: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: '#'
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  accent: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'hero_sliders',
  timestamps: true
});

export default HeroSlider;
