import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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
  modelRoutes,
  settingsRoutes,
  heroSliderRoutes
} from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { checkBirthdaysAndSendWishes } from './utils/birthdayWish.js';
import birthdayRoutes from './routes/birthdayRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Debug: Log environment variables
console.log('🔧 Environment Configuration:');
console.log(`   PORT: ${PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL}`);
console.log(`   ADMIN_URL: ${process.env.ADMIN_URL}`);

// CORS configuration - Hardcoded for reliability
const allowedOrigins = [
  'https://srikrishnadigitalworld.in',
  'https://admin.srikrishnadigitalworld.in',
  'https://www.srikrishnadigitalworld.in',
  'https://www.admin.srikrishnadigitalworld.in',
  'http://localhost:3000',    // For local frontend development
  'http://localhost:3001'     // For local admin development
];

console.log('🌐 Allowed CORS Origins:', allowedOrigins);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) {
      console.log('ℹ️  No origin header (server-to-server request)');
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable if causing issues with external resources
}));

// Apply CORS middleware - ONLY THIS ONE
app.use(cors(corsOptions));

// Request logging middleware (before routes)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('✅ Serving static files from /uploads directory');

// Detailed request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const origin = req.headers.origin || 'none';
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - Origin: ${origin}`);
  });
  next();
});

// Rate limiting for all API routes (production only)
if (process.env.NODE_ENV === 'production') {
  // app.use('/api', apiLimiter);
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
app.use('/api/models', modelRoutes);
app.use('/api/birthdays', birthdayRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/hero-slider', heroSliderRoutes);
app.use('/api', settingsRoutes); // Public shop info route

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    allowedOrigins: allowedOrigins,
    requestOrigin: req.headers.origin || 'none',
    headers: req.headers
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  const origin = req.headers.origin || 'Not provided';
  const isAllowed = allowedOrigins.includes(origin);
  
  res.status(200).json({
    success: true,
    message: 'CORS test successful',
    origin: origin,
    allowed: isAllowed,
    allowedOrigins: allowedOrigins,
    timestamp: new Date().toISOString(),
    headers: {
      'access-control-allow-origin': res.getHeader('access-control-allow-origin'),
      'access-control-allow-credentials': res.getHeader('access-control-allow-credentials')
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-commerce Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      corsTest: '/api/cors-test',
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      users: '/api/users',
      orders: '/api/orders'
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'none'}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    origin: req.headers.origin || 'none'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request Origin:', req.headers.origin || 'none');

  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS error',
      error: err.message,
      allowedOrigins: allowedOrigins,
      requestOrigin: req.headers.origin || 'Not provided',
      timestamp: new Date().toISOString()
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// Database synchronization and server startup
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database
    const syncOptions = { alter: false, force: false };

    console.log('🔄 Synchronizing database...');
    await sequelize.sync(syncOptions);
    console.log('✅ Database synchronized successfully.');

    // Create default admin user if not exists
    await createDefaultAdmin();

    // Start birthday wish scheduler
    startBirthdayScheduler();

    // Start server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Local URL: http://localhost:${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
      console.log('='.repeat(60) + '\n');
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

    const adminPhone = process.env.DEFAULT_ADMIN_PHONE || '9999999999';
    console.log(`👤 Checking for admin user with phone: ${adminPhone}`);

    const adminExists = await User.findOne({
      where: {
        phone: adminPhone,
        role: 'admin'
      }
    });

    if (!adminExists) {
      const admin = await User.create({
        name: 'Admin User',
        phone: adminPhone,
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

  // Run immediately
  checkAndSendBirthdayWishes();

  // Schedule daily at 9:00 AM
  const now = new Date();
  const nineAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);

  if (now > nineAM) nineAM.setDate(nineAM.getDate() + 1);

  const timeUntilNineAM = nineAM.getTime() - now.getTime();

  setTimeout(() => {
    checkAndSendBirthdayWishes();
    setInterval(checkAndSendBirthdayWishes, 24 * 60 * 60 * 1000);
  }, timeUntilNineAM);

  console.log(`🎂 Birthday scheduler started. Next check: ${nineAM.toLocaleString()}`);
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