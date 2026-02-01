import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
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
        gap: '1.25rem',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '0.5rem 0.5rem 1.5rem',
        minHeight: 'calc(100vh - 250px)',
        width: '100%',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(99, 102, 241, 0.5) rgba(30, 41, 59, 0.3)',
        msOverflowStyle: 'none',
    },
    column: {
        minWidth: '300px',
        width: '300px',
        flex: '0 0 300px',
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.cardBorder}`,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 250px)',
        transition: 'all 0.3s ease',
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
        padding: '0.875rem',
        overflowY: 'auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    customerCard: {
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: '12px',
        padding: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        cursor: 'grab',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '700',
        fontSize: '1rem',
        flexShrink: 0,
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
    },
    badge: {
        borderRadius: '8px',
        padding: '0.35rem 0.65rem',
        fontSize: '0.7rem',
        fontWeight: '600',
        letterSpacing: '0.02em',
    },
    followUpBadge: {
        background: 'rgba(245, 158, 11, 0.15)',
        color: '#fbbf24',
        borderRadius: '8px',
        padding: '0.35rem 0.65rem',
        fontSize: '0.7rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        border: '1px solid rgba(245, 158, 11, 0.2)',
    },
    overdueBadge: {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#f87171',
        borderRadius: '8px',
        padding: '0.35rem 0.65rem',
        fontSize: '0.7rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        border: '1px solid rgba(239, 68, 68, 0.2)',
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

    // V4: Fetch pipeline data using multi-tenant API
    const fetchPipeline = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            const [pipelineJson, followUpsJson] = await Promise.all([
                api.get(endpoints.customers.pipeline),
                api.get(`${endpoints.customers.list.replace('/customers', '/customers/follow-ups')}`)
            ]);

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
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPipeline();
    }, [fetchPipeline]);

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

    // V4: Handle drop using multi-tenant API
    const handleDrop = async (e, toStage) => {
        e.preventDefault();

        if (!draggedCustomer || draggedCustomer.fromStage === toStage) {
            setDraggedCustomer(null);
            return;
        }

        // Optimistic update
        const originalData = [...pipelineData];
        const newPipelineData = pipelineData.map(s => {
            if (s.stage === draggedCustomer.fromStage) {
                return { ...s, count: s.count - 1, customers: s.customers.filter(c => c._id !== draggedCustomer._id) };
            }
            if (s.stage === toStage) {
                return { ...s, count: s.count + 1, customers: [...s.customers, { ...draggedCustomer, stage: toStage }] };
            }
            return s;
        });
        setPipelineData(newPipelineData);

        try {
            const data = await api.patch(endpoints.customers.updateStage(draggedCustomer._id), { stage: toStage });
            if (data.success) {
                fetchPipeline(true); // Silent update to sync with server
            } else {
                setPipelineData(originalData); // Rollback on failure
            }
        } catch (error) {
            console.error('Error updating stage:', error);
            setPipelineData(originalData); // Rollback on error
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
