-- ============================================
-- G-Bridge Seed Data Script
-- ============================================
-- This script seeds initial data for working modes and proficiency levels
-- It runs automatically when MySQL container starts for the first time
-- Note: Tables must be created first (by TypeORM or manually)

USE gbridge_db;

-- Seed Working Modes
-- Insert working modes if they don't exist
INSERT INTO working_modes (name, nameVi, description, createdAt, updatedAt) VALUES
('Full-time', 'Toàn thời gian', 'Full-time employment', NOW(), NOW()),
('Part-time', 'Bán thời gian', 'Part-time employment', NOW(), NOW()),
('Remote', 'Làm việc từ xa', 'Remote work', NOW(), NOW()),
('Hybrid', 'Làm việc kết hợp', 'Hybrid work (remote + office)', NOW(), NOW()),
('Contract', 'Hợp đồng', 'Contract-based work', NOW(), NOW()),
('Freelance', 'Tự do', 'Freelance work', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  nameVi = VALUES(nameVi), 
  description = VALUES(description), 
  updatedAt = NOW();

-- Seed Proficiency Levels
-- Insert proficiency levels if they don't exist
-- Table: levels (columns: id, name, description, `order`, createdAt, updatedAt)
INSERT INTO levels (name, description, `order`, createdAt, updatedAt) VALUES
('Beginner', 'Beginner level proficiency', 1, NOW(), NOW()),
('Elementary', 'Elementary level proficiency', 2, NOW(), NOW()),
('Intermediate', 'Intermediate level proficiency', 3, NOW(), NOW()),
('Upper Intermediate', 'Upper intermediate level proficiency', 4, NOW(), NOW()),
('Advanced', 'Advanced level proficiency', 5, NOW(), NOW()),
('Native', 'Native speaker level', 6, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  description = VALUES(description), 
  `order` = VALUES(`order`), 
  updatedAt = NOW();

