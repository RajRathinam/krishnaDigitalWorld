import { User, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * @desc    Get today's birthdays
 * @route   GET /api/birthdays/today
 * @access  Private (Admin)
 */
// birthdayController.js
export const getTodayBirthdays = async (req, res) => {
  try {
    const { role = 'customer' } = req.query; // Add query parameter
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDate = today.getDate();
    
    // Build where clause
    const where = {
      dateOfBirth: {
        [Op.ne]: null
      },
      [Op.and]: [
        sequelize.literal(`MONTH(date_of_birth) = ${todayMonth}`),
        sequelize.literal(`DAY(date_of_birth) = ${todayDate}`)
      ],
      isActive: true
    };
    
    // Add role filter if not 'all'
    if (role !== 'all') {
      where.role = role;
    }
    
    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'phone', 'email', 'dateOfBirth', 'giftReceived', 'role'],
      order: [['role', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: users || []
    });
  } catch (error) {
    console.error('Get today birthdays error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching today birthdays'
    });
  }
};

/**
 * @desc    Send birthday wish to a user
 * @route   POST /api/birthdays/:userId/wish
 * @access  Private (Admin)
 */
export const sendBirthdayWish = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if it's actually the user's birthday
    const today = new Date();
    const userBirthday = new Date(user.dateOfBirth);
    if (userBirthday.getMonth() + 1 !== today.getMonth() + 1 || userBirthday.getDate() !== today.getDate()) {
      return res.status(400).json({
        success: false,
        message: "It's not this user's birthday today"
      });
    }
    
    // TODO: Implement actual birthday wish sending logic
    // This could be:
    // 1. Send SMS
    // 2. Send Email
    // 3. Send Push Notification
    // 4. Create a birthday notification in the system
    
    // For now, just mark that gift was sent
    await user.update({ giftReceived: true });
    
    res.status(200).json({
      success: true,
      message: `Birthday wish sent to ${user.name}`,
      data: {
        userId: user.id,
        name: user.name,
        giftSent: true
      }
    });
  } catch (error) {
    console.error('Send birthday wish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending birthday wish'
    });
  }
};

/**
 * @desc    Trigger birthday offer for a user
 * @route   POST /api/birthdays/:userId/offer
 * @access  Private (Admin)
 */
export const sendBirthdayOffer = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // TODO: Implement birthday offer logic
    // This could be:
    // 1. Create a special birthday coupon for the user
    // 2. Add birthday bonus points
    // 3. Send special birthday discount
    
    res.status(200).json({
      success: true,
      message: `Birthday offer sent to ${user.name}`,
      data: {
        userId: user.id,
        name: user.name,
        offerSent: true
      }
    });
  } catch (error) {
    console.error('Send birthday offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending birthday offer'
    });
  }
};