import { sequelize } from '../models/index.js';

const fixRoles = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Alter table to ensure 'subadmin' is in ENUM
        // Note: table name is usually lowercase 'users' in MySQL but Sequelize might have pluralized it. 
        // The User model says tableName: 'users'.
        console.log('Altering Users table role column...');
        try {
            await sequelize.query(`ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'admin', 'subadmin') DEFAULT 'customer';`);
            console.log('Column altered successfully.');
        } catch (e) {
            console.error('Error altering column (might already be correct or permission issue):', e.message);
        }

        // 2. Update users with empty role to 'subadmin'
        // Targeted update for the broken records we saw (ids 22-26)
        console.log('Updating empty roles to subadmin...');
        try {
            const [results, metadata] = await sequelize.query(`UPDATE users SET role = 'subadmin' WHERE (role = '' OR role IS NULL) AND id >= 22;`);
            console.log('Update metadata:', metadata);
        } catch (e) {
            console.error('Error updating records:', e.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
};

fixRoles();
