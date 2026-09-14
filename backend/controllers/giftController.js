import { Gift } from '../models/index.js';
import { deleteImage } from '../middleware/upload.js';

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
    const { productName, price, status } = req.body;

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
