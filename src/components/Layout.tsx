import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { isAdmin, canManage } from '../lib/auth';
import { NotificationBell } from './NotificationBell';
import {
  LayoutDashboard,
  Server,
  Network,
  Box,
  Globe,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Users,
  FileText,
  CheckSquare,
  Shield,
  LogOut,
  Menu,
  X,
  Activity,
  Moon,
  Sun,
  Radio
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Equipamentos', href: '/equipments', icon: Server, show: true },
    { name: 'Interfaces', href: '/interfaces', icon: Network, show: true },
    { name: 'POPs', href: '/pops', icon: Box, show: true },
    { name: 'VLANs', href: '/vlans', icon: Activity, show: true },
    { name: 'IPAM', href: '/ipam', icon: Globe, show: true },
    { name: 'Circuitos', href: '/circuits', icon: LinkIcon, show: true },
    { name: 'Serviços', href: '/services', icon: SettingsIcon, show: true },
    { name: 'Monitoramento', href: '/monitoring', icon: Radio, show: ['ADMIN', 'NOC'].includes(user?.role || '') },
    { name: 'Runbooks', href: '/runbooks', icon: FileText, show: true },
    { name: 'Checklists', href: '/checklists', icon: CheckSquare, show: ['ADMIN', 'NOC', 'FIELD_TECH'].includes(user?.role || '') },
  ];

  const adminNavigation = [
    { name: 'Usuários', href: '/admin/users', icon: Users, show: isAdmin(user?.role || 'VIEWER') },
    { name: 'Auditoria', href: '/admin/audit', icon: Shield, show: canManage(user?.role || 'VIEWER') },
    { name: 'Configurações', href: '/settings', icon: SettingsIcon, show: isAdmin(user?.role || 'VIEWER') },
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="fixed top-0 left-0 right-0 lg:left-64 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-40">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 lg:hidden">ISP NOC</h1>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationBell />
          <button
            onClick={toggleTheme}
            className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
          </button>
        </div>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ISP NOC</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Network Operations</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navigation.filter(item => item.show).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {adminNavigation.some(item => item.show) && (
              <>
                <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Administração
                  </p>
                  {adminNavigation.filter(item => item.show).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-300 font-semibold">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
              </div>
            </div>
            <div className="space-y-1">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:pl-64 pt-16 lg:pt-20">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
