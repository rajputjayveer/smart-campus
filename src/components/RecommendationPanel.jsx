import { useState, useEffect, useRef } from 'react';
import { Sparkles, Plus, Loader2, Leaf, Store, Sun, CloudRain, Snowflake } from 'lucide-react';
import api from '../services/api';

export default function RecommendationPanel({ cart, stallId, onAddToCart, showToast }) {
    const [recommendations, setRecommendations] = useState([]);
    const [reasoning, setReasoning] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const lastCartKey = useRef('');

    // Derive added state directly from cart prop so it updates when items are removed
    const cartItemIds = new Set((cart || []).map(i => String(i.id)));

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const cartKey = cart?.length > 0 ? cart.map(i => `${i.id}:${i.quantity}`).sort().join(',') : 'empty';
        const globalKey = `${cartKey}:${stallId || 'global'}`;
        
        if (globalKey === lastCartKey.current) return;
        lastCartKey.current = globalKey;

        const timer = setTimeout(() => {
            fetchRecommendations();
        }, 600);

        return () => clearTimeout(timer);
    }, [cart, stallId]);

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(false);
        try {
            const cartItems = cart.map(i => ({ id: i.id, name: i.name, price: i.price }));
            const data = await api.getRecommendations(cartItems, stallId);
            setRecommendations(data.recommendations || []);
            setReasoning(data.reasoning || '');
        } catch {
            setError(true);
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = (item) => {
        // Enforce the "one stall per order" rule
        // Allow adding if cart is empty (it will initialize the cart with this stall)
        if (cart.length > 0 && !item.sameStall) {
            showToast?.error?.("You already have items from another stall. Clear your cart first to order from " + (item.stallName || 'this stall') + ".");
            return;
        }
        onAddToCart(item);
    };

    // Always show if not loading or error
    // if (cart.length === 0) return null;

    const getSeasonInfo = () => {
        const month = currentTime.getMonth();
        const hour = currentTime.getHours();
        
        let season = { name: 'Summer', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' };
        if (month >= 6 && month <= 8) season = { name: 'Monsoon', icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-50' };
        else if (month >= 9 || month <= 1) season = { name: 'Winter', icon: Snowflake, color: 'text-sky-500', bg: 'bg-sky-50' };

        let timeSlot = 'Morning';
        if (hour >= 11 && hour < 15) timeSlot = 'Lunchtime';
        else if (hour >= 15 && hour < 18) timeSlot = 'Snack time';
        else if (hour >= 18) timeSlot = 'Evening';

        return { season, timeSlot };
    };

    const { season: seasonInfo, timeSlot } = getSeasonInfo();

    const ALL_DUMMY_DATA = [
        { id: 'd1', name: 'Mango Lassi', price: 60, reason: `Perfect chilled drink for this ${seasonInfo.name} ${timeSlot}!`, isVeg: 1, stallId: 1, stallName: 'Jugaadi Spot', season: 'Summer', sameStall: false, popular: true },
        { id: 'd2', name: 'Hot Tomato Soup', price: 55, reason: `Warm up your ${timeSlot} with our signature soup.`, isVeg: 1, stallId: 1, stallName: 'Jugaadi Spot', season: 'Winter', sameStall: false, popular: true },
        { id: 'd3', name: 'Vada Pav', price: 25, reason: 'The classic campus snack. Always a favorite!', isVeg: 1, stallId: 1, stallName: 'Jugaadi Spot', season: 'All', sameStall: false, popular: true },
        { id: 'd4', name: 'Samosa Plate', price: 30, reason: `Fresh & crunchy spice for this ${timeSlot}!`, isVeg: 1, stallId: 1, stallName: 'Jugaadi Spot', season: 'Monsoon', sameStall: false, popular: true },
        { id: 'd5', name: 'Watermelon Juice', price: 50, reason: 'Stay hydrated with fresh seasonal fruit!', isVeg: 1, stallId: 1, stallName: 'Jugaadi Spot', season: 'Summer', sameStall: false, popular: true },
        { id: 'd6', name: 'Ginger Tea', price: 20, reason: 'Freshly brewed hot tea to refresh your mood.', isVeg: 1, stallId: 1, stallName: 'Jugaadi Spot', season: 'Winter', sameStall: false, popular: true },
        { id: 'd7', name: 'Shake Combo', price: 120, reason: 'A heavy treat for your summer cravings!', isVeg: 1, stallId: 3, stallName: 'MS Food', season: 'Summer', sameStall: false, popular: true },
        { id: 'd8', name: 'Cold coffee', price: 45, reason: 'A refreshing pick-me-up for any time.', isVeg: 1, stallId: 4, stallName: 'Shambhu\'s coffee bar', season: 'All', sameStall: false, popular: true }
    ];

    const isGlobal = !stallId;

    // Filter dummy data strictly by current season + "All"
    const DUMMY_DISCOVERY = ALL_DUMMY_DATA.filter(item => 
        (item.season === seasonInfo.name || item.season === 'All') &&
        (!stallId || String(item.stallId) !== String(stallId))
    );

    if (loading) {
        return (
            <div className="mb-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-shimmer" />
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                        <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                    </div>
                    <div>
                        <div className="h-5 w-48 bg-gray-100 rounded-lg animate-pulse mb-2" />
                        <div className="h-3 w-64 bg-gray-50 rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    const displayItems = recommendations.length > 0 ? recommendations : (isGlobal ? DUMMY_DISCOVERY : []);
    const displayReasoning = reasoning || (isGlobal ? `It's a beautiful ${seasonInfo.name} ${timeSlot}! Check out these top picks around campus.` : '');

    if (displayItems.length === 0) return null;

    try {
        return (
            <div className={`mb-8 p-5 rounded-[2.5rem] border shadow-2xl shadow-indigo-200/20 transition-all duration-700 relative ${
            isGlobal 
                ? 'bg-gradient-to-br from-indigo-50 via-white to-sky-50 border-indigo-100/50' 
                : 'bg-gradient-to-br from-purple-50 via-white to-pink-50 border-purple-100/50'
        }`}>
            {/* Background decorative elements - contained within the panel */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-10 -mt-10 rounded-full pointer-events-none ${isGlobal ? 'bg-blue-400' : 'bg-pink-400'}`} />
            <div className={`absolute bottom-0 left-0 w-32 h-32 blur-3xl opacity-20 -ml-10 -mb-10 rounded-full pointer-events-none ${isGlobal ? 'bg-indigo-400' : 'bg-purple-400'}`} />
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl shadow-sm ${
                        isGlobal ? 'bg-gradient-to-br from-indigo-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                    }`}>
                        {isGlobal ? <Sun className="h-3.5 w-3.5 text-white" /> : <Sparkles className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <div>
                        <h3 className={`text-sm font-black leading-none ${isGlobal ? 'text-indigo-900' : 'text-purple-900'}`}>
                            {isGlobal ? "Campus Favorites • Today's Discovery" : "Tastes Great With This"}
                        </h3>
                        <p className={`text-[10px] font-medium mt-0.5 ${isGlobal ? 'text-indigo-500' : 'text-purple-500'}`}>
                            {isGlobal ? 'Curated from all stalls for you' : 'Handpicked complements for your cart'}
                        </p>
                    </div>
                </div>
                {isGlobal && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Live</span>
                )}
            </div>

            {displayReasoning && (
                <div className={`flex items-start gap-3 mb-5 ml-1 px-4 py-3 bg-white/60 backdrop-blur-sm rounded-2xl border ${isGlobal ? 'border-indigo-100/50' : 'border-purple-100/50'} shadow-sm`}>
                    <div className={`p-1 mt-0.5 rounded-lg ${isGlobal ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
                        <Sparkles className="h-3 w-3" />
                    </div>
                    <p className={`text-sm leading-relaxed font-semibold ${isGlobal ? 'text-indigo-800' : 'text-purple-800'}`}>
                        {displayReasoning}
                    </p>
                </div>
            )}

            <div className={`flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar ${isGlobal ? 'snap-x' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'}`}>
                {displayItems.map((item) => {
                    const isAdded = cartItemIds.has(String(item.id));
                    const isCrossStall = item.sameStall === false;
                    return (
                        <div
                            key={item.id}
                            className={`flex items-center gap-3 bg-white/70 backdrop-blur-md rounded-2xl p-3 border transition-colors duration-200 hover:shadow-md flex-shrink-0 ${
                                isGlobal ? 'w-[280px] snap-center' : ''
                            } ${
                                isCrossStall
                                    ? 'border-amber-200/50 hover:border-amber-300 bg-amber-50/10'
                                    : 'border-purple-100/50 hover:border-purple-300 bg-purple-50/10'
                            }`}
                        >
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm"
                                />
                            ) : (
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                                    isCrossStall
                                        ? 'bg-gradient-to-br from-amber-100 to-orange-200'
                                        : 'bg-gradient-to-br from-purple-100 to-indigo-200'
                                }`}>
                                    <span className="text-2xl">{item.isVeg ? '🥬' : '🍗'}</span>
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                                        {item.isVeg === 1 && <Leaf className="h-3 w-3 text-green-500 flex-shrink-0" />}
                                    </div>
                                    <span className="text-xs font-black text-indigo-600">₹{item.price}</span>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                    {isCrossStall && item.stallName && (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-bold uppercase border border-amber-100">
                                            <Store className="h-2 w-2" />
                                            {item.stallName}
                                        </div>
                                    )}
                                    {item.season && item.season !== 'All' && (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded-md text-[9px] font-bold uppercase border border-sky-100">
                                            {item.season === 'Summer' && <Sun className="h-2 w-2" />}
                                            {item.season === 'Monsoon' && <CloudRain className="h-2 w-2" />}
                                            {item.season === 'Winter' && <Snowflake className="h-2 w-2" />}
                                            {item.season}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] text-gray-500 italic truncate flex-1 leading-tight">{item.reason}</p>
                                    <button
                                        onClick={() => handleAdd(item)}
                                        className={`h-7 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-90 ${
                                            isAdded
                                                ? 'bg-indigo-100 text-indigo-600 cursor-default'
                                                : isCrossStall
                                                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                        }`}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        {isAdded ? 'Added' : 'Add'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        );
    } catch (err) {
        console.error("RecommendationPanel render error:", err);
        return null; // Fail gracefully to avoid white screen
    }
}
