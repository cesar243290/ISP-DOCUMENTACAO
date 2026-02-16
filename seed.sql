-- ISP NOC System - Seed Data
-- Este script popula o banco de dados com dados de exemplo

-- Admin user (password: Admin@123 - bcrypt hash)
INSERT INTO users (email, username, password_hash, role, full_name, is_active)
VALUES (
  'admin@admin.com',
  'admin',
  '$2b$10$k/QsLvkQ2.1aZRVH6czDvebTanFc6yJg8O547POqzq7JRG7XFUWU.',
  'ADMIN',
  'Administrador do Sistema',
  true
) ON CONFLICT (email) DO NOTHING;

-- Example POPs
INSERT INTO pops (name, city, state, address, contact_name, contact_phone, observations)
VALUES
  ('POP-CENTRO-SP', 'São Paulo', 'SP', 'Av. Paulista, 1000', 'João Silva', '(11) 99999-9999', 'POP principal - Data Center Tier 3'),
  ('POP-NORTE-RJ', 'Rio de Janeiro', 'RJ', 'Av. Rio Branco, 500', 'Maria Santos', '(21) 98888-8888', 'POP secundário - Escritório'),
  ('POP-SUL-MG', 'Belo Horizonte', 'MG', 'Av. Afonso Pena, 200', 'Carlos Oliveira', '(31) 97777-7777', 'POP regional');

-- Get POP IDs for reference
DO $$
DECLARE
  pop_sp_id uuid;
  pop_rj_id uuid;
  pop_mg_id uuid;
  olt_id uuid;
  switch_id uuid;
  router_id uuid;
  server_id uuid;
  iface_olt_uplink uuid;
  iface_switch_downlink uuid;
