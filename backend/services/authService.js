import { User, Otp, Coupon, UserCoupon } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';
import { generateSlug } from '../utils/slugGenerator.js';
import { createOTP, verifyOTP } from './otpService.js';
import { validateRegistration, validateLogin } from '../utils/validators.js';

// Test user configuration
const TEST_USER_PHONE = '1234567890';
const TEST_USER_OTP = '123456';

/**
 * Check if phone number belongs to test user
 */
const isTestUser = (phone) => {
  return phone === TEST_USER_PHONE;
};

/**
 * Create welcome gift coupon for new user
 */
const createWelcomeGiftCoupon = async (userId) => {
  try {
    const coupon = await Coupon.create({
      code: `WELCOME${Date.now().toString().slice(-6)}`,
      description: 'Welcome to our store! Enjoy this special discount on your first purchase.',
      discountType: 'percentage',
      discountValue: 10, // 10% discount
      minOrderAmount: 0,
      maxDiscount: 500,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 days
      usageLimit: 1,
      isSingleUse: true,
      isActive: true
    });

    // Assign coupon to user
    await UserCoupon.create({
      userId,
      couponId: coupon.id,
      isUsed: false
    });

    return coupon;
  } catch (error) {
    console.error('Error creating welcome gift coupon:', error);
    throw error;
  }
};

/**
 * Register a new user
 */
export const registerUser = async (userData) => {
  try {
    // Validate user data
    const validation = validateRegistration(userData);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        phone: userData.phone
      }
    });

    if (existingUser) {
      return {
        success: false,
        message: 'User with this phone number already exists'
      };
    }

    // Check if email exists (if provided)
    if (userData.email) {
      const existingEmail = await User.findOne({
        where: {
          email: userData.email
        }
      });

      if (existingEmail) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }
    }

    // Generate unique slug
    const allSlugs = await User.findAll({
      attributes: ['slug'],
      raw: true
    }).then(users => users.map(user => user.slug));

    const slug = generateSlug(userData.name, allSlugs);

    // Create user (not verified yet)
    const user = await User.create({
      name: userData.name,
      phone: userData.phone,
      email: userData.email || null,
      role: 'customer',
      slug,
      isVerified: false,
      additionalAddresses: []
    });

    // For test user, don't send actual OTP
    if (isTestUser(userData.phone)) {
      return {
        success: true,
        message: 'Test user registered. Use OTP 123456 for verification.',
        userId: user.id,
        phone: user.phone,
        slug: user.slug
      };
    }

    // Generate OTP for verification (for real users)
    const otpResult = await createOTP(userData.phone, 'register');

    return {
      success: true,
      message: 'Registration successful. OTP sent for verification.',
      userId: user.id,
      phone: user.phone,
      slug: user.slug
    };
  } catch (error) {
    console.error('Error registering user:', error);

    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      return {
        success: false,
        message: `${field} already exists`
      };
    }

    throw error;
  }
};

/**
 * Complete registration by verifying OTP
 */
