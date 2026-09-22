import sequelize from './config/database.js';
import Gift from './models/Gift.js';

async function test() {
  try {
    const gifts = await Gift.findAll({ raw: true });
    console.log('All gifts:', gifts);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

test();
