import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../App.css'
import PlotManager from '../PlotManager/PlotManager';
import EnquiryManager from '../Enquiry/Enquiry';

const Admin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minHeight: 'calc(100vh - 104px)' }}>
      <Navbar
        bg="light"
        expand="lg"
        className="mb-4 rounded shadow-sm"
        style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}
      >
        <Container>
          <Navbar.Brand style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 'bold', color: '#6b48ff', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 28 28">
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <rect x="4" y="7" width="20" height="14" rx="4" fill="url(#g1)" />
                <rect x="10" y="2" width="8" height="8" rx="2" fill="#fff" opacity="0.7" />
              </svg>
            </span>
            Plot3D
          </Navbar.Brand>
          <Navbar.Text style={{ flex: 1, textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
            Admin Panel
          </Navbar.Text>
        </Container>
      </Navbar>
      <Container style={{ maxWidth: 'calc(100vw - 20vw)', padding: '0' }}>
        <PlotManager />
        <EnquiryManager />
      </Container>
    </div>
  );
};

export default Admin;