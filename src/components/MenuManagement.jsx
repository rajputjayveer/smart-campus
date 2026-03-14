import { useState, useEffect } from 'react';
import { Utensils, Plus, Trash2, Store, X } from 'lucide-react';
import api from '../services/api';

export default function MenuManagement({ showToast }) {
    const [menuItems, setMenuItems] = useState([]);
    const [stalls, setStalls] = useState([]);
    const [selectedStall, setSelectedStall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ itemName: '', description: '', price: '', category: '', stallId: '' });

    useEffect(() => { loadStalls(); loadMenuItems(); }, []);

    const loadStalls = async () => {
        try { const data = await api.getAllStalls(); setStalls(data); if (data.length > 0) setSelectedStall(data[0].id); }
        catch { showToast.error('Failed to load stalls'); }
    };

    const loadMenuItems = async () => {
        try { const data = await api.getAllMenuItems(); setMenuItems(data); }
        catch { showToast.error('Failed to load menu'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.stallId && !selectedStall) { showToast.error('Select a stall'); return; }
        try {
            await api.createMenuItem({ ...formData, name: formData.itemName, price: parseFloat(formData.price), stallId: formData.stallId || selectedStall });
            showToast.success('Menu item created!'); setFormData({ itemName: '', description: '', price: '', category: '', stallId: '' }); setShowAddForm(false); loadMenuItems();
        } catch { showToast.error('Failed to create'); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        try { await api.deleteMenuItem(id); showToast.success('Deleted'); loadMenuItems(); }
        catch { showToast.error('Failed to delete'); }
    };

    const filteredItems = selectedStall ? menuItems.filter(i => String(i.stallId) === String(selectedStall)) : menuItems;

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="skeleton h-10 w-56 rounded-xl" />
                <div className="flex gap-2">{[1,2,3].map(i => <div key={i} className="skeleton h-9 w-24 rounded-lg" />)}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm -mx-1 px-1 py-2 space-y-4 shadow-sm border-b border-gray-100/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900">Manage Menu</h2>
                        <p className="text-sm text-gray-400">{menuItems.length} items across all stalls</p>
                    </div>
                    <button onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 transition-all active:scale-95">
                        {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showAddForm ? 'Close' : 'Add Item'}
                    </button>
                </div>

                {/* Stall Filter */}
                <div className="flex gap-1.5 p-1 bg-gray-100/80 rounded-xl overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent w-full">
                    <button onClick={() => setSelectedStall(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold swallow-all transition-all whitespace-nowrap ${!selectedStall ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                        All Stalls
                    </button>
                    {stalls.map(stall => (
                        <button key={stall.id} onClick={() => setSelectedStall(stall.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${String(selectedStall) === String(stall.id) ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                            <Store className="h-3 w-3" /> {stall.stallName}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5 px-1">

            {showAddForm && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5 slide-up">
                    <h3 className="text-base font-bold text-gray-800 mb-4">New Menu Item</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { label: 'Item Name *', key: 'itemName', placeholder: 'e.g. Chicken Burger', required: true },
                            { label: 'Price (INR) *', key: 'price', placeholder: '0.00', required: true, type: 'number' },
                            { label: 'Category *', key: 'category', placeholder: 'e.g. Burgers', required: true },
                        ].map(({ label, key, placeholder, required, type }) => (
                            <div key={key}>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                                <input type={type || 'text'} step={type === 'number' ? '0.01' : undefined} required={required} value={formData[key]}
                                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder={placeholder} />
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Stall *</label>
                            <select required value={formData.stallId || selectedStall || ''} onChange={(e) => setFormData({ ...formData, stallId: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30">
                                <option value="" disabled>Select a Stall</option>
                                {stalls.map(s => <option key={s.id} value={s.id}>{s.stallName}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 resize-none" rows="2" placeholder="Describe the item..." />
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all">Add Item</button>
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {filteredItems.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center"><Utensils className="h-10 w-10 text-gray-300" /></div>
                    <p className="text-lg font-semibold text-gray-400">No menu items{selectedStall ? ' for this stall' : ''}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 card-hover group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-sm text-gray-900 truncate">{item.name || item.itemName || 'Unnamed Item'}</h3>
                                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                        <Store className="h-3 w-3" />
                                        {item.stallName || stalls.find(s => String(s.id) === String(item.stallId))?.stallName || 'Unknown'}
                                    </p>
                                </div>
                                <button onClick={() => handleDelete(item.id, item.name || item.itemName)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            {item.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <span className="text-base font-extrabold text-indigo-600">INR {item.price}</span>
                                {item.category && <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{item.category}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </div>
        </div>
    );
}
