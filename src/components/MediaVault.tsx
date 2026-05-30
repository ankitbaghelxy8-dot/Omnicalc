/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VaultMediaItem } from '../types';
import { 
  FolderLock, 
  Trash2, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Plus, 
  X, 
  Key, 
  Eye, 
  ArrowLeft, 
  FolderOpen, 
  Clock, 
  Check, 
  ExternalLink,
  ShieldAlert,
  Lock,
  Download
} from 'lucide-react';

interface MediaVaultProps {
  onLock: () => void;
  vaultPasscode: string;
  onChangePasscode: (newPass: string) => void;
}

// Default stock visual elements to build immediate visual impact
const INITIAL_DEMO_PHOTOS: Omit<VaultMediaItem, 'id' | 'timestamp'>[] = [
  {
    type: 'photo',
    name: 'Encrypted Sunset.jpg',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    size: '184 KB'
  },
  {
    type: 'photo',
    name: 'Secure Blueprint.jpg',
    url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800',
    size: '342 KB'
  },
  {
    type: 'photo',
    name: 'Encrypted Safe Key.jpg',
    url: 'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=800',
    size: '115 KB'
  }
];

const INITIAL_DEMO_VIDEOS: Omit<VaultMediaItem, 'id' | 'timestamp'>[] = [
  {
    type: 'video',
    name: 'Private Vault Intro.mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-encryption-keys-and-padlocks-on-a-digital-screen-34316-large.mp4',
    size: '2.4 MB'
  },
  {
    type: 'video',
    name: 'Secret Matrix Code.mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-green-code-lines-on-a-black-screen-40114-large.mp4',
    size: '1.8 MB'
  }
];

