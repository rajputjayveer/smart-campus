// Menu Management Component for Admin
import { useState, useEffect } from 'react';
import { Utensils, Plus, Trash2, Edit2 } from 'lucide-react';
import api from '../services/api';

export default function MenuManagement({ showToast }) {
    const [menuItems, setMenuItems] = useState([]);
    const [stalls, setStalls] = useState([]);
    const [selectedStall, setSelectedStall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        itemName: '',
        description: '',
        price: '',
        category: '',
        stallId: ''
    });

    useEffect(() => {
        loadStalls();
        loadMenuItems();
    }, []);

    const loadStalls = async () => {
        try {
            const data = await api.getAllStalls();
            setStalls(data);
            if (data.length > 0) setSelectedStall(data[0].id);
        } catch (err) {
            showToast.error('Failed to load stalls');
        }
    };

    const loadMenuItems = async () => {
        try {
            const data = await api.getAllMenuItems();
            setMenuItems(data);
        } catch (err) {
            showToast.error('Failed to load menu items');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.createMenuItem({
                ...formData,
                price: parseFloat(formData.price),
                stallId: selectedStall
            });
            showToast.success('Menu item created successfully!');
            setFormData({ itemName: '', description: '', price: '', category: '', stallId: '' });
            setShowAddForm(false);
            loadMenuItems();
        } catch (err) {
            showToast.error('Failed to create menu item');
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}" from menu?`)) return;

        try {
            await api.deleteMenuItem(id);
            showToast.success('Menu item deleted');
            loadMenuItems();
        } catch (err) {
            showToast.error('Failed to delete item');
        }
    };

    const filteredItems = selectedStall
        ? menuItems.filter(item => item.stallId === selectedStall)
        : menuItems;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Manage Menu Items</h2>
                    <p className="text-gray-600 text-sm">Total: {menuItems.length} items</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Menu Item
                </button>
            </div>

            {/* Stall Filter */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Filter by Stall:</label>
                <select
                    value={selectedStall || ''}
                    onChange={(e) => setSelectedStall(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Stalls</option>
                    {stalls.map(stall => (
                        <option key={stall.id} value={stall.id}>{stall.stallName}</option>
                    ))}
                </select>
            </div>

            {/* Add Menu Form */}
            {showAddForm && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4">Add New Menu Item</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Item Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.itemName}
                                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Chicken Burger"
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

                        <div>
                            <label className="block text-sm font-medium mb-1">Category *</label>
                            <input
                                type="text"
                                required
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Burgers"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                rows="2"
                                placeholder="Describe the item..."
                            ></textarea>
                        </div>

                        <div className="col-span-2 flex space-x-3">
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

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold">{item.itemName}</h3>
                                <p className="text-sm text-gray-500">{item.stallName}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(item.id, item.itemName)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-indigo-600">₹{item.price}</span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Utensils className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>No menu items found{selectedStall ? ' for this stall' : ''}.</p>
                </div>
            )}
        </div>
    );
}
