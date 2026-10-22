import React from 'react';
import { DownloadCloud } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950 py-10 px-4 text-xs text-slate-500">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Version */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
            <DownloadCloud className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-slate-300">Nam IT TikTok Tool</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800/40">
            v1.0.0 by Nam IT
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center space-x-6 text-slate-400">
          <a href="#home" className="hover:text-white transition">
            Trang Chủ
          </a>
          <a href="#how-it-works" className="hover:text-white transition">
            Hướng Dẫn
          </a>
          <a href="#faq" className="hover:text-white transition">
            Hỏi Đáp
          </a>
          <a href="/api/health" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
            API Health
          </a>
        </div>

        {/* Disclaimer Note */}
        <div className="text-center sm:text-right">
          <p>© {currentYear} Nam IT. Phát triển và duy trì bởi Nam IT.</p>
        </div>
      </div>
    </footer>
  );
}
