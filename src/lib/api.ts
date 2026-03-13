import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

class APIClient {
  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  removeToken() {
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUserId(): string | null {
    return localStorage.getItem('user_id');
  }

  setUserId(id: string) {
    localStorage.setItem('user_id', id);
  }

  removeUserId() {
    localStorage.removeItem('user_id');
  }
}

export const api = new APIClient();

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authAPI = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !user) {
      throw new Error('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Credenciais inválidas');
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      throw new Error('Erro ao criar sessão');
    }

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    api.setToken(token);
    api.setUserId(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.username,
        role: user.role,
      },
    };
  },

  async logout(): Promise<void> {
    const token = api.getToken();
    if (token) {
      await supabase.from('sessions').delete().eq('token', token);
    }
    api.removeToken();
    api.removeUserId();
  },

  async me(): Promise<{ user: User }> {
    const token = api.getToken();
    const userId = api.getUserId();

    if (!token || !userId) {
      throw new Error('Não autenticado');
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', token)
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      api.removeToken();
      api.removeUserId();
      throw new Error('Sessão expirada');
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (userError || !user) {
      throw new Error('Usuário não encontrado');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.username,
        role: user.role,
      },
    };
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const userId = api.getUserId();
    if (!userId) {
      throw new Error('Não autenticado');
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      throw new Error('Usuário não encontrado');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      throw new Error('Erro ao alterar senha');
    }
  },
};

