import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Server, Network, Box, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalEquipment: 0,
    activeEquipment: 0,
    totalInterfaces: 0,
    totalPOPs: 0,
    failedEquipment: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const equipment = await api.get('/equipment');
      const interfaces = await api.get('/interfaces');
      const pops = await api.get('/pops');

      const activeEquipment = equipment?.filter((e: any) => e.status === 'ACTIVE').length || 0;
      const failedEquipment = equipment?.filter((e: any) => e.status === 'FAILED').length || 0;

      setStats({
        totalEquipment: equipment?.length || 0,
        activeEquipment,
        totalInterfaces: interfaces?.length || 0,
        totalPOPs: pops?.length || 0,
        failedEquipment
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Total de Equipamentos',
      value: stats.totalEquipment,
      icon: Server,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/50'
    },
    {
      title: 'Equipamentos Ativos',
      value: stats.activeEquipment,
      icon: Server,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/50'
    },
    {
      title: 'Total de Interfaces',
      value: stats.totalInterfaces,
      icon: Network,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/50'
    },
    {
      title: 'POPs',
      value: stats.totalPOPs,
      icon: Box,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/50'
    },
    {
      title: 'Equipamentos em Falha',
      value: stats.failedEquipment,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/50'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Visão geral do sistema ISP NOC</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao ISP NOC System</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Sistema profissional de gestão de rede para ISP/NOC com inventário completo,
              documentação técnica e controle de acesso baseado em roles.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Inventário completo de equipamentos (OLT, Switch, Router, etc)</li>
              <li>• Gestão de POPs e Racks</li>
              <li>• VLAN Registry e IPAM</li>
              <li>• Gestão de Circuitos e Serviços</li>
              <li>• Runbooks e Checklists</li>
              <li>• Auditoria completa com logs detalhados</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
