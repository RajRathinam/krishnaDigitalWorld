import sequelize from './config/database.js';
import Product from './models/Product.js';

async function checkBestSellers() {
  try {
    const bestSellers = await Product.count({
      where: {
        isActive: true,
        isBestSeller: true
      }
    });
    console.log(`Bestsellers count: ${bestSellers}`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkBestSellers();