BEGIN
  SELECT id INTO pop_sp_id FROM pops WHERE name = 'POP-CENTRO-SP' LIMIT 1;
  SELECT id INTO pop_rj_id FROM pops WHERE name = 'POP-NORTE-RJ' LIMIT 1;
  SELECT id INTO pop_mg_id FROM pops WHERE name = 'POP-SUL-MG' LIMIT 1;

  -- Example Equipment - OLT
  INSERT INTO equipment (
    hostname, type, manufacturer, model, serial_number,
    pop_id, primary_ip, status, criticality, observations
  )
  VALUES (
    'OLT-SP-01',
    'OLT',
    'Huawei',
    'MA5800-X17',
    'SN2024001',
    pop_sp_id,
    '10.0.1.10',
    'ACTIVE',
    'P0',
    'OLT principal - GPON/XGS-PON'
  )
  RETURNING id INTO olt_id;

  -- OLT specific config
  INSERT INTO equipment_olt_config (
    equipment_id, technology, pon_ports, uplink_ports,
    vlan_pppoe, vlan_tr069, provisioning_notes
  )
  VALUES (
    olt_id,
    'GPON/XGS-PON',
    16,
    jsonb_build_array(
      jsonb_build_object('interface', '0/19/0', 'capacity', '10G'),
      jsonb_build_object('interface', '0/19/1', 'capacity', '10G')
    ),
    100,
    200,
    'Uplinks em LAG para switch core'
  );

  -- Example Equipment - Switch Core
  INSERT INTO equipment (
    hostname, type, manufacturer, model, serial_number,
    pop_id, primary_ip, status, criticality, observations
  )
  VALUES (
    'SW-CORE-SP-01',
    'SWITCH',
    'Cisco',
    'Catalyst 9500',
    'SN2024002',
    pop_sp_id,
    '10.0.1.20',
    'ACTIVE',
    'P0',
    'Switch Core - Agregação'
  )
  RETURNING id INTO switch_id;

  -- Switch specific config
  INSERT INTO equipment_switch_config (
    equipment_id, function, stp_mode, lacp_enabled, loop_protection
  )
  VALUES (
    switch_id,
    'core',
    'rapid-pvst',
    true,
    true
  );

  -- Example Equipment - Router BNG
  INSERT INTO equipment (
    hostname, type, manufacturer, model, serial_number,
    pop_id, primary_ip, status, criticality, observations
  )
  VALUES (
    'BNG-SP-01',
    'ROUTER',
    'Juniper',
    'MX480',
    'SN2024003',
    pop_sp_id,
    '10.0.1.30',
    'ACTIVE',
    'P0',
    'BNG/BRAS - PPPoE Concentrator'
  )
  RETURNING id INTO router_id;

  -- Router specific config
  INSERT INTO equipment_router_config (
    equipment_id, asn, full_routing, has_cgnat, is_pppoe_concentrator,
    radius_servers
  )
  VALUES (
    router_id,
    65100,
    true,
    true,
    true,
    jsonb_build_array(
      jsonb_build_object('ip', '10.0.2.10', 'secret', 'encrypted'),
      jsonb_build_object('ip', '10.0.2.11', 'secret', 'encrypted')
    )
  );

  -- Example Equipment - Server (RADIUS)
  INSERT INTO equipment (
    hostname, type, manufacturer, model, serial_number,
    pop_id, primary_ip, status, criticality, observations
  )
  VALUES (
    'RADIUS-SP-01',
    'SERVER',
    'Dell',
    'PowerEdge R640',
    'SN2024004',
    pop_sp_id,
    '10.0.2.10',
    'ACTIVE',
    'P1',
    'Servidor RADIUS - FreeRADIUS'
  )
  RETURNING id INTO server_id;

  -- Server specific config
  INSERT INTO equipment_server_config (
    equipment_id, function, operating_system, services_running
  )
  VALUES (
    server_id,
    'RADIUS',
    'Ubuntu 22.04 LTS',
    jsonb_build_array('freeradius', 'mysql', 'monitoring-agent')
  );

  -- Interfaces for OLT
  INSERT INTO interfaces (
    equipment_id, name, type, admin_status, oper_status,
    description, mtu, speed, vlan_mode
  )
  VALUES
    (olt_id, '0/19/0', 'PHYSICAL', 'up', 'up', 'Uplink to Core Switch', 1500, '10G', 'trunk'),
    (olt_id, '0/0/0', 'PHYSICAL', 'up', 'up', 'PON Port 1', 1500, '10G', 'access'),
    (olt_id, '0/0/1', 'PHYSICAL', 'up', 'up', 'PON Port 2', 1500, '10G', 'access')
  RETURNING id INTO iface_olt_uplink;

  -- Interfaces for Switch
  INSERT INTO interfaces (
    equipment_id, name, type, admin_status, oper_status,
    description, mtu, speed, vlan_mode, connected_to_equipment_id
  )
  VALUES
    (switch_id, 'Gi1/0/1', 'PHYSICAL', 'up', 'up', 'Downlink to OLT', 1500, '10G', 'trunk', olt_id),
    (switch_id, 'Gi1/0/48', 'PHYSICAL', 'up', 'up', 'Uplink to BNG', 1500, '10G', 'trunk', router_id)
  RETURNING id INTO iface_switch_downlink;

  -- VLANs
  INSERT INTO vlans (vlan_id, name, type, scope, observations)
  VALUES
    (100, 'VLAN-PPPOE-100', 'PPPOE', 'global', 'VLAN PPPoE Principal'),
    (200, 'VLAN-TR069-200', 'TR069', 'global', 'VLAN para gerência TR-069'),
    (10, 'VLAN-MGMT-10', 'MANAGEMENT', 'global', 'VLAN de Gerência'),
    (300, 'VLAN-IPTV-300', 'IPTV', 'global', 'VLAN para serviço de IPTV');

  -- Subnets (IPAM)
  INSERT INTO subnets (cidr, description, type, gateway, vrf)
  VALUES
    ('10.0.1.0/24', 'Rede de Gerência - POP SP', 'MGMT', '10.0.1.1', 'management'),
    ('10.0.2.0/24', 'Rede de Servidores', 'MGMT', '10.0.2.1', 'management'),
    ('100.64.0.0/10', 'Pool CGNAT', 'CLIENT', NULL, 'inet'),
    ('200.200.200.0/24', 'Bloco IP Público', 'CLIENT', '200.200.200.1', 'inet');

  -- Circuit example
  INSERT INTO circuits (
    name, type, provider, circuit_id, pop_a_id, pop_b_id,
    capacity, sla, status, observations
  )
  VALUES (
    'LINK-SP-RJ-01',
    'PTP_FIBER',
    'Embratel',
    'EMB-12345',
    pop_sp_id,
    pop_rj_id,
    '10G',
    '99.9%',
    'ACTIVE',
    'Link metropolitano fibra óptica'
  );

  -- Services
  INSERT INTO services (name, type, equipment_id, observations)
  VALUES
    ('PPPoE-BNG-SP', 'PPPOE', router_id, 'Serviço PPPoE principal'),
    ('RADIUS-AUTH', 'RADIUS', server_id, 'Autenticação RADIUS'),
    ('DNS-Recursivo', 'DNS', server_id, 'Servidor DNS recursivo');

  -- Runbooks
  INSERT INTO runbooks (title, category, content, version, tags)
  VALUES
    (
      'Procedimento: Troca de OLT',
      'manutenção',
      E'# Procedimento de Troca de OLT\n\n## Pré-requisitos\n- Janela de manutenção aprovada\n- Backup da configuração\n- Equipamento substituto testado\n\n## Passos\n1. Notificar NOC\n2. Fazer backup da configuração atual\n3. Desligar OLT antiga\n4. Instalar OLT nova\n5. Restaurar configuração\n6. Testar conectividade\n7. Validar serviços',
      '1.0',
      jsonb_build_array('OLT', 'manutenção', 'troca', 'Huawei')
    ),
    (
      'Troubleshooting: PPPoE não autentica',
      'troubleshooting',
      E'# Troubleshooting: Cliente não autentica PPPoE\n\n## Verificações\n1. Verificar status da interface no BNG\n2. Validar VLAN no switch de acesso\n3. Testar conectividade RADIUS\n4. Verificar logs de autenticação\n5. Validar credenciais do cliente\n\n## Comandos úteis\n```\nshow pppoe session\nshow radius statistics\nshow log | match pppoe\n```',
      '1.0',
      jsonb_build_array('PPPoE', 'RADIUS', 'troubleshooting')
    );

  -- Checklist
  INSERT INTO checklists (title, category, description)
  VALUES
    ('Checklist: Ativação de Novo POP', 'instalação', 'Lista de verificação para ativação de novo POP'),
    ('Checklist: Manutenção Preventiva Switch Core', 'manutenção', 'Checklist mensal de manutenção preventiva');

END $$;
