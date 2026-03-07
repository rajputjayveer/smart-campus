// src/components/Toast.jsx
// Toast notification component for user feedback

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

export function Toast({ message, type = 'info', duration = 3000, onClose, index = 0 }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 260);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertCircle,
        info: Info
    };

    const styles = {
        success: {
            card: 'border-emerald-200/80 bg-white/95 text-emerald-900',
            icon: 'bg-emerald-100 text-emerald-600',
            bar: 'from-emerald-500 to-green-400'
        },
        error: {
            card: 'border-rose-200/80 bg-white/95 text-rose-900',
            icon: 'bg-rose-100 text-rose-600',
            bar: 'from-rose-500 to-red-400'
        },
        warning: {
            card: 'border-amber-200/80 bg-white/95 text-amber-900',
            icon: 'bg-amber-100 text-amber-600',
            bar: 'from-amber-500 to-yellow-400'
        },
        info: {
            card: 'border-indigo-200/80 bg-white/95 text-indigo-900',
            icon: 'bg-indigo-100 text-indigo-600',
            bar: 'from-indigo-500 to-blue-400'
        }
    };

    const Icon = icons[type] || Info;
    const theme = styles[type] || styles.info;

    return (
        <div className={`pointer-events-auto w-[360px] max-w-[92vw] ${visible ? 'toast-enter' : 'toast-exit'}`} style={{ animationDelay: `${index * 45}ms` }}>
            <div className={`relative overflow-hidden rounded-2xl border shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl ${theme.card}`}>
                <div className="flex items-start gap-3 p-4 pr-11">
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${theme.icon}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold leading-5">{message}</p>
                </div>

                <button
                    onClick={() => {
                        setVisible(false);
                        setTimeout(onClose, 260);
                    }}
                    className="absolute right-3 top-3 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="h-1 w-full bg-gray-100/80">
                    <div
                        className={`h-full bg-gradient-to-r ${theme.bar} toast-progress`}
                        style={{ animationDuration: `${duration}ms` }}
                    />
                </div>
            </div>
        </div>
    );
}

export function useToast() {
    const [toasts, setToasts] = useState([]);
    const recentMessagesRef = useRef({});

    const showToast = (message, type = 'info', duration = 3000) => {
        // Prevent duplicate messages within 1000ms
        const key = `${type}:${message}`;
        const now = Date.now();
        
        if (recentMessagesRef.current[key] && now - recentMessagesRef.current[key] < 1000) {
            return; // Prevent duplicate toast
        }
        
        recentMessagesRef.current[key] = now;
        const id = now;
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return {
        toasts,
        showToast,
        removeToast,
        success: (msg) => showToast(msg, 'success'),
        error: (msg) => showToast(msg, 'error'),
        warning: (msg) => showToast(msg, 'warning'),
        info: (msg) => showToast(msg, 'info')
    };
}
