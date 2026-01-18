import { Brand, Product } from '../models/index.js';
import { generateSlug } from '../utils/slugGenerator.js';
import { deleteImage } from '../middleware/upload.js';

/**
 * @desc    Get all brands
 * @route   GET /api/brands
 * @access  Public
 */
export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: brands
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching brands'
    });
  }
};

/**
 * @desc    Get single brand
 * @route   GET /api/brands/:id
 * @access  Public
 */
export const getBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'name', 'slug', 'price', 'images'],
          limit: 10
        }
      ]
    });
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching brand'
    });
  }
};

/**
 * @desc    Create new brand
 * @route   POST /api/brands
 * @access  Private (Admin)
 */
export const createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Brand name is required'
      });
    }
    
    // Generate unique slug
    const existingSlugs = await Brand.findAll({
      attributes: ['slug'],
      raw: true
    }).then(brands => brands.map(b => b.slug));
    
    const slug = generateSlug(name, existingSlugs);
    
    // Process logo if uploaded
    let logo = null;
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      logo = req.uploadedFiles[0].url;
    }
    
    // Create brand
    const brand = await Brand.create({
      name,
      slug,
      description: description || null,
      logo,
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: brand
    });
  } catch (error) {
    console.error('Create brand error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Brand name or slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating brand'
    });
  }
};

/**
 * @desc    Update brand
 * @route   PUT /api/brands/:id
 * @access  Private (Admin)
 */
export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }
    
    // Process logo update
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      // Delete old logo from Cloudinary if exists
      if (brand.logo && brand.logo.includes('cloudinary')) {
        // Extract public ID from URL
        const parts = brand.logo.split('/');
        const publicId = parts[parts.length - 1].split('.')[0];
        await deleteImage(publicId);
      }
      
      req.body.logo = req.uploadedFiles[0].url;
    }
    
    // Update brand
    await brand.update(req.body);
    
    res.status(200).json({
      success: true,
      message: 'Brand updated successfully',
      data: brand
    });
  } catch (error) {
    console.error('Update brand error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Brand name or slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating brand'
    });
  }
};

/**
 * @desc    Delete brand
 * @route   DELETE /api/brands/:id
 * @access  Private (Admin)
 */
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }
    
    // Check if brand has products
    const productCount = await Product.count({
      where: { brandId: brand.id }
    });
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete brand with existing products'
      });
    }
    
    // Delete logo from Cloudinary if exists
    if (brand.logo && brand.logo.includes('cloudinary')) {
      const parts = brand.logo.split('/');
      const publicId = parts[parts.length - 1].split('.')[0];
      await deleteImage(publicId);
    }
    
    // Soft delete or hard delete
    if (req.query.hardDelete === 'true') {
      await brand.destroy();
    } else {
      await brand.update({ isActive: false });
    }
    
    res.status(200).json({
      success: true,
      message: `Brand ${req.query.hardDelete === 'true' ? 'deleted' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting brand'
    });
  }
};