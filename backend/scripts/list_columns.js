import 'dotenv/config';
import { sequelize } from '../models/index.js';

const inspectColumns = async () => {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query('SHOW COLUMNS FROM users');
        console.log('Columns in users table:');
        results.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

inspectColumns();
