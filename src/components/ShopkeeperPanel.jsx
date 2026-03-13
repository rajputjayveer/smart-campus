import { useEffect, useMemo, useState } from 'react';
import { Package, RefreshCw, CheckCircle, Clock, Utensils, Plus, Trash2, Pencil, Save, X, XCircle, TicketPercent, ChevronDown } from 'lucide-react';
import api from '../services/api';
import ShopkeeperCouponManagement from './ShopkeeperCouponManagement';

const statusOptions = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
const STATUS_CONFIG = {
    pending:   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'from-amber-400 to-amber-500', icon: Clock },
    preparing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bar: 'from-blue-400 to-blue-500', icon: RefreshCw },
    ready:     { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'from-emerald-400 to-emerald-500', icon: CheckCircle },
    completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', bar: 'from-green-400 to-green-600', icon: CheckCircle },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', bar: 'from-red-400 to-red-500', icon: XCircle },
};

const normalizeNumber = (value, fallback = 0) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const navItems = [
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'menu', label: 'Menu', icon: Utensils },
    { id: 'coupons', label: 'Coupons', icon: TicketPercent },
];

export default function ShopkeeperPanel({ user, showToast }) {
    const [activeTab, setActiveTab] = useState('orders');
    const [statusFilter, setStatusFilter] = useState('all');
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [menuLoading, setMenuLoading] = useState(true);
    const [menuItems, setMenuItems] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingPriceId, setEditingPriceId] = useState(null);
    const [editedPrice, setEditedPrice] = useState('');
    const [formData, setFormData] = useState({ name: '', price: '', description: '', image: '' });

    const stallId = user?.stallId;

    const loadOrders = async () => {
        if (!stallId) return;
        try { setOrdersLoading(true); const data = await api.getOrdersByStall(stallId); setOrders(Array.isArray(data) ? data : []); }
        catch { showToast?.error?.('Failed to load orders'); setOrders([]); }
        finally { setOrdersLoading(false); }
    };

    const loadMenu = async () => {
        if (!stallId) return;
        try { setMenuLoading(true); const data = await api.getMenuItems(stallId); setMenuItems(Array.isArray(data) ? data : []); }
        catch { showToast?.error?.('Failed to load menu'); setMenuItems([]); }
        finally { setMenuLoading(false); }
    };

    useEffect(() => { loadOrders(); loadMenu(); const i = setInterval(loadOrders, 30000); return () => clearInterval(i); }, [stallId]);

    const stallOrders = useMemo(() => Array.isArray(orders) ? orders : [], [orders]);

    const handleStatusChange = async (orderId, newStatus) => {
        try { await api.updateOrderStatus(orderId, newStatus); showToast?.success?.('Status updated'); loadOrders(); }
        catch { showToast?.error?.('Failed to update status'); }
    };

    const handleCreateMenuItem = async (e) => {
        e.preventDefault();
        try {
            await api.createMenuItem({ stallId, name: formData.name, price: normalizeNumber(formData.price, 0), description: formData.description || null, image: formData.image || null });
            showToast?.success?.('Menu item created'); setFormData({ name: '', price: '', description: '', image: '' }); setShowAddForm(false); loadMenu();
        } catch { showToast?.error?.('Failed to create menu item'); }
    };

    const handleDeleteMenuItem = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        try { await api.deleteMenuItem(id); showToast?.success?.('Deleted'); loadMenu(); }
        catch { showToast?.error?.('Failed to delete'); }
    };

    const startPriceEdit = (item) => { setEditingPriceId(item.id); setEditedPrice(String(item.price ?? '')); };
    const cancelPriceEdit = () => { setEditingPriceId(null); setEditedPrice(''); };
    const savePriceEdit = async (item) => {
        const p = normalizeNumber(editedPrice, -1);
        if (p <= 0) { showToast?.error?.('Enter a valid price'); return; }
        try { await api.updateMenuItem(item.id, { stallId, name: item.name || item.itemName, price: p, description: item.description || null, image: item.image || null, popular: item.popular ? 1 : 0 }); showToast?.success?.('Price updated'); cancelPriceEdit(); loadMenu(); }
        catch { showToast?.error?.('Failed to update'); }
    };

    if (!stallId) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Utensils className="h-8 w-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Not Linked to a Stall</h2>
                    <p className="text-gray-500 text-sm">Your account is not linked to any stall yet. Please contact an admin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl w-full mx-auto flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Pill Navigation */}
            <div className="flex-shrink-0 mb-4 px-1 pt-1">
                <div className="flex gap-1.5 p-1 bg-gray-100/80 rounded-2xl w-fit">
                    {navItems.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                                activeTab === id
                                    ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                            }`}
                        >
                            <Icon className={`h-4 w-4 ${activeTab === id ? 'text-indigo-600' : ''}`} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-1 pb-24 lg:pb-8">
                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-2xl font-extrabold text-gray-900">Incoming Orders</h2>
                            <div className="flex items-center gap-2">
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500/30">
                                    <option value="all">All Status</option>
                                    {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                </select>
                                <button onClick={loadOrders} className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 text-sm font-medium text-gray-600 shadow-sm">
                                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                                </button>
                            </div>
                        </div>

                        {ordersLoading ? (
                            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
                        ) : stallOrders.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center"><Package className="h-10 w-10 text-gray-300" /></div>
                                <p className="text-lg font-semibold text-gray-400">No orders yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stallOrders.filter(o => statusFilter === 'all' || o.status === statusFilter).map((order) => {
                                    const items = Array.isArray(order.items) ? order.items : [];
                                    const stallItems = items.filter(i => String(i.stallId) === String(stallId));
                                    const displayed = stallItems.length > 0 ? stallItems : items;
                                    const total = displayed.reduce((s, i) => s + normalizeNumber(i.price) * normalizeNumber(i.quantity, 1), 0);
                                    const status = (order.status || 'pending').toLowerCase();
                                    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                                    const StatusIcon = cfg.icon;

                                    return (
                                        <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover">
                                            <div className={`h-1 bg-gradient-to-r ${cfg.bar}`} />
                                            <div className="p-4 sm:p-5">
                                                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.text}`}>
                                                            <StatusIcon className={`h-4 w-4 ${status === 'preparing' ? 'animate-spin' : ''}`} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-sm sm:text-base">Order #{order.id?.toString().slice(0, 8)}</h3>
                                                            <p className="text-xs text-gray-400">{order.user?.name || 'Customer'} · {order.timestamp ? new Date(order.timestamp).toLocaleString() : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                            className={`px-3 py-1.5 rounded-lg border text-sm font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                            {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    {displayed.map((item, idx) => (
                                                        <div key={item.id || idx} className="flex justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                                                            <span className="text-gray-700">{item.name || 'Item'} <span className="text-gray-400">x{normalizeNumber(item.quantity, 1)}</span></span>
                                                            <span className="font-semibold">INR {(normalizeNumber(item.price) * normalizeNumber(item.quantity, 1)).toFixed(0)}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-3 border-t mt-3 flex items-center justify-between">
                                                    <span className="text-xs text-gray-400 font-medium">Total</span>
                                                    <span className="text-lg font-extrabold text-indigo-600">INR {total.toFixed(0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* MENU TAB */}
                {activeTab === 'menu' && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-extrabold text-gray-900">Your Menu</h2>
                            <button onClick={() => setShowAddForm(!showAddForm)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold shadow-lg shadow-indigo-200/50 transition-all active:scale-95">
                                <Plus className="h-4 w-4" /> Add Item
                            </button>
                        </div>

                        {showAddForm && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 slide-up">
                                <h3 className="text-base font-bold text-gray-800 mb-4">New Menu Item</h3>
                                <form onSubmit={handleCreateMenuItem} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Item Name *</label>
                                        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="e.g. Burger Combo" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Price (INR) *</label>
                                        <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="0.00" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 resize-none" rows="2" placeholder="Describe the item..." />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Image URL</label>
                                        <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30" placeholder="https://..." />
                                    </div>
                                    <div className="md:col-span-2 flex gap-2">
                                        <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all">Add Item</button>
                                        <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {menuLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}</div>
                        ) : menuItems.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center"><Utensils className="h-10 w-10 text-gray-300" /></div>
                                <p className="text-lg font-semibold text-gray-400">No menu items yet</p>
                                <p className="text-gray-300 text-sm mt-1">Add your first item to get started</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {menuItems.map(item => (
                                    <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 card-hover group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-sm text-gray-900 truncate">{item.name || item.itemName}</h3>
                                                <p className="text-[11px] text-gray-400">{item.category || 'Menu Item'}</p>
                                            </div>
                                            <button onClick={() => handleDeleteMenuItem(item.id, item.name || item.itemName)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        {item.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>}
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                            {editingPriceId === item.id ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-gray-400">INR</span>
                                                    <input type="number" step="0.01" value={editedPrice} onChange={(e) => setEditedPrice(e.target.value)}
                                                        className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm bg-gray-50" autoFocus />
                                                    <button onClick={() => savePriceEdit(item)} className="p-1 text-green-600 hover:bg-green-50 rounded-lg"><Save className="h-3.5 w-3.5" /></button>
                                                    <button onClick={cancelPriceEdit} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="h-3.5 w-3.5" /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-base font-extrabold text-indigo-600">INR {item.price}</span>
                                                    <button onClick={() => startPriceEdit(item)} className="p-1 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                        <Pencil className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                            {item.popular ? (
                                                <span className="text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">Popular</span>
                                            ) : (
                                                <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Standard</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* COUPONS TAB */}
                {activeTab === 'coupons' && <ShopkeeperCouponManagement showToast={showToast} />}
            </div>
        </div>
    );
}
