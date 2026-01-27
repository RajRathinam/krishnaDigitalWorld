import 'dotenv/config';
import { sequelize } from '../models/index.js';
import { Product } from '../models/index.js';

const checkProduct = async () => {
    try {
        await sequelize.authenticate();
        const product = await Product.findByPk(25, { raw: true });
        if (product) {
            console.log('Product 25 found:');
            console.log('- ID:', product.id);
            console.log('- Name:', product.name);
            console.log('- SellerID:', product.sellerId);
        } else {
            console.log('Product 25 not found.');
        }
        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

checkProduct();
