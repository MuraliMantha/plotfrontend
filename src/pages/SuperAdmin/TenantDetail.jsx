import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Row, Col, Spinner, Modal, Form, Alert, Tab, Tabs } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TenantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);

    // Action states
    const [actionLoading, setActionLoading] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusReason, setStatusReason] = useState('');
    const [editData, setEditData] = useState({});
    const [newApiKey, setNewApiKey] = useState('');
    const [copySuccess, setCopySuccess] = useState('');

    useEffect(() => {
        fetchTenant();
    }, [id]);

    const fetchTenant = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_BASE}/api/v1/super-admin/tenants/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tenant');
            }

            const data = await response.json();
            setTenant(data.data);
            setEditData({
                name: data.data.name,
                email: data.data.email,
                phone: data.data.phone || '',
                plan: data.data.plan
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_BASE}/api/v1/super-admin/tenants/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus, reason: statusReason })
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            setShowStatusModal(false);
            fetchTenant();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateTenant = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_BASE}/api/v1/super-admin/tenants/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editData)
            });

            if (!response.ok) {
                throw new Error('Failed to update tenant');
            }

            setShowEditModal(false);
            fetchTenant();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRegenerateApiKey = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_BASE}/api/v1/super-admin/tenants/${id}/regenerate-api-key`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to regenerate API key');
            }

            const data = await response.json();
            setNewApiKey(data.data.apiKey);
            fetchTenant();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to deactivate this tenant? This action will disable their account.')) {
            return;
        }

        setActionLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_BASE}/api/v1/super-admin/tenants/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to delete tenant');
            }

            navigate('/super-admin/tenants');
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const copyToClipboard = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(label);
            setTimeout(() => setCopySuccess(''), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            active: { bg: 'success', icon: '✅' },
            trial: { bg: 'warning', icon: '🧪' },
            suspended: { bg: 'danger', icon: '⛔' },
            cancelled: { bg: 'secondary', icon: '❌' },
            expired: { bg: 'dark', icon: '⏰' }
        };
        const c = config[status] || config.cancelled;
        return (
            <Badge bg={c.bg} style={{ fontSize: '1rem', padding: '8px 16px' }}>
                {c.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading tenant details...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Card style={{ border: 'none', borderRadius: '16px', background: '#fee2e2' }}>
                    <Card.Body className="text-center py-5">
                        <div style={{ fontSize: '4rem' }}>🚫</div>
                        <h3 className="text-danger mt-3">{error}</h3>
                        <Button variant="outline-danger" onClick={() => navigate('/super-admin/tenants')}>
                            Back to Tenants
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <button
                        onClick={() => navigate('/super-admin/tenants')}
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
                        ← Back to Tenants
                    </button>
                    <div className="d-flex align-items-center gap-3">
                        <h2 style={{
                            fontWeight: '800',
                            marginBottom: '0'
                        }}>
                            {tenant.name}
                        </h2>
                        {getStatusBadge(tenant.subscriptionStatus)}
                    </div>
                    <p className="text-muted mb-0 mt-1">
                        <code>{tenant.slug}</code> • Created {new Date(tenant.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-primary"
                        onClick={() => setShowEditModal(true)}
                        style={{ borderRadius: '10px' }}
                    >
                        ✏️ Edit
                    </Button>
                    <Button
                        variant="outline-danger"
                        onClick={handleDelete}
                        disabled={actionLoading}
                        style={{ borderRadius: '10px' }}
                    >
                        🗑️ Deactivate
                    </Button>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultActiveKey="overview" className="mb-4">
                {/* Overview Tab */}
                <Tab eventKey="overview" title="📊 Overview">
                    <Row>
                        {/* Stats Cards */}
                        <Col lg={8}>
                            <Row className="mb-4">
                                <Col sm={4}>
                                    <Card style={{ border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}>
                                        <Card.Body className="text-center">
                                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1e40af' }}>
                                                {tenant.stats?.ventures || tenant.usage?.ventures || 0}
                                            </div>
                                            <div style={{ color: '#3b82f6', fontWeight: '600' }}>Ventures</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col sm={4}>
                                    <Card style={{ border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
                                        <Card.Body className="text-center">
                                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#065f46' }}>
                                                {tenant.stats?.users || tenant.usage?.users || 0}
                                            </div>
                                            <div style={{ color: '#10b981', fontWeight: '600' }}>Users</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col sm={4}>
                                    <Card style={{ border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' }}>
                                        <Card.Body className="text-center">
                                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#9d174d' }}>
                                                {tenant.stats?.enquiries || tenant.usage?.enquiriesThisMonth || 0}
                                            </div>
                                            <div style={{ color: '#ec4899', fontWeight: '600' }}>Enquiries</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Details Card */}
                            <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                                <Card.Body>
                                    <h5 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>📋 Organization Details</h5>
                                    <Row>
                                        <Col md={6}>
                                            <table style={{ width: '100%' }}>
                                                <tbody>
                                                    <tr>
                                                        <td style={{ padding: '10px 0', color: '#64748b', width: '120px' }}>Email:</td>
                                                        <td style={{ fontWeight: '500' }}>{tenant.email}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ padding: '10px 0', color: '#64748b' }}>Phone:</td>
                                                        <td style={{ fontWeight: '500' }}>{tenant.phone || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ padding: '10px 0', color: '#64748b' }}>Company:</td>
                                                        <td style={{ fontWeight: '500' }}>{tenant.company?.name || '-'}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </Col>
                                        <Col md={6}>
                                            <table style={{ width: '100%' }}>
                                                <tbody>
                                                    <tr>
                                                        <td style={{ padding: '10px 0', color: '#64748b', width: '120px' }}>Plan:</td>
                                                        <td>
                                                            <Badge bg="primary" style={{ textTransform: 'capitalize' }}>
                                                                {tenant.plan}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ padding: '10px 0', color: '#64748b' }}>Billing:</td>
                                                        <td style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                                                            {tenant.billingCycle || 'monthly'}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ padding: '10px 0', color: '#64748b' }}>Trial Ends:</td>
                                                        <td style={{ fontWeight: '500' }}>
                                                            {tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString() : '-'}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Actions Card */}
                        <Col lg={4}>
                            <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                                <Card.Body>
                                    <h5 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>⚡ Quick Actions</h5>

                                    <Button
                                        variant="outline-primary"
                                        className="w-100 mb-3"
                                        onClick={() => setShowStatusModal(true)}
                                        style={{ borderRadius: '10px', padding: '12px' }}
                                    >
                                        🔄 Change Status
                                    </Button>

                                    <Button
                                        variant="outline-warning"
                                        className="w-100 mb-3"
                                        onClick={() => setShowApiKeyModal(true)}
                                        style={{ borderRadius: '10px', padding: '12px' }}
                                    >
                                        🔑 Regenerate API Key
                                    </Button>

                                    <hr />

                                    <div style={{
                                        background: tenant.subscriptionStatus === 'active' ? '#dcfce7' : '#fef3c7',
                                        padding: '1rem',
                                        borderRadius: '10px',
                                        marginTop: '1rem'
                                    }}>
                                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                            {tenant.subscriptionStatus === 'active' ? '✅ Subscription Active' : '⏳ Status: ' + tenant.subscriptionStatus}
                                        </div>
                                        <small className="text-muted">
                                            Plan: {tenant.plan?.charAt(0).toUpperCase() + tenant.plan?.slice(1)}
                                        </small>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Admin User Card */}
                            {tenant.primaryAdmin && (
                                <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginTop: '1rem' }}>
                                    <Card.Body>
                                        <h5 style={{ fontWeight: '700', marginBottom: '1rem' }}>👤 Primary Admin</h5>
                                        <div style={{ fontWeight: '600' }}>{tenant.primaryAdmin.name}</div>
                                        <small className="text-muted">{tenant.primaryAdmin.email}</small>
                                        {tenant.primaryAdmin.lastLogin && (
                                            <div className="mt-2">
                                                <small className="text-muted">
                                                    Last login: {new Date(tenant.primaryAdmin.lastLogin).toLocaleString()}
                                                </small>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>
                    </Row>
                </Tab>

                {/* API & Widget Tab */}
                <Tab eventKey="api" title="🔌 API & Widget">
                    <Row>
                        <Col lg={8}>
                            <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                                <Card.Body>
                                    <h5 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>🔑 API Key</h5>

                                    <div style={{
                                        background: '#f8fafc',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <code style={{
                                                fontSize: '0.9rem',
                                                wordBreak: 'break-all',
                                                flex: 1,
                                                marginRight: '1rem'
                                            }}>
                                                {tenant.apiKey}
                                            </code>
                                            <Button
                                                variant={copySuccess === 'apiKey' ? 'success' : 'outline-primary'}
                                                size="sm"
                                                onClick={() => copyToClipboard(tenant.apiKey, 'apiKey')}
                                                style={{ borderRadius: '8px', whiteSpace: 'nowrap' }}
                                            >
                                                {copySuccess === 'apiKey' ? '✅ Copied' : '📋 Copy'}
                                            </Button>
                                        </div>
                                    </div>

                                    <Alert variant="info" style={{ borderRadius: '10px' }}>
                                        <strong>📌 Usage:</strong> Include this key in the <code>x-api-key</code> header when making widget API requests.
                                    </Alert>

                                    <hr className="my-4" />

                                    <h5 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>📦 Widget Embed Code</h5>

                                    <div style={{
                                        background: '#1e293b',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        color: '#e2e8f0',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        position: 'relative'
                                    }}>
                                        <Button
                                            variant={copySuccess === 'embed' ? 'success' : 'outline-light'}
                                            size="sm"
                                            onClick={() => copyToClipboard(
                                                `<div id="venture-viewer"></div>\n<script src="${window.location.origin}/widget.js"></script>\n<script>\n  VentureCRM.init({\n    apiKey: '${tenant.apiKey}',\n    container: '#venture-viewer'\n  });\n</script>`,
                                                'embed'
                                            )}
                                            style={{
                                                position: 'absolute',
                                                top: '0.75rem',
                                                right: '0.75rem',
                                                borderRadius: '6px'
                                            }}
                                        >
                                            {copySuccess === 'embed' ? '✅' : '📋'}
                                        </Button>
                                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                            {`<div id="venture-viewer"></div>
