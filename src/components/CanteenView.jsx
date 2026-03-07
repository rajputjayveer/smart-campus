// Canteen View - Main food ordering interface
import { useState, useEffect } from 'react';
import { Store, Search, ShoppingCart, Star, Plus, Minus, Clock, CreditCard, TicketPercent, X, ShoppingBag, Receipt, Shield } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function CanteenView({ user, showToast }) {
    const { cart, addToCart: _contextAddToCart, removeFromCart, cartTotal, clearCart } = useCart();
    const [stalls, setStalls] = useState([]);
    const [selectedStall, setSelectedStall] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponData, setCouponData] = useState(null);
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [availableOffers, setAvailableOffers] = useState([]);

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

    const loadOffersForStall = async (stallId) => {
        if (!stallId) {
            setAvailableOffers([]);
            return;
        }
        try {
            const offers = await api.getAvailableOffers(stallId);
            setAvailableOffers(Array.isArray(offers) ? offers : []);
        } catch (err) {
            setAvailableOffers([]);
        }
    };

    const addToCart = (item) => {
        // Enforce the backend rule locally as well: "1 stall per cart"
        if (cart.length > 0 && cart[0].stallId !== (item.stallId || selectedStall?.id)) {
            showToast.error("You can only order from one stall at a time. Please checkout or clear your cart first.");
            return;
        }

        const completeItem = { ...item, stallId: item.stallId || selectedStall?.id };
        _contextAddToCart(completeItem, 1);
    };

    const clearCoupon = () => {
        setCouponCode('');
        setCouponData(null);
    };

    const discountAmount = couponData ? Number(couponData.discountAmount || 0) : 0;
    const finalTotal = Math.max(0, cartTotal - discountAmount);

    useEffect(() => {
        if (cart.length === 0) {
            clearCoupon();
        }
    }, [cart.length]);

    useEffect(() => {
        if (selectedStall?.id) {
            clearCoupon();
            loadOffersForStall(selectedStall.id);
        } else {
            setAvailableOffers([]);
        }
    }, [selectedStall?.id]);

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
            const data = await api.validateCoupon(couponCode.trim(), cartTotal, selectedStall?.id || null);
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
            clearCart();
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
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 h-full overflow-hidden pb-4 transition-all duration-300 ${cart.length > 0 ? 'xl:grid-cols-5 lg:grid-cols-4' : 'xl:grid-cols-4 lg:grid-cols-4'}`}>
            {/* Food Stalls Sidebar */}
            <div className="md:col-span-1 xl:col-span-1 lg:col-span-1 order-2 md:order-1 lg:order-1 h-full overflow-y-auto no-scrollbar pb-12 lg:pb-0 pr-1">
                <div className="">
                    <h2 className="text-xl lg:text-2xl font-bold mb-4 sticky top-0 bg-transparent py-2 z-10 backdrop-blur-sm">Food Stalls</h2>
                    <div className="space-y-3">
                        {stalls.map(stall => (
                            <button
                                key={stall.id}
                                onClick={() => {
                                    setSelectedStall(stall);
                                    loadMenuForStall(stall.id);
                                }}
                                className={`w-full p-3 lg:p-4 rounded-xl border-2 transition-all text-left ${selectedStall?.id === stall.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'}`}
                            >
                                <div className="flex items-center">
                                    <Store className="h-5 w-5 lg:h-6 lg:w-6 text-indigo-600 mr-2 lg:mr-3 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-gray-800 text-sm lg:text-base truncate">{stall.stallName}</h3>
                                        <p className="text-xs lg:text-sm text-gray-500 truncate">{stall.specialty}</p>
                                        <div className="flex items-center mt-1">
                                            <Star className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-500 fill-current flex-shrink-0" />
                                            <span className="text-xs lg:text-sm ml-1">{stall.rating || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className={`order-1 lg:order-2 h-full overflow-y-auto no-scrollbar pb-24 lg:pb-0 relative px-1 transition-all duration-300 ${cart.length > 0 ? 'md:col-span-2 xl:col-span-3 lg:col-span-2' : 'md:col-span-2 xl:col-span-3 lg:col-span-3'}`}>
                {selectedStall && (
                    <>
                        <div className="mb-4 lg:mb-6 sticky top-0 bg-gradient-to-b from-gray-50/95 via-gray-50/90 to-transparent pt-2 pb-4 z-10 backdrop-blur-md">
                            <h2 className="text-xl lg:text-2xl font-bold mb-1">{selectedStall.stallName}</h2>
                            <p className="text-gray-600 mb-4 text-sm lg:text-base">{selectedStall.description}</p>

                            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                <p className="text-xs font-semibold text-amber-700 mb-2">Available Offers (Shop + Admin)</p>
                                {availableOffers.length === 0 ? (
                                    <p className="text-xs text-amber-700/80">No active offers for this stall right now.</p>
                                ) : (
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                        {availableOffers.map((offer) => (
                                            <div
                                                key={offer.id}
                                                className="shrink-0 rounded-lg border border-amber-300 bg-white px-2 lg:px-3 py-2 min-w-[180px] lg:min-w-[200px]"
                                            >
                                                <p className="text-xs lg:text-sm font-bold text-amber-800">{offer.code}</p>
                                                <p className="text-[10px] lg:text-xs text-gray-700">
                                                    {offer.discountType === 'percentage'
                                                        ? `${offer.discountValue}% OFF`
                                                        : `INR ${offer.discountValue} OFF`}
                                                </p>
                                                <p className="text-[10px] lg:text-[11px] text-gray-500">
                                                    Min order: INR {Number(offer.minOrderAmount || 0).toFixed(0)}
                                                </p>
                                                <p className="text-[10px] lg:text-[11px] text-gray-500">
                                                    {offer.stallId ? 'Shop Offer' : 'Admin Offer'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search menu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 lg:pl-10 pr-4 py-2 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base"
                                />
                            </div>
                        </div>

                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 transition-all duration-300 ${cart.length > 0 ? 'xl:grid-cols-3' : 'xl:grid-cols-4 lg:grid-cols-3'}`}>
                            {filteredItems.map((item, index) => (
                                <div key={item.id || `item-${index}`} className="bg-white rounded-xl shadow-md p-3 lg:p-4 hover:shadow-lg transition-all border border-gray-100">
                                    {item.image && (
                                        <img src={item.image} alt={item.name || 'Menu item'} className="w-full h-24 lg:h-32 object-cover rounded-lg mb-3" />
                                    )}
                                    <h3 className="font-bold text-base lg:text-lg line-clamp-2">{item.name || 'Unnamed Item'}</h3>
                                    <p className="text-xs lg:text-sm text-gray-600 mb-2 line-clamp-2">{item.description || 'No description available'}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg lg:text-xl font-bold text-indigo-600">INR {item.price || 0}</span>
                                        <button onClick={() => addToCart(item)} className="px-3 lg:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center text-sm lg:text-base transition-colors">
                                            <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                                            Add
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredItems.length === 0 && (
                            <div className="text-center py-8 lg:py-12 text-gray-500">
                                <div className="text-4xl mb-4">🔍</div>
                                <p className="text-sm lg:text-base">No items found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Cart Sidebar - Conditionally Rendered */}
            {cart.length > 0 && (
                <div className="md:col-span-1 xl:col-span-1 lg:col-span-1 order-3 h-full overflow-hidden hidden md:block rise-in">
                    <div className="bg-white rounded-xl shadow-lg p-4 lg:p-5 flex flex-col h-full border border-gray-100">
                        <div className="flex items-center mb-1 flex-shrink-0">
                            <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6 text-indigo-600 mr-2" />
                            <h2 className="text-lg lg:text-xl font-bold">Cart ({cart.length})</h2>
                        </div>
                        {cart.length > 0 && (() => {
                            const cartStallId = cart[0]?.stallId;
                            const cartStall = stalls.find(s => s.id === cartStallId);
                            const stallLabel = cartStall?.stallName || cart[0]?.stallName;
                            return stallLabel ? (
                                <div className="flex items-center gap-1.5 mb-3 px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <Store className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                                    <p className="text-xs font-semibold text-indigo-700 truncate">{stallLabel}</p>
                                </div>
                            ) : null;
                        })()}

                        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                            {cart.map((item, index) => (
                                <div key={item.id || `cart-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-xs lg:text-sm truncate">{item.name || 'Unnamed Item'}</p>
                                        <p className="text-xs text-gray-500">INR {item.price || 0} each</p>
                                    </div>
                                    <div className="flex items-center space-x-1 lg:space-x-2 ml-2">
                                        <button onClick={() => removeFromCart(item.id)} className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors">
                                            <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
                                        </button>
                                        <span className="font-bold text-sm lg:text-base min-w-[20px] text-center">{item.quantity}</span>
                                        <button onClick={() => addToCart(item)} className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors">
                                            <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {cart.length === 0 ? (
                            <div className="text-center py-6 lg:py-8">
                                <div className="text-3xl mb-2">🛒</div>
                                <p className="text-gray-400 text-sm lg:text-base">Your cart is empty</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3 mb-4 flex-shrink-0">
                                    <div>
                                        <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                                            <Clock className="h-3 w-3 lg:h-4 lg:w-4 inline mr-1" />
                                            Pickup Time
                                        </label>
                                        <select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                            <option value="">ASAP (Ready Now)</option>
                                            <option value="15 min">15 minutes</option>
                                            <option value="30 min">30 minutes</option>
                                            <option value="45 min">45 minutes</option>
                                            <option value="1 hour">1 hour</option>
                                        </select>
                                    </div>

                                    <div className="border-t pt-3 lg:pt-4">
                                        <div className="flex justify-between text-xs lg:text-sm text-gray-600 mb-1">
                                            <span>Subtotal:</span>
                                            <span>INR {cartTotal.toFixed(2)}</span>
                                        </div>
                                        {couponData && (
                                            <div className="flex justify-between text-xs lg:text-sm text-green-600 mb-1">
                                                <span>Discount ({couponData.code}):</span>
                                                <span>-INR {discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-base lg:text-lg pt-2 border-t border-gray-200">
                                            <span>Total:</span>
                                            <span className="text-indigo-600">INR {finalTotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                                            <TicketPercent className="h-3 w-3 lg:h-4 lg:w-4 inline mr-1" />
                                            Coupon Code
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                className="flex-1 min-w-0 px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg"
                                                placeholder="Enter coupon"
                                            />
                                            <button type="button" onClick={applyCoupon} disabled={applyingCoupon} className="px-3 lg:px-4 py-2 text-xs lg:text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50 transition-colors whitespace-nowrap font-semibold">
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
                                </div>
                            </>
                        )}

                        {cart.length > 0 && (
                            <button onClick={placeOrder} disabled={processingPayment} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm lg:text-base flex-shrink-0 mt-4">
                                {processingPayment ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-2 border-white border-t-transparent mr-2"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                                        Pay & Place Order
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {showPayment && (
                <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-gray-900/70 to-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-hidden">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                        {/* Header - Fixed height */}
                        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 sm:p-6 text-white flex-shrink-0 rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xl sm:text-2xl font-bold truncate">Secure Payment</h3>
                                    <p className="text-indigo-100 text-sm">Complete your order securely</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowPayment(false);
                                        setProcessingPayment(false);
                                    }}
                                    className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors ml-3 flex-shrink-0"
                                >
                                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                            {/* Order Summary Card */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-5 mb-4 border border-gray-200">
                                <div className="flex items-center mb-3">
                                    <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 mr-2 flex-shrink-0" />
                                    <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Order Summary</h4>
                                </div>
                                <div className="space-y-2 max-h-24 overflow-y-auto">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <span className="font-semibold text-indigo-600 ml-2 text-sm whitespace-nowrap">
                                                INR {(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pickup Time */}
                            <div className="bg-blue-50 rounded-xl p-3 sm:p-4 mb-4 border border-blue-200">
                                <div className="flex items-center mb-1">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2 flex-shrink-0" />
                                    <span className="font-semibold text-blue-800 text-sm sm:text-base">Pickup Time</span>
                                </div>
                                <p className="text-blue-700 font-medium text-sm">{pickupTime || 'ASAP (Ready Now)'}</p>
                            </div>

                            {/* Payment Breakdown */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
                                <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base flex items-center">
                                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mr-2 flex-shrink-0" />
                                    Payment Details
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">INR {cartTotal.toFixed(2)}</span>
                                    </div>
                                    {couponData && (
                                        <div className="flex justify-between items-center text-sm text-green-600">
                                            <span>Discount ({couponData.code})</span>
                                            <span className="font-medium">-INR {discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-3 mt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-gray-800">Total Amount</span>
                                            <span className="text-xl font-bold text-indigo-600">INR {finalTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security Notice */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                                <div className="flex items-center mb-1">
                                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2 flex-shrink-0" />
                                    <span className="font-semibold text-green-800 text-sm sm:text-base">Secure Payment</span>
                                </div>
                                <p className="text-green-700 text-xs sm:text-sm">Your payment is protected by Razorpay's security standards</p>
                            </div>
                        </div>

                        {/* Footer Actions - Fixed height */}
                        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex-shrink-0 rounded-b-3xl">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => {
                                        setShowPayment(false);
                                        setProcessingPayment(false);
                                    }}
                                    className="flex-1 px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-semibold text-sm sm:text-base text-gray-700"
                                >
                                    Cancel Order
                                </button>
                                <button
                                    onClick={handlePayment}
                                    disabled={processingPayment}
                                    className="flex-1 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
                                >
                                    {processingPayment ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Pay INR {finalTotal.toFixed(2)}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
