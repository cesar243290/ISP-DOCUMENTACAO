import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Plus, CreditCard as Edit2, Trash2, Radio, Server, RefreshCw } from 'lucide-react';

interface MonitorConfig {
  id: string;
  name: string;
  type: 'ICMP' | 'SNMP' | 'ZABBIX';
  target: string;
  community?: string;
  version?: string;
  zabbix_host_id?: string;
  zabbix_api_url?: string;
  zabbix_api_token?: string;
  interval: number;
  enabled: boolean;
  created_at: string;
}

interface MonitorStatus {
  config_id: string;
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  response_time?: number;
  last_check: string;
  error_message?: string;
  consecutive_failures: number;
}

export function Monitoring() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<MonitorConfig[]>([]);
  const [statuses, setStatuses] = useState<Map<string, MonitorStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<Set<string>>(new Set());
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'ICMP' as 'ICMP' | 'SNMP' | 'ZABBIX',
    target: '',
    community: 'public',
    version: '2c',
    zabbix_host_id: '',
    zabbix_api_url: '',
    zabbix_api_token: '',
    interval: 60,
    enabled: true
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (configs.length === 0) return;

    const statusInterval = setInterval(loadStatuses, 30000);
    const autoTestInterval = setInterval(() => autoTestAllHosts(), 30000);

    const subscription = supabase
      .channel('monitoring_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monitoring_status'
        },
        () => {
          loadStatuses();
        }
      )
      .subscribe();

    return () => {
      clearInterval(statusInterval);
      clearInterval(autoTestInterval);
      subscription.unsubscribe();
    };
  }, [configs.length]);

  async function autoTestAllHosts() {
    if (configs.length === 0) return;

    setAutoRefreshing(true);
    const enabledConfigs = configs.filter(c => c.enabled);

    for (const config of enabledConfigs) {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-monitoring`;

        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            configId: config.id,
            type: config.type,
            target: config.target,
            community: config.community,
            version: config.version,
            zabbix_api_url: config.zabbix_api_url,
            zabbix_api_token: config.zabbix_api_token
          })
        });

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error auto-testing ${config.name}:`, error);
      }
    }

    await loadStatuses();
    setAutoRefreshing(false);
  }

  async function loadConfigs() {
    try {
      const { data } = await supabase
        .from('monitoring_configs')
        .select('*')
        .order('name');
      if (data) {
        setConfigs(data);
        loadStatuses();
      }
    } catch (error) {
      console.error('Error loading configs:', error);
      showToast('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadStatuses() {
    try {
      const { data } = await supabase
        .from('monitoring_latest_status')
        .select('*');

      if (data) {
        const statusMap = new Map<string, MonitorStatus>();
        data.forEach((status: any) => {
          statusMap.set(status.config_id, status);
        });
        setStatuses(statusMap);
      }
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  }

  async function testConnection(config: MonitorConfig) {
    setTesting(prev => new Set(prev).add(config.id));

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-monitoring`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configId: config.id,
          type: config.type,
          target: config.target,
          community: config.community,
          version: config.version,
          zabbix_api_url: config.zabbix_api_url,
          zabbix_api_token: config.zabbix_api_token
        })
      });

      const result = await response.json();

      if (result.success) {
        const status = result.result.status;
        if (status === 'UP') {
          showToast(`${config.name}: Conexão OK (${result.result.response_time}ms)`, 'success');
        } else {
          showToast(`${config.name}: ${result.result.error_message || 'Falha na conexão'}`, 'error');
        }
        loadStatuses();
      } else {
        showToast(`Erro ao testar ${config.name}`, 'error');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      showToast('Erro ao testar conexão', 'error');
    } finally {
      setTesting(prev => {
        const newSet = new Set(prev);
        newSet.delete(config.id);
        return newSet;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        community: formData.type === 'SNMP' ? formData.community : null,
        version: formData.type === 'SNMP' ? formData.version : null,
        zabbix_host_id: formData.type === 'ZABBIX' ? formData.zabbix_host_id : null,
        zabbix_api_url: formData.type === 'ZABBIX' ? formData.zabbix_api_url : null,
        zabbix_api_token: formData.type === 'ZABBIX' ? formData.zabbix_api_token : null
      };

      if (isEditing && editingId) {
        const { data, error } = await supabase
          .from('monitoring_configs')
          .update(submitData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;


        showToast('Configuração atualizada com sucesso', 'success');
      } else {
        const { data, error } = await supabase
          .from('monitoring_configs')
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;


        showToast('Configuração criada com sucesso', 'success');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadConfigs();
      resetForm();
    } catch (error) {
      console.error('Error saving config:', error);
      showToast('Erro ao salvar configuração', 'error');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      type: 'ICMP',
      target: '',
      community: 'public',
      version: '2c',
      zabbix_host_id: '',
      zabbix_api_url: '',
      zabbix_api_token: '',
      interval: 60,
      enabled: true
    });
  }

  function handleEdit(config: MonitorConfig) {
    setFormData({
      name: config.name,
      type: config.type,
      target: config.target,
      community: config.community || 'public',
      version: config.version || '2c',
      zabbix_host_id: config.zabbix_host_id || '',
      zabbix_api_url: config.zabbix_api_url || '',
      zabbix_api_token: config.zabbix_api_token || '',
      interval: config.interval,
      enabled: config.enabled
    });
    setIsEditing(true);
    setEditingId(config.id);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('monitoring_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;


      showToast('Configuração excluída com sucesso', 'success');
      setDeleteConfirm(null);
      loadConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      showToast('Erro ao excluir configuração', 'error');
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  }

  const typeIcons = {
    ICMP: Radio,
    SNMP: Server,
    ZABBIX: Activity
  };

  const typeColors: Record<string, 'success' | 'info' | 'warning'> = {
    ICMP: 'success',
    SNMP: 'info',
    ZABBIX: 'warning'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {ToastContainer}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Monitoramento</h1>
            {autoRefreshing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Atualizando...</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configurações de ICMP, SNMP e Zabbix • Atualização automática a cada 30s
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="secondary"
            onClick={autoTestAllHosts}
            disabled={autoRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefreshing ? 'animate-spin' : ''}`} />
            Atualizar Agora
          </Button>
          {canManage(user!.role) && (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Configuração
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configs.map((config) => {
          const Icon = typeIcons[config.type];
          const status = statuses.get(config.id);
          const statusVariant = status?.status === 'UP' ? 'success' : status?.status === 'DOWN' ? 'danger' : 'default';
          const isTesting = testing.has(config.id);

          return (
            <Card key={config.id} className="hover:shadow-lg">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{config.name}</h3>
                      <Badge variant={typeColors[config.type]}>{config.type}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge variant={config.enabled ? 'success' : 'default'}>
                      {config.enabled ? 'Habilitado' : 'Desabilitado'}
                    </Badge>
                    {status && (
                      <Badge variant={statusVariant}>
                        {status.status === 'UP' ? '🟢 UP' : status.status === 'DOWN' ? '🔴 DOWN' : '⚪ UNKNOWN'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Alvo:</span> {config.target}
                  </p>

                  {status && status.response_time && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Latência:</span> {status.response_time}ms
                    </p>
                  )}

                  {status && status.last_check && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Última checagem:</span>{' '}
                      {new Date(status.last_check).toLocaleString('pt-BR')}
                    </p>
                  )}

                  {status && status.error_message && (
                    <p className="text-red-600 dark:text-red-400 text-xs">
                      <span className="font-medium">Erro:</span> {status.error_message}
                    </p>
                  )}

                  {config.type === 'SNMP' && config.community && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Community:</span> {config.community}
                    </p>
                  )}

                  {config.type === 'SNMP' && config.version && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Versão:</span> {config.version}
                    </p>
                  )}

                  {config.type === 'ZABBIX' && config.zabbix_host_id && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Host ID:</span> {config.zabbix_host_id}
                    </p>
                  )}

                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Intervalo:</span> {config.interval}s
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    onClick={() => testConnection(config)}
                    disabled={isTesting}
                    className="w-full"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Testar Conexão
                      </>
                    )}
                  </Button>

                  {canManage(user!.role) && (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleEdit(config)}
                        className="flex-1"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => setDeleteConfirm(config.id)}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {configs.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhuma configuração cadastrada</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title={isEditing ? "Editar Configuração" : "Nova Configuração"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Tipo de Monitoramento"
            options={[
              { value: 'ICMP', label: 'ICMP (Ping)' },
              { value: 'SNMP', label: 'SNMP' },
              { value: 'ZABBIX', label: 'Zabbix' }
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          />

          <Input
            label="Alvo (IP ou Hostname)"
            value={formData.target}
            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
            placeholder="192.168.1.1 ou host.example.com"
            required
          />

          {formData.type === 'SNMP' && (
            <>
              <Input
                label="Community String"
                value={formData.community}
                onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                placeholder="public"
              />

              <Select
                label="Versão SNMP"
                options={[
                  { value: '1', label: 'SNMPv1' },
                  { value: '2c', label: 'SNMPv2c' },
                  { value: '3', label: 'SNMPv3' }
                ]}
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </>
          )}

          {formData.type === 'ZABBIX' && (
            <>
              <Input
                label="Zabbix Host ID"
                value={formData.zabbix_host_id}
                onChange={(e) => setFormData({ ...formData, zabbix_host_id: e.target.value })}
                placeholder="10001"
              />

              <Input
                label="Zabbix API URL"
                value={formData.zabbix_api_url}
                onChange={(e) => setFormData({ ...formData, zabbix_api_url: e.target.value })}
                placeholder="https://zabbix.example.com/api_jsonrpc.php"
              />

              <Input
                label="Zabbix API Token"
                type="password"
                value={formData.zabbix_api_token}
                onChange={(e) => setFormData({ ...formData, zabbix_api_token: e.target.value })}
                placeholder="Token de autenticação"
              />
            </>
          )}

          <Input
            label="Intervalo (segundos)"
            type="number"
            value={formData.interval}
            onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) })}
            min={10}
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Habilitado
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">{isEditing ? 'Atualizar' : 'Criar'}</Button>
            <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja excluir esta configuração? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => handleDelete(deleteConfirm!)} className="flex-1">
              Confirmar
            </Button>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
