import nodemailer from "nodemailer";
import { logger } from "./Logger.js";

/**
 * Email service for sending emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize email transporter
   */
  initialize() {
    if (this.initialized) return;

    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    console.log("🔧 Initializing Email Service...");
    console.log("SMTP Config:", {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      hasPassword: !!config.auth.pass,
    });

    // Validate configuration
    if (!config.host || !config.auth.user || !config.auth.pass) {
      console.warn(
        "⚠️ SMTP configuration incomplete. Email sending will be disabled."
      );
      console.warn("Missing:", {
        host: !config.host,
        user: !config.auth.user,
        pass: !config.auth.pass,
      });
      logger.warn(
        "SMTP configuration incomplete. Email sending will be disabled."
      );
      this.initialized = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(config);
      this.initialized = true;
      console.log("✅ Email service initialized successfully");
      logger.info("Email service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize email service:", error);
      logger.error("Failed to initialize email service:", error);
      this.initialized = false;
    }
  }

  /**
   * Send password reset email
   * @param {string} to - Recipient email
   * @param {string} resetUrl - Password reset URL
   * @returns {Promise<boolean>} Success status
   */
  async sendPasswordResetEmail(to, resetUrl) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.transporter) {
      console.error(
        "❌ Email service not configured. Cannot send password reset email."
      );
      logger.error(
        "Email service not configured. Cannot send password reset email."
      );
      return false;
    }

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || "G-Bridge"}" <${
        process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
      }>`,
      to,
      subject: "Reset Your Password - G-Bridge",
      html: this.getPasswordResetTemplate(resetUrl),
      text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
    };

    console.log("📧 Attempting to send password reset email...");
    console.log("To:", to);
    console.log("From:", mailOptions.from);

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Password reset email sent successfully!");
      console.log("Message ID:", info.messageId);
      console.log("Response:", info.response);
      logger.info(`Password reset email sent to ${to}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to send password reset email:", error.message);
      console.error("Error details:", error);
      logger.error("Failed to send password reset email:", error);
      return false;
    }
  }

  /**
   * Get HTML template for password reset email
   * @param {string} resetUrl - Password reset URL
   * @returns {string} HTML template
   */
  getPasswordResetTemplate(resetUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333;
      font-size: 20px;
      margin-top: 0;
    }
    .content p {
      color: #666;
      margin: 16px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #e9ecef;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning p {
      margin: 0;
      color: #856404;
    }
    .link-text {
      word-break: break-all;
      color: #667eea;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Hello,</h2>
      <p>We received a request to reset your password for your G-Bridge account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p style="margin-top: 30px;">Or copy and paste this link into your browser:</p>
      <p class="link-text">${resetUrl}</p>
      <div class="warning">
        <p><strong>⏱️ This link will expire in 1 hour.</strong></p>
      </div>
      <p style="margin-top: 30px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} G-Bridge. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send welcome email to new users
   * @param {string} to - Recipient email
   * @param {string} fullName - User's full name
   * @returns {Promise<boolean>} Success status
   */
  async sendWelcomeEmail(to, fullName) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.transporter) {
      logger.error("Email service not configured. Cannot send welcome email.");
      return false;
    }

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || "G-Bridge"}" <${
        process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
      }>`,
      to,
      subject: "Welcome to G-Bridge! 🎉",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to G-Bridge!</h1>
    </div>
    <div class="content">
      <h2>Hi ${fullName},</h2>
      <p>Thank you for joining G-Bridge! We're excited to have you on board.</p>
      <p>Start exploring opportunities and connecting with professionals today.</p>
      <a href="${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }" class="button">Get Started</a>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The G-Bridge Team</p>
    </div>
  </div>
</body>
</html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${to}`);
      return true;
    } catch (error) {
      logger.error("Failed to send welcome email:", error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
