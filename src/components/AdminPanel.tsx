import React, { useState } from 'react';
import { HistoryItem, VaultMediaItem } from '../types';
import { 
  BarChart4, 
  Trash2, 
  Lock, 
  Unlock, 
  Database,
  FileText, 
  HelpCircle, 
  RefreshCw, 
  ArrowLeft, 
  Plus, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Download, 
  CheckCircle, 
  Settings, 
  Coins, 
  Calculator,
  User,
  Shield,
  UploadCloud,
  FileCode,
  Image as ImageIcon,
  Video as VideoIcon
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPanelProps {
  historyItems: HistoryItem[];
  vaultItems: VaultMediaItem[];
  vaultPasscode: string;
  isPasscodeSetUp: boolean;
  onClose: () => void;
  onClearAllHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onUpdateHistoryItem?: (id: string, newExpression: string, newResult: string) => void;
  onChangePasscode: (newPass: string) => void;
  onResetPasscodeConfig: () => void;
  onDeleteVaultItem: (id: string) => void;
  onInjectSampleAssets: (assets: VaultMediaItem[]) => void;
  adminEmail: string;
}

export default function AdminPanel({
  historyItems,
  vaultItems,
  vaultPasscode,
  isPasscodeSetUp,
  onClose,
  onClearAllHistory,
  onDeleteHistoryItem,
  onUpdateHistoryItem,
  onChangePasscode,
  onResetPasscodeConfig,
  onDeleteVaultItem,
  onInjectSampleAssets,
  adminEmail
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'history' | 'vault' | 'settings'>('dashboard');
  const [showPasscodeRaw, setShowPasscodeRaw] = useState(false);
  const [passcodeEditValue, setPasscodeEditValue] = useState(vaultPasscode);
  const [passcodeSuccessMessage, setPasscodeSuccessMessage] = useState(false);
  const [resetFinished, setResetFinished] = useState(false);
  
  // History editing states
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editExpression, setEditExpression] = useState('');
  const [editResult, setEditResult] = useState('');

  // Sample injector state feedback
  const [injectSuccess, setInjectSuccess] = useState(false);

  // Search filter states
  const [historySearch, setHistorySearch] = useState('');
  const [vaultSearch, setVaultSearch] = useState('');

  // Calculate statistics
  const totalCalcs = historyItems.filter(item => item.type === 'calculator').length;
  const totalCurrencies = historyItems.filter(item => item.type === 'currency').length;
  const totalPhotos = vaultItems.filter(item => item.type === 'photo').length;
  const totalVideos = vaultItems.filter(item => item.type === 'video').length;

  const filteredHistory = historyItems.filter(item => {
    const q = historySearch.toLowerCase();
    return (
      item.expression.toLowerCase().includes(q) ||
      item.result.toLowerCase().includes(q) ||
      (item.details && item.details.toLowerCase().includes(q))
    );
  });

  const filteredVault = vaultItems.filter(item => {
    const q = vaultSearch.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q);
  });

  // Handle local CSV/JSON backup download of the entire application state
  const handleExportSystemState = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      adminEmail,
      passcodeConfig: {
        isConfigured: isPasscodeSetUp,
        passcode: vaultPasscode
      },
      history: historyItems,
      mediaVault: vaultItems
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `system_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleUpdatePasscodeDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]+$/.test(passcodeEditValue) || passcodeEditValue.length < 4) {
      alert('Vault passcode must contain at least 4 digits only.');
      return;
    }
    onChangePasscode(passcodeEditValue);
    setPasscodeSuccessMessage(true);
    setTimeout(() => setPasscodeSuccessMessage(false), 3000);
  };

  const handleInjectSamples = () => {
    const newSamples: VaultMediaItem[] = [
      {
        id: `inject-photo-${Date.now()}-1`,
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&q=80&w=800',
        name: 'Confidential Formula.jpg',
        size: '194 KB',
        timestamp: Date.now()
      },
      {
        id: `inject-video-${Date.now()}-2`,
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-cyber-security-code-in-a-server-room-34983-large.mp4',
        name: 'Biometric System Hack.mp4',
        size: '4.2 MB',
        timestamp: Date.now()
      }
    ];
    onInjectSampleAssets(newSamples);
    setInjectSuccess(true);
    setTimeout(() => setInjectSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
      
      {/* Admin Panel Header */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-base tracking-tight text-white">Administrator Portal</h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest animate-pulse">
                Active Admin
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Logged: {adminEmail}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-200 transition active:scale-95 cursor-pointer border border-slate-700/50"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          Exit Portal
        </button>
      </div>

      {/* Admin Panel Content Body Container */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
        
        {/* Left Side Sidebar - Tabs Navigation */}
        <div className="w-full md:w-56 p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0 bg-slate-950/40">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition text-left whitespace-nowrap ${
              activeSubTab === 'dashboard' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BarChart4 className="w-4 h-4 shrink-0" />
            <span>Dashboard Stats</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition text-left whitespace-nowrap ${
              activeSubTab === 'history' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Manage Logs ({historyItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('vault')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition text-left whitespace-nowrap ${
              activeSubTab === 'vault' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Vault Files ({vaultItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition text-left whitespace-nowrap ${
              activeSubTab === 'settings' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>System Config</span>
          </button>
        </div>

        {/* Right Side Main View Work Area */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-slate-900/40">
          
          {/* TAB 1: DASHBOARD STATS */}
          {activeSubTab === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">System Audit Metrics</h2>
                <button
                  onClick={handleExportSystemState}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 font-bold text-[11px] text-indigo-400 rounded-xl transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Full System Export (.json)
                </button>
              </div>

              {/* Grid Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Actions Shared</div>
                  <div className="mt-2 text-2xl font-black text-white font-mono">{historyItems.length}</div>
                  <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                    <Database className="w-3 h-3 text-slate-500" /> State Sync Logged
                  </div>
                </div>

                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Math Calculations</div>
                  <div className="mt-2 text-2xl font-black text-indigo-400 font-mono">{totalCalcs}</div>
                  <div className="text-[9px] text-indigo-500 mt-1 flex items-center gap-1">
                    <Calculator className="w-3 h-3" /> Formula Engine items
                  </div>
                </div>

                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Currency Audits</div>
                  <div className="mt-2 text-2xl font-black text-violet-400 font-mono">{totalCurrencies}</div>
                  <div className="text-[9px] text-violet-500 mt-1 flex items-center gap-1">
                    <Coins className="w-3 h-3" /> Live rates converted
                  </div>
                </div>

                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Vault Files Secure</div>
                  <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">{vaultItems.length}</div>
                  <div className="text-[9px] text-emerald-500 mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Base64 photo storage
                  </div>
                </div>
              </div>

              {/* Sub-grid with charts and Quick Settings Info */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Custom Tailwind Chart representation */}
                <div className="lg:col-span-7 bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-4">Calculation vs Conversion Ratio</h3>
                  
                  {historyItems.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs">
                      <BarChart4 className="w-8 h-8 opacity-30 mb-2 text-indigo-400" />
                      <span>No activity tracked yet. Use the calculator tools to populate stats.</span>
                    </div>
                  ) : (
                    <div className="space-y-6 pt-3">
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span className="flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5 text-indigo-400" /> Scientific Formulas ({totalCalcs})</span>
                          <span className="font-mono text-slate-200">{(totalCalcs / historyItems.length * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${(totalCalcs / historyItems.length * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-violet-400" /> Currency Conversions ({totalCurrencies})</span>
                          <span className="font-mono text-slate-200">{(totalCurrencies / historyItems.length * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-violet-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(totalCurrencies / historyItems.length * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-800/70 pt-4 flex justify-between gap-4">
                        <div className="text-slate-500 text-[10px]">
                          <strong>Quick Analytics Indicator:</strong> Most of your users are using the systems to perform formulaic evaluations. Ensure parameters are configured correctly!
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Diagnostics and Password view Card */}
                <div className="lg:col-span-5 bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-3">Key Passcode Vault</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">The user stores private photos/videos protected by a numeric lock. As an Administrator, you can view the live configuration credentials below.</p>
                    
                    <div className="mt-4 p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-mono">Current Vault Code</div>
                        <div className="text-lg font-black font-mono tracking-widest text-slate-200 mt-1">
                          {showPasscodeRaw ? vaultPasscode : '••••'}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Status: {isPasscodeSetUp ? '✅ Configured' : '⚠️ Default Code'}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPasscodeRaw(!showPasscodeRaw)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title={showPasscodeRaw ? 'Hide raw code' : 'Show raw code'}
                      >
                        {showPasscodeRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/70 pt-4 mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Total Secure Records:</span>
                      <strong className="font-mono text-emerald-400">{vaultItems.length} elements ({totalPhotos} jpg / {totalVideos} mp4)</strong>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: MANAGE HISTORY LOGS */}
          {activeSubTab === 'history' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Action History Records</h2>
                  <p className="text-[11px] text-slate-400">Browse, edit, and audit mathematical expressions calculated in the applet.</p>
                </div>
                {historyItems.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you absolutely sure you want to delete all calculation logs permanently?')) {
                        onClearAllHistory();
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All Logs
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="p-1.5 bg-slate-950/50 border border-slate-800 rounded-xl">
                <input
                  type="text"
                  placeholder="Search values, formulas, or conversion rate tokens..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 text-xs text-slate-100 outline-none border-none placeholder-slate-500"
                />
              </div>

              {filteredHistory.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs bg-slate-950/20 rounded-2xl border border-slate-850 border-dashed">
                  No matching logs were found in storage database index.
                </div>
              ) : (
                <div className="bg-slate-950/30 rounded-2xl border border-slate-800/80 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                          <th className="p-4.5">Reference / Time</th>
                          <th className="p-4.5">Expression / Input</th>
                          <th className="p-4.5">Output Result</th>
                          <th className="p-4.5">Type</th>
                          <th className="p-4.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredHistory.map((item) => {
                          const isEditing = editingHistoryId === item.id;
                          return (
                            <tr key={item.id} className="hover:bg-slate-900/40 transition">
                              <td className="p-4 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                                <div>{new Date(item.timestamp).toLocaleTimeString()}</div>
                                <div className="text-[8px] opacity-70">{new Date(item.timestamp).toLocaleDateString()}</div>
                              </td>
                              
                              <td className="p-4 font-mono font-medium max-w-xs truncate">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editExpression}
                                    onChange={(e) => setEditExpression(e.target.value)}
                                    className="bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs font-mono text-white w-full focus:outline-none"
                                  />
                                ) : (
                                  <>
                                    <span className="text-slate-200">{item.expression}</span>
                                    {item.details && (
                                      <div className="text-[9px] text-slate-500 truncate mt-0.5 font-sans italic">{item.details}</div>
                                    )}
                                  </>
                                )}
                              </td>

                              <td className="p-4 font-mono text-emerald-400 font-bold max-w-xs truncate">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editResult}
                                    onChange={(e) => setEditResult(e.target.value)}
                                    className="bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs font-mono text-white w-full focus:outline-none"
                                  />
                                ) : (
                                  item.result
                                )}
                              </td>

                              <td className="p-4 whitespace-nowrap">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                                  item.type === 'calculator' 
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                                    : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                }`}>
                                  {item.type}
                                </span>
                              </td>

                              <td className="p-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          if (onUpdateHistoryItem) {
                                            onUpdateHistoryItem(item.id, editExpression, editResult);
                                          }
                                          setEditingHistoryId(null);
                                        }}
                                        className="px-2 py-1 bg-indigo-600 font-bold hover:bg-indigo-700 rounded text-white text-[10px] transition"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingHistoryId(null)}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 text-[10px] transition"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {onUpdateHistoryItem && (
                                        <button
                                          onClick={() => {
                                            setEditingHistoryId(item.id);
                                            setEditExpression(item.expression);
                                            setEditResult(item.result);
                                          }}
                                          className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition rounded"
                                          title="Modify value"
                                        >
                                          Edit
                                        </button>
                                      )}
                                      
                                      <button
                                        onClick={() => onDeleteHistoryItem(item.id)}
                                        className="p-1 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition rounded"
                                        title="Delete log"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: SECURE VAULT INSIGHT & FILE AUDIT */}
          {activeSubTab === 'vault' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Secure Media Folder Ledger</h2>
                  <p className="text-[11px] text-slate-400">View information on files locked dynamically in user's browser disk partition storage.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInjectSamples}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Inject Sample Assets
                  </button>
                </div>
              </div>

              {injectSuccess && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                  <CheckCircle className="w-4 h-4" /> Added 2 confidential assets into locked secure database.
                </div>
              )}

              {/* Vault Search Bar */}
              <div className="p-1.5 bg-slate-950/50 border border-slate-800 rounded-xl">
                <input
                  type="text"
                  placeholder="Search file catalog by name, format parameters..."
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 text-xs text-slate-100 outline-none border-none placeholder-slate-500"
                />
              </div>

              {filteredVault.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs bg-slate-950/20 rounded-2xl border border-slate-850 border-dashed">
                  No secure files loaded in partition ledger.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVault.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3 hover:border-slate-700/80 transition"
                    >
                      {/* Thumbnails */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-slate-800 flex items-center justify-center relative text-slate-400">
                        {item.type === 'photo' ? (
                          item.url.startsWith('http') ? (
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded w-full h-full flex items-center justify-center text-[10px] font-bold font-mono">B64</div>
                          )
                        ) : (
                          <VideoIcon className="w-5 h-5 text-violet-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate" title={item.name}>
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-mono">
                          <span className="uppercase">{item.type}</span>
                          <span>•</span>
                          <span>{item.size || 'N/A'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete file "${item.name}" from storage database?`)) {
                            onDeleteVaultItem(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                        title="Erase Vault Artifact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: SYSTEM CONFIGURES / TOOLS */}
          {activeSubTab === 'settings' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Core Diagnostic Panel</h2>
                <p className="text-[11px] text-slate-400">Adjust the cryptographic passcode directly, force reset configurations, or deploy recovery actions.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Overwrite Code section */}
                <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    Admin Passcode Change Overwrite
                  </h3>
                  <p className="text-[11px] text-slate-400">Force adjust the user's hidden workspace lock passcode without knowing their current code.</p>

                  <form onSubmit={handleUpdatePasscodeDirect} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">New Digit Passcode</label>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="Choose code (e.g. 5678)"
                        value={passcodeEditValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || /^[0-9]+$/.test(val)) setPasscodeEditValue(val);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-610 hover:bg-indigo-600 bg-indigo-600 font-bold text-white text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                      Apply Password Config
                    </button>
                  </form>

                  {passcodeSuccessMessage && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg text-center font-mono">
                      Passcode successfully synchronized!
                    </div>
                  )}
                </div>

                {/* Database Reset Action Section */}
                <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-amber-500 animate-spin-slow" />
                      Wipe Configuration Setup State
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                      Click the button below to restore the app's secure initialization state. On next launch, users will be required to establish a completely fresh numeric passcode lock.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        if (window.confirm('Are states absolutely destined to be wiped? This will restore the first-time passcode initial setup prompt on next access.')) {
                          onResetPasscodeConfig();
                          setResetFinished(true);
                          setTimeout(() => setResetFinished(false), 3000);
                        }
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold text-xs rounded-xl cursor-pointer transition uppercase tracking-wider"
                    >
                      Force Re-prompt Passcode Setup
                    </button>

                    {resetFinished && (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium rounded-lg text-center font-mono">
                        Vault state flag restored to initial configuration!
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Developer Environment details */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/50 rounded-2xl font-mono text-[9px] text-slate-500 space-y-1.5 leading-relaxed">
                <div className="text-slate-400 font-bold uppercase tracking-wider mb-1">Developer Execution Context</div>
                <div>Runtime Ingress Node: Cloud Run Sandbox Client</div>
                <div>Encryption Standard: AES-Equivalent Browser String Serialization</div>
                <div>Session Security Integrity Handshake: Compliant (ab405127 Workspace Session Active)</div>
              </div>
            </motion.div>
          )}

        </div>

      </div>

    </div>
  );
}
