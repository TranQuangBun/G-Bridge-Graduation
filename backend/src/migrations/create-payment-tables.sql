-- =====================================================
-- PAYMENT SYSTEM TABLES
-- =====================================================
-- Created: 2025-10-20
-- Purpose: Tables for VNPay and PayPal payment integration
-- =====================================================

-- 1. SUBSCRIPTION PLANS TABLE
-- Stores available subscription plans (Basic, Pro, Enterprise)
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Plan name: Basic, Pro, Enterprise',
  `displayName` VARCHAR(100) NOT NULL COMMENT 'Display name in UI',
  `description` TEXT COMMENT 'Plan description',
  `price` DECIMAL(10, 2) NOT NULL COMMENT 'Price in USD',
  `currency` VARCHAR(3) DEFAULT 'USD' COMMENT 'Currency code: USD, VND',
  `duration` INT NOT NULL COMMENT 'Duration in days (30, 365)',
  `durationType` ENUM('monthly', 'yearly', 'lifetime') DEFAULT 'monthly',
  `features` JSON COMMENT 'Array of features included in this plan',
  `maxInterpreterViews` INT DEFAULT NULL COMMENT 'Max interpreter profiles can view per month',
  `maxJobPosts` INT DEFAULT NULL COMMENT 'Max job posts per month',
  `isActive` BOOLEAN DEFAULT TRUE COMMENT 'Is this plan available for purchase',
  `sortOrder` INT DEFAULT 0 COMMENT 'Display order in pricing page',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_active` (`isActive`),
  INDEX `idx_sort` (`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Subscription plans configuration';

