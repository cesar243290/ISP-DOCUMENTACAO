-- ISP NOC System - Seed Data for MariaDB
-- This script creates an admin user and sample data

-- Insert admin user
-- Email: admin@admin.com
-- Password: admin123
-- bcrypt hash generated with: bcrypt.hashSync('admin123', 10)
INSERT INTO users (id, email, username, password_hash, full_name, role, is_active)
VALUES (
    UUID(),
    'admin@admin.com',
    'admin',
    '$2b$10$rKwGZ5Z0yP4Z5Z0yP4Z5ZeZ0yP4Z5Z0yP4Z5Z0yP4Z5Z0yP4Z5Z0y',
    'System Administrator',
    'ADMIN',
    TRUE
);

-- Sample POPs
INSERT INTO pops (id, name, location, city, state, type, status)
VALUES
    (UUID(), 'POP-CENTRO-SP', 'Data Center Tier 3', 'São Paulo', 'SP', 'CORE', 'ACTIVE'),
    (UUID(), 'POP-NORTE-RJ', 'Office Building', 'Rio de Janeiro', 'RJ', 'DISTRIBUTION', 'ACTIVE'),
    (UUID(), 'POP-SUL-MG', 'Regional Office', 'Belo Horizonte', 'MG', 'ACCESS', 'ACTIVE');

-- Sample VLANs
INSERT INTO vlans (id, vlan_id, name, description, type, status)
VALUES
    (UUID(), 10, 'MANAGEMENT', 'Management VLAN', 'MANAGEMENT', 'ACTIVE'),
    (UUID(), 100, 'CUSTOMERS', 'Customer Services', 'CUSTOMER', 'ACTIVE'),
    (UUID(), 200, 'TRANSIT', 'Transit Links', 'TRANSIT', 'ACTIVE'),
    (UUID(), 300, 'PEERING', 'Peering Connections', 'PEERING', 'ACTIVE');

-- Sample Equipment
SET @pop_sp = (SELECT id FROM pops WHERE name = 'POP-CENTRO-SP' LIMIT 1);
SET @pop_rj = (SELECT id FROM pops WHERE name = 'POP-NORTE-RJ' LIMIT 1);

INSERT INTO equipment (id, hostname, pop_id, management_ip, type, vendor, model, status)
VALUES
    (UUID(), 'RT-CORE-01', @pop_sp, '10.0.0.1', 'ROUTER', 'Cisco', 'ASR9000', 'ACTIVE'),
    (UUID(), 'SW-ACCESS-01', @pop_sp, '10.0.0.2', 'SWITCH', 'Juniper', 'EX4300', 'ACTIVE'),
    (UUID(), 'OLT-FIBER-01', @pop_rj, '10.0.0.3', 'OLT', 'Huawei', 'MA5800', 'ACTIVE'),
    (UUID(), 'FW-EDGE-01', @pop_sp, '10.0.0.4', 'FIREWALL', 'Fortinet', 'FortiGate', 'ACTIVE');

-- Sample Runbooks
INSERT INTO runbooks (id, title, category, content)
VALUES
    (UUID(), 'Network Device Reboot Procedure', 'Maintenance', '# Device Reboot Procedure\n\n1. Verify maintenance window\n2. Notify NOC team\n3. Check active connections\n4. Execute reboot command\n5. Monitor device recovery\n6. Verify services'),
    (UUID(), 'BGP Session Troubleshooting', 'Troubleshooting', '# BGP Troubleshooting\n\n1. Check BGP neighbor status\n2. Verify routing tables\n3. Check prefix advertisements\n4. Review logs\n5. Test connectivity'),
    (UUID(), 'Fiber Cut Response', 'Emergency', '# Fiber Cut Emergency Response\n\n1. Identify affected circuit\n2. Notify customers\n3. Open ticket with provider\n4. Activate backup link\n5. Monitor restoration');

-- Sample Checklists
INSERT INTO checklists (id, title, description, items, category)
VALUES
    (UUID(), 'New Equipment Installation', 'Checklist for installing new network equipment', '["Verify power requirements","Mount equipment in rack","Connect management interface","Configure basic settings","Test connectivity","Document installation","Update inventory"]', 'Installation'),
    (UUID(), 'Monthly Network Audit', 'Monthly network infrastructure audit', '["Review backup status","Check equipment health","Verify monitoring alerts","Update documentation","Review capacity planning","Check security patches","Test disaster recovery"]', 'Audit'),
    (UUID(), 'Customer Service Activation', 'Checklist for activating new customer service', '["Verify order details","Provision VLAN","Configure equipment port","Set QoS policies","Test connectivity","Document configuration","Notify customer success"]', 'Provisioning');

-- Sample Interfaces (for first router)
SET @router_id = (SELECT id FROM equipment WHERE hostname = 'RT-CORE-01' LIMIT 1);

INSERT INTO interfaces (id, equipment_id, name, type, description, speed, admin_status, oper_status)
VALUES
    (UUID(), @router_id, 'GigabitEthernet0/0/0', 'ETHERNET', 'Uplink to Transit Provider', '10Gbps', 'up', 'up'),
    (UUID(), @router_id, 'GigabitEthernet0/0/1', 'ETHERNET', 'Connection to Distribution', '1Gbps', 'up', 'up'),
    (UUID(), @router_id, 'Loopback0', 'LOOPBACK', 'Router ID', '1Gbps', 'up', 'up');

-- Display created admin user
SELECT
    email,
    username,
    full_name,
    role,
    is_active,
    created_at
FROM users
WHERE email = 'admin@admin.com';

SELECT 'Seed data created successfully!' AS Status;
SELECT 'Login with: admin@admin.com / admin123' AS Credentials;
