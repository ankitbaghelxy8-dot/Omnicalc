/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, RotateCcw, Calculator, Coins, Lock, Shield, LogOut } from 'lucide-react';

interface HistoryLogProps {
  items: HistoryItem[];
  onClearAll: () => void;
  onDeleteItem: (id: string) => void;
  onRestoreItem: (item: HistoryItem) => void;
  onOpenVault: () => void;
  showOpenVault?: boolean;
  currentUser?: string | null;
  isAdminLoggedIn?: boolean;
  isAdminView?: boolean;
  onToggleAdminView?: () => void;
  onLogout?: () => void;
}

export default function HistoryLog({
  items,
  onClearAll,
  onDeleteItem,
  onRestoreItem,
  onOpenVault,
  showOpenVault = true,
  currentUser = null,
  isAdminLoggedIn = false,
  isAdminView = false,
  onToggleAdminView,
  onLogout,
}: HistoryLogProps) {
  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div id="history-panel" className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h2 className="font-sans font-medium text-slate-800 text-sm tracking-tight">Calculation History</h2>
        </div>
        <div className="flex items-center gap-2.5">
          {showOpenVault && (
            <button
              id="history-open-vault-btn"
              onClick={onOpenVault}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-xl shadow-2xs transition active:scale-95 cursor-pointer font-sans shrink-0"
            >
              <Lock className="w-3 h-3 text-indigo-400" />
              <span>Open Hide Folder</span>
            </button>
          )}
          {items.length > 0 && (
            <button
              id="clear-all-history-btn"
              onClick={onClearAll}
              className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors focus:ring-2 focus:ring-rose-500/10 rounded-lg px-2 py-1.5 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
            <Clock className="w-8 h-8 stroke-[1.25] mb-2.5 text-slate-300" />
            <p className="font-sans text-xs text-center px-4 leading-relaxed">
              No previous computations found.<br />Perform calculations to save log items.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                className="group relative flex flex-col p-3 rounded-xl border border-slate-100/80 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200/60 transition-all duration-200"
              >
                {/* Type icon, timestamp and delete item */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {item.type === 'calculator' ? (
                      <div className="p-1 rounded-md bg-indigo-50 text-indigo-500">
                        <Calculator className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-md bg-amber-50 text-amber-500">
                        <Coins className="w-3 h-3" />
                      </div>
                    )}
                    <span className="font-mono text-[10px] text-slate-400 font-medium">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      id={`restore-btn-${item.id}`}
                      title="Load into expression"
                      onClick={() => onRestoreItem(item)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button
                      id={`delete-btn-${item.id}`}
                      title="Delete log"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Computational entries */}
                <div className="text-right select-all">
                  <div className="font-sans text-xs text-slate-500 tracking-tight break-all">
                    {item.expression}
                  </div>
                  <div className="font-mono text-sm font-semibold text-slate-800 break-all mt-0.5">
                    = {item.result}
                  </div>
                  {item.details && (
                    <div className="font-sans text-[10px] text-slate-400 mt-1 italic text-left border-t border-slate-100/50 pt-1">
                      {item.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
