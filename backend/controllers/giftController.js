import { Gift, OfflineGiftClaim, Order, User } from '../models/index.js';
import { deleteImage } from '../middleware/upload.js';
import { Op } from 'sequelize';

// Same cadre ranges shown in the admin Gift form (Basic up to 5K, Economy 5K-10K, ...)
const getCadreForAmount = (amount) => {
  const n = parseFloat(amount) || 0;
  if (n <= 5000) return 'Basic';
  if (n <= 10000) return 'Economy';
  if (n <= 25000) return 'Standard';
  if (n <= 50000) return 'Premium';
  if (n <= 75000) return 'Elite';
  if (n <= 100000) return 'Luxury';
  return 'Platinum';
};

/**
 * @desc    Scan offline shop QR code for gift
 * @route   POST /api/gifts/scan-offline
 * @access  Private
 */
export const scanOfflineGift = async (req, res) => {
  try {
    const { secretKey, billNumber, purchasedAmount } = req.body;

    if (!secretKey) {
      return res.status(400).json({ success: false, code: 'INVALID_QR', message: 'Invalid QR code.' });
    }

    // Check if user already scanned today — fail fast before validating form details
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingClaim = await OfflineGiftClaim.findOne({
      where: {
        userId: req.user.id,
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: {
          [Op.ne]: 'rejected'
        }
      }
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_SCANNED',
        message: 'You have already scanned the shop QR code today. Come back tomorrow!'
      });
    }

    if (!billNumber || !billNumber.trim()) {
      return res.status(400).json({ success: false, code: 'BILL_NUMBER_REQUIRED', message: 'Bill number is required.' });
    }

    if (!purchasedAmount || isNaN(parseFloat(purchasedAmount)) || parseFloat(purchasedAmount) <= 0) {
      return res.status(400).json({ success: false, code: 'AMOUNT_REQUIRED', message: 'Purchased amount is required.' });
    }

    // Profile photo: required once, unless the user already has one on file.
    // The auth middleware only attaches a minimal req.user (no profileImage), so look it up directly.
    const currentUser = await User.findByPk(req.user.id, { attributes: ['id', 'profileImage'] });
    let newProfileImage = null;
    if (!currentUser?.profileImage) {
      if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
        return res.status(400).json({ success: false, code: 'PHOTO_REQUIRED', message: 'Profile photo is required.' });
      }
      newProfileImage = req.uploadedFiles[0].url;
    }

    let parsedQR;
    try {
      parsedQR = JSON.parse(secretKey);
    } catch (e) {
      // Fallback for old QR codes
      parsedQR = { secret: secretKey, category: 'Basic' };
    }

    if (parsedQR.secret !== process.env.GIFT_QR_SECRET) {
      return res.status(400).json({ success: false, code: 'INVALID_QR', message: 'Invalid QR code. This is not the correct store QR.' });
    }

    const targetCadre = parsedQR.category || 'Basic';

    // The scanned QR's cadre must match the cadre computed from the entered purchase amount
    const expectedCadre = getCadreForAmount(purchasedAmount);
    if (expectedCadre !== targetCadre) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_QR',
        message: `Invalid QR code. This QR does not match your purchase amount (expected the ${expectedCadre} counter QR).`
      });
    }

    if (newProfileImage) {
      await User.update({ profileImage: newProfileImage }, { where: { id: req.user.id } });
    }

    // Always win — every scan gets a gift (subject to stock availability below)
    const isWin = true;
    
    if (isWin) {
      const gifts = await Gift.findAll({ where: { status: true, cadre: targetCadre } });
      if (gifts.length > 0) {
        const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
        
        await OfflineGiftClaim.create({
          userId: req.user.id,
          giftId: randomGift.id,
          status: 'won',
          billNumber: billNumber.trim(),
          purchasedAmount
        });

        return res.status(200).json({
          success: true,
          status: 'won',
          gift: randomGift,
          message: 'Congratulations! You won a gift.'
        });
      }
    }

    // Lost
    await OfflineGiftClaim.create({
      userId: req.user.id,
      status: 'lost',
      billNumber: billNumber.trim(),
      purchasedAmount
    });

    return res.status(200).json({
      success: true,
      status: 'lost',
      message: 'Better luck next time!'
    });

  } catch (error) {
    console.error('Offline scan error:', error);
    res.status(500).json({ success: false, message: 'Server error during scan' });
  }
};

/**
 * @desc    Get all gifts
 * @route   GET /api/gifts
 * @access  Public or Admin
 */
export const getGifts = async (req, res) => {
  try {
    const gifts = await Gift.findAll({
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: gifts
    });
  } catch (error) {
    console.error('Get gifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching gifts'
    });
  }
};

/**
 * @desc    Get single gift
 * @route   GET /api/gifts/:id
 * @access  Public or Admin
 */
export const getGift = async (req, res) => {
  try {
    const gift = await Gift.findByPk(req.params.id);

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }

    res.status(200).json({
      success: true,
      data: gift
    });
  } catch (error) {
    console.error('Get gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching gift'
    });
  }
};

