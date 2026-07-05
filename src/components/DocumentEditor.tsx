import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, FileText } from 'lucide-react';

interface DocumentEditorProps {
  content: string;
}

export default function DocumentEditor({ content }: DocumentEditorProps) {
  const handleDownload = async () => {
    if (!content) return;
    try {
      const response = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: content }),
      });
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Giao_An_5512.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi khi xuất file DOCX.");
    }
  };

  if (!content) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center h-full bg-white">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-300" />
        </div>
        <p className="font-medium text-gray-500">Bản xem trước giáo án</p>
        <p className="text-sm mt-1">Giáo án sau khi tạo sẽ hiển thị tại đây.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-800">Tài liệu giáo án</h2>
        </div>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Tải xuống DOCX
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="bg-white max-w-[800px] mx-auto min-h-[1056px] shadow-sm border border-gray-200 p-8 sm:p-12">
          <div className="markdown-body prose prose-sm sm:prose-base max-w-none prose-blue">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
