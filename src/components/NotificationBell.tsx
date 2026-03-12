import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Bell, AlertCircle, Clock, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DownHost {
  id: string;
  config_id: string;
  status: string;
  response_time: number | null;
  last_check: string;
  error_message: string | null;
  consecutive_failures: number;
  config: {
    name: string;
    type: string;
    target: string;
  };
  acknowledged?: boolean;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [downHosts, setDownHosts] = useState<DownHost[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  useEffect(() => {
    loadDownHosts();
    const interval = setInterval(loadDownHosts, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadDownHosts() {
    try {
      const { data, error } = await supabase
        .from('monitoring_status')
        .select(`
          *,
          config:monitoring_configs(name, type, target)
        `)
        .eq('status', 'DOWN')
        .order('last_check', { ascending: false });

      if (error) throw error;

      if (data) {
        const statusIds = data.map(d => d.id);

        const { data: acks } = await supabase
          .from('alert_acknowledgements')
          .select('monitoring_status_id')
          .in('monitoring_status_id', statusIds);

        const acknowledgedIds = new Set(acks?.map(a => a.monitoring_status_id) || []);

        const hostsWithAckStatus = data.map(host => ({
          ...host,
          acknowledged: acknowledgedIds.has(host.id)
        }));

        const unacknowledgedHosts = hostsWithAckStatus.filter(h => !h.acknowledged);
        setDownHosts(unacknowledgedHosts as any);
      }
    } catch (error) {
      console.error('Error loading down hosts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function acknowledgeAlert(hostId: string, hostName: string, target: string) {
    if (!user) return;

    setAcknowledgingId(hostId);
    try {
      const { error } = await supabase
        .from('alert_acknowledgements')
        .insert([{
          monitoring_status_id: hostId,
          acknowledged_by: user.id,
          notes: `Alerta reconhecido para ${hostName} (${target})`
        }]);

      if (error) throw error;


      await loadDownHosts();
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
    } finally {
      setAcknowledgingId(null);
    }
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleString('pt-BR');
  }

  const downCount = downHosts.length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notificações"
      >
        <Bell className={`w-6 h-6 ${downCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
        {downCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {downCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Hosts Inativos
              </h3>
              {downCount > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {downCount} {downCount === 1 ? 'host inativo' : 'hosts inativos'}
                </p>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Carregando...
                </div>
              ) : downCount === 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <Bell className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Todos os hosts estão funcionando normalmente
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {downHosts.map((host) => (
                    <div
                      key={host.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {host.config?.name || 'Host desconhecido'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {host.config?.target}
                          </p>
                          {host.error_message && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {host.error_message}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimestamp(host.last_check)}
                            </span>
                            <span className="flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {host.consecutive_failures} falhas
                            </span>
                          </div>
                          <button
                            onClick={() => acknowledgeAlert(
                              host.id,
                              host.config?.name || 'Host',
                              host.config?.target || ''
                            )}
                            disabled={acknowledgingId === host.id}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {acknowledgingId === host.id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                Reconhecendo...
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                Reconhecer Alerta
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {downCount > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <a
                  href="/monitoring"
                  className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  onClick={() => setShowDropdown(false)}
                >
                  Ver todos os monitoramentos
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
