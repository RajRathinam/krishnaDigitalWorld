import { sequelize } from '../models/index.js';

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Sync all models
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
};

syncDatabase();