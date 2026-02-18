import { Advertisement, User } from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize'; // Import Op for operators

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper function to cleanup uploaded files on error
 */
const cleanupUploadedFiles = (req) => {
  if (req.files) {
    // Delete video file
    if (req.files.video) {
      req.files.video.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log('Cleaned up video file:', file.filename);
          }
        } catch (err) {
          console.error('Error cleaning up video file:', err);
        }
      });
    }
    
    // Delete thumbnail file
    if (req.files.thumbnail) {
      req.files.thumbnail.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log('Cleaned up thumbnail file:', file.filename);
          }
        } catch (err) {
          console.error('Error cleaning up thumbnail file:', err);
        }
      });
    }
  }
};

/**
 * @desc    Get all advertisements (admin)
 * @route   GET /api/advertisements
 * @access  Private (Admin)
 */
export const getAdvertisements = async (req, res) => {
  try {
    const { includeInactive, position, type } = req.query;
    
    const whereClause = {};
    
    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }
    
    if (position) {
      whereClause.position = position;
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    const advertisements = await Advertisement.findAll({
      where: whereClause,
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC'] // Use snake_case to match database column
      ],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: advertisements
    });
  } catch (error) {
    console.error('Get advertisements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching advertisements'
    });
  }
};

/**
 * @desc    Get active advertisements for frontend
 * @route   GET /api/advertisements/active
 * @access  Public
 */
export const getActiveAdvertisements = async (req, res) => {
  try {
    console.log('=== GET ACTIVE ADVERTISEMENTS ===');
    console.log('Query params:', req.query);
    
    const { position, limit = 10 } = req.query;
    
    const whereClause = {
      isActive: true,
      [Op.or]: [
        { startDate: null },
        { startDate: { [Op.lte]: new Date() } }
      ],
      [Op.or]: [
        { endDate: null },
        { endDate: { [Op.gte]: new Date() } }
      ]
    };
    
    // Add position filter if provided
    if (position) {
      whereClause.position = position;
    }
    
    console.log('Where clause:', JSON.stringify(whereClause, null, 2));
    
    // Check if any advertisements exist
    const totalCount = await Advertisement.count();
    console.log('Total advertisements in database:', totalCount);
    
    const activeCount = await Advertisement.count({ where: { isActive: true } });
    console.log('Active advertisements:', activeCount);
    
    // IMPORTANT FIX: Use the actual database column name 'created_at' instead of 'createdAt'
    const advertisements = await Advertisement.findAll({
      where: whereClause,
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC'] // Use snake_case to match database column
      ],
      limit: parseInt(limit)
    });
    
    console.log(`Found ${advertisements.length} advertisements before expiry check`);
    
    // Filter out expired ads manually
    const activeAds = advertisements.filter(ad => {
      try {
        // Check if ad has isExpired method and if it's expired
        const isExpired = ad.isExpired ? ad.isExpired() : false;
        
        // Also check maxViews manually if needed
        const maxViewsExceeded = ad.maxViews && ad.views >= ad.maxViews;
        
        return !isExpired && !maxViewsExceeded;
      } catch (err) {
        console.error(`Error checking expiry for ad ${ad.id}:`, err);
        return true; // Keep the ad if we can't check expiry
      }
    });
    
    console.log(`Returning ${activeAds.length} active advertisements`);
    
    res.status(200).json({
      success: true,
      data: activeAds
    });
  } catch (error) {
    console.error('=== GET ACTIVE ADVERTISEMENTS ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching advertisements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * @desc    Get single advertisement
 * @route   GET /api/advertisements/:id
 * @access  Private (Admin)
 */
export const getAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: advertisement
    });
  } catch (error) {
    console.error('Get advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching advertisement'
    });
  }
};

/**
 * @desc    Create new advertisement
 * @route   POST /api/advertisements
 * @access  Private (Admin)
 */
