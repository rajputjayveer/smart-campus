// Full Admin Panel - Shopkeeper approvals AND stall management
import { useState } from 'react';
import { Store, Users, Settings, Lightbulb, Ticket } from 'lucide-react';
import { AdminShopkeeperPanel } from './AdminShopkeeperPanel';
import StallManagement from './StallManagement';
import MenuManagement from './MenuManagement';
import FeedbackInsights from './FeedbackInsights';
import CouponManagement from './CouponManagement';

export default function AdminView({ showToast }) {
    const [activeTab, setActiveTab] = useState('shopkeepers');

    return (
        <div className="max-w-7xl mx-auto">
            {/* Admin Navigation */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

                <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('shopkeepers')}
                        className={`flex items-center px-4 py-2 rounded-md transition-all ${activeTab === 'shopkeepers'
                                ? 'bg-white shadow-md text-indigo-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <Users className="h-5 w-5 mr-2" />
                        Shopkeeper Approvals
                    </button>

                    <button
                        onClick={() => setActiveTab('stalls')}
                        className={`flex items-center px-4 py-2 rounded-md transition-all ${activeTab === 'stalls'
                                ? 'bg-white shadow-md text-indigo-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <Store className="h-5 w-5 mr-2" />
                        Manage Stalls
                    </button>

                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`flex items-center px-4 py-2 rounded-md transition-all ${activeTab === 'menu'
                                ? 'bg-white shadow-md text-indigo-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <Settings className="h-5 w-5 mr-2" />
                        Manage Menu
                    </button>

                    <button
                        onClick={() => setActiveTab('feedback')}
                        className={`flex items-center px-4 py-2 rounded-md transition-all ${activeTab === 'feedback'
                                ? 'bg-white shadow-md text-indigo-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <Lightbulb className="h-5 w-5 mr-2" />
                        Feedback Insights
                    </button>

                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`flex items-center px-4 py-2 rounded-md transition-all ${activeTab === 'coupons'
                                ? 'bg-white shadow-md text-indigo-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <Ticket className="h-5 w-5 mr-2" />
                        Coupons
                    </button>
                </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'shopkeepers' && <AdminShopkeeperPanel />}
            {activeTab === 'stalls' && <StallManagement showToast={showToast} />}
            {activeTab === 'menu' && <MenuManagement showToast={showToast} />}
            {activeTab === 'feedback' && <FeedbackInsights showToast={showToast} />}
            {activeTab === 'coupons' && <CouponManagement showToast={showToast} />}
        </div>
    );
}
