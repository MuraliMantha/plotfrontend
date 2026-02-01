import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Modal, Tab, Tabs, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { api, endpoints } from '../../utils/api';

// V4 Theme Colors
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

const styles = {
    container: {
        background: `linear-gradient(180deg, ${colors.darker} 0%, ${colors.dark} 100%)`,
        minHeight: '100vh',
        padding: '2rem',
    },
    card: {
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `1px solid ${colors.cardBorder}`,
    },
    title: {
        fontSize: '1.75rem',
        fontWeight: '700',
        background: colors.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    actionButton: {
        background: colors.gradient,
        border: 'none',
        borderRadius: '10px',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'white',
        cursor: 'pointer',
    },
    outlineButton: {
        background: 'transparent',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '10px',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem',
        color: colors.text,
        cursor: 'pointer',
    },
    formInput: {
        background: 'rgba(15, 23, 42, 0.8)',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        fontSize: '0.9rem',
        color: colors.text,
    },
    formLabel: {
        color: colors.textMuted,
        fontSize: '0.85rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
    },
    apiKeyBox: {
        background: 'rgba(15, 23, 42, 0.9)',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '10px',
        padding: '1rem',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        color: colors.secondary,
        wordBreak: 'break-all',
    },
    sectionHeader: {
        color: colors.text,
        fontWeight: '600',
        fontSize: '1.1rem',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: `1px solid ${colors.cardBorder}`,
    },
};

const TenantSettings = () => {
    const navigate = useNavigate();
    const { user, tenant, isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [newApiKey, setNewApiKey] = useState('');

    // Tenant settings state
    const [settings, setSettings] = useState({
        company: {
            name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            country: '',
            website: '',
        },
        branding: {
            primaryColor: '#6366f1',
            secondaryColor: '#22d3ee',
            logoUrl: '',
        },
        apiKeys: [],
    });

    // V4: Fetch tenant settings
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            // Get tenant profile
            const data = await api.get('/api/v1/tenant/profile');
            if (data.success) {
                setSettings({
                    company: data.data.company || {},
                    branding: data.data.branding || {},
                    apiKeys: data.data.apiKeys || [],
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    // V4: Save company info
    const saveCompanyInfo = async () => {
        try {
            setSaving(true);
            const data = await api.put('/api/v1/tenant/profile', { company: settings.company });
            if (data.success) {
                setStatusMsg('Company info saved!');
            } else {
                setStatusMsg('Error saving settings');
            }
        } catch (error) {
            setStatusMsg('Error saving settings');
        } finally {
            setSaving(false);
            setTimeout(() => setStatusMsg(''), 3000);
        }
    };

    // V4: Save branding
    const saveBranding = async () => {
        try {
            setSaving(true);
            const data = await api.put('/api/v1/tenant/profile', { branding: settings.branding });
            if (data.success) {
                setStatusMsg('Branding saved!');
            } else {
                setStatusMsg('Error saving branding');
            }
        } catch (error) {
            setStatusMsg('Error saving branding');
        } finally {
            setSaving(false);
            setTimeout(() => setStatusMsg(''), 3000);
        }
    };

    // V4: Generate new API key
    const generateApiKey = async () => {
        try {
            const data = await api.post('/api/v1/tenant/api-keys');
            if (data.success) {
                setNewApiKey(data.data.key);
                setShowNewKeyModal(true);
                fetchSettings(); // Refresh to show new key
            } else {
                setStatusMsg('Error generating API key');
            }
        } catch (error) {
            setStatusMsg('Error generating API key');
        }
    };

    // V4: Revoke API key
    const revokeApiKey = async (keyId) => {
        if (!window.confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;

        try {
            const data = await api.delete(`/api/v1/tenant/api-keys/${keyId}`);
            if (data.success) {
                setStatusMsg('API key revoked!');
                fetchSettings();
            }
        } catch (error) {
            setStatusMsg('Error revoking API key');
        }
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setStatusMsg('Copied to clipboard!');
        setTimeout(() => setStatusMsg(''), 2000);
    };

    if (loading) {
        return (
            <Container fluid style={styles.container}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Spinner animation="border" style={{ color: colors.primary }} />
                </div>
            </Container>
        );
    }

    return (
        <Container fluid style={styles.container}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={styles.title}>⚙️ Settings</h1>
                    <p style={{ color: colors.textMuted, margin: 0 }}>
                        Manage your account settings and API keys
                    </p>
                </div>
                <button style={styles.outlineButton} onClick={() => navigate('/')}>
                    ← Back to Dashboard
                </button>
            </div>

            <Row>
                <Col lg={8}>
                    <Tabs defaultActiveKey="company" className="mb-4" style={{ borderBottom: 'none' }}>
                        {/* Company Info Tab */}
                        <Tab eventKey="company" title="🏢 Company Info">
                            <Card style={styles.card}>
                                <Card.Body style={{ padding: '2rem' }}>
                                    <h5 style={styles.sectionHeader}>Company Information</h5>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label style={styles.formLabel}>Company Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={settings.company.name || ''}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        company: { ...settings.company, name: e.target.value }
                                                    })}
                                                    style={styles.formInput}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label style={styles.formLabel}>Email</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    value={settings.company.email || ''}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        company: { ...settings.company, email: e.target.value }
                                                    })}
                                                    style={styles.formInput}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label style={styles.formLabel}>Phone</Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    value={settings.company.phone || ''}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        company: { ...settings.company, phone: e.target.value }
                                                    })}
                                                    style={styles.formInput}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label style={styles.formLabel}>Website</Form.Label>
                                                <Form.Control
                                                    type="url"
                                                    value={settings.company.website || ''}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        company: { ...settings.company, website: e.target.value }
                                                    })}
                                                    style={styles.formInput}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label style={styles.formLabel}>Address</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={settings.company.address || ''}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        company: { ...settings.company, address: e.target.value }
                                                    })}
                                                    style={styles.formInput}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label style={styles.formLabel}>City</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={settings.company.city || ''}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        company: { ...settings.company, city: e.target.value }
                                                    })}
                                                    style={styles.formInput}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label style={styles.formLabel}>State</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={settings.company.state || ''}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        company: { ...settings.company, state: e.target.value }
                                                    })}
                                                    style={styles.formInput}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label style={styles.formLabel}>Country</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={settings.company.country || ''}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        company: { ...settings.company, country: e.target.value }
                                                    })}
                                                    style={styles.formInput}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <div style={{ marginTop: '1rem' }}>
                                        <button
                                            style={styles.actionButton}
                                            onClick={saveCompanyInfo}
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : '💾 Save Company Info'}
                                        </button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Tab>

                        {/* Branding Tab */}
                        <Tab eventKey="branding" title="🎨 Branding">
                            <Card style={styles.card}>
                                <Card.Body style={{ padding: '2rem' }}>
                                    <h5 style={styles.sectionHeader}>Brand Customization</h5>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label style={styles.formLabel}>Primary Color</Form.Label>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <Form.Control
                                                        type="color"
                                                        value={settings.branding.primaryColor || '#6366f1'}
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            branding: { ...settings.branding, primaryColor: e.target.value }
                                                        })}
                                                        style={{ width: '60px', height: '40px', padding: '0', border: 'none' }}
                                                    />
                                                    <Form.Control
                                                        type="text"
                                                        value={settings.branding.primaryColor || '#6366f1'}
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            branding: { ...settings.branding, primaryColor: e.target.value }
                                                        })}
                                                        style={{ ...styles.formInput, flex: 1 }}
                                                    />
                                                </div>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label style={styles.formLabel}>Secondary Color</Form.Label>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <Form.Control
                                                        type="color"
                                                        value={settings.branding.secondaryColor || '#22d3ee'}
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            branding: { ...settings.branding, secondaryColor: e.target.value }
                                                        })}
                                                        style={{ width: '60px', height: '40px', padding: '0', border: 'none' }}
                                                    />
                                                    <Form.Control
                                                        type="text"
                                                        value={settings.branding.secondaryColor || '#22d3ee'}
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            branding: { ...settings.branding, secondaryColor: e.target.value }
                                                        })}
                                                        style={{ ...styles.formInput, flex: 1 }}
                                                    />
                                                </div>
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label style={styles.formLabel}>Logo URL</Form.Label>
                                                <Form.Control
                                                    type="url"
                                                    value={settings.branding.logoUrl || ''}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        branding: { ...settings.branding, logoUrl: e.target.value }
                                                    })}
                                                    placeholder="https://example.com/logo.png"
                                                    style={styles.formInput}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Preview */}
                                    <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                                        <h6 style={{ color: colors.textMuted, marginBottom: '0.75rem' }}>Preview</h6>
                                        <div style={{
                                            background: 'rgba(15, 23, 42, 0.8)',
                                            borderRadius: '12px',
                                            padding: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                        }}>
                                            {settings.branding.logoUrl ? (
                                                <img
                                                    src={settings.branding.logoUrl}
                                                    alt="Logo"
                                                    style={{ height: '40px', borderRadius: '8px' }}
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    background: settings.branding.primaryColor || colors.primary,
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                }}>
                                                    {settings.company.name?.charAt(0) || 'V'}
                                                </div>
                                            )}
                                            <span style={{
                                                color: settings.branding.primaryColor || colors.primary,
                                                fontWeight: '600',
                                                fontSize: '1.1rem',
                                            }}>
                                                {settings.company.name || 'Your Company'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        style={styles.actionButton}
                                        onClick={saveBranding}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : '💾 Save Branding'}
                                    </button>
                                </Card.Body>
                            </Card>
                        </Tab>

                        {/* API Keys Tab */}
                        <Tab eventKey="api" title="🔑 API Keys">
                            <Card style={styles.card}>
                                <Card.Body style={{ padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h5 style={{ ...styles.sectionHeader, margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
                                            API Keys for Widget Integration
                                        </h5>
                                        <button style={styles.actionButton} onClick={generateApiKey}>
                                            ➕ Generate New Key
                                        </button>
                                    </div>

                                    <p style={{ color: colors.textMuted, marginBottom: '1.5rem' }}>
                                        Use these API keys to embed the venture widget on your website.
                                        Each key can be revoked individually.
                                    </p>

                                    {settings.apiKeys.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '3rem',
                                            background: 'rgba(15, 23, 42, 0.5)',
                                            borderRadius: '12px',
                                        }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
                                            <div style={{ color: colors.text, fontWeight: '600', marginBottom: '0.5rem' }}>
                                                No API Keys Yet
                                            </div>
                                            <div style={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                                                Generate your first API key to start embedding the widget
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {settings.apiKeys.map((key, index) => (
                                                <div key={key._id || index} style={{
                                                    background: 'rgba(15, 23, 42, 0.6)',
                                                    borderRadius: '12px',
                                                    padding: '1rem 1.25rem',
                                                    border: `1px solid ${colors.cardBorder}`,
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <span style={{ color: colors.text, fontWeight: '600' }}>
                                                                {key.name || `API Key ${index + 1}`}
                                                            </span>
                                                            <Badge style={{
                                                                background: key.active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                                color: key.active ? colors.success : colors.danger,
                                                                padding: '0.25rem 0.5rem',
                                                                borderRadius: '6px',
                                                            }}>
                                                                {key.active ? '✓ Active' : '✗ Revoked'}
                                                            </Badge>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                style={{ ...styles.outlineButton, padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                                                                onClick={() => copyToClipboard(key.key)}
                                                            >
                                                                📋 Copy
                                                            </button>
                                                            {key.active && (
                                                                <button
                                                                    style={{
                                                                        ...styles.outlineButton,
                                                                        padding: '0.375rem 0.75rem',
                                                                        fontSize: '0.75rem',
                                                                        borderColor: colors.danger,
                                                                        color: colors.danger,
                                                                    }}
                                                                    onClick={() => revokeApiKey(key._id)}
                                                                >
                                                                    🗑️ Revoke
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={styles.apiKeyBox}>
                                                        {key.key.slice(0, 12)}...{key.key.slice(-8)}
                                                    </div>
                                                    <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                                        Created: {new Date(key.createdAt).toLocaleDateString()}
                                                        {key.lastUsed && ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Widget Integration Docs */}
                                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
                                        <h6 style={{ color: colors.primary, fontWeight: '600', marginBottom: '1rem' }}>
                                            📚 Widget Integration
                                        </h6>
                                        <pre style={{
                                            background: 'rgba(15, 23, 42, 0.9)',
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            color: colors.text,
                                            fontSize: '0.8rem',
                                            overflow: 'auto',
                                        }}>
                                            {`<!-- Add this to your website -->
<div id="venture-crm-widget"></div>
<script src="https://your-domain.com/widget.js"></script>
<script>
  VentureCRM.init({
    apiKey: 'YOUR_API_KEY',
    container: '#venture-crm-widget',
    theme: 'dark' // or 'light'
  });
</script>`}
                                        </pre>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Tab>
                    </Tabs>
                </Col>

                {/* Sidebar */}
                <Col lg={4}>
                    {/* Account Info */}
                    <Card style={{ ...styles.card, marginBottom: '1.5rem' }}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <h5 style={styles.sectionHeader}>👤 Account</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                    <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Name</div>
                                    <div style={{ color: colors.text }}>{user?.name}</div>
                                </div>
                                <div>
                                    <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Email</div>
                                    <div style={{ color: colors.text }}>{user?.email}</div>
                                </div>
                                <div>
                                    <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Role</div>
                                    <Badge style={{
                                        background: 'rgba(99, 102, 241, 0.2)',
                                        color: colors.primary,
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '6px',
                                    }}>
                                        {user?.role?.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Plan Info */}
                    <Card style={styles.card}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <h5 style={styles.sectionHeader}>📊 Plan & Usage</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Plan</span>
                                        <Badge style={{
                                            background: 'rgba(34, 197, 94, 0.2)',
                                            color: colors.success,
                                            textTransform: 'capitalize',
                                        }}>
                                            {tenant?.plan || 'Free'}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Ventures</span>
                                        <span style={{ color: colors.text }}>
                                            {tenant?.usage?.ventures || 0} / {tenant?.planLimits?.maxVentures || '∞'}
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '6px',
                                        background: 'rgba(99, 102, 241, 0.2)',
                                        borderRadius: '3px',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min(100, ((tenant?.usage?.ventures || 0) / (tenant?.planLimits?.maxVentures || 1)) * 100)}%`,
                                            background: colors.primary,
                                            borderRadius: '3px',
                                        }} />
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Plots</span>
                                        <span style={{ color: colors.text }}>
                                            {tenant?.usage?.plots || 0} / {tenant?.planLimits?.maxPlots || '∞'}
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '6px',
                                        background: 'rgba(34, 211, 238, 0.2)',
                                        borderRadius: '3px',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min(100, ((tenant?.usage?.plots || 0) / (tenant?.planLimits?.maxPlots || 1)) * 100)}%`,
                                            background: colors.secondary,
                                            borderRadius: '3px',
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* New API Key Modal */}
            <Modal show={showNewKeyModal} onHide={() => setShowNewKeyModal(false)} centered>
                <div style={styles.card}>
                    <Modal.Header style={{
                        background: colors.gradient,
                        borderRadius: '16px 16px 0 0',
                        padding: '1.25rem 1.5rem',
                    }}>
                        <Modal.Title style={{ color: 'white', fontWeight: '600' }}>
                            🔑 New API Key Created
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ background: 'rgba(15, 23, 42, 0.95)', padding: '1.5rem' }}>
                        <p style={{ color: colors.warning, fontWeight: '600', marginBottom: '1rem' }}>
                            ⚠️ Copy this key now! It won't be shown again.
                        </p>
                        <div style={styles.apiKeyBox}>{newApiKey}</div>
                    </Modal.Body>
                    <Modal.Footer style={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        borderTop: `1px solid ${colors.cardBorder}`,
                        padding: '1rem 1.5rem',
                        borderRadius: '0 0 16px 16px',
                    }}>
                        <button style={styles.outlineButton} onClick={() => copyToClipboard(newApiKey)}>
                            📋 Copy Key
                        </button>
                        <button style={styles.actionButton} onClick={() => setShowNewKeyModal(false)}>
                            Done
                        </button>
                    </Modal.Footer>
                </div>
            </Modal>

            {/* Status Toast */}
            {statusMsg && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: statusMsg.includes('Error') ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    zIndex: 9999,
                }}>
                    {statusMsg}
                </div>
            )}
        </Container>
    );
};

export default TenantSettings;
