import sequelize from './config/database.js';
import ShopInfo from './models/ShopInfo.js';
import Gift from './models/Gift.js';
import { getGiftCadreByAmount } from './utils/giftHelper.js';

async function testFullLogic() {
  try {
    // Force DB to true for test
    await sequelize.query('UPDATE shop_info SET enable_online_gifts = 1 WHERE is_active = 1');
    console.log('Forced DB to enable_online_gifts = 1');

    const shopInfo = await ShopInfo.findOne({ where: { isActive: true } });
    console.log('shopInfo.enableOnlineGifts:', shopInfo.enableOnlineGifts);
    const enableOnlineGifts = shopInfo ? (shopInfo.enableOnlineGifts !== false) : true;
    console.log('enableOnlineGifts bool:', enableOnlineGifts);

    const testAmounts = [3000, 7000, 30000];
    
    for (const amount of testAmounts) {
      console.log(`\n--- Testing amount: ${amount} ---`);
      let giftStatus = 'pending';
      let giftId = null;

      if (enableOnlineGifts) {
        const cadre = getGiftCadreByAmount(amount);
        console.log('cadre:', cadre);

        const gifts = await Gift.findAll({ where: { status: true, cadre } });
        console.log(`Found ${gifts.length} active gifts for cadre ${cadre}`);

        if (gifts.length > 0) {
          const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
          giftStatus = 'won';
          giftId = randomGift.id;
        } else {
          giftStatus = 'lost';
        }
      }
      console.log(`Result for ${amount}: giftStatus=${giftStatus}, giftId=${giftId}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

testFullLogic();