export const completeRegistration = async (phone, otp) => {
  try {
    let otpResult;

    // Check for test user
    if (isTestUser(phone)) {
      // Bypass OTP verification for test user
      if (otp !== TEST_USER_OTP) {
        return {
          success: false,
          message: 'Invalid OTP for test user. Use 123456'
        };
      }
      otpResult = { success: true }; // Mock success for test user
    } else {
      // Normal OTP verification for real users
      otpResult = await verifyOTP(phone, otp, 'register');
      if (!otpResult.success) {
        return otpResult;
      }
    }

    // Find user
    const user = await User.findOne({
      where: { phone }
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Mark user as verified
    await user.update({ isVerified: true });

    // Generate welcome gift coupon for first-time registration
    if (!user.giftReceived) {
      await createWelcomeGiftCoupon(user.id);
      await user.update({ giftReceived: true });
    }

    // Generate JWT token
    const token = generateToken(user);

    return {
      success: true,
      message: 'Registration completed successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        slug: user.slug,
        role: user.role,
        isVerified: user.isVerified,
        address: user.address,
        additionalAddresses: user.additionalAddresses || []
      }
    };
  } catch (error) {
    console.error('Error completing registration:', error);
    throw error;
  }
};

/**
 * Login user
 */
export const loginUser = async (loginData) => {
  try {
    // Validate login data
    const validation = validateLogin(loginData);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Find user
    const user = await User.findOne({
      where: { phone: loginData.phone }
    });

    if (!user) {
      // If test user doesn't exist and trying to login with test phone
      if (isTestUser(loginData.phone)) {
        return {
          success: true,
          message: 'Test user detected. Use OTP 123456 to login.',
          phone: loginData.phone,
          isTestUser: true
        };
      }
      
      return {
        success: false,
        message: 'User not found. Please register first.'
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        message: 'Account is deactivated. Please contact support.'
      };
    }

    // For test user, don't send actual OTP
    if (isTestUser(loginData.phone)) {
      return {
        success: true,
        message: 'Test user detected. Use OTP 123456 to login.',
        phone: user.phone,
        isTestUser: true
      };
    }

    // Generate OTP for login verification (for real users)
    const otpResult = await createOTP(loginData.phone, 'login');

    return {
      success: true,
      message: 'OTP sent for login verification',
      phone: user.phone
    };
  } catch (error) {
    console.error('Error in login:', error);
    throw error;
  }
};

/**
 * Complete login by verifying OTP
 */
export const completeLogin = async (phone, otp) => {
  try {
    let otpResult;

    // Check for test user
    if (isTestUser(phone)) {
      // Bypass OTP verification for test user
      if (otp !== TEST_USER_OTP) {
        return {
          success: false,
          message: 'Invalid OTP for test user. Use 123456'
        };
      }
      otpResult = { success: true }; // Mock success for test user
    } else {
      // Normal OTP verification for real users
      otpResult = await verifyOTP(phone, otp, 'login');
      if (!otpResult.success) {
        return otpResult;
      }
    }

    // Find user (or create if test user doesn't exist)
    let user = await User.findOne({
      where: { phone }
    });

    // If test user doesn't exist, create them automatically
    if (!user && isTestUser(phone)) {
      // Create test user
      const allSlugs = await User.findAll({
        attributes: ['slug'],
        raw: true
      }).then(users => users.map(user => user.slug));

      const slug = generateSlug('Test User', allSlugs);

      user = await User.create({
        name: 'Test User',
        phone: TEST_USER_PHONE,
        email: 'test@example.com',
        role: 'customer',
        slug,
        isVerified: true,
        additionalAddresses: [
          {
            id: 'test-address-1',
            name: 'Test User',
            phone: TEST_USER_PHONE,
            street: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            type: 'home',
            isDefault: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          fullAddress: '123 Test Street, Test City, Test State, 123456'
        },
        isActive: true,
        giftReceived: false // Will be set below
      });

      // Generate welcome gift coupon for test user
      await createWelcomeGiftCoupon(user.id);
      await user.update({ giftReceived: true });
    }

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        message: 'Account is deactivated. Please contact support.'
      };
    }

    // Generate JWT token
    const token = generateToken(user);

    return {
      success: true,
      message: isTestUser(phone) ? 'Test user login successful' : 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        slug: user.slug,
        role: user.role,
        isVerified: user.isVerified,
        address: user.address,
        additionalAddresses: user.additionalAddresses || []
      }
    };
  } catch (error) {
    console.error('Error completing login:', error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logoutUser = (res) => {
  // Clear token cookie function should be defined elsewhere
  // clearTokenCookie(res);
  return {
    success: true,
    message: 'Logged out successfully'
  };
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ['password'] // Remove if you have password field
      }
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        slug: user.slug,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        additionalAddresses: user.additionalAddresses || [],
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile with additional address support
 */
export const updateUserProfile = async (userId, updateData) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Don't allow role change via profile update
    if (updateData.role) {
      delete updateData.role;
    }

    // Don't allow phone change via profile update
    if (updateData.phone) {
      delete updateData.phone;
    }

    // Handle address updates
    if (updateData.address && typeof updateData.address === 'object') {
      // If address is an object, format it as primary address
      const { street, city, state, pincode, ...rest } = updateData.address;
      const fullAddress = `${street || ''}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}${pincode ? `, ${pincode}` : ''}`;

      // Save structured address in JSON
      updateData.address = {
        street: street || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        fullAddress: fullAddress,
        ...rest
      };
    }

    // Update user
    await user.update(updateData);

    // Reload user to get updated data
    const updatedUser = await User.findByPk(userId);

    return {
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        slug: updatedUser.slug,
        role: updatedUser.role,
        dateOfBirth: updatedUser.dateOfBirth,
        address: updatedUser.address,
        additionalAddresses: updatedUser.additionalAddresses || [],
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt
      }
    };
  } catch (error) {
    console.error('Error updating user profile:', error);

    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      return {
        success: false,
        message: `${field} already exists`
      };
    }

    throw error;
  }
};

