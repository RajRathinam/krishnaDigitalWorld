import fetch from 'node-fetch';

async function test() {
  try {
    // Actually, getting the API requires authentication, which is hard.
    // We can just query the database using the same logic the controller uses.
    
    // The issue might be that Sequelize caches model attributes.
    // Let's modify AdminSettings.jsx to be safe: checked={!!shopInfo.enableOnlineGifts} or something.
    // Wait, if shopInfo.enableOnlineGifts is explicitly false, `false ?? true` is false.
  } catch (err) {
    console.error(err);
  }
}
test();
