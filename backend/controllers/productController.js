// controllers/productController.js
import { Product, Category, Brand, Review, User, Model, sequelize, Sequelize } from '../models/index.js';
import { generateProductSlug } from '../utils/slugGenerator.js';
import { deleteImages } from '../middleware/upload.js';

/**
 * @desc    Get all products with filters including subcategory
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      categoryId,
      categorySlug,
      subcategory, // Changed from subcategoryId to subcategory (string)
      brandId,
      minPrice,
      maxPrice,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      availability,
      isFeatured
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = { isActive: true };

    // Allow filtering by category by id or slug
    if (categoryId) where.categoryId = categoryId;
    if (categorySlug) {
      const cat = await Category.findOne({ where: { slug: categorySlug, isActive: true } });
      if (cat) where.categoryId = cat.id;
    }
    if (subcategory) where.subcategory = subcategory; // Changed to string filter
    if (brandId) where.brandId = brandId;
    if (availability !== undefined) where.availability = availability === 'true';
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Sequelize.Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Sequelize.Op.lte] = parseFloat(maxPrice);
    }

    // Compute global price range
    const priceRangeResult = await Product.findOne({
      where,
      attributes: [
        [Sequelize.fn('MIN', Sequelize.col('price')), 'minPrice'],
        [Sequelize.fn('MAX', Sequelize.col('price')), 'maxPrice']
      ],
      raw: true
    });
    const computedMinPrice = priceRangeResult ? parseFloat(priceRangeResult.minPrice || 0) : 0;
    const computedMaxPrice = priceRangeResult ? parseFloat(priceRangeResult.maxPrice || 0) : 0;

    if (search) {
      const searchLower = search.toLowerCase().trim();

      // Keyword mapping for better results
      const keywordMap = {
        'tv': ['tv', 'television', 'smart tv', 'led'],
        'fridge': ['fridge', 'refrigerator', 'freezer'],
        'ac': ['ac', 'air conditioner', 'cooling'],
        'washing': ['washing machine', 'washer', 'laundry'],
        'mobile': ['mobile', 'phone', 'smartphone'],
        'laptop': ['laptop', 'notebook', 'computer']
      };

      // Check if search term matches any keyword key
      let searchTerms = [searchLower];
      Object.keys(keywordMap).forEach(key => {
        if (searchLower.includes(key) || key.includes(searchLower)) {
          searchTerms = [...searchTerms, ...keywordMap[key]];
        }
      });

      // Remove duplicates
      searchTerms = [...new Set(searchTerms)];

      // Build complex OR query
      where[Sequelize.Op.or] = [
        { name: { [Sequelize.Op.like]: `%${search}%` } },
        { code: { [Sequelize.Op.like]: `%${search}%` } },
        { description: { [Sequelize.Op.like]: `%${search}%` } },
        { sku: { [Sequelize.Op.like]: `%${search}%` } },
        { variant: { [Sequelize.Op.like]: `%${search}%` } },
        { subcategory: { [Sequelize.Op.like]: `%${search}%` } },
        // Search in keywords JSON array if supported by DB (MySQL JSON) or string
        Sequelize.literal(`JSON_SEARCH(keywords, 'one', '%${search}%') IS NOT NULL`),
        // Search in related Category name
        Sequelize.literal(`EXISTS (SELECT 1 FROM categories WHERE categories.id = Product.categoryId AND categories.name LIKE '%${search}%')`),
        // Search in related Brand name
        Sequelize.literal(`EXISTS (SELECT 1 FROM brands WHERE brands.id = Product.brandId AND brands.name LIKE '%${search}%')`)
      ];

      // Add mapped keywords to search if any
      if (searchTerms.length > 1) {
        // This is a simplified approach. For full keyword expansion, we might strictly OR them all.
        // But merging them into the existing OR array is cleaner.
        // Let's iterate and add simple name matches for mapped terms
        searchTerms.forEach(term => {
          if (term !== searchLower) {
            where[Sequelize.Op.or].push({ name: { [Sequelize.Op.like]: `%${term}%` } });
            where[Sequelize.Op.or].push({ description: { [Sequelize.Op.like]: `%${term}%` } });
            where[Sequelize.Op.or].push({ subcategory: { [Sequelize.Op.like]: `%${term}%` } });
          }
        });
      }
    }

    // Validate sort field
    const allowedSortFields = [
      'name', 'price', 'rating', 'created_at', 'updatedAt',
      'discountPercentage', 'stock'
    ];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase())
      ? sortOrder.toLowerCase()
      : 'desc';

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[validSortBy, validSortOrder]],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'subcategories'],
          required: false // Left join to ensuring we don't filter out if not matched, but we are filtering in WHERE so this might need adjustment if using top level OR
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'slug']
        }
      ],
      // Add distinct to prevent duplicates from joins if using hasMany (not the case here usually but good practice)
      distinct: true
    });

    // Get unique subcategories for the filtered products
    const uniqueSubcategories = await Product.findAll({
      where,
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('subcategory')), 'subcategory']],
      raw: true
    }).then(results => results.filter(r => r.subcategory).map(r => r.subcategory));

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        filters: {
          categoryId,
          categorySlug,
          subcategory, // Changed
          brandId,
          minPrice,
          maxPrice,
          search,
          availability,
          isFeatured,
          computedMinPrice,
          computedMaxPrice,
          availableSubcategories: uniqueSubcategories
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};
// Add these functions right after your getProducts function

export const getProduct = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Check if identifier is numeric ID or slug
    const where = { isActive: true };
    const isNumeric = !isNaN(identifier);

    if (isNumeric) {
      where.id = parseInt(identifier);
    } else {
      where.slug = identifier;
    }

    const product = await Product.findOne({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'subcategories']
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Clean up description if it contains error messages
    let cleanDescription = product.description;
    if (cleanDescription) {
      // Check if description contains error messages
      if (cleanDescription.includes('{"success":false')) {
        try {
          // Try to parse as JSON
          const jsonStart = cleanDescription.indexOf('{');
          if (jsonStart !== -1) {
            // Extract just the description part if it's mixed
            const possibleJson = cleanDescription.substring(jsonStart);
            const parsed = JSON.parse(possibleJson);
            if (parsed.success === false) {
              // If it's an error JSON, clear the description
              cleanDescription = null;
            }
          }
        } catch (error) {
          // If parsing fails, keep as is but log
          console.log('Could not parse description as JSON:', error.message);
        }
      }
    }

    // Get related reviews
    const reviews = await Review.findAll({
      where: { productId: product.id, isActive: true },
      attributes: ['id', 'rating', 'comment', 'helpfulCount', 'created_at'],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name']
      }],
      order: [['created_at', 'DESC']],
      limit: 20
    });

    // Get related products (same category and brand)
    const relatedProducts = await Product.findAll({
      where: {
        categoryId: product.categoryId,
        brandId: product.brandId,
        id: { [Sequelize.Op.ne]: product.id },
        isActive: true,
        availability: true
      },
      limit: 4,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    // Prepare product data with cleaned description
    const productData = {
      ...product.toJSON(),
      description: cleanDescription,
      reviews,
      // Use the model's stored rating and totalReviews
      rating: product.rating || 0,
      totalReviews: product.totalReviews || 0,
      relatedProducts
    };

    res.status(200).json({
      success: true,
      data: productData
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
};

/**
 * @desc    Get products by category slug
 * @route   GET /api/products/category/:categorySlug
 * @access  Public
 */
