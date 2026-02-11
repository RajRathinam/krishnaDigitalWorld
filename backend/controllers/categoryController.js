// controllers/categoryController.js
import { Category, Product } from '../models/index.js';
import { generateSlug } from '../utils/slugGenerator.js';
import { deleteImage } from '../middleware/upload.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @desc    Create new category with subcategories array and images
 * @route   POST /api/categories
 * @access  Private (Admin)
 */
export const createCategory = async (req, res) => {
  try {
    const { name, description, parentId, subcategories, attributesSchema, subcategoryImageMapping } = req.body;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Category name must be at least 2 characters long'
      });
    }
    
    // Generate unique slug
    const existingSlugs = await Category.findAll({
      attributes: ['slug'],
      raw: true
    }).then(categories => categories.map(c => c.slug));
    
    const slug = generateSlug(name, existingSlugs);
    
    // Check if parent exists
    if (parentId) {
      const parent = await Category.findByPk(parentId);
      if (!parent) {
        // Cleanup uploaded files if any
        cleanupUploadedFiles(req);
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }
    
    // Parse subcategories if provided
    let parsedSubcategories = [];
    if (subcategories) {
      try {
        parsedSubcategories = typeof subcategories === 'string' 
          ? JSON.parse(subcategories) 
          : subcategories;
        
        if (!Array.isArray(parsedSubcategories)) {
          cleanupUploadedFiles(req);
          return res.status(400).json({
            success: false,
            message: 'subcategories must be an array'
          });
        }

        // Clean subcategory names
        parsedSubcategories = parsedSubcategories
          .map(s => String(s).trim())
          .filter(s => s.length > 0);
        
      } catch (error) {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Invalid subcategories JSON format'
        });
      }
    }
    
    // Get category image path if uploaded
    let imagePath = null;
    if (req.files && req.files.categoryImage && req.files.categoryImage.length > 0) {
      const file = req.files.categoryImage[0];
      imagePath = `/uploads/categories/${file.filename}`;
    }
    
    // Process subcategory images
    let subcategoryImages = {};
    if (req.files && req.files.subcategoryImages && req.files.subcategoryImages.length > 0) {
      
      if (!subcategoryImageMapping) {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'subcategoryImageMapping is required when uploading subcategory images'
        });
      }
      
      try {
        const mapping = typeof subcategoryImageMapping === 'string'
          ? JSON.parse(subcategoryImageMapping)
          : subcategoryImageMapping;
        
        // Validate that all uploaded files have a mapping
        const invalidFiles = req.files.subcategoryImages.filter(file => !mapping[file.originalname]);
        if (invalidFiles.length > 0) {
          cleanupUploadedFiles(req);
          return res.status(400).json({
            success: false,
            message: `No subcategory mapping found for files: ${invalidFiles.map(f => f.originalname).join(', ')}`
          });
        }
        
        // Create mapping of subcategory name to image path
        req.files.subcategoryImages.forEach((file) => {
          const subcategoryName = mapping[file.originalname];
          if (subcategoryName) {
            subcategoryImages[subcategoryName] = `/uploads/subcategories/${file.filename}`;
          }
        });
        
      } catch (error) {
        console.error('Error parsing subcategory image mapping:', error);
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Invalid subcategory image mapping format'
        });
      }
    }
    
    // Parse attributesSchema if provided
    let parsedAttributesSchema = null;
    if (attributesSchema) {
      try {
        parsedAttributesSchema = typeof attributesSchema === 'string'
          ? JSON.parse(attributesSchema)
          : attributesSchema;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attributesSchema JSON format'
        });
      }
    }
    
    // Create category
    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : null,
      parentId: parentId || null,
      subcategories: parsedSubcategories,
      subcategoryImages: subcategoryImages,
      image: imagePath,
      attributesSchema: parsedAttributesSchema,
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
    
  } catch (error) {
    // Cleanup uploaded files on error
    cleanupUploadedFiles(req);
    
    console.error('Create category error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating category'
    });
  }
};

/**
 * @desc    Update category including subcategories and images
 * @route   PUT /api/categories/:id
 * @access  Private (Admin)
 */
