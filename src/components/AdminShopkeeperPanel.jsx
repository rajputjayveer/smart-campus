// Admin Panel for Shopkeeper Approval Management

import { useState, useEffect } from 'react';
import { UserCheck, UserX, Store, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';

export function AdminShopkeeperPanel() {
    const [pendingShopkeepers, setPendingShopkeepers] = useState([]);
    const [approvedShopkeepers, setApprovedShopkeepers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [pending, approved] = await Promise.all([
                api.getPendingShopkeepers(),
                api.request('/admin/shopkeepers')
            ]);
            setPendingShopkeepers(pending);
            setApprovedShopkeepers(approved);
        } catch (err) {
            setError(err.message || 'Failed to load shopkeepers');
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (id, approve) => {
        try {
            await api.approveShopkeeper(id, approve);
            setSuccess(approve ? 'Shopkeeper approved successfully!' : 'Shopkeeper registration rejected');
            setTimeout(() => setSuccess(''), 3000);
            loadData(); // Reload data
        } catch (err) {
            setError(err.message || 'Failed to process approval');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Shopkeeper Management</h1>
                <p className="text-gray-600">Approve or reject shopkeeper registration requests</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <p className="text-green-800">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 font-medium transition-all ${activeTab === 'pending'
                            ? 'border-b-2 border-indigo-600 text-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Pending ({pendingShopkeepers.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    className={`pb-3 px-4 font-medium transition-all ${activeTab === 'approved'
                            ? 'border-b-2 border-indigo-600 text-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center">
                        <UserCheck className="h-5 w-5 mr-2" />
                        Approved ({approvedShopkeepers.length})
                    </div>
                </button>
            </div>

            {/* Pending Shopkeepers */}
            {activeTab === 'pending' && (
                <div className="space-y-4">
                    {pendingShopkeepers.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No pending shopkeeper requests</p>
                        </div>
                    ) : (
                        pendingShopkeepers.map((shopkeeper) => (
                            <div
                                key={shopkeeper.id}
                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-3">
                                            <div className="bg-yellow-100 rounded-full p-2 mr-3">
                                                <Store className="h-6 w-6 text-yellow-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">{shopkeeper.name}</h3>
                                                <p className="text-sm text-gray-500">{shopkeeper.email}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Stall</p>
                                                <p className="font-medium text-gray-800">{shopkeeper.stallName || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Specialty</p>
                                                <p className="font-medium text-gray-800">{shopkeeper.specialty || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Department</p>
                                                <p className="font-medium text-gray-800">{shopkeeper.department || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Registered</p>
                                                <p className="font-medium text-gray-800">
                                                    {new Date(shopkeeper.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => handleApproval(shopkeeper.id, true)}
                                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <CheckCircle className="h-5 w-5 mr-2" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleApproval(shopkeeper.id, false)}
                                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                <XCircle className="h-5 w-5 mr-2" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Approved Shopkeepers */}
            {activeTab === 'approved' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {approvedShopkeepers.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl">
                            <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No approved shopkeepers yet</p>
                        </div>
                    ) : (
                        approvedShopkeepers.map((shopkeeper) => (
                            <div
                                key={shopkeeper.id}
                                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-center mb-3">
                                    <div className="bg-green-100 rounded-full p-2 mr-3">
                                        <Store className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800">{shopkeeper.name}</h3>
                                        <p className="text-xs text-gray-500">{shopkeeper.email}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${shopkeeper.isActive
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {shopkeeper.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Stall:</span>
                                        <span className="ml-2 font-medium text-gray-800">{shopkeeper.stallName}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Specialty:</span>
                                        <span className="ml-2 font-medium text-gray-800">{shopkeeper.specialty}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Rating:</span>
                                        <span className="ml-2 font-medium text-yellow-600">
                                            ⭐ {shopkeeper.rating || 'N/A'}
                                        </span>
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
