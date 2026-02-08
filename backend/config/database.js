import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import mysql2 from 'mysql2'; // Use IMPORT, not require

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectModule: mysql2, // Use imported module, not require()
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      // MariaDB specific options
      connectTimeout: 60000,
      decimalNumbers: true,
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
    timezone: '+05:30' // IST timezone
  }
);

export default sequelize;