import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Equipments } from './pages/Equipments';
import { POPs } from './pages/POPs';
import { VLANs } from './pages/VLANs';
import { Interfaces } from './pages/Interfaces';
import { IPAM } from './pages/IPAM';
import { Circuits } from './pages/Circuits';
import { Services } from './pages/Services';
import { Runbooks } from './pages/Runbooks';
import { Checklists } from './pages/Checklists';
import { Monitoring } from './pages/Monitoring';
import { Users } from './pages/admin/Users';
import { Audit } from './pages/admin/Audit';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipments/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Equipments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pops"
            element={
              <ProtectedRoute>
                <Layout>
                  <POPs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vlans"
            element={
              <ProtectedRoute>
                <Layout>
                  <VLANs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interfaces"
            element={
              <ProtectedRoute>
                <Layout>
                  <Interfaces />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ipam"
            element={
              <ProtectedRoute>
                <Layout>
                  <IPAM />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/circuits"
            element={
              <ProtectedRoute>
                <Layout>
                  <Circuits />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <Layout>
                  <Services />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/runbooks"
            element={
              <ProtectedRoute>
                <Layout>
                  <Runbooks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklists"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'NOC', 'FIELD_TECH']}>
                <Layout>
                  <Checklists />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitoring"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'NOC']}>
                <Layout>
                  <Monitoring />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'NOC']}>
                <Layout>
                  <Audit />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
