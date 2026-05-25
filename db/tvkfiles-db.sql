-- TVKFiles MySQL Database
-- Import in XAMPP phpMyAdmin: http://localhost/phpmyadmin
-- Or CLI: mysql -u root < db/tvkfiles-db.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `tvkfiles-db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tvkfiles-db`;

DROP TABLE IF EXISTS `files`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `audit_log`;
DROP TABLE IF EXISTS `incidents`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'viewer',
  `created_at` VARCHAR(30) NOT NULL,
  `last_login` VARCHAR(30) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `login_attempts` INT NOT NULL DEFAULT 0,
  `locked_until` VARCHAR(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `incidents` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `date` VARCHAR(20) NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `source` VARCHAR(255) DEFAULT NULL,
  `source_url` VARCHAR(500) DEFAULT NULL,
  `tags` TEXT,
  `severity` VARCHAR(20) NOT NULL DEFAULT 'medium',
  `status` VARCHAR(50) NOT NULL DEFAULT 'unresolved',
  `submitted_by` VARCHAR(36) DEFAULT NULL,
  `reviewed_by` VARCHAR(36) DEFAULT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` VARCHAR(30) NOT NULL,
  `updated_at` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `files` (
  `id` VARCHAR(36) NOT NULL,
  `incident_id` VARCHAR(36) DEFAULT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `stored_name` VARCHAR(500) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `size` INT NOT NULL,
  `uploaded_by` VARCHAR(36) DEFAULT NULL,
  `created_at` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `incident_id` (`incident_id`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_log` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) DEFAULT NULL,
  `username` VARCHAR(100) DEFAULT NULL,
  `action` VARCHAR(50) NOT NULL,
  `target_type` VARCHAR(50) DEFAULT NULL,
  `target_id` VARCHAR(100) DEFAULT NULL,
  `details` TEXT,
  `ip` VARCHAR(45) DEFAULT NULL,
  `created_at` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT,
  `created_at` VARCHAR(30) NOT NULL,
  `expires_at` VARCHAR(30) NOT NULL,
  `is_revoked` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default users (change passwords after first login!)
-- admin       / Admin@TVK#2025!
-- superadmin  / SuperTVK##Root99!
-- viewer      / Viewer@2025!

INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `created_at`, `is_active`) VALUES
('a1000001-0000-4000-8000-000000000001', 'admin', '$2a$12$dcTKle8V42coT0aurpCC/u9QEHc5PtJV7CPpe94gSPXsx764FjL4W', 'admin', '2025-05-25T00:00:00.000Z', 1),
('a1000002-0000-4000-8000-000000000002', 'superadmin', '$2a$12$d2nMCRMt2J7k000pb.ZOPOIDqDHIn40BqfW0vfGj6uI4ccIQbASDa', 'superadmin', '2025-05-25T00:00:00.000Z', 1),
('a1000003-0000-4000-8000-000000000003', 'viewer', '$2a$12$Cw7hUe/eSjdOBq4enD/rse51QC.aoxamzT5M14sXoCW.Co.ACDAD6', 'viewer', '2025-05-25T00:00:00.000Z', 1);

