import { Coupon, UserCoupon, Order, User } from '../models/index.js';
import { validateCoupon } from '../utils/validators.js';
import { Sequelize } from 'sequelize';

/**
 * @desc    Get all coupons (admin)
 * @route   GET /api/admin/coupons
 * @access  Private (Admin)
 */
export const getAllCoupons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      isActive,
      discountType,
      dateFrom,
      dateTo
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build where clause
    const where = {};
    
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (discountType) where.discountType = discountType;
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Sequelize.Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Sequelize.Op.lte] = new Date(dateTo);
    }
    
    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']] // Fixed: changed from 'createdAt' to 'created_at'
    });
    
    res.status(200).json({
      success: true,
      data: {
        coupons,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching coupons'
    });
  }
};

/**
 * @desc    Create new coupon (admin)
 * @route   POST /api/admin/coupons
 * @access  Private (Admin)
 */
export const createCoupon = async (req, res) => {
  try {
    // Validate coupon data
    const validation = validateCoupon(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      isActive = true,
      isSingleUse = false,
      applicableCategories,
      excludedProducts,
      userIds
    } = req.body;
    
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ where: { code } });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }
    
    // Create coupon
    const coupon = await Coupon.create({
      code,
      description,
      discountType,
      discountValue: parseFloat(discountValue),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      isActive,
      isSingleUse,
      applicableCategories: applicableCategories ? JSON.parse(applicableCategories) : [],
      excludedProducts: excludedProducts ? JSON.parse(excludedProducts) : [],
      userIds: userIds ? JSON.parse(userIds) : []
    });
    
    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating coupon'
    });
  }
};

/**
 * @desc    Get coupon details (admin)
 * @route   GET /api/admin/coupons/:id
 * @access  Private (Admin)
 */
export const getCouponDetails = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id, {
      include: [
        {
          model: Order,
          as: 'orders',
          attributes: ['id', 'orderNumber', 'finalAmount', 'createdAt'],
          limit: 10,
          order: [['created_at', 'DESC']] // Fixed: changed from 'createdAt' to 'created_at'
        },
        {
          model: UserCoupon,
          as: 'userCoupons',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ],
          limit: 10,
          order: [['created_at', 'DESC']] // Fixed: changed from 'createdAt' to 'created_at'
        }
      ]
    });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Get coupon details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching coupon details'
    });
  }
};

/**
 * @desc    Update coupon (admin)
 * @route   PUT /api/admin/coupons/:id
 * @access  Private (Admin)
 */
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    // Don't allow updating code if coupon has been used
    if (req.body.code && coupon.usedCount > 0) {
      delete req.body.code;
    }
    
    // Update coupon
    await coupon.update(req.body);
    
    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating coupon'
    });
  }
};

/**
 * @desc    Toggle coupon active status (admin)
 * @route   PUT /api/admin/coupons/:id/status
 * @access  Private (Admin)
 */
export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    await coupon.update({ isActive: !coupon.isActive });
    
    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: coupon.id,
        code: coupon.code,
        isActive: coupon.isActive
      }
    });
  } catch (error) {
    console.error('Toggle coupon status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling coupon status'
    });
  }
};

/**
 * @desc    Delete coupon (admin)
 * @route   DELETE /api/admin/coupons/:id
 * @access  Private (Admin)
 */
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    // Don't delete if coupon has been used
    if (coupon.usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a coupon that has been used'
      });
    }
    
    await coupon.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting coupon'
    });
  }
};

/**
 * @desc    Validate coupon for cart
 * @route   POST /api/coupons/validate
 * @access  Private (Customer)
 */
