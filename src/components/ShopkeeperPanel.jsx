// Shopkeeper Panel - Orders and Menu management for a single stall
import { useEffect, useMemo, useState } from 'react';
import { Package, RefreshCw, CheckCircle, Clock, Utensils, Plus, Trash2, Pencil, Save, X } from 'lucide-react';
import api from '../services/api';

const statusOptions = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

const normalizeNumber = (value, fallback = 0) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

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
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        image: ''
    });

    const stallId = user?.stallId;

    const loadOrders = async () => {
        if (!stallId) return;
        try {
            setOrdersLoading(true);
            const data = await api.getOrdersByStall(stallId);
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast?.error?.('Failed to load orders');
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
    };

    const loadMenu = async () => {
        if (!stallId) return;
        try {
            setMenuLoading(true);
            const data = await api.getMenuItems(stallId);
            setMenuItems(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast?.error?.('Failed to load menu items');
            setMenuItems([]);
        } finally {
            setMenuLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        loadMenu();
        // Refresh orders every 30s
        const interval = setInterval(loadOrders, 30000);
        return () => clearInterval(interval);
    }, [stallId]);

    const stallOrders = useMemo(() => {
        if (!Array.isArray(orders)) return [];
        return orders;
    }, [orders]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.updateOrderStatus(orderId, newStatus);
            showToast?.success?.('Order status updated');
            loadOrders();
        } catch (err) {
            showToast?.error?.('Failed to update status');
        }
    };

    const handleCreateMenuItem = async (e) => {
        e.preventDefault();
        try {
            await api.createMenuItem({
                stallId,
                name: formData.name,
                price: normalizeNumber(formData.price, 0),
                description: formData.description || null,
                image: formData.image || null
            });
            showToast?.success?.('Menu item created');
            setFormData({ name: '', price: '', description: '', image: '' });
            setShowAddForm(false);
            loadMenu();
        } catch (err) {
            showToast?.error?.('Failed to create menu item');
        }
    };

    const handleDeleteMenuItem = async (id, name) => {
        if (!confirm(`Delete "${name}" from menu?`)) return;
        try {
            await api.deleteMenuItem(id);
            showToast?.success?.('Menu item deleted');
            loadMenu();
        } catch (err) {
            showToast?.error?.('Failed to delete item');
        }
    };

    const startPriceEdit = (item) => {
        setEditingPriceId(item.id);
        setEditedPrice(String(item.price ?? ''));
    };

    const cancelPriceEdit = () => {
        setEditingPriceId(null);
        setEditedPrice('');
    };

    const savePriceEdit = async (item) => {
        const nextPrice = normalizeNumber(editedPrice, -1);
        if (nextPrice <= 0) {
            showToast?.error?.('Please enter a valid price');
            return;
        }
        try {
            await api.updateMenuItem(item.id, {
                stallId,
                name: item.name || item.itemName,
                price: nextPrice,
                description: item.description || null,
                image: item.image || null,
                popular: item.popular ? 1 : 0
            });
            showToast?.success?.('Price updated');
            cancelPriceEdit();
            loadMenu();
        } catch (err) {
            showToast?.error?.('Failed to update price');
        }
    };

    if (!stallId) {
        return (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Shopkeeper Panel</h2>
                <p className="text-gray-600">
                    Your account is not linked to a stall yet. Please contact an admin.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-wrap gap-3 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-5 py-3 font-semibold transition-colors rounded-t-lg ${
                        activeTab === 'orders'
                            ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Orders
                </button>
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`px-5 py-3 font-semibold transition-colors rounded-t-lg ${
                        activeTab === 'menu'
                            ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Menu
                </button>
            </div>

            {activeTab === 'orders' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Incoming Orders</h2>
                            <p className="text-sm text-gray-500">Stall ID: {stallId}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            >
                                <option value="all">All Status</option>
                                {statusOptions.map(status => (
                                    <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={loadOrders}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {ordersLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                        </div>
                    ) : stallOrders.length === 0 ? (
                        <div className="text-center py-16">
                            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-xl text-gray-500">No orders yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stallOrders
                                .filter(order => statusFilter === 'all' || order.status === statusFilter)
                                .map((order) => {
                                const items = Array.isArray(order.items) ? order.items : [];
                                const stallItems = items.filter(item => String(item.stallId) === String(stallId));
                                const displayedItems = stallItems.length > 0 ? stallItems : items;
                                const stallTotal = displayedItems.reduce(
                                    (sum, item) => sum + normalizeNumber(item.price) * normalizeNumber(item.quantity, 1),
                                    0
                                );

                                return (
                                    <div key={order.id} className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg">
                                                    Order #{order.id?.toString().slice(0, 8)}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {order.user?.name || 'Customer'} • {order.user?.email || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">
                                                    {order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A'}
                                                </p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                                                    >
                                                        {statusOptions.map(status => (
                                                            <option key={status} value={status}>
                                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {displayedItems.map((item, idx) => (
                                                <div key={item.id || idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                                    <div className="flex-1">
                                                        <span className="font-medium">{item.name || 'Item'}</span>
                                                        <span className="text-gray-500 ml-2">x {normalizeNumber(item.quantity, 1)}</span>
                                                    </div>
                                                    <span className="font-medium">
                                                        ₹{(normalizeNumber(item.price) * normalizeNumber(item.quantity, 1)).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-3 border-t mt-4 flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Stall Total</span>
                                            <span className="text-lg font-bold text-indigo-600">₹{stallTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'menu' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Your Menu</h2>
                            <p className="text-sm text-gray-500">Manage items for your stall</p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Menu Item
                        </button>
                    </div>

                    {showAddForm && (
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold mb-4">Add New Menu Item</h3>
                            <form onSubmit={handleCreateMenuItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Item Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. Burger Combo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        rows="2"
                                        placeholder="Describe the item..."
                                    ></textarea>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Image URL</label>
                                    <input
                                        type="text"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="md:col-span-2 flex gap-3">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                        Add Item
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {menuLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {menuItems.map(item => (
                                <div key={item.id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold">{item.name || item.itemName}</h3>
                                            <p className="text-sm text-gray-500">{item.category || 'Menu Item'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteMenuItem(item.id, item.name || item.itemName)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                                    <div className="flex justify-between items-center">
                                        {editingPriceId === item.id ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">INR</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editedPrice}
                                                    onChange={(e) => setEditedPrice(e.target.value)}
                                                    className="w-24 px-2 py-1 border rounded text-sm"
                                                />
                                                <button
                                                    onClick={() => savePriceEdit(item)}
                                                    className="p-1 text-green-700 hover:bg-green-50 rounded"
                                                    title="Save price"
                                                >
                                                    <Save className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={cancelPriceEdit}
                                                    className="p-1 text-gray-700 hover:bg-gray-100 rounded"
                                                    title="Cancel"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-indigo-600">₹{item.price}</span>
                                                <button
                                                    onClick={() => startPriceEdit(item)}
                                                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                                    title="Edit price"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                        {item.popular ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                Popular
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Standard</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!menuLoading && menuItems.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Utensils className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p>No menu items found for your stall.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