<script src="${window.location.origin}/widget.js"></script>
<script>
  VentureCRM.init({
    apiKey: '${tenant.apiKey}',
    container: '#venture-viewer'
  });
</script>`}
                                        </pre>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                                <Card.Body>
                                    <h5 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>📊 Plan Limits</h5>

                                    <table style={{ width: '100%' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '10px 0', color: '#64748b' }}>Ventures:</td>
                                                <td style={{ fontWeight: '600', textAlign: 'right' }}>
                                                    {tenant.usage?.ventures || 0} / {tenant.planLimits?.maxVentures === -1 ? '∞' : tenant.planLimits?.maxVentures}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '10px 0', color: '#64748b' }}>Plots:</td>
                                                <td style={{ fontWeight: '600', textAlign: 'right' }}>
                                                    {tenant.usage?.plots || 0} / {tenant.planLimits?.maxPlots === -1 ? '∞' : tenant.planLimits?.maxPlots}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '10px 0', color: '#64748b' }}>Users:</td>
                                                <td style={{ fontWeight: '600', textAlign: 'right' }}>
                                                    {tenant.usage?.users || 0} / {tenant.planLimits?.maxUsers === -1 ? '∞' : tenant.planLimits?.maxUsers}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '10px 0', color: '#64748b' }}>Enquiries/mo:</td>
                                                <td style={{ fontWeight: '600', textAlign: 'right' }}>
                                                    {tenant.usage?.enquiriesThisMonth || 0} / {tenant.planLimits?.maxEnquiriesPerMonth === -1 ? '∞' : tenant.planLimits?.maxEnquiriesPerMonth}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                {/* Branding Tab */}
                <Tab eventKey="branding" title="🎨 Branding">
                    <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>🎨 Widget Branding</h5>

                            <Row>
                                <Col md={6}>
                                    <div className="mb-4">
                                        <label style={{ fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>
                                            Primary Color
                                        </label>
                                        <div className="d-flex align-items-center gap-3">
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '10px',
                                                background: tenant.branding?.primaryColor || '#6366f1',
                                                border: '2px solid #e2e8f0'
                                            }} />
                                            <code>{tenant.branding?.primaryColor || '#6366f1'}</code>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-4">
                                        <label style={{ fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>
                                            Secondary Color
                                        </label>
                                        <div className="d-flex align-items-center gap-3">
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '10px',
                                                background: tenant.branding?.secondaryColor || '#10b981',
                                                border: '2px solid #e2e8f0'
                                            }} />
                                            <code>{tenant.branding?.secondaryColor || '#10b981'}</code>
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            <div className="mb-4">
                                <label style={{ fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>
                                    Widget Theme
                                </label>
                                <Badge bg={tenant.branding?.widgetTheme === 'dark' ? 'dark' : 'light'}
                                    text={tenant.branding?.widgetTheme === 'dark' ? 'light' : 'dark'}
                                    style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                                    {(tenant.branding?.widgetTheme || 'light').charAt(0).toUpperCase() + (tenant.branding?.widgetTheme || 'light').slice(1)} Mode
                                </Badge>
                            </div>

                            {tenant.branding?.logo && (
                                <div className="mb-4">
                                    <label style={{ fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>
                                        Logo
                                    </label>
                                    <img
                                        src={tenant.branding.logo}
                                        alt="Tenant Logo"
                                        style={{ maxHeight: '80px', borderRadius: '8px' }}
                                    />
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* Status Change Modal */}
            <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
                <Modal.Header closeButton style={{ background: '#f8fafc' }}>
                    <Modal.Title style={{ fontWeight: '700' }}>🔄 Change Status</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>New Status</Form.Label>
                        <Form.Select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            style={{ borderRadius: '10px' }}
                        >
                            <option value="">Select status...</option>
                            <option value="active">✅ Active</option>
                            <option value="suspended">⛔ Suspended</option>
                            <option value="cancelled">❌ Cancelled</option>
                        </Form.Select>
                    </Form.Group>

                    {newStatus === 'suspended' && (
                        <Form.Group>
                            <Form.Label>Reason for Suspension</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={statusReason}
                                onChange={(e) => setStatusReason(e.target.value)}
                                placeholder="Enter reason..."
                                style={{ borderRadius: '10px' }}
                            />
                        </Form.Group>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowStatusModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUpdateStatus}
                        disabled={!newStatus || actionLoading}
                    >
                        {actionLoading ? 'Updating...' : 'Update Status'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
                <Modal.Header closeButton style={{ background: '#f8fafc' }}>
                    <Modal.Title style={{ fontWeight: '700' }}>✏️ Edit Tenant</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Organization Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    style={{ borderRadius: '10px' }}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={editData.email}
                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                    style={{ borderRadius: '10px' }}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control
                                    type="tel"
                                    value={editData.phone}
                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                    style={{ borderRadius: '10px' }}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Plan</Form.Label>
                                <Form.Select
                                    value={editData.plan}
                                    onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
                                    style={{ borderRadius: '10px' }}
                                >
                                    <option value="trial">🧪 Trial</option>
                                    <option value="starter">🚀 Starter</option>
                                    <option value="professional">💼 Professional</option>
                                    <option value="enterprise">🏢 Enterprise</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUpdateTenant}
                        disabled={actionLoading}
                    >
                        {actionLoading ? 'Saving...' : '💾 Save Changes'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* API Key Regenerate Modal */}
            <Modal show={showApiKeyModal} onHide={() => { setShowApiKeyModal(false); setNewApiKey(''); }} centered>
                <Modal.Header closeButton style={{ background: '#fef3c7' }}>
                    <Modal.Title style={{ fontWeight: '700' }}>🔑 Regenerate API Key</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {newApiKey ? (
                        <div>
                            <Alert variant="success" style={{ borderRadius: '10px' }}>
                                ✅ API Key regenerated successfully!
                            </Alert>
                            <div style={{
                                background: '#f8fafc',
                                padding: '1rem',
                                borderRadius: '10px',
                                wordBreak: 'break-all'
                            }}>
                                <strong>New API Key:</strong>
                                <code style={{ display: 'block', marginTop: '0.5rem' }}>{newApiKey}</code>
                            </div>
                            <Alert variant="warning" className="mt-3" style={{ borderRadius: '10px' }}>
                                ⚠️ The old API key is now invalid. Update the widget embed code on the tenant's website.
                            </Alert>
                        </div>
                    ) : (
                        <div>
                            <Alert variant="warning" style={{ borderRadius: '10px' }}>
                                ⚠️ <strong>Warning:</strong> Regenerating the API key will invalidate the current key.
                                The tenant will need to update their widget embed code.
                            </Alert>
                            <p>Are you sure you want to proceed?</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => { setShowApiKeyModal(false); setNewApiKey(''); }}>
                        {newApiKey ? 'Close' : 'Cancel'}
                    </Button>
                    {!newApiKey && (
                        <Button
                            variant="warning"
                            onClick={handleRegenerateApiKey}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Regenerating...' : '🔄 Regenerate Key'}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default TenantDetail;
