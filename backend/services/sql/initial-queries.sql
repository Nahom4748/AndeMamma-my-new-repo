-- 1. Regions Table
CREATE TABLE `regions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `regions` (`name`, `code`) VALUES
('Central', 'central'),
('West', 'west'),
('South', 'south'),
('Southwest', 'southwest'),
('North', 'north'),
('East', 'east');

-- 2. Sectors Table
CREATE TABLE `sectors` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `sectors` (`name`, `code`) VALUES
('Federal', '001'),
('Minster', '002'),
('Bank', '003'),
('Group & Cement', '004'),
('NGO', '005'),
('Bottle', '006'),
('Addis Ababa', '007'),
('University & TVT', '008'),
('Real Estate & Contractor', '009'),
('Paper', '010'),
('Event Organizer & Advertising', '011'),
('Hotel', '012'),
('Embassy & International Brand', '013'),
('PLC', '014'),
('Hospital', '015'),
('Insurance', '016'),
('Media', '017'),
('Car & Airline', '018');

-- 3. Suppliers Table
CREATE TABLE `suppliers` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `company_name` VARCHAR(100) NOT NULL,
  `contact_person` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `region_id` INT(11) NOT NULL,
  `sector_id` INT(11) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  FOREIGN KEY (`sector_id`) REFERENCES `sectors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Janitors Table
CREATE TABLE `janitors` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` INT(11) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `account` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Company Roles
CREATE TABLE `Company_Roles` (
  `company_role_id` INT PRIMARY KEY,
  `company_role_name` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO `Company_Roles` (`company_role_id`, `company_role_name`) VALUES
(1, 'Admin'),
(2, 'Manager'),
(3, 'Data Encoder'),
(4, 'Marketer'),
(5, 'Finance'),
(6, 'Store Keeper'),
(7, 'Production Manager'),
(8, 'Purchaser')
ON DUPLICATE KEY UPDATE `company_role_name` = VALUES(`company_role_name`);

-- 6. Users Table
CREATE TABLE `Users` (
  `user_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone_number` VARCHAR(15) NOT NULL,
  `active_status` TINYINT(1) NOT NULL DEFAULT 1,
  `added_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `company_role_id` INT NOT NULL,
  FOREIGN KEY (`company_role_id`) REFERENCES `Company_Roles`(`company_role_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Emails Table
CREATE TABLE `Emails` (
  `email_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. User Passwords
CREATE TABLE `User_Passwords` (
  `password_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `password_hashed` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Default Admin
INSERT INTO `Users` (`first_name`, `last_name`, `phone_number`, `company_role_id`)
VALUES ('Admin', 'User', '1234567890', 1);

INSERT INTO `Emails` (`user_id`, `email`)
VALUES (LAST_INSERT_ID(), 'admin@andemamma.com');

INSERT INTO `User_Passwords` (`user_id`, `password_hashed`)
VALUES (LAST_INSERT_ID(), 'BCRYPT_PASSWORD_HASH_PLACEHOLDER');


-- Marketer Visit Plans Table
CREATE TABLE `MarketerVisitPlans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `supplier_id` INT NOT NULL,
  `visit_date` DATE NOT NULL,
  `notes` TEXT,
  `type` VARCHAR(225) NOT NULL,
  `status` ENUM('Pending', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;
-- 8. Marketer Visit Plan Items


-- 9. Password Reset Table
CREATE TABLE `Password_Resets` (
  `reset_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `password_id` INT NOT NULL,
  `otp_code` VARCHAR(6) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (`password_id`) REFERENCES `User_Passwords`(`password_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Supplier Marketer Assignments
CREATE TABLE `SupplierMarketerAssignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `supplier_id` INT NOT NULL,
  `marketer_id` INT NOT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`marketer_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
);

-- 11. Paper Types
CREATE TABLE `PaperType` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(10) NOT NULL UNIQUE,
  `description` VARCHAR(255)
);

INSERT INTO `PaperType` (code, description) VALUES
('SW', 'Sorted White Paper'),
('SC', 'Sorted Colored Paper'),
('Mixed', 'Mixed Paper'),
('Carton', 'Carton Boxes'),
('NP', 'Newspapers'),
('Metal', 'Metal Scraps');

-- 12. Collection Types
CREATE TABLE `CollectionType` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO `CollectionType` (name) VALUES ('Instore'), ('Regular');

-- 13. Drivers
CREATE TABLE `Driver` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20)
);

