/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HistoryItem, CalculatorMode, VaultMediaItem } from './types';
import ScientificCalculator from './components/ScientificCalculator';
import CurrencyConverter from './components/CurrencyConverter';
import HistoryLog from './components/HistoryLog';
import MediaVault from './components/MediaVault';
import AdminPanel from './components/AdminPanel';
import { 
  Calculator, 
  Coins, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  X, 
  FolderOpen,
  User,
  Shield,
  LogOut,
  KeyRound
} from 'lucide-react';

export default function App() {
  // Tabs for mobile/small responsive screen layout
  const [activeTab, setActiveTab] = useState<'calculator' | 'currency' | 'history'>('calculator');
  
  // Angle measurement mode ('degree' | 'radian')
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('degree');
  
  // Passcode modal state
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [inputPasscode, setInputPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  // Authenticated User & Cloud Backups Storage State
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem('omnicalc_logged_in_user') || null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Admin Session States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('omnicalc_admin_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('omnicalc_admin_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Whether a passcode has been set up yet (first-time detection)
  const [isPasscodeSetUp, setIsPasscodeSetUp] = useState<boolean>(() => {
    try {
      const config = localStorage.getItem('omnicalc_vault_passcode_configured');
      return config === 'true';
    } catch {
      return false;
    }
  });

  // State variables for the setup form
  const [setupPasscode, setSetupPasscode] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupError, setSetupError] = useState('');
  
  // Key state for the secret passcode lock vault
  const [vaultUnlocked, setVaultUnlocked] = useState<boolean>(false);
  const [vaultPasscode, setVaultPasscode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('omnicalc_vault_passcode');
      return saved || '1234';
    } catch {
      return '1234';
    }
  });

  // History log data with localStorage persistence
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('calc_conv_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track values to restore from history logs
  const [restoreCalculatorExpr, setRestoreCalculatorExpr] = useState<string | null>(null);
  const [restoreCurrencyState, setRestoreCurrencyState] = useState<{
    from: string;
    to: string;
    amount: string;
  } | null>(null);

  // Synchronize history state back to local storage
  useEffect(() => {
    try {
      localStorage.setItem('calc_conv_history', JSON.stringify(historyItems));
    } catch (err) {
      console.error('Failed to persist history items', err);
    }
  }, [historyItems]);

  const handleAddHistory = (
    expression: string,
    result: string,
    type: 'calculator' | 'currency',
    details?: string
  ) => {
    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      expression,
      result,
      timestamp: Date.now(),
      type,
      details,
    };
    setHistoryItems((prev) => [newItem, ...prev]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistoryItems([]);
  };

  const handleRestoreItem = (item: HistoryItem) => {
    if (item.type === 'calculator') {
      setRestoreCalculatorExpr(item.expression);
      setActiveTab('calculator');
    } else {
      try {
        const fromMatch = item.expression.match(/([\d.]+)\s*([A-Z]{3})/);
        const toMatch = item.result.match(/([\d.]+)\s*([A-Z]{3})/);

        if (fromMatch && toMatch) {
          setRestoreCurrencyState({
            amount: fromMatch[1],
            from: fromMatch[2],
            to: toMatch[2],
          });
          setActiveTab('currency');
        }
      } catch (err) {
        console.error('Error recovering currency log state', err);
      }
    }
  };

  const handleToggleModeSelection = () => {
    setCalculatorMode((prev) => (prev === 'degree' ? 'radian' : 'degree'));
  };

  const handleSaveNewPasscode = (newPass: string) => {
    setVaultPasscode(newPass);
    setIsPasscodeSetUp(true);
    try {
      localStorage.setItem('omnicalc_vault_passcode', newPass);
      localStorage.setItem('omnicalc_vault_passcode_configured', 'true');
    } catch (err) {
      console.error(err);
    }
  };

  // Synchronise or load Secure Vault Items to keep App and Admin Panel in alignment
  const [vaultItems, setVaultItems] = useState<VaultMediaItem[]>([]);

  const loadVaultItemsFromStorage = () => {
    try {
      const saved = localStorage.getItem('omnicalc_vault_items');
      if (saved) {
        setVaultItems(JSON.parse(saved));
      } else {
        // Fallback default demo assets catalog directly matches MediaVault's original defaults
        const defaults: VaultMediaItem[] = [
          {
            id: 'p-0',
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
            name: 'Encrypted Sunset.jpg',
            size: '184 KB',
            timestamp: Date.now()
          },
          {
            id: 'p-1',
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800',
            name: 'Secure Blueprint.jpg',
            size: '342 KB',
            timestamp: Date.now() - 86400000
          },
          {
            id: 'p-2',
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=800',
            name: 'Encrypted Safe Key.jpg',
            size: '115 KB',
            timestamp: Date.now() - 172800000
          },
          {
            id: 'v-0',
            type: 'video',
            url: 'https://assets.mixkit.co/videos/preview/mixkit-encryption-keys-and-padlocks-on-a-digital-screen-34316-large.mp4',
            name: 'Private Vault Intro.mp4',
            size: '2.4 MB',
            timestamp: Date.now() - 120000000
          },
          {
            id: 'v-1',
            type: 'video',
            url: 'https://assets.mixkit.co/videos/preview/mixkit-green-code-lines-on-a-black-screen-40114-large.mp4',
            name: 'Secret Matrix Code.mp4',
            size: '1.8 MB',
            timestamp: Date.now() - 240000000
          }
        ];
        setVaultItems(defaults);
        localStorage.setItem('omnicalc_vault_items', JSON.stringify(defaults));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadVaultItemsFromStorage();
  }, [vaultUnlocked, isAdminView]);

  // Synchronise user state (vault items, history, password configurations) with server database for cloud backup
  useEffect(() => {
    if (!currentUser) return;
    
    const syncData = async () => {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: currentUser,
            vaultItems,
            vaultPasscode,
            isPasscodeSetUp,
            history: historyItems,
          }),
        });
      } catch (err) {
        console.error('Auto backup synchronization failed:', err);
      }
    };

    // Debounce to prevent heavy file transfer requests on every keypress / upload phase
    const timeout = setTimeout(syncData, 1000);
    return () => clearTimeout(timeout);
  }, [currentUser, vaultItems, vaultPasscode, isPasscodeSetUp, historyItems]);

  // Administration mutation helpers
  const handleUpdateHistoryItem = (id: string, newExpr: string, newRes: string) => {
    setHistoryItems((prev) => 
      prev.map((item) => item.id === id ? { ...item, expression: newExpr, result: newRes } : item)
    );
  };

  const handleResetPasscodeConfig = () => {
    setIsPasscodeSetUp(false);
    try {
      localStorage.removeItem('omnicalc_vault_passcode_configured');
      setVaultPasscode('1234');
      localStorage.setItem('omnicalc_vault_passcode', '1234');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVaultItem = (id: string) => {
    const updated = vaultItems.filter((i) => i.id !== id);
    setVaultItems(updated);
    try {
      localStorage.setItem('omnicalc_vault_items', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleInjectSampleAssets = (assets: VaultMediaItem[]) => {
    const updated = [...assets, ...vaultItems];
    setVaultItems(updated);
    try {
      localStorage.setItem('omnicalc_vault_items', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);

    const email = authEmail.trim();
    const password = authPassword;

    if (!email || !password) {
      setAuthError('Email and password are required fields.');
      setIsAuthLoading(false);
      return;
    }

    if (authMode === 'register' && password !== authConfirmPassword) {
      setAuthError('Confirm password does not match.');
      setIsAuthLoading(false);
      return;
    }

    try {
      const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type');
      let data: any;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (Status: ${response.status}). ${text.slice(0, 120)}`);
      }

      if (!response.ok) {
        setAuthError(data.error || 'An error occurred during authentication.');
        setIsAuthLoading(false);
        return;
      }

      // Success branch
      const adminEmails = ["ab405127@gmail.com", "ab4051027@gmail.com"];
      const isAdmin = adminEmails.includes(email.toLowerCase()) && password === "famousankit@123";

      if (isAdmin || data.isAdmin) {
        setIsAdminLoggedIn(true);
        setIsAdminView(true);
        sessionStorage.setItem('omnicalc_admin_logged_in', 'true');
      } else {
        setIsAdminLoggedIn(false);
        setIsAdminView(false);
        sessionStorage.removeItem('omnicalc_admin_logged_in');
      }

      setCurrentUser(data.email);
      localStorage.setItem('omnicalc_logged_in_user', data.email);

      // Save user metrics retrieved from backend backup
      if (data.vaultItems) {
        setVaultItems(data.vaultItems);
        localStorage.setItem('omnicalc_vault_items', JSON.stringify(data.vaultItems));
      } else {
        setVaultItems([]);
        localStorage.setItem('omnicalc_vault_items', JSON.stringify([]));
      }

      if (data.history) {
        setHistoryItems(data.history);
        localStorage.setItem('calc_conv_history', JSON.stringify(data.history));
      } else {
        setHistoryItems([]);
        localStorage.setItem('calc_conv_history', JSON.stringify([]));
      }

      if (data.vaultPasscode) {
        setVaultPasscode(data.vaultPasscode);
        localStorage.setItem('omnicalc_vault_passcode', data.vaultPasscode);
      } else {
        setVaultPasscode('1234');
        localStorage.setItem('omnicalc_vault_passcode', '1234');
      }

      if (data.isPasscodeSetUp !== undefined) {
        setIsPasscodeSetUp(data.isPasscodeSetUp);
        localStorage.setItem('omnicalc_vault_passcode_configured', JSON.stringify(data.isPasscodeSetUp));
      } else {
        setIsPasscodeSetUp(false);
        localStorage.setItem('omnicalc_vault_passcode_configured', 'false');
      }

      setAuthSuccess(authMode === 'login' ? 'Welcome back! Syncing backup...' : 'Account registered successfully!');
      setTimeout(() => {
        setIsAuthLoading(false);
      }, 500);

    } catch (err: any) {
      setAuthError(`Connection Error: ${err?.message || err || 'Could not establish connection.'}`);
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setIsAdminView(false);
    setVaultUnlocked(false);
    
    // Clear state caches
    setVaultItems([]);
    setHistoryItems([]);
    setVaultPasscode('1234');
    setIsPasscodeSetUp(false);

    try {
      localStorage.removeItem('omnicalc_logged_in_user');
      localStorage.removeItem('omnicalc_vault_items');
      localStorage.removeItem('calc_conv_history');
      localStorage.removeItem('omnicalc_vault_passcode');
      localStorage.removeItem('omnicalc_vault_passcode_configured');
      sessionStorage.removeItem('omnicalc_admin_logged_in');
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser) {
    return (
      <div className="h-screen w-screen overflow-y-auto flex items-center justify-center bg-slate-950 text-slate-100 font-sans p-4 relative antialiased selection:bg-indigo-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />
        
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-md p-7 sm:p-9 shadow-2xl relative z-10 transition-all duration-300">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3.5 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-4 animate-pulse">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">OmniCalc Vault Workspace</h1>
            <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs">
              Secure calculator and encrypted media folder. Backup instantly across all mobile and workspace devices.
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-slate-950/60 p-1.5 rounded-xl mb-6 border border-slate-800/60">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition duration-200 cursor-pointer ${
                authMode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In / Login
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition duration-200 cursor-pointer ${
                authMode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 px-1">
                Gmail Address
              </label>
              <input
                type="email"
                required
                placeholder="you@gmail.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full text-xs px-4 py-3 bg-slate-950 border border-slate-800/80 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition font-mono pr-4"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 px-1">
                Security Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter passcode/password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full text-xs px-4 py-3 bg-slate-950 border border-slate-800/80 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition font-mono pr-4"
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 px-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  className="w-full text-xs px-4 py-3 bg-slate-950 border border-slate-800/80 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition font-mono pr-4"
                />
              </div>
            )}

            {authError && (
              <p className="text-[10px] text-rose-400 font-bold text-center bg-rose-500/10 py-2.5 px-3 rounded-lg border border-rose-500/20 font-sans leading-normal">
                {authError}
              </p>
            )}

            {authSuccess && (
              <p className="text-[10px] text-emerald-400 font-bold text-center bg-emerald-500/10 py-2.5 px-3 rounded-lg border border-emerald-500/20 text-emerald-400 font-sans">
                {authSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isAuthLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Configuring Session pairing...</span>
                </>
              ) : (
                <span>{authMode === 'login' ? 'Proceed & Access Workspace' : 'Submit Registration'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/60 text-center flex flex-col items-center">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full-stack automated backup sync layer is live</span>
            </span>
            <p className="text-[9px] text-slate-500 mt-2 max-w-xs leading-normal">
              Admin logins automatically mount active monitoring dashboards.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen max-h-screen overflow-hidden flex flex-col antialiased transition-colors duration-300 ${
      vaultUnlocked ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-850'
    }`}>
      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col min-h-0 overflow-hidden">

        {/* Render fully unlocked private folder inside workspace if triggered */}
        {vaultUnlocked ? (
          <div className="flex-1 max-w-4xl mx-auto w-full min-h-0 overflow-hidden py-1">
            <MediaVault
              onLock={() => setVaultUnlocked(false)}
              vaultPasscode={vaultPasscode}
              onChangePasscode={handleSaveNewPasscode}
            />
          </div>
        ) : isAdminView && isAdminLoggedIn ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <AdminPanel
              historyItems={historyItems}
              vaultItems={vaultItems}
              vaultPasscode={vaultPasscode}
              isPasscodeSetUp={isPasscodeSetUp}
              onClose={() => setIsAdminView(false)}
              onClearAllHistory={handleClearAllHistory}
              onDeleteHistoryItem={handleDeleteHistoryItem}
              onUpdateHistoryItem={handleUpdateHistoryItem}
              onChangePasscode={handleSaveNewPasscode}
              onResetPasscodeConfig={handleResetPasscodeConfig}
              onDeleteVaultItem={handleDeleteVaultItem}
              onInjectSampleAssets={handleInjectSampleAssets}
              adminEmail={loginEmail || currentUser || 'ab405127@gmail.com'}
            />
          </div>
        ) : (
          <>
            {/* Mobile/Tablet tab switcher row */}
            <div className="flex lg:hidden bg-slate-200/50 p-1 rounded-xl mb-4 space-x-1 border border-slate-200 shrink-0">
              <button
                id="tab-calculator"
                onClick={() => setActiveTab('calculator')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'calculator'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                }`}
              >
                <Calculator className="w-4 h-4" />
                Calculator
              </button>
              <button
                id="tab-currency"
                onClick={() => setActiveTab('currency')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'currency'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                }`}
              >
                <Coins className="w-4 h-4" />
                Converter
              </button>
              <button
                id="tab-history"
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition relative ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                }`}
              >
                <Clock className="w-4 h-4" />
                History
                {historyItems.length > 0 && (
                  <span className="absolute top-1 right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-indigo-500 rounded-full transform translate-x-1/2 -translate-y-1/2">
                    {historyItems.length}
                  </span>
                )}
              </button>
            </div>

            {/* Responsive layout distribution grids */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-0 overflow-hidden">
              
              {/* Main Workspace Left & Center: Calculator & Currency elements */}
              <div className="lg:col-span-8 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden items-stretch">
                
                {/* Scientific Calculator Box Display */}
                <div className={`flex flex-col flex-1 min-h-0 min-w-[340px] ${(activeTab === 'calculator' || activeTab === 'history') ? 'flex' : 'hidden lg:flex'}`}>
                  <ScientificCalculator
                    mode={calculatorMode}
                    onModeToggle={handleToggleModeSelection}
                    onAddHistory={handleAddHistory}
                    restoreExpression={restoreCalculatorExpr}
                    onClearRestore={() => setRestoreCalculatorExpr(null)}
                    secretPasscode={vaultPasscode}
                    onUnlockVault={() => setVaultUnlocked(true)}
                  />
                </div>

                {/* Currency Converter Box Display */}
                <div className={`flex flex-col flex-1 min-h-0 min-w-[300px] ${(activeTab === 'currency' || activeTab === 'history') ? 'flex' : 'hidden lg:flex'}`}>
                  <CurrencyConverter
                    onAddHistory={handleAddHistory}
                    restoreState={restoreCurrencyState}
                    onClearRestore={() => setRestoreCurrencyState(null)}
                  />
                </div>
              </div>

              {/* History Sidebar Panel Right Column (shows directly on desktop, inside active tab on mobile) */}
              <div id="side-history-panel" className={`lg:col-span-4 flex flex-col h-full min-h-0 overflow-hidden ${activeTab === 'history' ? 'flex' : 'hidden lg:flex'}`}>
                <HistoryLog
                  items={historyItems}
                  onClearAll={handleClearAllHistory}
                  onDeleteItem={handleDeleteHistoryItem}
                  onRestoreItem={handleRestoreItem}
                  onOpenVault={() => {
                    setShowPasscodeModal(true);
                    setInputPasscode('');
                    setPasscodeError(false);
                    setSetupPasscode('');
                    setSetupConfirm('');
                    setSetupError('');
                  }}
                  showOpenVault={!isPasscodeSetUp}
                  currentUser={currentUser}
                  isAdminLoggedIn={isAdminLoggedIn}
                  isAdminView={isAdminView}
                  onToggleAdminView={() => setIsAdminView(!isAdminView)}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Numeric Passcode Entry/Setup Lightbox modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-slate-100 font-sans">
            <button
              onClick={() => setShowPasscodeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1 hover:bg-slate-800 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            
            {!isPasscodeSetUp ? (
              <>
                <div className="flex flex-col items-center text-center mt-3 mb-5">
                  <div className="p-3 bg-indigo-500/15 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-3.5 animate-pulse">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Setup Hidden Folder Passcode</h3>
                  <p className="text-[11px] text-slate-400 mt-1">This is your first time. Please choose a numeric passcode to hide your private folders.</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!setupPasscode || !/^[0-9]+$/.test(setupPasscode)) {
                      setSetupError('Passcode must contain digits only.');
                      return;
                    }
                    if (setupPasscode.length < 4) {
                      setSetupError('Passcode must be at least 4 digits.');
                      return;
                    }
                    if (setupPasscode !== setupConfirm) {
                      setSetupError('Passcodes do not match.');
                      return;
                    }

                    // Save passcode, mark setup as active and open the vault
                    handleSaveNewPasscode(setupPasscode);
                    setVaultUnlocked(true);
                    setShowPasscodeModal(false);
                    setSetupPasscode('');
                    setSetupConfirm('');
                    setSetupError('');
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 px-1">
                        Choose Passcode (numeric)
                      </label>
                      <input
                        type="password"
                        placeholder="e.g. 1984"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        autoFocus
                        required
                        value={setupPasscode}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || /^[0-9]+$/.test(val)) setSetupPasscode(val);
                        }}
                        className="w-full text-center tracking-widest text-lg font-bold font-mono px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 px-1">
                        Confirm Passcode
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter passcode"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        required
                        value={setupConfirm}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || /^[0-9]+$/.test(val)) setSetupConfirm(val);
                        }}
                        className="w-full text-center tracking-widest text-lg font-bold font-mono px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  {setupError && (
                    <p className="text-[11px] text-rose-550 font-bold text-center">
                      {setupError}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPasscodeModal(false)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
                    >
                      Set & Open Folder
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center mt-3 mb-5">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-3.5">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Enter Folder Passcode</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Provide passcode to access hidden folder workspace</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputPasscode === vaultPasscode) {
                      setVaultUnlocked(true);
                      setShowPasscodeModal(false);
                      setInputPasscode('');
                      setPasscodeError(false);
                    } else {
                      setPasscodeError(true);
                      setTimeout(() => setPasscodeError(false), 2000);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <input
                      type="password"
                      placeholder="Enter digits/code"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      autoFocus
                      required
                      value={inputPasscode}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val || /^[0-9]+$/.test(val)) setInputPasscode(val);
                      }}
                      className={`w-full text-center tracking-widest text-lg font-bold font-mono px-4 py-3 bg-slate-950 border rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition ${
                        passcodeError ? 'border-rose-500 animate-shake ring-2 ring-rose-500/20' : 'border-slate-800'
                      }`}
                    />
                  </div>

                  {passcodeError && (
                    <p className="text-[11px] text-rose-500 font-bold text-center">
                      Incorrect passcode. Please try again!
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPasscodeModal(false)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
                    >
                      Confirm Code
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
