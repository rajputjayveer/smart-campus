import React, { useState, useEffect } from 'react';
import { Utensils, Package, UserCircle, LogOut, ChefHat } from 'lucide-react';

import { LoginForm, RegisterForm } from './components/AuthForms';
import { ForgotPasswordForm, ResetPasswordForm } from './components/PasswordManagement';

import CanteenView from './components/CanteenView';
import OrdersView from './components/OrdersView';
import AdminView from './components/AdminView';
import ProfileView from './components/ProfileView';
import ShopkeeperPanel from './components/ShopkeeperPanel';
import ChatbotWidget from './components/ChatbotWidget';

const navItems = [
  { id: 'canteen', label: 'Canteen', icon: Utensils },
  { id: 'orders',  label: 'My Orders', icon: Package },
  { id: 'profile', label: 'Profile', icon: UserCircle },
];

const CustomerApp = ({ user, showToast }) => {
  const [activeTab, setActiveTab] = useState('canteen');

  useEffect(() => {
    const handleNav = () => setActiveTab('canteen');
    window.addEventListener('navigate_to_canteen', handleNav);
    return () => window.removeEventListener('navigate_to_canteen', handleNav);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Pill Navigation */}
      <div className="mb-4 sm:mb-5 flex-shrink-0">
        <div className="flex gap-1.5 sm:gap-2 p-1 bg-gray-100/80 rounded-2xl w-fit">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
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

      <div className="flex-1 overflow-hidden relative">
        <div className={activeTab === 'canteen' ? 'h-full' : 'hidden'}><CanteenView user={user} showToast={showToast} /></div>
        <div className={activeTab === 'orders'  ? 'h-full' : 'hidden'}><OrdersView  user={user} showToast={showToast} /></div>
        <div className={activeTab === 'profile' ? 'h-full' : 'hidden'}><ProfileView user={user} /></div>
      </div>
    </div>
  );
};

import { Toast, useToast } from './components/Toast';
import api from './services/api';
import { auth } from './utils/cookies';
import { CartProvider } from './context/CartContext';

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-cyan-50 flex flex-col items-center justify-center relative overflow-hidden">
    {/* Decorative blobs */}
    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
    <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
    <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>

    <div className="relative text-center slide-up">
      <div className="relative mx-auto mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-xl opacity-40 animate-pulse-soft"></div>
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-5 w-20 h-20 mx-auto flex items-center justify-center shadow-2xl">
          <ChefHat className="h-10 w-10 text-white" />
        </div>
      </div>

      <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight">
        SouEats
      </h1>
      <p className="text-lg text-gray-500 mt-3 font-medium tracking-wide">Taste the Campus Vibe</p>

      <div className="mt-10 flex space-x-2 justify-center">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.8s' }}
          />
        ))}
      </div>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const { toasts, removeToast, success, error: showError, info } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setShowResetPassword(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const token = auth.getToken();
      const storedUser = auth.getUser();
      if (token && storedUser) {
        try {
          setUser(storedUser);
          info('Welcome back, ' + storedUser.name + '!');
        } catch {
          auth.logout();
        }
      }
      setIsLoading(false);
    };
    restoreSession();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    success('Welcome, ' + userData.name + '!');
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    info('Logged out successfully');
  };

  const toastOverlay = (
    <div className="fixed top-4 right-4 z-[100] flex flex-col items-end gap-2.5">
      {toasts.map((toast, index) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} duration={toast.duration} index={index} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );

  if (isLoading) return <LoadingScreen />;

  if (showForgotPassword) return (<><ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />{toastOverlay}</>);
  if (showResetPassword) return (<><ResetPasswordForm token={resetToken} onSuccess={() => { setShowResetPassword(false); setResetToken(''); success('Password reset successful! Please login.'); }} />{toastOverlay}</>);

  if (!user) {
    return (
      <>
        {showAuthForm === 'login' ? (
          <LoginForm onSuccess={handleLoginSuccess} onSwitchToRegister={() => setShowAuthForm('register')} onForgotPassword={() => setShowForgotPassword(true)} />
        ) : (
          <RegisterForm onSuccess={handleLoginSuccess} onSwitchToLogin={() => setShowAuthForm('login')} />
        )}
        {toastOverlay}
      </>
    );
  }

  const showToast = { success, error: showError, info };
  const initials = (user.name || 'U').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-cyan-50/40">
      {/* Header */}
      <header className="z-40 flex-shrink-0 border-b border-gray-200/60 glass shadow-sm">
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <nav className="container mx-auto flex items-center justify-between px-4 py-2.5 sm:py-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-2 rounded-xl shadow-lg shadow-indigo-200/50">
              <ChefHat className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent leading-none">
                SouEats
              </h1>
              <p className="text-[10px] font-medium text-gray-400 tracking-wider uppercase hidden sm:block">Smart Campus Food Hub</p>
            </div>
          </div>

          {/* User info + Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 rounded-xl border border-gray-200/60 bg-white/60 px-2.5 sm:px-3 py-1.5 sm:py-2">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-md">
                {initials}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-[11px] text-gray-400">{user.email || 'Campus account'}</p>
              </div>
              <span className="rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-indigo-600 uppercase tracking-wider border border-indigo-100">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl border border-red-200/60 bg-red-50/50 text-red-600 hover:bg-red-100 transition-all group"
              title="Logout"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline ml-1.5 text-sm font-semibold">Logout</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-5 flex-1 overflow-hidden flex flex-col">
        {user.role === 'customer' && (
          <CartProvider>
            <CustomerApp user={user} showToast={showToast} />
            <ChatbotWidget onNavigateToCanteen={() => window.dispatchEvent(new Event('navigate_to_canteen'))} />
          </CartProvider>
        )}
        {user.role === 'shopkeeper' && <ShopkeeperPanel user={user} showToast={showToast} />}
        {user.role === 'admin' && <AdminView showToast={showToast} />}
      </main>

      {toastOverlay}
    </div>
  );
}
