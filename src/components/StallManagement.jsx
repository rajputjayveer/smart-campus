import { useState, useEffect } from 'react';
import { Store, Plus, Trash2, MapPin, CheckCircle, X } from 'lucide-react';
import api from '../services/api';

export default function StallManagement({ showToast }) {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ stallName: '', description: '', specialty: '', location: '' });

    useEffect(() => { loadStalls(); }, []);

    const loadStalls = async () => {
        try { const data = await api.getAllStalls(); setStalls(data); }
        catch { showToast.error('Failed to load stalls'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { await api.createStall(formData); showToast.success('Stall created!'); setFormData({ stallName: '', description: '', specialty: '', location: '' }); setShowAddForm(false); loadStalls(); }
        catch { showToast.error('Failed to create stall'); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete stall "${name}"? This cannot be undone.`)) return;
        try { await api.deleteStall(id); showToast.success('Stall deleted'); loadStalls(); }
        catch { showToast.error('Failed to delete stall'); }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="skeleton h-10 w-48 rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-44 rounded-2xl" />)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-gray-900">Manage Stalls</h2>
                <button onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 transition-all active:scale-95">
                    {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showAddForm ? 'Close' : 'Add Stall'}
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5 slide-up">
                    <h3 className="text-base font-bold text-gray-800 mb-4">Create New Stall</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { label: 'Stall Name *', key: 'stallName', placeholder: 'e.g. BBQ Corner', required: true },
                            { label: 'Specialty *', key: 'specialty', placeholder: 'e.g. Grilled Items', required: true },
                            { label: 'Location', key: 'location', placeholder: 'e.g. Ground Floor' },
                        ].map(({ label, key, placeholder, required }) => (
                            <div key={key}>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                                <input type="text" required={required} value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder={placeholder} />
                            </div>
                        ))}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 resize-none" rows="2" placeholder="Brief description..." />
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all">Create Stall</button>
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {stalls.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center"><Store className="h-10 w-10 text-gray-300" /></div>
                    <p className="text-lg font-semibold text-gray-400">No stalls yet</p>
                    <p className="text-gray-300 text-sm mt-1">Create one to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stalls.map(stall => (
                        <div key={stall.id} className="bg-white rounded-2xl border border-gray-100 p-4 card-hover group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <Store className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{stall.stallName}</h3>
                                </div>
                                <button onClick={() => handleDelete(stall.id, stall.stallName)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <p className="text-xs font-semibold text-indigo-500 mb-1">{stall.specialty}</p>
                            {stall.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{stall.description}</p>}

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                {stall.location && (
                                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                        <MapPin className="h-3 w-3" /> {stall.location}
                                    </span>
                                )}
                                {stall.shopkeeperId ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <CheckCircle className="h-3 w-3" /> Shopkeeper
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Unassigned</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
