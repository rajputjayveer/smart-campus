// User Profile View - Account details and security
import { User, Mail, Shield, Hash, Calendar, Phone } from 'lucide-react';

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white/80 px-4 py-3">
        <div className="flex items-center">
            <div className="mr-3 rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
);

export default function ProfileView({ user }) {
    const displayName = user?.name || 'Student';
    const displayEmail = user?.email || 'Not provided';
    const displayRole = user?.role || 'user';
    const displayId = user?.id || 'N/A';
    const displayPhone = user?.phone || user?.mobile || 'Not provided';
    const displayCreatedAt = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join('') || 'U';

    return (
        <div className="max-w-6xl mx-auto space-y-6 h-full overflow-y-auto no-scrollbar pb-24 lg:pb-8 px-2">
            <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white/80 p-6 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-purple-50 to-cyan-50 opacity-70"></div>
                <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
                            <p className="text-sm text-gray-600">{displayEmail}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                            {displayRole}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Active
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Account Details</h3>
                <InfoRow icon={User} label="Full Name" value={displayName} />
                <InfoRow icon={Mail} label="Email Address" value={displayEmail} />
                <InfoRow icon={Phone} label="Phone Number" value={displayPhone} />
                <InfoRow icon={Shield} label="Role" value={displayRole} />
                <InfoRow icon={Hash} label="User ID" value={displayId} />
                <InfoRow icon={Calendar} label="Member Since" value={displayCreatedAt} />
            </div>
        </div>
    );
}
