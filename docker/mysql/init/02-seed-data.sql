-- ============================================
-- G-Bridge Seed Data Script
-- ============================================
-- This script seeds MINIMUM REQUIRED reference data for the project:
-- - Domains (interpretation domains)
-- - Working Modes
-- - Proficiency Levels
-- - Application Statuses
-- - Subscription Plans
-- 
-- It runs automatically when MySQL container starts for the first time
-- Note: Tables must be created first (by TypeORM or manually)

USE gbridge_db;

-- Seed Domains
-- Insert domains if they don't exist (only if table exists)
-- Note: Tables are created by TypeORM synchronize, so this will only work after tables are created
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'gbridge_db' AND table_name = 'domains');

SET @sql = IF(@table_exists > 0,
  'INSERT INTO domains (name, nameVi, description, createdAt, updatedAt) VALUES
('Medical', 'Y tế', 'Medical interpretation', NOW(), NOW()),
('Legal', 'Pháp lý', 'Legal interpretation', NOW(), NOW()),
('Business', 'Kinh doanh', 'Business interpretation', NOW(), NOW()),
('Technical', 'Kỹ thuật', 'Technical interpretation', NOW(), NOW()),
('Conference', 'Hội nghị', 'Conference interpretation', NOW(), NOW()),
('Education', 'Giáo dục', 'Education interpretation', NOW(), NOW()),
('Tourism', 'Du lịch', 'Tourism interpretation', NOW(), NOW()),
('Media', 'Truyền thông', 'Media interpretation', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  nameVi = VALUES(nameVi), 
  description = VALUES(description), 
  updatedAt = NOW()',
  'SELECT "Skipping domains seed: table does not exist yet" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Seed Working Modes
-- Insert working modes if they don't exist (only if table exists)
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'gbridge_db' AND table_name = 'working_modes');

SET @sql = IF(@table_exists > 0,
  'INSERT INTO working_modes (name, nameVi, description, createdAt, updatedAt) VALUES
('Full-time', 'Toàn thời gian', 'Full-time employment', NOW(), NOW()),
('Part-time', 'Bán thời gian', 'Part-time employment', NOW(), NOW()),
('Remote', 'Làm việc từ xa', 'Remote work', NOW(), NOW()),
('Hybrid', 'Làm việc kết hợp', 'Hybrid work (remote + office)', NOW(), NOW()),
('Contract', 'Hợp đồng', 'Contract-based work', NOW(), NOW()),
('Freelance', 'Tự do', 'Freelance work', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  nameVi = VALUES(nameVi), 
  description = VALUES(description), 
  updatedAt = NOW()',
  'SELECT "Skipping working_modes seed: table does not exist yet" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Seed Proficiency Levels
-- Insert proficiency levels if they don't exist (only if table exists)
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'gbridge_db' AND table_name = 'levels');

SET @sql = IF(@table_exists > 0,
  'INSERT INTO levels (name, description, `order`, createdAt, updatedAt) VALUES
('Beginner', 'Beginner level proficiency', 1, NOW(), NOW()),
('Elementary', 'Elementary level proficiency', 2, NOW(), NOW()),
('Intermediate', 'Intermediate level proficiency', 3, NOW(), NOW()),
('Upper Intermediate', 'Upper intermediate level proficiency', 4, NOW(), NOW()),
('Advanced', 'Advanced level proficiency', 5, NOW(), NOW()),
('Native', 'Native speaker level', 6, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  description = VALUES(description), 
  `order` = VALUES(`order`), 
  updatedAt = NOW()',
  'SELECT "Skipping levels seed: table does not exist yet" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Seed Application Statuses
-- Insert application statuses if they don't exist (only if table exists)
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'gbridge_db' AND table_name = 'application_statuses');

SET @sql = IF(@table_exists > 0,
  'INSERT INTO application_statuses (name, nameVi, description, createdAt, updatedAt) VALUES
('pending', 'Đang chờ', 'Application is pending review', NOW(), NOW()),
('approved', 'Đã chấp nhận', 'Application has been approved', NOW(), NOW()),
('rejected', 'Đã từ chối', 'Application has been rejected', NOW(), NOW()),
('withdrawn', 'Đã rút lại', 'Application has been withdrawn by applicant', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  nameVi = VALUES(nameVi), 
  description = VALUES(description), 
  updatedAt = NOW()',
  'SELECT "Skipping application_statuses seed: table does not exist yet" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Seed Subscription Plans
-- Insert subscription plans if they don't exist (only if table exists)
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'gbridge_db' AND table_name = 'subscription_plans');

SET @sql = IF(@table_exists > 0,
  'INSERT INTO subscription_plans (id, name, displayName, description, price, currency, duration, durationType, features, maxInterpreterViews, maxJobPosts, isActive, sortOrder, createdAt, updatedAt) VALUES
(1, 'free', 'Free', 'Perfect for getting started with basic features', 0.00, 'USD', 1, 'monthly', '["Create interpreter profile", "Apply to 1 job per month", "Basic email notifications", "Community access"]', 5, 1, 1, 1, NOW(), NOW()),
(2, 'pro', 'Pro', 'Most popular plan for professional interpreters', 10.00, 'USD', 1, 'monthly', '["Unlimited job applications", "AI-powered job matching", "Advanced search filters", "Priority customer support", "Export capabilities"]', -1, -1, 1, 2, NOW(), NOW()),
(3, 'team', 'Team', 'Great for growing interpreter teams', 15.00, 'USD', 1, 'monthly', '["Up to 5 team members", "Analytics dashboard", "Shared interpreter pool", "Bulk job posting", "Team roles & permissions", "Priority in search results"]', -1, -1, 1, 3, NOW(), NOW()),
(4, 'enterprise', 'Enterprise', 'Custom solution for large organizations', 21.00, 'USD', 1, 'monthly', '["Unlimited team members", "Dedicated success manager", "Custom integrations", "Advanced security & compliance", "SLA guarantee", "Early access to new features"]', -1, -1, 1, 4, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  displayName = VALUES(displayName), 
  description = VALUES(description), 
  price = VALUES(price), 
  currency = VALUES(currency), 
  duration = VALUES(duration), 
  durationType = VALUES(durationType), 
  features = VALUES(features), 
  maxInterpreterViews = VALUES(maxInterpreterViews), 
  maxJobPosts = VALUES(maxJobPosts), 
  isActive = VALUES(isActive), 
  sortOrder = VALUES(sortOrder), 
  updatedAt = NOW()',
  'SELECT "Skipping subscription_plans seed: table does not exist yet" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

