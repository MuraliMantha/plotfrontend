import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Modal, Badge, Spinner, Table } from 'react-bootstrap';
import jsPDF from 'jspdf';

import API_BASE from '../../config';

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

// Status colors
const statusColors = {
    reserved: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'Reserved' },
    booked: { bg: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', label: 'Booked' },
    agreement_signed: { bg: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', label: 'Agreement Signed' },
    registration_pending: { bg: 'rgba(34, 211, 238, 0.2)', color: '#22d3ee', label: 'Registration Pending' },
    registered: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Registered' },
    cancelled: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', label: 'Cancelled' }
};

const paymentModes = {
    cash: '💵 Cash',
    cheque: '📝 Cheque',
    upi: '📱 UPI',
    bank_transfer: '🏦 Bank Transfer',
    online: '💳 Online'
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
    tableHeader: {
        background: 'rgba(99, 102, 241, 0.15)',
        padding: '0.875rem 1rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        border: 'none',
    },
    tableCell: {
        padding: '1rem',
        border: 'none',
        borderBottom: `1px solid rgba(71, 85, 105, 0.3)`,
        verticalAlign: 'middle',
        color: colors.text,
        background: 'transparent',
    },
    statCard: {
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '12px',
        padding: '1.25rem',
        textAlign: 'center',
        border: `1px solid ${colors.cardBorder}`,
    },
    badge: {
        borderRadius: '8px',
        padding: '0.375rem 0.75rem',
        fontSize: '0.7rem',
        fontWeight: '600',
    },
};

const BookingManager = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [plots, setPlots] = useState([]);
    const [ventures, setVentures] = useState([]);
    const [statusMsg, setStatusMsg] = useState('');
    const [stats, setStats] = useState(null);

    // Create booking form data
    const [formData, setFormData] = useState({
        customerId: searchParams.get('customerId') || '',
        plotId: '',
        ventureId: '',
        totalPrice: '',
        ratePerUnit: '',
        notes: ''
    });

    // Payment form data
    const [paymentData, setPaymentData] = useState({
        amount: '',
        mode: 'cash',
        reference: '',
        note: ''
    });

    // Fetch bookings
    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetch(`${API_BASE}/bookings?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setBookings(data.data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    // Fetch stats
    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/bookings/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Fetch customers, plots, ventures for create modal
    const fetchFormData = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const [customersRes, plotsRes, venturesRes] = await Promise.all([
                fetch(`${API_BASE}/customers?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/plot`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/ventures`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const [customersData, plotsData, venturesData] = await Promise.all([
                customersRes.json(),
                plotsRes.json(),
                venturesRes.json()
            ]);

            if (customersData.success) setCustomers(customersData.data);
            if (plotsData.features) {
                // Filter only available plots
                const availablePlots = plotsData.features.filter(
                    f => f.properties.status === 'available'
                );
                setPlots(availablePlots);
            }
            if (venturesData.success) setVentures(venturesData.data);
        } catch (error) {
            console.error('Error fetching form data:', error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchBookings();
        fetchStats();
    }, [fetchBookings, navigate]);

    // Open create modal
    const openCreateModal = () => {
        fetchFormData();
        setShowCreateModal(true);
    };

    // Handle plot selection - auto-fill price
    const handlePlotSelect = (plotId) => {
        const plot = plots.find(p => p.properties._id === plotId);
        if (plot) {
            setFormData({
                ...formData,
                plotId,
                ventureId: plot.properties.ventureId || '',
                totalPrice: plot.properties.price || '',
                ratePerUnit: plot.properties.area ? Math.round(plot.properties.price / plot.properties.area) : ''
            });
        }
    };

    // Create booking
    const handleCreateBooking = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (data.success) {
                setStatusMsg('Booking created successfully!');
                setShowCreateModal(false);
                setFormData({ customerId: '', plotId: '', ventureId: '', totalPrice: '', ratePerUnit: '', notes: '' });
                fetchBookings();
                fetchStats();
            } else {
                setStatusMsg(data.message || 'Error creating booking');
            }
        } catch (error) {
            setStatusMsg('Error creating booking');
        }
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Add payment
    const handleAddPayment = async (e) => {
        e.preventDefault();
        if (!selectedBooking) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/bookings/${selectedBooking._id}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(paymentData)
            });

            const data = await res.json();
            if (data.success) {
                setStatusMsg('Payment added successfully!');
                setShowPaymentModal(false);
                setPaymentData({ amount: '', mode: 'cash', reference: '', note: '' });
                fetchBookings();
                fetchStats();
            } else {
                setStatusMsg(data.message || 'Error adding payment');
            }
        } catch (error) {
            setStatusMsg('Error adding payment');
        }
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Update booking status
    const updateStatus = async (bookingId, newStatus) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setStatusMsg('Status updated!');
                fetchBookings();
                fetchStats();
            }
        } catch (error) {
            setStatusMsg('Error updating status');
        }
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Generate receipt PDF
    const generateReceipt = (booking, payment) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT RECEIPT', pageWidth / 2, 25, { align: 'center' });

        // Receipt details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        let y = 55;
        const leftMargin = 20;

        doc.text(`Receipt No: REC-${payment._id?.slice(-6).toUpperCase() || 'XXXXXX'}`, leftMargin, y);
        doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, pageWidth - 60, y);

        y += 20;
        doc.setFont('helvetica', 'bold');
        doc.text('Customer Details', leftMargin, y);
        doc.setFont('helvetica', 'normal');
        y += 10;
        doc.text(`Name: ${booking.customer?.name || 'N/A'}`, leftMargin, y);
        y += 8;
        doc.text(`Phone: ${booking.customer?.phone || 'N/A'}`, leftMargin, y);

        y += 20;
        doc.setFont('helvetica', 'bold');
        doc.text('Plot Details', leftMargin, y);
        doc.setFont('helvetica', 'normal');
        y += 10;
        doc.text(`Plot No: ${booking.plot?.plotNo || 'N/A'}`, leftMargin, y);
        y += 8;
        doc.text(`Area: ${booking.plotArea || booking.plot?.area || 'N/A'} sq.yd`, leftMargin, y);
        y += 8;
        doc.text(`Total Price: ₹${booking.totalPrice?.toLocaleString() || 'N/A'}`, leftMargin, y);

        y += 20;
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Details', leftMargin, y);
        doc.setFont('helvetica', 'normal');
        y += 10;

        // Payment box
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(leftMargin, y, pageWidth - 40, 50, 3, 3, 'F');
        y += 15;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Amount Paid: ₹${payment.amount?.toLocaleString()}`, leftMargin + 10, y);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        y += 12;
        doc.text(`Mode: ${paymentModes[payment.mode] || payment.mode}`, leftMargin + 10, y);
        y += 10;
        if (payment.reference) {
            doc.text(`Reference: ${payment.reference}`, leftMargin + 10, y);
        }

        y += 30;
        doc.text(`Total Paid: ₹${booking.totalPaid?.toLocaleString() || payment.amount?.toLocaleString()}`, leftMargin, y);
        y += 8;
        doc.text(`Balance: ₹${booking.balanceAmount?.toLocaleString() || 'N/A'}`, leftMargin, y);

        // Footer
        y += 30;
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text('This is a computer-generated receipt.', pageWidth / 2, y, { align: 'center' });
        doc.text('Thank you for your payment!', pageWidth / 2, y + 8, { align: 'center' });

        doc.save(`Receipt_${booking.plot?.plotNo || 'Plot'}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return `₹${amount.toLocaleString()}`;
    };

    return (
        <Container fluid style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={styles.title}>📋 Booking Manager</h1>
                        <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.9rem' }}>
                            Manage plot reservations and track payments
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Form.Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ ...styles.formInput, minWidth: '150px' }}
                        >
                            <option value="">All Status</option>
                            {Object.entries(statusColors).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </Form.Select>
                        <button style={styles.actionButton} onClick={openCreateModal}>
                            ➕ New Booking
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <Row className="mb-4">
                    <Col md={3} sm={6} className="mb-3">
                        <div style={styles.statCard}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.primary }}>
                                {stats.totalBookings || 0}
                            </div>
                            <div style={{ color: colors.textMuted, fontSize: '0.8rem' }}>Total Bookings</div>
                        </div>
                    </Col>
                    <Col md={3} sm={6} className="mb-3">
                        <div style={styles.statCard}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.success }}>
                                {formatCurrency(stats.totalValue)}
                            </div>
                            <div style={{ color: colors.textMuted, fontSize: '0.8rem' }}>Total Value</div>
                        </div>
                    </Col>
                    <Col md={3} sm={6} className="mb-3">
                        <div style={styles.statCard}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.secondary }}>
                                {formatCurrency(stats.totalCollected)}
                            </div>
                            <div style={{ color: colors.textMuted, fontSize: '0.8rem' }}>Collected</div>
                        </div>
                    </Col>
                    <Col md={3} sm={6} className="mb-3">
                        <div style={styles.statCard}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.warning }}>
                                {formatCurrency(stats.pendingCollection)}
                            </div>
                            <div style={{ color: colors.textMuted, fontSize: '0.8rem' }}>Pending</div>
                        </div>
                    </Col>
                </Row>
            )}

            {/* Bookings Table */}
            <Card style={styles.card}>
                <Card.Body style={{ padding: '0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <Table style={{ marginBottom: '0', borderCollapse: 'separate', borderSpacing: '0' }}>
                            <thead>
                                <tr>
                                    <th style={styles.tableHeader}>Plot</th>
                                    <th style={styles.tableHeader}>Customer</th>
                                    <th style={styles.tableHeader}>Total Price</th>
                                    <th style={styles.tableHeader}>Paid</th>
                                    <th style={styles.tableHeader}>Balance</th>
                                    <th style={styles.tableHeader}>Status</th>
                                    <th style={styles.tableHeader}>Date</th>
                                    <th style={styles.tableHeader}>Actions</th>
                                </tr>
                            </thead>
                            <tbody style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" style={{ ...styles.tableCell, textAlign: 'center', padding: '3rem' }}>
                                            <Spinner animation="border" style={{ color: colors.primary }} />
                                        </td>
                                    </tr>
                                ) : bookings.length === 0 ? (
                                    <tr style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                                        <td colSpan="8" style={{ ...styles.tableCell, textAlign: 'center', padding: '3rem', background: 'rgba(15, 23, 42, 0.8)' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                                            <div style={{ color: colors.text, fontWeight: '600' }}>No bookings found</div>
                                            <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Create your first booking to get started</div>
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.map((booking) => {
                                        const status = statusColors[booking.status] || statusColors.reserved;
                                        return (
                                            <tr
                                                key={booking._id}
                                                style={{ transition: 'all 0.15s ease' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={styles.tableCell}>
                                                    <span style={{ color: colors.primary, fontWeight: '600' }}>
                                                        Plot #{booking.plot?.plotNo || 'N/A'}
                                                    </span>
                                                    <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                                                        {booking.plotArea || booking.plot?.area} sq.yd
                                                    </div>
                                                </td>
                                                <td style={styles.tableCell}>
                                                    <span style={{ color: colors.text }}>{booking.customer?.name || 'N/A'}</span>
                                                    <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                                                        {booking.customer?.phone}
                                                    </div>
                                                </td>
                                                <td style={{ ...styles.tableCell, fontWeight: '600', color: colors.text }}>
                                                    {formatCurrency(booking.totalPrice)}
                                                </td>
                                                <td style={{ ...styles.tableCell, color: colors.success }}>
                                                    {formatCurrency(booking.totalPaid)}
                                                </td>
                                                <td style={{ ...styles.tableCell, color: booking.balanceAmount > 0 ? colors.warning : colors.success }}>
                                                    {formatCurrency(booking.balanceAmount)}
                                                </td>
                                                <td style={styles.tableCell}>
                                                    <Badge style={{ ...styles.badge, background: status.bg, color: status.color }}>
                                                        {status.label}
                                                    </Badge>
                                                </td>
                                                <td style={{ ...styles.tableCell, color: colors.textMuted, fontSize: '0.85rem' }}>
                                                    {new Date(booking.bookingDate).toLocaleDateString()}
                                                </td>
                                                <td style={styles.tableCell}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            style={{ ...styles.outlineButton, padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                                            onClick={() => { setSelectedBooking(booking); setShowPaymentModal(true); }}
                                                            title="Add Payment"
                                                        >
                                                            💰
                                                        </button>
                                                        <button
                                                            style={{ ...styles.outlineButton, padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                                            onClick={() => navigate(`/bookings/${booking._id}`)}
                                                            title="View Details"
                                                        >
                                                            👁️
                                                        </button>
                                                        {booking.payments?.length > 0 && (
                                                            <button
                                                                style={{ ...styles.outlineButton, padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                                                onClick={() => generateReceipt(booking, booking.payments[booking.payments.length - 1])}
                                                                title="Download Receipt"
                                                            >
                                                                📄
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Create Booking Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered size="lg">
                <div style={styles.modal}>
                    <Modal.Header style={styles.modalHeader}>
                        <Modal.Title style={{ color: 'white', fontWeight: '600' }}>
                            ➕ Create New Booking
                        </Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleCreateBooking}>
                        <Modal.Body style={styles.modalBody}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Customer *</Form.Label>
                                        <Form.Select
                                            required
                                            value={formData.customerId}
                                            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                            style={styles.formInput}
                                        >
                                            <option value="">Select Customer</option>
                                            {customers.map(c => (
                                                <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Available Plot *</Form.Label>
                                        <Form.Select
                                            required
                                            value={formData.plotId}
                                            onChange={(e) => handlePlotSelect(e.target.value)}
                                            style={styles.formInput}
                                        >
                                            <option value="">Select Plot</option>
                                            {plots.map(p => (
                                                <option key={p.properties._id} value={p.properties._id}>
                                                    Plot #{p.properties.plotNo} - {p.properties.area} sq.yd - ₹{p.properties.price?.toLocaleString()}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Rate per sq.yd</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.ratePerUnit}
                                            onChange={(e) => setFormData({ ...formData, ratePerUnit: e.target.value })}
                                            style={styles.formInput}
                                            placeholder="Auto-calculated"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Total Price *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            required
                                            value={formData.totalPrice}
                                            onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                                            style={styles.formInput}
                                            placeholder="Enter total price"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Venture</Form.Label>
                                        <Form.Select
                                            value={formData.ventureId}
                                            onChange={(e) => setFormData({ ...formData, ventureId: e.target.value })}
                                            style={styles.formInput}
                                        >
                                            <option value="">Select Venture</option>
                                            {ventures.map(v => (
                                                <option key={v._id} value={v._id}>{v.name}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col xs={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Notes</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            style={styles.formInput}
                                            placeholder="Any additional notes..."
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer style={styles.modalFooter}>
                            <button type="button" style={styles.outlineButton} onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" style={styles.actionButton}>
                                Create Booking
                            </button>
                        </Modal.Footer>
                    </Form>
                </div>
            </Modal>

            {/* Add Payment Modal */}
            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
                <div style={styles.modal}>
                    <Modal.Header style={styles.modalHeader}>
                        <Modal.Title style={{ color: 'white', fontWeight: '600' }}>
                            💰 Add Payment
                        </Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleAddPayment}>
                        <Modal.Body style={styles.modalBody}>
                            {selectedBooking && (
                                <div style={{
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ color: colors.text, fontWeight: '600' }}>
                                        Plot #{selectedBooking.plot?.plotNo} • {selectedBooking.customer?.name}
                                    </div>
                                    <div style={{ color: colors.textMuted, fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                        Total: {formatCurrency(selectedBooking.totalPrice)} |
                                        Paid: {formatCurrency(selectedBooking.totalPaid)} |
                                        <span style={{ color: colors.warning }}> Balance: {formatCurrency(selectedBooking.balanceAmount)}</span>
                                    </div>
                                </div>
                            )}
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
                                            placeholder="Enter amount"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Payment Mode</Form.Label>
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
                                        <Form.Label style={styles.formLabel}>Reference (Txn ID / Cheque No)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={paymentData.reference}
                                            onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                                            style={styles.formInput}
                                            placeholder="Transaction reference"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={styles.formLabel}>Note</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={paymentData.note}
                                            onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                                            style={styles.formInput}
                                            placeholder="Optional note"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer style={styles.modalFooter}>
                            <button type="button" style={styles.outlineButton} onClick={() => setShowPaymentModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" style={styles.actionButton}>
                                Add Payment
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
                    zIndex: 9999
                }}>
                    {statusMsg}
                </div>
            )}
        </Container>
    );
};

export default BookingManager;