export const updateCategory = async (req, res) => {
  try {
    console.log('=== UPDATE CATEGORY REQUEST ===');
    console.log('Category ID:', req.params.id);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      cleanupUploadedFiles(req);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    console.log('Found category:', category.id, category.name);
    
    const updateData = {};
    
    // Update name if provided
    if (req.body.name && req.body.name !== category.name) {
      if (req.body.name.length < 2) {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Category name must be at least 2 characters long'
        });
      }
      
      // Generate new slug if name changed
      const existingSlugs = await Category.findAll({
        where: { id: { [Op.ne]: category.id } },
        attributes: ['slug'],
        raw: true
      }).then(categories => categories.map(c => c.slug));
      
      updateData.name = req.body.name.trim();
      updateData.slug = generateSlug(req.body.name, existingSlugs);
      console.log('Updating name to:', updateData.name);
      console.log('Updating slug to:', updateData.slug);
    }
    
    // Update description if provided
    if (req.body.description !== undefined) {
      updateData.description = req.body.description ? req.body.description.trim() : null;
    }
    
    // Update isActive if provided
    if (req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }
    
    // Update parentId if provided
    if (req.body.parentId !== undefined) {
      // Check if trying to set self as parent
      if (req.body.parentId && parseInt(req.body.parentId) === category.id) {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }
      
      // Check if parent exists
      if (req.body.parentId) {
        const parent = await Category.findByPk(req.body.parentId);
        if (!parent) {
          cleanupUploadedFiles(req);
          return res.status(404).json({
            success: false,
            message: 'Parent category not found'
          });
        }
      }
      
      updateData.parentId = req.body.parentId || null;
    }
    
    // Handle subcategories array
    if (req.body.subcategories) {
      try {
        let parsedSubcategories = typeof req.body.subcategories === 'string'
          ? JSON.parse(req.body.subcategories)
          : req.body.subcategories;
        
        if (!Array.isArray(parsedSubcategories)) {
          cleanupUploadedFiles(req);
          return res.status(400).json({
            success: false,
            message: 'subcategories must be an array'
          });
        }

        // Clean subcategory names
        parsedSubcategories = parsedSubcategories
          .map(s => String(s).trim())
          .filter(s => s.length > 0);
        
        updateData.subcategories = parsedSubcategories;
        console.log('Parsed subcategories:', updateData.subcategories);
        
      } catch (error) {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Invalid subcategories format'
        });
      }
    }
    
    // Handle category image
    if (req.files && req.files.categoryImage && req.files.categoryImage.length > 0) {
      const file = req.files.categoryImage[0];
      console.log('Processing category image:', file.filename);
      
      // Delete old image if exists
      if (category.image) {
        const oldFilename = path.basename(category.image);
        try {
          const oldPath = path.join(__dirname, '..', 'uploads', 'categories', oldFilename);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log('Deleted old category image:', oldFilename);
          }
        } catch (err) {
          console.error('Error deleting old category image:', err);
        }
      }
      
      updateData.image = `/uploads/categories/${file.filename}`;
    }
    
    // ============ FIXED: Handle subcategoryImages as complete JSON object ============
    // First, handle the complete subcategoryImages object if provided
    if (req.body.subcategoryImages) {
      try {
        console.log('Raw subcategoryImages from request:', req.body.subcategoryImages);
        
        let parsedSubcategoryImages;
        
        // Parse if it's a string
        if (typeof req.body.subcategoryImages === 'string') {
          parsedSubcategoryImages = JSON.parse(req.body.subcategoryImages);
        } else {
          parsedSubcategoryImages = req.body.subcategoryImages;
        }
        
        // Ensure it's an object
        if (parsedSubcategoryImages && typeof parsedSubcategoryImages === 'object' && !Array.isArray(parsedSubcategoryImages)) {
          console.log('Parsed subcategoryImages object:', parsedSubcategoryImages);
          
          // Start with the parsed object (this contains existing images we want to keep)
          let mergedSubcategoryImages = { ...parsedSubcategoryImages };
          console.log('Initial merged images from request:', mergedSubcategoryImages);
          
          // We'll handle new file uploads separately below and merge them
          updateData.subcategoryImages = mergedSubcategoryImages;
        }
      } catch (error) {
        console.error('Error parsing subcategoryImages JSON:', error);
        // Don't return error, just log it - we might still have file uploads
      }
    } else {
      // If no subcategoryImages object provided, start with existing ones
      updateData.subcategoryImages = { ...(category.subcategoryImages || {}) };
      console.log('No subcategoryImages in request, keeping existing:', updateData.subcategoryImages);
    }
    
    // ============ Handle new subcategory image file uploads ============
    if (req.files && req.files.subcategoryImages && req.files.subcategoryImages.length > 0) {
      console.log('Processing new subcategory image files:', req.files.subcategoryImages.length);
      
      if (!req.body.subcategoryImageMapping) {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'subcategoryImageMapping is required when uploading subcategory images'
        });
      }
      
      try {
        console.log('Raw mapping:', req.body.subcategoryImageMapping);
        const mapping = typeof req.body.subcategoryImageMapping === 'string'
          ? JSON.parse(req.body.subcategoryImageMapping)
          : req.body.subcategoryImageMapping;
        
        console.log('Parsed mapping:', mapping);
        
        // Validate that all uploaded files have a mapping
        const invalidFiles = req.files.subcategoryImages.filter(file => !mapping[file.originalname]);
        if (invalidFiles.length > 0) {
          cleanupUploadedFiles(req);
          return res.status(400).json({
            success: false,
            message: `No subcategory mapping found for files: ${invalidFiles.map(f => f.originalname).join(', ')}`
          });
        }
        
        // Get the current subcategoryImages from updateData (which already has existing images)
        let currentSubcategoryImages = updateData.subcategoryImages || {};
        
        // Process each new file
        req.files.subcategoryImages.forEach((file) => {
          const subcategoryName = mapping[file.originalname];
          console.log(`File: ${file.originalname} -> Subcategory: ${subcategoryName}`);
          
          if (subcategoryName) {
            // Delete old image file if exists (from either existing or previously kept)
            if (currentSubcategoryImages[subcategoryName]) {
              const oldImagePath = currentSubcategoryImages[subcategoryName];
              // Only try to delete if it's a path (not a data URL)
              if (typeof oldImagePath === 'string' && !oldImagePath.startsWith('data:')) {
                const oldFilename = path.basename(oldImagePath);
                try {
                  const oldPath = path.join(__dirname, '..', 'uploads', 'subcategories', oldFilename);
                  if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                    console.log('Deleted old subcategory image:', oldFilename);
                  }
                } catch (err) {
                  console.error('Error deleting old subcategory image:', err);
                }
              }
            }
            
            // Add/update with new image path
            currentSubcategoryImages[subcategoryName] = `/uploads/subcategories/${file.filename}`;
          }
        });
        
        console.log('Updated subcategory images after processing files:', currentSubcategoryImages);
        updateData.subcategoryImages = currentSubcategoryImages;
        
      } catch (error) {
        console.error('Error parsing mapping:', error);
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Invalid subcategory image mapping'
        });
      }
    }
    
    // ============ Clean up orphaned subcategory images ============
    // Only run this if we're updating subcategories array
    if (updateData.subcategories) {
      const subcategoriesSet = new Set(updateData.subcategories);
      const currentSubcategoryImages = updateData.subcategoryImages || {};
      
      // Find images for subcategories that no longer exist
      Object.keys(currentSubcategoryImages).forEach(key => {
        if (!subcategoriesSet.has(key)) {
          // Delete the image file
          const imagePath = currentSubcategoryImages[key];
          if (imagePath && typeof imagePath === 'string' && !imagePath.startsWith('data:')) {
            const filename = path.basename(imagePath);
            try {
              const filePath = path.join(__dirname, '..', 'uploads', 'subcategories', filename);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('Deleted orphaned subcategory image:', filename);
              }
            } catch (err) {
              console.error('Error deleting orphaned subcategory image:', err);
            }
          }
          
          // Remove from the object
          delete currentSubcategoryImages[key];
        }
      });
      
      updateData.subcategoryImages = currentSubcategoryImages;
      console.log('After cleanup, subcategory images:', updateData.subcategoryImages);
    }
    
    // Handle attributesSchema if provided
    if (req.body.attributesSchema) {
      try {
        updateData.attributesSchema = typeof req.body.attributesSchema === 'string'
          ? JSON.parse(req.body.attributesSchema)
          : req.body.attributesSchema;
      } catch (error) {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Invalid attributesSchema format'
        });
      }
    }
    
    console.log('Final updateData:', {
      ...updateData,
      subcategoryImages: updateData.subcategoryImages ? '[Object]' : null
    });
    
    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Update the category
    await category.update(updateData);
    console.log('Category updated successfully');
    
    // Fetch the updated category
    const updatedCategory = await Category.findByPk(category.id);
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
    
  } catch (error) {
    // Cleanup uploaded files on error
    cleanupUploadedFiles(req);
    
    console.error('=== UPDATE CATEGORY ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating category'
    });
  }
};