INSERT INTO `incidents` (`id`, `title`, `description`, `category`, `date`, `district`, `source`, `tags`, `severity`, `status`, `is_published`, `created_at`, `updated_at`) VALUES
('b1000001-0000-4000-8000-000000000001', 'Sand Mining Syndicate Exposed in Delta Districts', 'Multiple TVK-linked members allegedly operating illegal sand quarries in Thanjavur and Tiruvarur districts. Local farmers report coercion and land grabbing.', 'corruption', '2025-05-18', 'Thanjavur', 'The Hindu', 'sand-mining,land-grab,delta', 'high', 'under-investigation', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z'),
('b1000002-0000-4000-8000-000000000002', 'Election Promise: Free Bus Pass for Students — Still Pending', 'TVK''s 2024 manifesto promised free bus passes for all college students within 6 months of taking power. 14 months later, implementation has not begun.', 'broken-promise', '2025-04-30', 'Statewide', 'Dinamalar', 'students,transport,manifesto-2024', 'medium', 'unresolved', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z'),
('b1000003-0000-4000-8000-000000000003', 'Party Cadre Assault on Journalist in Madurai', 'A reporter covering a party rally was physically assaulted by TVK cadre. FIR filed but no arrests made after 3 weeks.', 'crime', '2025-05-10', 'Madurai', 'News18 Tamil', 'press-freedom,violence,cadre', 'high', 'fir-filed', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z'),
('b1000004-0000-4000-8000-000000000004', 'Tender Irregularities in Coimbatore Municipal Contract', '₹42 crore road development tender awarded without competitive bidding. Contractor linked to district party treasurer through shell companies.', 'corruption', '2025-05-02', 'Coimbatore', 'Times of India', 'tender,municipal,shell-company', 'high', 'under-investigation', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z'),
('b1000005-0000-4000-8000-000000000005', 'Ration Shops Closed for 11 Days — Supply Chain Collapse', '340+ ration shops across 4 districts remained non-operational due to supply chain mismanagement by the civil supplies department.', 'admin-failure', '2025-05-15', 'Salem', 'Puthiya Thalaimurai', 'ration,food-security,PDS', 'critical', 'partially-resolved', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z'),
('b1000006-0000-4000-8000-000000000006', 'Custodial Death in Vellore — Probe Delayed 45 Days', 'A 28-year-old man died in police custody. NHRC notice issued. Internal inquiry stalled; family alleges political interference.', 'crime', '2025-04-01', 'Vellore', 'NDTV Tamil', 'police,custodial-death,NHRC', 'critical', 'nhrc-notice', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z'),
('b1000007-0000-4000-8000-000000000007', 'Honour Killing in Madurai — Inter-Caste Couple Murdered', 'A young couple was killed after an inter-caste marriage. Activists allege local party functionaries pressured police to delay arrests of relatives linked to influential cadre.', 'honour-killing', '2025-05-08', 'Madurai', 'The Hindu', 'honour-killing,caste,violence', 'critical', 'under-investigation', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z'),
('b1000008-0000-4000-8000-000000000008', 'Chit Fund Collapse — 2,400 Investors Lose ₹18 Crore', 'A cooperative investment scheme promoted at party events defaulted. Families claim district organisers collected deposits promising guaranteed returns endorsed at public rallies.', 'loss-investments', '2025-05-12', 'Chennai', 'Times of India', 'chit-fund,investment-fraud,depositors', 'critical', 'fir-filed', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z'),
('b1000009-0000-4000-8000-000000000009', 'Instagram Card Fraud — Premium Giveaway Scam Targeting Youth', 'Fake Instagram accounts using party-branded aesthetic cards solicited prepaid card numbers and UPI payments. Cyber cell traced wallets to accounts linked to youth wing coordinators.', 'insta-cards', '2025-05-20', 'Coimbatore', 'News18 Tamil', 'instagram,scam,cyber-crime,youth', 'high', 'under-investigation', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z'),
('b1000010-0000-4000-8000-000000000010', 'Family Alleges Honour Killing Cover-Up in Salem District', 'Woman found dead weeks after filing a harassment complaint against relatives opposing her marriage. NHRC notice sought as investigation moves slowly.', 'honour-killing', '2025-04-22', 'Salem', 'NDTV Tamil', 'honour-killing,NHRC,women-safety', 'high', 'nhrc-notice', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z'),
('b1000011-0000-4000-8000-000000000011', 'Crypto Investment Scheme Promoted Online — ₹6 Crore Lost', 'Social media pages promised 300% returns on crypto deposits. Victims include small traders who invested after endorsements circulated in party-affiliated WhatsApp groups.', 'loss-investments', '2025-05-03', 'Tiruchirappalli', 'Dinamalar', 'crypto,investment-scam,social-media', 'high', 'under-investigation', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z'),
('b1000012-0000-4000-8000-000000000012', 'Fake Instagram Verification Cards Sold to Aspiring Influencers', 'Fraudsters sold counterfeit verified creator cards via Instagram DMs, collecting fees from college students. Several accounts reused official event photo backdrops.', 'insta-cards', '2025-05-16', 'Chennai', 'Puthiya Thalaimurai', 'instagram,fake-verification,influencer-scam', 'medium', 'unresolved', 1, '2025-05-25T00:00:00.000Z', '2025-05-25T00:00:00.000Z');

SET FOREIGN_KEY_CHECKS = 1;