export const createAdvertisement = async (req, res) => {
  try {
    console.log('=== CREATE ADVERTISEMENT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    
    const {
      title,
      description,
      link,
      position,
      type,
      externalVideoId,
      startDate,
      endDate,
      priority,
      maxViews,
      autoplay,
      muted,
      loop,
      duration
    } = req.body;
    
    // Validation
    if (!title) {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Advertisement title is required'
      });
    }
    
    if (title.length < 2) {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 2 characters long'
      });
    }
    
    // Check video source based on type
    if (type === 'video' && !req.files?.video) {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Video file is required for video type advertisements'
      });
    }
    
    if ((type === 'youtube' || type === 'vimeo') && !externalVideoId) {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: `External video ID is required for ${type} type advertisements`
      });
    }
    
    // Process video file if uploaded
    let videoUrl = null;
    if (req.files?.video && req.files.video.length > 0) {
      const file = req.files.video[0];
      videoUrl = `/uploads/ads-videos/${file.filename}`;
    }
    
    // Process thumbnail if uploaded
    let thumbnailUrl = null;
    if (req.files?.thumbnail && req.files.thumbnail.length > 0) {
      const file = req.files.thumbnail[0];
      thumbnailUrl = `/uploads/ads-thumbnails/${file.filename}`;
    }
    
    // Create advertisement
    const advertisement = await Advertisement.create({
      title: title.trim(),
      description: description || null,
      videoUrl,
      thumbnailUrl,
      link: link || null,
      position: position || 'homepage_middle',
      type: type || 'video',
      externalVideoId: externalVideoId || null,
      startDate: startDate || null,
      endDate: endDate || null,
      priority: priority || 0,
      maxViews: maxViews || null,
      autoplay: autoplay === 'true' || autoplay === true,
      muted: muted === 'true' || muted === true,
      loop: loop === 'true' || loop === true,
      duration: duration || null,
      createdBy: req.user.id,
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      data: advertisement
    });
    
  } catch (error) {
    // Cleanup uploaded files on error
    cleanupUploadedFiles(req);
    
    console.error('Create advertisement error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating advertisement'
    });
  }
};

/**
 * @desc    Update advertisement
 * @route   PUT /api/advertisements/:id
 * @access  Private (Admin)
 */
export const updateAdvertisement = async (req, res) => {
  try {
    console.log('=== UPDATE ADVERTISEMENT REQUEST ===');
    console.log('Advertisement ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    
    const advertisement = await Advertisement.findByPk(req.params.id);
    
    if (!advertisement) {
      cleanupUploadedFiles(req);
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    const updateData = {};
    
    // Update fields if provided
    if (req.body.title) {
      if (req.body.title.length < 2) {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Title must be at least 2 characters long'
        });
      }
      updateData.title = req.body.title.trim();
    }
    
    if (req.body.description !== undefined) {
      updateData.description = req.body.description || null;
    }
    
    if (req.body.link !== undefined) {
      updateData.link = req.body.link || null;
    }
    
    if (req.body.position) {
      updateData.position = req.body.position;
    }
    
    if (req.body.type) {
      updateData.type = req.body.type;
    }
    
    if (req.body.externalVideoId !== undefined) {
      updateData.externalVideoId = req.body.externalVideoId || null;
    }
    
    if (req.body.startDate !== undefined) {
      updateData.startDate = req.body.startDate || null;
    }
    
    if (req.body.endDate !== undefined) {
      updateData.endDate = req.body.endDate || null;
    }
    
    if (req.body.priority !== undefined) {
      updateData.priority = req.body.priority;
    }
    
    if (req.body.maxViews !== undefined) {
      updateData.maxViews = req.body.maxViews || null;
    }
    
    if (req.body.autoplay !== undefined) {
      updateData.autoplay = req.body.autoplay === 'true' || req.body.autoplay === true;
    }
    
    if (req.body.muted !== undefined) {
      updateData.muted = req.body.muted === 'true' || req.body.muted === true;
    }
    
    if (req.body.loop !== undefined) {
      updateData.loop = req.body.loop === 'true' || req.body.loop === true;
    }
    
    if (req.body.duration !== undefined) {
      updateData.duration = req.body.duration || null;
    }
    
    // Handle video file upload
    if (req.files?.video && req.files.video.length > 0) {
      const file = req.files.video[0];
      
      // Delete old video file if exists
      if (advertisement.videoUrl) {
        const oldFilename = path.basename(advertisement.videoUrl);
        try {
          const oldPath = path.join(__dirname, '..', 'uploads', 'ads-videos', oldFilename);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log('Deleted old video file:', oldFilename);
          }
        } catch (err) {
          console.error('Error deleting old video file:', err);
        }
      }
      
      updateData.videoUrl = `/uploads/ads-videos/${file.filename}`;
    }
    
    // Handle thumbnail upload
    if (req.files?.thumbnail && req.files.thumbnail.length > 0) {
      const file = req.files.thumbnail[0];
      
      // Delete old thumbnail if exists
      if (advertisement.thumbnailUrl) {
        const oldFilename = path.basename(advertisement.thumbnailUrl);
        try {
          const oldPath = path.join(__dirname, '..', 'uploads', 'ads-thumbnails', oldFilename);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log('Deleted old thumbnail file:', oldFilename);
          }
        } catch (err) {
          console.error('Error deleting old thumbnail file:', err);
        }
      }
      
      updateData.thumbnailUrl = `/uploads/ads-thumbnails/${file.filename}`;
    }
    
    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Update the advertisement
    await advertisement.update(updateData);
    
    // Fetch the updated advertisement
    const updatedAdvertisement = await Advertisement.findByPk(advertisement.id);
    
    res.status(200).json({
      success: true,
      message: 'Advertisement updated successfully',
      data: updatedAdvertisement
    });
    
  } catch (error) {
    // Cleanup uploaded files on error
    cleanupUploadedFiles(req);
    
    console.error('Update advertisement error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating advertisement'
    });
  }
};

