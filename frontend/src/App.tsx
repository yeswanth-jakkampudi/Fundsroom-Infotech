import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { UserRole } from './types';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';           // Admin dashboard
import { SalesDashboard } from './pages/SalesDashboard';
import { WarehouseDashboard } from './pages/WarehouseDashboard';
import { AccountsDashboard } from './pages/AccountsDashboard';
import { Customers } from './pages/Customers';
import { CustomerDetails } from './pages/CustomerDetails';
import { Products } from './pages/Products';
import { CreateChallan } from './pages/CreateChallan';
import { ChallanList } from './pages/ChallanList';

// Map each role to its default dashboard route
const ROLE_HOME: Record<UserRole, string> = {
  Admin:     '/admin/dashboard',
  Sales:     '/sales/dashboard',
  Warehouse: '/warehouse/dashboard',
  Accounts:  '/accounts/dashboard',
};

// ----- Role Guard -----
interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role as UserRole)) {
    // Redirect to their own dashboard if they try to access a forbidden route
    const home = ROLE_HOME[user.role as UserRole] || '/login';
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
};

// ----- Protected Layout (wraps sidebar + navbar) -----
const ProtectedLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-spinner-wrapper" style={{ minHeight: '100vh', background: '#0f172a' }}>
        <div className="spinner"></div>
        <span>Authenticating Session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          <Routes>
            {/* ---- Admin routes ---- */}
            <Route
              path="/admin/dashboard"
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <Dashboard />
                </RoleGuard>
              }
            />

            {/* ---- Sales routes ---- */}
            <Route
              path="/sales/dashboard"
              element={
                <RoleGuard allowedRoles={['Sales']}>
                  <SalesDashboard />
                </RoleGuard>
              }
            />

            {/* ---- Warehouse routes ---- */}
            <Route
              path="/warehouse/dashboard"
              element={
                <RoleGuard allowedRoles={['Warehouse']}>
                  <WarehouseDashboard />
                </RoleGuard>
              }
            />

            {/* ---- Accounts routes ---- */}
            <Route
              path="/accounts/dashboard"
              element={
                <RoleGuard allowedRoles={['Accounts']}>
                  <AccountsDashboard />
                </RoleGuard>
              }
            />

            {/* ---- Shared module routes (role-restricted) ---- */}
            <Route
              path="/customers"
              element={
                <RoleGuard allowedRoles={['Admin', 'Sales']}>
                  <Customers />
                </RoleGuard>
              }
            />
            <Route
              path="/customers/:id"
              element={
                <RoleGuard allowedRoles={['Admin', 'Sales']}>
                  <CustomerDetails />
                </RoleGuard>
              }
            />
            <Route
              path="/products"
              element={
                <RoleGuard allowedRoles={['Admin', 'Warehouse']}>
                  <Products />
                </RoleGuard>
              }
            />
            <Route
              path="/challans/new"
              element={
                <RoleGuard allowedRoles={['Admin', 'Sales']}>
                  <CreateChallan />
                </RoleGuard>
              }
            />
            <Route
              path="/challans"
              element={
                <RoleGuard allowedRoles={['Admin', 'Sales', 'Accounts']}>
                  <ChallanList />
                </RoleGuard>
              }
            />

            {/* ---- Root redirect → role home ---- */}
            <Route
              path="/"
              element={<Navigate to={ROLE_HOME[user.role as UserRole] || '/admin/dashboard'} replace />}
            />

            {/* ---- Fallback: redirect to role home ---- */}
            <Route
              path="*"
              element={<Navigate to={ROLE_HOME[user.role as UserRole] || '/admin/dashboard'} replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
