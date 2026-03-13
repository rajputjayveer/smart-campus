import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, RefreshCw, CreditCard, Star, ChevronDown, ChevronUp, MessageSquare, X } from 'lucide-react';
import api from '../services/api';

const STATUS_CONFIG = {
    pending:   { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', barColor: 'from-amber-400 to-amber-500' },
    preparing: { color: 'bg-blue-100 text-blue-700 border-blue-200',   dot: 'bg-blue-500',  barColor: 'from-blue-400 to-blue-500' },
    ready:     { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', barColor: 'from-emerald-400 to-emerald-500' },
    completed: { color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', barColor: 'from-green-400 to-green-600' },
    cancelled: { color: 'bg-red-100 text-red-700 border-red-200',     dot: 'bg-red-500',   barColor: 'from-red-400 to-red-500' },
};
const TIMELINE_STEPS = ['pending', 'preparing', 'ready', 'completed'];

function OrdersViewComponent({ user, showToast }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState(null);
    const [feedbackOrder, setFeedbackOrder] = useState(null);
    const [feedbackData, setFeedbackData] = useState({ itemName: '', rating: 5, comments: '' });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    const safeToast = {
        error: (msg) => showToast?.error?.(msg),
        success: (msg) => showToast?.success?.(msg),
    };

    useEffect(() => {
        if (!user) { setError('User not found. Please login again.'); setLoading(false); return; }
        loadOrders();
        const interval = setInterval(loadOrders, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const loadOrders = async () => {
        try {
            setError(null);
            const data = await api.getUserOrders();
            let arr = [];
            if (Array.isArray(data)) arr = data;
            else if (data?.data && Array.isArray(data.data)) arr = data.data;
            else if (data && typeof data === 'object') arr = Object.values(data).find(v => Array.isArray(v)) || [];
            setOrders(arr);
        } catch (err) {
            const msg = err.message || 'Failed to load orders';
            setError(msg.includes('authentication') || msg.includes('401') ? 'Please login again to view your orders' : msg);
            safeToast.error(msg);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const openFeedback = (order) => {
        const items = Array.isArray(order?.items) ? order.items : [];
        setFeedbackOrder(order);
        setFeedbackData({ itemName: items[0]?.name || items[0]?.itemName || 'General', rating: 5, comments: '' });
    };

    const submitFeedback = async () => {
        if (!feedbackOrder) return;
        if (!feedbackData.comments.trim()) { safeToast.error('Please enter feedback comments'); return; }
        try {
            setSubmittingFeedback(true);
            await api.createFeedback({
                stall: feedbackOrder.stallName || feedbackOrder.stall?.stallName || 'Unknown Stall',
                item: feedbackData.itemName || 'General',
                rating: feedbackData.rating,
                comments: feedbackData.comments,
                userId: user?.id || null
            });
            safeToast.success('Feedback submitted. Thank you!');
            setFeedbackOrder(null);
        } catch { safeToast.error('Failed to submit feedback'); }
        finally { setSubmittingFeedback(false); }
    };

    const normalizeNumber = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-4 px-4">
                <div className="skeleton h-10 w-48 rounded-xl" />
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                    <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Orders</h3>
                    <p className="text-red-600 text-sm mb-5">{error}</p>
                    <button onClick={loadOrders} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm shadow-lg">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full overflow-y-auto no-scrollbar pb-24 lg:pb-8">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-extrabold text-gray-900">My Orders</h2>
                <button onClick={loadOrders} className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 transition-all text-sm font-medium text-gray-600 hover:text-gray-800 shadow-sm">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                </button>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-5 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <Package className="h-10 w-10 text-gray-300" />
                    </div>
                    <p className="text-lg font-semibold text-gray-400">No orders yet</p>
                    <p className="text-gray-300 text-sm mt-1">Start ordering from the canteen!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order, index) => {
                        if (!order) return null;
                        const orderId = order.id || order.orderId || `order-${index}`;
                        const status = (order.status || order.orderStatus || 'pending').toLowerCase();
                        const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                        const timestamp = order.timestamp || order.createdAt || order.date;
                        const total = normalizeNumber(order.total || order.totalAmount, 0);
                        const items = order.items || order.orderItems || [];
                        const stallName = order.stallName || order.stall?.stallName || 'Unknown Stall';
                        const canFeedback = ['ready', 'completed'].includes(status);
                        const isExpanded = selectedOrder && (selectedOrder.id === orderId || selectedOrder.id === order.id);

                        return (
                            <div key={orderId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover">
                                {/* Status bar accent */}
                                <div className={`h-1 bg-gradient-to-r ${config.barColor}`} />

                                {/* Order header */}
                                <div
                                    className="p-4 sm:p-5 cursor-pointer"
                                    onClick={() => setSelectedOrder(isExpanded ? null : order)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                                                {status === 'preparing' ? <RefreshCw className="h-4 w-4 animate-spin" /> :
                                                 status === 'completed' || status === 'ready' ? <CheckCircle className="h-4 w-4" /> :
                                                 status === 'cancelled' ? <XCircle className="h-4 w-4" /> :
                                                 <Clock className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-sm sm:text-base text-gray-900">
                                                        #{typeof orderId === 'string' && orderId.length > 8 ? orderId.substring(0, 8) : orderId}
                                                    </h3>
                                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.color}`}>
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">{stallName} {timestamp ? `· ${new Date(timestamp).toLocaleDateString()}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-lg font-extrabold text-indigo-600">INR {total.toFixed(0)}</p>
                                            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-gray-100 pt-4 slide-up">
                                        {/* Items */}
                                        <div className="space-y-1.5">
                                            {items.map((item, idx) => (
                                                <div key={item.id || idx} className="flex justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                                                    <span className="text-gray-700">{item.name || item.itemName || 'Item'} <span className="text-gray-400">x{normalizeNumber(item.quantity, 1)}</span></span>
                                                    <span className="font-semibold text-gray-800">INR {(normalizeNumber(item.price, 0) * normalizeNumber(item.quantity, 1)).toFixed(0)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Timeline */}
                                        <div className="flex items-center gap-1 pt-2">
                                            {TIMELINE_STEPS.map((step, i) => {
                                                const currentIdx = TIMELINE_STEPS.indexOf(status);
                                                const done = i <= currentIdx;
                                                return (
                                                    <div key={step} className="flex items-center flex-1">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                                                            done ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-200 text-gray-400'
                                                        }`}>
                                                            {done ? '✓' : i + 1}
                                                        </div>
                                                        {i < TIMELINE_STEPS.length - 1 && (
                                                            <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-400 px-1">
                                            {TIMELINE_STEPS.map(s => <span key={s} className="capitalize">{s}</span>)}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end pt-2">
                                            {canFeedback && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openFeedback(order); }}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-all border border-amber-200"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    Give Feedback
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Feedback Modal */}
            {feedbackOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 fade-in">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden slide-up">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">Order Feedback</h3>
                                    <p className="text-amber-100 text-sm">{feedbackOrder.stallName || feedbackOrder.stall?.stallName || 'Stall'}</p>
                                </div>
                                <button onClick={() => setFeedbackOrder(null)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Item</label>
                                <select
                                    value={feedbackData.itemName}
                                    onChange={(e) => setFeedbackData(prev => ({ ...prev, itemName: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                                >
                                    <option value="General">General</option>
                                    {(feedbackOrder.items || []).map((item, idx) => {
                                        const name = item.name || item.itemName || `Item ${idx + 1}`;
                                        return <option key={item.id || idx} value={name}>{name}</option>;
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                                            onMouseEnter={() => setHoveredStar(star)}
                                            onMouseLeave={() => setHoveredStar(0)}
                                            className="p-0.5 transition-transform hover:scale-110"
                                        >
                                            <Star className={`h-7 w-7 transition-colors ${
                                                (hoveredStar || feedbackData.rating) >= star
                                                    ? 'text-amber-400 fill-current'
                                                    : 'text-gray-200'
                                            }`} />
                                        </button>
                                    ))}
                                    <span className="text-sm text-gray-500 ml-2 font-medium">{feedbackData.rating}/5</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comments</label>
                                <textarea
                                    value={feedbackData.comments}
                                    onChange={(e) => setFeedbackData(prev => ({ ...prev, comments: e.target.value }))}
                                    rows="3"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 resize-none"
                                    placeholder="Share your experience..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setFeedbackOrder(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold text-sm transition-colors">
                                    Cancel
                                </button>
                                <button onClick={submitFeedback} disabled={submittingFeedback} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 font-semibold text-sm disabled:opacity-50 transition-all shadow-lg">
                                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function OrdersView({ user, showToast }) {
    try {
        return <OrdersViewComponent user={user} showToast={showToast} />;
    } catch (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                    <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-800 mb-2">Something went wrong</h3>
                    <p className="text-red-600 text-sm mb-4">{error.message || 'An unexpected error occurred'}</p>
                    <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm">
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }
}
