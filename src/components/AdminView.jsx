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
        <div className="max-w-7xl w-full mx-auto flex-1 min-h-0 flex flex-col overflow-hidden transition-all">
            {/* Admin Header Section (Fixed at top of panel) */}
            <div className="mb-4 sm:mb-6 flex-shrink-0 px-2 pt-2">
                <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

                {/* Navigation Tabs - Horizontal Scroll on Mobile */}
                <div className="flex space-x-2 bg-gray-100/80 backdrop-blur rounded-lg p-1 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('shopkeepers')}
                        className={`flex items-center px-4 py-2 rounded-md transition-all whitespace-nowrap font-medium ${activeTab === 'shopkeepers'
                            ? 'bg-white shadow-sm text-indigo-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        <Users className="h-5 w-5 mr-2" />
                        Shopkeeper Approvals
                    </button>

                    <button
                        onClick={() => setActiveTab('stalls')}
                        className={`flex items-center px-4 py-2 rounded-md transition-all whitespace-nowrap font-medium ${activeTab === 'stalls'
                            ? 'bg-white shadow-sm text-indigo-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        <Store className="h-5 w-5 mr-2" />
                        Manage Stalls
                    </button>

                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`flex items-center px-4 py-2 rounded-md transition-all whitespace-nowrap font-medium ${activeTab === 'menu'
                            ? 'bg-white shadow-sm text-indigo-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        <Settings className="h-5 w-5 mr-2" />
                        Manage Menu
                    </button>

                    <button
                        onClick={() => setActiveTab('feedback')}
                        className={`flex items-center px-4 py-2 rounded-md transition-all whitespace-nowrap font-medium ${activeTab === 'feedback'
                            ? 'bg-white shadow-sm text-indigo-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        <Lightbulb className="h-5 w-5 mr-2" />
                        Feedback Insights
                    </button>

                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`flex items-center px-4 py-2 rounded-md transition-all whitespace-nowrap font-medium ${activeTab === 'coupons'
                            ? 'bg-white shadow-sm text-indigo-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        <Ticket className="h-5 w-5 mr-2" />
                        Coupons
                    </button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-24 lg:pb-8">
                {activeTab === 'shopkeepers' && <AdminShopkeeperPanel />}
                {activeTab === 'stalls' && <StallManagement showToast={showToast} />}
                {activeTab === 'menu' && <MenuManagement showToast={showToast} />}
                {activeTab === 'feedback' && <FeedbackInsights showToast={showToast} />}
                {activeTab === 'coupons' && <CouponManagement showToast={showToast} />}
            </div>
        </div>
    );
}
