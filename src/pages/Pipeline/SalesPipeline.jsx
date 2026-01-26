import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, Badge } from 'react-bootstrap';

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

// Pipeline stages configuration
const stages = [
    { id: 'lead', label: 'Leads', color: '#6366f1', emoji: '🎯' },
    { id: 'prospect', label: 'Prospects', color: '#f59e0b', emoji: '👀' },
    { id: 'site_visit', label: 'Site Visits', color: '#22d3ee', emoji: '🏠' },
    { id: 'negotiation', label: 'Negotiation', color: '#ec4899', emoji: '💬' },
    { id: 'booking', label: 'Booking', color: '#8b5cf6', emoji: '📝' },
    { id: 'customer', label: 'Customers', color: '#22c55e', emoji: '✅' }
];

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
        padding: '1.25rem 1.5rem',
        border: `1px solid ${colors.cardBorder}`,
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: '700',
        background: colors.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: 0,
    },
    outlineButton: {
        background: 'transparent',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '10px',
        padding: '0.625rem 1rem',
        fontSize: '0.875rem',
        color: colors.text,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    pipelineContainer: {
        display: 'flex',
        gap: '1rem',
        overflowX: 'auto',
        paddingBottom: '1rem',
    },
    column: {
        minWidth: '280px',
        maxWidth: '300px',
        flex: '0 0 280px',
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `1px solid ${colors.cardBorder}`,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 200px)',
    },
    columnHeader: {
        padding: '1rem',
        borderBottom: `1px solid ${colors.cardBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    columnTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: '600',
        color: colors.text,
    },
    columnBody: {
        padding: '0.75rem',
        overflowY: 'auto',
        flex: 1,
    },
    customerCard: {
        background: 'rgba(15, 23, 42, 0.7)',
        borderRadius: '10px',
        padding: '0.875rem',
        marginBottom: '0.625rem',
        border: `1px solid ${colors.cardBorder}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    avatar: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
        fontSize: '0.85rem',
        flexShrink: 0,
    },
    badge: {
        borderRadius: '6px',
        padding: '0.25rem 0.5rem',
        fontSize: '0.65rem',
        fontWeight: '600',
    },
    followUpBadge: {
        background: 'rgba(245, 158, 11, 0.2)',
        color: colors.warning,
        borderRadius: '6px',
        padding: '0.25rem 0.5rem',
        fontSize: '0.65rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
    },
    overdueBadge: {
        background: 'rgba(239, 68, 68, 0.2)',
        color: colors.danger,
        borderRadius: '6px',
        padding: '0.25rem 0.5rem',
        fontSize: '0.65rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
    },
    statsBadge: {
        background: 'rgba(255, 255, 255, 0.1)',
        color: colors.text,
        borderRadius: '20px',
        padding: '0.25rem 0.625rem',
        fontSize: '0.75rem',
        fontWeight: '600',
    },
};

