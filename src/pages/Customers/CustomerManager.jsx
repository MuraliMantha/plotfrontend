import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Modal, Badge, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { api, endpoints } from '../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// V3 Theme Colors
const colors = {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
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
    textDark: '#64748b',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
};

// Stage colors for pipeline
const stageColors = {
    lead: { bg: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', label: 'Lead' },
    prospect: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'Prospect' },
    site_visit: { bg: 'rgba(34, 211, 238, 0.2)', color: '#22d3ee', label: 'Site Visit' },
    negotiation: { bg: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', label: 'Negotiation' },
    booking: { bg: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', label: 'Booking' },
    customer: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Customer' }
};

const sourceLabels = {
    website: '🌐 Website',
    'walk-in': '🚶 Walk-in',
    referral: '👥 Referral',
    phone: '📞 Phone',
    social: '📱 Social',
    newspaper: '📰 Newspaper',
    other: '📋 Other'
};

const styles = {
    container: {
        background: `linear-gradient(180deg, ${colors.darker} 0%, ${colors.dark} 100%)`,
        minHeight: '100vh',
        padding: '2rem',
    },
    header: {
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        border: `1px solid ${colors.cardBorder}`,
        marginBottom: '1.5rem',
    },
    title: {
        fontSize: '1.75rem',
        fontWeight: '700',
        background: colors.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.25rem',
    },
    card: {
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `1px solid ${colors.cardBorder}`,
        transition: 'all 0.3s ease',
    },
    searchInput: {
        background: 'rgba(15, 23, 42, 0.8)',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
        color: colors.text,
    },
    select: {
        background: 'rgba(15, 23, 42, 0.8)',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
        color: colors.text,
        cursor: 'pointer',
    },
    actionButton: {
        background: colors.gradient,
        border: 'none',
        borderRadius: '10px',
        padding: '0.625rem 1.25rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    outlineButton: {
        background: 'transparent',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '10px',
        padding: '0.625rem 1rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: colors.text,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    customerCard: {
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '0.75rem',
        border: `1px solid ${colors.cardBorder}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    modal: {
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '16px',
    },
    modalHeader: {
        background: colors.gradient,
        borderRadius: '16px 16px 0 0',
        padding: '1.25rem 1.5rem',
        border: 'none',
    },
    modalBody: {
        background: 'rgba(15, 23, 42, 0.95)',
        padding: '1.5rem',
    },
    modalFooter: {
        background: 'rgba(15, 23, 42, 0.95)',
        borderTop: `1px solid ${colors.cardBorder}`,
        padding: '1rem 1.5rem',
        borderRadius: '0 0 16px 16px',
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
        fontSize: '0.8rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    avatar: {
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: colors.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
        fontSize: '1rem',
        flexShrink: 0,
    },
    badge: {
        borderRadius: '8px',
        padding: '0.375rem 0.75rem',
        fontSize: '0.7rem',
        fontWeight: '600',
        border: 'none',
    },
    statCard: {
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '12px',
        padding: '1.25rem',
        textAlign: 'center',
        border: `1px solid ${colors.cardBorder}`,
    },
};

const CustomerManager = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        source: 'other',
        stage: 'lead',
        notes: '',
        nextFollowUp: '',
        address: { city: '', state: '' }
    });
    const [statusMsg, setStatusMsg] = useState('');
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

    // V4: Fetch customers from multi-tenant API
    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (stageFilter) params.append('stage', stageFilter);
            if (sourceFilter) params.append('source', sourceFilter);
            params.append('page', pagination.page);
            params.append('limit', 20);

            const data = await api.get(`${endpoints.customers.list}?${params}`);

            if (data.success) {
                setCustomers(data.data);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, stageFilter, sourceFilter, pagination.page]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // V4: Handle form submit using multi-tenant API
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let data;
            if (editingCustomer) {
                data = await api.put(endpoints.customers.update(editingCustomer._id), formData);
            } else {
                data = await api.post(endpoints.customers.create, formData);
            }

            if (data.success) {
                setStatusMsg(editingCustomer ? 'Customer updated!' : 'Customer created!');
                setShowModal(false);
                resetForm();
                fetchCustomers();
            } else {
                setStatusMsg(data.message || 'Error saving customer');
            }
        } catch (error) {
            setStatusMsg('Error saving customer');
        }

        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            source: 'other',
            stage: 'lead',
            notes: '',
            nextFollowUp: '',
            address: { city: '', state: '' }
        });
        setEditingCustomer(null);
    };

    // Edit customer
    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            source: customer.source || 'other',
            stage: customer.stage || 'lead',
            notes: customer.notes || '',
            nextFollowUp: customer.nextFollowUp ? customer.nextFollowUp.split('T')[0] : '',
            address: customer.address || { city: '', state: '' }
        });
        setShowModal(true);
    };

    // Delete customer
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;

        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${API_BASE}/customers/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setStatusMsg('Customer deleted!');
                fetchCustomers();
            }
        } catch (error) {
            setStatusMsg('Error deleting customer');
        }

        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Get stage stats
    const stageCounts = customers.reduce((acc, c) => {
        acc[c.stage] = (acc[c.stage] || 0) + 1;
        return acc;
    }, {});

    return (
        <Container fluid style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={styles.title}>👥 Customer Manager</h1>
                        <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.9rem' }}>
                            Manage leads and track customer journey
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            style={styles.outlineButton}
                            onClick={() => navigate('/pipeline')}
                        >
                            📊 Pipeline View
                        </button>
                        <button
                            style={styles.actionButton}
                            onClick={() => { resetForm(); setShowModal(true); }}
                        >
                            ➕ Add Customer
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <Form.Control
                        type="text"
                        placeholder="🔍 Search by name, phone, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ ...styles.searchInput, flex: '1', minWidth: '250px' }}
                    />
                    <Form.Select
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                        style={{ ...styles.select, minWidth: '150px' }}
                    >
                        <option value="">All Stages</option>
                        {Object.entries(stageColors).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </Form.Select>
                    <Form.Select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        style={{ ...styles.select, minWidth: '150px' }}
                    >
                        <option value="">All Sources</option>
                        {Object.entries(sourceLabels).map(([key, val]) => (
                            <option key={key} value={key}>{val}</option>
                        ))}
                    </Form.Select>
                </div>
            </div>

            {/* Stage Stats */}
            <Row className="mb-4">
                {Object.entries(stageColors).map(([key, val]) => (
                    <Col key={key} lg={2} md={4} sm={6} className="mb-3">
                        <div
                            style={{
                                ...styles.statCard,
                                borderLeft: `4px solid ${val.color}`,
                                cursor: 'pointer'
                            }}
                            onClick={() => setStageFilter(stageFilter === key ? '' : key)}
                        >
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: val.color }}>
                                {stageCounts[key] || 0}
                            </div>
                            <div style={{ color: colors.textMuted, fontSize: '0.8rem' }}>{val.label}</div>
                        </div>
                    </Col>
                ))}
            </Row>

            {/* Customer List */}
            <Card style={styles.card}>
                <Card.Body style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h5 style={{ color: colors.text, fontWeight: '600', margin: 0 }}>
                            Customers ({pagination.total})
                        </h5>
                        {loading && <Spinner animation="border" size="sm" style={{ color: colors.primary }} />}
                    </div>

                    {customers.length === 0 && !loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: colors.textMuted }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                            <h5 style={{ color: colors.text }}>No customers found</h5>
                            <p>Add your first customer to get started</p>
                        </div>
                    ) : (
                        customers.map((customer) => {
                            const stage = stageColors[customer.stage] || stageColors.lead;
                            return (
                                <div
                                    key={customer._id}
                                    style={styles.customerCard}
                                    onClick={() => navigate(`/customers/${customer._id}`)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                        e.currentTarget.style.borderColor = colors.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                                        e.currentTarget.style.borderColor = colors.cardBorder;
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={styles.avatar}>
                                            {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: '600', color: colors.text }}>{customer.name}</span>
                                                <Badge style={{ ...styles.badge, background: stage.bg, color: stage.color }}>
                                                    {stage.label}
                                                </Badge>
                                            </div>
                                            <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
                                                📞 {customer.phone}
                                                {customer.email && <span> • ✉️ {customer.email}</span>}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                                                {sourceLabels[customer.source] || customer.source}
                                            </div>
                                            {customer.nextFollowUp && (
                                                <div style={{ color: colors.warning, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                                    📅 {new Date(customer.nextFollowUp).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                style={{ ...styles.outlineButton, padding: '0.5rem 0.75rem' }}
                                                onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                style={{ ...styles.outlineButton, padding: '0.5rem 0.75rem', borderColor: colors.danger }}
                                                onClick={(e) => { e.stopPropagation(); handleDelete(customer._id); }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                            {Array.from({ length: pagination.pages }, (_, i) => (
                                <button
                                    key={i}
                                    style={{
                                        ...styles.outlineButton,
                                        padding: '0.5rem 0.75rem',
                                        background: pagination.page === i + 1 ? colors.primary : 'transparent',
                                        color: pagination.page === i + 1 ? 'white' : colors.text
                                    }}
                                    onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <div style={styles.modal}>
                    <Modal.Header style={styles.modalHeader}>
                        <Modal.Title style={{ color: 'white', fontWeight: '600' }}>
                            {editingCustomer ? '✏️ Edit Customer' : '➕ Add New Customer'}
                        </Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleSubmit}>
                        <Modal.Body style={styles.modalBody}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Name *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            style={styles.formInput}
                                            placeholder="Enter full name"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Phone *</Form.Label>
                                        <Form.Control
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            style={styles.formInput}
                                            placeholder="Enter phone number"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            style={styles.formInput}
                                            placeholder="Enter email address"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Source</Form.Label>
                                        <Form.Select
                                            value={formData.source}
                                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                            style={styles.formInput}
                                        >
                                            {Object.entries(sourceLabels).map(([key, val]) => (
                                                <option key={key} value={key}>{val}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Stage</Form.Label>
                                        <Form.Select
                                            value={formData.stage}
                                            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                            style={styles.formInput}
                                        >
                                            {Object.entries(stageColors).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Next Follow-up</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={formData.nextFollowUp}
                                            onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
                                            style={styles.formInput}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>City</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.address.city}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, city: e.target.value }
                                            })}
                                            style={styles.formInput}
                                            placeholder="Enter city"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>State</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.address.state}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, state: e.target.value }
                                            })}
                                            style={styles.formInput}
                                            placeholder="Enter state"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Notes</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            style={styles.formInput}
                                            placeholder="Add any notes about this customer..."
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer style={styles.modalFooter}>
                            <button
                                type="button"
                                style={styles.outlineButton}
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" style={styles.actionButton}>
                                {editingCustomer ? 'Update Customer' : 'Add Customer'}
                            </button>
                        </Modal.Footer>
                    </Form>
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
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    zIndex: 9999
                }}>
                    {statusMsg}
                </div>
            )}
        </Container>
    );
};

export default CustomerManager;
