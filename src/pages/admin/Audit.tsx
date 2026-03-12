import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { Shield, Search } from 'lucide-react';

export function Audit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:user_id (email, username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) setLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      showToast('Erro ao carregar logs de auditoria', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const actionColors: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
    CREATE: 'success',
    UPDATE: 'info',
    DELETE: 'danger',
    LOGIN_SUCCESS: 'success',
    LOGIN_FAILED: 'danger',
    LOGOUT: 'default',
    REVEAL_SECRET: 'warning',
    ACKNOWLEDGE: 'success'
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

      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Auditoria</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Logs de auditoria do sistema</p>
      </div>

      <Card className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            placeholder="Buscar por ação, entidade ou usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-lg">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Shield className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={actionColors[log.action] || 'default'}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {log.entity_type}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {log.user ? (
                        <>
                          <span className="font-medium">
                            {log.user.full_name || log.user.username || log.user.email}
                          </span>
                          {log.action === 'ACKNOWLEDGE' ? (
                            <>
                              {' reconheceu alerta de '}
                              <span className="font-medium">{log.entity_type}</span>
                            </>
                          ) : (
                            <>
                              {' realizou '}
                              <span className="font-medium">{log.action}</span>
                              {' em '}
                              <span className="font-medium">{log.entity_type}</span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="font-medium">Sistema</span>
                          {' realizou '}
                          <span className="font-medium">{log.action}</span>
                        </>
                      )}
                    </p>

                    {log.action === 'ACKNOWLEDGE' && log.after_data && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Host: <span className="text-gray-900 dark:text-gray-100">{log.after_data.host_name}</span>
                        </p>
                        {log.after_data.target && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Alvo: {log.after_data.target}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Reconhecido em: {new Date(log.after_data.acknowledged_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhum log de auditoria encontrado</p>
        </div>
      )}
    </div>
  );
}
