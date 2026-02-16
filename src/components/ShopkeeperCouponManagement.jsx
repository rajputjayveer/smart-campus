import { useEffect, useState } from 'react';
import { Ticket, Plus, Trash2, Power } from 'lucide-react';
import api from '../services/api';

const initialForm = {
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    expiresAt: ''
};

export default function ShopkeeperCouponManagement({ showToast }) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(initialForm);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const data = await api.getShopkeeperCoupons();
            setCoupons(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast?.error?.('Failed to load your coupons');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCoupons();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.createCoupon({
                ...formData,
                discountValue: Number(formData.discountValue),
                minOrderAmount: formData.minOrderAmount === '' ? 0 : Number(formData.minOrderAmount),
                maxDiscount: formData.maxDiscount === '' ? null : Number(formData.maxDiscount),
                usageLimit: formData.usageLimit === '' ? null : Number(formData.usageLimit),
                expiresAt: formData.expiresAt || null
            });
            showToast?.success?.('Shop coupon created');
            setFormData(initialForm);
            setShowForm(false);
            loadCoupons();
        } catch (error) {
            showToast?.error?.(error.message || 'Failed to create coupon');
        }
    };

    const handleToggle = async (id) => {
        try {
            await api.toggleCouponStatus(id);
            showToast?.success?.('Coupon status updated');
            loadCoupons();
        } catch (error) {
            showToast?.error?.('Failed to update status');
        }
    };

    const handleDelete = async (id, code) => {
        if (!confirm(`Delete coupon "${code}"?`)) return;
        try {
            await api.deleteCoupon(id);
            showToast?.success?.('Coupon deleted');
            loadCoupons();
        } catch (error) {
            showToast?.error?.('Failed to delete coupon');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Shop Coupons</h2>
                    <p className="text-sm text-gray-500">These offers apply only to your stall</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Coupon
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold mb-4">Create Shop Coupon</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Code *</label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="STALL20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Type *</label>
                            <select
                                value={formData.discountType}
                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed Amount</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Discount Value *</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.discountValue}
                                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Min Order Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.minOrderAmount}
                                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Max Discount (optional)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.maxDiscount}
                                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Per User Limit (optional)</label>
                            <input
                                type="number"
                                value={formData.usageLimit}
                                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Expires At (optional)</label>
                            <input
                                type="datetime-local"
                                value={formData.expiresAt}
                                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-2 flex gap-3">
                            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map((coupon) => (
                        <div key={coupon.id} className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg">{coupon.code}</p>
                                    <p className="text-sm text-gray-500">
                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `INR ${coupon.discountValue}`}
                                    </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {coupon.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="mt-3 space-y-1 text-xs text-gray-600">
                                <p>Min Order: INR {Number(coupon.minOrderAmount || 0).toFixed(2)}</p>
                                <p>Used: {coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</p>
                                <p>Expires: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString() : 'Never'}</p>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => handleToggle(coupon.id)}
                                    className="flex-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
                                >
                                    <Power className="h-4 w-4 inline mr-1" />
                                    Toggle
                                </button>
                                <button
                                    onClick={() => handleDelete(coupon.id, coupon.code)}
                                    className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && coupons.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>No shop coupons created yet.</p>
                </div>
            )}
        </div>
    );
}
