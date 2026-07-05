import React, { useState, useEffect } from 'react';
import { Key, X, ExternalLink, Settings } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, model: string) => void;
  currentKey?: string;
  currentModel?: string;
}

const MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Nhanh, phản hồi tức thời' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Chất lượng cao, suy luận sâu' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Ổn định, mượt mà' },
];

export default function ApiKeyModal({ isOpen, onClose, onSave, currentKey, currentModel }: ApiKeyModalProps) {
  const [key, setKey] = useState(currentKey || '');
  const [model, setModel] = useState(currentModel || MODELS[0].id);

  useEffect(() => {
    if (currentKey) setKey(currentKey);
    if (currentModel) setModel(currentModel);
  }, [currentKey, currentModel, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2>Cài đặt API & Model</h2>
          </div>
          {currentKey && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">1. Chọn Model AI</label>
            <div className="grid grid-cols-1 gap-3">
              {MODELS.map((m) => (
                <div 
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all \${model === m.id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{m.name}</span>
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">{m.id}</span>
                  </div>
                  <p className="text-xs text-gray-500">{m.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">2. Nhập Gemini API Key</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIzaSy..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm outline-none transition-all"
              />
            </div>
            <p className="text-xs text-gray-500">
              Bạn chưa có API Key? {' '}
              <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                Lấy Key miễn phí tại Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          {currentKey && (
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm"
            >
              Hủy
            </button>
          )}
          <button 
            onClick={() => {
              if (key.trim()) {
                onSave(key.trim(), model);
                onClose();
              }
            }}
            disabled={!key.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}
