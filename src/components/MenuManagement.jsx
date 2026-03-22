import { useState, useEffect } from 'react';
import { Utensils, Plus, Trash2, Store, X, ChevronRight, Search, Tag } from 'lucide-react';
import api from '../services/api';

export default function MenuManagement({ showToast }) {
    const [menuItems, setMenuItems] = useState([]);
    const [stalls, setStalls] = useState([]);
    const [selectedStall, setSelectedStall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ itemName: '', description: '', price: '', category: '', stallId: '' });

    useEffect(() => { loadStalls(); loadMenuItems(); }, []);

    const loadStalls = async () => {
        try {
            const data = await api.getAllStalls();
            setStalls(data);
            if (data.length > 0) setSelectedStall(data[0].id);
        } catch {
            showToast.error('Failed to load stalls');
        }
    };

    const loadMenuItems = async () => {
        try {
            const data = await api.getAllMenuItems();
            setMenuItems(data);
        } catch {
            showToast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.stallId && !selectedStall) { showToast.error('Select a stall'); return; }
        try {
            await api.createMenuItem({
                ...formData,
                name: formData.itemName,
                price: parseFloat(formData.price),
                stallId: formData.stallId || selectedStall
            });
            showToast.success('Menu item created!');
            setFormData({ itemName: '', description: '', price: '', category: '', stallId: '' });
            setShowAddForm(false);
            loadMenuItems();
        } catch {
            showToast.error('Failed to create');
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        try {
            await api.deleteMenuItem(id);
            showToast.success('Deleted');
            loadMenuItems();
        } catch {
            showToast.error('Failed to delete');
        }
    };

    const filteredItems = menuItems
        .filter(i => !selectedStall || String(i.stallId) === String(selectedStall))
        .filter(i => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (i.name || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q);
        });

    const getStallItemCount = (stallId) =>
        menuItems.filter(i => String(i.stallId) === String(stallId)).length;

    if (loading) {
        return (
            <div className="flex gap-4 h-full">
                <div className="w-52 flex-shrink-0 space-y-2">
                    {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
                </div>
                <div className="flex-1 space-y-4">
                    <div className="skeleton h-10 w-56 rounded-xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-0 h-full overflow-hidden">

            {/* ── Left Sidebar: Stall List ── */}
            <div className="w-52 flex-shrink-0 border-r border-gray-100 overflow-y-auto no-scrollbar pr-2 space-y-1 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 mb-2 mt-1">Stalls</p>
                <button
                    onClick={() => setSelectedStall(null)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        !selectedStall
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/50'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <Utensils className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">All Stalls</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        !selectedStall ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                        {menuItems.length}
                    </span>
                </button>
                {stalls.map(stall => (
                    <button
                        key={stall.id}
                        onClick={() => setSelectedStall(stall.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                            String(selectedStall) === String(stall.id)
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/50'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <Store className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate text-left">{stall.stallName}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            String(selectedStall) === String(stall.id) ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                            {getStallItemCount(stall.id)}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Right Panel: Items ── */}
            <div className="flex-1 flex flex-col overflow-hidden pl-4">

                {/* Sticky Header */}
                <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm pb-3 border-b border-gray-100/80 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900">Manage Menu</h2>
                            <p className="text-sm text-gray-400">
                                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                                {selectedStall ? ` in ${stalls.find(s => String(s.id) === String(selectedStall))?.stallName || 'stall'}` : ' across all stalls'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 transition-all active:scale-95"
                        >
                            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {showAddForm ? 'Close' : 'Add Item'}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search items or categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white/80 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                        />
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">

                    {/* Add Form */}
                    {showAddForm && (
                        <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-100/30 p-5 slide-up">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-indigo-100 rounded-lg">
                                    <Plus className="h-4 w-4 text-indigo-600" />
                                </div>
                                <h3 className="text-base font-bold text-gray-800">New Menu Item</h3>
                            </div>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { label: 'Item Name *', key: 'itemName', placeholder: 'e.g. Chicken Burger', required: true },
                                    { label: 'Price (INR) *', key: 'price', placeholder: '0.00', required: true, type: 'number' },
                                    { label: 'Category *', key: 'category', placeholder: 'e.g. Burgers', required: true },
                                ].map(({ label, key, placeholder, required, type }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                                        <input
                                            type={type || 'text'}
                                            step={type === 'number' ? '0.01' : undefined}
                                            required={required}
                                            value={formData[key]}
                                            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                            placeholder={placeholder}
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Stall *</label>
                                    <select
                                        required
                                        value={formData.stallId || selectedStall || ''}
                                        onChange={(e) => setFormData({ ...formData, stallId: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                    >
                                        <option value="" disabled>Select a Stall</option>
                                        {stalls.map(s => <option key={s.id} value={s.id}>{s.stallName}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
                                        rows="2"
                                        placeholder="Describe the item..."
                                    />
                                </div>
                                <div className="sm:col-span-2 flex gap-2">
                                    <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all active:scale-95">
                                        Add Item
                                    </button>
                                    <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Items Grid */}
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                                <Utensils className="h-10 w-10 text-gray-300" />
                            </div>
                            <p className="text-lg font-semibold text-gray-400">
                                {searchQuery ? `No items matching "${searchQuery}"` : `No menu items${selectedStall ? ' for this stall' : ''}`}
                            </p>
                            {!showAddForm && (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add First Item
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                            {filteredItems.map(item => (
                                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 card-hover group hover:border-indigo-100 hover:shadow-md transition-all duration-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-sm text-gray-900 truncate">{item.name || item.itemName || 'Unnamed Item'}</h3>
                                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                <Store className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">
                                                    {item.stallName || stalls.find(s => String(s.id) === String(item.stallId))?.stallName || 'Unknown'}
                                                </span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.id, item.name || item.itemName)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ml-2"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    {item.description && (
                                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-auto">
                                        <span className="text-base font-extrabold text-indigo-600">INR {item.price}</span>
                                        {item.category && (
                                            <span className="flex items-center gap-1 text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                <Tag className="h-2.5 w-2.5" />
                                                {item.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
