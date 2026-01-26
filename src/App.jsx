import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Nav, Container, Navbar } from 'react-bootstrap';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Login from './pages/Login/Login';
import Admin from './pages/Admin/Admin';
import PlotViewer from './pages/PlotViewer/PlotViewer';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
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

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check for admin_token in localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token && location.pathname !== '/login' && location.pathname !== '/plot') {
      navigate('/login');
    }
  }, [navigate, location.pathname]);

  // Determine if sidebar should be displayed
  const showSidebar = localStorage.getItem('admin_token') && location.pathname !== '/plot';

  // Navigation items configuration
  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/about', icon: 'ℹ️', label: 'About' },
    { path: '/venture-manager', icon: '🏘️', label: 'Venture Manager' },
    { path: '/plot-management', icon: '🛠️', label: 'Plot Manager' },
    { path: '/customers', icon: '👥', label: 'Customers', isNew: true },
    { path: '/pipeline', icon: '📊', label: 'Sales Pipeline', isNew: true },
    { path: '/bookings', icon: '📋', label: 'Bookings', isNew: true },
    { path: '/reports', icon: '📈', label: 'Reports', isNew: true },
    { path: '/enquiry-management', icon: '💬', label: 'Enquiries' },
    { path: '/plot', icon: '🗺️', label: 'Plot Viewer' },
    { path: '/plot-drawer', icon: '✏️', label: 'Plot Drawer' },
  ];

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: location.pathname === '/plot' ? 'none' : 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
      }}
    >
      {/* Sidebar */}
      {showSidebar && (
        <div
          style={{
            width: '260px',
            background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
            color: '#fff',
            fontFamily: "'Inter', 'Poppins', sans-serif",
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
            position: 'fixed',
            height: '100vh',
            padding: '1.5rem',
            zIndex: 1000,
            overflowY: 'auto'
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #fbbf24, #f472b6, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.25rem',
              }}
            >
              ✨ Plot3D
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
              Version 3.0
            </span>
          </div>

          {/* Navigation */}
          <Nav className="flex-column">
            {navItems.map((item) => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                className="mb-2 p-3 rounded nav-link-custom"
                style={{
                  color: location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? '#fff' : 'rgba(255,255,255,0.7)',
                  background: location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.3) 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? '1px solid rgba(139,92,246,0.5)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  borderRadius: '10px'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                {item.label}
                {item.isNew && (
                  <span style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    fontSize: '0.6rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    marginLeft: 'auto'
                  }}>
                    NEW
                  </span>
                )}
              </Nav.Link>
            ))}

            {/* Logout Button */}
            <Nav.Link
              onClick={() => {
                localStorage.removeItem('admin_token');
                navigate('/login');
              }}
              className="mt-4 p-3 rounded nav-link-custom"
              style={{
                color: '#fca5a5',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                borderRadius: '10px'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🚪</span>
              Logout
            </Nav.Link>
          </Nav>
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: showSidebar ? '260px' : '0',
          padding: location.pathname === '/plot' ? '0' : '20px',
          transition: 'margin-left 0.3s ease',
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/venture-manager" element={<VentureManager />} />
          <Route path="/plot-management" element={<PlotManager />} />
          <Route path="/enquiry-management" element={<EnquiryManager />} />
          <Route path="/customers" element={<CustomerManager />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/pipeline" element={<SalesPipeline />} />
          <Route path="/bookings" element={<BookingManager />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/plot" element={<PlotViewer />} />
          <Route path="/plot-drawer" element={<PlotDrawer />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;