/**
 * @desc    Delete advertisement
 * @route   DELETE /api/advertisements/:id
 * @access  Private (Admin)
 */
export const deleteAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.findByPk(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    // Soft delete by default, hard delete only if requested
    if (req.query.hardDelete === 'true') {
      // Delete video file
      if (advertisement.videoUrl) {
        const videoFilename = path.basename(advertisement.videoUrl);
        try {
          const videoPath = path.join(__dirname, '..', 'uploads', 'ads-videos', videoFilename);
          if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
            console.log('Deleted video file:', videoFilename);
          }
        } catch (err) {
          console.error('Error deleting video file:', err);
        }
      }
      
      // Delete thumbnail file
      if (advertisement.thumbnailUrl) {
        const thumbnailFilename = path.basename(advertisement.thumbnailUrl);
        try {
          const thumbnailPath = path.join(__dirname, '..', 'uploads', 'ads-thumbnails', thumbnailFilename);
          if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
            console.log('Deleted thumbnail file:', thumbnailFilename);
          }
        } catch (err) {
          console.error('Error deleting thumbnail file:', err);
        }
      }
      
      // Hard delete from database
      await advertisement.destroy({ force: true });
    } else {
      // Soft delete
      await advertisement.destroy();
    }
    
    res.status(200).json({
      success: true,
      message: req.query.hardDelete === 'true' 
        ? 'Advertisement permanently deleted' 
        : 'Advertisement moved to trash'
    });
    
  } catch (error) {
    console.error('Delete advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting advertisement'
    });
  }
};

/**
 * @desc    Update advertisement status (activate/deactivate)
 * @route   PATCH /api/advertisements/:id/status
 * @access  Private (Admin)
 */
export const updateAdvertisementStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const advertisement = await Advertisement.findByPk(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    await advertisement.update({ isActive });
    
    res.status(200).json({
      success: true,
      message: `Advertisement ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: advertisement
    });
    
  } catch (error) {
    console.error('Update advertisement status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating advertisement status'
    });
  }
};

/**
 * @desc    Increment advertisement views
 * @route   PATCH /api/advertisements/:id/views
 * @access  Public
 */
export const incrementAdViews = async (req, res) => {
  try {
    const advertisement = await Advertisement.findByPk(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    await advertisement.incrementViews();
    
    res.status(200).json({
      success: true,
      message: 'Views incremented successfully'
    });
    
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while incrementing views'
    });
  }
};

/**
 * @desc    Increment advertisement clicks
 * @route   PATCH /api/advertisements/:id/clicks
 * @access  Public
 */
export const incrementAdClicks = async (req, res) => {
  try {
    const advertisement = await Advertisement.findByPk(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    await advertisement.incrementClicks();
    
    res.status(200).json({
      success: true,
      message: 'Clicks incremented successfully'
    });
    
  } catch (error) {
    console.error('Increment clicks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while incrementing clicks'
    });
  }
};