export const validateCouponForCart = async (req, res) => {
  try {
    const { couponCode, cartTotal } = req.body;
    
    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }
    
    const coupon = await Coupon.findOne({
      where: {
        code: couponCode,
        isActive: true,
        validFrom: { [Sequelize.Op.lte]: new Date() },
        validUntil: { [Sequelize.Op.gte]: new Date() }
      }
    });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon'
      });
    }
    
    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }
    
    // Check if user-specific coupon
    if (coupon.userIds && coupon.userIds.length > 0) {
      if (!coupon.userIds.includes(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'This coupon is not available for your account'
        });
      }
    }
    
    // Check if user has already used this coupon
    if (coupon.isSingleUse) {
      const userCoupon = await UserCoupon.findOne({
        where: {
          userId: req.user.id,
          couponId: coupon.id,
          isUsed: true
        }
      });
      
      if (userCoupon) {
        return res.status(400).json({
          success: false,
          message: 'You have already used this coupon'
        });
      }
    }
    
    // Check minimum order amount
    if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ${coupon.minOrderAmount} required for this coupon`
      });
    }
    
    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }
    
    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscount: coupon.maxDiscount
        },
        discount,
        finalAmount: cartTotal - discount
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating coupon'
    });
  }
};

/**
 * @desc    Get user's available coupons
 * @route   GET /api/coupons/my-coupons
 * @access  Private (Customer)
 */
export const getMyCoupons = async (req, res) => {
  try {
    const { isUsed } = req.query;
    
    const where = { userId: req.user.id };
    if (isUsed !== undefined) {
      where.isUsed = isUsed === 'true';
    }
    
    const userCoupons = await UserCoupon.findAll({
      where,
      include: [
        {
          model: Coupon,
          as: 'coupon'
        }
      ],
      order: [['created_at', 'DESC']] // Fixed: changed from 'createdAt' to 'created_at'
    });
    
    // Filter valid coupons on the backend
    const validCoupons = userCoupons.filter(uc => {
      if (!uc.coupon) return false;
      const now = new Date();
      return (
        uc.coupon.isActive &&
        new Date(uc.coupon.validFrom) <= now &&
        new Date(uc.coupon.validUntil) >= now
      );
    });
    
    res.status(200).json({
      success: true,
      data: validCoupons
    });
  } catch (error) {
    console.error('Get my coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching coupons'
    });
  }
};

/**
 * @desc    Get coupon usage statistics (admin)
 * @route   GET /api/admin/coupons/stats
 * @access  Private (Admin)
 */
export const getCouponStats = async (req, res) => {
  try {
    // Get most used coupons
    const mostUsedCoupons = await Coupon.findAll({
      where: { usedCount: { [Sequelize.Op.gt]: 0 } },
      order: [['usedCount', 'DESC']],
      limit: 10
    });
    
    // Get total discount given
    const totalDiscount = await Order.sum('discountAmount');
    
    // Get coupon usage by month
    const usageByMonth = await Order.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'month'], // Fixed: changed from 'createdAt' to 'created_at'
        [Sequelize.fn('SUM', Sequelize.col('discountAmount')), 'totalDiscount'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'couponCount']
      ],
      where: {
        discountAmount: { [Sequelize.Op.gt]: 0 }
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m')], // Fixed: changed from 'createdAt' to 'created_at'
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'DESC']], // Fixed: changed from 'createdAt' to 'created_at'
      limit: 12
    });
    
    res.status(200).json({
      success: true,
      data: {
        mostUsedCoupons,
        totalDiscount: totalDiscount || 0,
        usageByMonth,
        totalCoupons: await Coupon.count(),
        activeCoupons: await Coupon.count({ where: { isActive: true } })
      }
    });
  } catch (error) {
    console.error('Get coupon stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching coupon statistics'
    });
  }
};

/**
 * @desc    Assign coupon to a specific user (admin)
 * @route   POST /api/admin/users/:userId/assign-coupon
 * @access  Private (Admin)
 */
export const assignCouponToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      discountValue, 
      discountType = 'percentage', 
      minOrderAmount = 0,
      maxDiscount = null,
      validDays = 30,
      description = '',
      isSingleUse = true
    } = req.body;

    // Validate input
    if (!userId || !discountValue) {
      return res.status(400).json({
        success: false,
        message: 'User ID and discount value are required'
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate unique coupon code
    const generateUniqueCouponCode = () => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const allChars = uppercase + lowercase;
      
      let code = '';
      code += uppercase[Math.floor(Math.random() * uppercase.length)];
      code += lowercase[Math.floor(Math.random() * lowercase.length)];
      
      for (let i = 0; i < 4; i++) {
        code += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      const codeArray = code.split('');
      for (let i = codeArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [codeArray[i], codeArray[j]] = [codeArray[j], codeArray[i]];
      }
      
      return codeArray.join('');
    };

    // Create coupon
    const coupon = await Coupon.create({
      code: generateUniqueCouponCode(),
      description: description || `Custom ${discountValue}${discountType === 'percentage' ? '%' : '₹'} discount for ${user.name}`,
      discountType,
      discountValue: parseFloat(discountValue),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
      usageLimit: 1,
      isSingleUse,
      isActive: true,
      userIds: [userId] // Restrict to this user
    });

    // Assign coupon to user
    const userCoupon = await UserCoupon.create({
      userId,
      couponId: coupon.id,
      isUsed: false
    });

    res.status(201).json({
      success: true,
      message: `Coupon successfully assigned to ${user.name}`,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscount: coupon.maxDiscount,
          validFrom: coupon.validFrom,
          validUntil: coupon.validUntil
        },
        userCoupon: {
          id: userCoupon.id,
          userId: userCoupon.userId,
          couponId: userCoupon.couponId,
          isUsed: userCoupon.isUsed
        }
      }
    });
  } catch (error) {
    console.error('Assign coupon to user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning coupon'
    });
  }
};

/**
 * @desc    Get all coupons for a specific user (admin)
 * @route   GET /api/admin/users/:userId/coupons
 * @access  Private (Admin)
 */
export const getUserCoupons = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isUsed, page = 1, limit = 20 } = req.query;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const offset = (page - 1) * limit;
    const where = { userId };
    
    if (isUsed !== undefined) {
      where.isUsed = isUsed === 'true';
    }

    const { count, rows: userCoupons } = await UserCoupon.findAndCountAll({
      where,
      include: [
        {
          model: Coupon,
          as: 'coupon',
          attributes: ['id', 'code', 'description', 'discountType', 'discountValue', 'minOrderAmount', 'maxDiscount', 'validFrom', 'validUntil', 'isActive', 'isSingleUse']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']] // Fixed: changed from 'createdAt' to 'created_at'
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        coupons: userCoupons,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user coupons'
    });
  }
};

/**
 * @desc    Delete/Remove coupon from user (admin)
 * @route   DELETE /api/admin/users/:userId/coupons/:userCouponId
 * @access  Private (Admin)
 */
export const deleteUserCoupon = async (req, res) => {
  try {
    const { userId, userCouponId } = req.params;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find and delete user coupon
    const userCoupon = await UserCoupon.findOne({
      where: {
        id: userCouponId,
        userId
      }
    });

    if (!userCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found for this user'
      });
    }

    // Don't allow deletion if coupon is used
    if (userCoupon.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a coupon that has already been used'
      });
    }

    await userCoupon.destroy();

    res.status(200).json({
      success: true,
      message: 'Coupon removed from user successfully'
    });
  } catch (error) {
    console.error('Delete user coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user coupon'
    });
  }
};

/**
 * @desc    Get all user coupons (admin management view)
 * @route   GET /api/admin/user-coupons
 * @access  Private (Admin)
 */
export const getAllUserCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, isUsed, userId, couponCode } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    if (isUsed !== undefined) {
      where.isUsed = isUsed === 'true';
    }

    const couponWhere = {};
    if (couponCode) {
      couponWhere.code = { [Sequelize.Op.like]: `%${couponCode}%` };
    }

    const { count, rows: userCoupons } = await UserCoupon.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: userId ? { id: userId } : undefined,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Coupon,
          as: 'coupon',
          where: couponWhere,
          attributes: ['id', 'code', 'description', 'discountType', 'discountValue', 'minOrderAmount', 'maxDiscount', 'validFrom', 'validUntil', 'isActive', 'isSingleUse', 'usedCount']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']], // Fixed: changed from 'createdAt' to 'created_at'
      distinct: true
    });

    res.status(200).json({
      success: true,
      data: {
        userCoupons,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all user coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user coupons'
    });
  }
};

/**
 * @desc    Get unnotified coupons for current user
 * @route   GET /api/coupons/unnotified
 * @access  Private (Customer)
 */
export const getUnnotifiedCoupons = async (req, res) => {
  try {
    const userId = req.user.id;

    const unnotifiedCoupons = await UserCoupon.findAll({
      where: {
        userId,
        isNotified: false,
        isUsed: false
      },
      include: [
        {
          model: Coupon,
          as: 'coupon',
          where: {
            isActive: true,
            validUntil: { [Sequelize.Op.gte]: new Date() }
          },
          attributes: ['id', 'code', 'description', 'discountType', 'discountValue', 'minOrderAmount', 'maxDiscount', 'validFrom', 'validUntil']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: unnotifiedCoupons
    });
  } catch (error) {
    console.error('Get unnotified coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching unnotified coupons'
    });
  }
};

/**
 * @desc    Mark coupon as notified for current user
 * @route   PUT /api/coupons/:userCouponId/notify
 * @access  Private (Customer)
 */
export const markCouponAsNotified = async (req, res) => {
  try {
    const { userCouponId } = req.params;
    const userId = req.user.id;

    const userCoupon = await UserCoupon.findOne({
      where: {
        id: userCouponId,
        userId
      }
    });

    if (!userCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    await userCoupon.update({ isNotified: true });

    res.status(200).json({
      success: true,
      message: 'Coupon marked as notified'
    });
  } catch (error) {
    console.error('Mark coupon as notified error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking coupon as notified'
    });
  }
};