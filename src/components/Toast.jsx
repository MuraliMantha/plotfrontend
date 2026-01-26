import React, { createContext, useContext, useState, useCallback } from 'react';

// Toast Context
const ToastContext = createContext(null);

// Toast types
const TOAST_TYPES = {
    success: { icon: '✅', class: 'toast-success' },
    error: { icon: '❌', class: 'toast-error' },
    warning: { icon: '⚠️', class: 'toast-warning' },
    info: { icon: 'ℹ️', class: 'toast-info' }
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Shorthand methods
    const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
    const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
    const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);
    const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            {toasts.length > 0 && (
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className={`toast ${TOAST_TYPES[toast.type]?.class || 'toast-info'}`}
                            onClick={() => removeToast(toast.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <span>{TOAST_TYPES[toast.type]?.icon}</span>
                            <span>{toast.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;
