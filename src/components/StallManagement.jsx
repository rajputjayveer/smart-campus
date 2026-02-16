// Stall Management Component for Admin
import { useState, useEffect } from 'react';
import { Store, Plus, Trash2, Edit } from 'lucide-react';
import api from '../services/api';

export default function StallManagement({ showToast }) {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        stallName: '',
        description: '',
        specialty: '',
        location: ''
    });

    useEffect(() => {
        loadStalls();
    }, []);

    const loadStalls = async () => {
        try {
            const data = await api.getAllStalls();
            setStalls(data);
        } catch (err) {
            showToast.error('Failed to load stalls');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.createStall(formData);
            showToast.success('Stall created successfully!');
            setFormData({ stallName: '', description: '', specialty: '', location: '' });
            setShowAddForm(false);
            loadStalls();
        } catch (err) {
            showToast.error('Failed to create stall');
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete stall "${name}"? This cannot be undone.`)) return;

        try {
            await api.deleteStall(id);
            showToast.success('Stall deleted successfully');
            loadStalls();
        } catch (err) {
            showToast.error('Failed to delete stall');
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
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Manage Stalls</h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add New Stall
                </button>
            </div>

            {/* Add Stall Form */}
            {showAddForm && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4">Create New Stall</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Stall Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.stallName}
                                onChange={(e) => setFormData({ ...formData, stallName: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. BBQ Corner"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Specialty *</label>
                            <input
                                type="text"
                                required
                                value={formData.specialty}
                                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Grilled Items"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Ground Floor"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                rows="3"
                                placeholder="Brief description of the stall..."
                            ></textarea>
                        </div>

                        <div className="col-span-2 flex space-x-3">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Create Stall
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

            {/* Stalls List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stalls.map(stall => (
                    <div key={stall.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                                <Store className="h-6 w-6 text-indigo-600 mr-2" />
                                <h3 className="font-bold text-lg">{stall.stallName}</h3>
                            </div>
                            <button
                                onClick={() => handleDelete(stall.id, stall.stallName)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Stall"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{stall.specialty}</p>
                        {stall.description && (
                            <p className="text-sm text-gray-500 mb-3">{stall.description}</p>
                        )}
                        {stall.location && (
                            <p className="text-xs text-gray-400">📍 {stall.location}</p>
                        )}

                        {stall.shopkeeperId && (
                            <div className="mt-3 pt-3 border-t">
                                <span className="text-xs text-green-600 font-medium">✓ Has Active Shopkeeper</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {stalls.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Store className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>No stalls yet. Create one to get started!</p>
                </div>
            )}
        </div>
    );
}
