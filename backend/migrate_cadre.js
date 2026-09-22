import { sequelize } from './models/index.js';

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Add the cadre column
    await sequelize.query("ALTER TABLE gifts ADD COLUMN cadre ENUM('Basic', 'Economy', 'Standard', 'Premium', 'Elite', 'Luxury', 'Platinum') DEFAULT 'Basic'");
    console.log('Migration successful: Added cadre column to gifts table.');
    
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database or run migration:', error);
    process.exit(1);
  }
}

runMigration();
