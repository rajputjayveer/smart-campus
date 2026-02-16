// Feedback View - Users can submit feedback and get AI suggestions
import { useEffect, useState } from 'react';
import { Star, Send, Lightbulb } from 'lucide-react';
import api from '../services/api';

const stars = [1, 2, 3, 4, 5];

export default function FeedbackView({ user, showToast }) {
    const [stalls, setStalls] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        stall: '',
        item: '',
        rating: 5,
        comments: ''
    });

    useEffect(() => {
        const init = async () => {
            try {
                const stallsData = await api.getAllStalls();
                setStalls(Array.isArray(stallsData) ? stallsData : []);
                if (Array.isArray(stallsData) && stallsData.length > 0) {
                    setFormData(prev => ({ ...prev, stall: stallsData[0].stallName }));
                    const items = await api.getMenuItems(stallsData[0].id);
                    setMenuItems(Array.isArray(items) ? items : []);
                }
            } catch (err) {
                showToast?.error?.('Failed to load stalls');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleStallChange = async (stallName) => {
        setFormData(prev => ({ ...prev, stall: stallName, item: '' }));
        const stall = stalls.find(s => s.stallName === stallName);
        if (stall) {
            const items = await api.getMenuItems(stall.id);
            setMenuItems(Array.isArray(items) ? items : []);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.stall || !formData.comments) {
            showToast?.error?.('Please select a stall and write feedback');
            return;
        }

        setSubmitting(true);
        setSuggestions([]);

        try {
            await api.createFeedback({
                stall: formData.stall,
                item: formData.item || 'General',
                rating: formData.rating,
                comments: formData.comments,
                userId: user?.id || null
            });

            showToast?.success?.('Feedback submitted');

            const suggestionResponse = await api.getFeedbackSuggestions({
                stall: formData.stall,
                item: formData.item || 'General',
                rating: formData.rating,
                comments: formData.comments
            });

            const list = suggestionResponse?.suggestions || suggestionResponse?.data?.suggestions || [];
            setSuggestions(Array.isArray(list) ? list : []);

            setFormData(prev => ({ ...prev, comments: '' }));
        } catch (err) {
            showToast?.error?.('Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Give Feedback</h2>
                <p className="text-sm text-gray-500 mb-6">Help us improve campus food experience.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Stall</label>
                            <select
                                value={formData.stall}
                                onChange={(e) => handleStallChange(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                {stalls.map(stall => (
                                    <option key={stall.id} value={stall.stallName}>{stall.stallName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Item (optional)</label>
                            <select
                                value={formData.item}
                                onChange={(e) => setFormData(prev => ({ ...prev, item: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">General</option>
                                {menuItems.map(item => (
                                    <option key={item.id} value={item.name || item.itemName}>
                                        {item.name || item.itemName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Rating</label>
                        <div className="flex items-center gap-2">
                            {stars.map(star => (
                                <button
                                    type="button"
                                    key={star}
                                    onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                    className={`p-1 ${formData.rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                >
                                    <Star className="h-6 w-6 fill-current" />
                                </button>
                            ))}
                            <span className="text-sm text-gray-600">{formData.rating} / 5</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Comments</label>
                        <textarea
                            value={formData.comments}
                            onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                            rows="4"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Share your experience..."
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h3 className="text-lg font-bold text-gray-800">AI Suggestions</h3>
                </div>
                {suggestions.length === 0 ? (
                    <p className="text-sm text-gray-500">Submit feedback to get suggestions.</p>
                ) : (
                    <ul className="space-y-2 text-sm text-gray-700">
                        {suggestions.map((s, idx) => (
                            <li key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                {s}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
