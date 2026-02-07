// This is a mock email service
// In production, integrate with SendGrid, AWS SES, etc.

/**
 * Send email (mock implementation)
 */
export const sendEmail = async (to, subject, html, text) => {
  try {
    console.log('Mock Email Service:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    console.log('HTML:', html);
    console.log('---');

    // In production, implement actual email sending
    // Example with nodemailer:
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    };

    await transporter.sendMail(mailOptions);
    */

    return {
      success: true,
      message: 'Email sent successfully (mock)'
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: 'Failed to send email',
      error: error.message
    };
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Our Store!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Welcome, ${user.name}!</h1>
      <p>Thank you for registering with us. We're excited to have you as a member.</p>
      <p>Your account has been successfully created with the following details:</p>
      <ul>
        <li><strong>Name:</strong> ${user.name}</li>
        <li><strong>Phone:</strong> ${user.phone}</li>
        <li><strong>Account Type:</strong> ${user.role}</li>
      </ul>
      <p>You can now login and start shopping.</p>
      <p>As a welcome gift, you've received a 10% discount coupon on your first purchase!</p>
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        Best regards,<br>
        The Store Team
      </p>
    </div>
  `;
  const text = `Welcome ${user.name}! Thank you for registering. You've received a 10% discount coupon on your first purchase.`;

  if (user.email) {
    return await sendEmail(user.email, subject, html, text);
  }

  return {
    success: false,
    message: 'No email address provided'
  };
};

/**
 * Send OTP email
 */
export const sendOTPEmail = async (email, otp, purpose) => {
  const purposes = {
    register: 'Registration',
    login: 'Login',
    reset: 'Password Reset'
  };

  const subject = `${purposes[purpose]} OTP - Your One-Time Password`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Your OTP for ${purposes[purpose]}</h1>
      <p>Use the following OTP to complete your ${purposes[purpose].toLowerCase()}:</p>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; font-size: 32px; letter-spacing: 10px; font-weight: bold;">
        ${otp}
      </div>
      <p>This OTP is valid for 10 minutes.</p>
      <p style="color: #ff0000; font-size: 12px;">Do not share this OTP with anyone.</p>
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        If you didn't request this OTP, please ignore this email.
      </p>
    </div>
  `;
  const text = `Your OTP for ${purposes[purpose]} is: ${otp}. Valid for 10 minutes. Do not share.`;

  return await sendEmail(email, subject, html, text);
};

/**
 * Send birthday email
 */
export const sendBirthdayEmail = async (user, couponCode) => {
  const subject = 'Happy Birthday! 🎉 Special Gift Inside';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">Happy Birthday, ${user.name}! 🎂</h1>
      <p style="text-align: center;">We wish you a wonderful birthday filled with joy and happiness!</p>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; text-align: center; margin: 20px 0; border-radius: 10px;">
        <h2 style="margin-top: 0;">Your Birthday Gift 🎁</h2>
        <p>Use this coupon code to get 15% off on your next purchase:</p>
        <div style="background: white; color: #333; padding: 15px; margin: 20px auto; max-width: 300px; border-radius: 5px; font-size: 24px; font-weight: bold;">
          ${couponCode}
        </div>
        <p>Valid for 7 days from today!</p>
      </div>
      <p style="text-align: center;">Thank you for being a valued customer.</p>
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        With warm wishes,<br>
        The Store Team
      </p>
    </div>
  `;
  const text = `Happy Birthday ${user.name}! 🎉 Use coupon code ${couponCode} for 15% off on your next purchase. Valid for 7 days.`;

  if (user.email) {
    return await sendEmail(user.email, subject, html, text);
  }

  return {
    success: false,
    message: 'No email address provided for birthday wish'
  };
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (user, order) => {
  const subject = `Order Confirmation - ${order.orderNumber}`;
  
  // Format order items
  const itemsHtml = order.orderItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Order Confirmed!</h1>
      <p>Thank you for your order, ${user.name}.</p>
      <p>Your order <strong>${order.orderNumber}</strong> has been confirmed and is being processed.</p>
      
      <h2 style="margin-top: 30px;">Order Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">₹${order.totalPrice.toFixed(2)}</td>
          </tr>
          ${order.shippingCost ? `
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;">Shipping:</td>
            <td style="padding: 10px; text-align: right;">₹${order.shippingCost.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${order.taxAmount ? `
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;">Tax:</td>
            <td style="padding: 10px; text-align: right;">₹${order.taxAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${order.discountAmount ? `
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;">Discount:</td>
            <td style="padding: 10px; text-align: right; color: #4CAF50;">-₹${order.discountAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-size: 18px; border-top: 2px solid #ddd;">Total:</td>
            <td style="padding: 10px; text-align: right; font-size: 18px; border-top: 2px solid #ddd; font-weight: bold;">₹${order.finalAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      
      <h2>Shipping Address</h2>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0;">
        <p style="margin: 5px 0;">${order.shippingAddress.street}</p>
        <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
        <p style="margin: 5px 0;">${order.shippingAddress.country}</p>
      </div>
      
      <p style="margin-top: 30px;">We'll notify you once your order ships.</p>
      <p>You can track your order using this link: <a href="${process.env.APP_URL}/orders/track/${order.trackingId}">Track Order</a></p>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        If you have any questions, please contact our customer support.
      </p>
    </div>
  `;

  const text = `Order ${order.orderNumber} confirmed. Total: ₹${order.finalAmount.toFixed(2)}. We'll notify you when it ships.`;

  if (user.email) {
    return await sendEmail(user.email, subject, html, text);
  }

  return {
    success: false,
    message: 'No email address provided for order confirmation'
  };
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const subject = 'Password Reset Request';
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Password Reset</h1>
      <p>Hi ${user.name},</p>
      <p>We received a request to reset your password. Click the button below to reset it:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">${resetLink}</p>
      <p>This link will expire in 1 hour.</p>
      <p style="color: #ff0000; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        Best regards,<br>
        The Store Team
      </p>
    </div>
  `;

  const text = `Password reset requested. Click here: ${resetLink} (expires in 1 hour). If you didn't request this, ignore this email.`;

  if (user.email) {
    return await sendEmail(user.email, subject, html, text);
  }

  return {
    success: false,
    message: 'No email address provided for password reset'
  };
};