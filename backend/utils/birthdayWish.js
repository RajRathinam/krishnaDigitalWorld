import { User, Coupon, UserCoupon } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Check for birthdays and send birthday wishes
 */
export const checkBirthdaysAndSendWishes = async () => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based
    const currentDay = today.getDate();

    // Find users with birthday today
    const usersWithBirthday = await User.findAll({
      where: {
        role: 'customer',
        isActive: true,
        isVerified: true,
        dateOfBirth: {
          [Op.ne]: null
        }
      },
      attributes: ['id', 'name', 'phone', 'email', 'dateOfBirth']
    });

    // Filter users whose birthday is today
    const todaysBirthdayUsers = usersWithBirthday.filter(user => {
      if (!user.dateOfBirth) return false;
      
      const dob = new Date(user.dateOfBirth);
      return dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay;
    });

    if (todaysBirthdayUsers.length === 0) {
      return {
        success: true,
        message: 'No birthdays today',
        count: 0
      };
    }

    // Create or find birthday coupon
    let birthdayCoupon = await Coupon.findOne({
      where: {
        code: 'BIRTHDAYWISH',
        isActive: true
      }
    });

    if (!birthdayCoupon) {
      birthdayCoupon = await Coupon.create({
        code: 'BIRTHDAYWISH',
        description: 'Happy Birthday! Enjoy this special discount on your special day.',
        discountType: 'percentage',
        discountValue: 15, // 15% discount
        minOrderAmount: 500,
        maxDiscount: 1000,
        validFrom: today,
        validUntil: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
        usageLimit: 1,
        isSingleUse: true,
        isActive: true
      });
    }

    // Assign coupon to users
    const assignedCoupons = [];
    
    for (const user of todaysBirthdayUsers) {
      // Check if user already has this coupon
      const existingUserCoupon = await UserCoupon.findOne({
        where: {
          userId: user.id,
          couponId: birthdayCoupon.id,
          isUsed: false
        }
      });

      if (!existingUserCoupon) {
        const userCoupon = await UserCoupon.create({
          userId: user.id,
          couponId: birthdayCoupon.id,
          isUsed: false
        });

        assignedCoupons.push({
          userId: user.id,
          couponId: birthdayCoupon.id,
          userCouponId: userCoupon.id
        });

        // In a real application, you would send:
        // 1. SMS to user.phone
        // 2. Email to user.email
        // 3. Push notification
        
        console.log(`Birthday wish sent to ${user.name} (${user.phone})`);
      }
    }

    return {
      success: true,
      message: `Birthday wishes sent to ${assignedCoupons.length} users`,
      count: assignedCoupons.length,
      users: todaysBirthdayUsers.map(user => ({
        id: user.id,
        name: user.name,
        phone: user.phone
      }))
    };

  } catch (error) {
    console.error('Error in birthday wish system:', error);
    throw error;
  }
};

/**
 * Check if today is user's birthday
 */
export const isTodayBirthday = (dateOfBirth) => {
  if (!dateOfBirth) return false;

  const today = new Date();
  const dob = new Date(dateOfBirth);
  
  return (
    dob.getMonth() === today.getMonth() &&
    dob.getDate() === today.getDate()
  );
};

/**
 * Get upcoming birthdays (next 7 days)
 */
export const getUpcomingBirthdays = async (days = 7) => {
  try {
    const today = new Date();
    const upcomingDate = new Date(today);
    upcomingDate.setDate(today.getDate() + days);

    const users = await User.findAll({
      where: {
        role: 'customer',
        isActive: true,
        isVerified: true,
        dateOfBirth: {
          [Op.ne]: null,
          [Op.between]: [today, upcomingDate]
        }
      },
      attributes: ['id', 'name', 'phone', 'email', 'dateOfBirth'],
      order: [['dateOfBirth', 'ASC']]
    });

    return users;
  } catch (error) {
    console.error('Error getting upcoming birthdays:', error);
    throw error;
  }
};