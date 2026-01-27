import { sequelize, User } from '../models/index.js';

const checkAdmins = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const users = await User.findAll({
            attributes: ['id', 'name', 'phone', 'role', 'isActive', 'isVerified']
        });

        console.log(`=== ALL USERS (Total: ${users.length}) ===`);
        console.log(JSON.stringify(users, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAdmins();
