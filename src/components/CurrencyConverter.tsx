/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CURRENCY_LIST, BASELINE_RATES } from '../currencies';
import { CurrencyData, HistoryItem } from '../types';
import { ArrowLeftRight, RefreshCw, AlertCircle, Coins, LogIn, TrendingUp, Check } from 'lucide-react';

interface CurrencyConverterProps {
  onAddHistory: (expression: string, result: string, type: 'calculator' | 'currency', details?: string) => void;
  restoreState?: { from: string; to: string; amount: string } | null;
  onClearRestore?: () => void;
}

export default function CurrencyConverter({
  onAddHistory,
  restoreState,
  onClearRestore,
}: CurrencyConverterProps) {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(BASELINE_RATES);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLogged, setIsLogged] = useState<boolean>(false);

  // Fetch real-time exchange rates on mount
  const fetchRates = async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('Network rates responded with error code');
      const data = await res.json();
      if (data && data.rates) {
        setExchangeRates(data.rates);
        // Format last updated timing nicely
        const updatedTime = data.time_last_update_utc
          ? new Date(data.time_last_update_utc).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : new Date().toLocaleDateString();
        setLastUpdated(updatedTime);
      }
    } catch (err) {
      console.error('Failed to retrieve live currency rates, using baseline backups.', err);
      setFetchError('Live rates unavailable. Using offline baseline.');
      setLastUpdated('Offline Base (2026)');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  // Handle incoming restore state from history restores
  useEffect(() => {
    if (restoreState) {
      setFromCurrency(restoreState.from);
      setToCurrency(restoreState.to);
      setAmount(restoreState.amount);
      if (onClearRestore) onClearRestore();
    }
  }, [restoreState]);

  // Handle changing inputs: resets logged status
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val);
      setIsLogged(false);
    }
  };

  // Convert function
  const calculateConversion = (): { converted: number; rateStr: string; singleRate: number } => {
    const numericAmount = parseFloat(amount) || 0;
    
    // exchangeRates is relative to USD
    const rateFromUSD = exchangeRates[fromCurrency] || 1;
    const rateToUSD = exchangeRates[toCurrency] || 1;

    // Convert from -> USD -> to
    const rateFromToTarget = rateToUSD / rateFromUSD;
    const convertedAmount = numericAmount * rateFromToTarget;

    return {
      converted: convertedAmount,
      singleRate: rateFromToTarget,
      rateStr: `1 ${fromCurrency} = ${rateFromToTarget.toFixed(4)} ${toCurrency}`,
    };
  };

  const { converted, rateStr, singleRate } = calculateConversion();

  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setIsLogged(false);
  };

  // Trigger Logging to History Log
  const handleLogToHistory = () => {
    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount <= 0) return;

    const formattedFrom = `${CURRENCY_LIST.find((c) => c.code === fromCurrency)?.flag || ''} ${amount} ${fromCurrency}`;
    const formattedTo = `${CURRENCY_LIST.find((c) => c.code === toCurrency)?.flag || ''} ${converted.toFixed(2)} ${toCurrency}`;
    
    onAddHistory(
      formattedFrom,
      formattedTo,
      'currency',
      `Rate used: ${rateStr}`
    );
    setIsLogged(true);
    setTimeout(() => {
      setIsLogged(false);
    }, 2000);
  };

  return (
    <div id="currency-converter-card" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col h-full min-h-0 justify-between overflow-y-auto w-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-indigo-500" />
            <h2 className="font-sans font-semibold text-slate-800 text-sm tracking-tight">Currency Converter</h2>
          </div>
          <button
            id="refresh-rates-btn"
            onClick={fetchRates}
            disabled={isFetching}
            title="Refresh conversion rates"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Display Status info */}
        {fetchError && (
          <div className="mb-4 bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2 text-xs text-amber-700">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Form elements */}
        <div className="space-y-4">
          {/* Amount Box */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Enter Amount
            </label>
            <div className="relative">
              <input
                id="currency-amount-input"
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-slate-300 focus:bg-white focus:outline-none rounded-xl text-slate-850 font-mono text-base font-semibold transition"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                {fromCurrency}
              </span>
            </div>
          </div>

          {/* Currencies Swap Row */}
          <div className="grid grid-cols-9 gap-2 items-center">
            {/* From Dropdown */}
            <div className="col-span-4">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                From
              </label>
              <select
                id="currency-from-select"
                value={fromCurrency}
                onChange={(e) => { setFromCurrency(e.target.value); setIsLogged(false); }}
                className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 cursor-pointer border border-slate-200 focus:outline-none rounded-xl text-xs font-medium text-slate-700 transition"
              >
                {CURRENCY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Interchange btn */}
            <div className="col-span-1 flex justify-center pt-5">
              <button
                id="currency-swap-btn"
                onClick={handleSwap}
                title="Swap Currencies"
                className="p-2 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-500 hover:text-indigo-600 shadow-3xs transition-all active:scale-90"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* To Dropdown */}
            <div className="col-span-4">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                To
              </label>
              <select
                id="currency-to-select"
                value={toCurrency}
                onChange={(e) => { setToCurrency(e.target.value); setIsLogged(false); }}
                className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 cursor-pointer border border-slate-200 focus:outline-none rounded-xl text-xs font-medium text-slate-700 transition"
              >
                {CURRENCY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Large Result Box */}
          <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 text-center mt-2">
            <span className="font-sans text-xs text-slate-400 block mb-1">
              Converted Rate
            </span>
            <div id="currency-converted-value" className="font-mono text-2xl font-bold text-slate-800 break-all">
              {parseFloat(amount) > 0 ? (
                <>
                  {CURRENCY_LIST.find((c) => c.code === toCurrency)?.symbol} {converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </>
              ) : (
                '0.00'
              )}
            </div>
            <span className="text-[10px] font-mono text-indigo-500 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full inline-block mt-2">
              {rateStr}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Details Log */}
      <div className="mt-5 border-t border-slate-150/40 pt-4">
        <div className="flex items-center justify-between text-[11px] text-slate-400 select-none mb-3">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Updated: <strong className="text-slate-500 font-mono">{lastUpdated || 'Loading...'}</strong>
          </span>
        </div>

        {parseFloat(amount) > 0 && (
          <button
            id="log-conversion-btn"
            onClick={handleLogToHistory}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 font-sans text-xs font-medium rounded-xl border transition-all duration-200 ${
              isLogged
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm'
            }`}
          >
            {isLogged ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Logged to History
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                Log Conversion to History
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
