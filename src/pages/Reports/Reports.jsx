import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Table, Badge, Spinner } from 'react-bootstrap';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_BASE = 'http://localhost:5000/api';

// V3 Theme Colors
const colors = {
    primary: '#6366f1',
    secondary: '#22d3ee',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    dark: '#0f172a',
    darker: '#020617',
    cardBg: 'rgba(30, 41, 59, 0.8)',
    cardBorder: 'rgba(71, 85, 105, 0.5)',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
};

const chartColors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#22d3ee'];

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
        height: '100%',
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
    statCard: {
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '12px',
        padding: '1.25rem',
        border: `1px solid ${colors.cardBorder}`,
    },
    tableHeader: {
        background: 'rgba(99, 102, 241, 0.15)',
        padding: '0.875rem 1rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        border: 'none',
    },
    tableCell: {
        padding: '1rem',
        border: 'none',
        borderBottom: `1px solid rgba(71, 85, 105, 0.3)`,
        color: colors.text,
        background: 'transparent',
    },
    formInput: {
        background: 'rgba(15, 23, 42, 0.8)',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        fontSize: '0.9rem',
        color: colors.text,
    },
    tab: {
        padding: '0.75rem 1.25rem',
        borderRadius: '10px',
        border: 'none',
        fontSize: '0.9rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
};

