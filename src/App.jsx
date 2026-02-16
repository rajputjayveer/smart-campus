// Modern SouEats Application - Clean Version
import React, { useState, useEffect } from 'react';
import { Utensils, Package } from 'lucide-react';

// Authentication Components
import { LoginForm, RegisterForm } from './components/AuthForms';
import { ForgotPasswordForm, ResetPasswordForm } from './components/PasswordManagement';

// View Components
import CanteenView from './components/CanteenView';
import OrdersView from './components/OrdersView';
import AdminView from './components/AdminView';
import ProfileView from './components/ProfileView';
import ShopkeeperPanel from './components/ShopkeeperPanel';
import ChatbotWidget from './components/ChatbotWidget';

// Customer App with Navigation
const CustomerApp = ({ user, showToast }) => {
  const [activeTab, setActiveTab] = useState('canteen');
  
  return (
    <>
      {/* Navigation Tabs */}
      <div className="mb-6 flex flex-wrap gap-3 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('canteen')}
          className={`px-5 py-3 font-semibold transition-colors rounded-t-lg ${
            activeTab === 'canteen'
              ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Canteen
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 font-semibold transition-colors rounded-t-lg ${
            activeTab === 'orders'
              ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Orders
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 font-semibold transition-colors rounded-t-lg ${
            activeTab === 'profile'
              ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Profile
        </button>
      </div>

      {/* Content */}
      {activeTab === 'canteen' && <CanteenView user={user} showToast={showToast} />}
      {activeTab === 'orders' && <OrdersView user={user} showToast={showToast} />}
      {activeTab === 'profile' && <ProfileView user={user} />}
    </>
  );
};

// UI Components
import { Toast, useToast } from './components/Toast';

// Utilities
import api from './services/api';
import { auth } from './utils/cookies';

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-violet-100 via-indigo-100 to-cyan-100 flex flex-col items-center justify-center">
    <div className="text-center">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-6 w-24 h-24 mx-auto mb-6 animate-bounce">
        <Utensils className="h-12 w-12 text-white" />
      </div>
      <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
        SouEats
      </h1>
      <p className="text-xl text-gray-600 mt-4">Taste the Campus Vibe</p>
      <div className="mt-8 flex space-x-2 justify-center">
        <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  </div>
);

// Main App Component
export default function App() {
  // State Management
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const { toasts, removeToast, success, error: showError, info } = useToast();

  // Check for reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setShowResetPassword(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = auth.getToken();
      const storedUser = auth.getUser();

      if (token && storedUser) {
        try {
          setUser(storedUser);
          info('Welcome back, ' + storedUser.name + '!');
        } catch (err) {
          auth.logout();
        }
      }

      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // Handlers
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    success('Welcome, ' + userData.name + '!');
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    info('Logged out successfully');
  };

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show Forgot Password Screen
  if (showForgotPassword) {
    return (
      <>
        <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast key={toast.id} message={toast.message} type={toast.type} duration={toast.duration} onClose={() => removeToast(toast.id)} />
          ))}
        </div>
      </>
    );
  }

  // Show Reset Password Screen
  if (showResetPassword) {
    return (
      <>
        <ResetPasswordForm
          token={resetToken}
          onSuccess={() => {
            setShowResetPassword(false);
            setResetToken('');
            success('Password reset successful! Please login.');
          }}
        />
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast key={toast.id} message={toast.message} type={toast.type} duration={toast.duration} onClose={() => removeToast(toast.id)} />
          ))}
        </div>
      </>
    );
  }

  // Show Auth Forms (Login/Register)
  if (!user) {
    return (
      <>
        {showAuthForm === 'login' ? (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setShowAuthForm('register')}
            onForgotPassword={() => setShowForgotPassword(true)}
          />
        ) : (
          <RegisterForm
            onSuccess={handleLoginSuccess}
            onSwitchToLogin={() => setShowAuthForm('login')}
          />
        )}

        <div className="fixed top-20 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast key={toast.id} message={toast.message} type={toast.type} duration={toast.duration} onClose={() => removeToast(toast.id)} />
          ))}
        </div>
      </>
    );
  }

  // Main App (Authenticated) - Shows appropriate view based on user role
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-cyan-50">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-40 border-b border-indigo-100 bg-white/80 backdrop-blur-lg shadow-lg">
        <div className="h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
        <nav className="container mx-auto flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2.5 rounded-2xl shadow-lg">
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                SouEats
              </h1>
              <p className="text-xs font-medium text-gray-500">Smart Campus Food Hub</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white/70 px-3 py-2 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold">
                {(user.name || 'U').split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email || 'Campus account'}</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-all"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content - Show view based on role */}
      <main className="container mx-auto px-4 py-8">
        {user.role === 'customer' && <CustomerApp user={user} showToast={{ success, error: showError, info }} />}
        {user.role === 'shopkeeper' && <ShopkeeperPanel user={user} showToast={{ success, error: showError, info }} />}
        {user.role === 'admin' && <AdminView showToast={{ success, error: showError, info }} />}
      </main>

      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} duration={toast.duration} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* Chatbot */}
      <ChatbotWidget />
    </div>
  );
}
