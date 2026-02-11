/**
 * VentureCRM - Production-Grade Multi-Tenant SaaS Application
 * 
 * Architecture:
 * - Role-based navigation (Super Admin vs Tenant Admin)
 * - Separate layouts for different user types
 * - Protected routes with role guards
 * - Persistent session management
 */

import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Core Pages
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Login from './pages/Login/Login';

// Tenant Pages
import PlotViewer from './pages/PlotViewer/PlotViewer';
import PlotManager from './pages/PlotManager/PlotManager';
import EnquiryManager from './pages/Enquiry/Enquiry';
import PlotDrawer from './pages/PlotDrawer/PlotDrawer';
import VentureManager from './pages/VentureManager/VentureManager';
import CustomerManager from './pages/Customers/CustomerManager';
import CustomerDetail from './pages/Customers/CustomerDetail';
import SalesPipeline from './pages/Pipeline/SalesPipeline';
import BookingManager from './pages/Bookings/BookingManager';
import BookingDetail from './pages/Bookings/BookingDetail';
import Reports from './pages/Reports/Reports';
import TenantSettings from './pages/Settings/TenantSettings';

// Super Admin Pages
import { SuperAdminDashboard, TenantManager, TenantDetail } from './pages/SuperAdmin';

// Auth Context
import { useAuth } from './contexts/AuthContext';

// ============================================================================
// NAVIGATION CONFIGURATIONS
// ============================================================================

/**
 * Super Admin Navigation - Platform-level management only
 */
const SUPER_ADMIN_NAV = [
  { path: '/admin', icon: '📊', label: 'Dashboard', description: 'Platform overview' },
  { path: '/admin/tenants', icon: '🏢', label: 'Tenants', description: 'Manage organizations' },
  { path: '/admin/users', icon: '👥', label: 'Users', description: 'All platform users' },
  { path: '/admin/analytics', icon: '📈', label: 'Analytics', description: 'Platform metrics' },
  { path: '/admin/billing', icon: '💳', label: 'Billing', description: 'Revenue & subscriptions' },
  { path: '/admin/system', icon: '⚙️', label: 'System', description: 'Platform settings' },
  { path: '/admin/logs', icon: '📋', label: 'Activity Logs', description: 'Audit trail' },
];

/**
 * Tenant Admin Navigation - Business operations
 */
const TENANT_NAV = [
  { path: '/', icon: '🏠', label: 'Dashboard', description: 'Business overview' },
  {
    section: 'Property Management',
    items: [
      { path: '/ventures', icon: '🏘️', label: 'Ventures', description: 'Manage projects' },
      { path: '/plots', icon: '🗺️', label: 'Plots', description: 'Plot management' },
    ]
  },
  {
    section: 'Sales & CRM',
    items: [
      { path: '/customers', icon: '👥', label: 'Customers', description: 'Customer database', badge: 'CRM' },
      { path: '/pipeline', icon: '📊', label: 'Pipeline', description: 'Sales funnel', badge: 'NEW' },
      { path: '/bookings', icon: '📋', label: 'Bookings', description: 'Manage bookings' },
      { path: '/enquiries', icon: '💬', label: 'Enquiries', description: 'Lead management' },
    ]
  },
  {
    section: 'Reports & Tools',
    items: [
      { path: '/reports', icon: '📈', label: 'Reports', description: 'Analytics & insights' },
      { path: '/plot-viewer', icon: '🔍', label: 'Plot Viewer', description: 'Interactive map' },
      { path: '/plot-drawer', icon: '✏️', label: 'Plot Drawer', description: 'Draw plots' },
    ]
  },
  { path: '/settings', icon: '⚙️', label: 'Settings', description: 'Organization settings' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Protected Route Wrapper - Ensures authentication and role access
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div className="spinner-border text-primary mb-3" role="status" />
          <p style={{ color: '#94a3b8' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on role
    if (user?.role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * Super Admin Layout - Platform management interface ....
 */
const SuperAdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
        borderRight: '1px solid rgba(99, 102, 241, 0.2)',
        position: 'fixed',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
          background: 'rgba(99, 102, 241, 0.05)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🏛️</span>
            Plot3D
          </h2>
          <div style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000',
              fontSize: '0.65rem',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Platform Admin
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          {SUPER_ADMIN_NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                marginBottom: '0.5rem',
                borderRadius: '10px',
                textDecoration: 'none',
                color: isActive(item.path) ? '#fff' : '#94a3b8',
                background: isActive(item.path)
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)'
                  : 'transparent',
                border: isActive(item.path)
                  ? '1px solid rgba(99, 102, 241, 0.5)'
                  : '1px solid transparent',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <div>
                <div>{item.label}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                  {item.description}
                </div>
              </div>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(99, 102, 241, 0.2)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '600'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: '500' }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: '280px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        width: 'calc(100% - 280px)',
        overflowX: 'hidden'
      }}>
        {children}
      </main>
    </div>
  );
};

/**
 * Tenant Layout - Business operations interface
 */
const TenantLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        position: 'fixed',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f472b6 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ✨ Plot3D
          </h2>
          {tenant && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1rem' }}>🏢</span>
              <div>
                <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>
                  {tenant.name || 'Organization'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', textTransform: 'capitalize' }}>
                  {tenant.plan || 'Professional'} Plan
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          {TENANT_NAV.map((item, idx) => {
            // Section with items
            if (item.section) {
              return (
                <div key={idx} style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    padding: '0.5rem 1rem',
                    marginBottom: '0.25rem'
                  }}>
                    {item.section}
                  </div>
                  {item.items.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        marginBottom: '0.25rem',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: isActive(subItem.path) ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                        background: isActive(subItem.path)
                          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)'
                          : 'transparent',
                        border: isActive(subItem.path)
                          ? '1px solid rgba(139, 92, 246, 0.5)'
                          : '1px solid transparent',
                        transition: 'all 0.2s ease',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{subItem.icon}</span>
                      {subItem.label}
                      {subItem.badge && (
                        <span style={{
                          marginLeft: 'auto',
                          background: subItem.badge === 'NEW'
                            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          fontSize: '0.6rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          color: '#fff'
                        }}>
                          {subItem.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              );
            }

            // Single item
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: isActive(item.path) ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  background: isActive(item.path)
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)'
                    : 'transparent',
                  border: isActive(item.path)
                    ? '1px solid rgba(139, 92, 246, 0.5)'
                    : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '600'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: '500' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'capitalize' }}>
                {user?.role?.replace('_', ' ') || 'Admin'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: '280px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        width: 'calc(100% - 280px)',
        overflowX: 'hidden'
      }}>
        {children}
      </main>
    </div>
  );
};

/**
 * Public Layout - No sidebar (Login, Public pages)
 */
const PublicLayout = ({ children }) => {
  return <>{children}</>;
};

// ============================================================================
// PLACEHOLDER COMPONENTS FOR NEW SUPER ADMIN PAGES
// ============================================================================

const AdminUsersPage = () => (
  <div style={{ padding: '2rem', color: '#fff' }}>
    <h1 style={{ marginBottom: '1rem' }}>👥 Platform Users</h1>
    <p style={{ color: '#94a3b8' }}>Manage all users across all tenants</p>
  </div>
);

const AdminAnalyticsPage = () => (
  <div style={{ padding: '2rem', color: '#fff' }}>
    <h1 style={{ marginBottom: '1rem' }}>📈 Platform Analytics</h1>
    <p style={{ color: '#94a3b8' }}>View platform-wide metrics and insights</p>
  </div>
);

const AdminBillingPage = () => (
  <div style={{ padding: '2rem', color: '#fff' }}>
    <h1 style={{ marginBottom: '1rem' }}>💳 Billing & Revenue</h1>
    <p style={{ color: '#94a3b8' }}>Manage subscriptions and view revenue</p>
  </div>
);

const AdminSystemPage = () => (
  <div style={{ padding: '2rem', color: '#fff' }}>
    <h1 style={{ marginBottom: '1rem' }}>⚙️ System Settings</h1>
    <p style={{ color: '#94a3b8' }}>Configure platform-wide settings</p>
  </div>
);

const AdminLogsPage = () => (
  <div style={{ padding: '2rem', color: '#fff' }}>
    <h1 style={{ marginBottom: '1rem' }}>📋 Activity Logs</h1>
    <p style={{ color: '#94a3b8' }}>View audit trail and system logs</p>
  </div>
);

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

const App = () => {
  const { user, loading, isAuthenticated, isSuperAdmin } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div className="spinner-border text-primary mb-3" role="status" />
          <p style={{ color: '#94a3b8' }}>Loading Plot3D...</p>
        </div>
      </div>
    );
  }

  // Public routes (no layout)
  const publicPaths = ['/login', '/plot-viewer'];
  if (publicPaths.includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/plot-viewer" element={<PlotViewer />} />
      </Routes>
    );
  }

  // Determine layout based on user role
  if (isAuthenticated() && isSuperAdmin()) {
    // Super Admin Routes
    return (
      <SuperAdminLayout>
        <Routes>
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="super_admin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/tenants" element={
            <ProtectedRoute requiredRole="super_admin">
              <TenantManager />
            </ProtectedRoute>
          } />
          <Route path="/admin/tenants/:id" element={
            <ProtectedRoute requiredRole="super_admin">
              <TenantDetail />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="super_admin">
              <AdminUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute requiredRole="super_admin">
              <AdminAnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/billing" element={
            <ProtectedRoute requiredRole="super_admin">
              <AdminBillingPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/system" element={
            <ProtectedRoute requiredRole="super_admin">
              <AdminSystemPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute requiredRole="super_admin">
              <AdminLogsPage />
            </ProtectedRoute>
          } />
          {/* Redirect all other paths to admin dashboard */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </SuperAdminLayout>
    );
  }

  if (isAuthenticated()) {
    // Tenant Admin Routes
    return (
      <TenantLayout>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/ventures" element={
            <ProtectedRoute>
              <VentureManager />
            </ProtectedRoute>
          } />
          <Route path="/plots" element={
            <ProtectedRoute>
              <PlotManager />
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute>
              <CustomerManager />
            </ProtectedRoute>
          } />
          <Route path="/customers/:id" element={
            <ProtectedRoute>
              <CustomerDetail />
            </ProtectedRoute>
          } />
          <Route path="/pipeline" element={
            <ProtectedRoute>
              <SalesPipeline />
            </ProtectedRoute>
          } />
          <Route path="/bookings" element={
            <ProtectedRoute>
              <BookingManager />
            </ProtectedRoute>
          } />
          <Route path="/bookings/:id" element={
            <ProtectedRoute>
              <BookingDetail />
            </ProtectedRoute>
          } />
          <Route path="/enquiries" element={
            <ProtectedRoute>
              <EnquiryManager />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <TenantSettings />
            </ProtectedRoute>
          } />
          <Route path="/plot-drawer" element={
            <ProtectedRoute>
              <PlotDrawer />
            </ProtectedRoute>
          } />
          <Route path="/about" element={<About />} />
          {/* Redirect old paths */}
          <Route path="/venture-manager" element={<Navigate to="/ventures" replace />} />
          <Route path="/plot-management" element={<Navigate to="/plots" replace />} />
          <Route path="/enquiry-management" element={<Navigate to="/enquiries" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TenantLayout>
    );
  }

  // Not authenticated - redirect to login
  return <Navigate to="/login" replace />;
};

export default App;