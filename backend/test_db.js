import sequelize from './config/database.js';
import ShopInfo from './models/ShopInfo.js';

async function test() {
  try {
    const shopInfo = await ShopInfo.findOne({ where: { isActive: true } });
    console.log('Current DB state:', shopInfo ? shopInfo.toJSON() : null);
    
    // Try updating to false
    if (shopInfo) {
      await shopInfo.update({ enableOnlineGifts: false });
      console.log('Updated to false, DB state now:', shopInfo.toJSON());
      
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
