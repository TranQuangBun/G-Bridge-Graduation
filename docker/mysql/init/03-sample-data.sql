-- ============================================
-- G-Bridge Sample Data Script
-- ============================================
-- This script creates sample interpreters and jobs for testing
-- Run this after the database is initialized and seeded
-- Prerequisites: working_modes, levels, domains must exist

USE gbridge_db;

-- ============================================
-- 0. CREATE SAMPLE DOMAINS (if not exists)
-- ============================================
INSERT INTO domains (name, nameVi, description, createdAt, updatedAt) VALUES
('Business', 'Kinh doanh', 'Business and commerce interpretation', NOW(), NOW()),
('Medical', 'Y tế', 'Healthcare and medical interpretation', NOW(), NOW()),
('Legal', 'Pháp lý', 'Legal and court interpretation', NOW(), NOW()),
('Technical', 'Kỹ thuật', 'Technical and engineering interpretation', NOW(), NOW()),
('Education', 'Giáo dục', 'Education and academic interpretation', NOW(), NOW()),
('Tourism', 'Du lịch', 'Travel and tourism interpretation', NOW(), NOW()),
('Conference', 'Hội nghị', 'Conference and event interpretation', NOW(), NOW()),
('Media', 'Truyền thông', 'Media and entertainment interpretation', NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- ============================================
-- 1. CREATE SAMPLE ORGANIZATIONS
-- ============================================
INSERT INTO organizations (name, description, address, province, phone, email, website, logo, isActive, createdAt, updatedAt) VALUES
('VinGroup Corporation', 'Leading Vietnamese conglomerate', '458 Minh Khai, Hai Ba Trung, Hanoi', 'Hanoi', '+84-24-3974-9999', 'contact@vingroup.net', 'https://vingroup.net', NULL, 1, NOW(), NOW()),
('FPT Software', 'IT services and software company', '10 Pham Van Bach, Cau Giay, Hanoi', 'Hanoi', '+84-24-3201-2345', 'hr@fpt.com.vn', 'https://fptsoftware.com', NULL, 1, NOW(), NOW()),
('Grab Vietnam', 'Southeast Asian technology company', '79 Nguyen Hue, Ben Nghe, District 1, HCMC', 'Ho Chi Minh City', '+84-28-3822-9999', 'careers@grab.com', 'https://grab.com/vn', NULL, 1, NOW(), NOW()),
('Samsung Vietnam', 'Electronics manufacturing', 'Yen Phong Industrial Park, Bac Ninh', 'Bac Ninh', '+84-222-3826-888', 'info@samsung.vn', 'https://samsung.com/vn', NULL, 1, NOW(), NOW()),
('Viettel Group', 'Telecommunications company', '57 Huynh Thuc Khang, Dong Da, Hanoi', 'Hanoi', '+84-24-3557-2020', 'contact@viettel.com.vn', 'https://viettel.com.vn', NULL, 1, NOW(), NOW()),
('VietnamWorks', 'Recruitment and job search platform', '101 Nguyen Du, Ben Nghe, District 1, HCMC', 'Ho Chi Minh City', '+84-28-3930-2211', 'info@vietnamworks.com', 'https://vietnamworks.com', NULL, 1, NOW(), NOW()),
('VNG Corporation', 'Technology and internet company', '182 Le Dai Hanh, Ward 15, District 11, HCMC', 'Ho Chi Minh City', '+84-28-3930-5000', 'contact@vng.com.vn', 'https://vng.com.vn', NULL, 1, NOW(), NOW()),
('Shopee Vietnam', 'E-commerce platform', 'Saigon Centre, 65 Le Loi, Ben Nghe, District 1, HCMC', 'Ho Chi Minh City', '+84-19-3456-7890', 'careers@shopee.vn', 'https://shopee.vn', NULL, 1, NOW(), NOW());

-- ============================================
-- 2. CREATE SAMPLE INTERPRETER USERS
-- ============================================
-- Password for all: Password123! (hashed with bcrypt)
INSERT INTO users (fullName, email, passwordHash, role, phone, address, avatar, isActive, isVerified, isPremium, createdAt, updatedAt) VALUES
('Nguyen Thi Minh Anh', 'minhanh@gmail.com', '$2b$10$YourHashedPasswordHere1', 'interpreter', '+84-90-123-4567', '123 Tran Hung Dao, Hoan Kiem, Hanoi', NULL, 1, 1, 1, NOW(), NOW()),
('Tran Van Hoang', 'hoang.tran@gmail.com', '$2b$10$YourHashedPasswordHere2', 'interpreter', '+84-91-234-5678', '456 Nguyen Trai, District 1, HCMC', NULL, 1, 1, 1, NOW(), NOW()),
('Le Thi Thu Ha', 'thuha.le@gmail.com', '$2b$10$YourHashedPasswordHere3', 'interpreter', '+84-92-345-6789', '789 Ly Thuong Kiet, Hai Chau, Da Nang', NULL, 1, 1, 0, NOW(), NOW()),
('Pham Minh Duc', 'minhduc.pham@gmail.com', '$2b$10$YourHashedPasswordHere4', 'interpreter', '+84-93-456-7890', '321 Le Loi, Nha Trang, Khanh Hoa', NULL, 1, 1, 1, NOW(), NOW()),
('Vo Thi Kim Ngan', 'kimngan.vo@gmail.com', '$2b$10$YourHashedPasswordHere5', 'interpreter', '+84-94-567-8901', '654 Bach Dang, Hai Phong', NULL, 1, 1, 0, NOW(), NOW()),
('Do Van Thanh', 'thanh.do@gmail.com', '$2b$10$YourHashedPasswordHere6', 'interpreter', '+84-95-678-9012', '987 Tran Phu, Vung Tau', NULL, 1, 1, 1, NOW(), NOW()),
('Bui Thi Lan Huong', 'lanhuong.bui@gmail.com', '$2b$10$YourHashedPasswordHere7', 'interpreter', '+84-96-789-0123', '147 Nguyen Hue, Hue', NULL, 1, 1, 0, NOW(), NOW()),
('Dang Van Quang', 'quang.dang@gmail.com', '$2b$10$YourHashedPasswordHere8', 'interpreter', '+84-97-890-1234', '258 Phan Chu Trinh, Can Tho', NULL, 1, 1, 1, NOW(), NOW());

-- ============================================
-- 3. CREATE INTERPRETER PROFILES
-- ============================================
INSERT INTO interpreter_profiles (userId, languages, experience, hourlyRate, currency, rating, totalReviews, completedJobs, specializations, availability, verificationStatus, profileCompleteness, isAvailable) VALUES
((SELECT id FROM users WHERE email = 'minhanh@gmail.com' LIMIT 1), '["English", "Vietnamese"]', 8, 45.00, 'USD', 4.9, 127, 95, '["Business", "Conference", "Legal"]', '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": false, "sunday": false}', 'verified', 100, 1),
((SELECT id FROM users WHERE email = 'hoang.tran@gmail.com' LIMIT 1), '["Korean", "Vietnamese", "English"]', 6, 50.00, 'USD', 4.8, 95, 78, '["Technical", "Business", "Media"]', '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": false}', 'verified', 100, 1),
((SELECT id FROM users WHERE email = 'thuha.le@gmail.com' LIMIT 1), '["English", "French", "Vietnamese"]', 5, 40.00, 'USD', 4.7, 82, 64, '["Medical", "Healthcare", "Conference"]', '{"monday": true, "tuesday": false, "wednesday": true, "thursday": true, "friday": true, "saturday": false, "sunday": false}', 'verified', 95, 1),
((SELECT id FROM users WHERE email = 'minhduc.pham@gmail.com' LIMIT 1), '["Japanese", "Vietnamese", "English"]', 10, 55.00, 'USD', 4.95, 156, 142, '["Technical", "Business", "Manufacturing"]', '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": true}', 'verified', 100, 1),
((SELECT id FROM users WHERE email = 'kimngan.vo@gmail.com' LIMIT 1), '["English", "Chinese", "Vietnamese"]', 4, 35.00, 'USD', 4.6, 68, 52, '["Tourism", "Hospitality", "Conference"]', '{"monday": false, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": true}', 'pending', 85, 1),
((SELECT id FROM users WHERE email = 'thanh.do@gmail.com' LIMIT 1), '["English", "Vietnamese"]', 12, 60.00, 'USD', 4.92, 203, 189, '["Legal", "Court", "Business"]', '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": false, "sunday": false}', 'verified', 100, 1),
((SELECT id FROM users WHERE email = 'lanhuong.bui@gmail.com' LIMIT 1), '["English", "German", "Vietnamese"]', 5, 38.00, 'USD', 4.75, 91, 73, '["Education", "Academic", "Conference"]', '{"monday": true, "tuesday": true, "wednesday": true, "thursday": false, "friday": true, "saturday": true, "sunday": false}', 'verified', 92, 1),
((SELECT id FROM users WHERE email = 'quang.dang@gmail.com' LIMIT 1), '["Chinese", "Vietnamese", "English"]', 7, 48.00, 'USD', 4.85, 134, 118, '["Business", "Trade", "Legal"]', '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": false}', 'verified', 98, 1);

-- ============================================
-- 4. CREATE INTERPRETER LANGUAGES (User-Language Relationship)
-- ============================================
INSERT INTO languages (userId, name, proficiencyLevel, canSpeak, canWrite, canRead, yearsOfExperience, isActive) VALUES
-- User 1: English-Vietnamese
((SELECT id FROM users WHERE email = 'minhanh@gmail.com' LIMIT 1), 'English', 'Advanced', 1, 1, 1, 8, 1),
((SELECT id FROM users WHERE email = 'minhanh@gmail.com' LIMIT 1), 'Vietnamese', 'Native', 1, 1, 1, 20, 1),

-- User 2: Korean-Vietnamese-English
((SELECT id FROM users WHERE email = 'hoang.tran@gmail.com' LIMIT 1), 'Korean', 'Advanced', 1, 1, 1, 6, 1),
((SELECT id FROM users WHERE email = 'hoang.tran@gmail.com' LIMIT 1), 'Vietnamese', 'Native', 1, 1, 1, 25, 1),
((SELECT id FROM users WHERE email = 'hoang.tran@gmail.com' LIMIT 1), 'English', 'Intermediate', 1, 1, 1, 4, 1),

-- User 3: English-French-Vietnamese
((SELECT id FROM users WHERE email = 'thuha.le@gmail.com' LIMIT 1), 'English', 'Advanced', 1, 1, 1, 5, 1),
((SELECT id FROM users WHERE email = 'thuha.le@gmail.com' LIMIT 1), 'French', 'Advanced', 1, 1, 1, 5, 1),
((SELECT id FROM users WHERE email = 'thuha.le@gmail.com' LIMIT 1), 'Vietnamese', 'Native', 1, 1, 1, 28, 1),

-- User 4: Japanese-Vietnamese-English
((SELECT id FROM users WHERE email = 'minhduc.pham@gmail.com' LIMIT 1), 'Japanese', 'Advanced', 1, 1, 1, 10, 1),
((SELECT id FROM users WHERE email = 'minhduc.pham@gmail.com' LIMIT 1), 'Vietnamese', 'Native', 1, 1, 1, 32, 1),
((SELECT id FROM users WHERE email = 'minhduc.pham@gmail.com' LIMIT 1), 'English', 'Intermediate', 1, 1, 1, 6, 1),

-- User 5: English-Chinese-Vietnamese
((SELECT id FROM users WHERE email = 'kimngan.vo@gmail.com' LIMIT 1), 'English', 'Intermediate', 1, 1, 1, 4, 1),
((SELECT id FROM users WHERE email = 'kimngan.vo@gmail.com' LIMIT 1), 'Chinese', 'Intermediate', 1, 1, 1, 3, 1),
((SELECT id FROM users WHERE email = 'kimngan.vo@gmail.com' LIMIT 1), 'Vietnamese', 'Native', 1, 1, 1, 24, 1),

-- User 6: English-Vietnamese (Legal)
((SELECT id FROM users WHERE email = 'thanh.do@gmail.com' LIMIT 1), 'English', 'Advanced', 1, 1, 1, 12, 1),
((SELECT id FROM users WHERE email = 'thanh.do@gmail.com' LIMIT 1), 'Vietnamese', 'Native', 1, 1, 1, 35, 1),

-- User 7: English-German-Vietnamese
((SELECT id FROM users WHERE email = 'lanhuong.bui@gmail.com' LIMIT 1), 'English', 'Advanced', 1, 1, 1, 5, 1),
((SELECT id FROM users WHERE email = 'lanhuong.bui@gmail.com' LIMIT 1), 'German', 'Intermediate', 1, 1, 1, 3, 1),
((SELECT id FROM users WHERE email = 'lanhuong.bui@gmail.com' LIMIT 1), 'Vietnamese', 'Native', 1, 1, 1, 27, 1),

-- User 8: Chinese-Vietnamese-English
((SELECT id FROM users WHERE email = 'quang.dang@gmail.com' LIMIT 1), 'Chinese', 'Advanced', 1, 1, 1, 7, 1),
((SELECT id FROM users WHERE email = 'quang.dang@gmail.com' LIMIT 1), 'Vietnamese', 'Native', 1, 1, 1, 30, 1),
((SELECT id FROM users WHERE email = 'quang.dang@gmail.com' LIMIT 1), 'English', 'Intermediate', 1, 1, 1, 5, 1);

-- ============================================
-- 5. CREATE SAMPLE JOBS
-- ============================================
INSERT INTO jobs (organizationId, workingModeId, title, province, commune, address, expirationDate, quantity, descriptions, responsibility, benefits, minSalary, maxSalary, salaryType, contactEmail, contactPhone, statusOpenStop, createdDate, createdAt, updatedAt) VALUES
-- Job 1: VinGroup - English Interpreter
(1, (SELECT id FROM working_modes WHERE name = 'Full-time' LIMIT 1), 'Senior English-Vietnamese Interpreter', 'Hanoi', 'Hai Ba Trung', '458 Minh Khai, Hai Ba Trung, Hanoi', DATE_ADD(NOW(), INTERVAL 30 DAY), 2, 
'VinGroup is seeking experienced English-Vietnamese interpreters to support our international business operations and executive meetings.', 
'Interpret during executive meetings, business negotiations, international conferences, and corporate events. Translate documents and correspondence as needed.', 
'Competitive salary, health insurance, annual bonus, professional development opportunities, dynamic work environment', 
1500, 2500, 'RANGE', 'hr@vingroup.net', '+84-24-3974-9999', 'open', NOW(), NOW(), NOW()),

-- Job 2: FPT Software - Korean Tech Interpreter
(2, (SELECT id FROM working_modes WHERE name = 'Full-time' LIMIT 1), 'Korean-Vietnamese Technical Interpreter', 'Hanoi', 'Cau Giay', '10 Pham Van Bach, Cau Giay, Hanoi', DATE_ADD(NOW(), INTERVAL 45 DAY), 3,
'FPT Software needs Korean-Vietnamese interpreters to work with our Korean clients and development teams.',
'Facilitate communication between Korean clients and Vietnamese development teams, interpret technical meetings, translate software documentation and requirements.',
'Attractive salary package, 13th month bonus, health insurance, training programs, modern office facilities',
1800, 2800, 'RANGE', 'hr@fpt.com.vn', '+84-24-3201-2345', 'open', NOW(), NOW(), NOW()),

-- Job 3: Grab - Business Conference Interpreter
(3, (SELECT id FROM working_modes WHERE name = 'Contract' LIMIT 1), 'Conference Interpreter for Regional Meeting', 'Ho Chi Minh City', 'District 1', '79 Nguyen Hue, Ben Nghe, District 1, HCMC', DATE_ADD(NOW(), INTERVAL 15 DAY), 1,
'Grab Vietnam is organizing a regional conference and needs professional interpreters for simultaneous interpretation.',
'Provide simultaneous interpretation for 3-day regional conference, work with international speakers and attendees, ensure smooth communication during presentations and Q&A sessions.',
'Competitive daily rate, accommodation provided, meal allowances, networking opportunities',
500, 800, 'RANGE', 'careers@grab.com', '+84-28-3822-9999', 'open', NOW(), NOW(), NOW()),

-- Job 4: Samsung - Japanese Manufacturing Interpreter
(4, (SELECT id FROM working_modes WHERE name = 'Full-time' LIMIT 1), 'Japanese-Vietnamese Manufacturing Interpreter', 'Bac Ninh', 'Yen Phong', 'Yen Phong Industrial Park, Bac Ninh', DATE_ADD(NOW(), INTERVAL 60 DAY), 2,
'Samsung Vietnam is looking for Japanese-Vietnamese interpreters to support manufacturing operations and technical training.',
'Interpret for Japanese technical experts and Vietnamese workers, translate technical manuals and safety procedures, facilitate training sessions and quality control meetings.',
'Excellent salary, shuttle bus, lunch allowance, health insurance, annual performance bonus, career advancement',
2000, 3000, 'RANGE', 'info@samsung.vn', '+84-222-3826-888', 'open', NOW(), NOW(), NOW()),

-- Job 5: Viettel - Telecommunications Project Interpreter
(5, (SELECT id FROM working_modes WHERE name = 'Part-time' LIMIT 1), 'Part-time English Interpreter for Telecom Projects', 'Hanoi', 'Dong Da', '57 Huynh Thuc Khang, Dong Da, Hanoi', DATE_ADD(NOW(), INTERVAL 30 DAY), 2,
'Viettel Group needs part-time interpreters to support international telecommunications projects and vendor meetings.',
'Interpret during vendor meetings, technical discussions, and project planning sessions. Flexible schedule with advance notice for assignments.',
'Hourly rate, flexible working hours, professional work environment, opportunity for long-term collaboration',
40, 60, 'RANGE', 'contact@viettel.com.vn', '+84-24-3557-2020', 'open', NOW(), NOW(), NOW()),

-- Job 6: VietnamWorks - Recruitment Event Interpreter
(6, (SELECT id FROM working_modes WHERE name = 'Freelance' LIMIT 1), 'Freelance Interpreter for Job Fair Events', 'Ho Chi Minh City', 'District 1', '101 Nguyen Du, Ben Nghe, District 1, HCMC', DATE_ADD(NOW(), INTERVAL 20 DAY), 3,
'VietnamWorks is organizing international job fairs and needs interpreters to assist foreign companies and Vietnamese job seekers.',
'Assist foreign recruiters and Vietnamese candidates during job fair events, interpret during interviews and presentations, help with event coordination.',
'Per-event payment, flexible schedule, networking with international companies, meal provided during events',
300, 500, 'RANGE', 'info@vietnamworks.com', '+84-28-3930-2211', 'open', NOW(), NOW(), NOW()),

-- Job 7: VNG - Gaming & Media Interpreter
(7, (SELECT id FROM working_modes WHERE name = 'Remote' LIMIT 1), 'Remote Chinese-Vietnamese Gaming Content Interpreter', 'Ho Chi Minh City', 'District 11', 'Remote work available', DATE_ADD(NOW(), INTERVAL 40 DAY), 2,
'VNG Corporation needs Chinese-Vietnamese interpreters to localize gaming content and support international partnerships.',
'Translate and localize gaming content, interpret during online meetings with Chinese partners, review and adapt cultural content for Vietnamese market.',
'Competitive salary, remote work flexibility, gaming industry exposure, performance bonuses',
1500, 2200, 'RANGE', 'contact@vng.com.vn', '+84-28-3930-5000', 'open', NOW(), NOW(), NOW()),

-- Job 8: Shopee - E-commerce Customer Success Interpreter
(8, (SELECT id FROM working_modes WHERE name = 'Hybrid' LIMIT 1), 'Customer Success Interpreter (English-Vietnamese)', 'Ho Chi Minh City', 'District 1', 'Saigon Centre, 65 Le Loi, Ben Nghe, District 1, HCMC', DATE_ADD(NOW(), INTERVAL 35 DAY), 4,
'Shopee Vietnam is expanding and needs interpreters to support our customer success and merchant operations teams.',
'Interpret for customer success team meetings, assist in merchant onboarding, translate customer feedback and market research, support cross-border e-commerce communications.',
'Competitive package, hybrid work model, health insurance, team building activities, career growth in tech industry',
1400, 2100, 'RANGE', 'careers@shopee.vn', '+84-19-3456-7890', 'open', NOW(), NOW(), NOW());

-- ============================================
-- 6. LINK JOBS WITH DOMAINS
-- ============================================
INSERT INTO job_has_domains (jobId, domainId) VALUES
(1, (SELECT id FROM domains WHERE name = 'Business' LIMIT 1)),
(2, (SELECT id FROM domains WHERE name = 'Technical' LIMIT 1)),
(3, (SELECT id FROM domains WHERE name = 'Conference' LIMIT 1)),
(4, (SELECT id FROM domains WHERE name = 'Technical' LIMIT 1)),
(5, (SELECT id FROM domains WHERE name = 'Business' LIMIT 1)),
(6, (SELECT id FROM domains WHERE name = 'Business' LIMIT 1)),
(7, (SELECT id FROM domains WHERE name = 'Media' LIMIT 1)),
(8, (SELECT id FROM domains WHERE name = 'Business' LIMIT 1));

-- ============================================
-- 7. LINK JOBS WITH REQUIRED LANGUAGES
-- ============================================
-- Note: Job required languages link to user-specific language records
-- We reference the interpreter language records created above

-- Job 1: Requires English (Advanced) and Vietnamese (Native)
INSERT INTO job_required_languages (jobId, languageId, levelId, isSourceLanguage) VALUES
(1, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhanh@gmail.com') AND name = 'English' LIMIT 1), (SELECT id FROM levels WHERE name = 'Advanced' LIMIT 1), 0),
(1, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhanh@gmail.com') AND name = 'Vietnamese' LIMIT 1), (SELECT id FROM levels WHERE name = 'Native' LIMIT 1), 1);

-- Job 2: Requires Korean (Advanced) and Vietnamese (Native)
INSERT INTO job_required_languages (jobId, languageId, levelId, isSourceLanguage) VALUES
(2, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'hoang.tran@gmail.com') AND name = 'Korean' LIMIT 1), (SELECT id FROM levels WHERE name = 'Advanced' LIMIT 1), 0),
(2, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'hoang.tran@gmail.com') AND name = 'Vietnamese' LIMIT 1), (SELECT id FROM levels WHERE name = 'Native' LIMIT 1), 1);