const Reports = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Data states
    const [customers, setCustomers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [plots, setPlots] = useState([]);
    const [ventures, setVentures] = useState([]);
    const [enquiries, setEnquiries] = useState([]);

    // Computed stats
    const [stats, setStats] = useState({
        totalCustomers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        totalCollected: 0,
        pendingCollection: 0,
        plotsSold: 0,
        plotsAvailable: 0,
        conversionRate: 0,
    });

    // Fetch all data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');

            const [customersRes, bookingsRes, plotsRes, venturesRes, enquiriesRes, bookingStatsRes] = await Promise.all([
                fetch(`${API_BASE}/customers?limit=500`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/bookings?limit=500`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/plot`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/ventures`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/enquiries`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/bookings/stats`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const [customersData, bookingsData, plotsData, venturesData, enquiriesData, bookingStats] = await Promise.all([
                customersRes.json(),
                bookingsRes.json(),
                plotsRes.json(),
                venturesRes.json(),
                enquiriesRes.json(),
                bookingStatsRes.json()
            ]);

            const customersList = customersData.data || [];
            const bookingsList = bookingsData.data || [];
            const plotsList = plotsData.features || [];
            const venturesList = Array.isArray(venturesData) ? venturesData : (venturesData.data || []);
            const enquiriesList = Array.isArray(enquiriesData) ? enquiriesData : [];

            setCustomers(customersList);
            setBookings(bookingsList);
            setPlots(plotsList);
            setVentures(venturesList);
            setEnquiries(enquiriesList);

            // Calculate stats
            const sold = plotsList.filter(p => p.properties?.status?.toLowerCase() === 'sold').length;
            const available = plotsList.filter(p => p.properties?.status?.toLowerCase() === 'available').length;
            const customersWithBooking = customersList.filter(c => c.stage === 'booking' || c.stage === 'customer').length;

            setStats({
                totalCustomers: customersList.length,
                totalBookings: bookingsList.length,
                totalRevenue: bookingStats.data?.totalValue || 0,
                totalCollected: bookingStats.data?.totalCollected || 0,
                pendingCollection: bookingStats.data?.pendingCollection || 0,
                plotsSold: sold,
                plotsAvailable: available,
                conversionRate: customersList.length > 0 ? Math.round((customersWithBooking / customersList.length) * 100) : 0,
            });
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [fetchData, navigate]);

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₹0';
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    // Export customers to Excel
    const exportCustomersExcel = () => {
        const data = customers.map(c => ({
            'Name': c.name,
            'Phone': c.phone,
            'Email': c.email || '-',
            'Stage': c.stage,
            'Source': c.source,
            'City': c.address?.city || '-',
            'State': c.address?.state || '-',
            'Next Follow-up': c.nextFollowUp ? new Date(c.nextFollowUp).toLocaleDateString() : '-',
            'Created': new Date(c.createdAt).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Customers');

        // Auto-size columns
        const colWidths = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `Customers_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Export bookings to Excel
    const exportBookingsExcel = () => {
        const data = bookings.map(b => ({
            'Plot No': b.plot?.plotNo || '-',
            'Customer': b.customer?.name || '-',
            'Phone': b.customer?.phone || '-',
            'Total Price': b.totalPrice,
            'Paid': b.totalPaid,
            'Balance': b.balanceAmount,
            'Status': b.status,
            'Booking Date': new Date(b.bookingDate).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bookings');

        ws['!cols'] = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));

        XLSX.writeFile(wb, `Bookings_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Generate PDF Report
    const generatePDFReport = (reportType) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');

        const titles = {
            sales: 'SALES SUMMARY REPORT',
            collection: 'COLLECTION REPORT',
            customer: 'CUSTOMER REPORT'
        };
        doc.text(titles[reportType] || 'REPORT', pageWidth / 2, 22, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });

        let y = 50;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);

        if (reportType === 'sales') {
            // Sales Summary
            doc.setFont('helvetica', 'bold');
            doc.text('Sales Overview', 14, y);
            y += 10;

            doc.setFont('helvetica', 'normal');
            const salesData = [
                ['Total Bookings', stats.totalBookings.toString()],
                ['Total Revenue', formatCurrency(stats.totalRevenue)],
                ['Amount Collected', formatCurrency(stats.totalCollected)],
                ['Pending Collection', formatCurrency(stats.pendingCollection)],
                ['Plots Sold', stats.plotsSold.toString()],
                ['Plots Available', stats.plotsAvailable.toString()],
                ['Conversion Rate', `${stats.conversionRate}%`]
            ];

            doc.autoTable({
                startY: y,
                head: [['Metric', 'Value']],
                body: salesData,
                theme: 'striped',
                headStyles: { fillColor: [99, 102, 241] },
                margin: { left: 14, right: 14 }
            });

            y = doc.lastAutoTable.finalY + 20;

            // Recent Bookings
            doc.setFont('helvetica', 'bold');
            doc.text('Recent Bookings', 14, y);
            y += 5;

            const bookingRows = bookings.slice(0, 10).map(b => [
                b.plot?.plotNo || '-',
                b.customer?.name || '-',
                formatCurrency(b.totalPrice),
                formatCurrency(b.totalPaid),
                b.status
            ]);

            doc.autoTable({
                startY: y,
                head: [['Plot', 'Customer', 'Total', 'Paid', 'Status']],
                body: bookingRows,
                theme: 'striped',
                headStyles: { fillColor: [99, 102, 241] },
                margin: { left: 14, right: 14 }
            });

        } else if (reportType === 'collection') {
            // Collection Report
            doc.setFont('helvetica', 'bold');
            doc.text('Collection Summary', 14, y);
            y += 10;

            doc.setFont('helvetica', 'normal');

            // Collection stats
            const collectionData = [
                ['Total Amount Due', formatCurrency(stats.totalRevenue)],
                ['Total Collected', formatCurrency(stats.totalCollected)],
                ['Collection Rate', `${stats.totalRevenue > 0 ? Math.round((stats.totalCollected / stats.totalRevenue) * 100) : 0}%`],
                ['Pending Amount', formatCurrency(stats.pendingCollection)]
            ];

            doc.autoTable({
                startY: y,
                head: [['Metric', 'Value']],
                body: collectionData,
                theme: 'striped',
                headStyles: { fillColor: [34, 197, 94] },
                margin: { left: 14, right: 14 }
            });

            y = doc.lastAutoTable.finalY + 20;

            // Pending Payments
            doc.setFont('helvetica', 'bold');
            doc.text('Pending Payments', 14, y);
            y += 5;

            const pendingBookings = bookings.filter(b => b.balanceAmount > 0);
            const pendingRows = pendingBookings.slice(0, 15).map(b => [
                b.plot?.plotNo || '-',
                b.customer?.name || '-',
                b.customer?.phone || '-',
                formatCurrency(b.balanceAmount)
            ]);

            doc.autoTable({
                startY: y,
                head: [['Plot', 'Customer', 'Phone', 'Balance']],
                body: pendingRows,
                theme: 'striped',
                headStyles: { fillColor: [245, 158, 11] },
                margin: { left: 14, right: 14 }
            });

        } else if (reportType === 'customer') {
            // Customer Report
            doc.setFont('helvetica', 'bold');
            doc.text('Customer Pipeline Summary', 14, y);
            y += 10;

            // Stage breakdown
            const stages = ['lead', 'prospect', 'site_visit', 'negotiation', 'booking', 'customer'];
            const stageLabels = ['Lead', 'Prospect', 'Site Visit', 'Negotiation', 'Booking', 'Customer'];
            const stageCounts = stages.map(s => customers.filter(c => c.stage === s).length);

            const stageData = stageLabels.map((label, i) => [label, stageCounts[i].toString()]);

            doc.autoTable({
                startY: y,
                head: [['Stage', 'Count']],
                body: stageData,
                theme: 'striped',
                headStyles: { fillColor: [139, 92, 246] },
                margin: { left: 14, right: 14 }
            });

            y = doc.lastAutoTable.finalY + 20;

            // Source breakdown
            doc.setFont('helvetica', 'bold');
            doc.text('Source Breakdown', 14, y);
            y += 5;

            const sources = ['website', 'walk-in', 'referral', 'phone', 'social', 'other'];
            const sourceLabels = ['Website', 'Walk-in', 'Referral', 'Phone', 'Social', 'Other'];
            const sourceCounts = sources.map(s => customers.filter(c => c.source === s).length);

            const sourceData = sourceLabels.map((label, i) => [label, sourceCounts[i].toString()]);

            doc.autoTable({
                startY: y,
                head: [['Source', 'Count']],
                body: sourceData.filter(d => parseInt(d[1]) > 0),
                theme: 'striped',
                headStyles: { fillColor: [34, 211, 238] },
                margin: { left: 14, right: 14 }
            });
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
            doc.text('Plot3D V3 - Generated Report', 14, doc.internal.pageSize.getHeight() - 10);
        }

        doc.save(`${titles[reportType]?.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Chart data
    const stageData = [
        { name: 'Lead', value: customers.filter(c => c.stage === 'lead').length, color: '#6366f1' },
        { name: 'Prospect', value: customers.filter(c => c.stage === 'prospect').length, color: '#f59e0b' },
        { name: 'Site Visit', value: customers.filter(c => c.stage === 'site_visit').length, color: '#22d3ee' },
        { name: 'Negotiation', value: customers.filter(c => c.stage === 'negotiation').length, color: '#ec4899' },
        { name: 'Booking', value: customers.filter(c => c.stage === 'booking').length, color: '#8b5cf6' },
        { name: 'Customer', value: customers.filter(c => c.stage === 'customer').length, color: '#22c55e' }
    ].filter(d => d.value > 0);

    const plotStatusData = [
        { name: 'Available', value: plots.filter(p => p.properties?.status?.toLowerCase() === 'available').length, color: '#22c55e' },
        { name: 'Reserved', value: plots.filter(p => p.properties?.status?.toLowerCase() === 'reserved').length, color: '#f59e0b' },
        { name: 'Booked', value: plots.filter(p => p.properties?.status?.toLowerCase() === 'booked').length, color: '#6366f1' },
        { name: 'Sold', value: plots.filter(p => p.properties?.status?.toLowerCase() === 'sold').length, color: '#8b5cf6' }
    ].filter(d => d.value > 0);

    const sourceData = [
        { name: 'Website', value: customers.filter(c => c.source === 'website').length },
        { name: 'Walk-in', value: customers.filter(c => c.source === 'walk-in').length },
        { name: 'Referral', value: customers.filter(c => c.source === 'referral').length },
        { name: 'Phone', value: customers.filter(c => c.source === 'phone').length },
        { name: 'Social', value: customers.filter(c => c.source === 'social').length },
        { name: 'Other', value: customers.filter(c => c.source === 'other').length }
    ].filter(d => d.value > 0);

    const tabs = [
        { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
        { id: 'sales', label: '💰 Sales Report', icon: '💰' },
        { id: 'collection', label: '📈 Collection', icon: '📈' },
        { id: 'customers', label: '👥 Customers', icon: '👥' }
    ];

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
            <div style={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={styles.title}>📈 Reports & Analytics</h1>
                        <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.9rem' }}>
                            Sales summaries, collection tracking, and export tools
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button style={styles.outlineButton} onClick={() => generatePDFReport('sales')}>
                            📄 Sales PDF
                        </button>
                        <button style={styles.outlineButton} onClick={exportBookingsExcel}>
                            📊 Bookings Excel
                        </button>
                        <button style={styles.actionButton} onClick={exportCustomersExcel}>
                            📥 Export Customers
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            style={{
                                ...styles.tab,
                                background: activeTab === tab.id ? colors.primary : 'rgba(71, 85, 105, 0.2)',
                                color: activeTab === tab.id ? 'white' : colors.textMuted
                            }}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
                <>
                    {/* Key Metrics */}
                    <Row className="mb-4">
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.primary}` }}>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.primary }}>
                                    {stats.totalCustomers}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Total Customers</div>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.success}` }}>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.success }}>
                                    {formatCurrency(stats.totalRevenue)}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Total Revenue</div>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.secondary}` }}>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.secondary }}>
                                    {formatCurrency(stats.totalCollected)}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Collected</div>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.warning}` }}>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.warning }}>
                                    {stats.conversionRate}%
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Conversion Rate</div>
                            </div>
                        </Col>
                    </Row>

                    {/* Charts */}
                    <Row>
                        <Col lg={4} className="mb-4">
                            <Card style={styles.card}>
                                <Card.Body style={{ padding: '1.5rem' }}>
                                    <h6 style={{ color: colors.text, fontWeight: '600', marginBottom: '1rem' }}>
                                        📊 Customer Pipeline
                                    </h6>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={stageData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {stageData.map((entry, index) => (
                                                    <Cell key={index} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '8px' }}
                                                labelStyle={{ color: colors.text }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4} className="mb-4">
                            <Card style={styles.card}>
                                <Card.Body style={{ padding: '1.5rem' }}>
                                    <h6 style={{ color: colors.text, fontWeight: '600', marginBottom: '1rem' }}>
                                        🏠 Plot Status
                                    </h6>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={plotStatusData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {plotStatusData.map((entry, index) => (
                                                    <Cell key={index} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '8px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4} className="mb-4">
                            <Card style={styles.card}>
                                <Card.Body style={{ padding: '1.5rem' }}>
                                    <h6 style={{ color: colors.text, fontWeight: '600', marginBottom: '1rem' }}>
                                        📥 Lead Sources
                                    </h6>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={sourceData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke={colors.cardBorder} />
                                            <XAxis type="number" tick={{ fill: colors.textMuted, fontSize: 12 }} />
                                            <YAxis dataKey="name" type="category" tick={{ fill: colors.textMuted, fontSize: 12 }} width={70} />
                                            <Tooltip
                                                contentStyle={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '8px' }}
                                            />
                                            <Bar dataKey="value" fill={colors.primary} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}

            {/* Sales Report Tab */}
            {activeTab === 'sales' && (
                <>
                    <Row className="mb-4">
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.success}` }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.success }}>
                                    {stats.totalBookings}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Total Bookings</div>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.primary}` }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.primary }}>
                                    {stats.plotsSold}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Plots Sold</div>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.secondary}` }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.secondary }}>
                                    {stats.plotsAvailable}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Available</div>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.purple}` }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.purple }}>
                                    {formatCurrency(stats.totalRevenue)}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Total Value</div>
                            </div>
                        </Col>
                    </Row>

                    <Card style={styles.card}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h6 style={{ color: colors.text, fontWeight: '600', margin: 0 }}>
                                    Recent Bookings
                                </h6>
                                <button style={styles.outlineButton} onClick={() => generatePDFReport('sales')}>
                                    📄 Download PDF
                                </button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <Table style={{ marginBottom: 0 }}>
                                    <thead>
                                        <tr>
                                            <th style={styles.tableHeader}>Plot</th>
                                            <th style={styles.tableHeader}>Customer</th>
                                            <th style={styles.tableHeader}>Total Price</th>
                                            <th style={styles.tableHeader}>Paid</th>
                                            <th style={styles.tableHeader}>Balance</th>
                                            <th style={styles.tableHeader}>Status</th>
                                            <th style={styles.tableHeader}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                                        {bookings.slice(0, 10).map(b => (
                                            <tr key={b._id}>
                                                <td style={styles.tableCell}>Plot #{b.plot?.plotNo || '-'}</td>
                                                <td style={styles.tableCell}>{b.customer?.name || '-'}</td>
                                                <td style={styles.tableCell}>{formatCurrency(b.totalPrice)}</td>
                                                <td style={{ ...styles.tableCell, color: colors.success }}>{formatCurrency(b.totalPaid)}</td>
                                                <td style={{ ...styles.tableCell, color: b.balanceAmount > 0 ? colors.warning : colors.success }}>
                                                    {formatCurrency(b.balanceAmount)}
                                                </td>
                                                <td style={styles.tableCell}>
                                                    <Badge style={{ background: 'rgba(99, 102, 241, 0.2)', color: colors.primary }}>
                                                        {b.status}
                                                    </Badge>
                                                </td>
                                                <td style={{ ...styles.tableCell, color: colors.textMuted }}>
                                                    {new Date(b.bookingDate).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </>
            )}

            {/* Collection Tab */}
            {activeTab === 'collection' && (
                <>
                    <Row className="mb-4">
                        <Col lg={4} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.success}` }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.success }}>
                                    {formatCurrency(stats.totalCollected)}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Total Collected</div>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: colors.textMuted }}>
                                    {stats.totalRevenue > 0 ? Math.round((stats.totalCollected / stats.totalRevenue) * 100) : 0}% of total
                                </div>
                            </div>
                        </Col>
                        <Col lg={4} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.warning}` }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.warning }}>
                                    {formatCurrency(stats.pendingCollection)}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Pending Collection</div>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: colors.textMuted }}>
                                    {bookings.filter(b => b.balanceAmount > 0).length} bookings pending
                                </div>
                            </div>
                        </Col>
                        <Col lg={4} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.primary}` }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.primary }}>
                                    {formatCurrency(stats.totalRevenue)}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Total Due</div>
                            </div>
                        </Col>
                    </Row>

                    <Card style={styles.card}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h6 style={{ color: colors.text, fontWeight: '600', margin: 0 }}>
                                    ⚠️ Pending Collections ({bookings.filter(b => b.balanceAmount > 0).length})
                                </h6>
                                <button style={styles.outlineButton} onClick={() => generatePDFReport('collection')}>
                                    📄 Download PDF
                                </button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <Table style={{ marginBottom: 0 }}>
                                    <thead>
                                        <tr>
                                            <th style={styles.tableHeader}>Plot</th>
                                            <th style={styles.tableHeader}>Customer</th>
                                            <th style={styles.tableHeader}>Phone</th>
                                            <th style={styles.tableHeader}>Total</th>
                                            <th style={styles.tableHeader}>Paid</th>
                                            <th style={styles.tableHeader}>Balance</th>
                                            <th style={styles.tableHeader}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                                        {bookings.filter(b => b.balanceAmount > 0).map(b => (
                                            <tr key={b._id}>
                                                <td style={styles.tableCell}>Plot #{b.plot?.plotNo || '-'}</td>
                                                <td style={styles.tableCell}>{b.customer?.name || '-'}</td>
                                                <td style={styles.tableCell}>{b.customer?.phone || '-'}</td>
                                                <td style={styles.tableCell}>{formatCurrency(b.totalPrice)}</td>
                                                <td style={{ ...styles.tableCell, color: colors.success }}>{formatCurrency(b.totalPaid)}</td>
                                                <td style={{ ...styles.tableCell, color: colors.warning, fontWeight: '600' }}>
                                                    {formatCurrency(b.balanceAmount)}
                                                </td>
                                                <td style={styles.tableCell}>
                                                    <button
                                                        style={{ ...styles.outlineButton, padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                                                        onClick={() => navigate(`/bookings/${b._id}`)}
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
                <>
                    <Row className="mb-4">
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.primary}` }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.primary }}>
                                    {customers.length}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Total Customers</div>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.success}` }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.success }}>
                                    {customers.filter(c => c.stage === 'customer').length}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Converted</div>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.warning}` }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.warning }}>
                                    {customers.filter(c => c.nextFollowUp && new Date(c.nextFollowUp) <= new Date()).length}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Follow-ups Due</div>
                            </div>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.secondary}` }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.secondary }}>
                                    {enquiries.length}
                                </div>
                                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Enquiries</div>
                            </div>
                        </Col>
                    </Row>

                    <Card style={styles.card}>
                        <Card.Body style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h6 style={{ color: colors.text, fontWeight: '600', margin: 0 }}>
                                    Customer List
                                </h6>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button style={styles.outlineButton} onClick={() => generatePDFReport('customer')}>
                                        📄 PDF
                                    </button>
                                    <button style={styles.actionButton} onClick={exportCustomersExcel}>
                                        📊 Excel
                                    </button>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <Table style={{ marginBottom: 0 }}>
                                    <thead>
                                        <tr>
                                            <th style={styles.tableHeader}>Name</th>
                                            <th style={styles.tableHeader}>Phone</th>
                                            <th style={styles.tableHeader}>Email</th>
                                            <th style={styles.tableHeader}>Stage</th>
                                            <th style={styles.tableHeader}>Source</th>
                                            <th style={styles.tableHeader}>Added</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                                        {customers.slice(0, 15).map(c => (
                                            <tr key={c._id}>
                                                <td style={styles.tableCell}>{c.name}</td>
                                                <td style={styles.tableCell}>{c.phone}</td>
                                                <td style={{ ...styles.tableCell, color: colors.textMuted }}>{c.email || '-'}</td>
                                                <td style={styles.tableCell}>
                                                    <Badge style={{
                                                        background: c.stage === 'customer' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                                                        color: c.stage === 'customer' ? colors.success : colors.primary
                                                    }}>
                                                        {c.stage}
                                                    </Badge>
                                                </td>
                                                <td style={{ ...styles.tableCell, color: colors.textMuted }}>{c.source}</td>
                                                <td style={{ ...styles.tableCell, color: colors.textMuted }}>
                                                    {new Date(c.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </>
            )}
        </Container>
    );
};

export default Reports;
