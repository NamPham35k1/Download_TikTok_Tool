'use client';

import React, { useEffect, useState } from 'react';
import { DownloadCloud } from 'lucide-react';

interface HealthData {
  status: string;
  provider: {
    name: string;
    healthy: boolean;
  };
}

export function Header() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setHealth(data);
      })
      .catch(() => {
        // Silently handle initial health check check
      });
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <a href="#home" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-[2px] transition-transform duration-200 group-hover:scale-105 shadow-md shadow-purple-900/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <DownloadCloud className="w-5 h-5 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                Nam IT <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">TikTok Tool</span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Tool Tải Video & Ảnh TikTok Không Logo • Nam IT</p>
          </div>
        </a>

        {/* Navigation */}
        <nav className="flex items-center space-x-2 sm:space-x-6 text-sm">
          <a
            href="#home"
            className="text-slate-300 hover:text-white px-2 py-1 rounded-md transition-colors"
          >
            Trang Chủ
          </a>
          <a
            href="#how-it-works"
            className="text-slate-400 hover:text-white px-2 py-1 rounded-md transition-colors hidden sm:inline-block"
          >
            Hướng Dẫn
          </a>
          <a
            href="#faq"
            className="text-slate-400 hover:text-white px-2 py-1 rounded-md transition-colors hidden sm:inline-block"
          >
            Hỏi Đáp
          </a>

          {/* Provider Status Pill */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.provider.healthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="hidden md:inline text-slate-400">Máy chủ:</span>
            <span className="text-slate-200 font-mono text-[11px]">
              {health?.provider.name ? health.provider.name.split(' ')[0] : 'Sẵn sàng'}
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}
