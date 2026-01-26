import React from 'react';

// ============ Button Component ============
export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    loading = false,
    disabled = false,
    fullWidth = false,
    onClick,
    type = 'button',
    className = '',
    ...props
}) => {
    const variants = {
        primary: {
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
            color: 'white',
            border: 'none'
        },
        secondary: {
            background: 'rgba(99, 102, 241, 0.1)',
            color: '#6366f1',
            border: '1px solid #6366f1'
        },
        outline: {
            background: 'transparent',
            color: '#f8fafc',
            border: '1px solid rgba(71, 85, 105, 0.5)'
        },
        success: {
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            border: 'none'
        },
        danger: {
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            border: '1px solid #ef4444'
        },
        ghost: {
            background: 'transparent',
            color: '#94a3b8',
            border: 'none'
        }
    };

    const sizes = {
        sm: { padding: '0.4rem 0.75rem', fontSize: '0.75rem' },
        md: { padding: '0.625rem 1.25rem', fontSize: '0.875rem' },
        lg: { padding: '0.875rem 1.75rem', fontSize: '1rem' }
    };

    const style = {
        ...variants[variant],
        ...sizes[size],
        borderRadius: '10px',
        fontWeight: '600',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: fullWidth ? '100%' : 'auto',
        ...props.style
    };

    return (
        <button
            type={type}
            style={style}
            onClick={onClick}
            disabled={disabled || loading}
            className={`hover-lift ${className}`}
            {...props}
        >
            {loading ? (
                <span className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
            ) : icon ? (
                <span>{icon}</span>
            ) : null}
            {children}
        </button>
    );
};

// ============ Card Component ============
export const Card = ({
    children,
    title,
    subtitle,
    icon,
    actions,
    padding = true,
    className = '',
    ...props
}) => {
    const style = {
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(71, 85, 105, 0.5)',
        overflow: 'hidden',
        ...props.style
    };

    return (
        <div style={style} className={className}>
            {(title || actions) && (
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h5 style={{
                            color: '#f8fafc',
                            fontWeight: '600',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {icon && <span>{icon}</span>}
                            {title}
                        </h5>
                        {subtitle && (
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && <div style={{ display: 'flex', gap: '0.5rem' }}>{actions}</div>}
                </div>
            )}
            <div style={{ padding: padding ? '1.5rem' : 0 }}>
                {children}
            </div>
        </div>
    );
};

// ============ Stat Card Component ============
export const StatCard = ({
    value,
    label,
    icon,
    color = '#6366f1',
    trend,
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                borderLeft: `4px solid ${color}`,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease'
            }}
            className={onClick ? 'hover-lift' : ''}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color }}>
                        {value}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {label}
                    </div>
                </div>
                {icon && (
                    <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>{icon}</span>
                )}
            </div>
            {trend && (
                <div style={{
                    marginTop: '0.75rem',
                    fontSize: '0.75rem',
                    color: trend > 0 ? '#22c55e' : '#ef4444'
                }}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
                </div>
            )}
        </div>
    );
};

// ============ Badge Component ============
export const Badge = ({
    children,
    variant = 'primary',
    size = 'md'
}) => {
    const variants = {
        primary: { bg: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' },
        success: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' },
        warning: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
        danger: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
        info: { bg: 'rgba(34, 211, 238, 0.2)', color: '#22d3ee' },
        purple: { bg: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }
    };

    const sizes = {
        sm: { padding: '0.25rem 0.5rem', fontSize: '0.65rem' },
        md: { padding: '0.375rem 0.75rem', fontSize: '0.75rem' },
        lg: { padding: '0.5rem 1rem', fontSize: '0.85rem' }
    };

    const v = variants[variant] || variants.primary;
    const s = sizes[size] || sizes.md;

    return (
        <span style={{
            ...s,
            background: v.bg,
            color: v.color,
            borderRadius: '8px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
        }}>
            {children}
        </span>
    );
};

// ============ Avatar Component ============
export const Avatar = ({
    name,
    src,
    size = 44,
    color
}) => {
    const initial = name?.charAt(0)?.toUpperCase() || '?';

    const defaultGradient = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)';

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '12px',
                    objectFit: 'cover'
                }}
            />
        );
    }

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '12px',
            background: color || defaultGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: size * 0.4,
            flexShrink: 0
        }}>
            {initial}
        </div>
    );
};

// ============ Empty State Component ============
export const EmptyState = ({
    icon = '📭',
    title = 'No data found',
    description,
    action
}) => {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <div className="empty-state-title">{title}</div>
            {description && <div className="empty-state-description">{description}</div>}
            {action}
        </div>
    );
};

// ============ Skeleton Loader Component ============
export const Skeleton = ({
    variant = 'text',
    width,
    height,
    count = 1,
    className = ''
}) => {
    const variants = {
        text: { height: '1rem', width: width || '100%' },
        title: { height: '1.5rem', width: width || '60%' },
        avatar: { height: height || '44px', width: width || '44px', borderRadius: '12px' },
        card: { height: height || '120px', width: width || '100%' },
        button: { height: '40px', width: width || '100px', borderRadius: '10px' }
    };

    const style = {
        ...variants[variant],
        marginBottom: variant === 'text' || variant === 'title' ? '0.5rem' : 0
    };

    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={`skeleton ${className}`} style={style} />
            ))}
        </>
    );
};

// ============ Progress Bar Component ============
export const ProgressBar = ({
    value,
    max = 100,
    color,
    showLabel = true,
    height = 8
}) => {
    const percent = Math.min(Math.round((value / max) * 100), 100);
    const defaultColor = percent >= 100 ? '#22c55e' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';

    return (
        <div>
            {showLabel && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                    fontSize: '0.85rem'
                }}>
                    <span style={{ color: '#f8fafc', fontWeight: '600' }}>Progress</span>
                    <span style={{ color: '#94a3b8' }}>{percent}%</span>
                </div>
            )}
            <div style={{
                height,
                borderRadius: height / 2,
                background: 'rgba(71, 85, 105, 0.3)',
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${percent}%`,
                    background: color || defaultColor,
                    borderRadius: height / 2,
                    transition: 'width 0.3s ease'
                }} />
            </div>
        </div>
    );
};

// ============ Divider Component ============
export const Divider = ({ margin = '1rem' }) => (
    <div style={{
        height: '1px',
        background: 'rgba(71, 85, 105, 0.5)',
        margin: `${margin} 0`
    }} />
);

// ============ Loading Overlay Component ============
export const LoadingOverlay = ({ message = 'Loading...' }) => (
    <div className="loading-overlay">
        <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" />
            {message && (
                <p style={{ color: '#94a3b8', marginTop: '1rem' }}>{message}</p>
            )}
        </div>
    </div>
);

export default {
    Button,
    Card,
    StatCard,
    Badge,
    Avatar,
    EmptyState,
    Skeleton,
    ProgressBar,
    Divider,
    LoadingOverlay
};