export const getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const {
      page = 1,
      limit = 20,
      subcategory,
      brandId,
      minPrice,
      maxPrice,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      availability
    } = req.query;

    const offset = (page - 1) * limit;

    // Find category by slug
    const category = await Category.findOne({
      where: { slug: categorySlug, isActive: true }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Build where clause
    const where = {
      categoryId: category.id,
      isActive: true
    };

    if (subcategory) where.subcategory = subcategory;
    if (brandId) where.brandId = brandId;
    if (availability !== undefined) where.availability = availability === 'true';

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Sequelize.Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Sequelize.Op.lte] = parseFloat(maxPrice);
    }

    if (search) {
      const searchLower = search.toLowerCase().trim();

      // Keyword mapping for better results
      const keywordMap = {
        'tv': ['tv', 'television', 'smart tv', 'led'],
        'fridge': ['fridge', 'refrigerator', 'freezer'],
        'ac': ['ac', 'air conditioner', 'cooling'],
        'washing': ['washing machine', 'washer', 'laundry'],
        'mobile': ['mobile', 'phone', 'smartphone'],
        'laptop': ['laptop', 'notebook', 'computer']
      };

      // Check if search term matches any keyword key
      let searchTerms = [searchLower];
      Object.keys(keywordMap).forEach(key => {
        if (searchLower.includes(key) || key.includes(searchLower)) {
          searchTerms = [...searchTerms, ...keywordMap[key]];
        }
      });

      // Remove duplicates
      searchTerms = [...new Set(searchTerms)];

      where[Sequelize.Op.or] = [
        { name: { [Sequelize.Op.like]: `%${search}%` } },
        { code: { [Sequelize.Op.like]: `%${search}%` } },
        { description: { [Sequelize.Op.like]: `%${search}%` } },
        { sku: { [Sequelize.Op.like]: `%${search}%` } },
        { variant: { [Sequelize.Op.like]: `%${search}%` } },
        // Search in keywords JSON array
        Sequelize.literal(`JSON_SEARCH(keywords, 'one', '%${search}%') IS NOT NULL`),
        // Search in related Brand name (category is already filtered)
        Sequelize.literal(`EXISTS (SELECT 1 FROM brands WHERE brands.id = Product.brandId AND brands.name LIKE '%${search}%')`)
      ];

      // Add mapped keywords to search if any
      if (searchTerms.length > 1) {
        searchTerms.forEach(term => {
          if (term !== searchLower) {
            where[Sequelize.Op.or].push({ name: { [Sequelize.Op.like]: `%${term}%` } });
            where[Sequelize.Op.or].push({ description: { [Sequelize.Op.like]: `%${term}%` } });
          }
        });
      }
    }

    // Validate sort field
    const allowedSortFields = [
      'name', 'price', 'rating', 'created_at', 'updatedAt',
      'discountPercentage', 'stock'
    ];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase())
      ? sortOrder.toLowerCase()
      : 'desc';

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[validSortBy, validSortOrder]],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'subcategories']
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    // Get unique subcategories for this category
    const uniqueSubcategories = await Product.findAll({
      where: { categoryId: category.id, isActive: true },
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('subcategory')), 'subcategory']],
      raw: true
    }).then(results => results.filter(r => r.subcategory).map(r => r.subcategory));

    // Get brands in this category
    const categoryBrands = await Brand.findAll({
      include: [{
        model: Product,
        as: 'products',
        where: { categoryId: category.id, isActive: true },
        attributes: []
      }],
      attributes: ['id', 'name', 'slug']
    });

    // Compute price range for this category
    const priceRangeResult = await Product.findOne({
      where: { categoryId: category.id, isActive: true },
      attributes: [
        [Sequelize.fn('MIN', Sequelize.col('price')), 'minPrice'],
        [Sequelize.fn('MAX', Sequelize.col('price')), 'maxPrice']
      ],
      raw: true
    });
    const computedMinPrice = priceRangeResult ? parseFloat(priceRangeResult.minPrice || 0) : 0;
    const computedMaxPrice = priceRangeResult ? parseFloat(priceRangeResult.maxPrice || 0) : 0;

    res.status(200).json({
      success: true,
      data: {
        category,
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        filters: {
          subcategory,
          brandId,
          minPrice,
          maxPrice,
          search,
          availability,
          computedMinPrice,
          computedMaxPrice,
          availableSubcategories: uniqueSubcategories,
          availableBrands: categoryBrands
        }
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category products'
    });
  }
};
/**
 * @desc    Create new product with subcategory string validation
 * @route   POST /api/products
 * @access  Private (Admin/Seller)
 */
