// Plot3D V3 - Theme Constants
// Use these in JavaScript/React components for consistent styling

export const colors = {
    // Primary
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryLight: 'rgba(99, 102, 241, 0.1)',

    // Secondary
    secondary: '#22d3ee',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#8b5cf6',
    pink: '#ec4899',

    // Dark Theme
    dark: '#0f172a',
    darker: '#020617',
    cardBg: 'rgba(30, 41, 59, 0.8)',
    cardBorder: 'rgba(71, 85, 105, 0.5)',

    // Text
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textDark: '#64748b',
};

export const gradients = {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    dark: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
    sidebar: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    rainbow: 'linear-gradient(45deg, #fbbf24, #f472b6, #a78bfa)',
};

export const shadows = {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 12px rgba(0, 0, 0, 0.15)',
    lg: '0 10px 40px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    glowSuccess: '0 0 20px rgba(34, 197, 94, 0.3)',
    glowDanger: '0 0 20px rgba(239, 68, 68, 0.3)',
};

export const radius = {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
};

export const spacing = {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
};

export const transitions = {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
};

// Common style presets
export const styles = {
    // Container
    container: {
        background: gradients.dark,
        minHeight: '100vh',
        padding: '2rem',
    },

    // Header
    header: {
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: radius.lg,
        padding: '1.5rem 2rem',
        border: `1px solid ${colors.cardBorder}`,
        marginBottom: '1.5rem',
    },

    // Title with gradient
    title: {
        fontSize: '1.75rem',
        fontWeight: '700',
        background: gradients.primary,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.25rem',
    },

    // Card
    card: {
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: radius.lg,
        border: `1px solid ${colors.cardBorder}`,
        transition: transitions.normal,
    },

    // Action button (primary gradient)
    actionButton: {
        background: gradients.primary,
        border: 'none',
        borderRadius: radius.md,
        padding: '0.625rem 1.25rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'white',
        cursor: 'pointer',
        transition: transitions.fast,
    },

    // Outline button
    outlineButton: {
        background: 'transparent',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: radius.md,
        padding: '0.625rem 1rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: colors.text,
        cursor: 'pointer',
        transition: transitions.fast,
    },

    // Form input
    formInput: {
        background: 'rgba(15, 23, 42, 0.8)',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: radius.md,
        padding: '0.75rem 1rem',
        fontSize: '0.9rem',
        color: colors.text,
    },

    // Form label
    formLabel: {
        color: colors.textMuted,
        fontSize: '0.8rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },

    // Table header
    tableHeader: {
        background: 'rgba(99, 102, 241, 0.15)',
        padding: '0.875rem 1rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        border: 'none',
        borderBottom: `1px solid ${colors.cardBorder}`,
    },

    // Table cell
    tableCell: {
        padding: '1rem',
        border: 'none',
        borderBottom: `1px solid rgba(71, 85, 105, 0.3)`,
        verticalAlign: 'middle',
        color: colors.text,
        background: 'transparent',
    },

    // Stat card
    statCard: {
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: radius.md,
        padding: '1.25rem',
        textAlign: 'center',
        border: `1px solid ${colors.cardBorder}`,
    },

    // Modal styles
    modal: {
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: radius.lg,
    },

    modalHeader: {
        background: gradients.primary,
        borderRadius: `${radius.lg} ${radius.lg} 0 0`,
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
        borderRadius: `0 0 ${radius.lg} ${radius.lg}`,
    },

    // Avatar
    avatar: {
        width: '44px',
        height: '44px',
        borderRadius: radius.md,
        background: gradients.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
        fontSize: '1rem',
        flexShrink: 0,
    },

    // Badge
    badge: {
        borderRadius: radius.sm,
        padding: '0.375rem 0.75rem',
        fontSize: '0.7rem',
        fontWeight: '600',
        border: 'none',
    },

    // Info row (for detail pages)
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        borderBottom: `1px solid ${colors.cardBorder}`,
    },
};

// Status color mappings
export const stageColors = {
    lead: { bg: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', label: 'Lead' },
    prospect: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'Prospect' },
    site_visit: { bg: 'rgba(34, 211, 238, 0.2)', color: '#22d3ee', label: 'Site Visit' },
    negotiation: { bg: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', label: 'Negotiation' },
    booking: { bg: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', label: 'Booking' },
    customer: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Customer' }
};

export const bookingStatusColors = {
    reserved: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'Reserved' },
    booked: { bg: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', label: 'Booked' },
    agreement_signed: { bg: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', label: 'Agreement Signed' },
    registration_pending: { bg: 'rgba(34, 211, 238, 0.2)', color: '#22d3ee', label: 'Registration Pending' },
    registered: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Registered' },
    cancelled: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', label: 'Cancelled' }
};

export const plotStatusColors = {
    available: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Available' },
    reserved: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'Reserved' },
    booked: { bg: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', label: 'Booked' },
    sold: { bg: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', label: 'Sold' }
};

export const sourceLabels = {
    website: '🌐 Website',
    'walk-in': '🚶 Walk-in',
    referral: '👥 Referral',
    phone: '📞 Phone',
    social: '📱 Social',
    newspaper: '📰 Newspaper',
    other: '📋 Other'
};

export const paymentModes = {
    cash: '💵 Cash',
    cheque: '📝 Cheque',
    upi: '📱 UPI',
    bank_transfer: '🏦 Bank Transfer',
    online: '💳 Online'
};

// Utility functions
export const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default {
    colors,
    gradients,
    shadows,
    radius,
    spacing,
    transitions,
    styles,
    stageColors,
    bookingStatusColors,
    plotStatusColors,
    sourceLabels,
    paymentModes,
    formatCurrency,
    formatDate,
    formatDateTime
};
