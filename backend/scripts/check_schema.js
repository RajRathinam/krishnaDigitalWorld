import 'dotenv/config';
import { sequelize } from '../models/index.js';

const checkSchema = async () => {
    try {
        await sequelize.authenticate();
        const [tableInfo] = await sequelize.query('DESCRIBE users');
        const columns = tableInfo.map(col => col.Field);
        console.log('COLUMNS:', columns.join(', '));
        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

checkSchema();
