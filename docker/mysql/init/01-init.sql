-- ============================================
-- G-Bridge Database Initialization Script
-- ============================================
-- This script only ensures database charset is correct
-- TypeORM will automatically create all tables from entities when backend starts
-- (NODE_ENV=development in docker-compose.yml enables synchronize: true)

-- Ensure database exists with correct charset
CREATE DATABASE IF NOT EXISTS gbridge_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Grant all privileges to the application user
GRANT ALL PRIVILEGES ON gbridge_db.* TO 'gbridge_user'@'%';
FLUSH PRIVILEGES;
