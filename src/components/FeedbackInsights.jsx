import { useState } from 'react';
import { Lightbulb, RefreshCw, Star, MessageSquare, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function FeedbackInsights({ showToast }) {
    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState('');
    const [recent, setRecent] = useState([]);

    const loadInsights = async () => {
        try {
            setLoading(true);
            const data = await api.getFeedbackAnalysis();
            const result = data?.data || data;
            setInsights(result?.insights || '');
            setRecent(Array.isArray(result?.recent) ? result.recent : []);
        } catch {
            showToast?.error?.('Failed to load feedback insights');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Feedback Insights</h2>
                    <p className="text-sm text-gray-400">AI-powered analysis of user feedback</p>
                </div>
                <button onClick={loadInsights} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 transition-all active:scale-95 disabled:opacity-60">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Analyzing...' : 'Generate Analysis'}
                </button>
            </div>

            {/* AI Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-white" />
                    <h3 className="text-sm font-bold text-white">AI Summary</h3>
                </div>
                <div className="p-5">
                    {loading ? (
                        <div className="space-y-2"><div className="skeleton h-4 rounded-lg w-full" /><div className="skeleton h-4 rounded-lg w-3/4" /><div className="skeleton h-4 rounded-lg w-5/6" /></div>
                    ) : insights ? (
                        <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed bg-transparent p-0 m-0 border-0">{insights}</pre>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-14 h-14 mx-auto mb-3 bg-amber-50 rounded-2xl flex items-center justify-center">
                                <Lightbulb className="h-7 w-7 text-amber-400" />
                            </div>
                            <p className="text-sm text-gray-400 font-medium">Click "Generate Analysis" to get AI insights</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Feedback */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-800">Recent Feedback</h3>
                    {recent.length > 0 && <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{recent.length}</span>}
                </div>
                <div className="p-4">
                    {recent.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-2xl flex items-center justify-center"><MessageSquare className="h-6 w-6 text-gray-300" /></div>
                            <p className="text-sm text-gray-400">No feedback data loaded.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recent.slice(0, 10).map((row, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-semibold text-gray-500">{row.stallName || 'Stall'}</span>
                                        <div className="flex items-center gap-0.5">
                                            {row.rating && [...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-3 w-3 ${i < row.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                            ))}
                                            {!row.rating && <span className="text-[11px] text-gray-400">No rating</span>}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700">{row.comments}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
