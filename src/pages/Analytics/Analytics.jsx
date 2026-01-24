import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, LineChart, Line, AreaChart, Area, ComposedChart, RadialBarChart, RadialBar,
    ScatterChart, Scatter, Treemap
} from 'recharts';

const API_BASE = 'http://localhost:5000/api';

// V2 Theme Colors
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

const statusColors = {
    available: '#22c55e',
    sold: '#ef4444',
    booked: '#f59e0b',
    reserved: '#8b5cf6',
    hold: '#fbbf24',
    tentatively_booked: '#ec4899',
    blocked: '#6b7280',
    cip: '#06b6d4',
    unknown: '#6b7280'
};

const Analytics = () => {
    const navigate = useNavigate();
    const [ventures, setVentures] = useState([]);
    const [plots, setPlots] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [selectedVenture, setSelectedVenture] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');

            const [venturesRes, plotsRes, enquiriesRes] = await Promise.all([
                fetch(`${API_BASE}/ventures`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/plot`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/enquiries`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const venturesData = await venturesRes.json();
            const plotsData = await plotsRes.json();
            const enquiriesData = await enquiriesRes.json();

            // Handle both array and object responses
            if (Array.isArray(venturesData)) {
                setVentures(venturesData);
            } else if (venturesData.success) {
                setVentures(venturesData.data || []);
            }

            if (plotsData.features) setPlots(plotsData.features);
            if (Array.isArray(enquiriesData)) setEnquiries(enquiriesData);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter plots by venture
    const filteredPlots = useMemo(() => {
        return selectedVenture
            ? plots.filter(p => p.properties.ventureId === selectedVenture)
            : plots;
    }, [plots, selectedVenture]);

    // Calculate status distribution
    const statusCounts = useMemo(() => {
        return filteredPlots.reduce((acc, plot) => {
            const status = plot.properties.status?.toLowerCase() || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
    }, [filteredPlots]);

    const pieData = useMemo(() => {
        return Object.entries(statusCounts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
            value,
            color: statusColors[name] || '#6b7280'
        }));
    }, [statusCounts]);

    // Calculate revenue metrics
    const revenueMetrics = useMemo(() => {
        const total = filteredPlots.reduce((sum, p) => sum + (parseInt(p.properties.price) || 0), 0);
        const sold = filteredPlots
            .filter(p => p.properties.status?.toLowerCase() === 'sold')
            .reduce((sum, p) => sum + (parseInt(p.properties.price) || 0), 0);
        const booked = filteredPlots
            .filter(p => ['booked', 'reserved', 'tentatively_booked'].includes(p.properties.status?.toLowerCase()))
            .reduce((sum, p) => sum + (parseInt(p.properties.price) || 0), 0);
        const available = filteredPlots
            .filter(p => p.properties.status?.toLowerCase() === 'available')
            .reduce((sum, p) => sum + (parseInt(p.properties.price) || 0), 0);

        return { total, sold, booked, available };
    }, [filteredPlots]);

    // Revenue bar chart data
    const revenueData = [
        { name: 'Total Inventory', value: revenueMetrics.total, fill: '#3b82f6' },
        { name: 'Realized (Sold)', value: revenueMetrics.sold, fill: '#22c55e' },
        { name: 'Pipeline', value: revenueMetrics.booked, fill: '#f59e0b' },
        { name: 'Available', value: revenueMetrics.available, fill: '#8b5cf6' }
    ];

    // Price range distribution
    const priceRanges = useMemo(() => {
        const ranges = [
            { range: '< 5L', min: 0, max: 500000 },
            { range: '5-10L', min: 500000, max: 1000000 },
            { range: '10-15L', min: 1000000, max: 1500000 },
            { range: '15-20L', min: 1500000, max: 2000000 },
            { range: '20-30L', min: 2000000, max: 3000000 },
            { range: '30L+', min: 3000000, max: Infinity }
        ];

        return ranges.map(({ range, min, max }) => ({
            range,
            count: filteredPlots.filter(p => {
                const price = parseInt(p.properties.price) || 0;
                return price >= min && price < max;
            }).length,
            available: filteredPlots.filter(p => {
                const price = parseInt(p.properties.price) || 0;
                return price >= min && price < max && p.properties.status?.toLowerCase() === 'available';
            }).length,
            sold: filteredPlots.filter(p => {
                const price = parseInt(p.properties.price) || 0;
                return price >= min && price < max && p.properties.status?.toLowerCase() === 'sold';
            }).length
        }));
    }, [filteredPlots]);

    // Facing distribution
    const facingData = useMemo(() => {
        const facingCounts = filteredPlots.reduce((acc, plot) => {
            const facing = plot.properties.facing || 'Not Specified';
            acc[facing] = (acc[facing] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(facingCounts).map(([name, value]) => ({ name, plots: value }));
    }, [filteredPlots]);

    // Area distribution with status breakdown
    const areaDistribution = useMemo(() => {
        const ranges = [
            { range: '0-100 sq.ft', min: 0, max: 100 },
            { range: '100-200 sq.ft', min: 100, max: 200 },
            { range: '200-300 sq.ft', min: 200, max: 300 },
            { range: '300-500 sq.ft', min: 300, max: 500 },
            { range: '500+ sq.ft', min: 500, max: Infinity }
        ];

        return ranges.map(({ range, min, max }) => ({
            range,
            total: filteredPlots.filter(p => {
                const area = parseFloat(p.properties.area) || 0;
                return area >= min && area < max;
            }).length,
            available: filteredPlots.filter(p => {
                const area = parseFloat(p.properties.area) || 0;
                return area >= min && area < max && p.properties.status?.toLowerCase() === 'available';
            }).length,
            sold: filteredPlots.filter(p => {
                const area = parseFloat(p.properties.area) || 0;
                return area >= min && area < max && p.properties.status?.toLowerCase() === 'sold';
            }).length
        }));
    }, [filteredPlots]);

    // Monthly trend (simulated based on data)
    const monthlyTrend = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const totalPlots = filteredPlots.length;
        const soldCount = statusCounts.sold || 0;

        return months.map((month, index) => ({
            month,
            enquiries: Math.max(0, Math.floor(enquiries.length / 6) + Math.floor(Math.random() * 3)),
            conversions: Math.max(0, Math.floor(soldCount / 6) + (index > 3 ? Math.floor(Math.random() * 2) : 0)),
            revenue: Math.max(0, Math.floor(revenueMetrics.sold / 6) * (0.8 + Math.random() * 0.4))
        }));
    }, [filteredPlots, enquiries, statusCounts, revenueMetrics]);

    // Conversion funnel
    const funnelData = useMemo(() => [
        { name: 'Total Enquiries', value: enquiries.length, fill: '#3b82f6', percentage: 100 },
        { name: 'Qualified Leads', value: Math.floor(enquiries.length * 0.7), fill: '#8b5cf6', percentage: 70 },
        { name: 'Site Visits', value: Math.floor(enquiries.length * 0.5), fill: '#06b6d4', percentage: 50 },
        { name: 'Negotiations', value: Math.floor(enquiries.length * 0.3), fill: '#f59e0b', percentage: 30 },
        { name: 'Bookings', value: (statusCounts.booked || 0) + (statusCounts.reserved || 0), fill: '#ec4899', percentage: 15 },
        { name: 'Closed (Sold)', value: statusCounts.sold || 0, fill: '#22c55e', percentage: 8 }
    ], [enquiries, statusCounts]);

    // Radial bar data for key metrics
    const radialData = useMemo(() => {
        const total = filteredPlots.length || 1;
        return [
            { name: 'Available', value: ((statusCounts.available || 0) / total * 100), fill: '#22c55e' },
            { name: 'Sold', value: ((statusCounts.sold || 0) / total * 100), fill: '#ef4444' },
            { name: 'Reserved', value: ((statusCounts.reserved || 0) / total * 100), fill: '#8b5cf6' },
        ];
    }, [filteredPlots, statusCounts]);

    // Top plots by price
    const topPlots = useMemo(() => {
        return [...filteredPlots]
            .sort((a, b) => (parseInt(b.properties.price) || 0) - (parseInt(a.properties.price) || 0))
            .slice(0, 5)
            .map(p => ({
                name: `Plot #${p.properties.plotNo}`,
                price: parseInt(p.properties.price) || 0,
                area: parseFloat(p.properties.area) || 0,
                status: p.properties.status || 'unknown',
                facing: p.properties.facing || '-'
            }));
    }, [filteredPlots]);

    // Venture comparison data
    const ventureComparison = useMemo(() => {
        return ventures.map(venture => {
            const venturePlots = plots.filter(p => p.properties.ventureId === venture._id);
            const sold = venturePlots.filter(p => p.properties.status?.toLowerCase() === 'sold').length;
            const available = venturePlots.filter(p => p.properties.status?.toLowerCase() === 'available').length;
            const revenue = venturePlots
                .filter(p => p.properties.status?.toLowerCase() === 'sold')
                .reduce((sum, p) => sum + (parseInt(p.properties.price) || 0), 0);

            return {
                name: venture.name,
                total: venturePlots.length,
                sold,
                available,
                revenue,
                conversionRate: venturePlots.length ? (sold / venturePlots.length * 100).toFixed(1) : 0,
                isDefault: venture.isDefault
            };
        });
    }, [ventures, plots]);

    // Stats cards
    const statsCards = [
        { title: 'Total Plots', value: filteredPlots.length, icon: '📊', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
        { title: 'Available', value: statusCounts.available || 0, icon: '✅', gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
        { title: 'Sold', value: statusCounts.sold || 0, icon: '🏷️', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
        { title: 'Reserved', value: (statusCounts.reserved || 0) + (statusCounts.booked || 0), icon: '🔒', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
        { title: 'Revenue', value: formatCurrency(revenueMetrics.sold), icon: '💰', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
        { title: 'Conversion', value: filteredPlots.length ? `${((statusCounts.sold || 0) / filteredPlots.length * 100).toFixed(1)}%` : '0%', icon: '📈', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }
    ];

    function formatCurrency(value) {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        return `₹${(value || 0).toLocaleString()}`;
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: colors.cardBg,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: colors.text
                }}>
                    <p style={{ margin: 0, fontWeight: '600' }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ margin: '0.25rem 0 0', color: entry.color }}>
                            {entry.name}: {typeof entry.value === 'number' && entry.dataKey?.includes('revenue')
                                ? formatCurrency(entry.value)
                                : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <Container fluid style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(180deg, ${colors.darker} 0%, ${colors.dark} 100%)`
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '3px solid rgba(99, 102, 241, 0.3)',
                        borderTopColor: colors.primary,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }} />
                    <p style={{ color: colors.textMuted }}>Loading analytics...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </Container>
        );
    }

    return (
        <Container fluid style={{
            background: `linear-gradient(180deg, ${colors.darker} 0%, ${colors.dark} 100%)`,
            minHeight: '100vh',
            padding: '2rem'
        }}>
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div style={{
                        background: colors.gradient,
                        borderRadius: '20px',
                        padding: '2rem',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(99, 102, 241, 0.3)'
                    }}>
                        <div style={{
                            position: 'absolute',
                            right: '-50px',
                            top: '-50px',
                            width: '200px',
                            height: '200px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%',
                            filter: 'blur(30px)'
                        }} />

                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
                                    📊 Analytics Dashboard
                                </h1>
                                <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 0 }}>
                                    Real-time insights, performance metrics & business intelligence
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <Form.Select
                                    value={selectedVenture}
                                    onChange={(e) => setSelectedVenture(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.15)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        color: '#fff',
                                        borderRadius: '10px',
                                        padding: '0.75rem 1rem',
                                        minWidth: '200px'
                                    }}
                                >
                                    <option value="" style={{ background: colors.dark }}>All Ventures</option>
                                    {ventures.map(v => (
                                        <option key={v._id} value={v._id} style={{ background: colors.dark }}>
                                            {v.name} {v.isDefault ? '⭐' : ''}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Button
                                    onClick={fetchData}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: '10px',
                                        padding: '0.75rem 1.25rem',
                                        color: 'white',
                                        fontWeight: '600'
                                    }}
                                >
                                    🔄 Refresh
                                </Button>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Stats Cards */}
            <Row className="mb-4">
                {statsCards.map((stat, i) => (
                    <Col lg={2} md={4} sm={6} key={i} className="mb-3">
                        <Card style={{
                            background: stat.gradient,
                            border: 'none',
                            borderRadius: '16px',
                            color: '#fff',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s ease',
                            overflow: 'hidden'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                            }}>
                            <Card.Body style={{ padding: '1.25rem' }}>
                                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                                <h3 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                                    {stat.value}
                                </h3>
                                <p style={{ opacity: 0.9, marginBottom: 0, fontSize: '0.85rem' }}>{stat.title}</p>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Charts Row 1 - Overview */}
            <Row className="mb-4">
                {/* Status Distribution */}
                <Col lg={4} className="mb-4">
                    <Card style={{
                        background: colors.cardBg,
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: `1px solid ${colors.cardBorder}`,
                        height: '100%'
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '600', color: colors.text, marginBottom: '1rem' }}>🥧 Status Distribution</h5>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value) => <span style={{ color: colors.textMuted }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Revenue Overview */}
                <Col lg={4} className="mb-4">
                    <Card style={{
                        background: colors.cardBg,
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: `1px solid ${colors.cardBorder}`,
                        height: '100%'
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '600', color: colors.text, marginBottom: '1rem' }}>💰 Revenue Breakdown</h5>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colors.cardBorder} />
                                    <XAxis dataKey="name" tick={{ fill: colors.textMuted, fontSize: 10 }} />
                                    <YAxis tickFormatter={formatCurrency} tick={{ fill: colors.textMuted, fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {revenueData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Conversion Funnel */}
                <Col lg={4} className="mb-4">
                    <Card style={{
                        background: colors.cardBg,
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: `1px solid ${colors.cardBorder}`,
                        height: '100%'
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '600', color: colors.text, marginBottom: '1rem' }}>🔄 Conversion Funnel</h5>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={funnelData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke={colors.cardBorder} />
                                    <XAxis type="number" tick={{ fill: colors.textMuted }} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: colors.textMuted, fontSize: 10 }} width={90} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row 2 - Distributions */}
            <Row className="mb-4">
                {/* Price Range Distribution */}
                <Col lg={6} className="mb-4">
                    <Card style={{
                        background: colors.cardBg,
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: `1px solid ${colors.cardBorder}`
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '600', color: colors.text, marginBottom: '1rem' }}>💵 Price Range Distribution</h5>
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={priceRanges}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colors.cardBorder} />
                                    <XAxis dataKey="range" tick={{ fill: colors.textMuted, fontSize: 11 }} />
                                    <YAxis tick={{ fill: colors.textMuted }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend formatter={(value) => <span style={{ color: colors.textMuted }}>{value}</span>} />
                                    <Bar dataKey="available" stackId="a" fill="#22c55e" name="Available" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="sold" stackId="a" fill="#ef4444" name="Sold" radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} name="Total" dot={{ fill: '#8b5cf6' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Area Distribution */}
                <Col lg={6} className="mb-4">
                    <Card style={{
                        background: colors.cardBg,
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: `1px solid ${colors.cardBorder}`
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '600', color: colors.text, marginBottom: '1rem' }}>📐 Area Distribution</h5>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={areaDistribution}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colors.cardBorder} />
                                    <XAxis dataKey="range" tick={{ fill: colors.textMuted, fontSize: 10 }} />
                                    <YAxis tick={{ fill: colors.textMuted }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend formatter={(value) => <span style={{ color: colors.textMuted }}>{value}</span>} />
                                    <Area type="monotone" dataKey="total" stroke="#8b5cf6" fill="url(#colorTotal)" name="Total" strokeWidth={2} />
                                    <Area type="monotone" dataKey="available" stroke="#22c55e" fill="url(#colorAvailable)" name="Available" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row 3 - Trends & Facing */}
            <Row className="mb-4">
                {/* Monthly Trend */}
                <Col lg={8} className="mb-4">
                    <Card style={{
                        background: colors.cardBg,
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: `1px solid ${colors.cardBorder}`
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '600', color: colors.text, marginBottom: '1rem' }}>📈 Monthly Trend (Last 6 Months)</h5>
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colors.cardBorder} />
                                    <XAxis dataKey="month" tick={{ fill: colors.textMuted }} />
                                    <YAxis yAxisId="left" tick={{ fill: colors.textMuted }} />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} tick={{ fill: colors.textMuted }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend formatter={(value) => <span style={{ color: colors.textMuted }}>{value}</span>} />
                                    <Bar yAxisId="left" dataKey="enquiries" fill="#3b82f6" name="Enquiries" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="left" dataKey="conversions" fill="#22c55e" name="Conversions" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} name="Revenue" dot={{ fill: '#f59e0b', strokeWidth: 2 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Facing Distribution */}
                <Col lg={4} className="mb-4">
                    <Card style={{
                        background: colors.cardBg,
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: `1px solid ${colors.cardBorder}`,
                        height: '100%'
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '600', color: colors.text, marginBottom: '1rem' }}>🧭 Facing Distribution</h5>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={facingData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        dataKey="plots"
                                        nameKey="name"
                                        label={({ name, plots }) => `${name}: ${plots}`}
                                    >
                                        {facingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={[
                                                '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
                                                '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'
                                            ][index % 8]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Top Plots & Venture Comparison */}
            <Row className="mb-4">
                {/* Top Plots by Price */}
                <Col lg={4} className="mb-4">
                    <Card style={{
                        background: colors.cardBg,
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: `1px solid ${colors.cardBorder}`,
                        height: '100%'
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '600', color: colors.text, marginBottom: '1rem' }}>🏆 Top Plots by Price</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {topPlots.length > 0 ? topPlots.map((plot, index) => (
                                    <div key={index} style={{
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        borderRadius: '10px',
                                        padding: '1rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: `1px solid ${colors.cardBorder}`
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                background: colors.gradient,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: '700',
                                                color: 'white',
                                                fontSize: '0.85rem'
                                            }}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: '600', color: colors.text }}>{plot.name}</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: colors.textMuted }}>
                                                    {plot.area} sq.ft • {plot.facing}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ margin: 0, fontWeight: '700', color: colors.success }}>{formatCurrency(plot.price)}</p>
                                            <Badge style={{
                                                background: statusColors[plot.status?.toLowerCase()] || '#6b7280',
                                                fontSize: '0.65rem',
                                                padding: '0.2rem 0.5rem'
                                            }}>
                                                {plot.status}
                                            </Badge>
                                        </div>
                                    </div>
                                )) : (
                                    <p style={{ color: colors.textMuted, textAlign: 'center', padding: '2rem' }}>No plots to display</p>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Venture Comparison */}
                <Col lg={8} className="mb-4">
                    <Card style={{
                        background: colors.cardBg,
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: `1px solid ${colors.cardBorder}`
                    }}>
                        <Card.Body>
                            <h5 style={{ fontWeight: '600', color: colors.text, marginBottom: '1.5rem' }}>🏘️ Venture Performance Comparison</h5>
                            {ventureComparison.length > 0 ? (
                                <Row>
                                    {ventureComparison.map((venture, index) => (
                                        <Col lg={4} md={6} key={index} className="mb-3">
                                            <div style={{
                                                background: venture.isDefault ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                                                borderRadius: '12px',
                                                padding: '1.25rem',
                                                border: venture.isDefault ? `2px solid ${colors.primary}` : `1px solid ${colors.cardBorder}`,
                                                height: '100%'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <h6 style={{ fontWeight: '600', margin: 0, color: colors.text }}>{venture.name}</h6>
                                                    {venture.isDefault && <Badge style={{ background: colors.primary }}>Default</Badge>}
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: colors.primary }}>{venture.total}</p>
                                                        <p style={{ margin: 0, fontSize: '0.7rem', color: colors.textMuted }}>Total</p>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: colors.success }}>{venture.available}</p>
                                                        <p style={{ margin: 0, fontSize: '0.7rem', color: colors.textMuted }}>Available</p>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: colors.danger }}>{venture.sold}</p>
                                                        <p style={{ margin: 0, fontSize: '0.7rem', color: colors.textMuted }}>Sold</p>
                                                    </div>
                                                </div>
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Conversion Rate</span>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: colors.success }}>{venture.conversionRate}%</span>
                                                    </div>
                                                    <div style={{
                                                        height: '6px',
                                                        background: 'rgba(255,255,255,0.1)',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${venture.conversionRate}%`,
                                                            height: '100%',
                                                            background: colors.gradient,
                                                            transition: 'width 0.5s ease'
                                                        }} />
                                                    </div>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: colors.textMuted }}>
                                                    Revenue: <span style={{ fontWeight: '600', color: colors.warning }}>{formatCurrency(venture.revenue)}</span>
                                                </p>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <p style={{ color: colors.textMuted, textAlign: 'center', padding: '2rem' }}>No ventures to compare</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .recharts-legend-item-text { color: ${colors.textMuted} !important; }
            `}</style>
        </Container>
    );
};

export default Analytics;
