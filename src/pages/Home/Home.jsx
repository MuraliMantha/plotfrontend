import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

// V2 Theme Colors
const colors = {
  primary: '#6366f1',
  secondary: '#22d3ee',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#0f172a',
  darker: '#020617',
  cardBg: 'rgba(30, 41, 59, 0.8)',
  cardBorder: 'rgba(71, 85, 105, 0.5)',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
};

const Home = () => {
  const [ventures, setVentures] = useState([]);
  const [stats, setStats] = useState({
    totalVentures: 0,
    totalPlots: 0,
    availablePlots: 0,
    soldPlots: 0,
    reservedPlots: 0,
    totalEnquiries: 0,
    totalArea: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');

      // Fetch ventures
      const venturesRes = await fetch(`${API_BASE}/ventures`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const venturesData = await venturesRes.json();

      // Fetch plots
      const plotsRes = await fetch(`${API_BASE}/plot`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const plotsData = await plotsRes.json();

      // Fetch enquiries
      const enquiriesRes = await fetch(`${API_BASE}/enquiries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const enquiriesData = await enquiriesRes.json();

      // Handle both array and object responses
      const venturesList = Array.isArray(venturesData) ? venturesData : (venturesData.data || []);
      setVentures(venturesList.slice(0, 4));

      const plots = plotsData.features || [];
      const enquiries = Array.isArray(enquiriesData) ? enquiriesData : [];

      setStats({
        totalVentures: venturesList.length,
        totalPlots: plots.length,
        availablePlots: plots.filter(p => p.properties?.status?.toLowerCase() === 'available').length,
        soldPlots: plots.filter(p => p.properties?.status?.toLowerCase() === 'sold').length,
        reservedPlots: plots.filter(p => p.properties?.status?.toLowerCase() === 'reserved').length,
        totalEnquiries: enquiries.length,
        totalArea: plots.reduce((sum, p) => sum + (parseFloat(p.properties?.area) || 0), 0),
        totalRevenue: plots
          .filter(p => p.properties?.status?.toLowerCase() === 'sold')
          .reduce((sum, p) => sum + (parseInt(p.properties?.price) || 0), 0)
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const quickActions = [
    { path: '/venture-manager', icon: '🏘️', label: 'Manage Ventures', color: '#8b5cf6' },
    { path: '/plot-drawer', icon: '✏️', label: 'Draw Plots', color: '#6366f1' },
    { path: '/plot', icon: '🗺️', label: 'View Plots', color: '#22c55e' },
    { path: '/plot-manager', icon: '📋', label: 'Plot Manager', color: '#22d3ee' },
    { path: '/enquiry-management', icon: '📧', label: 'Enquiries', color: '#f59e0b' },
    { path: '/analytics', icon: '📊', label: 'Analytics', color: '#ec4899' },
  ];

  const statsCards = [
    { label: 'Total Ventures', value: stats.totalVentures, icon: '🏢', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' },
    { label: 'Total Plots', value: stats.totalPlots, icon: '🗺️', gradient: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)' },
    { label: 'Available', value: stats.availablePlots, icon: '✅', gradient: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)' },
    { label: 'Sold', value: stats.soldPlots, icon: '🏷️', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
    { label: 'Reserved', value: stats.reservedPlots, icon: '🔒', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    { label: 'Enquiries', value: stats.totalEnquiries, icon: '📧', gradient: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)' },
  ];

  if (loading) {
    return (
      <Container fluid style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(180deg, ${colors.darker} 0%, ${colors.dark} 100%)`
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(99, 102, 241, 0.3)',
            borderTopColor: colors.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: colors.textMuted }}>Loading dashboard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Container>
    );
  }

  return (
    <Container fluid style={{
      padding: '2rem',
      background: `linear-gradient(180deg, ${colors.darker} 0%, ${colors.dark} 100%)`,
      minHeight: '100vh'
    }}>
      {/* Hero Header */}
      <Row className="mb-4">
        <Col>
          <div style={{
            background: colors.gradient,
            borderRadius: '24px',
            padding: '3rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(99, 102, 241, 0.3)'
          }}>
            {/* Decorative elements */}
            <div style={{
              position: 'absolute',
              right: '-80px',
              top: '-80px',
              width: '300px',
              height: '300px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              filter: 'blur(40px)'
            }} />
            <div style={{
              position: 'absolute',
              left: '30%',
              bottom: '-60px',
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '50%',
              filter: 'blur(30px)'
            }} />
            <div style={{
              position: 'absolute',
              right: '20%',
              top: '20%',
              width: '100px',
              height: '100px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '50%'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <Badge style={{
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    marginBottom: '1rem',
                    borderRadius: '20px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    ✨ Plot3D V2.0 Dashboard
                  </Badge>
                  <h1 style={{
                    fontSize: '2.75rem',
                    fontWeight: '800',
                    color: 'white',
                    marginBottom: '0.75rem',
                    letterSpacing: '-0.025em'
                  }}>
                    Welcome Back! 👋
                  </h1>
                  <p style={{
                    fontSize: '1.15rem',
                    color: 'rgba(255,255,255,0.85)',
                    marginBottom: '2rem',
                    maxWidth: '550px',
                    lineHeight: '1.6'
                  }}>
                    Multi-venture real estate management platform with advanced plot drawing,
                    analytics, and export capabilities.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Button
                      as={Link}
                      to="/venture-manager"
                      style={{
                        background: 'rgba(255,255,255,0.95)',
                        color: colors.primary,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.875rem 1.75rem',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
                      }}
                    >
                      🏘️ Manage Ventures
                    </Button>
                    <Button
                      as={Link}
                      to="/plot-drawer"
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderRadius: '12px',
                        padding: '0.875rem 1.75rem',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      ✏️ Draw Plots
                    </Button>
                  </div>
                </div>
                <div style={{
                  textAlign: 'right',
                  color: 'rgba(255,255,255,0.9)',
                  minWidth: '180px'
                }}>
                  <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem', color: 'rgba(255,255,255,0.7)' }}>
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                    {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        {statsCards.map((stat, i) => (
          <Col key={i} lg={2} md={4} sm={6} className="mb-3">
            <Card style={{
              background: colors.cardBg,
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: `1px solid ${colors.cardBorder}`,
              transition: 'all 0.3s ease',
              height: '100%',
              overflow: 'hidden'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(99, 102, 241, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
              <div style={{
                height: '4px',
                background: stat.gradient
              }} />
              <Card.Body style={{ padding: '1.25rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: stat.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '1rem',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                }}>
                  {stat.icon}
                </div>
                <h3 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  margin: 0,
                  background: stat.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {stat.value}
                </h3>
                <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.85rem', fontWeight: '500' }}>
                  {stat.label}
                </p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Revenue & Area Summary */}
      <Row className="mb-4">
        <Col md={6} className="mb-3">
          <Card style={{
            background: colors.cardBg,
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: `1px solid ${colors.cardBorder}`,
            height: '100%'
          }}>
            <Card.Body style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  boxShadow: '0 12px 30px rgba(16, 185, 129, 0.3)'
                }}>
                  💰
                </div>
                <div>
                  <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.85rem', fontWeight: '500' }}>
                    Total Revenue (Sold)
                  </p>
                  <h2 style={{
                    fontSize: '2.25rem',
                    fontWeight: '800',
                    margin: 0,
                    background: 'linear-gradient(135deg, #10b981 0%, #22d3ee 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {formatCurrency(stats.totalRevenue)}
                  </h2>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-3">
          <Card style={{
            background: colors.cardBg,
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: `1px solid ${colors.cardBorder}`,
            height: '100%'
          }}>
            <Card.Body style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  boxShadow: '0 12px 30px rgba(139, 92, 246, 0.3)'
                }}>
                  📐
                </div>
                <div>
                  <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.85rem', fontWeight: '500' }}>
                    Total Plot Area
                  </p>
                  <h2 style={{
                    fontSize: '2.25rem',
                    fontWeight: '800',
                    margin: 0,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {stats.totalArea.toLocaleString()} sq.ft
                  </h2>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <h5 style={{
            fontWeight: '600',
            marginBottom: '1rem',
            color: colors.text,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              background: colors.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>⚡</span>
            Quick Actions
          </h5>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {quickActions.map((action, i) => (
              <Button
                key={i}
                as={Link}
                to={action.path}
                style={{
                  background: `linear-gradient(135deg, ${action.color} 0%, ${action.color}cc 100%)`,
                  border: 'none',
                  borderRadius: '14px',
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  boxShadow: `0 8px 25px ${action.color}40`,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 12px 35px ${action.color}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${action.color}40`;
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{action.icon}</span>
                {action.label}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      {/* Recent Ventures */}
      <Row>
        <Col>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h5 style={{
              fontWeight: '600',
              margin: 0,
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                background: colors.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>🏘️</span>
              Recent Ventures
            </h5>
            <Button
              as={Link}
              to="/venture-manager"
              style={{
                background: 'transparent',
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: '10px',
                color: colors.text,
                fontSize: '0.85rem',
                padding: '0.5rem 1rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.primary;
                e.currentTarget.style.borderColor = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = colors.cardBorder;
              }}
            >
              View All →
            </Button>
          </div>

          <Row>
            {ventures.length === 0 ? (
              <Col>
                <Card style={{
                  background: colors.cardBg,
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  border: `2px dashed ${colors.cardBorder}`,
                  textAlign: 'center',
                  padding: '3rem'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏗️</div>
                  <h5 style={{ color: colors.text, marginBottom: '0.5rem' }}>No Ventures Yet</h5>
                  <p style={{ color: colors.textMuted, marginBottom: '1.5rem' }}>
                    Create your first venture to start managing plots
                  </p>
                  <Button
                    as={Link}
                    to="/venture-manager"
                    style={{
                      background: colors.gradient,
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.875rem 1.75rem',
                      fontWeight: '600',
                      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    ➕ Create Venture
                  </Button>
                </Card>
              </Col>
            ) : (
              ventures.map(venture => (
                <Col lg={3} md={6} key={venture._id} className="mb-3">
                  <Card style={{
                    background: colors.cardBg,
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: `1px solid ${colors.cardBorder}`,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 20px 50px rgba(99, 102, 241, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                    <div style={{
                      height: '140px',
                      background: venture.imageUrl
                        ? `url(http://localhost:5000${venture.imageUrl}) center/cover`
                        : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 100%)'
                      }} />
                      {venture.isDefault && (
                        <Badge style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(245, 158, 11, 0.9)',
                          backdropFilter: 'blur(10px)',
                          border: 'none',
                          borderRadius: '20px',
                          padding: '0.4rem 0.75rem',
                          fontWeight: '600'
                        }}>
                          ⭐ Default
                        </Badge>
                      )}
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        right: '12px'
                      }}>
                        <h6 style={{
                          fontWeight: '700',
                          margin: 0,
                          color: 'white',
                          fontSize: '1rem'
                        }}>
                          {venture.name}
                        </h6>
                      </div>
                    </div>
                    <Card.Body style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Badge style={{
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: colors.primary,
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          padding: '0.4rem 0.75rem'
                        }}>
                          📊 {venture.metadata?.totalPlots || 0} plots
                        </Badge>
                        <Badge style={{
                          background: venture.calibration?.isCalibrated
                            ? 'rgba(34, 197, 94, 0.2)'
                            : 'rgba(148, 163, 184, 0.2)',
                          color: venture.calibration?.isCalibrated ? colors.success : colors.textMuted,
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          padding: '0.4rem 0.75rem'
                        }}>
                          {venture.calibration?.isCalibrated ? '✓ Calibrated' : '○ Not Calibrated'}
                        </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Col>
      </Row>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
};

export default Home;
