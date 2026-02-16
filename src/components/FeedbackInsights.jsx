// Feedback Insights - AI analysis from all user feedback
import { useState } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';
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
        } catch (err) {
            showToast?.error?.('Failed to load feedback insights');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Feedback Insights</h2>
                    <p className="text-sm text-gray-500">General analysis from all users</p>
                </div>
                <button
                    onClick={loadInsights}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Analyzing...' : 'Generate Analysis'}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h3 className="text-lg font-bold text-gray-800">AI Summary</h3>
                </div>
                {insights ? (
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{insights}</pre>
                ) : (
                    <p className="text-sm text-gray-500">Click “Generate Analysis” to see insights.</p>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Feedback</h3>
                {recent.length === 0 ? (
                    <p className="text-sm text-gray-500">No feedback data loaded.</p>
                ) : (
                    <div className="space-y-3">
                        {recent.slice(0, 10).map((row, idx) => (
                            <div key={idx} className="border rounded-lg p-3">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{row.stallName || 'Stall'}</span>
                                    <span>{row.rating ? `${row.rating}/5` : 'N/A'}</span>
                                </div>
                                <p className="text-sm text-gray-700 mt-2">{row.comments}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
