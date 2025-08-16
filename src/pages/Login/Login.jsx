import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert } from 'react-bootstrap';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        navigate('/plot-management');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.log(err);
      setError('Connection failed. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputFocusHandlers = {
    onFocus: (e) => {
      e.target.style.borderColor = '#3b82f6';
      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
      e.target.style.transform = 'translateY(-1px)';
    },
    onBlur: (e) => {
      e.target.style.borderColor = '#e2e8f0';
      e.target.style.boxShadow = 'none';
      e.target.style.transform = 'translateY(0)';
    },
  };

  return (
    <Container
      fluid
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem'
      }}
    >
      {/* Background Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '200px',
        height: '200px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        filter: 'blur(60px)'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '50%',
        filter: 'blur(80px)'
      }} />

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          padding: '3rem',
          minWidth: '420px',
          maxWidth: '450px',
          width: '100%',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Logo/Icon Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2rem',
            boxShadow: '0 10px 30px rgba(79, 70, 229, 0.3)'
          }}>
            🏢
          </div>
          
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #1e293b, #475569)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            Admin Portal
          </h1>
          
          <p style={{
            color: '#64748b',
            fontSize: '0.875rem',
            fontWeight: '400',
            margin: 0
          }}>
            Sign in to access your dashboard
          </p>
        </div>

        <Form onSubmit={handleSubmit}>
          {/* Username Field */}
          <Form.Group className="mb-4">
            <Form.Label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              👤 Username
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                background: 'rgba(248, 250, 252, 0.8)',
                fontWeight: '400'
              }}
              {...inputFocusHandlers}
            />
          </Form.Group>

          {/* Password Field */}
          <Form.Group className="mb-4">
            <Form.Label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🔒 Password
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                background: 'rgba(248, 250, 252, 0.8)',
                fontWeight: '400'
              }}
              {...inputFocusHandlers}
            />
          </Form.Group>

          {/* Error Alert */}
          {error && (
            <Alert 
              variant="danger" 
              style={{ 
                marginBottom: '1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                fontSize: '0.875rem',
                fontWeight: '500',
                padding: '0.875rem 1rem'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ⚠️ {error}
              </div>
            </Alert>
          )}

          {/* Login Button */}
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading 
                ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                : 'linear-gradient(135deg, #4f46e5, #3b82f6)',
              border: 'none',
              padding: '0.875rem 1rem',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '1rem',
              boxShadow: isLoading 
                ? 'none'
                : '0 4px 15px rgba(79, 70, 229, 0.4)',
              transition: 'all 0.2s ease',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.4)';
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing in...
              </>
            ) : (
              <>
                🚀 Sign In
              </>
            )}
          </Button>

          {/* Additional Info */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(248, 250, 252, 0.8)',
            borderRadius: '10px',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <p style={{
              color: '#64748b',
              fontSize: '0.75rem',
              margin: '0',
              fontWeight: '400'
            }}>
              🔐 Secure admin access • Protected by encryption
            </p>
          </div>
        </Form>

        {/* Loading Animation Styles */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </Container>
  );
};

export default Login;