import { useState, useEffect } from 'react';
import { UserCheck, UserX, Store, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Star } from 'lucide-react';
import api from '../services/api';

export function AdminShopkeeperPanel() {
    const [pendingShopkeepers, setPendingShopkeepers] = useState([]);
    const [approvedShopkeepers, setApprovedShopkeepers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true); setError('');
        try {
            const [pending, approved] = await Promise.all([api.getPendingShopkeepers(), api.request('/admin/shopkeepers')]);
            setPendingShopkeepers(pending); setApprovedShopkeepers(approved);
        } catch (err) { setError(err.message || 'Failed to load shopkeepers'); }
        finally { setLoading(false); }
    };

    const handleApproval = async (id, approve) => {
        try {
            await api.approveShopkeeper(id, approve);
            setSuccess(approve ? 'Shopkeeper approved!' : 'Registration rejected');
            setTimeout(() => setSuccess(''), 3000);
            loadData();
        } catch (err) { setError(err.message || 'Failed to process'); }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-4 space-y-4">
                <div className="skeleton h-12 rounded-xl w-72" />
                <div className="flex gap-3"><div className="skeleton h-10 w-28 rounded-xl" /><div className="skeleton h-10 w-28 rounded-xl" /></div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-2 sm:p-4">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Shopkeeper Management</h2>
                    <p className="text-sm text-gray-400">Approve or reject registration requests</p>
                </div>
                <button onClick={loadData} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                    <RefreshCw className="h-4 w-4 text-gray-500" />
                </button>
            </div>

            {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-4 flex items-center gap-2 slide-up">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <p className="text-sm text-emerald-800 font-medium">{success}</p>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4 flex items-center gap-2 slide-up">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100/80 rounded-xl w-fit mb-5">
                <button onClick={() => setActiveTab('pending')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pending' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                    <Clock className="h-4 w-4" /> Pending <span className="ml-0.5 text-[11px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{pendingShopkeepers.length}</span>
                </button>
                <button onClick={() => setActiveTab('approved')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'approved' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                    <UserCheck className="h-4 w-4" /> Approved <span className="ml-0.5 text-[11px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{approvedShopkeepers.length}</span>
                </button>
            </div>

            {/* Pending */}
            {activeTab === 'pending' && (
                <div className="space-y-3">
                    {pendingShopkeepers.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center"><Clock className="h-8 w-8 text-gray-300" /></div>
                            <p className="text-gray-400 font-semibold">No pending requests</p>
                        </div>
                    ) : (
                        pendingShopkeepers.map((sk) => (
                            <div key={sk.id} className="bg-white border border-gray-100 rounded-2xl p-5 card-hover">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                                <Store className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{sk.name}</h3>
                                                <p className="text-xs text-gray-400">{sk.email}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                            {[
                                                { label: 'Stall', value: sk.stallName },
                                                { label: 'Specialty', value: sk.specialty },
                                                { label: 'Department', value: sk.department },
                                                { label: 'Registered', value: sk.createdAt ? new Date(sk.createdAt).toLocaleDateString() : 'N/A' },
                                            ].map((item, i) => (
                                                <div key={i} className="bg-gray-50 rounded-lg p-2">
                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{item.label}</p>
                                                    <p className="text-sm font-semibold text-gray-700 truncate">{item.value || 'N/A'}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApproval(sk.id, true)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-200/50 transition-all active:scale-95">
                                                <CheckCircle className="h-4 w-4" /> Approve
                                            </button>
                                            <button onClick={() => handleApproval(sk.id, false)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all active:scale-95">
                                                <XCircle className="h-4 w-4" /> Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Approved */}
            {activeTab === 'approved' && (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {approvedShopkeepers.length === 0 ? (
                        <div className="col-span-full text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center"><UserCheck className="h-8 w-8 text-gray-300" /></div>
                            <p className="text-gray-400 font-semibold">No approved shopkeepers yet</p>
                        </div>
                    ) : (
                        approvedShopkeepers.map((sk) => (
                            <div key={sk.id} className="bg-white border border-gray-100 rounded-2xl p-4 card-hover">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <Store className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm text-gray-900 truncate">{sk.name}</h3>
                                        <p className="text-[11px] text-gray-400 truncate">{sk.email}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sk.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {sk.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                        <span className="text-gray-400">Stall</span>
                                        <span className="font-semibold text-gray-700">{sk.stallName}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                        <span className="text-gray-400">Specialty</span>
                                        <span className="font-semibold text-gray-700">{sk.specialty}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                        <span className="text-gray-400">Rating</span>
                                        <span className="font-semibold text-amber-600 flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{sk.rating || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
