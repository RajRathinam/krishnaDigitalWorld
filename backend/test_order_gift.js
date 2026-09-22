import sequelize from './config/database.js';
import Order from './models/Order.js';
import ShopInfo from './models/ShopInfo.js';
import Gift from './models/Gift.js';

import { getGiftCadreByAmount } from './utils/giftHelper.js';

async function testOrder() {
  try {
    const finalAmount = 3000; // should map to 'Basic'

    const shopInfo = await ShopInfo.findOne({ where: { isActive: true } });
    const enableOnlineGifts = shopInfo ? (shopInfo.enableOnlineGifts !== false) : true;
    console.log('enableOnlineGifts:', enableOnlineGifts, 'Raw:', shopInfo?.enableOnlineGifts);

    let giftStatus = 'pending';
    let giftId = null;

    if (enableOnlineGifts) {
      const cadre = getGiftCadreByAmount(finalAmount);
      console.log('cadre:', cadre);

      const gifts = await Gift.findAll({ where: { status: true, cadre } });
      console.log('Found gifts:', gifts.length);

      if (gifts.length > 0) {
        const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
        giftStatus = 'won';
        giftId = randomGift.id;
      } else {
        giftStatus = 'lost';
      }
    }

    console.log('Final Gift Status:', giftStatus, 'Gift ID:', giftId);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

testOrder();
