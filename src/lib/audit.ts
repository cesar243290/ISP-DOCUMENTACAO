import { supabase } from './supabase';

interface AuditLogParams {
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  before_data?: any;
  after_data?: any;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      user_id: params.user_id || null,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id || null,
      before_data: params.before_data || null,
      after_data: params.after_data || null,
      ip_address: null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}
