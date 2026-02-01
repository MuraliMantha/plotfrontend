import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Badge, Button, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);
    const [revenueData, setRevenueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch all data in parallel
            const [statsRes, activityRes, revenueRes] = await Promise.all([
                fetch(`${API_BASE}/api/v1/super-admin/stats`, { headers }),
                fetch(`${API_BASE}/api/v1/super-admin/activity-log?limit=10`, { headers }),
                fetch(`${API_BASE}/api/v1/super-admin/stats/revenue`, { headers })
            ]);

            if (!statsRes.ok) {
                if (statsRes.status === 403) {
                    throw new Error('Access denied. Super admin privileges required.');
                }
                throw new Error('Failed to fetch stats');
            }

            const statsData = await statsRes.json();
            setStats(statsData.data);

            if (activityRes.ok) {
                const activityData = await activityRes.json();
                setActivityLogs(activityData.data || []);
            }

            if (revenueRes.ok) {
                const revenueDataRes = await revenueRes.json();
                setRevenueData(revenueDataRes.data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Stat card component
    const StatCard = ({ icon, label, value, color, gradient }) => (
        <Col md={6} lg={3} className="mb-4">
            <Card
                style={{
                    background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '16px',
                    color: 'white',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    transition: 'transform 0.3s ease',
                    cursor: 'pointer'
                }}
                className="h-100 stat-card"
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <Card.Body className="d-flex flex-column justify-content-between" style={{ padding: '1.5rem' }}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <span style={{ fontSize: '2.5rem' }}>{icon}</span>
                        <span style={{
                            fontSize: '2rem',
                            fontWeight: '800',
                            textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                        }}>
                            {value}
                        </span>
                    </div>
                    <div>
                        <h6 style={{
                            margin: 0,
                            opacity: 0.9,
                            fontWeight: '600',
                            fontSize: '0.95rem'
                        }}>
                            {label}
                        </h6>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading platform stats...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Card style={{
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    border: 'none',
                    borderRadius: '16px'
                }}>
                    <Card.Body className="text-center py-5">
                        <div style={{ fontSize: '4rem' }}>🚫</div>
                        <h3 className="text-danger mt-3">{error}</h3>
                        <p className="text-muted">Please ensure you have super admin access.</p>
                        <Button variant="outline-danger" onClick={() => navigate('/login')}>
                            Back to Login
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    const { overview, growth, breakdown, topTenants } = stats || {};

    return (
        <Container fluid className="py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 style={{
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.25rem'
                    }}>
                        🏛️ Super Admin Dashboard
                    </h2>
                    <p className="text-muted mb-0">Platform overview and tenant management</p>
                </div>
                <Button
                    onClick={() => navigate('/super-admin/tenants')}
                    style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontWeight: '600',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                    }}
                >
                    ➕ Manage Tenants
                </Button>
            </div>

            {/* Overview Stats */}
            <Row className="mb-4">
                <StatCard
                    icon="🏢"
                    label="Total Tenants"
                    value={overview?.totalTenants || 0}
                    gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                />
                <StatCard
                    icon="✅"
                    label="Active Tenants"
                    value={overview?.activeTenants || 0}
                    gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                />
                <StatCard
                    icon="🧪"
                    label="Trial Tenants"
                    value={overview?.trialTenants || 0}
                    gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                />
                <StatCard
                    icon="👥"
                    label="Total Users"
                    value={overview?.totalUsers || 0}
                    gradient="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                />
            </Row>

            <Row className="mb-4">
                <StatCard
                    icon="🏘️"
                    label="Total Ventures"
                    value={overview?.totalVentures || 0}
                    gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                />
                <StatCard
                    icon="📋"
                    label="Total Enquiries"
                    value={overview?.totalEnquiries || 0}
                    gradient="linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
                />
                <StatCard
                    icon="📈"
                    label="New Signups (30d)"
                    value={growth?.recentSignups || 0}
                    gradient="linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
                />
                <StatCard
                    icon="💬"
                    label="Enquiries This Month"
                    value={growth?.enquiriesThisMonth || 0}
                    gradient="linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)"
                />
            </Row>

            {/* Charts Row */}
            <Row>
                {/* Tenants by Plan */}
                <Col lg={6} className="mb-4">
                    <Card style={{
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>
                                📊 Tenants by Plan
                            </h5>
                            <div className="d-flex flex-wrap gap-3">
                                {breakdown?.byPlan?.map((item) => (
                                    <div
                                        key={item._id}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                            border: '1px solid #bae6fd',
                                            minWidth: '120px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '1.75rem',
                                            fontWeight: '800',
                                            color: '#0284c7'
                                        }}>
                                            {item.count}
                                        </div>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: '#64748b',
                                            textTransform: 'capitalize',
                                            fontWeight: '600'
                                        }}>
                                            {item._id || 'Unknown'}
                                        </div>
                                    </div>
                                ))}
                                {(!breakdown?.byPlan || breakdown.byPlan.length === 0) && (
                                    <p className="text-muted">No data available</p>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Tenants by Status */}
                <Col lg={6} className="mb-4">
                    <Card style={{
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>
                                🔄 Tenants by Status
                            </h5>
                            <div className="d-flex flex-wrap gap-3">
                                {breakdown?.byStatus?.map((item) => {
                                    const statusColors = {
                                        active: { bg: '#dcfce7', border: '#86efac', text: '#16a34a' },
                                        trial: { bg: '#fef3c7', border: '#fcd34d', text: '#d97706' },
                                        suspended: { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626' },
                                        cancelled: { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' },
                                        expired: { bg: '#fae8ff', border: '#e879f9', text: '#a21caf' }
                                    };
                                    const colors = statusColors[item._id] || statusColors.cancelled;

                                    return (
                                        <div
                                            key={item._id}
                                            style={{
                                                padding: '1rem 1.5rem',
                                                borderRadius: '12px',
                                                background: colors.bg,
                                                border: `1px solid ${colors.border}`,
                                                minWidth: '120px',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <div style={{
                                                fontSize: '1.75rem',
                                                fontWeight: '800',
                                                color: colors.text
                                            }}>
                                                {item.count}
                                            </div>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: colors.text,
                                                textTransform: 'capitalize',
                                                fontWeight: '600'
                                            }}>
                                                {item._id || 'Unknown'}
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!breakdown?.byStatus || breakdown.byStatus.length === 0) && (
                                    <p className="text-muted">No data available</p>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Top Tenants */}
            <Row>
                <Col lg={12}>
                    <Card style={{
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 style={{ fontWeight: '700', margin: 0 }}>
                                    🏆 Top Tenants by Enquiries
                                </h5>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => navigate('/super-admin/tenants')}
                                    style={{ borderRadius: '8px' }}
                                >
                                    View All →
                                </Button>
                            </div>

                            {topTenants && topTenants.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover" style={{ marginBottom: 0 }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ fontWeight: '600', color: '#64748b', fontSize: '0.85rem' }}>Rank</th>
                                                <th style={{ fontWeight: '600', color: '#64748b', fontSize: '0.85rem' }}>Tenant Name</th>
                                                <th style={{ fontWeight: '600', color: '#64748b', fontSize: '0.85rem' }}>Plan</th>
                                                <th style={{ fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textAlign: 'right' }}>Enquiries</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topTenants.map((tenant, index) => (
                                                <tr
                                                    key={tenant._id}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => navigate(`/super-admin/tenants/${tenant._id}`)}
                                                >
                                                    <td>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            background: index === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                                                                index === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                                                                    index === 2 ? 'linear-gradient(135deg, #f97316, #ea580c)' :
                                                                        '#e2e8f0',
                                                            color: index < 3 ? 'white' : '#64748b',
                                                            fontWeight: '700',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: '600' }}>{tenant.name}</td>
                                                    <td>
                                                        <Badge
                                                            bg={
                                                                tenant.plan === 'enterprise' ? 'dark' :
                                                                    tenant.plan === 'professional' ? 'primary' :
                                                                        tenant.plan === 'starter' ? 'success' : 'warning'
                                                            }
                                                            style={{
                                                                textTransform: 'capitalize',
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            {tenant.plan}
                                                        </Badge>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#6366f1' }}>
                                                        {tenant.count}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <div style={{ fontSize: '3rem' }}>📭</div>
                                    <p>No tenant data available yet</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Revenue & Activity Row */}
            <Row className="mt-4">
                {/* Revenue Chart */}
                <Col lg={6} className="mb-4">
                    <Card style={{
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        height: '100%'
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>
                                💰 Revenue Overview
                            </h5>

                            {revenueData ? (
                                <div>
                                    {/* Revenue Stats */}
                                    <Row className="mb-4">
                                        <Col xs={6}>
                                            <div style={{
                                                background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a' }}>
                                                    ₹{(revenueData.currentMRR || 0).toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: '600' }}>
                                                    Monthly Revenue
                                                </div>
                                            </div>
                                        </Col>
                                        <Col xs={6}>
                                            <div style={{
                                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0284c7' }}>
                                                    ₹{(revenueData.projectedARR || 0).toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: '600' }}>
                                                    Projected ARR
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Revenue by Plan */}
                                    <div>
                                        <h6 style={{ fontWeight: '600', marginBottom: '1rem', color: '#64748b' }}>
                                            Revenue by Plan
                                        </h6>
                                        {revenueData.byPlan?.map((plan) => {
                                            const planColors = {
                                                starter: '#10b981',
                                                professional: '#3b82f6',
                                                enterprise: '#8b5cf6',
                                                trial: '#f59e0b'
                                            };
                                            const maxRevenue = Math.max(...(revenueData.byPlan?.map(p => p.revenue) || [1]));
                                            const percentage = (plan.revenue / maxRevenue) * 100;

                                            return (
                                                <div key={plan._id} style={{ marginBottom: '0.75rem' }}>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span style={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: '600',
                                                            textTransform: 'capitalize'
                                                        }}>
                                                            {plan._id || 'Unknown'}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: '700',
                                                            color: planColors[plan._id] || '#64748b'
                                                        }}>
                                                            ₹{plan.revenue.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        height: '8px',
                                                        background: '#e2e8f0',
                                                        borderRadius: '4px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${percentage}%`,
                                                            height: '100%',
                                                            background: planColors[plan._id] || '#64748b',
                                                            borderRadius: '4px',
                                                            transition: 'width 0.5s ease'
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!revenueData.byPlan || revenueData.byPlan.length === 0) && (
                                            <p className="text-muted text-center">No revenue data yet</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <div style={{ fontSize: '2.5rem' }}>💵</div>
                                    <p>Revenue tracking coming soon</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Activity Log */}
                <Col lg={6} className="mb-4">
                    <Card style={{
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        height: '100%'
                    }}>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 style={{ fontWeight: '700', margin: 0 }}>
                                    📋 Recent Activity
                                </h5>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={fetchAllData}
                                    style={{ borderRadius: '8px' }}
                                >
                                    🔄 Refresh
                                </Button>
                            </div>

                            {activityLogs.length > 0 ? (
                                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                    {activityLogs.map((log, index) => {
                                        const actionIcons = {
                                            'tenant.created': '🏢',
                                            'tenant.updated': '✏️',
                                            'tenant.suspended': '⛔',
                                            'tenant.activated': '✅',
                                            'user.login': '🔑',
                                            'user.created': '👤',
                                            'venture.created': '🏘️',
                                            'enquiry.created': '💬',
                                            'booking.created': '📋',
                                            'apikey.regenerated': '🔑'
                                        };
                                        const icon = actionIcons[log.action] || '📌';

                                        return (
                                            <div
                                                key={log._id || index}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '0.75rem',
                                                    padding: '0.75rem',
                                                    borderRadius: '10px',
                                                    background: index % 2 === 0 ? '#f8fafc' : 'white',
                                                    marginBottom: '0.5rem'
                                                }}
                                            >
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1rem',
                                                    flexShrink: 0
                                                }}>
                                                    {icon}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontWeight: '600',
                                                        fontSize: '0.85rem',
                                                        color: '#1e293b'
                                                    }}>
                                                        {log.description || log.action}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: '#64748b',
                                                        display: 'flex',
                                                        gap: '0.5rem',
                                                        flexWrap: 'wrap'
                                                    }}>
                                                        <span>{log.userEmail || 'System'}</span>
                                                        <span>•</span>
                                                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <div style={{ fontSize: '2.5rem' }}>📜</div>
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default SuperAdminDashboard;
