// controllers/heroSliderController.js
import { HeroSlider } from '../models/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { processHeroImage, deleteFile } from '../utils/imageProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Hero Slider
export const createHeroSlider = async (req, res) => {
    try {
        const { title, subtitle, cta, ctaLink, accent, order, isActive } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }

        const filename = `hero-${Date.now()}.webp`;
        const tempPath = req.file.path;
        const finalPath = path.join(__dirname, '..', 'uploads/hero', filename);
        const imagePath = `/uploads/hero/${filename}`;

        try {
            await processHeroImage(tempPath, finalPath);
            // Delete the original uploaded file (temp)
            deleteFile(tempPath);
        } catch (procError) {
            deleteFile(tempPath);
            throw new Error('Failed to process image: ' + procError.message);
        }

        const newSlide = await HeroSlider.create({
            title,
            subtitle,
            cta,
            ctaLink,
            accent,
            image: imagePath,
            order: order ? parseInt(order) : 0,
            isActive: isActive !== undefined ? isActive === 'true' : true
        });

        res.status(201).json({
            success: true,
            message: 'Hero slider created successfully',
            data: newSlide
        });
    } catch (error) {
        console.error('Error creating hero slider:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create hero slider',
            error: error.message
        });
    }
};

// Get all Hero Sliders
export const getAllHeroSliders = async (req, res) => {
    try {
        const { activeOnly } = req.query;
        const where = {};
        if (activeOnly === 'true') {
            where.isActive = true;
        }

        const sliders = await HeroSlider.findAll({
            where,
            order: [['order', 'ASC'], ['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: sliders
        });
    } catch (error) {
        console.error('Error fetching hero sliders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hero sliders',
            error: error.message
        });
    }
};

// Update Hero Slider
export const updateHeroSlider = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, cta, ctaLink, accent, order, isActive } = req.body;

        const slider = await HeroSlider.findByPk(id);
        if (!slider) {
            return res.status(404).json({
                success: false,
                message: 'Hero slider not found'
            });
        }

        const updateData = {
            title,
            subtitle,
            cta,
            ctaLink,
            accent,
            order: order ? parseInt(order) : slider.order,
            isActive: isActive !== undefined ? isActive === 'true' : slider.isActive
        };

        if (req.file) {
            // Delete old image if exists
            const relativePath = slider.image.startsWith('/') ? slider.image.substring(1) : slider.image;
            const oldPath = path.join(__dirname, '..', relativePath);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }

            const filename = `hero-${Date.now()}.webp`;
            const tempPath = req.file.path;
            const finalPath = path.join(__dirname, '..', 'uploads/hero', filename);

            try {
                await processHeroImage(tempPath, finalPath);
                deleteFile(tempPath);
                updateData.image = `/uploads/hero/${filename}`;
            } catch (procError) {
                deleteFile(tempPath);
                throw new Error('Failed to process image: ' + procError.message);
            }
        }

        await slider.update(updateData);

        res.status(200).json({
            success: true,
            message: 'Hero slider updated successfully',
            data: slider
        });
    } catch (error) {
        console.error('Error updating hero slider:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update hero slider',
            error: error.message
        });
    }
};

// Delete Hero Slider
export const deleteHeroSlider = async (req, res) => {
    try {
        const { id } = req.params;
        const slider = await HeroSlider.findByPk(id);

        if (!slider) {
            return res.status(404).json({
                success: false,
                message: 'Hero slider not found'
            });
        }

        // Delete image file
        const relativePath = slider.image.startsWith('/') ? slider.image.substring(1) : slider.image;
        const imagePath = path.join(__dirname, '..', relativePath);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await slider.destroy();

        res.status(200).json({
            success: true,
            message: 'Hero slider deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting hero slider:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete hero slider',
            error: error.message
        });
    }
};
