import { seedTestUser } from '../services/authService.js';
import { sequelize } from '../models/index.js';

(async () => {
  try {
    console.log('🚀 Starting test user seed script...');
    
    // Sync database (optional - uncomment if needed)
    // await sequelize.sync({ alter: true });
    
    // Seed test user
    const result = await seedTestUser();
    
    if (result.success) {
      console.log('✅ Test user seeded successfully!');
      console.log('📱 Phone:', '1234567890');
      console.log('🔑 OTP:', '123456');
      console.log('👤 Name:', result.user?.name || 'Test User');
      console.log('🎁 Welcome coupon created');
    } else {
      console.error('❌ Failed to seed test user:', result.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test user:', error);
    process.exit(1);
  }
})();