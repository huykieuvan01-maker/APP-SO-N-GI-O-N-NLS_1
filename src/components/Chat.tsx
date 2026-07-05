import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, Loader2, Paperclip, X, FileText, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { SYSTEM_INSTRUCTION } from '../constants';

type Message = {
  id: string;
  role: 'user' | 'model';
  parts: any[];
  fileName?: string;
  isError?: boolean;
};

interface ChatProps {
  onContentGenerated?: (content: string) => void;
  apiKey?: string;
  aiModel?: string;
  onRequireKey?: () => void;
}

export default function Chat({ onContentGenerated, apiKey, aiModel, onRequireKey }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      parts: [{ text: "Chào bạn, tôi là **SOẠN GIÁO ÁN NLS - HUY 1**. Tôi có thể giúp bạn thiết kế, tái cấu trúc hoặc chuẩn hóa giáo án theo định hướng phát triển năng lực của Chương trình GDPT 2018 (Tiến trình 5512). Hãy chia sẻ yêu cầu bài dạy, nội dung kiến thức, hoặc tải lên giáo án cũ của bạn để chúng ta bắt đầu!" }]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processFile = async (file: File): Promise<any> => {
    if (file.name.toLowerCase().endsWith('.pdf')) {
      const base64 = await fileToBase64(file);
      return {
        inlineData: {
          data: base64,
          mimeType: file.type || 'application/pdf',
        }
      };
    } else if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return { text: `\n[NỘI DUNG TÀI LIỆU ĐÍNH KÈM: \${file.name}]\n\${result.value}\n[KẾT THÚC TÀI LIỆU]\n` };
    }
    throw new Error('Chỉ hỗ trợ file PDF và DOC/DOCX');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    if (!apiKey) {
      if (onRequireKey) onRequireKey();
      return;
    }

    const currentInput = input;
    const currentSelectedFile = selectedFile;
    
    setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      let parts: any[] = [];
      
      if (currentSelectedFile) {
        const filePart = await processFile(currentSelectedFile);
        parts.push(filePart);
      }

      if (currentInput.trim()) {
        parts.push({ text: currentInput });
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        parts: parts,
        fileName: currentSelectedFile ? currentSelectedFile.name : undefined
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      const ai = new GoogleGenAI({ apiKey });
      
      // Khởi tạo danh sách Fallback Models theo thứ tự ưu tiên
      const modelsToTry = Array.from(new Set([aiModel || 'gemini-3-flash-preview', 'gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash']));
      
      let success = false;
      let lastError = null;
      let aiResponseText = "";

      for (const currentModelToTry of modelsToTry) {
        try {
          const contents = newMessages.filter(m => !m.isError).map(m => ({
            role: m.role,
            parts: m.parts.map(p => {
              if (p.inlineData) return p;
              if (p.text) return { text: p.text };
              return p;
            })
          }));

          const response = await ai.models.generateContent({
            model: currentModelToTry,
            contents: contents as any,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
            },
          });

          aiResponseText = response.text || "";
          success = true;
          break; // Thành công thì thoát vòng lặp
        } catch (error: any) {
          console.warn(`Lỗi khi dùng model \${currentModelToTry}:`, error);
          lastError = error;
          // Chuyển sang model tiếp theo trong danh sách
        }
      }

      if (!success) {
        throw lastError;
      }

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        parts: [{ text: aiResponseText }],
      };

      setMessages((prev) => [...prev, modelMessage]);
      
      if (onContentGenerated) {
        onContentGenerated(aiResponseText);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessageText = error?.message || JSON.stringify(error) || "Lỗi không xác định";
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        parts: [{ text: `**Đã dừng do lỗi!** Không thể kết nối với API.\n\nChi tiết lỗi từ Google API:\n\`\`\`\n\${errorMessageText}\n\`\`\`` }],
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden my-4">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 \${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'model' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 \${message.isError ? 'bg-red-100' : 'bg-blue-100'}`}>
                  {message.isError ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <Bot className="w-5 h-5 text-blue-600" />}
                </div>
              )}
              
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 \${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : message.isError 
                      ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm'
                      : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'
                }`}
              >
                {message.role === 'user' ? (
                  <div>
                    {message.fileName && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-blue-700/20 rounded text-sm">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="truncate">{message.fileName}</span>
                      </div>
                    )}
                    {message.parts.map((p, i) => p.text && (
                      <p key={i} className="whitespace-pre-wrap leading-relaxed">{p.text}</p>
                    ))}
                  </div>
                ) : (
                  <div className={`markdown-body prose prose-sm sm:prose-base max-w-none \${message.isError ? 'prose-red' : 'prose-blue'}`}>
                    <ReactMarkdown>{message.parts[0].text}</ReactMarkdown>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-500">Đang phân tích và thiết kế giáo án...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 relative">
        {selectedFile && (
          <div className="absolute -top-12 left-0 right-0 px-4 max-w-4xl mx-auto flex justify-start">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-1.5 text-sm">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate max-w-[200px] font-medium">{selectedFile.name}</span>
              <button type="button" onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500 ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 max-w-4xl mx-auto">
          <div className="relative flex-1 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm flex items-end">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 text-gray-400 hover:text-blue-600 transition-colors shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                // Reset input value to allow selecting the same file again if removed
                if (e.target) e.target.value = '';
              }}
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Nhập yêu cầu bài dạy hoặc tải lên file giáo án..."
              className="w-full max-h-32 min-h-[56px] py-3.5 pr-4 bg-transparent border-0 focus:ring-0 resize-none outline-none leading-relaxed"
              rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
            />
          </div>
          <button
            type="submit"
            disabled={(!input.trim() && !selectedFile) || isLoading}
            className="shrink-0 w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors shadow-sm mb-0.5"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-3 font-medium">
          SOẠN GIÁO ÁN NLS - HUY 1 có thể mắc lỗi. Vui lòng kiểm tra lại cấu trúc 5512 trước khi sử dụng.
        </p>
      </div>
    </div>
  );
}
