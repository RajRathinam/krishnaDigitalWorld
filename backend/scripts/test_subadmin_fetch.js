import 'dotenv/config';
import { User, sequelize } from '../models/index.js';

const testFetch = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        console.log('🔍 Fetching subadmins...');

        console.log('📋 Table Structure:');
        const [tableInfo] = await sequelize.query('DESCRIBE users');
        console.log(tableInfo.map(col => col.Field).join(', '));

        const subadmins = await User.findAll({
            where: {
                role: 'subadmin'
            },
            attributes: [
                'id',
                'name',
                'phone',
                'email',
                'role',
                'isActive',
                'isVerified',
                'createdAt',
                'updatedAt'
            ],
            order: [['createdAt', 'DESC']],
            raw: true
        });

        console.log(`✅ Success! Found ${subadmins.length} subadmins.`);
        console.log(subadmins);

    } catch (error) {
        console.error('❌ Error fetching subadmins:', error);
        if (error.original) {
            console.error('Original DB Error:', error.original);
        }
    } finally {
        await sequelize.close();
    }
};

testFetch();
