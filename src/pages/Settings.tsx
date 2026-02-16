import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Configurações</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Configurações e integrações do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Integrações Futuras</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Importar equipamentos via CSV</li>
              <li>• Integração com Zabbix</li>
              <li>• Poll SNMP automático</li>
              <li>• Backup automático de configurações</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Essas funcionalidades serão implementadas em versões futuras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Versão</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">1.0.0</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Ambiente</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Production</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
