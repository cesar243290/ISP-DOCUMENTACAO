export type UserRole = 'ADMIN' | 'NOC' | 'NOC_READONLY' | 'FIELD_TECH' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface POP {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  access_hours?: string;
  access_rules?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export type EquipmentType = 'OLT' | 'SWITCH' | 'ROUTER' | 'FIREWALL' | 'SERVER' | 'RADIO_LINK' | 'ONU' | 'TRANSCEIVER';
export type EquipmentStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'FAILED';
export type Criticality = 'P0' | 'P1' | 'P2' | 'P3';

export interface Equipment {
  id: string;
  hostname: string;
  type: EquipmentType;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  asset_tag?: string;
  pop_id?: string;
  rack_id?: string;
  rack_position?: number;
  primary_ip?: string;
  primary_cidr?: string;
  secondary_ips?: string[];
  vrf_context?: string;
  gateway?: string;
  dns_servers?: string[];
  ntp_servers?: string[];
  status: EquipmentStatus;
  firmware_version?: string;
  os_version?: string;
  install_date?: string;
  criticality: Criticality;
  maintenance_window?: string;
  observations?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Interface {
  id: string;
  equipment_id: string;
  name: string;
  type: 'PHYSICAL' | 'LAG' | 'VLAN_SVI' | 'LOOPBACK';
  admin_status: string;
  oper_status: string;
  description?: string;
  mtu: number;
  speed?: string;
  vlan_mode?: string;
  allowed_vlans?: number[];
  lag_id?: string;
  ip_addresses?: string[];
  connected_to_equipment_id?: string;
  connected_to_interface_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type VLANType = 'PPPOE' | 'CORPORATE' | 'TR069' | 'MANAGEMENT' | 'IPTV' | 'VOIP' | 'BACKBONE';

export interface VLAN {
  id: string;
  vlan_id: number;
  name: string;
  type: VLANType;
  pop_id?: string;
  scope: string;
  bridge_domain?: string;
  qinq_config?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface Subnet {
  id: string;
  cidr: string;
  description?: string;
  vrf?: string;
  pop_id?: string;
  type: 'MGMT' | 'CLIENT' | 'BACKBONE' | 'LOOPBACK' | 'P2P';
  gateway?: string;
  vlan_id?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface Circuit {
  id: string;
  name: string;
  type: 'PTP_FIBER' | 'TRANSIT_IP' | 'IX' | 'RADIO' | 'MPLS' | 'L2';
  provider?: string;
  circuit_id?: string;
  pop_a_id?: string;
  pop_b_id?: string;
  capacity?: string;
  sla?: string;
  activation_date?: string;
  monthly_cost?: number;
  interface_a_id?: string;
  interface_b_id?: string;
  observations?: string;
  status: EquipmentStatus;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  type: 'PPPOE' | 'TR069' | 'DHCP' | 'DNS' | 'RADIUS' | 'ZABBIX' | 'SYSLOG' | 'NTP' | 'GRAFANA';
  equipment_id?: string;
  endpoints?: string[];
  vlan_id?: string;
  vrf?: string;
  observations?: string;
  runbook_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Runbook {
  id: string;
  title: string;
  category?: string;
  content: string;
  version: string;
  author_id?: string;
  last_revision: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Checklist {
  id: string;
  title: string;
  category?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  item_order: number;
  description: string;
  is_completed: boolean;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface Credential {
  id: string;
  name: string;
  equipment_id?: string;
  service_id?: string;
  username?: string;
  password_encrypted?: string;
  enable_encrypted?: string;
  snmp_community_encrypted?: string;
  api_key_encrypted?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_data?: any;
  after_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
