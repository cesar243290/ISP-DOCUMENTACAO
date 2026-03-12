-- ISP NOC System - MariaDB Schema
-- Compatible with MySQL 5.7+ and MariaDB 10.3+

-- Drop tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS alert_acknowledgements;
DROP TABLE IF EXISTS monitoring_status;
DROP TABLE IF EXISTS monitoring_configs;
DROP TABLE IF EXISTS interface_links;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS circuits;
DROP TABLE IF EXISTS interfaces;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS vlans;
DROP TABLE IF EXISTS pops;
DROP TABLE IF EXISTS checklists;
DROP TABLE IF EXISTS runbooks;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role ENUM('ADMIN', 'NOC', 'FIELD_TECH', 'VIEWER') DEFAULT 'VIEWER',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table for JWT token tracking (optional)
CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- POPs (Points of Presence) table
CREATE TABLE pops (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Brasil',
    zip_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    type ENUM('CORE', 'DISTRIBUTION', 'ACCESS') DEFAULT 'ACCESS',
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_type (type),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VLANs table
CREATE TABLE vlans (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    vlan_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('MANAGEMENT', 'CUSTOMER', 'TRANSIT', 'PEERING', 'INTERNAL') DEFAULT 'CUSTOMER',
    subnet VARCHAR(50),
    gateway VARCHAR(50),
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    UNIQUE KEY unique_vlan_id (vlan_id),
    INDEX idx_name (name),
    INDEX idx_type (type),
    INDEX idx_status (status),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment table
CREATE TABLE equipment (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    hostname VARCHAR(255) UNIQUE NOT NULL,
    pop_id VARCHAR(36),
    management_ip VARCHAR(50),
    type ENUM('ROUTER', 'SWITCH', 'OLT', 'SERVER', 'FIREWALL', 'LOAD_BALANCER', 'OTHER') DEFAULT 'ROUTER',
    vendor VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    location VARCHAR(255),
    rack VARCHAR(50),
    rack_position INT,
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FAILED') DEFAULT 'ACTIVE',
    username VARCHAR(100),
    password_encrypted TEXT,
    enable_password_encrypted TEXT,
    snmp_community_encrypted TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    INDEX idx_hostname (hostname),
    INDEX idx_pop_id (pop_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    FOREIGN KEY (pop_id) REFERENCES pops(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Interfaces table
CREATE TABLE interfaces (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    equipment_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('ETHERNET', 'FIBER', 'GPON', 'SERIAL', 'LOOPBACK', 'VLAN', 'LAG') DEFAULT 'ETHERNET',
    description TEXT,
    speed VARCHAR(50),
    duplex ENUM('FULL', 'HALF', 'AUTO') DEFAULT 'AUTO',
    mtu INT DEFAULT 1500,
    mac_address VARCHAR(17),
    ip_address VARCHAR(50),
    subnet_mask VARCHAR(50),
    vlan_id VARCHAR(36),
    admin_status ENUM('up', 'down') DEFAULT 'up',
    oper_status ENUM('up', 'down', 'testing') DEFAULT 'down',
    last_change TIMESTAMP NULL,
    in_octets BIGINT DEFAULT 0,
    out_octets BIGINT DEFAULT 0,
    in_errors BIGINT DEFAULT 0,
    out_errors BIGINT DEFAULT 0,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    UNIQUE KEY unique_equipment_interface (equipment_id, name),
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_name (name),
    INDEX idx_type (type),
    INDEX idx_vlan_id (vlan_id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (vlan_id) REFERENCES vlans(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Circuits table
CREATE TABLE circuits (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    circuit_id VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(255),
    type ENUM('FIBER', 'RADIO', 'COPPER', 'SATELLITE') DEFAULT 'FIBER',
    bandwidth VARCHAR(50),
    interface_a VARCHAR(36),
    interface_b VARCHAR(36),
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
    monthly_cost DECIMAL(10, 2),
    contract_start DATE,
    contract_end DATE,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    INDEX idx_circuit_id (circuit_id),
    INDEX idx_provider (provider),
    INDEX idx_status (status),
    FOREIGN KEY (interface_a) REFERENCES interfaces(id) ON DELETE SET NULL,
    FOREIGN KEY (interface_b) REFERENCES interfaces(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Services table
CREATE TABLE services (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    type ENUM('PPPOE', 'TR069', 'DHCP', 'DNS', 'RADIUS', 'ZABBIX', 'SYSLOG', 'NTP', 'GRAFANA') DEFAULT 'PPPOE',
    equipment_id VARCHAR(36),
    vlan_id VARCHAR(36),
    vrf VARCHAR(100),
    ip_address VARCHAR(50),
    port INT,
    status ENUM('ACTIVE', 'INACTIVE', 'DEGRADED') DEFAULT 'ACTIVE',
    runbook_id VARCHAR(36),
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    INDEX idx_name (name),
    INDEX idx_type (type),
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_vlan_id (vlan_id),
    INDEX idx_status (status),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    FOREIGN KEY (vlan_id) REFERENCES vlans(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Interface Links table (connects two interfaces)
CREATE TABLE interface_links (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    interface_a_id VARCHAR(36) NOT NULL,
    interface_b_id VARCHAR(36) NOT NULL,
    description TEXT,
    vlans TEXT,
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
    bandwidth VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    INDEX idx_interface_a (interface_a_id),
    INDEX idx_interface_b (interface_b_id),
    INDEX idx_status (status),
    FOREIGN KEY (interface_a_id) REFERENCES interfaces(id) ON DELETE CASCADE,
    FOREIGN KEY (interface_b_id) REFERENCES interfaces(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Runbooks table
CREATE TABLE runbooks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    content TEXT NOT NULL,
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    INDEX idx_title (title),
    INDEX idx_category (category),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Checklists table
CREATE TABLE checklists (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    items TEXT NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    INDEX idx_title (title),
    INDEX idx_category (category),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Monitoring Configs table
CREATE TABLE monitoring_configs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    equipment_id VARCHAR(36) NOT NULL,
    check_type ENUM('PING', 'SNMP', 'HTTP', 'HTTPS', 'TCP', 'SSH') DEFAULT 'PING',
    check_interval INT DEFAULT 300,
    timeout INT DEFAULT 10,
    enabled BOOLEAN DEFAULT TRUE,
    parameters TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_enabled (enabled),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Monitoring Status table
CREATE TABLE monitoring_status (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    equipment_id VARCHAR(36) NOT NULL,
    status ENUM('UP', 'DOWN', 'DEGRADED', 'UNKNOWN') DEFAULT 'UNKNOWN',
    last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_time INT,
    error_message TEXT,
    consecutive_failures INT DEFAULT 0,
    uptime_percentage DECIMAL(5, 2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_status (status),
    INDEX idx_last_check (last_check),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alert Acknowledgements table
CREATE TABLE alert_acknowledgements (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    alert_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    INDEX idx_alert_id (alert_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs table
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    username VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(36),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource_type (resource_type),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create a view for interface links with equipment details
CREATE OR REPLACE VIEW interface_links_detailed AS
SELECT
    il.id,
    il.interface_a_id,
    il.interface_b_id,
    il.description,
    il.vlans,
    il.status,
    il.bandwidth,
    ia.name AS interface_a_name,
    ib.name AS interface_b_name,
    ea.hostname AS equipment_a_hostname,
    eb.hostname AS equipment_b_hostname,
    pa.name AS pop_a_name,
    pb.name AS pop_b_name,
    il.created_at,
    il.updated_at
FROM interface_links il
LEFT JOIN interfaces ia ON il.interface_a_id = ia.id
LEFT JOIN interfaces ib ON il.interface_b_id = ib.id
LEFT JOIN equipment ea ON ia.equipment_id = ea.id
LEFT JOIN equipment eb ON ib.equipment_id = eb.id
LEFT JOIN pops pa ON ea.pop_id = pa.id
LEFT JOIN pops pb ON eb.pop_id = pb.id;