/**
 * Helper function to cleanup uploaded files on error
 */
const cleanupUploadedFiles = (req) => {
  if (req.files) {
    // Delete category image
    if (req.files.categoryImage) {
      req.files.categoryImage.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log('Cleaned up category image:', file.filename);
          }
        } catch (err) {
          console.error('Error cleaning up category image:', err);
        }
      });
    }
    
    // Delete subcategory images
    if (req.files.subcategoryImages) {
      req.files.subcategoryImages.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log('Cleaned up subcategory image:', file.filename);
          }
        } catch (err) {
          console.error('Error cleaning up subcategory image:', err);
        }
      });
    }
  }
};

// Don't forget to import Op at the top
import { Op } from 'sequelize';
// controllers/categoryController.js
export const getCategories = async (req, res) => {
  try {
    const whereClause = req.query.includeInactive === 'true' ? {} : { isActive: true };
    
    const categories = await Category.findAll({ 
      where: whereClause,
      order: [['name', 'ASC']],
      attributes: {
        exclude: [] // Include all fields
      }
    });
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
};

/**
 * @desc    Get single category with products by subcategory
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug', 'image']
        },
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
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Get products grouped by subcategory if category has subcategories
    let productsBySubcategory = {};
    if (category.subcategories && category.subcategories.length > 0) {
      for (const subcategory of category.subcategories) {
        const products = await Product.findAll({
          where: { 
            categoryId: category.id,
            subcategory: subcategory,
            isActive: true 
          },
          attributes: ['id', 'name', 'slug', 'price', 'images', 'subcategory'],
          limit: 5
        });
        if (products.length > 0) {
          productsBySubcategory[subcategory] = products;
        }
      }
    }
    
    const categoryData = {
      ...category.toJSON(),
      productsBySubcategory
    };
    
    res.status(200).json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category'
    });
  }
};

// controllers/categoryController.js - Updated createCategory

// controllers/categoryController.js - Update the file handling


/**
 * @desc    Delete category (soft delete by default)
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin)
 */
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category has products
    const productCount = await Product.count({
      where: { categoryId: category.id }
    });
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products. Deactivate it instead.'
      });
    }
    
    // Check if category has subcategories (legacy parent-child)
    const subcategoryCount = await Category.count({
      where: { parentId: category.id }
    });
    
    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing subcategories. Deactivate it instead.'
      });
    }
    
    // Soft delete (deactivate) - DEFAULT BEHAVIOR
    // Only hard delete if explicitly requested AND no constraints
    if (req.query.hardDelete === 'true') {
      // Delete category image if exists
      if (category.image) {
        const filename = path.basename(category.image);
        try {
          await deleteImage(filename);
          console.log('✅ Deleted category image:', filename);
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }
      
      // Hard delete from database
      await category.destroy();
    } else {
      // Soft delete - just deactivate
      await category.update({ isActive: false });
    }
    
    res.status(200).json({
      success: true,
      message: category.isActive === false 
        ? 'Category deactivated successfully' 
        : `Category ${req.query.hardDelete === 'true' ? 'deleted permanently' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting category'
    });
  }
};

/**
 * @desc    Update category status (activate/deactivate)
 * @route   PATCH /api/categories/:id/status
 * @access  Private (Admin)
 */
export const updateCategoryStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    await category.update({ isActive });
    
    res.status(200).json({
      success: true,
      message: `Category ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    console.error('Update category status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating category status'
    });
  }
};