INSERT INTO `Driver` (name, phone) VALUES 
('Sefu', '0911000001'),
('Abrar', '0911000002');

-- 14. Coordinators
CREATE TABLE `CollectionCoordinators` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO `CollectionCoordinators` (name) VALUES 
('Aschalew'),
('Fiseha'),
('Burtukan');

-- 15. Regular Collections
CREATE TABLE `RegularCollection` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `collection_date` DATE NOT NULL,
  `supplier_id` INT NOT NULL,
  `driver_id` INT,
  `janitor_id` INT NOT NULL,
  `total_kg` DECIMAL(10,2),
  `total_bag` INT,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
  FOREIGN KEY (`driver_id`) REFERENCES `Driver`(`id`),
  FOREIGN KEY (`janitor_id`) REFERENCES `janitors`(`id`)
);

CREATE TABLE `RegularCollectionItems` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `regular_collection_id` INT NOT NULL,
  `paper_type_id` INT NOT NULL,
  `kg` DECIMAL(10,2) NOT NULL,
  `bag_count` INT,
  FOREIGN KEY (`regular_collection_id`) REFERENCES `RegularCollection`(`id`),
  FOREIGN KEY (`paper_type_id`) REFERENCES `PaperType`(`id`)
);

-- 16. Instore Collections
CREATE TABLE `InstoreCollection` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `collection_date` DATE NOT NULL,
  `supplier_id` INT NOT NULL,
  `driver_id` INT,
  `janitor_id` INT NOT NULL,
  `collection_coordinator_id` INT NOT NULL,
  `total_kg` DECIMAL(10,2),
  `total_bag` INT,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
  FOREIGN KEY (`driver_id`) REFERENCES `Driver`(`id`),
  FOREIGN KEY (`janitor_id`) REFERENCES `janitors`(`id`),
  FOREIGN KEY (`collection_coordinator_id`) REFERENCES `CollectionCoordinators`(`id`)
);

CREATE TABLE `InstoreCollectionItems` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `instore_collection_id` INT NOT NULL,
  `paper_type_id` INT NOT NULL,
  `kg` DECIMAL(10,2) NOT NULL,
  `bag_count` INT,
  FOREIGN KEY (`instore_collection_id`) REFERENCES `InstoreCollection`(`id`),
  FOREIGN KEY (`paper_type_id`) REFERENCES `PaperType`(`id`)
);

-- 17. Weekly Plan
CREATE TABLE `WeeklyPlan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `plan_date` DATE NOT NULL,
  `collection_type_id` INT NOT NULL,
  `supplier_id` INT NOT NULL,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`collection_type_id`) REFERENCES `CollectionType`(`id`),
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `Users`(`user_id`)
);

-- 18. Moms Handicrafts
CREATE TABLE `Moms_Handicrafts` (
  `mom_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(50) NOT NULL,
  `middle_name` VARCHAR(50),
  `last_name` VARCHAR(50) NOT NULL,
  `phone_number` VARCHAR(15) NOT NULL,
  `address` TEXT,
  `training_level` ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') NOT NULL DEFAULT 'Beginner',
  `bank_account_number` VARCHAR(30),
  `bank_name` VARCHAR(50),
  `account_holder_name` VARCHAR(100),
  `registration_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `active_status` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- 19. Training Progress
CREATE TABLE `Training_Progress` (
  `progress_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `mom_id` INT NOT NULL,
  `training_date` DATE NOT NULL,
  `training_type` VARCHAR(100) NOT NULL,
  `skills_learned` TEXT,
  `trainer_name` VARCHAR(100),
  `next_training_date` DATE,
  `notes` TEXT,
  FOREIGN KEY (`mom_id`) REFERENCES `Moms_Handicrafts`(`mom_id`) ON DELETE CASCADE
) ENGINE=InnoDB;
