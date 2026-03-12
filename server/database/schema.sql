-- Network Manager Database Schema for MySQL/MariaDB
-- Execute this script to create all required tables

CREATE DATABASE IF NOT EXISTS network_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE network_manager;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user', 'viewer') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB;

-- POPs (Points of Presence) table
CREATE TABLE IF NOT EXISTS pops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  type VARCHAR(50),
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pop_id INT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  ip_address VARCHAR(45),
  management_ip VARCHAR(45),
  status ENUM('active', 'inactive', 'maintenance', 'failed') DEFAULT 'active',
  location VARCHAR(255),
  rack_position VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pop_id) REFERENCES pops(id) ON DELETE SET NULL,
  INDEX idx_pop_id (pop_id),
  INDEX idx_ip_address (ip_address),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- Equipment credentials (encrypted)
CREATE TABLE IF NOT EXISTS equipment_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  username VARCHAR(255) NOT NULL,
  password_encrypted TEXT NOT NULL,
  credential_type VARCHAR(50) DEFAULT 'ssh',
  port INT DEFAULT 22,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  INDEX idx_equipment_id (equipment_id)
) ENGINE=InnoDB;

-- Interfaces table
CREATE TABLE IF NOT EXISTS interfaces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  status ENUM('up', 'down', 'admin_down') DEFAULT 'down',
  speed VARCHAR(50),
  duplex VARCHAR(20),
  mtu INT,
  mac_address VARCHAR(17),
  ip_address VARCHAR(45),
  subnet_mask VARCHAR(45),
  description TEXT,
  vlan_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_status (status),
  INDEX idx_vlan_id (vlan_id)
) ENGINE=InnoDB;

-- Interface links (connections between interfaces)
CREATE TABLE IF NOT EXISTS interface_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  interface_a_id INT NOT NULL,
  interface_b_id INT NOT NULL,
  link_type VARCHAR(50),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (interface_a_id) REFERENCES interfaces(id) ON DELETE CASCADE,
  FOREIGN KEY (interface_b_id) REFERENCES interfaces(id) ON DELETE CASCADE,
  INDEX idx_interface_a (interface_a_id),
  INDEX idx_interface_b (interface_b_id)
) ENGINE=InnoDB;

-- VLANs table
CREATE TABLE IF NOT EXISTS vlans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vlan_id INT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subnet VARCHAR(50),
  gateway VARCHAR(45),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vlan_id (vlan_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- IP Address Management table
CREATE TABLE IF NOT EXISTS ipam (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) UNIQUE NOT NULL,
  subnet VARCHAR(50),
  vlan_id INT,
  equipment_id INT,
  interface_id INT,
  status ENUM('available', 'allocated', 'reserved') DEFAULT 'available',
  description TEXT,
  assigned_to VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vlan_id) REFERENCES vlans(id) ON DELETE SET NULL,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
  FOREIGN KEY (interface_id) REFERENCES interfaces(id) ON DELETE SET NULL,
  INDEX idx_ip_address (ip_address),
  INDEX idx_status (status),
  INDEX idx_vlan_id (vlan_id)
) ENGINE=InnoDB;

-- Circuits table
CREATE TABLE IF NOT EXISTS circuits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  circuit_id VARCHAR(100) UNIQUE NOT NULL,
  provider VARCHAR(100),
  type VARCHAR(50),
  bandwidth VARCHAR(50),
  a_side_pop_id INT,
  z_side_pop_id INT,
  a_side_interface_id INT,
  z_side_interface_id INT,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  monthly_cost DECIMAL(10, 2),
  contract_start DATE,
  contract_end DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (a_side_pop_id) REFERENCES pops(id) ON DELETE SET NULL,
  FOREIGN KEY (z_side_pop_id) REFERENCES pops(id) ON DELETE SET NULL,
  FOREIGN KEY (a_side_interface_id) REFERENCES interfaces(id) ON DELETE SET NULL,
  FOREIGN KEY (z_side_interface_id) REFERENCES interfaces(id) ON DELETE SET NULL,
  INDEX idx_circuit_id (circuit_id),
  INDEX idx_status (status),
  INDEX idx_provider (provider)
) ENGINE=InnoDB;

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  circuit_id INT,
  vlan_id INT,
  customer_name VARCHAR(255),
  bandwidth VARCHAR(50),
  ip_address VARCHAR(45),
  monthly_revenue DECIMAL(10, 2),
  contract_start DATE,
  contract_end DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (circuit_id) REFERENCES circuits(id) ON DELETE SET NULL,
  FOREIGN KEY (vlan_id) REFERENCES vlans(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_customer_name (customer_name)
) ENGINE=InnoDB;

-- Monitoring configs table
CREATE TABLE IF NOT EXISTS monitoring_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  monitor_type VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  check_interval INT DEFAULT 300,
  timeout INT DEFAULT 30,
  config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_enabled (enabled)
) ENGINE=InnoDB;

-- Monitoring status table
CREATE TABLE IF NOT EXISTS monitoring_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  status ENUM('up', 'down', 'warning', 'unknown') DEFAULT 'unknown',
  last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  response_time INT,
  error_message TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_status (status),
  INDEX idx_last_check (last_check)
) ENGINE=InnoDB;

-- Alert acknowledgements table
CREATE TABLE IF NOT EXISTS alert_acknowledgements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  user_id INT NOT NULL,
  acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- Runbooks table
CREATE TABLE IF NOT EXISTS runbooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  content TEXT,
  tags JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB;

-- Checklists table
CREATE TABLE IF NOT EXISTS checklists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  items JSON NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB;

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity_type (entity_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Create default admin user (password: admin123 - CHANGE THIS!)
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@example.com', '$2a$10$rQZ8vQ7Y5qYYH5qK5Y5Y5.Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'Administrator', 'admin')
ON DUPLICATE KEY UPDATE email=email;
