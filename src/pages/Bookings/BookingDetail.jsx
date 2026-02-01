import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Badge, Spinner, Modal, Table } from 'react-bootstrap';
import jsPDF from 'jspdf';
import { api, endpoints } from '../../utils/api';

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

// Status configuration
const statusConfig = {
    reserved: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'Reserved', next: 'booked' },
    booked: { bg: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', label: 'Booked', next: 'agreement_signed' },
    agreement_signed: { bg: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', label: 'Agreement Signed', next: 'registration_pending' },
    registration_pending: { bg: 'rgba(34, 211, 238, 0.2)', color: '#22d3ee', label: 'Registration Pending', next: 'registered' },
    registered: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Registered', next: null },
    cancelled: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', label: 'Cancelled', next: null }
};

const paymentModes = {
    cash: '💵 Cash',
    cheque: '📝 Cheque',
    upi: '📱 UPI',
    bank_transfer: '🏦 Bank Transfer',
    online: '💳 Online'
};

const paymentStatus = {
    pending: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'Pending' },
    paid: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Paid' },
    overdue: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', label: 'Overdue' }
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
        fontSize: '1.5rem',
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
    dangerButton: {
        background: 'rgba(239, 68, 68, 0.2)',
        border: `1px solid ${colors.danger}`,
        borderRadius: '10px',
        padding: '0.625rem 1rem',
        fontSize: '0.875rem',
        color: colors.danger,
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
        fontSize: '0.8rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
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
    statusButton: {
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: 'none',
        fontSize: '0.8rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    paymentCard: {
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '0.75rem',
        border: `1px solid ${colors.cardBorder}`,
    },
    progressBar: {
        height: '8px',
        borderRadius: '4px',
        background: 'rgba(71, 85, 105, 0.3)',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: '4px',
        transition: 'width 0.3s ease',
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
    badge: {
        borderRadius: '8px',
        padding: '0.375rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: '600',
    },
};

const BookingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    // Payment form
    const [paymentData, setPaymentData] = useState({
        amount: '',
        mode: 'cash',
        reference: '',
        note: ''
    });

    // Cancel form
    const [cancelData, setCancelData] = useState({
        reason: '',
        refundAmount: ''
    });

    // V4: Fetch booking using multi-tenant API
    const fetchBooking = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get(endpoints.bookings.detail(id));

            if (data.success) {
                setBooking(data.data);
            } else {
                navigate('/bookings');
            }
        } catch (error) {
            console.error('Error fetching booking:', error);
            navigate('/bookings');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    // V4: Update status using multi-tenant API
    const updateStatus = async (newStatus) => {
        try {
            const data = await api.patch(endpoints.bookings.updateStatus(id), { status: newStatus });
            if (data.success) {
                setStatusMsg('Status updated!');
                fetchBooking();
            }
        } catch (error) {
            setStatusMsg('Error updating status');
        }
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // V4: Add payment using multi-tenant API
    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            const data = await api.post(endpoints.bookings.addPayment(id), paymentData);
            if (data.success) {
                setStatusMsg('Payment added!');
                setShowPaymentModal(false);
                setPaymentData({ amount: '', mode: 'cash', reference: '', note: '' });
                fetchBooking();
            } else {
                setStatusMsg(data.message || 'Error adding payment');
            }
        } catch (error) {
            setStatusMsg('Error adding payment');
        }
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // V4: Cancel booking using multi-tenant API
    const handleCancel = async (e) => {
        e.preventDefault();
        try {
            const data = await api.post(endpoints.bookings.cancel(id), cancelData);
            if (data.success) {
                setStatusMsg('Booking cancelled');
                setShowCancelModal(false);
                fetchBooking();
            } else {
                setStatusMsg(data.message || 'Error cancelling booking');
            }
        } catch (error) {
            setStatusMsg('Error cancelling booking');
        }
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Generate receipt PDF
    const generateReceipt = (payment) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT RECEIPT', pageWidth / 2, 25, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        let y = 55;
        const leftMargin = 20;

        doc.text(`Receipt No: REC-${payment._id?.slice(-6).toUpperCase()}`, leftMargin, y);
        doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, pageWidth - 60, y);

        y += 20;
        doc.setFont('helvetica', 'bold');
        doc.text('Customer Details', leftMargin, y);
        doc.setFont('helvetica', 'normal');
        y += 10;
        doc.text(`Name: ${booking.customer?.name}`, leftMargin, y);
        y += 8;
        doc.text(`Phone: ${booking.customer?.phone}`, leftMargin, y);

        y += 20;
        doc.setFont('helvetica', 'bold');
        doc.text('Plot Details', leftMargin, y);
        doc.setFont('helvetica', 'normal');
        y += 10;
        doc.text(`Plot No: ${booking.plot?.plotNo}`, leftMargin, y);
        y += 8;
        doc.text(`Venture: ${booking.venture?.name || 'N/A'}`, leftMargin, y);
        y += 8;
        doc.text(`Total Price: ₹${booking.totalPrice?.toLocaleString()}`, leftMargin, y);

        y += 20;
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(leftMargin, y, pageWidth - 40, 40, 3, 3, 'F');
        y += 20;
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`Amount: ₹${payment.amount?.toLocaleString()}`, leftMargin + 10, y);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        y += 12;
        doc.text(`Mode: ${paymentModes[payment.mode] || payment.mode}`, leftMargin + 10, y);

        y += 30;
        doc.text(`Total Paid Till Date: ₹${booking.totalPaid?.toLocaleString()}`, leftMargin, y);
        y += 8;
        doc.text(`Remaining Balance: ₹${booking.balanceAmount?.toLocaleString()}`, leftMargin, y);

        y += 25;
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text('This is a computer-generated receipt.', pageWidth / 2, y, { align: 'center' });

        doc.save(`Receipt_Plot${booking.plot?.plotNo}_${payment._id?.slice(-6)}.pdf`);
    };

    // Format currency
    const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString()}`;

    if (loading) {
        return (
            <Container fluid style={styles.container}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Spinner animation="border" style={{ color: colors.primary }} />
                </div>
            </Container>
        );
    }

    if (!booking) return null;

    const status = statusConfig[booking.status] || statusConfig.reserved;
    const progressPercent = booking.totalPrice ? Math.round((booking.totalPaid / booking.totalPrice) * 100) : 0;

    return (
        <Container fluid style={styles.container}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <button style={styles.outlineButton} onClick={() => navigate('/bookings')}>
                    ← Back to Bookings
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {booking.status !== 'cancelled' && booking.status !== 'registered' && (
                        <button style={styles.dangerButton} onClick={() => setShowCancelModal(true)}>
                            ❌ Cancel Booking
                        </button>
                    )}
                    <button style={styles.actionButton} onClick={() => setShowPaymentModal(true)}>
                        💰 Add Payment
                    </button>
                </div>
            </div>

            <Row>
                {/* Left Column - Booking Info */}
                <Col lg={8}>
                    {/* Main Booking Card */}
                    <Card style={{ ...styles.card, marginBottom: '1.5rem' }}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={styles.title}>
                                        Plot #{booking.plot?.plotNo || 'N/A'}
                                    </h2>
                                    <p style={{ color: colors.textMuted, margin: 0 }}>
                                        {booking.venture?.name || 'Unknown Venture'}
                                    </p>
                                </div>
                                <Badge style={{ ...styles.badge, background: status.bg, color: status.color, fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                    {status.label}
                                </Badge>
                            </div>

                            {/* Status Progress */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                    {Object.entries(statusConfig).filter(([key]) => key !== 'cancelled').map(([key, val], index) => {
                                        const isActive = booking.status === key;
                                        const isPast = Object.keys(statusConfig).indexOf(booking.status) > index;
                                        return (
                                            <button
                                                key={key}
                                                style={{
                                                    ...styles.statusButton,
                                                    background: isActive ? val.color : isPast ? val.bg : 'rgba(71, 85, 105, 0.2)',
                                                    color: isActive ? 'white' : isPast ? val.color : colors.textMuted,
                                                    opacity: booking.status === 'cancelled' ? 0.5 : 1
                                                }}
                                                onClick={() => booking.status !== 'cancelled' && updateStatus(key)}
                                                disabled={booking.status === 'cancelled'}
                                            >
                                                {val.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Pricing Summary */}
                            <Row>
                                <Col md={4}>
                                    <div style={styles.infoRow}>
                                        <span style={styles.label}>Plot Area</span>
                                        <span style={styles.value}>{booking.plotArea || booking.plot?.area} sq.yd</span>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div style={styles.infoRow}>
                                        <span style={styles.label}>Rate per sq.yd</span>
                                        <span style={styles.value}>{formatCurrency(booking.ratePerUnit)}</span>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div style={styles.infoRow}>
                                        <span style={styles.label}>Total Price</span>
                                        <span style={{ ...styles.value, color: colors.primary, fontSize: '1.1rem' }}>
                                            {formatCurrency(booking.totalPrice)}
                                        </span>
                                    </div>
                                </Col>
                            </Row>

                            {/* Payment Progress */}
                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: colors.text, fontWeight: '600' }}>Payment Progress</span>
                                    <span style={{ color: colors.textMuted }}>{progressPercent}%</span>
                                </div>
                                <div style={styles.progressBar}>
                                    <div style={{
                                        ...styles.progressFill,
                                        width: `${progressPercent}%`,
                                        background: progressPercent >= 100 ? colors.success : colors.gradient
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                                    <div>
                                        <span style={{ color: colors.success, fontWeight: '600' }}>{formatCurrency(booking.totalPaid)}</span>
                                        <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}> Paid</span>
                                    </div>
                                    <div>
                                        <span style={{ color: colors.warning, fontWeight: '600' }}>{formatCurrency(booking.balanceAmount)}</span>
                                        <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}> Balance</span>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Payment History */}
                    <Card style={styles.card}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h5 style={{ color: colors.text, fontWeight: '600', margin: 0 }}>
                                    💳 Payment History
                                </h5>
                                <Badge style={{ background: 'rgba(99, 102, 241, 0.2)', color: colors.primary }}>
                                    {booking.payments?.length || 0} payments
                                </Badge>
                            </div>

                            {!booking.payments || booking.payments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
                                    No payments recorded yet
                                </div>
                            ) : (
                                booking.payments.map((payment, index) => {
                                    const pStatus = paymentStatus[payment.status] || paymentStatus.paid;
                                    return (
                                        <div key={payment._id || index} style={styles.paymentCard}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: colors.text, fontSize: '1.1rem' }}>
                                                        {formatCurrency(payment.amount)}
                                                    </div>
                                                    <div style={{ color: colors.textMuted, fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                                        {paymentModes[payment.mode] || payment.mode}
                                                        {payment.reference && ` • Ref: ${payment.reference}`}
                                                    </div>
                                                    {payment.note && (
                                                        <div style={{ color: colors.textMuted, fontSize: '0.8rem', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                                            {payment.note}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <Badge style={{ ...styles.badge, background: pStatus.bg, color: pStatus.color }}>
                                                        {pStatus.label}
                                                    </Badge>
                                                    <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                                        {new Date(payment.date).toLocaleDateString()}
                                                    </div>
                                                    <button
                                                        style={{ ...styles.outlineButton, padding: '0.25rem 0.5rem', fontSize: '0.7rem', marginTop: '0.5rem' }}
                                                        onClick={() => generateReceipt(payment)}
                                                    >
                                                        📄 Receipt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Column - Customer & Plot Info */}
                <Col lg={4}>
                    {/* Customer */}
                    <Card style={{ ...styles.card, marginBottom: '1.5rem' }}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <h5 style={{ color: colors.text, fontWeight: '600', marginBottom: '1rem' }}>
                                👤 Customer
                            </h5>
                            <div style={styles.infoRow}>
                                <span style={styles.label}>Name</span>
                                <span style={styles.value}>{booking.customer?.name}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span style={styles.label}>Phone</span>
                                <span style={styles.value}>{booking.customer?.phone}</span>
                            </div>
                            {booking.customer?.email && (
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>Email</span>
                                    <span style={styles.value}>{booking.customer?.email}</span>
                                </div>
                            )}
                            <button
                                style={{ ...styles.outlineButton, width: '100%', marginTop: '1rem' }}
                                onClick={() => navigate(`/customers/${booking.customer?._id}`)}
                            >
                                View Customer Profile
                            </button>
                        </Card.Body>
                    </Card>

                    {/* Dates */}
                    <Card style={{ ...styles.card, marginBottom: '1.5rem' }}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <h5 style={{ color: colors.text, fontWeight: '600', marginBottom: '1rem' }}>
                                📅 Important Dates
                            </h5>
                            <div style={styles.infoRow}>
                                <span style={styles.label}>Booking Date</span>
                                <span style={styles.value}>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                            </div>
                            {booking.agreementDate && (
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>Agreement</span>
                                    <span style={styles.value}>{new Date(booking.agreementDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            {booking.registrationDate && (
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>Registration</span>
                                    <span style={styles.value}>{new Date(booking.registrationDate).toLocaleDateString()}</span>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Notes */}
                    {booking.notes && (
                        <Card style={styles.card}>
                            <Card.Body style={{ padding: '1.5rem' }}>
                                <h5 style={{ color: colors.text, fontWeight: '600', marginBottom: '1rem' }}>
                                    📝 Notes
                                </h5>
                                <p style={{ color: colors.textMuted, margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {booking.notes}
                                </p>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>

            {/* Add Payment Modal */}
            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
                <div style={styles.modal}>
                    <Modal.Header style={styles.modalHeader}>
                        <Modal.Title style={{ color: 'white', fontWeight: '600' }}>💰 Add Payment</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleAddPayment}>
                        <Modal.Body style={styles.modalBody}>
                            <div style={{
                                background: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: '10px',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
                                    Balance: <span style={{ color: colors.warning, fontWeight: '600' }}>{formatCurrency(booking.balanceAmount)}</span>
                                </div>
                            </div>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Amount *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            required
                                            value={paymentData.amount}
                                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                            style={styles.formInput}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Mode</Form.Label>
                                        <Form.Select
                                            value={paymentData.mode}
                                            onChange={(e) => setPaymentData({ ...paymentData, mode: e.target.value })}
                                            style={styles.formInput}
                                        >
                                            {Object.entries(paymentModes).map(([key, val]) => (
                                                <option key={key} value={key}>{val}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col xs={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Reference</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={paymentData.reference}
                                            onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                                            style={styles.formInput}
                                            placeholder="Transaction ID / Cheque No"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer style={styles.modalFooter}>
                            <button type="button" style={styles.outlineButton} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                            <button type="submit" style={styles.actionButton}>Add Payment</button>
                        </Modal.Footer>
                    </Form>
                </div>
            </Modal>

            {/* Cancel Modal */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                <div style={styles.modal}>
                    <Modal.Header style={{ ...styles.modalHeader, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                        <Modal.Title style={{ color: 'white', fontWeight: '600' }}>❌ Cancel Booking</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleCancel}>
                        <Modal.Body style={styles.modalBody}>
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '10px',
                                padding: '1rem',
                                marginBottom: '1rem',
                                color: colors.danger
                            }}>
                                ⚠️ This action will release the plot and cannot be undone.
                            </div>
                            <Form.Group className="mb-3">
                                <Form.Label style={styles.formLabel}>Cancellation Reason *</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    required
                                    value={cancelData.reason}
                                    onChange={(e) => setCancelData({ ...cancelData, reason: e.target.value })}
                                    style={styles.formInput}
                                    placeholder="Enter reason for cancellation"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label style={styles.formLabel}>Refund Amount</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={cancelData.refundAmount}
                                    onChange={(e) => setCancelData({ ...cancelData, refundAmount: e.target.value })}
                                    style={styles.formInput}
                                    placeholder="Amount to refund (if any)"
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer style={styles.modalFooter}>
                            <button type="button" style={styles.outlineButton} onClick={() => setShowCancelModal(false)}>No, Keep Booking</button>
                            <button type="submit" style={styles.dangerButton}>Yes, Cancel Booking</button>
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

export default BookingDetail;
