-- Create master languages table
CREATE TABLE IF NOT EXISTS `master_languages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert master languages
INSERT INTO `master_languages` (`id`, `name`, `code`) VALUES
(1, 'English', 'en'),
(2, 'Vietnamese', 'vi'),
(3, 'French', 'fr'),
(4, 'Spanish', 'es'),
(5, 'Chinese', 'zh'),
(6, 'Japanese', 'ja'),
(7, 'Korean', 'ko')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Update job_required_languages foreign key to reference master_languages
ALTER TABLE `job_required_languages` 
DROP FOREIGN KEY `job_required_languages_ibfk_77`;

ALTER TABLE `job_required_languages`
ADD CONSTRAINT `job_required_languages_ibfk_language`
FOREIGN KEY (`languageId`) REFERENCES `master_languages` (`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