export const createProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    let {
      code,
      name,
      variant,
      description,
      brandId,
      categoryId,
      subcategory, // Changed from subcategoryId to subcategory
      modelId,
      price,
      discountPrice,
      tax,
      stock,
      sku,
      colorsAndImages,
      attributes,
      isFeatured,
      metaTitle,
      metaDescription,
      keywords,
      sellerId
    } = req.body;

    console.log('Creating product with data:', {
      code, name, brandId, categoryId, subcategory, price,
      uploadedFilesCount: req.uploadedFiles?.length || 0,
      hasColorsAndImages: !!colorsAndImages,
      sellerId
    });

    // Validate required fields
    if (!code || !name || !brandId || !categoryId || !price || (!modelId && !(req.body.modelCode && req.body.modelName))) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Code, name, brandId, categoryId, price and model (id or modelCode+modelName) are required'
      });
    }

    // Validate subcategory against category's allowed subcategories
    if (subcategory && categoryId) {
      const category = await Category.findByPk(categoryId, { transaction });
      if (category && category.subcategories && category.subcategories.length > 0) {
        if (!category.subcategories.includes(subcategory)) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Invalid subcategory "${subcategory}" for category "${category.name}". Allowed: ${category.subcategories.join(', ')}`
          });
        }
      }
    }

    // Validate colorsAndImages or uploadedFiles
    const hasColorsAndImages = colorsAndImages &&
      (typeof colorsAndImages === 'string' ? colorsAndImages.trim() : JSON.stringify(colorsAndImages)) !== '{}';
    const hasUploadedFiles = req.uploadedFiles && req.uploadedFiles.length > 0;

    if (!hasColorsAndImages && !hasUploadedFiles) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'colorsAndImages or image files are required'
      });
    }

    // Parse colorsAndImages if provided
    let parsedColorsAndImages = {};
    if (hasColorsAndImages) {
      try {
        parsedColorsAndImages = typeof colorsAndImages === 'string'
          ? JSON.parse(colorsAndImages)
          : colorsAndImages;

        // Validate it's a non-empty object
        if (!parsedColorsAndImages || typeof parsedColorsAndImages !== 'object' ||
          Object.keys(parsedColorsAndImages).length === 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'colorsAndImages must be a non-empty object'
          });
        }
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid colorsAndImages JSON format'
        });
      }
    }

    // Get brand, category
    const [brand, category] = await Promise.all([
      Brand.findByPk(brandId, { transaction }),
      Category.findByPk(categoryId, { transaction })
    ]);

    if (!brand || !category) {
      await transaction.rollback();
      const missing = [];
      if (!brand) missing.push('brand');
      if (!category) missing.push('category');
      return res.status(404).json({
        success: false,
        message: `${missing.join(', ')} not found`
      });
    }

    // Resolve model info
    let modelCode;
    let modelName;
    if (modelId) {
      const model = await Model.findByPk(modelId, { transaction });
      if (!model) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Model not found' });
      }
      modelCode = String(model.modelCode || model.modelCode);
      modelName = String(model.name || model.modelName || '');
    } else if (req.body.modelCode && req.body.modelName) {
      modelCode = String(req.body.modelCode);
      modelName = String(req.body.modelName);
    } else {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'modelId or modelCode+modelName is required' });
    }

    // Generate unique slug
    const baseSlug = generateProductSlug(name, brand.name, variant);
    const existingSlugs = await Product.findAll({
      attributes: ['slug'],
      raw: true,
      transaction
    }).then(products => products.map(p => p.slug));

    let slug = baseSlug;
    let counter = 1;

    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Process uploaded files and merge with colorsAndImages
    let finalColorsAndImages = { ...parsedColorsAndImages };

    if (hasUploadedFiles) {
      console.log('Processing uploaded files:', req.uploadedFiles.length);

      // Handle fileColorMapping if provided
      if (req.body.fileColorMapping) {
        let fileColorMapping;
        try {
          fileColorMapping = typeof req.body.fileColorMapping === 'string'
            ? JSON.parse(req.body.fileColorMapping)
            : req.body.fileColorMapping;
          console.log('File color mapping:', fileColorMapping);
        } catch (error) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Invalid fileColorMapping JSON format'
          });
        }

        // Use for...of instead of forEach for proper error handling
        for (const [colorName, fileIndices] of Object.entries(fileColorMapping)) {
          if (!Array.isArray(fileIndices)) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: `fileIndices for color "${colorName}" must be an array`
            });
          }

          if (!finalColorsAndImages[colorName]) {
            finalColorsAndImages[colorName] = [];
          }

          // Process each file index
          for (let i = 0; i < fileIndices.length; i++) {
            const fileIndex = fileIndices[i];
            if (fileIndex >= 0 && fileIndex < req.uploadedFiles.length) {
              const file = req.uploadedFiles[fileIndex];
              console.log(`Adding file ${fileIndex} to color "${colorName}":`, file.url);

              finalColorsAndImages[colorName].push({
                url: file.url,
                publicId: file.publicId,
                type: i === 0 ? 'main' : 'gallery',
                alt: file.originalName || `${colorName} image ${i + 1}`
              });
            }
          }
        }
      } else if (req.body.colorName) {
        // Single color specified - add all files to that color
        const colorName = req.body.colorName;
        console.log(`Adding all files to color: "${colorName}"`);

        if (!finalColorsAndImages[colorName]) {
          finalColorsAndImages[colorName] = [];
        }

        req.uploadedFiles.forEach((file, index) => {
          console.log(`Adding file to ${colorName}:`, file.url);

          finalColorsAndImages[colorName].push({
            url: file.url,
            publicId: file.publicId,
            type: index === 0 ? 'main' : 'gallery',
            alt: file.originalName || `${colorName} image ${index + 1}`
          });
        });
      } else {
        // Default: Add all uploaded files to a default color
        const defaultColor = req.body.defaultColor || 'Default';
        console.log(`Adding all files to default color: "${defaultColor}"`);

        if (!finalColorsAndImages[defaultColor]) {
          finalColorsAndImages[defaultColor] = [];
        }

        req.uploadedFiles.forEach((file, index) => {
          console.log(`Adding file to ${defaultColor}:`, file.url);

          finalColorsAndImages[defaultColor].push({
            url: file.url,
            publicId: file.publicId,
            type: index === 0 ? 'main' : 'gallery',
            alt: file.originalName || `${defaultColor} image ${index + 1}`
          });
        });
      }
    }

    // Validate finalColorsAndImages has at least one color with images
    if (Object.keys(finalColorsAndImages).length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'At least one color with images is required'
      });
    }

    // Validate each color has at least one image
    for (const [colorName, images] of Object.entries(finalColorsAndImages)) {
      if (!Array.isArray(images) || images.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Color "${colorName}" must have at least one image`
        });
      }

      // Ensure each color has exactly one main image
      const mainImages = images.filter(img => img.type === 'main');
      if (mainImages.length !== 1) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Color "${colorName}" must have exactly one main image`
        });
      }

      // Log image URLs for debugging
      console.log(`Color "${colorName}" has ${images.length} images:`);
      images.forEach((img, idx) => {
        console.log(`  ${idx + 1}. ${img.url} (${img.type})`);
      });
    }

    // Parse stock - should match colors in colorsAndImages
    let parsedStock = {};
    const colorNames = Object.keys(finalColorsAndImages);

    if (stock) {
      if (typeof stock === 'string') {
        try {
          parsedStock = JSON.parse(stock);

          // Validate parsed stock matches color structure
          if (typeof parsedStock !== 'object' || parsedStock === null) {
            throw new Error('Invalid stock format');
          }
        } catch (error) {
          // If not valid JSON or not an object, treat as single number
          const stockValue = parseInt(stock) || 0;
          colorNames.forEach(colorName => {
            parsedStock[colorName] = stockValue;
          });
        }
      } else if (typeof stock === 'object' && stock !== null) {
        parsedStock = stock;
      } else {
        // Single number - distribute to all colors
        const stockValue = parseInt(stock) || 0;
        colorNames.forEach(colorName => {
          parsedStock[colorName] = stockValue;
        });
      }
    }

    // Ensure stock exists for all colors with default value 0
    colorNames.forEach(colorName => {
      if (parsedStock[colorName] === undefined || isNaN(parsedStock[colorName])) {
        parsedStock[colorName] = 0;
      }
    });

    // Parse other fields
    const parsedPrice = parseFloat(price);
    const parsedDiscountPrice = discountPrice ? parseFloat(discountPrice) : null;
    const parsedTax = tax ? parseFloat(tax) : 0;

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid positive number'
      });
    }

    if (parsedDiscountPrice !== null && (isNaN(parsedDiscountPrice) || parsedDiscountPrice < 0)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Discount price must be a valid positive number'
      });
    }

    // Parse attributes and keywords
    let parsedAttributes = {};
    let parsedKeywords = [];

    try {
      parsedAttributes = attributes ?
        (typeof attributes === 'string' ? JSON.parse(attributes) : attributes) :
        {};
    } catch (error) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid attributes JSON format'
      });
    }

    try {
      parsedKeywords = keywords ?
        (typeof keywords === 'string' ? JSON.parse(keywords) : keywords) :
        [];
    } catch (error) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid keywords JSON format'
      });
    }

    // Determine if featured
    const isProductFeatured = isFeatured === true || isFeatured === 'true' || isFeatured === '1';

    // Handle sellerId
    const sellerIdValue = sellerId || req.user?.id || null;
    console.log('Using sellerId:', sellerIdValue);

    // Create product with subcategory string
    const product = await Product.create({
      code,
      name,
      variant: variant || null,
      slug,
      description: description || null,
      brandId,
      categoryId,
      subcategory: subcategory || null, // Changed
      modelCode,
      modelName,
      price: parsedPrice,
      discountPrice: parsedDiscountPrice,
      tax: parsedTax,
      stock: parsedStock,
      sku: sku || `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      colorsAndImages: finalColorsAndImages,
      attributes: parsedAttributes,
      sellerId: sellerIdValue,
      isFeatured: isProductFeatured,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      keywords: parsedKeywords
    }, { transaction });

    await transaction.commit();

    console.log('Product created successfully:', {
      id: product.id,
      name: product.name,
      subcategory: product.subcategory,
      colorsCount: Object.keys(finalColorsAndImages).length,
      imagesCount: Object.values(finalColorsAndImages).flat().length
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    // Ensure transaction is rolled back
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error('Create product error:', error);

    // Handle specific errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'unknown';
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Other product controller functions remain similar but with subcategory string instead of subcategoryId
// Update other functions similarly as needed...

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private (Admin/Seller)
 */
export const updateProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const product = await Product.findByPk(req.params.id, { transaction });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership (admin or seller)
    if (req.user.role !== 'admin' && product.sellerId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const updateData = { ...req.body };

    // Support updating model via modelId (legacy) or direct modelCode/modelName
    if (updateData.modelId) {
      // Resolve model to its code/name
      const model = await Model.findByPk(updateData.modelId, { transaction });
      if (!model) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Model not found' });
      }
      updateData.modelCode = model.modelCode || model.modelCode;
      updateData.modelName = model.name || model.modelName || '';
      delete updateData.modelId;
    }

    // Handle colorsAndImages update
    if (updateData.colorsAndImages) {
      try {
        updateData.colorsAndImages = typeof updateData.colorsAndImages === 'string'
          ? JSON.parse(updateData.colorsAndImages)
          : updateData.colorsAndImages;
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid colorsAndImages JSON format'
        });
      }
    }

    // Handle uploaded files for colorsAndImages
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      let finalColorsAndImages = updateData.colorsAndImages || product.colorsAndImages || {};

      if (req.body.fileColorMapping) {
        // Map files to specific colors
        let fileColorMapping;
        try {
          fileColorMapping = typeof req.body.fileColorMapping === 'string'
            ? JSON.parse(req.body.fileColorMapping)
            : req.body.fileColorMapping;
        } catch (error) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Invalid fileColorMapping JSON format'
          });
        }

        Object.entries(fileColorMapping).forEach(([colorName, fileIndices]) => {
          if (!finalColorsAndImages[colorName]) {
            finalColorsAndImages[colorName] = [];
          }

          fileIndices.forEach((fileIndex, imgIndex) => {
            if (req.uploadedFiles[fileIndex]) {
              finalColorsAndImages[colorName].push({
                url: req.uploadedFiles[fileIndex].url,
                publicId: req.uploadedFiles[fileIndex].publicId,
                type: imgIndex === 0 ? 'main' : 'gallery',
                alt: req.uploadedFiles[fileIndex].originalName || `${colorName} image ${imgIndex + 1}`
              });
            }
          });
        });
      } else if (req.body.colorName) {
        // Add all files to specified color
        const colorName = req.body.colorName;
        if (!finalColorsAndImages[colorName]) {
          finalColorsAndImages[colorName] = [];
        }
        req.uploadedFiles.forEach((file, index) => {
          finalColorsAndImages[colorName].push({
            url: file.url,
            publicId: file.publicId,
            type: index === 0 ? 'main' : 'gallery',
            alt: file.originalName || `${colorName} image ${index + 1}`
          });
        });
      }

      updateData.colorsAndImages = finalColorsAndImages;
    }

    // Handle stock update (should match colors)
    if (updateData.stock) {
      try {
        updateData.stock = typeof updateData.stock === 'string'
          ? JSON.parse(updateData.stock)
          : updateData.stock;
      } catch (error) {
        // If not JSON, keep as is
      }
    }

    // Parse JSON fields
    if (updateData.attributes) {
      try {
        updateData.attributes = typeof updateData.attributes === 'string'
          ? JSON.parse(updateData.attributes)
          : updateData.attributes;
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid attributes JSON format'
        });
      }
    }

    if (updateData.keywords) {
      try {
        updateData.keywords = typeof updateData.keywords === 'string'
          ? JSON.parse(updateData.keywords)
          : updateData.keywords;
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid keywords JSON format'
        });
      }
    }

    // Update product
    await product.update(updateData, { transaction });

    await transaction.commit();

    const updatedProduct = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update product error:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin/Seller)
 */
