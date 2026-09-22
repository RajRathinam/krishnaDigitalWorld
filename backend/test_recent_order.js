import sequelize from './config/database.js';
import Order from './models/Order.js';

async function checkOrder() {
  try {
    const order = await Order.findOne({ order: [['created_at', 'DESC']] });
    console.log(order?.toJSON());
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkOrder();
