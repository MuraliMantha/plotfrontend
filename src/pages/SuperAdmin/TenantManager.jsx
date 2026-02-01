import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Spinner, Modal, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TenantManager = () => {
    const navigate = useNavigate();
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');

    // Create Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [newTenant, setNewTenant] = useState({
        name: '',
        email: '',
        phone: '',
        plan: 'trial',
        adminName: '',
        adminPassword: ''
    });
    const [createdTenant, setCreatedTenant] = useState(null);

    useEffect(() => {
        fetchTenants();
    }, [pagination.page, statusFilter, planFilter]);

    const fetchTenants = async (searchTerm = search) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');

            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit
            });

            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
            if (planFilter) params.append('plan', planFilter);

            const response = await fetch(`${API_BASE}/api/v1/super-admin/tenants?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Access denied. Super admin privileges required.');
                }
                throw new Error('Failed to fetch tenants');
            }

            const data = await response.json();
            setTenants(data.data);
            setPagination(prev => ({ ...prev, ...data.pagination }));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchTenants(search);
    };

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateError(null);

        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_BASE}/api/v1/super-admin/tenants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTenant)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create tenant');
            }

            setCreatedTenant(data.data);
            fetchTenants();
        } catch (err) {
            setCreateError(err.message);
        } finally {
            setCreateLoading(false);
        }
    };

    const resetCreateModal = () => {
        setShowCreateModal(false);
        setCreatedTenant(null);
        setCreateError(null);
        setNewTenant({
            name: '',
            email: '',
            phone: '',
            plan: 'trial',
            adminName: '',
            adminPassword: ''
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { bg: 'success', text: 'Active' },
            trial: { bg: 'warning', text: 'Trial' },
            suspended: { bg: 'danger', text: 'Suspended' },
            cancelled: { bg: 'secondary', text: 'Cancelled' },
            expired: { bg: 'dark', text: 'Expired' }
        };
        const config = statusConfig[status] || statusConfig.cancelled;
        return <Badge bg={config.bg}>{config.text}</Badge>;
    };

    const getPlanBadge = (plan) => {
        const planConfig = {
            trial: { bg: '#fef3c7', color: '#92400e', text: '🧪 Trial' },
            starter: { bg: '#d1fae5', color: '#065f46', text: '🚀 Starter' },
            professional: { bg: '#dbeafe', color: '#1e40af', text: '💼 Professional' },
            enterprise: { bg: '#f3e8ff', color: '#6b21a8', text: '🏢 Enterprise' }
        };
        const config = planConfig[plan] || planConfig.trial;
        return (
            <span style={{
                background: config.bg,
                color: config.color,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600'
            }}>
                {config.text}
            </span>
        );
    };

    if (error) {
        return (
            <Container className="py-5">
                <Card style={{ border: 'none', borderRadius: '16px', background: '#fee2e2' }}>
                    <Card.Body className="text-center py-5">
                        <div style={{ fontSize: '4rem' }}>🚫</div>
                        <h3 className="text-danger mt-3">{error}</h3>
                        <Button variant="outline-danger" onClick={() => navigate('/super-admin')}>
                            Back to Dashboard
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <button
                        onClick={() => navigate('/super-admin')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#6366f1',
                            cursor: 'pointer',
                            padding: 0,
                            marginBottom: '0.5rem',
                            fontWeight: '500'
                        }}
                    >
                        ← Back to Dashboard
                    </button>
                    <h2 style={{
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0'
                    }}>
                        🏢 Tenant Management
                    </h2>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontWeight: '600',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                    }}
                >
                    ➕ Add New Tenant
                </Button>
            </div>

            {/* Filters */}
            <Card style={{ border: 'none', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Card.Body>
                    <Row className="align-items-end g-3">
                        <Col md={5}>
                            <Form onSubmit={handleSearch}>
                                <Form.Label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Search</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by name, email, or slug..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ borderRadius: '10px 0 0 10px' }}
                                    />
                                    <Button type="submit" variant="primary" style={{ borderRadius: '0 10px 10px 0' }}>
                                        🔍
                                    </Button>
                                </InputGroup>
                            </Form>
                        </Col>
                        <Col md={3}>
                            <Form.Label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Status</Form.Label>
                            <Form.Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ borderRadius: '10px' }}
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="trial">Trial</option>
                                <option value="suspended">Suspended</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="expired">Expired</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Plan</Form.Label>
                            <Form.Select
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                style={{ borderRadius: '10px' }}
                            >
                                <option value="">All Plans</option>
                                <option value="trial">Trial</option>
                                <option value="starter">Starter</option>
                                <option value="professional">Professional</option>
                                <option value="enterprise">Enterprise</option>
                            </Form.Select>
                        </Col>
                        <Col md={1}>
                            <Button
                                variant="outline-secondary"
                                onClick={() => { setSearch(''); setStatusFilter(''); setPlanFilter(''); fetchTenants(''); }}
                                style={{ borderRadius: '10px', width: '100%' }}
                            >
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Tenants Table */}
            <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Loading tenants...</p>
                        </div>
                    ) : tenants.length === 0 ? (
                        <div className="text-center py-5">
                            <div style={{ fontSize: '4rem' }}>🏢</div>
                            <h4 className="text-muted mt-3">No tenants found</h4>
                            <p className="text-muted">Create your first tenant to get started</p>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    border: 'none',
                                    borderRadius: '10px'
                                }}
                            >
                                ➕ Add Tenant
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <Table hover style={{ marginBottom: 0 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ fontWeight: '600', color: '#64748b' }}>Tenant</th>
                                            <th style={{ fontWeight: '600', color: '#64748b' }}>Contact</th>
                                            <th style={{ fontWeight: '600', color: '#64748b' }}>Plan</th>
                                            <th style={{ fontWeight: '600', color: '#64748b' }}>Status</th>
                                            <th style={{ fontWeight: '600', color: '#64748b' }}>API Key</th>
                                            <th style={{ fontWeight: '600', color: '#64748b' }}>Created</th>
                                            <th style={{ fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenants.map((tenant) => (
                                            <tr
                                                key={tenant._id}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => navigate(`/super-admin/tenants/${tenant._id}`)}
                                            >
                                                <td>
                                                    <div style={{ fontWeight: '600' }}>{tenant.name}</div>
                                                    <small className="text-muted">{tenant.slug}</small>
                                                </td>
                                                <td>
                                                    <div>{tenant.email}</div>
                                                    <small className="text-muted">{tenant.phone || '-'}</small>
                                                </td>
                                                <td>{getPlanBadge(tenant.plan)}</td>
                                                <td>{getStatusBadge(tenant.subscriptionStatus)}</td>
                                                <td>
                                                    <code style={{
                                                        background: '#f1f5f9',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        {tenant.apiKey?.substring(0, 15)}...
                                                    </code>
                                                </td>
                                                <td style={{ fontSize: '0.85rem' }}>
                                                    {new Date(tenant.createdAt).toLocaleDateString()}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/super-admin/tenants/${tenant._id}`); }}
                                                        style={{ borderRadius: '8px' }}
                                                    >
                                                        View →
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                                <span className="text-muted">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tenants
                                </span>
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        disabled={pagination.page <= 1}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        ← Previous
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        disabled={pagination.page >= pagination.pages}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        Next →
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Create Tenant Modal */}
            <Modal
                show={showCreateModal}
                onHide={resetCreateModal}
                size="lg"
                centered
            >
                <Modal.Header closeButton style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    borderRadius: '16px 16px 0 0'
                }}>
                    <Modal.Title style={{ fontWeight: '700' }}>
                        {createdTenant ? '✅ Tenant Created' : '➕ Create New Tenant'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '2rem' }}>
                    {createdTenant ? (
                        <div>
                            <Alert variant="success" style={{ borderRadius: '12px' }}>
                                <Alert.Heading>🎉 Tenant Created Successfully!</Alert.Heading>
                                <p>Share the following credentials with your client:</p>
                            </Alert>

                            <Card style={{ border: '2px solid #10b981', borderRadius: '12px', marginTop: '1rem' }}>
                                <Card.Body>
                                    <h6 style={{ fontWeight: '700', marginBottom: '1rem' }}>📋 Tenant Details</h6>
                                    <table style={{ width: '100%' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '8px 0', color: '#64748b', width: '140px' }}>Name:</td>
                                                <td style={{ fontWeight: '600' }}>{createdTenant.tenant.name}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', color: '#64748b' }}>Slug:</td>
                                                <td><code>{createdTenant.tenant.slug}</code></td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', color: '#64748b' }}>Plan:</td>
                                                <td style={{ textTransform: 'capitalize' }}>{createdTenant.tenant.plan}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', color: '#64748b' }}>Trial Ends:</td>
                                                <td>{new Date(createdTenant.tenant.trialEndsAt).toLocaleDateString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </Card.Body>
                            </Card>

                            <Card style={{ border: '2px solid #f59e0b', borderRadius: '12px', marginTop: '1rem' }}>
                                <Card.Body>
                                    <h6 style={{ fontWeight: '700', marginBottom: '1rem' }}>🔑 API Key (for Widget Embedding)</h6>
                                    <code style={{
                                        display: 'block',
                                        background: '#fef3c7',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        wordBreak: 'break-all'
                                    }}>
                                        {createdTenant.tenant.apiKey}
                                    </code>
                                </Card.Body>
                            </Card>

                            <Card style={{ border: '2px solid #6366f1', borderRadius: '12px', marginTop: '1rem' }}>
                                <Card.Body>
                                    <h6 style={{ fontWeight: '700', marginBottom: '1rem' }}>👤 Admin Login Credentials</h6>
                                    <table style={{ width: '100%' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '8px 0', color: '#64748b', width: '140px' }}>Email:</td>
                                                <td style={{ fontWeight: '600' }}>{createdTenant.adminCredentials.email}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', color: '#64748b' }}>Temp Password:</td>
                                                <td>
                                                    <code style={{
                                                        background: '#f1f5f9',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontWeight: '600'
                                                    }}>
                                                        {createdTenant.adminCredentials.temporaryPassword}
                                                    </code>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <Alert variant="warning" className="mt-3 mb-0" style={{ borderRadius: '8px' }}>
                                        ⚠️ {createdTenant.adminCredentials.note}
                                    </Alert>
                                </Card.Body>
                            </Card>
                        </div>
                    ) : (
                        <Form onSubmit={handleCreateTenant}>
                            {createError && (
                                <Alert variant="danger" style={{ borderRadius: '12px' }}>
                                    {createError}
                                </Alert>
                            )}

                            <h6 style={{ fontWeight: '700', marginBottom: '1rem' }}>🏢 Organization Details</h6>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Organization Name *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="e.g., ABC Realty"
                                            value={newTenant.name}
                                            onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                                            required
                                            style={{ borderRadius: '10px' }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Email *</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="admin@company.com"
                                            value={newTenant.email}
                                            onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                                            required
                                            style={{ borderRadius: '10px' }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="mb-4">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Phone</Form.Label>
                                        <Form.Control
                                            type="tel"
                                            placeholder="9876543210"
                                            value={newTenant.phone}
                                            onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                                            style={{ borderRadius: '10px' }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Plan</Form.Label>
                                        <Form.Select
                                            value={newTenant.plan}
                                            onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                                            style={{ borderRadius: '10px' }}
                                        >
                                            <option value="trial">🧪 Trial (14 days free)</option>
                                            <option value="starter">🚀 Starter (₹999/mo)</option>
                                            <option value="professional">💼 Professional (₹2,499/mo)</option>
                                            <option value="enterprise">🏢 Enterprise (₹4,999/mo)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <hr />

                            <h6 style={{ fontWeight: '700', marginBottom: '1rem' }}>👤 Admin User (Optional)</h6>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Admin Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Leave blank to use org name"
                                            value={newTenant.adminName}
                                            onChange={(e) => setNewTenant({ ...newTenant, adminName: e.target.value })}
                                            style={{ borderRadius: '10px' }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Leave blank to auto-generate"
                                            value={newTenant.adminPassword}
                                            onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })}
                                            style={{ borderRadius: '10px' }}
                                        />
                                        <Form.Text className="text-muted">
                                            A temporary password will be generated if left blank
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="d-flex justify-content-end gap-2">
                                <Button
                                    variant="outline-secondary"
                                    onClick={resetCreateModal}
                                    style={{ borderRadius: '10px' }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createLoading || !newTenant.name || !newTenant.email}
                                    style={{
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '10px 24px'
                                    }}
                                >
                                    {createLoading ? (
                                        <><Spinner size="sm" className="me-2" /> Creating...</>
                                    ) : (
                                        '✨ Create Tenant'
                                    )}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
                {createdTenant && (
                    <Modal.Footer>
                        <Button
                            variant="outline-secondary"
                            onClick={resetCreateModal}
                            style={{ borderRadius: '10px' }}
                        >
                            Create Another
                        </Button>
                        <Button
                            onClick={() => { resetCreateModal(); navigate(`/super-admin/tenants/${createdTenant.tenant._id}`); }}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                border: 'none',
                                borderRadius: '10px'
                            }}
                        >
                            View Tenant Details →
                        </Button>
                    </Modal.Footer>
                )}
            </Modal>
        </Container>
    );
};

export default TenantManager;
