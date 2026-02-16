// Canteen View - Main food ordering interface
import { useState, useEffect } from 'react';
import { Store, Search, ShoppingCart, Star, Plus, Minus, Clock, CreditCard, TicketPercent } from 'lucide-react';
import api from '../services/api';

export default function CanteenView({ user, showToast }) {
    const [stalls, setStalls] = useState([]);
    const [selectedStall, setSelectedStall] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponData, setCouponData] = useState(null);
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    useEffect(() => {
        loadStalls();
    }, []);

    const loadStalls = async () => {
        try {
            const data = await api.getAllStalls();
            const stallsArray = Array.isArray(data) ? data : [];
            setStalls(stallsArray);
            if (stallsArray.length > 0) {
                setSelectedStall(stallsArray[0]);
                loadMenuForStall(stallsArray[0].id);
            }
        } catch (err) {
            showToast.error('Failed to load stalls');
            setStalls([]);
        } finally {
            setLoading(false);
        }
    };

    const loadMenuForStall = async (stallId) => {
        try {
            const items = await api.getMenuItems(stallId);
            setMenuItems(Array.isArray(items) ? items : []);
        } catch (err) {
            showToast.error('Failed to load menu');
            setMenuItems([]);
        }
    };

    const addToCart = (item) => {
        const existing = cart.find(i => i.id === item.id);
        if (existing) {
            setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
        showToast.success(`Added ${item.name || 'item'} to cart`);
    };

    const removeFromCart = (itemId) => {
        const existing = cart.find(i => i.id === itemId);
        if (existing.quantity > 1) {
            setCart(cart.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
        } else {
            setCart(cart.filter(i => i.id !== itemId));
        }
    };

    const clearCoupon = () => {
        setCouponCode('');
        setCouponData(null);
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = couponData ? Number(couponData.discountAmount || 0) : 0;
    const finalTotal = Math.max(0, cartTotal - discountAmount);

    useEffect(() => {
        if (cart.length === 0) {
            clearCoupon();
        }
    }, [cart.length]);

    const applyCoupon = async () => {
        if (!couponCode.trim()) {
            showToast.error('Please enter a coupon code');
            return;
        }
        if (cart.length === 0) {
            showToast.error('Add items to cart first');
            return;
        }

        setApplyingCoupon(true);
        try {
            const data = await api.validateCoupon(couponCode.trim(), cartTotal);
            setCouponData(data);
            setCouponCode((data.code || couponCode).toUpperCase());
            showToast.success(`Coupon applied! You saved INR ${Number(data.discountAmount || 0).toFixed(2)}`);
        } catch (err) {
            setCouponData(null);
            showToast.error(err.message || 'Invalid coupon');
        } finally {
            setApplyingCoupon(false);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve();
            script.onerror = () => {
                showToast.error('Failed to load payment gateway');
                resolve();
            };
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (!user) {
            showToast.error('Please login to place an order');
            return;
        }
        if (cart.length === 0) {
            showToast.error('Cart is empty');
            return;
        }

        setProcessingPayment(true);
        try {
            await loadRazorpayScript();

            const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID ||
                import.meta.env.VITE_RAZORPAY_KEY ||
                import.meta.env.RAZORPAY_KEY_ID;

            if (!razorpayKey || razorpayKey === 'your_razorpay_key_id' || razorpayKey.trim() === '') {
                showToast.error('Payment gateway not configured. Please check your .env file and restart the server.');
                setProcessingPayment(false);
                return;
            }

            const options = {
                key: razorpayKey,
                amount: finalTotal * 100,
                currency: 'INR',
                name: 'SouEats',
                description: `Order from ${selectedStall?.stallName || 'Canteen'}`,
                image: '/logo.png',
                handler: async function (response) {
                    await createOrderAfterPayment(response);
                },
                prefill: {
                    name: user.name || 'Customer',
                    email: user.email || '',
                    contact: user.phone || '9999999999',
                },
                theme: {
                    color: '#4F46E5',
                },
                modal: {
                    ondismiss: function () {
                        setProcessingPayment(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            showToast.error('Failed to initiate payment');
            setProcessingPayment(false);
        }
    };

    const createOrderAfterPayment = async (paymentResponse) => {
        try {
            const orderItems = cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                stallId: selectedStall?.id,
                image: item.image,
                status: 'pending'
            }));

            await api.createOrder({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                items: orderItems,
                total: finalTotal,
                originalTotal: cartTotal,
                discountAmount,
                couponCode: couponData?.code || null,
                pickupTime: pickupTime || null,
                paymentId: paymentResponse.razorpay_payment_id,
                paymentOrderId: paymentResponse.razorpay_order_id,
                paymentSignature: paymentResponse.razorpay_signature
            });

            showToast.success('Order placed successfully!');
            setCart([]);
            setPickupTime('');
            clearCoupon();
            setShowPayment(false);
            setProcessingPayment(false);
        } catch (err) {
            showToast.error('Payment successful but failed to create order. Please contact support.');
            setProcessingPayment(false);
        }
    };

    const placeOrder = () => {
        if (!user) {
            showToast.error('Please login to place an order');
            return;
        }
        if (cart.length === 0) {
            showToast.error('Cart is empty');
            return;
        }
        setShowPayment(true);
    };

    const filteredItems = menuItems.filter(item => {
        if (!item) return false;
        const query = searchQuery.toLowerCase();
        const name = (item.name || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return name.includes(query) || description.includes(query);
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold mb-4">Food Stalls</h2>
                <div className="space-y-3">
                    {stalls.map(stall => (
                        <button
                            key={stall.id}
                            onClick={() => {
                                setSelectedStall(stall);
                                loadMenuForStall(stall.id);
                            }}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedStall?.id === stall.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                        >
                            <div className="flex items-center">
                                <Store className="h-6 w-6 text-indigo-600 mr-3" />
                                <div>
                                    <h3 className="font-bold text-gray-800">{stall.stallName}</h3>
                                    <p className="text-sm text-gray-500">{stall.specialty}</p>
                                    <div className="flex items-center mt-1">
                                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                        <span className="text-sm ml-1">{stall.rating || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-2">
                {selectedStall && (
                    <>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">{selectedStall.stallName}</h2>
                            <p className="text-gray-600 mb-4">{selectedStall.description}</p>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search menu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredItems.map((item, index) => (
                                <div key={item.id || `item-${index}`} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
                                    {item.image && (
                                        <img src={item.image} alt={item.name || 'Menu item'} className="w-full h-32 object-cover rounded-lg mb-3" />
                                    )}
                                    <h3 className="font-bold text-lg">{item.name || 'Unnamed Item'}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{item.description || 'No description available'}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-indigo-600">INR {item.price || 0}</span>
                                        <button onClick={() => addToCart(item)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredItems.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No items found matching "{searchQuery}"
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                    <div className="flex items-center mb-4">
                        <ShoppingCart className="h-6 w-6 text-indigo-600 mr-2" />
                        <h2 className="text-xl font-bold">Cart ({cart.length})</h2>
                    </div>

                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                        {cart.map((item, index) => (
                            <div key={item.id || `cart-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{item.name || 'Unnamed Item'}</p>
                                    <p className="text-xs text-gray-500">INR {item.price || 0} each</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => removeFromCart(item.id)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="font-bold">{item.quantity}</span>
                                    <button onClick={() => addToCart(item)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {cart.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Your cart is empty</p>
                    ) : (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Clock className="h-4 w-4 inline mr-1" />
                                    Pickup Time
                                </label>
                                <select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">ASAP (Ready Now)</option>
                                    <option value="15 min">15 minutes</option>
                                    <option value="30 min">30 minutes</option>
                                    <option value="45 min">45 minutes</option>
                                    <option value="1 hour">1 hour</option>
                                </select>
                            </div>

                            <div className="border-t pt-4 mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Subtotal:</span>
                                    <span>INR {cartTotal.toFixed(2)}</span>
                                </div>
                                {couponData && (
                                    <div className="flex justify-between text-sm text-green-600 mb-1">
                                        <span>Discount ({couponData.code}):</span>
                                        <span>-INR {discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span className="text-indigo-600">INR {finalTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <TicketPercent className="h-4 w-4 inline mr-1" />
                                    Coupon Code
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Enter coupon"
                                    />
                                    <button type="button" onClick={applyCoupon} disabled={applyingCoupon} className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50">
                                        {applyingCoupon ? '...' : 'Apply'}
                                    </button>
                                </div>
                                {couponData && (
                                    <div className="mt-2 flex items-center justify-between text-xs">
                                        <span className="text-green-700">Applied: {couponData.code}</span>
                                        <button type="button" onClick={clearCoupon} className="text-red-600 hover:underline">
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button onClick={placeOrder} disabled={processingPayment} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                                {processingPayment ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-5 w-5 mr-2" />
                                        Pay & Place Order
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {showPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-2xl font-bold mb-4">Confirm Order</h3>

                        <div className="mb-4">
                            <p className="text-gray-600 mb-2">Order Summary:</p>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>INR {(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-1">Pickup Time:</p>
                            <p className="font-semibold">{pickupTime || 'ASAP (Ready Now)'}</p>
                        </div>

                        <div className="mb-6 border-t pt-4 space-y-2">
                            <div className="flex justify-between items-center text-sm text-gray-600">
                                <span>Subtotal:</span>
                                <span>INR {cartTotal.toFixed(2)}</span>
                            </div>
                            {couponData && (
                                <div className="flex justify-between items-center text-sm text-green-700">
                                    <span>Discount ({couponData.code}):</span>
                                    <span>-INR {discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-xl font-bold">Total:</span>
                                <span className="text-2xl font-bold text-indigo-600">INR {finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowPayment(false);
                                    setProcessingPayment(false);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button onClick={handlePayment} disabled={processingPayment} className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                                {processingPayment ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Pay with Razorpay
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