export const deleteProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const product = await Product.findByPk(req.params.id, { transaction });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership (admin or seller)
    if (req.user.role !== 'admin' && product.sellerId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    // Delete images from Cloudinary
    if (product.colorsAndImages && typeof product.colorsAndImages === 'object') {
      const publicIds = [];

      Object.values(product.colorsAndImages).forEach(images => {
        if (Array.isArray(images)) {
          images.forEach(img => {
            if (img.publicId) {
              publicIds.push(img.publicId);
            }
          });
        }
      });

      if (publicIds.length > 0) {
        console.log('Deleting images from Cloudinary:', publicIds);
        await deleteImages(publicIds);
      }
    }

    // Soft delete or hard delete
    if (req.query.hardDelete === 'true') {
      await product.destroy({ transaction });
    } else {
      await product.update({ isActive: false }, { transaction });
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `Product ${req.query.hardDelete === 'true' ? 'deleted' : 'deactivated'} successfully`
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
};

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        isFeatured: true,
        isActive: true,
        availability: true
      },
      limit: 20,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured products'
    });
  }
};

/**
 * @desc    Get related products
 * @route   GET /api/products/:id/related
 * @access  Public
 */
export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const relatedProducts = await Product.findAll({
      where: {
        categoryId: product.categoryId,
        brandId: product.brandId,
        id: { [Sequelize.Op.ne]: product.id },
        isActive: true,
        availability: true
      },
      limit: 10,
      order: [['rating', 'DESC'], ['created_at', 'DESC']],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: relatedProducts
    });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching related products'
    });
  }
};

