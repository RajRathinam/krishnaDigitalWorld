import { sendOrderShippedSMS, sendOrderDeliveredSMS } from './services/smsService.js';
import { sequelize } from './models/index.js';

async function test() {
  console.log('Testing SMS Service Exports...');
  console.log('sendOrderShippedSMS:', typeof sendOrderShippedSMS);
  console.log('sendOrderDeliveredSMS:', typeof sendOrderDeliveredSMS);

  try {
    console.log('\nTesting Database Connection...');
    await sequelize.authenticate();
    console.log('Connection established.');

    console.log('\nChecking "orders" table schema...');
    const [results] = await sequelize.query("DESCRIBE orders");
    console.log('Columns in "orders" table:');
    results.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });
    
    const merchantOrderIdCol = results.find(c => c.Field === 'merchantOrderId');
    if (merchantOrderIdCol) {
      console.log('✅ Found merchantOrderId column');
    } else {
      console.log('❌ merchantOrderId column NOT found');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

test();
