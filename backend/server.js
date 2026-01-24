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
  modelRoutes
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
console.log(`   DB_HOST: ${process.env.DB_HOST}`);
console.log(`   DB_NAME: ${process.env.DB_NAME}`);

// CORS configuration - Allow both frontend and admin
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  'http://localhost:3000', // Add localhost for development
  'http://localhost:5173', // Vite dev server
  'https://srikrishnadigitalworld.in',
  'https://www.srikrishnadigitalworld.in',
  'https://admin.srikrishnadigitalworld.in'
].filter(Boolean);

console.log('🌐 Allowed CORS Origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      console.log('📨 Request with no origin (server-to-server)');
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked for origin: ${origin}`);
      console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
      
      // Still allow in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Development mode: Allowing anyway');
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable for API (adjust as needed)
}));

// Apply CORS middleware
app.use(cors(corsOptions));

// FIXED: Handle preflight requests for all routes
app.options('/*', (req, res) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin || process.env.NODE_ENV === 'development') {
    // Allow in development or for server-to-server
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  res.header('Access-Control-Max-Age', '86400');
  
  console.log('✅ Handled OPTIONS preflight for:', req.originalUrl, 'Origin:', origin);
  return res.status(200).end();
});

// Additional CORS headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers dynamically
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin || process.env.NODE_ENV === 'development') {
    // Allow in development or for server-to-server
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  
  // Handle preflight requests (backup)
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling OPTIONS preflight request in middleware');
    return res.status(200).end();
  }
  
  // Log request info for debugging
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} - Origin: ${origin || 'none'}`);
  next();
});

app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('✅ Serving static files from /uploads directory');

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

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
app.use('/api/models', modelRoutes);
app.use('/api/birthdays', birthdayRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: {
      allowedOrigins: allowedOrigins,
      requestOrigin: req.headers.origin || 'none'
    },
    version: '1.0.0'
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CORS test successful',
    origin: req.headers.origin || 'Not provided',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-commerce Backend API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: [
      '/api/health - Server health check',
      '/api/cors-test - CORS test endpoint',
      '/api/auth - Authentication routes',
      '/api/products - Product management',
      '/api/categories - Category management',
      '/api/users - User management',
      '/api/orders - Order management'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/health',
      '/api/products',
      '/api/categories',
      '/api/auth',
      '/api/users'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Global error handler:', err);
  console.error('🔥 Error stack:', err.stack);
  console.error('🔥 Request headers:', req.headers);
  console.error('🔥 Request origin:', req.headers.origin);
  
  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Request not allowed',
      error: err.message,
      allowedOrigins: allowedOrigins,
      requestOrigin: req.headers.origin || 'Not provided',
      suggestion: 'Check if your origin is in the allowed list'
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

    // Sync database (use force: true only in development)
    const syncOptions = process.env.NODE_ENV === 'development'
      ? { alter: true, force: false } // Be careful with alter in production
      : { alter: false, force: false };

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
      console.log(`🔗 CORS test: http://localhost:${PORT}/api/cors-test`);
      console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
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
      } else {
        console.log('🎂 No birthdays today');
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