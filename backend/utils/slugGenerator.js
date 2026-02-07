import { generateRandomString } from './helpers.js';

/**
 * Generate a URL-friendly slug from name
 */
export const generateSlug = (name, existingSlugs = []) => {
  if (!name || typeof name !== 'string') {
    throw new Error('Name is required to generate slug');
  }

  // Clean the name: lowercase, replace spaces with hyphens, remove special chars
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-'); // Replace multiple hyphens with single hyphen

  // Split name into parts for firstname-lastname format
  const nameParts = name.trim().split(/\s+/);
  
  if (nameParts.length >= 2) {
    // Format: firstname-lastname-random10digits
    const firstName = nameParts[0].toLowerCase().replace(/[^\w]/g, '');
    const lastName = nameParts[nameParts.length - 1].toLowerCase().replace(/[^\w]/g, '');
    const randomDigits = generateRandomString(10);
    slug = `${firstName}-${lastName}-${randomDigits}`;
  } else {
    // Format: firstname-random12digits
    const firstName = nameParts[0].toLowerCase().replace(/[^\w]/g, '');
    const randomDigits = generateRandomString(12);
    slug = `${firstName}-${randomDigits}`;
  }

  // Ensure uniqueness
  let finalSlug = slug;
  let counter = 1;
  
  while (existingSlugs.includes(finalSlug)) {
    const randomDigits = generateRandomString(12);
    finalSlug = `${slug.split('-').slice(0, -1).join('-')}-${randomDigits}`;
    counter++;
    
    // Safety check to prevent infinite loop
    if (counter > 100) {
      finalSlug = `${slug}-${Date.now()}`;
      break;
    }
  }

  return finalSlug;
};

/**
 * Validate slug format
 */
export const isValidSlug = (slug) => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};

/**
 * Generate product slug
 */
// utils/slugGenerator.js
export const generateProductSlug = (productName, brandName, modelName, variant = '') => {
  if (!productName || !brandName || !modelName) {
    throw new Error('Product name, brand name, and model name are required');
  }

  const cleanProductName = productName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');

  const cleanBrandName = brandName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');

  const cleanModelName = modelName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');

  const cleanVariant = variant
    ? variant
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
    : '';

  let slug = cleanVariant 
    ? `${cleanBrandName}-${cleanModelName}-${cleanProductName}-${cleanVariant}`
    : `${cleanBrandName}-${cleanModelName}-${cleanProductName}`;

  // Add timestamp for uniqueness
  const timestamp = Date.now().toString().slice(-6);
  slug = `${slug}-${timestamp}`;

  // Ensure it's not too long
  if (slug.length > 200) {
    slug = slug.substring(0, 200);
  }

  return slug;
};

/**
 * Generate SKU
 */
export const generateSKU = (categoryCode, brandCode, productId) => {
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${categoryCode}-${brandCode}-${productId}-${random}`;
};