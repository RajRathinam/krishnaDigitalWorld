// This is a mock SMS service
// In production, integrate with Twilio, AWS SNS, etc.

/**
 * Send SMS (mock implementation)
 */
export const sendSMS = async (to, message) => {
  try {
    console.log('Mock SMS Service:');
    console.log('To:', to);
    console.log('Message:', message);
    console.log('---');

    // In production, implement actual SMS sending
    // Example with Twilio:
    /*
    const client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    return {
      success: true,
      message: 'SMS sent successfully',
      sid: result.sid
    };
    */

    return {
      success: true,
      message: 'SMS sent successfully (mock)'
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      message: 'Failed to send SMS',
      error: error.message
    };
  }
};

/**
 * Send OTP via SMS
 */
export const sendOTPSMS = async (phone, otp, purpose) => {
  const purposes = {
    register: 'registration',
    login: 'login',
    reset: 'password reset'
  };

  const message = `Your OTP for ${purposes[purpose]} is ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES} minute(s). Do not share with anyone.`;

  return await sendSMS(phone, message);
};

/**
 * Send welcome SMS
 */
export const sendWelcomeSMS = async (phone, name) => {
  const message = `Welcome ${name}! Thank you for registering. You've received a 10% discount coupon on your first purchase. Happy shopping!`;

  return await sendSMS(phone, message);
};

/**
 * Send birthday SMS
 */
export const sendBirthdaySMS = async (phone, name, couponCode) => {
  const message = `Happy Birthday ${name}! 🎉 Use coupon code ${couponCode} for 15% off on your next purchase. Valid for 7 days.`;

  return await sendSMS(phone, message);
};

/**
 * Send order confirmation SMS
 */
export const sendOrderConfirmationSMS = async (phone, orderNumber, amount) => {
  const message = `Order ${orderNumber} confirmed. Amount: ₹${amount.toFixed(2)}. We'll notify you when it ships.`;

  return await sendSMS(phone, message);
};

/**
 * Send order shipped SMS
 */
export const sendOrderShippedSMS = async (phone, orderNumber, trackingId) => {
  const message = `Your order ${orderNumber} has been shipped! Track your order: ${process.env.APP_URL}/orders/track/${trackingId}`;

  return await sendSMS(phone, message);
};

/**
 * Send order delivered SMS
 */
export const sendOrderDeliveredSMS = async (phone, orderNumber) => {
  const message = `Your order ${orderNumber} has been delivered! We hope you enjoy your purchase. Thank you for shopping with us!`;

  return await sendSMS(phone, message);
};
