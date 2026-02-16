// Enhanced AuthForms with Role Selection and Shopkeeper Approval
// Replaces existing Auth Forms.jsx

import { useState, useEffect } from 'react';
import { Mail, Lock, User, Building2, AlertCircle, CheckCircle, Eye, EyeOff, Store, UserCircle } from 'lucide-react';
import api from '../services/api';
import { auth } from '../utils/cookies';

// Login Form (unchanged, add forgot password link)
export function LoginForm({ onSuccess, onSwitchToRegister, onForgotPassword }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api.login(email, password);

            auth.login(data.token, {
                id: data.id,
                name: data.name,
                email: data.email,
                role: data.role,
                stallId: data.stallId,
                department: data.department
            });

            onSuccess(data);
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-indigo-100 to-cyan-100 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/50">
                <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                        <UserCircle className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Welcome Back
                    </h1>
                    <p className="text-gray-600 mt-2">Sign in to SouEats</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="text-right">
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                Signing In....
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                        >
                            Register Now
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

// Enhanced Register Form with Role Selection
export function RegisterForm({ onSuccess, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        role: 'customer', // 'customer' or 'shopkeeper'
        stallId: ''
    });
    const [stalls, setStalls] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingApproval, setPendingApproval] = useState(false);

    // Load available stalls when shopkeeper role is selected
    useEffect(() => {
        if (formData.role === 'shopkeeper') {
            loadStalls();
        }
    }, [formData.role]);

    const loadStalls = async () => {
        try {
            const stallsData = await api.getAllStalls();
            setStalls(stallsData);
        } catch (err) {
            console.error('Failed to load stalls:', err);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
        setSuccessMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        // Validate stall selection for shopkeeper
        if (formData.role === 'shopkeeper' && !formData.stallId) {
            setError('Please select a stall');
            return;
        }

        setLoading(true);

        try {
            const data = await api.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                department: formData.department,
                role: formData.role,
                stallId: formData.stallId ? parseInt(formData.stallId) : null
            });

            // If customer, auto-login
            if (formData.role === 'customer' && data.token) {
                auth.login(data.token, {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    department: formData.department
                });
                onSuccess(data);
            } else {
                // Shopkeeper - pending approval
                setPendingApproval(true);
                setSuccessMessage(data.message || 'Registration successful! Your account is pending admin approval.');
            }
        } catch (err) {
            setError(err.message || 'Registration failed. Email may already be in use.');
        } finally {
            setLoading(false);
        }
    };

    // Pending Approval Screen
    if (pendingApproval) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-100 via-indigo-100 to-cyan-100 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/50 text-center">
                    <div className="bg-yellow-100 rounded-full p-4 w-20 h-20 mx-auto mb-6">
                        <CheckCircle className="h-12 w-12 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Registration Successful!</h2>
                    <p className="text-gray-600 mb-6">{successMessage}</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-yellow-800">
                            ⏳ Your shopkeeper account is awaiting admin approval. You'll be able to login once approved.
                        </p>
                    </div>
                    <button
                        onClick={onSwitchToLogin}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-indigo-100 to-cyan-100 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/50">
                <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                        <User className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Join SouEats
                    </h1>
                    <p className="text-gray-600 mt-2">Create your account</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleChange('role', 'customer')}
                                className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${formData.role === 'customer'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                🧑 Customer
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange('role', 'shopkeeper')}
                                className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${formData.role === 'shopkeeper'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                🏪 Shopkeeper
                            </button>
                        </div>
                    </div>

                    {/* Stall Selection (only for shopkeepers) */}
                    {formData.role === 'shopkeeper' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Stall</label>
                            <div className="relative">
                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <select
                                    value={formData.stallId}
                                    onChange={(e) => handleChange('stallId', e.target.value)}
                                    required={formData.role === 'shopkeeper'}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
                                >
                                    <option value="">Choose a stall...</option>
                                    {stalls.map(stall => (
                                        <option key={stall.id} value={stall.id}>
                                            {stall.stallName} - {stall.specialty}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="John Doe"
                                required
                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="your.email@example.com"
                                required
                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => handleChange('department', e.target.value)}
                                placeholder="Computer Engineering"
                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Shopkeeper Notice */}
                    {formData.role === 'shopkeeper' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-blue-800">
                                ℹ️ Shopkeeper accounts require admin approval before you can login
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                Creating Account...
                            </div>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
