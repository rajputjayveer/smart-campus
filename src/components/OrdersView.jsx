// Orders View - Customer order history and tracking
import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, RefreshCw, MapPin, CreditCard, Star } from 'lucide-react';
import api from '../services/api';

function OrdersViewComponent({ user, showToast }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState(null);
    const [feedbackOrder, setFeedbackOrder] = useState(null);
    const [feedbackData, setFeedbackData] = useState({
        itemName: '',
        rating: 5,
        comments: ''
    });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    // Safe toast function
    const safeToast = {
        error: (msg) => {
            if (showToast && showToast.error) {
                showToast.error(msg);
            } else {
                console.error('Toast error:', msg);
                alert(msg);
            }
        },
        success: (msg) => {
            if (showToast && showToast.success) {
                showToast.success(msg);
            } else {
                console.log('Toast success:', msg);
            }
        }
    };

    useEffect(() => {
        if (!user) {
            setError('User not found. Please login again.');
            setLoading(false);
            return;
        }
        loadOrders();
        // Refresh orders every 30 seconds
        const interval = setInterval(loadOrders, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const loadOrders = async () => {
        try {
            setError(null);
            console.log('Loading orders...');
            const data = await api.getUserOrders();
            console.log('Raw API response:', data);
            console.log('Data type:', typeof data);
            console.log('Is array:', Array.isArray(data));
            
            // Handle both array and object with data property
            let ordersArray = [];
            if (Array.isArray(data)) {
                ordersArray = data;
            } else if (data && data.data && Array.isArray(data.data)) {
                ordersArray = data.data;
            } else if (data && typeof data === 'object') {
                // Try to extract array from object
                ordersArray = Object.values(data).find(val => Array.isArray(val)) || [];
            }
            
            console.log('Parsed orders array:', ordersArray);
            console.log('Orders count:', ordersArray.length);
            console.log('First order sample:', ordersArray[0]);
            
            setOrders(ordersArray);
            
            if (ordersArray.length === 0) {
                console.log('No orders found - this is normal if you haven\'t placed any orders yet');
            }
        } catch (err) {
            console.error('Error loading orders:', err);
            console.error('Error details:', {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            const errorMessage = err.message || 'Failed to load orders';
            setError(errorMessage);
            safeToast.error(errorMessage);
            setOrders([]);
            
            // If it's an auth error, suggest login
            if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
                console.error('Authentication error - user may need to login again');
                setError('Please login again to view your orders');
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        if (!status) return <Package className="h-5 w-5 text-gray-500" />;
        switch (status.toLowerCase()) {
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'preparing':
                return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
            case 'ready':
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'cancelled':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Package className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'preparing':
                return 'bg-blue-100 text-blue-800';
            case 'ready':
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const openFeedback = (order) => {
        const items = order?.items && Array.isArray(order.items) ? order.items : [];
        const firstItemName = items[0]?.name || items[0]?.itemName || items[0]?.productName || 'General';
        setFeedbackOrder(order);
        setFeedbackData({
            itemName: firstItemName,
            rating: 5,
            comments: ''
        });
    };

    const submitFeedback = async () => {
        if (!feedbackOrder) return;
        if (!feedbackData.comments.trim()) {
            safeToast.error('Please enter feedback comments');
            return;
        }

        const orderStallName = feedbackOrder.stallName || feedbackOrder.stall?.stallName || 'Unknown Stall';
        const itemName = feedbackData.itemName || 'General';

        try {
            setSubmittingFeedback(true);
            await api.createFeedback({
                stall: orderStallName,
                item: itemName,
                rating: feedbackData.rating,
                comments: feedbackData.comments,
                userId: user?.id || null
            });
            safeToast.success('Feedback submitted. Thank you!');
            setFeedbackOrder(null);
        } catch (err) {
            safeToast.error('Failed to submit feedback');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
        );
    }

    if (error && !loading) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Orders</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadOrders}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    console.log('Rendering OrdersView - orders:', orders);
    console.log('Orders length:', orders.length);
    console.log('Loading state:', loading);
    console.log('Error state:', error);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800">My Orders</h2>
                <button
                    onClick={loadOrders}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </button>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-16">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">No orders yet</p>
                    <p className="text-gray-400 mt-2">Start ordering from the canteen!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {false && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-green-800 font-medium">
                            ✅ Found {orders.length} order{orders.length !== 1 ? 's' : ''} - Rendering now...
                        </p>
                    </div>
                    )}
                    {orders.map((order, index) => {
                        if (!order) {
                            console.warn('Null order at index:', index);
                            return null;
                        }
                        
                        // Log order structure for debugging
                        if (index === 0) {
                            console.log('Rendering first order:', order);
                            console.log('Order keys:', Object.keys(order));
                            console.log('Order ID:', order.id);
                            console.log('Order status:', order.status);
                            console.log('Order items:', order.items);
                            console.log('Full order object:', JSON.stringify(order, null, 2));
                        }
                        
                        const orderId = order.id || order.orderId || `order-${index}`;
                        const orderStatus = order.status || order.orderStatus || 'pending';
                        const orderTimestamp = order.timestamp || order.createdAt || order.date || order.orderDate;
                        const normalizeNumber = (value, fallback = 0) => {
                            const numeric = typeof value === 'number' ? value : Number(value);
                            return Number.isFinite(numeric) ? numeric : fallback;
                        };
                        
                        const orderTotal = normalizeNumber(order.total || order.totalAmount || order.amount, 0);
                        const orderItems = order.items || order.orderItems || [];
                        const orderStallName = order.stallName || order.stall?.stallName || order.stallName || 'Unknown Stall';
                        const canFeedback = ['ready', 'completed'].includes(orderStatus);
                        
                        return (
                        <div
                            key={orderId}
                            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-gray-200 hover:border-indigo-300"
                            onClick={() => {
                                const isCurrentlySelected = selectedOrder && (selectedOrder.id === orderId || selectedOrder.id === order.id);
                                setSelectedOrder(isCurrentlySelected ? null : order);
                            }}
                            style={{ minHeight: '120px' }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    {getStatusIcon(orderStatus)}
                                    <div className="ml-3">
                                        <h3 className="font-bold text-lg">
                                            Order #{typeof orderId === 'string' && orderId.length > 8 ? orderId.substring(0, 8) : String(orderId) || `#${index + 1}`}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {orderStallName}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(orderStatus)}`}>
                                        {orderStatus}
                                    </span>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {orderTimestamp ? new Date(orderTimestamp).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {selectedOrder && (selectedOrder.id === orderId || selectedOrder.id === order.id) && (
                                <div className="mt-4 pt-4 border-t space-y-4">
                                    {/* Pickup Time */}
                                    {order.pickupTime && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Clock className="h-4 w-4 mr-2" />
                                            <span>Pickup Time: <strong>{order.pickupTime}</strong></span>
                                        </div>
                                    )}

                                    {/* Payment Status */}
                                    {order.paymentStatus && (
                                        <div className="flex items-center text-sm">
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            <span className={`font-medium ${
                                                order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'
                                            }`}>
                                                Payment: {order.paymentStatus}
                                            </span>
                                        </div>
                                    )}

                                    {/* Order Items */}
                                    <div>
                                        <h4 className="font-semibold mb-2">Order Items:</h4>
                                        <div className="space-y-2">
                                            {orderItems && Array.isArray(orderItems) && orderItems.length > 0 ? (
                                                orderItems.map((item, idx) => {
                                                    const itemName = item.name || item.itemName || item.productName || 'Item';
                                                    const itemQuantity = normalizeNumber(item.quantity, 1);
                                                    const itemPrice = normalizeNumber(item.price || item.itemPrice, 0);
                                                    return (
                                                        <div key={item.id || item.itemId || idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                                            <div className="flex-1">
                                                                <span className="font-medium">{itemName}</span>
                                                                <span className="text-gray-500 ml-2">x {itemQuantity}</span>
                                                            </div>
                                                            <span className="font-medium">₹{(itemPrice * itemQuantity).toFixed(2)}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-sm text-gray-500">No items found in order</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Total */}
                                    <div className="pt-3 border-t flex justify-between font-bold text-lg">
                                        <span>Total:</span>
                                        <span className="text-indigo-600">₹{orderTotal.toFixed(2)}</span>
                                    </div>

                                    {/* Order Status Timeline */}
                                    <div className="pt-4 border-t">
                                        <h4 className="font-semibold mb-3">Order Status:</h4>
                                        <div className="space-y-2">
                                            {['pending', 'preparing', 'ready', 'completed'].map((status, index) => {
                                                const currentStatusIndex = ['pending', 'preparing', 'ready', 'completed'].indexOf(order.status || 'pending');
                                                const isCompleted = index <= currentStatusIndex;
                                                const isCurrent = index === currentStatusIndex;
                                                
                                                return (
                                                    <div key={status} className="flex items-center">
                                                        <div className={`w-3 h-3 rounded-full mr-3 ${
                                                            isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                                        } ${isCurrent ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}></div>
                                                        <span className={`text-sm ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                <div>
                                    <p className="text-sm text-gray-500">Total Amount</p>
                                    <p className="font-bold text-indigo-600 text-xl">₹{orderTotal.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {canFeedback ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openFeedback(order);
                                            }}
                                            className="text-sm text-amber-600 hover:underline font-medium"
                                        >
                                            Give Feedback
                                        </button>
                                    ) : (
                                        <span className="text-sm text-gray-400">Feedback after ready</span>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const isSelected = selectedOrder && (selectedOrder.id === orderId || selectedOrder.id === order.id);
                                            setSelectedOrder(isSelected ? null : order);
                                        }}
                                        className="text-sm text-indigo-600 hover:underline font-medium"
                                    >
                                        {selectedOrder && (selectedOrder.id === orderId || selectedOrder.id === order.id) ? 'Hide Details' : 'View Details'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}

            {feedbackOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Order Feedback</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {feedbackOrder.stallName || feedbackOrder.stall?.stallName || 'Stall'}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Item</label>
                                <select
                                    value={feedbackData.itemName}
                                    onChange={(e) => setFeedbackData(prev => ({ ...prev, itemName: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="General">General</option>
                                    {(feedbackOrder.items || []).map((item, idx) => {
                                        const name = item.name || item.itemName || item.productName || `Item ${idx + 1}`;
                                        return (
                                            <option key={item.id || idx} value={name}>
                                                {name}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Rating</label>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                                            className={`p-1 ${feedbackData.rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                        >
                                            <Star className="h-6 w-6 fill-current" />
                                        </button>
                                    ))}
                                    <span className="text-sm text-gray-600">{feedbackData.rating} / 5</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Comments</label>
                                <textarea
                                    value={feedbackData.comments}
                                    onChange={(e) => setFeedbackData(prev => ({ ...prev, comments: e.target.value }))}
                                    rows="4"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Share your experience..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setFeedbackOrder(null)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitFeedback}
                                    disabled={submittingFeedback}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
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

// Error boundary wrapper
export default function OrdersView({ user, showToast }) {
    try {
        return <OrdersViewComponent user={user} showToast={showToast} />;
    } catch (error) {
        console.error('OrdersView error:', error);
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h3>
                    <p className="text-red-600 mb-4">{error.message || 'An unexpected error occurred'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }
}
