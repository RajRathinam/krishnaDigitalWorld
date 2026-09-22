import { Gift, OfflineGiftClaim, User } from '../models/index.js';
import { deleteImage } from '../middleware/upload.js';
import { Op } from 'sequelize';

/**
 * @desc    Scan offline shop QR code for gift
 * @route   POST /api/gifts/scan-offline
 * @access  Private
 */
export const scanOfflineGift = async (req, res) => {
  try {
    const { secretKey } = req.body;

    if (!secretKey) {
      return res.status(400).json({ success: false, message: 'Invalid QR code.' });
    }

    let parsedQR;
    try {
      parsedQR = JSON.parse(secretKey);
    } catch (e) {
      // Fallback for old QR codes
      parsedQR = { secret: secretKey, category: 'Basic' };
    }

    if (parsedQR.secret !== process.env.GIFT_QR_SECRET) {
      return res.status(400).json({ success: false, message: 'Invalid QR code. This is not the correct store QR.' });
    }

    const targetCadre = parsedQR.category || 'Basic';

    // Check if user already scanned today
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
        message: 'You have already scanned the shop QR code today. Come back tomorrow!' 
      });
    }

    // Determine win (e.g., 100% chance for testing, change as needed)
    // 90% chance to win
    const isWin = Math.random() > 0.1;
    
    if (isWin) {
      const gifts = await Gift.findAll({ where: { status: true, cadre: targetCadre } });
      if (gifts.length > 0) {
        const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
        
        await OfflineGiftClaim.create({
          userId: req.user.id,
          giftId: randomGift.id,
          status: 'won'
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
      status: 'lost'
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
    const { productName, price, status, cadre } = req.body;

    if (!productName || !price) {
      return res.status(400).json({
        success: false,
        message: 'Product name and price are required'
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
      price,
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
