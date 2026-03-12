import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'ADMIN' | 'NOC' | 'VIEWER';
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      pops: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          zip_code: string | null;
          latitude: number | null;
          longitude: number | null;
          type: 'CORE' | 'DISTRIBUTION' | 'ACCESS';
          status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
          observations: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['pops']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['pops']['Insert']>;
      };
      equipment: {
        Row: {
          id: string;
          hostname: string;
          pop_id: string | null;
          management_ip: string | null;
          type: 'ROUTER' | 'SWITCH' | 'OLT' | 'SERVER' | 'FIREWALL' | 'LOAD_BALANCER' | 'OTHER';
          vendor: string | null;
          model: string | null;
          serial_number: string | null;
          location: string | null;
          rack: string | null;
          rack_position: number | null;
          status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'FAILED';
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['equipment']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['equipment']['Insert']>;
      };
      vlans: {
        Row: {
          id: string;
          vlan_id: number;
          name: string;
          description: string | null;
          type: 'MANAGEMENT' | 'CUSTOMER' | 'TRANSIT' | 'PEERING' | 'INTERNAL';
          subnet: string | null;
          gateway: string | null;
          status: 'ACTIVE' | 'INACTIVE';
          observations: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['vlans']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['vlans']['Insert']>;
      };
      circuits: {
        Row: {
          id: string;
          circuit_id: string;
          provider: string | null;
          type: 'FIBER' | 'RADIO' | 'COPPER' | 'SATELLITE';
          bandwidth: string | null;
          interface_a: string | null;
          interface_b: string | null;
          status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
          monthly_cost: number | null;
          contract_start: string | null;
          contract_end: string | null;
          observations: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['circuits']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['circuits']['Insert']>;
      };
      interfaces: {
        Row: {
          id: string;
          equipment_id: string;
          name: string;
          type: 'ETHERNET' | 'FIBER' | 'GPON' | 'SERIAL' | 'LOOPBACK' | 'VLAN' | 'LAG';
          description: string | null;
          speed: string | null;
          duplex: 'FULL' | 'HALF' | 'AUTO';
          mtu: number;
          mac_address: string | null;
          ip_address: string | null;
          subnet_mask: string | null;
          vlan_id: string | null;
          admin_status: 'up' | 'down';
          oper_status: 'up' | 'down' | 'testing';
          last_change: string | null;
          in_octets: number;
          out_octets: number;
          in_errors: number;
          out_errors: number;
          observations: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['interfaces']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['interfaces']['Insert']>;
      };
      services: {
        Row: {
          id: string;
          name: string;
          type: 'PPPOE' | 'TR069' | 'DHCP' | 'DNS' | 'RADIUS' | 'ZABBIX' | 'SYSLOG' | 'NTP' | 'GRAFANA';
          equipment_id: string | null;
          vlan_id: string | null;
          vrf: string | null;
          ip_address: string | null;
          port: number | null;
          status: 'ACTIVE' | 'INACTIVE' | 'DEGRADED';
          runbook_id: string | null;
          observations: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      runbooks: {
        Row: {
          id: string;
          title: string;
          category: string | null;
          content: string;
          tags: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['runbooks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['runbooks']['Insert']>;
      };
      checklists: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          items: string;
          category: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['checklists']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['checklists']['Insert']>;
      };
      monitoring_configs: {
        Row: {
          id: string;
          equipment_id: string;
          check_type: 'PING' | 'SNMP' | 'HTTP' | 'HTTPS' | 'TCP' | 'SSH';
          check_interval: number;
          timeout: number;
          enabled: boolean;
          parameters: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['monitoring_configs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['monitoring_configs']['Insert']>;
      };
      monitoring_status: {
        Row: {
          id: string;
          equipment_id: string;
          status: 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';
          last_check: string;
          response_time: number | null;
          error_message: string | null;
          consecutive_failures: number;
          uptime_percentage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['monitoring_status']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['monitoring_status']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          username: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          details: string | null;
          ip_address: string | null;
          user_agent: string | null;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
    };
  };
};
