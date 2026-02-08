import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import mysql2 from 'mysql2';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'krishna_digital',
  process.env.DB_USER || 'kdigital_user',
  process.env.DB_PASSWORD || 'SriKrishna@15',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectModule: mysql2,
    dialectOptions: {
      charset: 'utf8mb4',
      // Try this approach instead
      typeCast: function (field, next) {
        if (field.type === 'STRING' || field.type === 'VAR_STRING') {
          return field.string();
        }
        return next();
      },
      connectTimeout: 60000,
      decimalNumbers: true,
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    timezone: '+05:30',
    // Add this to ensure proper charset handling
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
  }
);

export default sequelize;