export const usersAPI = {
  async getAll() {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Usuário não encontrado');
    return data;
  },

  async create(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const { data: newUser, error } = await supabase.from('users').insert({
      ...data,
      password_hash: hashedPassword,
    }).select().single();
    if (error) throw new Error(error.message);
    return newUser;
  },

  async update(id: string, data: any) {
    const updateData: any = { ...data, updated_at: new Date().toISOString() };
    if (data.password) {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }
    const { data: updated, error } = await supabase.from('users').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return updated;
  },

  async delete(id: string) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const popsAPI = {
  async getAll() {
    const { data, error } = await supabase.from('pops').select('*').order('name');
    if (error) throw new Error(error.message);
    return data;
  },
  async getById(id: string) {
    const { data, error } = await supabase.from('pops').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async create(data: any) {
    const userId = api.getUserId();
    const { data: result, error } = await supabase.from('pops').insert({ ...data, created_by: userId }).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async update(id: string, data: any) {
    const { data: result, error } = await supabase.from('pops').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async delete(id: string) {
    const { error } = await supabase.from('pops').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const equipmentsAPI = {
  async getAll() {
    const { data, error } = await supabase.from('equipment').select('*, pop:pops(name)').order('hostname');
    if (error) throw new Error(error.message);
    return data;
  },
  async getById(id: string) {
    const { data, error } = await supabase.from('equipment').select('*, pop:pops(*)').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async create(data: any) {
    const userId = api.getUserId();
    const { data: result, error } = await supabase.from('equipment').insert({ ...data, created_by: userId }).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async update(id: string, data: any) {
    const { data: result, error } = await supabase.from('equipment').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async delete(id: string) {
    const { error } = await supabase.from('equipment').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const interfacesAPI = {
  async getAll() {
    const { data, error } = await supabase.from('interfaces').select('*, equipment:equipment_id(hostname)').order('name');
    if (error) throw new Error(error.message);
    return data;
  },
  async create(data: any) {
    const { data: result, error } = await supabase.from('interfaces').insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async update(id: string, data: any) {
    const { data: result, error } = await supabase.from('interfaces').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async delete(id: string) {
    const { error } = await supabase.from('interfaces').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const vlansAPI = {
  async getAll() {
    const { data, error } = await supabase.from('vlans').select('*, pop:pops(name)').order('vlan_id');
    if (error) throw new Error(error.message);
    return data;
  },
  async create(data: any) {
    const userId = api.getUserId();
    const { data: result, error } = await supabase.from('vlans').insert({ ...data, created_by: userId }).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async update(id: string, data: any) {
    const { data: result, error } = await supabase.from('vlans').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async delete(id: string) {
    const { error } = await supabase.from('vlans').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const ipamAPI = {
  async getSubnets() {
    const { data, error } = await supabase.from('subnets').select('*, pop:pops(name), vlan:vlans(name)').order('cidr');
    if (error) throw new Error(error.message);
    return data;
  },
  async createSubnet(data: any) {
    const userId = api.getUserId();
    const { data: result, error } = await supabase.from('subnets').insert({ ...data, created_by: userId }).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async deleteSubnet(id: string) {
    const { error } = await supabase.from('subnets').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  async getAllocations() {
    const { data, error } = await supabase.from('ip_addresses').select('*, subnet:subnets(cidr), equipment:equipment(hostname)').order('ip_address');
    if (error) throw new Error(error.message);
    return data;
  },
  async createAllocation(data: any) {
    const { data: result, error } = await supabase.from('ip_addresses').insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async deleteAllocation(id: string) {
    const { error } = await supabase.from('ip_addresses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const circuitsAPI = {
  async getAll() {
    const { data, error } = await supabase.from('circuits').select('*, pop_a:pops!circuits_pop_a_id_fkey(name), pop_b:pops!circuits_pop_b_id_fkey(name)').order('name');
    if (error) throw new Error(error.message);
    return data;
  },
  async create(data: any) {
    const userId = api.getUserId();
    const { data: result, error } = await supabase.from('circuits').insert({ ...data, created_by: userId }).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async update(id: string, data: any) {
    const { data: result, error } = await supabase.from('circuits').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async delete(id: string) {
    const { error } = await supabase.from('circuits').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const servicesAPI = {
  async getAll() {
    const { data, error } = await supabase.from('services').select('*, equipment:equipment(hostname), vlan:vlans(name)').order('name');
    if (error) throw new Error(error.message);
    return data;
  },
  async create(data: any) {
    const userId = api.getUserId();
    const { data: result, error } = await supabase.from('services').insert({ ...data, created_by: userId }).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async update(id: string, data: any) {
    const { data: result, error } = await supabase.from('services').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async delete(id: string) {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const runbooksAPI = {
  async getAll() {
    const { data, error } = await supabase.from('runbooks').select('*').order('title');
    if (error) throw new Error(error.message);
    return data;
  },
  async create(data: any) {
    const userId = api.getUserId();
    const { data: result, error } = await supabase.from('runbooks').insert({ ...data, author_id: userId }).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async update(id: string, data: any) {
    const { data: result, error } = await supabase.from('runbooks').update({ ...data, updated_at: new Date().toISOString(), last_revision: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async delete(id: string) {
    const { error } = await supabase.from('runbooks').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const checklistsAPI = {
  async getAll() {
    const { data, error } = await supabase.from('checklists').select('*').order('title');
    if (error) throw new Error(error.message);
    return data;
  },
  async getItems(id: string) {
    const { data, error } = await supabase.from('checklist_items').select('*').eq('checklist_id', id).order('item_order');
    if (error) throw new Error(error.message);
    return data;
  },
  async create(data: any) {
    const userId = api.getUserId();
    const { data: result, error } = await supabase.from('checklists').insert({ ...data, created_by: userId }).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async createItem(id: string, data: any) {
    const { data: result, error } = await supabase.from('checklist_items').insert({ ...data, checklist_id: id }).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async updateItem(id: string, data: any) {
    const updateData: any = { ...data };
    if (data.is_completed) {
      updateData.completed_by = api.getUserId();
      updateData.completed_at = new Date().toISOString();
    }
    const { data: result, error } = await supabase.from('checklist_items').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async delete(id: string) {
    const { error } = await supabase.from('checklists').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const auditAPI = {
  async getLogs(limit = 100, offset = 0) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, user:users(email, full_name)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return data;
  },
  async getStats() {
    const { count, error } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    return { total: count };
  },
};

export const monitoringAPI = {
  async getConfigs() {
    const { data, error } = await supabase.from('monitoring_configs').select('*').order('name');
    if (error) throw new Error(error.message);
    return data;
  },
  async getStatus() {
    const { data, error } = await supabase
      .from('monitoring_status')
      .select('*, config:monitoring_configs(*), acknowledgement:alert_acknowledgements(*)')
      .order('last_check', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },
  async createConfig(data: any) {
    const { data: result, error } = await supabase.from('monitoring_configs').insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  },
  async acknowledge(statusId: string, notes: string) {
    const userId = api.getUserId();
    const { data: result, error } = await supabase
      .from('alert_acknowledgements')
      .insert({
        monitoring_status_id: statusId,
        acknowledged_by: userId,
        notes,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  },
  async deleteConfig(id: string) {
    const { error } = await supabase.from('monitoring_configs').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