-- 2. PAYMENTS TABLE
-- Stores all payment transactions
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `userId` INT UNSIGNED NOT NULL COMMENT 'User who made the payment',
  `planId` INT UNSIGNED NOT NULL COMMENT 'Subscription plan purchased',
  `orderId` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Internal order ID',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT 'Payment amount',
  `currency` VARCHAR(3) DEFAULT 'USD' COMMENT 'Currency code',
  `status` ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
  `paymentMethod` ENUM('vnpay', 'paypal', 'credit_card', 'bank_transfer') NOT NULL,
  `paymentGateway` ENUM('vnpay', 'paypal') NOT NULL COMMENT 'Payment gateway used',
  
  -- VNPay specific fields
  `vnpayTransactionNo` VARCHAR(100) COMMENT 'VNPay transaction number',
  `vnpayBankCode` VARCHAR(50) COMMENT 'VNPay bank code',
  `vnpayCardType` VARCHAR(50) COMMENT 'VNPay card type',
  `vnpayOrderInfo` TEXT COMMENT 'VNPay order info',
  `vnpaySecureHash` VARCHAR(255) COMMENT 'VNPay secure hash',
  
  -- PayPal specific fields
  `paypalOrderId` VARCHAR(100) COMMENT 'PayPal order ID',
  `paypalPayerId` VARCHAR(100) COMMENT 'PayPal payer ID',
  `paypalPaymentId` VARCHAR(100) COMMENT 'PayPal payment ID',
  `paypalCaptureId` VARCHAR(100) COMMENT 'PayPal capture ID',
  
  -- Common fields
  `transactionId` VARCHAR(255) COMMENT 'Payment gateway transaction ID',
  `paymentData` JSON COMMENT 'Full payment response data from gateway',
  `ipAddress` VARCHAR(45) COMMENT 'User IP address',
  `userAgent` TEXT COMMENT 'User browser agent',
  `description` TEXT COMMENT 'Payment description',
  `notes` TEXT COMMENT 'Additional notes',
  
  -- Timestamps
  `paidAt` TIMESTAMP NULL COMMENT 'When payment was completed',
  `refundedAt` TIMESTAMP NULL COMMENT 'When payment was refunded',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Indexes
  INDEX `idx_user_id` (`userId`),
  INDEX `idx_plan_id` (`planId`),
  INDEX `idx_order_id` (`orderId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_payment_gateway` (`paymentGateway`),
  INDEX `idx_created_at` (`createdAt`),
  INDEX `idx_vnpay_transaction` (`vnpayTransactionNo`),
  INDEX `idx_paypal_order` (`paypalOrderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Payment transactions';

-- 3. USER SUBSCRIPTIONS TABLE
-- Stores active subscriptions for users
CREATE TABLE IF NOT EXISTS `user_subscriptions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `userId` INT UNSIGNED NOT NULL COMMENT 'Subscriber user ID',
  `planId` INT UNSIGNED NOT NULL COMMENT 'Current subscription plan',
  `paymentId` INT UNSIGNED COMMENT 'Initial payment that created this subscription',
  `status` ENUM('active', 'expired', 'cancelled', 'suspended') DEFAULT 'active',
  `startDate` DATETIME NOT NULL COMMENT 'Subscription start date',
  `endDate` DATETIME NOT NULL COMMENT 'Subscription end date',
  `autoRenew` BOOLEAN DEFAULT FALSE COMMENT 'Auto-renewal enabled',
  `cancelledAt` TIMESTAMP NULL COMMENT 'When subscription was cancelled',
  `cancellationReason` TEXT COMMENT 'Reason for cancellation',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Indexes
  INDEX `idx_user_id` (`userId`),
  INDEX `idx_plan_id` (`planId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_end_date` (`endDate`),
  INDEX `idx_user_status` (`userId`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User subscription records';

-- 4. PAYMENT WEBHOOKS TABLE
-- Stores webhook/IPN notifications from payment gateways
CREATE TABLE IF NOT EXISTS `payment_webhooks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `paymentId` INT UNSIGNED COMMENT 'Related payment ID if found',
  `gateway` ENUM('vnpay', 'paypal') NOT NULL COMMENT 'Payment gateway',
  `eventType` VARCHAR(100) COMMENT 'Webhook event type',
  `orderId` VARCHAR(100) COMMENT 'Order ID from webhook',
  `transactionId` VARCHAR(255) COMMENT 'Transaction ID from webhook',
  `status` VARCHAR(50) COMMENT 'Status from webhook',
  `rawData` JSON NOT NULL COMMENT 'Full webhook payload',
  `ipAddress` VARCHAR(45) COMMENT 'Webhook sender IP',
  `processed` BOOLEAN DEFAULT FALSE COMMENT 'Has this webhook been processed',
  `processedAt` TIMESTAMP NULL COMMENT 'When webhook was processed',
  `errorMessage` TEXT COMMENT 'Error if processing failed',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key
  FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Indexes
  INDEX `idx_payment_id` (`paymentId`),
  INDEX `idx_gateway` (`gateway`),
  INDEX `idx_order_id` (`orderId`),
  INDEX `idx_processed` (`processed`),
  INDEX `idx_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Payment gateway webhook logs';

-- 5. PAYMENT REFUNDS TABLE
-- Stores refund requests and records
CREATE TABLE IF NOT EXISTS `payment_refunds` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `paymentId` INT UNSIGNED NOT NULL COMMENT 'Original payment ID',
  `userId` INT UNSIGNED NOT NULL COMMENT 'User requesting refund',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT 'Refund amount',
  `currency` VARCHAR(3) DEFAULT 'USD',
  `reason` TEXT COMMENT 'Refund reason',
  `status` ENUM('pending', 'processing', 'completed', 'rejected') DEFAULT 'pending',
  `refundTransactionId` VARCHAR(255) COMMENT 'Refund transaction ID from gateway',
  `processedBy` INT UNSIGNED COMMENT 'Admin user who processed the refund',
  `processedAt` TIMESTAMP NULL COMMENT 'When refund was processed',
  `notes` TEXT COMMENT 'Admin notes',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`processedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Indexes
  INDEX `idx_payment_id` (`paymentId`),
  INDEX `idx_user_id` (`userId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Payment refund records';

-- =====================================================
-- SEED DATA: Default Subscription Plans
-- =====================================================

INSERT INTO `subscription_plans` (`name`, `displayName`, `description`, `price`, `currency`, `duration`, `durationType`, `features`, `maxInterpreterViews`, `maxJobPosts`, `isActive`, `sortOrder`) VALUES
('free', 'Free Plan', 'Basic access with limited features', 0.00, 'USD', 30, 'monthly', 
 JSON_ARRAY('View limited interpreter profiles', 'Post 1 job per month', 'Basic support'), 
 5, 1, TRUE, 1),

('basic', 'Basic Plan', 'Essential features for individuals', 5.00, 'USD', 30, 'monthly', 
 JSON_ARRAY('View 50 interpreter profiles per month', 'Post 5 jobs per month', 'Email support', 'View interpreter contact info', 'Download interpreter profiles'), 
 50, 5, TRUE, 2),

('pro', 'Professional Plan', 'Advanced features for businesses', 12.00, 'USD', 30, 'monthly', 
 JSON_ARRAY('Unlimited interpreter views', 'Post unlimited jobs', 'Priority support', 'Advanced search filters', 'Save favorite interpreters', 'Direct messaging', 'Analytics dashboard'), 
 NULL, NULL, TRUE, 3),

('enterprise', 'Enterprise Plan', 'Complete solution for large organizations', 20.00, 'USD', 30, 'monthly', 
 JSON_ARRAY('Everything in Pro', 'Dedicated account manager', '24/7 phone support', 'Custom integrations', 'Team collaboration tools', 'White-label option', 'API access'), 
 NULL, NULL, TRUE, 4);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX `idx_payments_user_status` ON `payments` (`userId`, `status`);
CREATE INDEX `idx_payments_gateway_status` ON `payments` (`paymentGateway`, `status`);
CREATE INDEX `idx_subscriptions_user_active` ON `user_subscriptions` (`userId`, `status`, `endDate`);

-- =====================================================
-- COMPLETED
-- =====================================================
