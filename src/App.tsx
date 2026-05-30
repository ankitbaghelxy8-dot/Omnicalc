/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HistoryItem, CalculatorMode } from './types';
import ScientificCalculator from './components/ScientificCalculator';
import CurrencyConverter from './components/CurrencyConverter';
import HistoryLog from './components/HistoryLog';
import MediaVault from './components/MediaVault';
import { Calculator, Coins, Clock, Sparkles, ShieldCheck, Lock } from 'lucide-react';

export default function App() {
  // Tabs for mobile/small responsive screen layout
  const [activeTab, setActiveTab] = useState<'calculator' | 'currency' | 'history'>('calculator');
  
  // Angle measurement mode ('degree' | 'radian')
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('degree');
  
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
    try {
      localStorage.setItem('omnicalc_vault_passcode', newPass);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col antialiased transition-colors duration-300 ${
      vaultUnlocked ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-850'
    }`}>
      {/* Dynamic Navigation Top bar */}
      <header className={`sticky top-0 border-b z-20 shadow-xs transition-colors duration-300 ${
        vaultUnlocked ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-slate-200/80 text-slate-850'
      }`}>
        <div id="main-header" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white shadow-md transition-colors ${
              vaultUnlocked ? 'bg-rose-600 shadow-rose-600/10' : 'bg-indigo-600 shadow-indigo-600/10'
            }`}>
              {vaultUnlocked ? (
                <Lock className="w-5 h-5 stroke-[2.25] animate-pulse" />
              ) : (
                <Calculator className="w-5 h-5 stroke-[2.25]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-sans font-bold tracking-tight text-base sm:text-lg">
                  {vaultUnlocked ? 'SafeVault' : 'OmniCalc'}
                </h1>
                {vaultUnlocked && (
                  <span className="text-[9px] bg-rose-500/10 text-rose-450 border border-rose-500/25 px-1.5 py-0.2 rounded-md font-bold uppercase font-mono tracking-wider">
                    DECRYPTED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 font-medium font-sans uppercase tracking-wider block">
                {vaultUnlocked ? 'Encrypted Local Sandbox Manager' : 'Scientific & Currency Suite'}
              </p>
            </div>
          </div>

          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-sans font-medium select-none rounded-lg p-1 ${
            vaultUnlocked ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-100 text-slate-400'
          }`}>
            <span className={`px-2 py-0.5 rounded shadow-2xs font-bold text-[10px] uppercase ${
              vaultUnlocked ? 'text-rose-400 bg-neutral-950 border border-rose-950/20' : 'text-indigo-600 bg-white'
            }`}>
              {vaultUnlocked ? 'ENCRYPTED ENGINE' : 'LOCAL ENGINE'}
            </span>
            <span className="px-1.5">{vaultUnlocked ? 'Files hidden on device' : 'Offline Math Evaluator'}</span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        
        {/* Render fully unlocked private folder inside workspace if triggered */}
        {vaultUnlocked ? (
          <div className="flex-1 max-w-4xl mx-auto w-full">
            <MediaVault
              onLock={() => setVaultUnlocked(false)}
              vaultPasscode={vaultPasscode}
              onChangePasscode={handleSaveNewPasscode}
            />
          </div>
        ) : (
          <>
            {/* Mobile/Tablet tab switcher row */}
            <div className="flex lg:hidden bg-slate-200/50 p-1 rounded-xl mb-5 space-x-1 border border-slate-200">
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
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Main Workspace Left & Center: Calculator & Currency elements */}
              <div className="lg:col-span-8 flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-col gap-6">
                
                {/* Scientific Calculator Box Display */}
                <div className={`flex flex-col flex-1 ${(activeTab === 'calculator' || activeTab === 'history') ? 'block' : 'hidden lg:block'}`}>
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
                <div className={`flex flex-col flex-1 ${(activeTab === 'currency' || activeTab === 'history') ? 'block' : 'hidden lg:block'}`}>
                  <CurrencyConverter
                    onAddHistory={handleAddHistory}
                    restoreState={restoreCurrencyState}
                    onClearRestore={() => setRestoreCurrencyState(null)}
                  />
                </div>
              </div>

              {/* History Sidebar Panel Right Column (shows directly on desktop, inside active tab on mobile) */}
              <div id="side-history-panel" className={`lg:col-span-4 flex flex-col h-full ${activeTab === 'history' ? 'block' : 'hidden lg:block'}`}>
                <HistoryLog
                  items={historyItems}
                  onClearAll={handleClearAllHistory}
                  onDeleteItem={handleDeleteHistoryItem}
                  onRestoreItem={handleRestoreItem}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Humble Footer with copyright and details */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 select-none">
          <div className="flex items-center gap-1 font-sans">
            <span>&copy; {new Date().getFullYear()} {vaultUnlocked ? 'SafeVault' : 'OmniCalc'} Security Utility.</span>
            <span className="text-slate-600 block sm:inline">All private uploads are sandboxed inside local device database.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 stroke-[1.5]" />
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">VERSION 2.5 PREMIUM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
