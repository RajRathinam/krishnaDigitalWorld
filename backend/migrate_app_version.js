import { sequelize } from './models/index.js';

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    await sequelize.query("ALTER TABLE shop_info ADD COLUMN min_app_version_code INT NULL");
    await sequelize.query("ALTER TABLE shop_info ADD COLUMN latest_app_version_code INT NULL");
    await sequelize.query("ALTER TABLE shop_info ADD COLUMN force_update_enabled TINYINT(1) NOT NULL DEFAULT 0");
    await sequelize.query("ALTER TABLE shop_info ADD COLUMN play_store_url VARCHAR(500) NULL");
    await sequelize.query("ALTER TABLE shop_info ADD COLUMN app_update_message TEXT NULL");

    console.log('Migration successful: Added app version control columns to shop_info table.');

    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database or run migration:', error);
    process.exit(1);
  }
}

runMigration();
