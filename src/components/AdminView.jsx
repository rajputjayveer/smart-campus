import { useState } from 'react';
import { Store, Users, Settings, Lightbulb, Ticket, LayoutDashboard } from 'lucide-react';
import { AdminShopkeeperPanel } from './AdminShopkeeperPanel';
import StallManagement from './StallManagement';
import MenuManagement from './MenuManagement';
import FeedbackInsights from './FeedbackInsights';
import CouponManagement from './CouponManagement';

const tabs = [
    { id: 'shopkeepers', label: 'Shopkeepers', icon: Users },
    { id: 'stalls',      label: 'Stalls',      icon: Store },
    { id: 'menu',        label: 'Menu',         icon: Settings },
    { id: 'feedback',    label: 'Feedback',     icon: Lightbulb },
    { id: 'coupons',     label: 'Coupons',      icon: Ticket },
];

export default function AdminView({ showToast }) {
    const [activeTab, setActiveTab] = useState('shopkeepers');

    return (
        <div className="max-w-7xl w-full mx-auto flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="mb-4 sm:mb-5 flex-shrink-0 px-1 pt-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-200/50">
                        <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">Admin Dashboard</h1>
                        <p className="text-xs text-gray-400 font-medium">Manage everything from one place</p>
                    </div>
                </div>

                {/* Pill Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100/80 rounded-2xl overflow-x-auto no-scrollbar w-fit">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                                activeTab === id
                                    ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                            }`}
                        >
                            <Icon className={`h-4 w-4 ${activeTab === id ? 'text-indigo-600' : ''}`} />
                            <span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-1 pb-24 lg:pb-8">
                {activeTab === 'shopkeepers' && <AdminShopkeeperPanel />}
                {activeTab === 'stalls' && <StallManagement showToast={showToast} />}
                {activeTab === 'menu' && <MenuManagement showToast={showToast} />}
                {activeTab === 'feedback' && <FeedbackInsights showToast={showToast} />}
                {activeTab === 'coupons' && <CouponManagement showToast={showToast} />}
            </div>
        </div>
    );
}
