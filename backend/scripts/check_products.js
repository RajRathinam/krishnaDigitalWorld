import { sequelize, Product } from '../models/index.js';

const checkProducts = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const [results] = await sequelize.query('SELECT * FROM products ORDER BY id DESC LIMIT 5');

        console.log('=== LATEST PRODUCTS IMAGE DATA ===');
        results.forEach(p => {
            console.log(`Product: ${p.name} (ID: ${p.id})`);
            console.log('Keys:', Object.keys(p));
            // Try all casing variations
            const imgData = p.colorsAndImages || p.colors_and_images || p.ColorsAndImages;
            console.log('Image Data:', typeof imgData === 'string' ? imgData : JSON.stringify(imgData, null, 2));
            console.log('-------------------');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkProducts();
