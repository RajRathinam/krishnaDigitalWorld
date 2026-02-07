import axios from "axios";

/**
 * Send SMS using Fast2SMS DLT route
 */
export const sendSMS = async (to, message) => {
  try {
    // extract OTP digits from message text
    const otpMatch = message.match(/\d{4,6}/);
    const otp = otpMatch ? otpMatch[0] : "";

    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "dlt",
        sender_id: process.env.FAST2SMS_SENDER_ID,
        message: process.env.FAST2SMS_TEMPLATE_ID,
        variables_values: otp,
        flash: 0,
        numbers: to
      },
      {
        headers: {
          "authorization": process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Fast2SMS sent:", response.data);

    return {
      success: true,
      message: "SMS sent successfully"
    };

  } catch (error) {
    console.error("SMS failed:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to send SMS"
    };
  }
};



/**
 * Send OTP SMS
 */
export const sendOTPSMS = async (phone, otp, purpose) => {
  const purposes = {
    register: 'registration',
    login: 'login',
    reset: 'password reset'
  };

  const message =
    `Your OTP for ${purposes[purpose]} is ${otp}. ` +
    `Valid for ${process.env.OTP_EXPIRY_MINUTES} minute(s).`;

  return await sendSMS(phone, message);
};

/**
 * Send Order Shipped SMS
 */
export const sendOrderShippedSMS = async (phone, orderNumber, trackingId) => {
  // TODO: Implement actual Fast2SMS call with appropriate DLT template
  console.log(`[SMS] Order ${orderNumber} shipped. Tracking: ${trackingId}. To: ${phone}`);
  return { success: true, message: "SMS logged (not sent - missing template)" };
};

/**
 * Send Order Delivered SMS
 */
export const sendOrderDeliveredSMS = async (phone, orderNumber) => {
  // TODO: Implement actual Fast2SMS call with appropriate DLT template
  console.log(`[SMS] Order ${orderNumber} delivered. To: ${phone}`);
  return { success: true, message: "SMS logged (not sent - missing template)" };
};
