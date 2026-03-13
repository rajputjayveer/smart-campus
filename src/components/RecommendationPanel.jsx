import { useState, useEffect, useRef } from 'react';
import { Sparkles, Plus, Loader2, Check, Leaf, Store } from 'lucide-react';
import api from '../services/api';

export default function RecommendationPanel({ cart, stallId, onAddToCart, showToast }) {
    const [recommendations, setRecommendations] = useState([]);
    const [reasoning, setReasoning] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [addedIds, setAddedIds] = useState(new Set());
    const lastCartKey = useRef('');

    useEffect(() => {
        if (!cart || cart.length === 0) {
            setRecommendations([]);
            setReasoning('');
            setAddedIds(new Set());
            lastCartKey.current = '';
            return;
        }

        const cartKey = cart.map(i => `${i.id}:${i.quantity}`).sort().join(',');
        if (cartKey === lastCartKey.current) return;
        lastCartKey.current = cartKey;

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
        if (!item.sameStall) {
            showToast?.error?.("This item is from a different stall. Clear your cart first to order from " + (item.stallName || 'another stall') + ".");
            return;
        }
        onAddToCart(item);
        setAddedIds(prev => new Set(prev).add(String(item.id)));
    };

    if (cart.length === 0) return null;

    if (loading) {
        return (
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 rounded-2xl border border-purple-200/50">
                <div className="flex items-center gap-2.5 text-purple-700">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <span className="text-sm font-medium">AI is finding recommendations for you...</span>
                </div>
            </div>
        );
    }

    if (error || recommendations.length === 0) return null;

    return (
        <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-2xl border border-purple-200/50 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-purple-800">You might also like...</h3>
            </div>

            {reasoning && (
                <p className="text-xs text-purple-600/80 mb-3 ml-[34px] leading-relaxed italic">{reasoning}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                {recommendations.map((item) => {
                    const isAdded = addedIds.has(String(item.id));
                    const isCrossStall = item.sameStall === false;
                    return (
                        <div
                            key={item.id}
                            className={`flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 border transition-all hover:shadow-md ${
                                isCrossStall
                                    ? 'border-amber-200/80 hover:border-amber-300'
                                    : 'border-purple-100 hover:border-purple-300'
                            }`}
                        >
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    isCrossStall
                                        ? 'bg-gradient-to-br from-amber-50 to-orange-100'
                                        : 'bg-gradient-to-br from-purple-100 to-indigo-100'
                                }`}>
                                    <span className="text-lg">{item.isVeg ? '🥬' : '🍗'}</span>
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                                    {item.isVeg === 1 && <Leaf className="h-3 w-3 text-green-500 flex-shrink-0" />}
                                </div>
                                {isCrossStall && item.stallName && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Store className="h-2.5 w-2.5 text-amber-500" />
                                        <span className="text-[10px] text-amber-600 font-medium truncate">{item.stallName}</span>
                                    </div>
                                )}
                                <p className="text-[11px] text-purple-500/80 truncate mt-0.5">{item.reason}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs font-bold text-indigo-600">INR {item.price}</span>
                                    <button
                                        onClick={() => handleAdd(item)}
                                        disabled={isAdded}
                                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                                            isAdded
                                                ? 'bg-green-100 text-green-600 cursor-default'
                                                : isCrossStall
                                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-95'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                                        }`}
                                    >
                                        {isAdded ? (
                                            <><Check className="h-3 w-3" /> Added</>
                                        ) : (
                                            <><Plus className="h-3 w-3" /> Add</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
