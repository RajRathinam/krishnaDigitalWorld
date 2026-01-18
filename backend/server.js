import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import {
  authRoutes,
  userRoutes,
  adminRoutes,
  productRoutes,
  cartRoutes,
  orderRoutes,
  adminOrderRoutes,
  reviewRoutes,
  couponRoutes,
  categoryRoutes,
  brandRoutes,
  modelRoutes
} from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { checkBirthdaysAndSendWishes } from './utils/birthdayWish.js';
import birthdayRoutes from './routes/birthdayRoutes.js';


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
};


// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for all API routes
// Apply rate limiting only in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
  console.log('✅ Rate limiting enabled for production');
} else {
  console.log('⚠️  Rate limiting disabled for development');
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
// REMOVED EMI ROUTES
app.use('/api/models', modelRoutes)
app.use('/api/birthdays', birthdayRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-commerce Backend API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    requestedUrl: req.originalUrl
  });
});


// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Database synchronization and server startup
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database (use force: true only in development)
    const syncOptions = process.env.NODE_ENV === 'development'
      ? { force: false } // Be careful with alter in production
      : { alter: false };

    await sequelize.sync(syncOptions);
    console.log('✅ Database synchronized successfully.');

    // Create default admin user if not exists
    await createDefaultAdmin();

    // Start birthday wish scheduler
    startBirthdayScheduler();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const User = (await import('./models/User.js')).default;

    const adminExists = await User.findOne({
      where: {
        phone: process.env.DEFAULT_ADMIN_PHONE,
        role: 'admin'
      }
    });

    if (!adminExists) {
      const admin = await User.create({
        name: 'Admin User',
        phone: process.env.DEFAULT_ADMIN_PHONE,
        role: 'admin',
        isVerified: true,
        slug: 'admin-user-' + Date.now().toString().slice(-6)
      });

      console.log('✅ Default admin user created:', admin.phone);
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
};

// Birthday wish scheduler
const startBirthdayScheduler = () => {
  // Run every day at 9:00 AM
  const checkAndSendBirthdayWishes = async () => {
    try {
      console.log('🎂 Checking for birthdays...');
      const result = await checkBirthdaysAndSendWishes();

      if (result.count > 0) {
        console.log(`🎁 Sent birthday wishes to ${result.count} users`);
      }
    } catch (error) {
      console.error('❌ Error in birthday wish scheduler:', error);
    }
  };

  // Run immediately on startup
  checkAndSendBirthdayWishes();

  // Schedule to run daily at 9:00 AM
  const now = new Date();
  const nineAM = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    9, 0, 0, 0
  );

  if (now > nineAM) {
    nineAM.setDate(nineAM.getDate() + 1);
  }

  const timeUntilNineAM = nineAM.getTime() - now.getTime();

  setTimeout(() => {
    checkAndSendBirthdayWishes();
    // Run every 24 hours
    setInterval(checkAndSendBirthdayWishes, 24 * 60 * 60 * 1000);
  }, timeUntilNineAM);

  console.log(`🎂 Birthday scheduler started. Next check at: ${nineAM.toLocaleString()}`);
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing server...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;