/**
 * @desc    Create new gift
 * @route   POST /api/gifts
 * @access  Private (Admin)
 */
export const createGift = async (req, res) => {
  try {
    const { productName, productCode, status, cadre } = req.body;

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    let image = null;
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      const file = req.uploadedFiles[0];
      
      // Check for 3MB size limit
      if (file.size > 3 * 1024 * 1024) {
        // Delete the uploaded file since it's too large
        const filename = file.publicId; 
        await deleteImage(filename);
        
        return res.status(400).json({
          success: false,
          message: 'Image size must be less than 3MB'
        });
      }
      
      image = file.url;
    }

    const gift = await Gift.create({
      productName,
      productCode: productCode || null,
      status: status !== undefined ? status : true,
      cadre: cadre || 'Basic',
      image
    });

    res.status(201).json({
      success: true,
      message: 'Gift created successfully',
      data: gift
    });
  } catch (error) {
    console.error('Create gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating gift'
    });
  }
};

/**
 * @desc    Update gift
 * @route   PUT /api/gifts/:id
 * @access  Private (Admin)
 */
export const updateGift = async (req, res) => {
  try {
    const gift = await Gift.findByPk(req.params.id);

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }

    // Process image update
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      const file = req.uploadedFiles[0];
      
      // Check for 3MB size limit
      if (file.size > 3 * 1024 * 1024) {
        const filename = file.publicId; 
        await deleteImage(filename);
        
        return res.status(400).json({
          success: false,
          message: 'Image size must be less than 3MB'
        });
      }
      
      // Delete old image from local storage if exists
      if (gift.image && gift.image.startsWith('/uploads/')) {
        const oldFilename = gift.image.replace('/uploads/', '');
        await deleteImage(oldFilename);
      }

      req.body.image = file.url;
    }

    await gift.update(req.body);

    res.status(200).json({
      success: true,
      message: 'Gift updated successfully',
      data: gift
    });
  } catch (error) {
    console.error('Update gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating gift'
    });
  }
};

/**
 * @desc    Delete gift
 * @route   DELETE /api/gifts/:id
 * @access  Private (Admin)
 */
export const deleteGift = async (req, res) => {
  try {
    const gift = await Gift.findByPk(req.params.id);

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }

    // Delete image from local storage if exists
    if (gift.image && gift.image.startsWith('/uploads/')) {
      const filename = gift.image.replace('/uploads/', '');
      await deleteImage(filename);
    }

    await gift.destroy();

    res.status(200).json({
      success: true,
      message: 'Gift deleted successfully'
    });
  } catch (error) {
    console.error('Delete gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting gift'
    });
  }
};

/**
 * @desc    Get all offline gift claims
 * @route   GET /api/gifts/claims
 * @access  Private (Admin)
 */
export const getOfflineClaims = async (req, res) => {
  try {
    const claims = await OfflineGiftClaim.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'phone', 'email'] },
        { model: Gift, as: 'gift' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('Get offline claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching claims'
    });
  }
};

/**
 * @desc    Update offline gift claim status
 * @route   PUT /api/gifts/claims/:id
 * @access  Private (Admin)
 */
export const updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const claim = await OfflineGiftClaim.findByPk(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    await claim.update({ status });

    res.status(200).json({
      success: true,
      message: 'Claim status updated',
      data: claim
    });
  } catch (error) {
    console.error('Update claim status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating claim'
    });
  }
};

/**
 * @desc    Get the logged-in user's own claimed/won gifts (online orders + offline QR scans)
 * @route   GET /api/gifts/my-claims
 * @access  Private
 */
export const getMyClaimedGifts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [onlineOrders, offlineClaims] = await Promise.all([
      Order.findAll({
        where: { userId, giftStatus: 'won' },
        include: [{ model: Gift, as: 'gift' }],
        order: [['created_at', 'DESC']]
      }),
      OfflineGiftClaim.findAll({
        where: { userId, status: 'won' },
        include: [{ model: Gift, as: 'gift' }],
        order: [['created_at', 'DESC']]
      })
    ]);

    const claimed = [
      ...onlineOrders
        .filter(o => o.gift)
        .map(o => ({
          id: `order-${o.id}`,
          source: 'online',
          gift: o.gift,
          orderId: o.id,
          orderNumber: o.orderNumber,
          claimedAt: o.createdAt
        })),
      ...offlineClaims
        .filter(c => c.gift)
        .map(c => ({
          id: `offline-${c.id}`,
          source: 'offline',
          gift: c.gift,
          billNumber: c.billNumber,
          purchasedAmount: c.purchasedAmount,
          claimedAt: c.createdAt
        }))
    ].sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt));

    res.status(200).json({
      success: true,
      data: claimed
    });
  } catch (error) {
    console.error('Get my claimed gifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your claimed gifts'
    });
  }
};
