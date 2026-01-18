// controllers/modelController.js
import { Model, Brand, Category } from '../models/index.js';

export const createModel = async (req, res) => {
  try {
    const { modelCode, name, brandId, categoryId, description, baseAttributes, specifications } = req.body;
    
    const brand = await Brand.findByPk(brandId);
    const category = await Category.findByPk(categoryId);
    
    if (!brand || !category) {
      return res.status(404).json({
        success: false,
        message: 'Brand or Category not found'
      });
    }
    
    // Generate slug
    const slug = `${brand.name.toLowerCase()}-${modelCode.toLowerCase()}`;
    
    const model = await Model.create({
      modelCode,
      name,
      slug,
      brandId,
      categoryId,
      description,
      baseAttributes: baseAttributes ? JSON.parse(baseAttributes) : {},
      specifications: specifications ? JSON.parse(specifications) : {}
    });
    
    res.status(201).json({
      success: true,
      message: 'Model created successfully',
      data: model
    });
  } catch (error) {
    console.error('Create model error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating model'
    });
  }
};

export const getModelsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    
    const models = await Model.findAll({
      where: { brandId, isActive: true },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ],
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching models'
    });
  }
};