/**
 * @desc    Update product stock
 * @route   PUT /api/products/:id/stock
 * @access  Private (Admin/Seller)
 */
export const updateProductStock = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership (admin or seller)
    if (req.user.role !== 'admin' && product.sellerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const { stock, colorName, operation = 'set' } = req.body;

    // Handle JSON stock structure (per color)
    if (stock !== undefined) {
      let parsedStock = {};

      // If stock is a JSON string or object, parse it
      if (typeof stock === 'string') {
        try {
          parsedStock = JSON.parse(stock);
        } catch (error) {
          // If not valid JSON, treat as single number for backward compatibility
          const stockValue = parseInt(stock);
          if (isNaN(stockValue)) {
            return res.status(400).json({
              success: false,
              message: 'Valid stock value is required'
            });
          }
          // If colorName is provided, update that color's stock
          if (colorName) {
            parsedStock = { ...(product.stock || {}), [colorName]: stockValue };
          } else {
            // Distribute to all colors
            const colors = product.colorsAndImages ? Object.keys(product.colorsAndImages) : [];
            if (colors.length === 0) {
              parsedStock = { default: stockValue };
            } else {
              colors.forEach(color => {
                parsedStock[color] = stockValue;
              });
            }
          }
        }
      } else if (typeof stock === 'object' && stock !== null) {
        parsedStock = stock;
      } else {
        // Single number
        const stockValue = parseInt(stock);
        if (isNaN(stockValue)) {
          return res.status(400).json({
            success: false,
            message: 'Valid stock value is required'
          });
        }

        if (colorName) {
          parsedStock = { ...(product.stock || {}), [colorName]: stockValue };
        } else {
          const colors = product.colorsAndImages ? Object.keys(product.colorsAndImages) : [];
          if (colors.length === 0) {
            parsedStock = { default: stockValue };
          } else {
            colors.forEach(color => {
              parsedStock[color] = stockValue;
            });
          }
        }
      }

      // Apply operation if specified
      if (operation !== 'set' && colorName) {
        const currentStock = (product.stock && product.stock[colorName]) || 0;
        switch (operation) {
          case 'increment':
            parsedStock[colorName] = currentStock + parseInt(parsedStock[colorName] || 0);
            break;
          case 'decrement':
            parsedStock[colorName] = Math.max(0, currentStock - parseInt(parsedStock[colorName] || 0));
            break;
        }
      }

      await product.update({ stock: parsedStock });

      res.status(200).json({
        success: true,
        message: 'Stock updated successfully',
        data: {
          id: product.id,
          name: product.name,
          oldStock: product.stock,
          newStock: parsedStock,
          operation
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Stock value is required'
      });
    }
  } catch (error) {
    console.error('Update product stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product stock'
    });
  }
};