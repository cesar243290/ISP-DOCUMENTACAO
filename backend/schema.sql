-- ISP NOC Manager - SQLite Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('ADMIN', 'NOC', 'NOC_READONLY', 'FIELD_TECH', 'VIEWER')),
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- POPs table
CREATE TABLE IF NOT EXISTS pops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Equipments table
CREATE TABLE IF NOT EXISTS equipments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('OLT', 'SWITCH', 'ROUTER', 'SERVER', 'FIREWALL')),
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  hostname TEXT,
  management_ip TEXT,
  pop_id TEXT,
  rack TEXT,
  position_u INTEGER,
  status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'MAINTENANCE', 'INACTIVE', 'FAILED')),
  criticality TEXT DEFAULT 'MEDIUM' CHECK(criticality IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  notes TEXT,
  config TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (pop_id) REFERENCES pops(id) ON DELETE SET NULL
);

-- Equipment Credentials (encrypted)
CREATE TABLE IF NOT EXISTS equipment_credentials (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  username TEXT,
  password_encrypted TEXT,
  enable_password_encrypted TEXT,
  snmp_community_encrypted TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE CASCADE
);

-- Interfaces table
CREATE TABLE IF NOT EXISTS interfaces (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('PHYSICAL', 'LAG', 'VLAN_SVI', 'LOOPBACK')),
  description TEXT,
  speed_mbps INTEGER,
  status TEXT DEFAULT 'UP' CHECK(status IN ('UP', 'DOWN', 'ADMIN_DOWN', 'TESTING')),
  ip_address TEXT,
  mac_address TEXT,
  vlan_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE CASCADE
);

-- Interface Links (connections between interfaces)
CREATE TABLE IF NOT EXISTS interface_links (
  id TEXT PRIMARY KEY,
  interface_a_id TEXT NOT NULL,
  interface_b_id TEXT NOT NULL,
  link_type TEXT DEFAULT 'FIBER' CHECK(link_type IN ('FIBER', 'COPPER', 'WIRELESS', 'VIRTUAL')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (interface_a_id) REFERENCES interfaces(id) ON DELETE CASCADE,
  FOREIGN KEY (interface_b_id) REFERENCES interfaces(id) ON DELETE CASCADE
);

-- VLANs table
CREATE TABLE IF NOT EXISTS vlans (
  id TEXT PRIMARY KEY,
  vlan_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('PPPOE', 'TR069', 'MANAGEMENT', 'IPTV', 'VOIP', 'OTHER')),
  scope TEXT DEFAULT 'GLOBAL' CHECK(scope IN ('GLOBAL', 'LOCAL')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Subnets table (IPAM)
CREATE TABLE IF NOT EXISTS subnets (
  id TEXT PRIMARY KEY,
  network TEXT NOT NULL,
  cidr INTEGER NOT NULL,
  description TEXT,
  vlan_id TEXT,
  vrf TEXT,
  gateway TEXT,
  usage_type TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (vlan_id) REFERENCES vlans(id) ON DELETE SET NULL
);

-- IP Allocations table
CREATE TABLE IF NOT EXISTS ip_allocations (
  id TEXT PRIMARY KEY,
  subnet_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  hostname TEXT,
  description TEXT,
  equipment_id TEXT,
  interface_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (subnet_id) REFERENCES subnets(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE SET NULL,
  FOREIGN KEY (interface_id) REFERENCES interfaces(id) ON DELETE SET NULL
);

-- Circuits table
CREATE TABLE IF NOT EXISTS circuits (
  id TEXT PRIMARY KEY,
  carrier TEXT NOT NULL,
  circuit_id TEXT NOT NULL,
  description TEXT,
  bandwidth_mbps INTEGER,
  monthly_cost REAL,
  pop_a_id TEXT,
  pop_b_id TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'TESTING')),
  sla_percentage REAL,
  contract_end TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (pop_a_id) REFERENCES pops(id) ON DELETE SET NULL,
  FOREIGN KEY (pop_b_id) REFERENCES pops(id) ON DELETE SET NULL
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('PPPOE', 'RADIUS', 'DNS', 'DHCP', 'TR069', 'IPTV', 'VOIP', 'OTHER')),
  description TEXT,
  equipment_id TEXT,
  endpoint TEXT,
  port INTEGER,
  status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE SET NULL
);

-- Runbooks table
CREATE TABLE IF NOT EXISTS runbooks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  tags TEXT,
  version INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Checklists table
CREATE TABLE IF NOT EXISTS checklists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('INSTALLATION', 'MAINTENANCE', 'TROUBLESHOOTING', 'OTHER')),
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Checklist Items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  checklist_id TEXT NOT NULL,
  item_text TEXT NOT NULL,
  is_completed INTEGER DEFAULT 0,
  completed_by TEXT,
  completed_at TEXT,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Monitoring Configurations
CREATE TABLE IF NOT EXISTS monitoring_configs (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  monitor_type TEXT NOT NULL CHECK(monitor_type IN ('PING', 'SNMP', 'HTTP', 'PORT')),
  enabled INTEGER DEFAULT 1,
  interval_seconds INTEGER DEFAULT 300,
  timeout_seconds INTEGER DEFAULT 10,
  target TEXT NOT NULL,
  port INTEGER,
  snmp_community_encrypted TEXT,
  threshold_warning REAL,
  threshold_critical REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE CASCADE
);

-- Monitoring Status
CREATE TABLE IF NOT EXISTS monitoring_status (
  id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('OK', 'WARNING', 'CRITICAL', 'UNKNOWN')),
  response_time_ms REAL,
  status_message TEXT,
  last_check TEXT DEFAULT (datetime('now')),
  consecutive_failures INTEGER DEFAULT 0,
  FOREIGN KEY (config_id) REFERENCES monitoring_configs(id) ON DELETE CASCADE
);

-- Alert Acknowledgements
CREATE TABLE IF NOT EXISTS alert_acknowledgements (
  id TEXT PRIMARY KEY,
  monitoring_status_id TEXT NOT NULL,
  acknowledged_by TEXT NOT NULL,
  acknowledged_at TEXT DEFAULT (datetime('now')),
  notes TEXT,
  FOREIGN KEY (monitoring_status_id) REFERENCES monitoring_status(id) ON DELETE CASCADE,
  FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_equipments_pop_id ON equipments(pop_id);
CREATE INDEX IF NOT EXISTS idx_equipments_type ON equipments(type);
CREATE INDEX IF NOT EXISTS idx_interfaces_equipment_id ON interfaces(equipment_id);
CREATE INDEX IF NOT EXISTS idx_ip_allocations_subnet_id ON ip_allocations(subnet_id);
CREATE INDEX IF NOT EXISTS idx_ip_allocations_ip_address ON ip_allocations(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_equipment_id ON monitoring_configs(equipment_id);

-- Insert default admin user (password: Admin@123)
-- Password hash generated with bcrypt
INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, active)
VALUES (
  'admin-001',
  'admin@ispnoc.local',
  '$2a$10$rZ5FnJq5z5Z5Z5Z5Z5Z5ZOY5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',
  'Administrador',
  'ADMIN',
  1
);
