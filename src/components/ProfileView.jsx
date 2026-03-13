import { useState } from 'react';
import { User, Mail, Shield, Hash, Calendar, Phone, Key, ChevronRight, Sparkles } from 'lucide-react';
import api from '../services/api';

const InfoRow = ({ icon: Icon, label, value, accent }) => (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 card-hover group">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${accent || 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}>
                <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-gray-500">{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
);

export default function ProfileView({ user }) {
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [changing, setChanging] = useState(false);
    const [message, setMessage] = useState(null);

    const displayName = user?.name || 'Student';
    const displayEmail = user?.email || 'Not provided';
    const displayRole = user?.role || 'user';
    const displayId = user?.id || 'N/A';
    const displayPhone = user?.phone || user?.mobile || 'Not provided';
    const displayCreatedAt = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

    const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'U';

    const handleChangePassword = async () => {
        setMessage(null);
        if (passwords.new.length < 6) { setMessage({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
        if (passwords.new !== passwords.confirm) { setMessage({ type: 'error', text: 'Passwords do not match' }); return; }
        try {
            setChanging(true);
            await api.changePassword(passwords.current, passwords.new);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswords({ current: '', new: '', confirm: '' });
            setTimeout(() => setShowChangePassword(false), 1500);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to change password' });
        } finally {
            setChanging(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-5 h-full overflow-y-auto no-scrollbar pb-24 lg:pb-8 px-2">
            {/* Profile Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 h-28" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="absolute top-8 right-12 w-20 h-20 bg-white/5 rounded-full" />

                <div className="relative pt-16 pb-6 px-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-black shadow-xl ring-4 ring-white -mt-4">
                            {initials}
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <h2 className="text-2xl font-extrabold text-gray-900">{displayName}</h2>
                            <p className="text-sm text-gray-500">{displayEmail}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 border border-indigo-100">
                                {displayRole}
                            </span>
                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-100">
                                <Sparkles className="h-3 w-3" />
                                Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Details */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Account Details</h3>
                <div className="space-y-2">
                    <InfoRow icon={User} label="Full Name" value={displayName} />
                    <InfoRow icon={Mail} label="Email" value={displayEmail} accent="bg-blue-50 text-blue-600 group-hover:bg-blue-100" />
                    <InfoRow icon={Phone} label="Phone" value={displayPhone} accent="bg-green-50 text-green-600 group-hover:bg-green-100" />
                    <InfoRow icon={Shield} label="Role" value={displayRole} accent="bg-purple-50 text-purple-600 group-hover:bg-purple-100" />
                    <InfoRow icon={Hash} label="User ID" value={typeof displayId === 'string' && displayId.length > 12 ? displayId.substring(0, 12) + '...' : displayId} accent="bg-gray-100 text-gray-600 group-hover:bg-gray-200" />
                    <InfoRow icon={Calendar} label="Member Since" value={displayCreatedAt} accent="bg-amber-50 text-amber-600 group-hover:bg-amber-100" />
                </div>
            </div>

            {/* Change Password */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Security</h3>
                {!showChangePassword ? (
                    <button
                        onClick={() => setShowChangePassword(true)}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 card-hover group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
                                <Key className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Change Password</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3 slide-up shadow-sm">
                        {message && (
                            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                {message.text}
                            </div>
                        )}
                        <input type="password" placeholder="Current Password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                        <input type="password" placeholder="New Password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                        <input type="password" placeholder="Confirm New Password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => { setShowChangePassword(false); setMessage(null); }} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleChangePassword} disabled={changing} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md">
                                {changing ? 'Changing...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
