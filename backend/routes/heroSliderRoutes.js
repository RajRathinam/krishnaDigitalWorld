// routes/heroSliderRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    createHeroSlider,
    getAllHeroSliders,
    updateHeroSlider,
    deleteHeroSlider
} from '../controllers/heroSliderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure Multer for Hero Slider images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/hero';
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `hero-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

// Create folder if not exists
import fs from 'fs';
const dir = './uploads/hero';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Public route to get all slides
router.get('/', getAllHeroSliders);

// Admin routes
router.post('/', authenticate, requireAdmin, upload.single('image'), createHeroSlider);
router.put('/:id', authenticate, requireAdmin, upload.single('image'), updateHeroSlider);
router.delete('/:id', authenticate, requireAdmin, deleteHeroSlider);

export default router;