-- Job 3: Requires English (Advanced) and Vietnamese (Native)
INSERT INTO job_required_languages (jobId, languageId, levelId, isSourceLanguage) VALUES
(3, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhanh@gmail.com') AND name = 'English' LIMIT 1), (SELECT id FROM levels WHERE name = 'Advanced' LIMIT 1), 0),
(3, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhanh@gmail.com') AND name = 'Vietnamese' LIMIT 1), (SELECT id FROM levels WHERE name = 'Native' LIMIT 1), 1);

-- Job 4: Requires Japanese (Advanced) and Vietnamese (Native)
INSERT INTO job_required_languages (jobId, languageId, levelId, isSourceLanguage) VALUES
(4, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhduc.pham@gmail.com') AND name = 'Japanese' LIMIT 1), (SELECT id FROM levels WHERE name = 'Advanced' LIMIT 1), 0),
(4, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhduc.pham@gmail.com') AND name = 'Vietnamese' LIMIT 1), (SELECT id FROM levels WHERE name = 'Native' LIMIT 1), 1);

-- Job 5: Requires English (Intermediate) and Vietnamese (Native)
INSERT INTO job_required_languages (jobId, languageId, levelId, isSourceLanguage) VALUES
(5, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhanh@gmail.com') AND name = 'English' LIMIT 1), (SELECT id FROM levels WHERE name = 'Intermediate' LIMIT 1), 0),
(5, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhanh@gmail.com') AND name = 'Vietnamese' LIMIT 1), (SELECT id FROM levels WHERE name = 'Native' LIMIT 1), 1);

-- Job 6: Requires English (Intermediate) and Vietnamese (Native)
INSERT INTO job_required_languages (jobId, languageId, levelId, isSourceLanguage) VALUES
(6, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhanh@gmail.com') AND name = 'English' LIMIT 1), (SELECT id FROM levels WHERE name = 'Intermediate' LIMIT 1), 0),
(6, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhanh@gmail.com') AND name = 'Vietnamese' LIMIT 1), (SELECT id FROM levels WHERE name = 'Native' LIMIT 1), 1);

-- Job 7: Requires Chinese (Advanced) and Vietnamese (Native)
INSERT INTO job_required_languages (jobId, languageId, levelId, isSourceLanguage) VALUES
(7, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'quang.dang@gmail.com') AND name = 'Chinese' LIMIT 1), (SELECT id FROM levels WHERE name = 'Advanced' LIMIT 1), 0),
(7, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'quang.dang@gmail.com') AND name = 'Vietnamese' LIMIT 1), (SELECT id FROM levels WHERE name = 'Native' LIMIT 1), 1);

-- Job 8: Requires English (Advanced) and Vietnamese (Native)
INSERT INTO job_required_languages (jobId, languageId, levelId, isSourceLanguage) VALUES
(8, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhanh@gmail.com') AND name = 'English' LIMIT 1), (SELECT id FROM levels WHERE name = 'Advanced' LIMIT 1), 0),
(8, (SELECT id FROM languages WHERE userId = (SELECT id FROM users WHERE email = 'minhanh@gmail.com') AND name = 'Vietnamese' LIMIT 1), (SELECT id FROM levels WHERE name = 'Native' LIMIT 1), 1);

-- ============================================
-- SAMPLE DATA CREATION COMPLETED
-- ============================================