/**
 * Add new additional address
 */
export const addAdditionalAddress = async (userId, addressData) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Generate proper UUID for the address
    const addressId = crypto.randomUUID ? crypto.randomUUID() :
      Date.now().toString(36) + Math.random().toString(36).substr(2);

    const newAddress = {
      id: addressId,
      name: addressData.name || user.name,
      phone: addressData.phone || user.phone,
      street: addressData.street || '',
      city: addressData.city || '',
      state: addressData.state || '',
      pincode: addressData.pincode || '',
      type: addressData.type || 'other',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Get current additional addresses or initialize empty array
    let additionalAddresses = user.additionalAddresses || [];

    // If this is the first additional address, set as default
    if (additionalAddresses.length === 0) {
      newAddress.isDefault = true;
    }

    // Add new address
    additionalAddresses.push(newAddress);

    // Update user
    await user.update({ additionalAddresses });

    // Reload user to get updated data
    const updatedUser = await User.findByPk(userId);

    return {
      success: true,
      message: 'Address added successfully',
      address: newAddress,
      additionalAddresses: updatedUser.additionalAddresses || []
    };
  } catch (error) {
    console.error('Error adding additional address:', error);
    throw error;
  }
};

/**
 * Update additional address
 */
export const updateAdditionalAddress = async (userId, addressId, updateData) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    const additionalAddresses = user.additionalAddresses || [];
    const addressIndex = additionalAddresses.findIndex(addr => String(addr.id) === String(addressId));

    if (addressIndex === -1) {
      return {
        success: false,
        message: 'Address not found'
      };
    }

    // Update address
    additionalAddresses[addressIndex] = {
      ...additionalAddresses[addressIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await user.update({ additionalAddresses });

    // Reload user to get updated data
    const updatedUser = await User.findByPk(userId);

    return {
      success: true,
      message: 'Address updated successfully',
      address: additionalAddresses[addressIndex],
      additionalAddresses: updatedUser.additionalAddresses || []
    };
  } catch (error) {
    console.error('Error updating additional address:', error);
    throw error;
  }
};

/**
 * Delete additional address
 */
export const deleteAdditionalAddress = async (userId, addressId) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    let additionalAddresses = user.additionalAddresses || [];
    const addressIndex = additionalAddresses.findIndex(addr => String(addr.id) === String(addressId));

    if (addressIndex === -1) {
      return {
        success: false,
        message: 'Address not found'
      };
    }

    const wasDefault = additionalAddresses[addressIndex].isDefault;

    // Remove address
    additionalAddresses = additionalAddresses.filter(addr => String(addr.id) !== String(addressId));

    // If we deleted a default address and there are other addresses, set first one as default
    if (wasDefault && additionalAddresses.length > 0) {
      additionalAddresses[0].isDefault = true;
    }

    await user.update({ additionalAddresses });

    // Reload user to get updated data
    const updatedUser = await User.findByPk(userId);

    return {
      success: true,
      message: 'Address deleted successfully',
      additionalAddresses: updatedUser.additionalAddresses || []
    };
  } catch (error) {
    console.error('Error deleting additional address:', error);
    throw error;
  }
};

/**
 * Set default additional address
 */
export const setDefaultAddress = async (userId, addressId) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    const additionalAddresses = user.additionalAddresses || [];

    // Update all addresses: set the selected one as default, others as not default
    const updatedAddresses = additionalAddresses.map(addr => ({
      ...addr,
      isDefault: String(addr.id) === String(addressId)
    }));

    await user.update({ additionalAddresses: updatedAddresses });

    return {
      success: true,
      message: 'Default address updated successfully',
      additionalAddresses: updatedAddresses
    };
  } catch (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
};

/**
 * Complete user profile (add DOB and address)
 */
