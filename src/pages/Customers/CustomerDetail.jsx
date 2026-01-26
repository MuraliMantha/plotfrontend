import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Badge, Spinner, Modal } from 'react-bootstrap';

const API_BASE = 'http://localhost:5000/api';

// V3 Theme Colors
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

const stageColors = {
    lead: { bg: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', label: 'Lead' },
    prospect: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'Prospect' },
    site_visit: { bg: 'rgba(34, 211, 238, 0.2)', color: '#22d3ee', label: 'Site Visit' },
    negotiation: { bg: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', label: 'Negotiation' },
    booking: { bg: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', label: 'Booking' },
    customer: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Customer' }
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
        padding: '0.625rem 1.25rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'white',
        cursor: 'pointer',
    },
    outlineButton: {
        background: 'transparent',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '10px',
        padding: '0.625rem 1rem',
        fontSize: '0.875rem',
        color: colors.text,
        cursor: 'pointer',
    },
    stageButton: {
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: 'none',
        fontSize: '0.8rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        borderBottom: `1px solid ${colors.cardBorder}`,
    },
    label: {
        color: colors.textMuted,
        fontSize: '0.85rem',
    },
    value: {
        color: colors.text,
        fontWeight: '500',
    },
    avatar: {
        width: '80px',
        height: '80px',
        borderRadius: '20px',
        background: colors.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '700',
        fontSize: '2rem',
    },
    noteCard: {
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '0.75rem',
        border: `1px solid ${colors.cardBorder}`,
    },
    formInput: {
        background: 'rgba(15, 23, 42, 0.8)',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        fontSize: '0.9rem',
        color: colors.text,
    },
};

const CustomerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    // Fetch customer
    const fetchCustomer = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/customers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setCustomer(data.data);
            } else {
                navigate('/customers');
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
            navigate('/customers');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchCustomer();
    }, [fetchCustomer, navigate]);

    // Update stage
    const updateStage = async (newStage) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/customers/${id}/stage`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ stage: newStage })
            });

            if (res.ok) {
                setCustomer({ ...customer, stage: newStage });
                setStatusMsg('Stage updated!');
                setTimeout(() => setStatusMsg(''), 3000);
            }
        } catch (error) {
            console.error('Error updating stage:', error);
        }
    };

    // Add note
    const addNote = async () => {
        if (!newNote.trim()) return;

        try {
            const token = localStorage.getItem('admin_token');
            const updatedNotes = customer.notes
                ? `${customer.notes}\n\n[${new Date().toLocaleString()}]\n${newNote}`
                : `[${new Date().toLocaleString()}]\n${newNote}`;

            const res = await fetch(`${API_BASE}/customers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ notes: updatedNotes })
            });

            if (res.ok) {
                setCustomer({ ...customer, notes: updatedNotes });
                setShowNoteModal(false);
                setNewNote('');
                setStatusMsg('Note added!');
                setTimeout(() => setStatusMsg(''), 3000);
            }
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    // Update follow-up date
    const updateFollowUp = async (date) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/customers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ nextFollowUp: date || null })
            });

            if (res.ok) {
                setCustomer({ ...customer, nextFollowUp: date || null });
                setStatusMsg('Follow-up updated!');
                setTimeout(() => setStatusMsg(''), 3000);
            }
        } catch (error) {
            console.error('Error updating follow-up:', error);
        }
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

    if (!customer) {
        return null;
    }

    const stage = stageColors[customer.stage] || stageColors.lead;

    return (
        <Container fluid style={styles.container}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button style={styles.outlineButton} onClick={() => navigate('/customers')}>
                    ← Back to Customers
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={styles.outlineButton} onClick={() => setShowNoteModal(true)}>
                        📝 Add Note
                    </button>
                    <button
                        style={styles.actionButton}
                        onClick={() => navigate(`/bookings/new?customerId=${customer._id}`)}
                    >
                        📋 Create Booking
                    </button>
                </div>
            </div>

            <Row>
                {/* Profile Card */}
                <Col lg={4} className="mb-4">
                    <Card style={styles.card}>
                        <Card.Body style={{ padding: '2rem', textAlign: 'center' }}>
                            <div style={{ ...styles.avatar, margin: '0 auto 1.5rem' }}>
                                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                            <h3 style={{ color: colors.text, fontWeight: '600', marginBottom: '0.5rem' }}>
                                {customer.name}
                            </h3>
                            <Badge style={{
                                background: stage.bg,
                                color: stage.color,
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem'
                            }}>
                                {stage.label}
                            </Badge>

                            <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>📞 Phone</span>
                                    <span style={styles.value}>{customer.phone}</span>
                                </div>
                                {customer.email && (
                                    <div style={styles.infoRow}>
                                        <span style={styles.label}>✉️ Email</span>
                                        <span style={styles.value}>{customer.email}</span>
                                    </div>
                                )}
                                {customer.address?.city && (
                                    <div style={styles.infoRow}>
                                        <span style={styles.label}>📍 Location</span>
                                        <span style={styles.value}>
                                            {customer.address.city}{customer.address.state && `, ${customer.address.state}`}
                                        </span>
                                    </div>
                                )}
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>📥 Source</span>
                                    <span style={styles.value}>{customer.source}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>📅 Added</span>
                                    <span style={styles.value}>
                                        {new Date(customer.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Main Content */}
                <Col lg={8}>
                    {/* Stage Pipeline */}
                    <Card style={{ ...styles.card, marginBottom: '1.5rem' }}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <h5 style={{ color: colors.text, fontWeight: '600', marginBottom: '1rem' }}>
                                📊 Sales Pipeline
                            </h5>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {Object.entries(stageColors).map(([key, val]) => (
                                    <button
                                        key={key}
                                        style={{
                                            ...styles.stageButton,
                                            background: customer.stage === key ? val.color : val.bg,
                                            color: customer.stage === key ? 'white' : val.color,
                                        }}
                                        onClick={() => updateStage(key)}
                                    >
                                        {val.label}
                                    </button>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Follow-up */}
                    <Card style={{ ...styles.card, marginBottom: '1.5rem' }}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <h5 style={{ color: colors.text, fontWeight: '600', marginBottom: '1rem' }}>
                                📅 Next Follow-up
                            </h5>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <Form.Control
                                    type="date"
                                    value={customer.nextFollowUp ? customer.nextFollowUp.split('T')[0] : ''}
                                    onChange={(e) => updateFollowUp(e.target.value)}
                                    style={{ ...styles.formInput, maxWidth: '200px' }}
                                />
                                {customer.nextFollowUp && (
                                    <span style={{ color: colors.warning }}>
                                        {new Date(customer.nextFollowUp) < new Date() ? '⚠️ Overdue' : '✅ Scheduled'}
                                    </span>
                                )}
                                {customer.nextFollowUp && (
                                    <button
                                        style={{ ...styles.outlineButton, padding: '0.5rem 0.75rem' }}
                                        onClick={() => updateFollowUp(null)}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Interested Plots */}
                    {customer.interestedPlots?.length > 0 && (
                        <Card style={{ ...styles.card, marginBottom: '1.5rem' }}>
                            <Card.Body style={{ padding: '1.5rem' }}>
                                <h5 style={{ color: colors.text, fontWeight: '600', marginBottom: '1rem' }}>
                                    🏠 Interested Plots
                                </h5>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {customer.interestedPlots.map(plot => (
                                        <Badge key={plot._id} style={{
                                            background: 'rgba(99, 102, 241, 0.2)',
                                            color: colors.primary,
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px'
                                        }}>
                                            Plot #{plot.plotNo} • {plot.area} sq.yd
                                        </Badge>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Notes */}
                    <Card style={styles.card}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h5 style={{ color: colors.text, fontWeight: '600', margin: 0 }}>
                                    📝 Notes & History
                                </h5>
                                <button style={styles.outlineButton} onClick={() => setShowNoteModal(true)}>
                                    + Add Note
                                </button>
                            </div>

                            {customer.notes ? (
                                <div style={styles.noteCard}>
                                    <pre style={{
                                        color: colors.text,
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'inherit',
                                        fontSize: '0.9rem'
                                    }}>
                                        {customer.notes}
                                    </pre>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
                                    No notes yet. Click "Add Note" to start documenting.
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Add Note Modal */}
            <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} centered>
                <div style={styles.card}>
                    <Modal.Header style={{
                        background: colors.gradient,
                        borderRadius: '16px 16px 0 0',
                        padding: '1.25rem 1.5rem'
                    }}>
                        <Modal.Title style={{ color: 'white', fontWeight: '600' }}>
                            📝 Add Note
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ background: 'rgba(15, 23, 42, 0.95)', padding: '1.5rem' }}>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Enter your note here..."
                            style={styles.formInput}
                        />
                    </Modal.Body>
                    <Modal.Footer style={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        borderTop: `1px solid ${colors.cardBorder}`,
                        padding: '1rem 1.5rem',
                        borderRadius: '0 0 16px 16px'
                    }}>
                        <button style={styles.outlineButton} onClick={() => setShowNoteModal(false)}>
                            Cancel
                        </button>
                        <button style={styles.actionButton} onClick={addNote}>
                            Save Note
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
                    background: 'rgba(34, 197, 94, 0.9)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    zIndex: 9999
                }}>
                    {statusMsg}
                </div>
            )}
        </Container>
    );
};

export default CustomerDetail;
