/**
 * Settings Controller
 * Handles subadmin management and shop information
 */

import { User, ShopInfo, sequelize } from '../models/index.js';
import { generateSlug } from '../utils/slugGenerator.js';
import { createOTP } from '../services/otpService.js';

/**
 * @desc    Create subadmin (only admin can do this)
 * @route   POST /api/admin/settings/subadmins
 * @access  Private (Admin only)
 */
export const createSubadmin = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Verify that the current user is admin (not subadmin)
    if (req.user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only admin can create subadmins'
      });
    }

    const { name, phone, email } = req.body;

    // Validation
    if (!name || !phone) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { phone },
      transaction
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Check if email exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({
        where: { email },
        transaction
      });

      if (existingEmail) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Generate unique slug
    const allSlugs = await User.findAll({
      attributes: ['slug'],
      raw: true,
      transaction
    }).then(users => users.map(user => user.slug));

    const slug = generateSlug(name, allSlugs);

    // Create subadmin user
    const subadmin = await User.create({
      name,
      phone,
      email: email || null,
      role: 'subadmin',
      slug,
      isVerified: true,
      isActive: true,
      additionalAddresses: []
    }, { transaction });

    // COMMIT THE TRANSACTION BEFORE CREATING OTP
    await transaction.commit();

    console.log('✅ User created successfully, committing transaction');

    // Generate OTP for initial login (OUTSIDE transaction to avoid locks)
    let otpResult;
    try {
      otpResult = await createOTP(phone, 'login');
      console.log('✅ OTP created successfully');
    } catch (otpError) {
      console.error('⚠️ OTP creation failed but user was created:', otpError.message);
      // Continue even if OTP fails - user was created successfully
      otpResult = { otp: null };
    }

    res.status(201).json({
      success: true,
      message: 'Subadmin created successfully',
      data: {
        id: subadmin.id,
        name: subadmin.name,
        phone: subadmin.phone,
        email: subadmin.email,
        role: subadmin.role,
        otp: process.env.NODE_ENV === 'development' ? (otpResult?.otp || 'OTP generation failed') : undefined
      }
    });
  } catch (error) {
    // Ensure transaction is rolled back
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log('❌ Transaction rolled back due to error');
    }

    console.error('Create subadmin error:', error.message);

    // Handle specific error types
    if (error.name === 'SequelizeDatabaseError' && error.parent?.code === 'ER_LOCK_WAIT_TIMEOUT') {
      return res.status(503).json({
        success: false,
        message: 'Database is busy. Please try again in a moment.',
        suggestion: 'Wait 30 seconds and retry'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating subadmin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all subadmins
 * @route   GET /api/admin/settings/subadmins
 * @access  Private (Admin only)
 */
export const getSubadmins = async (req, res) => {
  try {
    // Only admin can view subadmins
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can view subadmins'
      });
    }

    const subadmins = await User.findAll({
      where: {
        role: 'subadmin',
        isActive: true
      },
      attributes: [
        'id',
        'name',
        'phone',
        'email',
        'role',
        'isActive',
        'isVerified',
        'createdAt',
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: subadmins
    });
  } catch (error) {
    console.error('Get subadmins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subadmins'
    });
  }
};

/**
 * @desc    Update subadmin status
 * @route   PUT /api/admin/settings/subadmins/:id
 * @access  Private (Admin only)
 */
export const updateSubadmin = async (req, res) => {
  try {
    // Only admin can update subadmins
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update subadmins'
      });
    }

    const { id } = req.params;
    const { name, email, isActive } = req.body;

    const subadmin = await User.findOne({
      where: {
        id,
        role: 'subadmin'
      }
    });

    if (!subadmin) {
      return res.status(404).json({
        success: false,
        message: 'Subadmin not found'
      });
    }

    // Update fields
    if (name) subadmin.name = name;
    if (email !== undefined) subadmin.email = email;
    if (isActive !== undefined) subadmin.isActive = isActive;

    await subadmin.save();

    res.status(200).json({
      success: true,
      message: 'Subadmin updated successfully',
      data: {
        id: subadmin.id,
        name: subadmin.name,
        phone: subadmin.phone,
        email: subadmin.email,
        role: subadmin.role,
        isActive: subadmin.isActive
      }
    });
  } catch (error) {
    console.error('Update subadmin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating subadmin'
    });
  }
};

/**
 * @desc    Delete subadmin
 * @route   DELETE /api/admin/settings/subadmins/:id
 * @access  Private (Admin only)
 */
export const deleteSubadmin = async (req, res) => {
  try {
    // Only admin can delete subadmins
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete subadmins'
      });
    }

    const { id } = req.params;

    const subadmin = await User.findOne({
      where: {
        id,
        role: 'subadmin'
      }
    });

    if (!subadmin) {
      return res.status(404).json({
        success: false,
        message: 'Subadmin not found'
      });
    }

    // Soft delete by setting isActive to false
    await subadmin.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Subadmin deactivated successfully'
    });
  } catch (error) {
    console.error('Delete subadmin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting subadmin'
    });
  }
};

/**
 * @desc    Get shop information
 * @route   GET /api/admin/settings/shop-info
 * @access  Private (Admin/Subadmin)
 */
export const getShopInfo = async (req, res) => {
  try {
    // Get or create shop info (only one record should exist)
    let shopInfo = await ShopInfo.findOne({
      where: { isActive: true }
    });

    // If no shop info exists, create default one
    if (!shopInfo) {
      shopInfo = await ShopInfo.create({
        shopName: 'Krishna Digital World',
        isActive: true
      });
    }

    res.status(200).json({
      success: true,
      data: shopInfo
    });
  } catch (error) {
    console.error('Get shop info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shop information'
    });
  }
};

/**
 * @desc    Update shop information
 * @route   PUT /api/admin/settings/shop-info
 * @access  Private (Admin/Subadmin)
 */
export const updateShopInfo = async (req, res) => {
  try {
    const updateData = req.body;

    // Get or create shop info
    let shopInfo = await ShopInfo.findOne({
      where: { isActive: true }
    });

    if (!shopInfo) {
      // Create new shop info
      shopInfo = await ShopInfo.create({
        ...updateData,
        isActive: true
      });
    } else {
      // Update existing shop info
      await shopInfo.update(updateData);
    }

    // Reload to get updated data
    await shopInfo.reload();

    res.status(200).json({
      success: true,
      message: 'Shop information updated successfully',
      data: shopInfo
    });
  } catch (error) {
    console.error('Update shop info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating shop information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get shop information (Public)
 * @route   GET /api/shop-info
 * @access  Public
 */
export const getShopInfoPublic = async (req, res) => {
  try {
    const shopInfo = await ShopInfo.findOne({
      where: { isActive: true },
      attributes: [
        'shopName',
        'email',
        'phone',
        'alternatePhone',
        'address',
        'city',
        'state',
        'pincode',
        'country',
        'locations',
        'socialMedia',
        'businessHours',
        'description',
        'mapEmbedUrl',
        'logoUrl',
        'supportEmail',
        'supportPhone',
        'whatsappNumber'
      ]
    });

    if (!shopInfo) {
      return res.status(200).json({
        success: true,
        data: {
          shopName: 'Krishna Digital World',
          email: null,
          phone: null,
          address: null,
          locations: [],
          socialMedia: {},
          businessHours: {}
        }
      });
    }

    res.status(200).json({
      success: true,
      data: shopInfo
    });
  } catch (error) {
    console.error('Get shop info public error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shop information'
    });
  }
};