/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Chat from './components/Chat';
import DocumentEditor from './components/DocumentEditor';
import ApiKeyModal from './components/ApiKeyModal';
import { Settings } from 'lucide-react';

export default function App() {
  const [documentContent, setDocumentContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gemini-3-flash-preview");

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    const savedModel = localStorage.getItem('gemini_ai_model');
    if (savedKey) setApiKey(savedKey);
    else setIsModalOpen(true);
    if (savedModel) setAiModel(savedModel);
  }, []);

  const handleSaveSettings = (key: string, model: string) => {
    localStorage.setItem('gemini_api_key', key);
    localStorage.setItem('gemini_ai_model', model);
    setApiKey(key);
    setAiModel(model);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">SOẠN GIÁO ÁN NLS - HUY 1</h1>
            <p className="text-xs font-medium text-gray-500">Chuyên gia Thiết kế Giáo án Năng lực (GDPT 2018)</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors \${!apiKey ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <Settings className="w-4 h-4" />
          {!apiKey ? "Lấy API key để sử dụng app" : "Cài đặt API"}
        </button>
      </header>
      
      <main className="flex-1 overflow-hidden relative flex flex-row w-full h-full">
        <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col h-full border-r border-gray-200 bg-gray-50/50 relative z-0">
          <div className="flex-1 overflow-hidden p-2 sm:p-4">
            <Chat 
              onContentGenerated={setDocumentContent} 
              apiKey={apiKey} 
              aiModel={aiModel} 
              onRequireKey={() => setIsModalOpen(true)}
            />
          </div>
        </div>
        <div className="hidden md:flex flex-1 h-full bg-white flex-col relative z-0">
          <DocumentEditor content={documentContent} />
        </div>
      </main>

      <ApiKeyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveSettings}
        currentKey={apiKey}
        currentModel={aiModel}
      />
    </div>
  );
}