export const completeUserProfile = async (userId, profileData) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    const updateData = {};

    if (profileData.dateOfBirth) {
      updateData.dateOfBirth = profileData.dateOfBirth;
    }

    if (profileData.address) {
      updateData.address = profileData.address;
    }

    // Update user
    await user.update(updateData);

    // Reload user to get updated data
    const updatedUser = await User.findByPk(userId);

    return {
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        dateOfBirth: updatedUser.dateOfBirth,
        address: updatedUser.address,
        additionalAddresses: updatedUser.additionalAddresses || [],
        isVerified: updatedUser.isVerified
      }
    };
  } catch (error) {
    console.error('Error completing user profile:', error);
    throw error;
  }
};

/**
 * Seed test user (run this once to create test user)
 */
export const seedTestUser = async () => {
  try {
    const existingTestUser = await User.findOne({
      where: { phone: TEST_USER_PHONE }
    });

    if (!existingTestUser) {
      // Get all slugs to generate unique slug
      const allSlugs = await User.findAll({
        attributes: ['slug'],
        raw: true
      }).then(users => users.map(user => user.slug));

      const slug = generateSlug('Test User', allSlugs);

      // Create test user
      const testUser = await User.create({
        name: 'Test User',
        phone: TEST_USER_PHONE,
        email: 'test@example.com',
        role: 'customer',
        slug,
        isVerified: true,
        additionalAddresses: [
          {
            id: 'test-address-1',
            name: 'Test User',
            phone: TEST_USER_PHONE,
            street: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            type: 'home',
            isDefault: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'test-address-2',
            name: 'Test User',
            phone: TEST_USER_PHONE,
            street: '456 Work Avenue',
            city: 'Work City',
            state: 'Work State',
            pincode: '654321',
            type: 'work',
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          fullAddress: '123 Test Street, Test City, Test State, 123456'
        },
        isActive: true,
        giftReceived: false // Will be set below
      });

      // Create welcome coupon for test user
      await createWelcomeGiftCoupon(testUser.id);
      await testUser.update({ giftReceived: true });

      console.log('✅ Test user created successfully!');
      console.log('📱 Phone:', TEST_USER_PHONE);
      console.log('🔑 OTP:', TEST_USER_OTP);
      console.log('👤 Name:', testUser.name);
      console.log('📧 Email:', testUser.email);
      console.log('🏠 Addresses:', testUser.additionalAddresses.length);

      return {
        success: true,
        message: 'Test user created successfully',
        user: {
          id: testUser.id,
          name: testUser.name,
          phone: testUser.phone,
          email: testUser.email,
          otp: TEST_USER_OTP
        }
      };
    }

    console.log('ℹ️ Test user already exists:', {
      phone: TEST_USER_PHONE,
      name: existingTestUser.name,
      id: existingTestUser.id
    });

    return {
      success: true,
      message: 'Test user already exists',
      user: {
        id: existingTestUser.id,
        name: existingTestUser.name,
        phone: existingTestUser.phone
      }
    };
  } catch (error) {
    console.error('❌ Error seeding test user:', error);
    return {
      success: false,
      message: 'Failed to seed test user',
      error: error.message
    };
  }
};

/**
 * Get test user info (for debugging)
 */
export const getTestUserInfo = async () => {
  try {
    const testUser = await User.findOne({
      where: { phone: TEST_USER_PHONE },
      include: [{
        model: UserCoupon,
        include: [Coupon]
      }]
    });

    if (!testUser) {
      return {
        exists: false,
        message: 'Test user not found. Run seedTestUser() to create it.'
      };
    }

    return {
      exists: true,
      user: {
        id: testUser.id,
        name: testUser.name,
        phone: testUser.phone,
        email: testUser.email,
        isVerified: testUser.isVerified,
        isActive: testUser.isActive,
        giftReceived: testUser.giftReceived,
        addresses: testUser.additionalAddresses,
        coupons: testUser.UserCoupons?.map(uc => ({
          code: uc.Coupon?.code,
          description: uc.Coupon?.description,
          discount: uc.Coupon?.discountValue,
          isUsed: uc.isUsed
        })) || []
      }
    };
  } catch (error) {
    console.error('Error getting test user info:', error);
    throw error;
  }
};