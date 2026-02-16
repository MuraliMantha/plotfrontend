/**
 * EmbedCode - Premium Widget Embed Code Generator
 * 
 * Features:
 * - Venture selection dropdown
 * - Environment toggle (Local/Production)
 * - Live widget preview
 * - Multiple embed code formats (HTML, React, Vue, iframe)
 * - One-click copy functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Spinner, Form, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { api, endpoints } from '../../utils/api';
import { generateEmbedCode, getBackendUrl, getFrontendUrl, getWidgetUrl, ENV_URLS } from '../../utils/envConfig';
import { useAuth } from '../../contexts/AuthContext';

// Premium Theme Colors
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
    gradientAlt: 'linear-gradient(135deg, #10b981 0%, #22d3ee 100%)',
    glassLight: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
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
        borderRadius: '20px',
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
    },
    cardHeader: {
        background: 'rgba(99, 102, 241, 0.1)',
        borderBottom: `1px solid ${colors.glassBorder}`,
        padding: '1.25rem 1.5rem',
    },
    title: {
        fontSize: '2rem',
        fontWeight: '800',
        background: colors.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: 0,
    },
    subtitle: {
        color: colors.textMuted,
        fontSize: '1rem',
        marginTop: '0.5rem',
    },
    sectionTitle: {
        color: colors.text,
        fontWeight: '700',
        fontSize: '1.1rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    selectBox: {
        background: 'rgba(15, 23, 42, 0.9)',
        border: `2px solid ${colors.cardBorder}`,
        borderRadius: '12px',
        color: colors.text,
        padding: '0.875rem 1rem',
        fontSize: '0.95rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    toggleContainer: {
        display: 'flex',
        background: 'rgba(15, 23, 42, 0.9)',
        borderRadius: '16px',
        padding: '6px',
        border: `1px solid ${colors.cardBorder}`,
    },
    toggleButton: (isActive) => ({
        flex: 1,
        padding: '0.75rem 1.5rem',
        border: 'none',
        borderRadius: '12px',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: isActive ? colors.gradient : 'transparent',
        color: isActive ? '#fff' : colors.textMuted,
        boxShadow: isActive ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none',
    }),
    previewContainer: {
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '16px',
        border: `1px solid ${colors.cardBorder}`,
        overflow: 'hidden',
        minHeight: '400px',
    },
    previewHeader: {
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: `1px solid ${colors.cardBorder}`,
    },
    previewDot: (color) => ({
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: color,
    }),
    codeBlock: {
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '12px',
        border: `1px solid ${colors.cardBorder}`,
        position: 'relative',
        overflow: 'hidden',
    },
    codeBlockHeader: {
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '0.75rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${colors.cardBorder}`,
    },
    codeContent: {
        padding: '1.25rem',
        color: '#e2e8f0',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: '0.85rem',
        lineHeight: '1.6',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '350px',
        overflowY: 'auto',
    },
    copyButton: (copied) => ({
        background: copied ? colors.success : 'rgba(99, 102, 241, 0.2)',
        border: `1px solid ${copied ? colors.success : colors.primary}`,
        borderRadius: '8px',
        padding: '0.5rem 1rem',
        color: copied ? '#fff' : colors.primary,
        fontSize: '0.8rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    }),
    actionButton: {
        background: colors.gradient,
        border: 'none',
        borderRadius: '12px',
        padding: '0.875rem 1.5rem',
        fontSize: '0.95rem',
        fontWeight: '600',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
    },
    outlineButton: {
        background: 'transparent',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '12px',
        padding: '0.875rem 1.5rem',
        fontSize: '0.95rem',
        fontWeight: '500',
        color: colors.text,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    tabContainer: {
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
    },
    tab: (isActive) => ({
        padding: '0.625rem 1.25rem',
        borderRadius: '10px',
        border: 'none',
        background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
        color: isActive ? colors.primary : colors.textMuted,
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderBottom: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
    }),
    badge: {
        background: 'rgba(99, 102, 241, 0.2)',
        color: colors.primary,
        padding: '0.375rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '600',
    },
    envBadge: (isProduction) => ({
        background: isProduction ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
        color: isProduction ? colors.success : colors.warning,
        padding: '0.375rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
    }),
    urlDisplay: {
        background: 'rgba(15, 23, 42, 0.8)',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        color: colors.secondary,
        wordBreak: 'break-all',
        border: `1px solid ${colors.cardBorder}`,
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
    },
    infoItem: {
        background: 'rgba(15, 23, 42, 0.5)',
        borderRadius: '12px',
        padding: '1rem',
        border: `1px solid ${colors.cardBorder}`,
    },
    infoLabel: {
        color: colors.textMuted,
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '0.25rem',
    },
    infoValue: {
        color: colors.text,
        fontSize: '0.95rem',
        fontWeight: '500',
    },
};

const EmbedCode = () => {
    const navigate = useNavigate();
    const { tenant } = useAuth();
    const [loading, setLoading] = useState(true);
    const [ventures, setVentures] = useState([]);
    const [selectedVenture, setSelectedVenture] = useState(null);
    const [envMode, setEnvMode] = useState('local'); // 'local' or 'production'
    const [widgetTheme, setWidgetTheme] = useState('light');
    const [activeCodeTab, setActiveCodeTab] = useState('html');
    const [copyStatus, setCopyStatus] = useState({});
    const [apiKey, setApiKey] = useState('');
    const previewRef = useRef(null);

    // Helper function to format location object to string
    const formatLocation = (location) => {
        if (!location) return 'N/A';
        if (typeof location === 'string') return location;
        // If location is an object with address, city, state, pincode
        const parts = [];
        if (location.address) parts.push(location.address);
        if (location.city) parts.push(location.city);
        if (location.state) parts.push(location.state);
        if (location.pincode) parts.push(location.pincode);
        return parts.length > 0 ? parts.join(', ') : 'N/A';
    };

    // Fetch ventures on mount
    useEffect(() => {
        fetchVentures();
        fetchApiKey();
    }, []);

    const fetchVentures = async () => {
        try {
            setLoading(true);
            const data = await api.get(endpoints.ventures.list);
            if (data.success) {
                setVentures(data.data || []);
                // Auto-select first venture if available
                if (data.data?.length > 0) {
                    setSelectedVenture(data.data[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching ventures:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApiKey = async () => {
        try {
            const data = await api.get('/api/v1/tenant/profile');
            if (data.success && data.data.apiKeys?.length > 0) {
                // Get the first active API key
                const activeKey = data.data.apiKeys.find(k => k.active);
                if (activeKey) {
                    setApiKey(activeKey.key);
                }
            }
        } catch (error) {
            console.error('Error fetching API key:', error);
        }
    };

    // Generate embed codes based on current selections
    const embedCodes = generateEmbedCode({
        apiKey: apiKey,
        ventureId: selectedVenture?._id || '',
        mode: envMode,
        theme: widgetTheme,
        containerId: 'venture-viewer'
    });

    // Copy to clipboard handler
    const handleCopy = async (code, type) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopyStatus({ [type]: true });
            setTimeout(() => setCopyStatus({}), 2500);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    // Get preview URL
    const getPreviewUrl = () => {
        const backendUrl = getBackendUrl(envMode);
        const params = new URLSearchParams({
            ventureId: selectedVenture?._id || '',
            theme: widgetTheme,
            preview: 'true'
        });
        return `${backendUrl}/api/v1/widget/preview?${params.toString()}`;
    };

    // Code tabs configuration
    const codeTabs = [
        { key: 'html', label: '📄 HTML', icon: '📄' },
        { key: 'minimal', label: '⚡ Minimal', icon: '⚡' },
        { key: 'react', label: '⚛️ React', icon: '⚛️' },
        { key: 'vue', label: '💚 Vue', icon: '💚' },
        { key: 'iframe', label: '🖼️ iFrame', icon: '🖼️' },
    ];

    if (loading) {
        return (
            <Container fluid style={styles.container}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Spinner animation="border" style={{ color: colors.primary, width: '3rem', height: '3rem' }} />
                        <p style={{ color: colors.textMuted, marginTop: '1rem' }}>Loading embed configuration...</p>
                    </div>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid style={styles.container}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={styles.title}>📦 Embed Code Generator</h1>
                    <p style={styles.subtitle}>
                        Generate embeddable widget code for your ventures
                    </p>
                </div>
                <button style={styles.outlineButton} onClick={() => navigate('/')}>
                    ← Back to Dashboard
                </button>
            </div>

            <Row>
                {/* Left Column - Configuration */}
                <Col lg={5} className="mb-4">
                    {/* Venture Selection Card */}
                    <Card style={{ ...styles.card, marginBottom: '1.5rem' }}>
                        <div style={styles.cardHeader}>
                            <h5 style={{ ...styles.sectionTitle, margin: 0 }}>
                                🏘️ Select Venture
                            </h5>
                        </div>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            {ventures.length === 0 ? (
                                <Alert variant="warning" style={{ background: 'rgba(245, 158, 11, 0.1)', border: 'none', borderRadius: '12px', color: colors.warning }}>
                                    <strong>⚠️ No ventures found.</strong>
                                    <br />
                                    <span style={{ fontSize: '0.9rem' }}>Create a venture first to generate embed code.</span>
                                </Alert>
                            ) : (
                                <>
                                    <Form.Select
                                        value={selectedVenture?._id || ''}
                                        onChange={(e) => {
                                            const venture = ventures.find(v => v._id === e.target.value);
                                            setSelectedVenture(venture);
                                        }}
                                        style={styles.selectBox}
                                    >
                                        <option value="">Select a venture...</option>
                                        {ventures.map(venture => (
                                            <option key={venture._id} value={venture._id}>
                                                {venture.name} {venture.location ? `- ${formatLocation(venture.location)}` : ''}
                                            </option>
                                        ))}
                                    </Form.Select>

                                    {selectedVenture && (
                                        <div style={{ marginTop: '1rem', ...styles.infoGrid }}>
                                            <div style={styles.infoItem}>
                                                <div style={styles.infoLabel}>Venture Name</div>
                                                <div style={styles.infoValue}>{selectedVenture.name}</div>
                                            </div>
                                            <div style={styles.infoItem}>
                                                <div style={styles.infoLabel}>Location</div>
                                                <div style={styles.infoValue}>{formatLocation(selectedVenture.location)}</div>
                                            </div>
                                            <div style={styles.infoItem}>
                                                <div style={styles.infoLabel}>Total Plots</div>
                                                <div style={styles.infoValue}>{selectedVenture.plotCount || selectedVenture.stats?.total || 0}</div>
                                            </div>
                                            <div style={styles.infoItem}>
                                                <div style={styles.infoLabel}>Status</div>
                                                <Badge style={styles.badge}>
                                                    {selectedVenture.status || 'Active'}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Environment Toggle Card */}
                    <Card style={{ ...styles.card, marginBottom: '1.5rem' }}>
                        <div style={styles.cardHeader}>
                            <h5 style={{ ...styles.sectionTitle, margin: 0 }}>
                                🌐 Environment
                            </h5>
                        </div>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <div style={styles.toggleContainer}>
                                <button
                                    style={styles.toggleButton(envMode === 'local')}
                                    onClick={() => setEnvMode('local')}
                                >
                                    🔧 Local Dev
                                </button>
                                <button
                                    style={styles.toggleButton(envMode === 'production')}
                                    onClick={() => setEnvMode('production')}
                                >
                                    🚀 Production
                                </button>
                            </div>

                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={styles.infoLabel}>Backend URL</div>
                                    <div style={styles.urlDisplay}>
                                        {getBackendUrl(envMode)}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={styles.infoLabel}>Frontend URL</div>
                                    <div style={styles.urlDisplay}>
                                        {getFrontendUrl(envMode)}
                                    </div>
                                </div>
                                <div>
                                    <div style={styles.infoLabel}>Widget Script</div>
                                    <div style={styles.urlDisplay}>
                                        {getWidgetUrl(envMode)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
                                <span style={styles.envBadge(envMode === 'production')}>
                                    {envMode === 'production' ? '🟢 Production' : '🟡 Development'}
                                </span>
                                <p style={{ color: colors.textMuted, fontSize: '0.85rem', marginTop: '0.75rem', marginBottom: 0 }}>
                                    {envMode === 'production'
                                        ? 'Using live production URLs. Widget will connect to real backend.'
                                        : 'Using local development URLs. Make sure your local servers are running.'}
                                </p>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Theme Selection Card */}
                    <Card style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h5 style={{ ...styles.sectionTitle, margin: 0 }}>
                                🎨 Widget Theme
                            </h5>
                        </div>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <div style={styles.toggleContainer}>
                                <button
                                    style={styles.toggleButton(widgetTheme === 'light')}
                                    onClick={() => setWidgetTheme('light')}
                                >
                                    ☀️ Light
                                </button>
                                <button
                                    style={styles.toggleButton(widgetTheme === 'dark')}
                                    onClick={() => setWidgetTheme('dark')}
                                >
                                    🌙 Dark
                                </button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Column - Preview & Code */}
                <Col lg={7}>
                    {/* Preview Card */}
                    <Card style={{ ...styles.card, marginBottom: '1.5rem' }}>
                        <div style={styles.cardHeader}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <h5 style={{ ...styles.sectionTitle, margin: 0 }}>
                                    👁️ Live Preview
                                </h5>
                                <span style={styles.envBadge(envMode === 'production')}>
                                    {envMode === 'production' ? '🟢 Production' : '🟡 Local'}
                                </span>
                            </div>
                        </div>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <div style={styles.previewContainer}>
                                <div style={styles.previewHeader}>
                                    <div style={styles.previewDot('#ef4444')} />
                                    <div style={styles.previewDot('#f59e0b')} />
                                    <div style={styles.previewDot('#22c55e')} />
                                    <span style={{ marginLeft: '0.5rem', color: colors.textMuted, fontSize: '0.8rem' }}>
                                        Widget Preview
                                    </span>
                                </div>
                                <div style={{
                                    padding: '1.5rem',
                                    minHeight: '350px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: widgetTheme === 'dark' ? '#1e293b' : '#f8fafc'
                                }}>
                                    {selectedVenture ? (
                                        <div style={{ textAlign: 'center', color: widgetTheme === 'dark' ? '#e2e8f0' : '#1e293b' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏘️</div>
                                            <h4 style={{ fontWeight: '700' }}>{selectedVenture.name}</h4>
                                            <p style={{ opacity: 0.7 }}>{formatLocation(selectedVenture.location)}</p>
                                            <div style={{
                                                display: 'inline-flex',
                                                gap: '1rem',
                                                marginTop: '1rem',
                                                padding: '0.75rem 1.5rem',
                                                background: widgetTheme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                                                borderRadius: '12px'
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                                                        {selectedVenture.stats?.total || selectedVenture.plotCount || 0}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Total Plots</div>
                                                </div>
                                                <div style={{ borderLeft: `1px solid ${widgetTheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`, paddingLeft: '1rem' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.success }}>
                                                        {selectedVenture.stats?.available || 0}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Available</div>
                                                </div>
                                            </div>
                                            <p style={{
                                                marginTop: '1.5rem',
                                                fontSize: '0.85rem',
                                                opacity: 0.6,
                                                fontStyle: 'italic'
                                            }}>
                                                This is a preview of how your widget will appear
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: colors.textMuted }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                            <p>Select a venture to see preview</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Embed Code Card */}
                    <Card style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h5 style={{ ...styles.sectionTitle, margin: 0 }}>
                                📋 Embed Code
                            </h5>
                        </div>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            {/* API Key Warning */}
                            {!apiKey && (
                                <Alert
                                    variant="warning"
                                    style={{
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: colors.warning,
                                        marginBottom: '1.5rem'
                                    }}
                                >
                                    <strong>⚠️ No API Key Found</strong>
                                    <br />
                                    <span style={{ fontSize: '0.9rem' }}>
                                        Generate an API key in <a href="/settings" style={{ color: colors.primary }}>Settings → API Keys</a> to use the widget.
                                    </span>
                                </Alert>
                            )}

                            {/* Code Tabs */}
                            <div style={styles.tabContainer}>
                                {codeTabs.map(tab => (
                                    <button
                                        key={tab.key}
                                        style={styles.tab(activeCodeTab === tab.key)}
                                        onClick={() => setActiveCodeTab(tab.key)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Code Block */}
                            <div style={styles.codeBlock}>
                                <div style={styles.codeBlockHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
                                            {codeTabs.find(t => t.key === activeCodeTab)?.label || 'Code'}
                                        </span>
                                        <Badge style={{ ...styles.badge, fontSize: '0.7rem' }}>
                                            {activeCodeTab.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <button
                                        style={styles.copyButton(copyStatus[activeCodeTab])}
                                        onClick={() => handleCopy(embedCodes[activeCodeTab], activeCodeTab)}
                                    >
                                        {copyStatus[activeCodeTab] ? (
                                            <>✅ Copied!</>
                                        ) : (
                                            <>📋 Copy Code</>
                                        )}
                                    </button>
                                </div>
                                <pre style={styles.codeContent}>
                                    {embedCodes[activeCodeTab]}
                                </pre>
                            </div>

                            {/* Instructions */}
                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: '12px',
                                border: `1px solid rgba(99, 102, 241, 0.2)`
                            }}>
                                <h6 style={{ color: colors.primary, marginBottom: '0.75rem', fontWeight: '600' }}>
                                    📚 Integration Steps
                                </h6>
                                <ol style={{ color: colors.textMuted, fontSize: '0.9rem', marginBottom: 0, paddingLeft: '1.25rem' }}>
                                    <li>Copy the code snippet above</li>
                                    <li>Paste it into your website's HTML where you want the widget to appear</li>
                                    <li>Replace <code style={{ color: colors.secondary }}>YOUR_API_KEY</code> with your actual API key</li>
                                    <li>The widget will automatically load and display your venture</li>
                                </ol>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default EmbedCode;
