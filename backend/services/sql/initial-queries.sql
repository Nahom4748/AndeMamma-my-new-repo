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
  `contuct_phone` VARCHAR(20) NOT NULL,
  `location` VARCHAR(100) NOT NULL,
   
  `region_id` INT(11) NOT NULL,
  `sector_id` INT(11) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  FOREIGN KEY (`sector_id`) REFERENCES `sectors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `supplier_history` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` INT(11) NOT NULL,
  `history_details` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE
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
(8, 'Purchaser'),
(9, 'HR'),
(10, 'regular cordination'),
(11, 'operation manager'),
(12, 'driver'),
(13, 'collection coordinator')
ON DUPLICATE KEY UPDATE `company_role_name` = VALUES(`company_role_name`);






-- 6. Users Table
CREATE TABLE `Users` (
  `user_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone_number` VARCHAR(20) NOT NULL,
  `address` VARCHAR(255),
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `join_date` DATE NOT NULL,
  `salary` DECIMAL(10,2) DEFAULT 0,
  `emergency_contact` VARCHAR(100),
  `account_number` VARCHAR(30) UNIQUE,
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
  `feedback` TEXT DEFAULT NULL,
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
  `day` VARCHAR(255),
  `collection_type_id` INT NOT NULL,
  `supplier_id` INT NOT NULL,
  `note` TEXT,
  `created_by` INT NOT NULL,
  `driver_id` INT NULL,
  `coordinator_id` INT NULL,
  `marketer_name` VARCHAR(100) NULL,
  `status` ENUM('pending', 'completed', 'not_completed', 'rejected') DEFAULT 'pending',
  `total_collection_kg` DECIMAL(10,2) NULL,
  `updatedAt` DATETIME NULL,
  `not_completed_date` DATE NULL,
  `rejection_reason` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (`collection_type_id`) REFERENCES `CollectionType`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`supplier_id`) REFERENCES `Suppliers`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `Users`(`user_id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`driver_id`) REFERENCES `Users`(`user_id`)
      ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`coordinator_id`) REFERENCES `Users`(`user_id`)
      ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE item_suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    sector VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  current_stock INT DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  min_stock_level INT DEFAULT 5,
  notes TEXT,
  supplier_id INT,
  collection_date DATE,
  image VARCHAR(255),
  size VARCHAR(50),
  dimension VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES item_suppliers(id)
);
CREATE TABLE IF NOT EXISTS innovations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_name VARCHAR(255) NOT NULL,
  material VARCHAR(255) NOT NULL,
  color VARCHAR(100),
  shape VARCHAR(100),
  height DECIMAL(10,2),
  length DECIMAL(10,2),
  width DECIMAL(10,2),
  void_length DECIMAL(10,2),
  void_height DECIMAL(10,2),
  print_type VARCHAR(255),
  technique VARCHAR(255),
  finishing_material VARCHAR(255),
  special_feature TEXT,
  image_path VARCHAR(500),  -- ✅ store file path, not the image itself
  additional_notes TEXT,
  status ENUM('active', 'archived') DEFAULT 'active',
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sales table
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255),
  customer_contact VARCHAR(255),
  payment_method VARCHAR(50),
  subtotal DECIMAL(10,2),
  vat DECIMAL(10,2),
  total DECIMAL(10,2),
  sale_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sale items table (linked to sales)
CREATE TABLE sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT,
  product_id INT,
  quantity INT,
  unit_price DECIMAL(10,2),
  vat_rate DECIMAL(5,2),
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES items(id)
);

CREATE TABLE mammasproducts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price_with_tube DECIMAL(10,2) NOT NULL,
    price_without_tube DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE mama_dayly_products_make (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mama_id INT NOT NULL,
    product_id INT NOT NULL,
    type ENUM('withTube','withoutTube') NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    days_to_complete DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mama FOREIGN KEY (mama_id) REFERENCES mamas(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES mammasproducts(id) ON DELETE CASCADE,
    INDEX idx_mama_id (mama_id),
    INDEX idx_product_id (product_id)
);
CREATE TABLE MarketerOrders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  marketer_id INT NOT NULL,
  intention_date DATETIME NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  estimated_kg DECIMAL(10,2) NOT NULL,
  require_shredder BOOLEAN DEFAULT FALSE,
  additional_notes TEXT,
  status ENUM('active','completed','cancelled','onprocess') DEFAULT 'active'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  FOREIGN KEY (marketer_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Final Inventory Table
CREATE TABLE Inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paper_type_id INT NOT NULL,      -- Linked to PaperType table
  total_kg DECIMAL(10,2) DEFAULT 0,
  total_bag INT DEFAULT 0,
  collection_date DATE NOT NULL,
  created_by INT NULL,             -- User who recorded the entry
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign Keys
  FOREIGN KEY (paper_type_id) REFERENCES PaperType(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (created_by) REFERENCES Users(user_id) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS storeSales;

CREATE TABLE storeSales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paper_type_id INT NOT NULL,            -- Which paper type was sold
  quantity_kg DECIMAL(10,2) DEFAULT 0,   -- Sold weight (kg)
  quantity_bag INT DEFAULT 0,            -- Sold bags
  sale_date DATE NOT NULL,               -- When the sale occurred
  buyer_name VARCHAR(100) NULL,          -- Buyer name
  buyer_contact VARCHAR(100) NULL,       -- Buyer contact info (optional)
  price_per_kg DECIMAL(10,2) DEFAULT 0,  -- Price per kilogram
  total_price DECIMAL(12,2) DEFAULT 0,   -- Total sale price (kg * price_per_kg)
  created_by INT NULL,                   -- User who recorded the sale
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (paper_type_id) REFERENCES PaperType(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (created_by) REFERENCES Users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Collection Sessions (Fixed)
CREATE TABLE collection_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_number VARCHAR(50) NOT NULL,
  supplier_id INT NOT NULL,
  marketer_id INT NULL,
  coordinator_id INT NULL,
  site_location VARCHAR(255) NOT NULL,
  require_shredder ENUM("yes","no") DEFAULT "no"
  estimated_start_date DATETIME NOT NULL,
  estimated_end_date DATETIME NOT NULL,
  actual_start_date DATETIME NULL,
  actual_end_date DATETIME NULL,
  status ENUM('planned', 'ongoing', 'completed', 'cancelled') DEFAULT 'planned',
  estimatedAmount DECIMAL(10, 2) DEFAULT 0.00,
  total_time_spent INT DEFAULT 0,
  performance JSON,
  collection_data JSON,
  problems JSON,
  comments JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (marketer_id) REFERENCES Users(user_id),
  FOREIGN KEY (coordinator_id) REFERENCES Users(user_id)
);


CREATE TABLE cost_evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL, -- links to collection_sessions.id
  supplier_name VARCHAR(255) NOT NULL,
  collection_coordinator VARCHAR(255) NOT NULL,
  starting_date DATE NOT NULL,
  end_date DATE NOT NULL,
  collection_type TEXT,

  -- Collection amounts
  collected_amount_kg DECIMAL(10,2) DEFAULT 0,
  collected_amount_bag_number INT DEFAULT 0,
  sw DECIMAL(10,2) DEFAULT 0,
  sc DECIMAL(10,2) DEFAULT 0,
  mixed DECIMAL(10,2) DEFAULT 0,
  carton DECIMAL(10,2) DEFAULT 0,
  card DECIMAL(10,2) DEFAULT 0,
  newspaper DECIMAL(10,2) DEFAULT 0,
  magazine DECIMAL(10,2) DEFAULT 0,
  plastic DECIMAL(10,2) DEFAULT 0,
  boxfile DECIMAL(10,2) DEFAULT 0,
  metal DECIMAL(10,2) DEFAULT 0,
  book DECIMAL(10,2) DEFAULT 0,

  -- Bag information
  average_kg_per_bag DECIMAL(10,2) DEFAULT 0,
  rate_of_bag DECIMAL(10,2) DEFAULT 0,
  cost_of_bag_per_kg DECIMAL(10,3) DEFAULT 0,
  bag_received_from_stock INT DEFAULT 0,
  bag_used INT DEFAULT 0,
  bag_return INT DEFAULT 0,

  -- Sorting and collection labour
  no_of_sorting_and_collection_labour INT DEFAULT 0,
  sorting_rate DECIMAL(10,2) DEFAULT 0,
  cost_of_sorting_and_collection_labour DECIMAL(12,2) DEFAULT 0,
  cost_of_labour_per_kg DECIMAL(10,2) DEFAULT 0,

  -- Loading/unloading labour
  no_of_loading_unloading_labour INT DEFAULT 0,
  loading_unloading_rate DECIMAL(10,2) DEFAULT 0,
  cost_of_loading_unloading DECIMAL(12,2) DEFAULT 0,
  cost_of_loading_labour_per_kg DECIMAL(10,3) DEFAULT 0,

  -- Transportation
  transported_by VARCHAR(100),
  no_of_trip INT DEFAULT 0,
  cost_of_transportation DECIMAL(12,2) DEFAULT 0,
  cost_of_transport_per_kg DECIMAL(10,3) DEFAULT 0,

  -- Quality & feedback
  quality_checked_by VARCHAR(255),
  quality_approved_by VARCHAR(255),
  customer_feedback TEXT,
  key_operation_issues TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_cost_evaluation_session FOREIGN KEY (session_id) REFERENCES collection_sessions(id) ON DELETE CASCADE
);
CREATE TABLE mamas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status ENUM('active', 'inactive') NOT NULL,
  joinDate DATE NOT NULL,
  fullName VARCHAR(255) NOT NULL,
  woreda VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  accountNumber VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  joinDate DATE NOT NULL,
  customerName VARCHAR(255) NOT NULL,
  contactPerson VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collection_session_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collection_session_id INT NOT NULL,
    supplier_id INT NOT NULL,
    marketer_id INT NULL,
    paper_type_id INT NOT NULL,
    collected_kg DECIMAL(10,2) DEFAULT 0.00,
    collection_bags INT DEFAULT 0,
    image_path VARCHAR(255) NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign key constraints
    FOREIGN KEY (collection_session_id) REFERENCES collection_sessions(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (marketer_id) REFERENCES Users(user_id),
    FOREIGN KEY (paper_type_id) REFERENCES PaperType(id)
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
