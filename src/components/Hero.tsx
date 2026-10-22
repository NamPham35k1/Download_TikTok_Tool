import React from 'react';
import { Film, Images, Music, ShieldCheck, Zap } from 'lucide-react';

export function Hero() {
  return (
    <section className="text-center pt-8 pb-4 sm:pt-14 sm:pb-8 px-4 max-w-4xl mx-auto">
      {/* Top Badge */}
      <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-6 shadow-sm">
        <Zap className="w-3.5 h-3.5 text-purple-400" />
        <span>⚡ Nam IT Media Studio — Công Cụ Tải TikTok Cao Cấp</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
        Nam IT Tool — Tải TikTok{' '}
        <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
          Video & Ảnh Không Logo
        </span>
      </h1>

      {/* Supporting Text */}
      <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
        Web tool của <strong className="text-purple-300 font-semibold">Nam IT</strong> hỗ trợ bạn lấy link và tải video TikTok chuẩn HD không dính watermark, tải trọn gói album ảnh slideshow dạng file ZIP và trích xuất nhạc MP3 gốc chỉ trong vài giây.
      </p>

      {/* Highlights Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-medium text-slate-300">
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <Film className="w-4 h-4 text-purple-400" />
          <span>Video HD Không Watermark</span>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <Images className="w-4 h-4 text-indigo-400" />
          <span>Tải Full Ảnh Slideshow & ZIP</span>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <Music className="w-4 h-4 text-cyan-400" />
          <span>Tách Nhạc Chuông MP3</span>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Nam IT • Miễn Phí 100%</span>
        </div>
      </div>
    </section>
  );
}
