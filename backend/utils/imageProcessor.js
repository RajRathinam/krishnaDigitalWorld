import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Resize and optimize hero slider images
 * Target resolution: 1080x544 or 1600x530
 */
export const processHeroImage = async (inputPath, outputPath) => {
    try {
        await sharp(inputPath)
            .resize(1080, 544, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 80 })
            .toFile(outputPath);

        return true;
    } catch (error) {
        console.error('Error processing hero image:', error);
        throw error;
    }
};

/**
 * Optimize product images
 * Limit dimensions and compress
 */
export const processProductImage = async (inputPath, outputPath) => {
    try {
        await sharp(inputPath)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(outputPath);

        return true;
    } catch (error) {
        console.error('Error processing product image:', error);
        throw error;
    }
};

/**
 * Helper to delete a file
 */
export const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
    }
};