const SalesPipeline = () => {
    const navigate = useNavigate();
    const [pipelineData, setPipelineData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedCustomer, setDraggedCustomer] = useState(null);
    const [followUps, setFollowUps] = useState({ today: [], overdue: [] });

    // Fetch pipeline data
    const fetchPipeline = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');

            const [pipelineRes, followUpsRes] = await Promise.all([
                fetch(`${API_BASE}/customers/pipeline`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE}/customers/follow-ups`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const pipelineJson = await pipelineRes.json();
            const followUpsJson = await followUpsRes.json();

            if (pipelineJson.success) {
                setPipelineData(pipelineJson.data);
            }
            if (followUpsJson.success) {
                setFollowUps({
                    today: followUpsJson.data.today || [],
                    overdue: followUpsJson.data.overdue || []
                });
            }
        } catch (error) {
            console.error('Error fetching pipeline:', error);
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
        fetchPipeline();
    }, [fetchPipeline, navigate]);

    // Handle drag start
    const handleDragStart = (e, customer, fromStage) => {
        setDraggedCustomer({ ...customer, fromStage });
        e.dataTransfer.effectAllowed = 'move';
    };

    // Handle drag over
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // Handle drop
    const handleDrop = async (e, toStage) => {
        e.preventDefault();

        if (!draggedCustomer || draggedCustomer.fromStage === toStage) {
            setDraggedCustomer(null);
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/customers/${draggedCustomer._id}/stage`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ stage: toStage })
            });

            if (res.ok) {
                fetchPipeline();
            }
        } catch (error) {
            console.error('Error updating stage:', error);
        }

        setDraggedCustomer(null);
    };

    // Check if follow-up is today or overdue
    const getFollowUpStatus = (date) => {
        if (!date) return null;
        const followUp = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        followUp.setHours(0, 0, 0, 0);

        if (followUp < today) return 'overdue';
        if (followUp.getTime() === today.getTime()) return 'today';
        return 'upcoming';
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

    // Calculate totals
    const totalCustomers = pipelineData.reduce((sum, s) => sum + s.count, 0);

    return (
        <Container fluid style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>📊 Sales Pipeline</h1>
                    <p style={{ color: colors.textMuted, margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                        Drag and drop customers to update their stage • {totalCustomers} total
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {followUps.overdue.length > 0 && (
                        <span style={styles.overdueBadge}>
                            ⚠️ {followUps.overdue.length} overdue
                        </span>
                    )}
                    {followUps.today.length > 0 && (
                        <span style={styles.followUpBadge}>
                            📅 {followUps.today.length} today
                        </span>
                    )}
                    <button style={styles.outlineButton} onClick={() => navigate('/customers')}>
                        📋 List View
                    </button>
                </div>
            </div>

            {/* Pipeline Columns */}
            <div style={styles.pipelineContainer}>
                {stages.map((stage) => {
                    const stageData = pipelineData.find(s => s.stage === stage.id) || { customers: [], count: 0 };

                    return (
                        <div
                            key={stage.id}
                            style={styles.column}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                        >
                            {/* Column Header */}
                            <div style={{
                                ...styles.columnHeader,
                                borderTop: `3px solid ${stage.color}`,
                                borderRadius: '16px 16px 0 0',
                            }}>
                                <div style={styles.columnTitle}>
                                    <span>{stage.emoji}</span>
                                    <span>{stage.label}</span>
                                </div>
                                <span style={styles.statsBadge}>{stageData.count}</span>
                            </div>

                            {/* Column Body */}
                            <div style={styles.columnBody}>
                                {stageData.customers.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '2rem 1rem',
                                        color: colors.textMuted,
                                        fontSize: '0.8rem'
                                    }}>
                                        No customers in this stage
                                    </div>
                                ) : (
                                    stageData.customers.map((customer) => {
                                        const followUpStatus = getFollowUpStatus(customer.nextFollowUp);

                                        return (
                                            <div
                                                key={customer._id}
                                                style={styles.customerCard}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, customer, stage.id)}
                                                onClick={() => navigate(`/customers/${customer._id}`)}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = stage.color;
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = colors.cardBorder;
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                    <div style={{ ...styles.avatar, background: stage.color }}>
                                                        {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontWeight: '600',
                                                            color: colors.text,
                                                            fontSize: '0.9rem',
                                                            marginBottom: '0.25rem',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {customer.name}
                                                        </div>
                                                        <div style={{
                                                            color: colors.textMuted,
                                                            fontSize: '0.75rem',
                                                            marginBottom: '0.5rem'
                                                        }}>
                                                            📞 {customer.phone}
                                                        </div>

                                                        {/* Follow-up indicator */}
                                                        {followUpStatus && (
                                                            <span style={
                                                                followUpStatus === 'overdue'
                                                                    ? styles.overdueBadge
                                                                    : followUpStatus === 'today'
                                                                        ? styles.followUpBadge
                                                                        : { ...styles.badge, background: 'rgba(99, 102, 241, 0.2)', color: colors.primary }
                                                            }>
                                                                📅 {followUpStatus === 'overdue' ? 'Overdue' :
                                                                    followUpStatus === 'today' ? 'Today' :
                                                                        new Date(customer.nextFollowUp).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Container>
    );
};

export default SalesPipeline;
