// models/Product.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code:{
    type: DataTypes.STRING(200),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  variant: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Color variant name (e.g., Midnight Black, Ocean Blue)'
  },
  slug: {
    type: DataTypes.STRING(250),
    unique: true,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  brandId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'brands',
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  subcategory: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Subcategory name like "TV", "Washing Machine", "Refrigerator"'
  },
  modelCode: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Model code used to identify the product model'
  },
  modelName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Human readable model name'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  discountPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  tax: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0
  },
  stock: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Stock per color: { "Red": 10, "Blue": 5, "Black": 15 }'
  },
  sku: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  availability: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  color: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Primary color information (for backward compatibility)'
  },
  colorsAndImages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Structure: { "Red": [{url, publicId, type, alt}], "Blue": [...], "Black": [...] }',
    validate: {
      isValidColorsAndImages(value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.entries(value).forEach(([colorName, images]) => {
            if (!Array.isArray(images)) {
              throw new Error(`Images for color "${colorName}" must be an array`);
            }
            if (images.length === 0) {
              throw new Error(`At least one image required for color "${colorName}"`);
            }
            images.forEach((img, index) => {
              if (!img.url || typeof img.url !== 'string') {
                throw new Error(`Image ${index + 1} for color "${colorName}" must have a URL`);
              }
              if (!img.type || !['main', 'thumbnail', 'gallery', 'swatch'].includes(img.type)) {
                throw new Error(`Image ${index + 1} for color "${colorName}" must have valid type`);
              }
            });
            // Ensure at least one main image per color
            const mainImages = images.filter(img => img.type === 'main');
            if (mainImages.length === 0) {
              throw new Error(`At least one main image required for color "${colorName}"`);
            }
          });
        }
      }
    }
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Legacy field - use colorsAndImages instead'
  },
  attributes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Product-specific attributes overriding model attributes'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  metaTitle: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  metaDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  keywords: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'products',
  indexes: [
    {
      unique: true,
      fields: ['code'],
      name: 'idx_code'
    },
    {
      unique: true,
      fields: ['sku'],
      name: 'idx_sku'
    },
    {
      fields: ['subcategory'],
      name: 'idx_subcategory'
    }
  ],
  hooks: {
    beforeValidate: (product) => {
      // Calculate discount percentage if discount price is provided
      if (product.discountPrice && product.price) {
        const discount = ((product.price - product.discountPrice) / product.price) * 100;
        product.discountPercentage = parseFloat(discount.toFixed(2));
      }
      
      // Set availability based on stock (handle JSON stock structure)
      if (product.stock !== undefined) {
        let totalStock = 0;
        if (typeof product.stock === 'number') {
          totalStock = product.stock;
        } else if (typeof product.stock === 'object' && product.stock !== null && !Array.isArray(product.stock)) {
          totalStock = Object.values(product.stock).reduce((sum, val) => {
            return sum + (typeof val === 'number' ? val : parseInt(val) || 0);
          }, 0);
        }
        product.availability = totalStock > 0;
      }
    },
    beforeCreate: async (product) => {
      // Validate subcategory against category's allowed subcategories
      if (product.subcategory && product.categoryId) {
        const category = await sequelize.models.Category.findByPk(product.categoryId);
        if (category && category.subcategories) {
          if (!category.subcategories.includes(product.subcategory)) {
            throw new Error(`Invalid subcategory "${product.subcategory}" for category "${category.name}". Allowed: ${category.subcategories.join(', ')}`);
          }
        }
      }
    },
    beforeUpdate: async (product) => {
      // Validate subcategory against category's allowed subcategories on update
      if (product.subcategory && product.categoryId) {
        const category = await sequelize.models.Category.findByPk(product.categoryId);
        if (category && category.subcategories) {
          if (!category.subcategories.includes(product.subcategory)) {
            throw new Error(`Invalid subcategory "${product.subcategory}" for category "${category.name}". Allowed: ${category.subcategories.join(', ')}`);
          }
        }
      }
    }
  }
});

export default Product;