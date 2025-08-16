import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Nav, Container, Navbar } from 'react-bootstrap';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Login from './pages/Login/Login';
import Admin from './pages/Admin/Admin';
// import PlotViewer from './pages/PlotViewer/PlotViewer';
// import PlotProvider from './pages/PlotViewer/PlotContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import PlotManager from './pages/PlotManager/PlotManager';
import EnquiryManager from './pages/Enquiry/Enquiry';

const App = () => {
  const navigate = useNavigate();

  // Check for admin_token in localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token && window.location.pathname !== '/login') {
      navigate('/login');
    }
  }, [navigate]);

  return (
    // <PlotProvider>
      <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)' }}>
        {/* Sidebar */}
        {localStorage.getItem('admin_token') && (
          <div
            style={{
              width: '20vw',
              background: 'linear-gradient(180deg, #6b48ff 0%, #00ddeb 100%)',
              color: '#fff',
              fontFamily: "'Poppins', sans-serif",
              boxShadow: '2px 0 10px rgba(0, 0, 0, 0.2)',
              position: 'fixed',
              height: '100vh',
              padding: '20px',
              zIndex: 1000,
            }}
          >
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                background: 'linear-gradient(45deg, #ff6b6b, #ffe66d)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '20px',
              }}
            >
              ✨ Plot 3D
            </h3>
            <Nav className="flex-column">
              <Nav.Link
                as={Link}
                to="/"
                className="mb-2 p-3 rounded nav-link-custom"
                style={{ color: '#fff', background: 'rgba(255, 255, 255, 0.1)' }}
              >
                🏠 Home
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/about"
                className="mb-2 p-3 rounded nav-link-custom"
                style={{ color: '#fff', background: 'rgba(255, 255, 255, 0.1)' }}
              >
                ℹ️ About
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/plot-management"
                className="mb-2 p-3 rounded nav-link-custom"
                style={{ color: '#fff', background: 'rgba(255, 255, 255, 0.1)' }}
              >
                🛠️ Plot Manager
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/enquiry-management"
                className="mb-2 p-3 rounded nav-link-custom"
                style={{ color: '#fff', background: 'rgba(255, 255, 255, 0.1)' }}
              >
                🛠️ Enquiry Manager
              </Nav.Link>
              {/* <Nav.Link
                as={Link}
                to="/plot"
                className="mb-2 p-3 rounded nav-link-custom"
                style={{ color: '#fff', background: 'rgba(255, 255, 255, 0.1)' }}
              >
                📊 Plot
              </Nav.Link> */}
              <Nav.Link
                onClick={() => {
                  localStorage.removeItem('admin_token');
                  navigate('/login');
                }}
                className="mt-4 p-3 rounded nav-link-custom"
                style={{ color: '#ff6b6b', background: 'rgba(255, 255, 255, 0.2)' }}
              >
                🚪 Logout
              </Nav.Link>
            </Nav>
          </div>
        )}

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            marginLeft: localStorage.getItem('admin_token') ? '20vw' : '0',
            padding: '20px',
            transition: 'margin-left 0.3s ease',
          }}
        >
      
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/plot-management" element={<PlotManager />} />
            <Route path="/enquiry-management" element={<EnquiryManager />} />
            {/* <Route path="/plot" element={<PlotViewer />} /> */}
          </Routes>
        </div>
      </div>
    // </PlotProvider>
  );
};

export default App;