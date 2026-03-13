import { useEffect, useState } from 'react';
import { Ticket, Plus, Trash2, Power, X, Tag, Calendar, Users } from 'lucide-react';
import api from '../services/api';

const initialForm = { code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' };

export default function CouponManagement({ showToast }) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(initialForm);

    const loadCoupons = async () => {
        try { setLoading(true); const data = await api.getCoupons(); setCoupons(Array.isArray(data) ? data : []); }
        catch { showToast?.error?.('Failed to load coupons'); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadCoupons(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.createCoupon({
                ...formData,
                discountValue: Number(formData.discountValue),
                minOrderAmount: formData.minOrderAmount === '' ? 0 : Number(formData.minOrderAmount),
                maxDiscount: formData.maxDiscount === '' ? null : Number(formData.maxDiscount),
                usageLimit: formData.usageLimit === '' ? null : Number(formData.usageLimit),
                expiresAt: formData.expiresAt || null,
            });
            showToast?.success?.('Coupon created'); setFormData(initialForm); setShowForm(false); loadCoupons();
        } catch (err) { showToast?.error?.(err.message || 'Failed to create'); }
    };

    const handleToggle = async (id) => {
        try { await api.toggleCouponStatus(id); showToast?.success?.('Status updated'); loadCoupons(); }
        catch { showToast?.error?.('Failed to toggle'); }
    };

    const handleDelete = async (id, code) => {
        if (!confirm(`Delete coupon "${code}"?`)) return;
        try { await api.deleteCoupon(id); showToast?.success?.('Coupon deleted'); loadCoupons(); }
        catch { showToast?.error?.('Failed to delete'); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Coupon Management</h2>
                    <p className="text-sm text-gray-400">Create and manage global coupon codes</p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 transition-all active:scale-95">
                    {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showForm ? 'Close' : 'Add Coupon'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5 slide-up">
                    <h3 className="text-base font-bold text-gray-800 mb-4">Create Coupon</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Code *</label>
                            <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 font-mono font-bold tracking-wider" placeholder="SAVE20" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Type *</label>
                            <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30">
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed Amount</option>
                            </select>
                        </div>
                        {[
                            { label: 'Discount Value *', key: 'discountValue', required: true },
                            { label: 'Min Order Amount', key: 'minOrderAmount', placeholder: '0' },
                            { label: 'Max Discount (optional)', key: 'maxDiscount' },
                            { label: 'Per User Limit (optional)', key: 'usageLimit' },
                        ].map(({ label, key, required, placeholder }) => (
                            <div key={key}>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                                <input type="number" step="0.01" required={required} value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30" placeholder={placeholder} />
                            </div>
                        ))}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Expires At (optional)</label>
                            <input type="datetime-local" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30" />
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all">Create</button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center"><Ticket className="h-10 w-10 text-gray-300" /></div>
                    <p className="text-lg font-semibold text-gray-400">No coupons yet</p>
                    <p className="text-gray-300 text-sm mt-1">Create one to offer discounts</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {coupons.map((coupon) => (
                        <div key={coupon.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover group">
                            <div className={`h-1 ${coupon.isActive ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gray-200'}`} />
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${coupon.isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                            <Tag className={`h-4 w-4 ${coupon.isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 font-mono tracking-wider text-sm">{coupon.code}</p>
                                            <p className="text-xs font-semibold text-indigo-600">
                                                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `INR ${coupon.discountValue} off`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${coupon.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {coupon.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="space-y-1.5 text-xs mb-3">
                                    <div className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                        <span className="text-gray-400">Min Order</span>
                                        <span className="font-semibold text-gray-600">INR {Number(coupon.minOrderAmount || 0).toFixed(0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                        <span className="text-gray-400 flex items-center gap-1"><Users className="h-3 w-3" /> Used</span>
                                        <span className="font-semibold text-gray-600">{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                        <span className="text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Expires</span>
                                        <span className="font-semibold text-gray-600">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => handleToggle(coupon.id)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${coupon.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                                        <Power className="h-3.5 w-3.5" /> {coupon.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button onClick={() => handleDelete(coupon.id, coupon.code)}
                                        className="px-3 py-2 text-xs bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
