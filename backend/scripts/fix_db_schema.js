import 'dotenv/config';
import { sequelize } from '../models/index.js';

const fixSchema = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        const [tableInfo] = await sequelize.query('DESCRIBE users');
        const columns = tableInfo.map(col => col.Field);
        console.log('Current columns:', columns);

        // Check and add isVerified
        if (!columns.includes('isVerified')) {
            console.log('⚠️ isVerified column missing. Adding it...');
            await sequelize.query('ALTER TABLE users ADD COLUMN isVerified BOOLEAN DEFAULT false;');
            console.log('✅ isVerified added.');
        }

        // Check and add isActive
        if (!columns.includes('isActive')) {
            console.log('⚠️ isActive column missing. Adding it...');
            await sequelize.query('ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT true;');
            console.log('✅ isActive added.');
        }

        // Check and add slug
        if (!columns.includes('slug')) {
            console.log('⚠️ slug column missing. Adding it...');
            await sequelize.query('ALTER TABLE users ADD COLUMN slug VARCHAR(150) UNIQUE NULL;');
            console.log('✅ slug added.');

            // Populate slugs for existing users? 
            // For now, let's just make sure the column exists. Populating might require more logic.
        }

        console.log('✅ Schema check complete.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fixing schema:', error);
        process.exit(1);
    }
};

fixSchema();
