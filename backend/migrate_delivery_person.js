import { sequelize } from './models/index.js';

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    await sequelize.query("ALTER TABLE orders ADD COLUMN delivery_person_phone VARCHAR(20) NULL");

    console.log('Migration successful: Added delivery_person_phone column to orders table.');

    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database or run migration:', error);
    process.exit(1);
  }
}

runMigration();
