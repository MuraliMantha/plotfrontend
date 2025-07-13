import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert } from 'react-bootstrap';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        navigate('/admin');
      } else {
        setError('Invalid credentials. Try again.');
      }
    } catch (err) {
        console.log(err)
      setError('Invalid credentials. Try again.');
    }
  };

  return (
    <Container
      fluid
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '32px',
          minWidth: '350px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '20px',
            color: '#1f2937',
          }}
        >
          🔒 Admin Login
        </h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                transition: 'all 0.2s',
              }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                transition: 'all 0.2s',
              }}
            />
          </Form.Group>
          <Button
            variant="primary"
            type="submit"
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #4f46e5, #3b82f6)',
              border: 'none',
              padding: '12px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '1.125rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
            }}
          >
            Login
          </Button>
          {error && (
            <Alert variant="danger" style={{ marginTop: '8px', fontSize: '1rem' }}>
              {error}
            </Alert>
          )}
        </Form>
      </div>
    </Container>
  );
};

export default Login;