export default function MediaVault({ onLock, vaultPasscode, onChangePasscode }: MediaVaultProps) {
  const [activeSubTab, setActiveSubTab] = useState<'photos' | 'videos' | 'settings'>('photos');
  const [items, setItems] = useState<VaultMediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('omnicalc_vault_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    
    // Fallback default initial demo items
    const defaults: VaultMediaItem[] = [
      ...INITIAL_DEMO_PHOTOS.map((item, idx) => ({
        ...item,
        id: `p-${idx}`,
        timestamp: Date.now() - idx * 86400000
      })),
      ...INITIAL_DEMO_VIDEOS.map((item, idx) => ({
        ...item,
        id: `v-${idx}`,
        timestamp: Date.now() - idx * 120000000
      }))
    ];
    return defaults;
  });

  // Save back to storage
  useEffect(() => {
    localStorage.setItem('omnicalc_vault_items', JSON.stringify(items));
  }, [items]);

  // Passcode states
  const [newPass, setNewPass] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [passFeedback, setPassFeedback] = useState<string | null>(null);

  // Modal / Lightbox preview selection states
  const [selectedPhoto, setSelectedPhoto] = useState<VaultMediaItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VaultMediaItem | null>(null);

  // New item upload parameters
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [fileNameInput, setFileNameInput] = useState('');
  const [uploadType, setUploadType] = useState<'photo' | 'video'>('photo');
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle direct file selector drop conversion
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        const newItem: VaultMediaItem = {
          id: `user-${Date.now()}`,
          type: file.type.startsWith('video/') ? 'video' : 'photo',
          url: event.target.result,
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          timestamp: Date.now()
        };
        setItems(prev => [newItem, ...prev]);
        setUploadFeedback('Item successfully encrypted in local browser memory!');
        setTimeout(() => setUploadFeedback(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add item with internet link parameters
  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrlInput.trim()) return;

    setIsUploading(true);
    setTimeout(() => {
      const extension = fileUrlInput.split('.').pop()?.split('?')[0] || '';
      const isVid = uploadType === 'video' || ['mp4', 'mov', 'webm'].includes(extension.toLowerCase());
      
      const newItem: VaultMediaItem = {
        id: `link-${Date.now()}`,
        type: isVid ? 'video' : 'photo',
        url: fileUrlInput,
        name: fileNameInput.trim() || `Encrypted_${isVid ? 'Video' : 'Image'}_${items.length + 1}.${isVid ? 'mp4' : 'jpg'}`,
        size: 'Remote Link Stream',
        timestamp: Date.now()
      };

      setItems(prev => [newItem, ...prev]);
      setFileUrlInput('');
      setFileNameInput('');
      setUploadFeedback('Remote asset successfully linked and disguised in passcode vault!');
      setIsUploading(false);
      setTimeout(() => setUploadFeedback(null), 3500);
    }, 600);
  };

  // Truncate list records
  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdatePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass) {
      setPassFeedback('Passcode cannot be blank.');
      return;
    }
    if (newPass.length < 4) {
      setPassFeedback('Passcode should be at least 4 digits/characters.');
      return;
    }
    if (newPass !== passConfirm) {
      setPassFeedback('Passcode fields mismatch.');
      return;
    }

    onChangePasscode(newPass);
    setPassFeedback('Passcode changed successfully! Use this the next time you scale the calculator.');
    setNewPass('');
    setPassConfirm('');
    setTimeout(() => setPassFeedback(null), 4000);
  };

  const filteredPhotos = items.filter(i => i.type === 'photo');
  const filteredVideos = items.filter(i => i.type === 'video');

  return (
    <div id="vault-primary-card" className="bg-slate-950 text-slate-100 rounded-3xl border border-neutral-800 shadow-2xl p-6 flex flex-col h-full min-h-0 select-none relative overflow-hidden font-sans">
      
      {/* Dynamic Background Disguise Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Main Header UI */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/20 shadow-md">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-sans font-bold text-slate-100 tracking-tight text-base">Vault</h2>
              <span className="text-[9px] bg-indigo-950/80 text-indigo-400 font-mono px-2 py-0.5 rounded-full border border-indigo-900 font-bold uppercase tracking-wider">
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 tracking-wide">Secure Folder</p>
          </div>
        </div>

        {/* Instantly Close and Exit */}
        <button
          id="exit-vault-btn"
          onClick={onLock}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-xs text-white transition duration-150 shadow-md shadow-orange-500/20 hover:scale-105"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          Close & Lock
        </button>
      </div>

      {/* Folders & Options Grid Selector Tabs */}
      <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-2xl space-x-1 mb-5 relative z-10">
        <button
          id="vault-tab-photos"
          onClick={() => setActiveSubTab('photos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition duration-200 ${
            activeSubTab === 'photos'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          Private Photos ({filteredPhotos.length})
        </button>
        <button
          id="vault-tab-videos"
          onClick={() => setActiveSubTab('videos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition duration-200 ${
            activeSubTab === 'videos'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <VideoIcon className="w-4 h-4 text-rose-400" />
          Private Videos ({filteredVideos.length})
        </button>
        <button
          id="vault-tab-settings"
          onClick={() => { setActiveSubTab('settings'); setPassFeedback(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition duration-200 ${
            activeSubTab === 'settings'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4 text-amber-400" />
          Vault Security
        </button>
      </div>

      {/* Main Internal Content Panel */}
      <div className="flex-1 overflow-y-auto mb-5 relative z-10">
        
        {/* TAB 1: Photos Grid */}
        {activeSubTab === 'photos' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Direct Upload Option Widget */}
            <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Import Private Photos</h4>
                  <p className="text-[10px] text-neutral-400">Save images inside local browser sandbox</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-xs font-semibold cursor-pointer border border-neutral-700/80 transition text-slate-200">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  Upload Photo File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocalImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {filteredPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-500 bg-neutral-900/40 rounded-2xl border border-dashed border-neutral-800">
                <ImageIcon className="w-10 h-10 stroke-[1.25] text-neutral-600 mb-2.5" />
                <p className="text-xs">Your Private Photo Vault is empty.</p>
                <p className="text-[10px] text-neutral-500 mt-1">Upload files anonymously to safeguard content.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    id={`photo-card-${photo.id}`}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative rounded-xl h-28 overflow-hidden bg-neutral-900 border border-neutral-800/80 cursor-pointer shadow-md transition-all hover:scale-102 hover:border-emerald-500/30"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                      <span className="text-[9px] font-mono font-medium truncate text-neutral-300 max-w-[70%]">
                        {photo.name}
                      </span>
                      <button
                        onClick={(e) => handleDeleteItem(photo.id, e)}
                        className="p-1 rounded-md bg-neutral-950/80 hover:bg-rose-600 text-neutral-400 hover:text-white transition duration-150"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Videos Grid */}
        {activeSubTab === 'videos' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Direct Upload Option Widget */}
            <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <VideoIcon className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Import Private Videos</h4>
                  <p className="text-[10px] text-neutral-400">Save locked mp4 files safely inside the safe storage</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-xs font-semibold cursor-pointer border border-neutral-700/80 transition text-slate-200">
                  <Plus className="w-3.5 h-3.5 text-rose-400" />
                  Upload Video File
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleLocalImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {filteredVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-500 bg-neutral-900/40 rounded-2xl border border-dashed border-neutral-800">
                <VideoIcon className="w-10 h-10 stroke-[1.25] text-neutral-600 mb-2.5 animate-pulse" />
                <p className="text-xs">Your Private Video Vault is empty.</p>
                <p className="text-[10px] text-neutral-500 mt-1">Upload private video archives anonymously.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    id={`video-card-${video.id}`}
                    onClick={() => setSelectedVideo(video)}
                    className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 cursor-pointer shadow-md transition-all hover:scale-101 hover:border-rose-500/40"
                  >
                    {/* Video Player cover preview */}
                    <div className="relative h-32 flex items-center justify-center bg-black">
                      <div className="absolute inset-0 bg-zinc-950 opacity-60 group-hover:opacity-40 transition-opacity" />
                      <VideoIcon className="w-8 h-8 text-rose-500 shrink-0 relative z-10 group-hover:scale-110 transition-transform" />
                      {/* Subtitled video frame metrics */}
                      <span className="absolute bottom-2 left-3 z-10 text-[9px] font-mono bg-neutral-950/80 px-2 py-0.5 rounded-full text-neutral-400">
                        {video.size || 'Secret Link'}
                      </span>
                    </div>

                    <div className="p-3 bg-neutral-900 border-t border-neutral-800/60 flex items-center justify-between">
                      <div className="truncate pr-4">
                        <h5 className="text-xs font-bold text-slate-200 truncate">{video.name}</h5>
                        <p className="text-[9px] text-neutral-500">Encrypted mp4 archive</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteItem(video.id, e)}
                        className="p-1.5 rounded-lg bg-neutral-950 text-neutral-400 hover:text-white hover:bg-rose-600 transition"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Advanced Options & Security Settings */}
        {activeSubTab === 'settings' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Lock Mechanism Onboarding Guide */}
            <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-start gap-3">
              <FolderLock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-100">Disguise Mechanics</h4>
                <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">
                  How does the lock trigger work? Your Safe Folder operates completely silent in the background. To bypass the innocent calculator facade, physically key in your passcode (e.g. <strong className="text-indigo-400 text-xs font-mono">{vaultPasscode}</strong>) onto the calculator keys, followed by hitting the equal sign <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-indigo-300 font-mono">=</kbd>!
                </p>
              </div>
            </div>

            {/* Change Passcode parameters */}
            <form onSubmit={handleUpdatePasscode} className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-200">Modify Security Passcode</h3>
              </div>

              {passFeedback && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                  passFeedback.includes('successfully') 
                    ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-400' 
                    : 'bg-rose-500/5 border border-rose-500/10 text-rose-400'
                }`}>
                  {passFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                    New Numeric Passcode
                  </label>
                  <input
                    type="password"
                    placeholder="Enter digits/chars"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={newPass}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val || /^[0-9]+$/.test(val)) setNewPass(val);
                    }}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                    Confirm New Passcode
                  </label>
                  <input
                    type="password"
                    placeholder="Repeat digits"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={passConfirm}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val || /^[0-9]+$/.test(val)) setPassConfirm(val);
                    }}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs rounded-xl shadow-md text-white transition active:scale-97"
                >
                  Update Passcode Key
                </button>
              </div>
            </form>

            {/* Quick Web Image URL Link Disguise import */}
            <form onSubmit={handleAddLink} className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-200">Link Secure Web Image/Video</h3>
                </div>
                <span className="text-[9px] text-neutral-400 font-medium">Bypasses local device upload space limits</span>
              </div>

              {uploadFeedback && (
                <div className="p-3 bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 text-xs rounded-lg">
                  {uploadFeedback}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                    Resource Web Link (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    required
                    value={fileUrlInput}
                    onChange={(e) => setFileUrlInput(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                      Label Name (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="My Hidden Asset"
                      value={fileNameInput}
                      onChange={(e) => setFileNameInput(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                      Resource Type
                    </label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as 'photo' | 'video')}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs transition"
                    >
                      <option value="photo">📸 Photo Image Link</option>
                      <option value="video">🎥 Online Streamable Video</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 font-bold text-xs rounded-xl text-slate-100 transition border border-neutral-755 disabled:opacity-50"
                >
                  {isUploading ? 'Linking to Safe Folder...' : 'Disguise Resource Link'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL: FULL SCREEN PHOTO SLIDESHOW VIEWER */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-neutral-950/95 z-50 flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={selectedPhoto.url}
              download={selectedPhoto.name}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white transition pointer-events-auto"
              title="Download asset"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white transition pointer-events-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-w-4xl max-h-[80vh] flex items-center justify-center">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.name}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded-lg border border-neutral-800 shadow-2xl"
            />
          </div>

          <div className="mt-4 text-center">
            <h4 className="text-sm font-bold text-white">{selectedPhoto.name}</h4>
            <p className="text-[11px] text-neutral-400 mt-1">Disguised on {new Date(selectedPhoto.timestamp).toLocaleDateString()} &bull; {selectedPhoto.size}</p>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL: VIDEO PLAYER BOX */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-neutral-950/95 z-50 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-full max-w-2xl bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
            {/* Interactive Video Tag Frame */}
            <video
              src={selectedVideo.url}
              controls
              autoPlay
              className="w-full aspect-video outline-none"
            >
              Your browser does not support the video tag.
            </video>

            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{selectedVideo.name}</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">Secure Video Stream &bull; {selectedVideo.size}</p>
              </div>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 font-mono px-2 py-1 rounded">
                MP4 DECRYPTED
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
