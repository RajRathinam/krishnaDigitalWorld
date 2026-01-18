import { 
  registerUser, 
  completeRegistration, 
  loginUser, 
  completeLogin, 
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  completeUserProfile,
  addAdditionalAddress,
  updateAdditionalAddress,
  deleteAdditionalAddress,
  setDefaultAddress
} from '../services/authService.js';
import { resendOTP } from '../services/otpService.js';
import { setTokenCookie, clearTokenCookie } from '../utils/jwt.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const result = await registerUser(req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        userId: result.userId,
        phone: result.phone,
        slug: result.slug,
        otp: result.otp // Only in development
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * @desc    Verify OTP and complete registration
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    const result = await completeRegistration(phone, otp);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Set token cookie
    setTokenCookie(res, result.token);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        token: result.token,
        user: result.user
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        userId: result.userId,
        phone: result.phone,
        otp: result.otp // Only in development
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * @desc    Verify OTP and complete login
 * @route   POST /api/auth/verify-login
 * @access  Public
 */
export const verifyLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    const result = await completeLogin(phone, otp);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    // Set token cookie
    setTokenCookie(res, result.token);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        token: result.token,
        user: result.user
      }
    });
  } catch (error) {
    console.error('Verify login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login verification'
    });
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTPController = async (req, res) => {
  try {
    const { phone, purpose } = req.body;
    
    const result = await resendOTP(phone, purpose);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        phone,
        purpose,
        otp: process.env.NODE_ENV === 'development' ? result.otp : undefined
      }
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending OTP'
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = (req, res) => {
  try {
    const result = logoutUser(res);
    res.status(200).json(result);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
// In authController.js, update address responses to match:

export const getMe = async (req, res) => {
  try {
    const result = await getCurrentUser(req.user.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    // Ensure address structure is consistent
    const userData = result.user;
    const responseData = {
      id: userData.id,
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      slug: userData.slug,
      role: userData.role,
      dateOfBirth: userData.dateOfBirth,
      address: userData.address || null,
      additionalAddresses: userData.additionalAddresses || [],
      isVerified: userData.isVerified,
      createdAt: userData.createdAt
    };
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
export const updateMe = async (req, res) => {
  try {
    const result = await updateUserProfile(req.user.id, req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

/**
 * @desc    Complete user profile (add DOB and address)
 * @route   POST /api/auth/complete-profile
 * @access  Private
 */
export const completeProfile = async (req, res) => {
  try {
    const result = await completeUserProfile(req.user.id, req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing profile'
    });
  }
};

/**
 * @desc    Add additional address
 * @route   POST /api/auth/addresses
 * @access  Private
 */
export const addAddress = async (req, res) => {
  try {
    const result = await addAdditionalAddress(req.user.id, req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        address: result.address,
        additionalAddresses: result.additionalAddresses
      }
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding address'
    });
  }
};

/**
 * @desc    Update additional address
 * @route   PUT /api/auth/addresses/:addressId
 * @access  Private
 */
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const result = await updateAdditionalAddress(req.user.id, addressId, req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        address: result.address,
        additionalAddresses: result.additionalAddresses
      }
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating address'
    });
  }
};

/**
 * @desc    Delete additional address
 * @route   DELETE /api/auth/addresses/:addressId
 * @access  Private
 */
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const result = await deleteAdditionalAddress(req.user.id, addressId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        additionalAddresses: result.additionalAddresses
      }
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting address'
    });
  }
};

/**
 * @desc    Set default address
 * @route   PUT /api/auth/addresses/:addressId/default
 * @access  Private
 */
export const setDefaultAddressController = async (req, res) => {
  try {
    const { addressId } = req.params;
    const result = await setDefaultAddress(req.user.id, addressId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        additionalAddresses: result.additionalAddresses
      }
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting default address'
    });
  }
};