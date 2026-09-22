import sequelize from './config/database.js';
import ShopInfo from './models/ShopInfo.js';

async function test() {
  try {
    const shopInfo = await ShopInfo.findOne({ where: { isActive: true } });
    console.log('Current DB state:', shopInfo ? shopInfo.toJSON() : null);
    
    // Try updating to true
    if (shopInfo) {
      await shopInfo.update({ enableOnlineGifts: true });
      console.log('Updated to true, DB state now:', shopInfo.toJSON());
      
      const checkAgain = await ShopInfo.findOne({ where: { isActive: true } });
      console.log('Fetched again:', checkAgain.toJSON());
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

test();
