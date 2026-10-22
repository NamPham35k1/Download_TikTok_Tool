'use client';

import React, { useState, FormEvent } from 'react';
import { Search, Clipboard, X, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { validateAndNormalizeTikTokUrl } from '@/lib/security/url-validator';

interface UrlInputPanelProps {
  onSubmit: (url: string) => Promise<void>;
  isLoading: boolean;
  inlineError: string | null;
  setInlineError: (error: string | null) => void;
}

const SAMPLE_URLS = [
  {
    label: 'Video Mẫu',
    url: 'https://www.tiktok.com/@tiktok/video/7106594312292453675',
  },
  {
    label: 'Link Rút Gọn (vm.tiktok)',
    url: 'https://vm.tiktok.com/ZMkY7uX1x/',
  },
];

export function UrlInputPanel({
  onSubmit,
  isLoading,
  inlineError,
  setInlineError,
}: UrlInputPanelProps) {
  const [url, setUrl] = useState('');
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    if (inlineError) {
      setInlineError(null);
    }
  };

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setClipboardFeedback('Trình duyệt chưa cho phép truy cập clipboard.');
        setTimeout(() => setClipboardFeedback(null), 3000);
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        const trimmed = text.trim();
        setUrl(trimmed);
        setInlineError(null);
        setClipboardFeedback('Đã dán liên kết từ clipboard!');
        setTimeout(() => setClipboardFeedback(null), 2000);
      } else {
        setClipboardFeedback('Clipboard đang trống.');
        setTimeout(() => setClipboardFeedback(null), 2000);
      }
    } catch {
      setClipboardFeedback('Vui lòng cấp quyền clipboard để tự động dán.');
      setTimeout(() => setClipboardFeedback(null), 3000);
    }
  };

  const handleClear = () => {
    setUrl('');
    setInlineError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setInlineError('Vui lòng nhập link video hoặc ảnh TikTok.');
      return;
    }

    const check = validateAndNormalizeTikTokUrl(url);
    if (!check.isValid) {
      setInlineError(check.error || 'Link TikTok không hợp lệ.');
      return;
    }

    setInlineError(null);
    await onSubmit(url.trim());
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setInlineError(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mt-2 mb-10">
      <form
        onSubmit={handleSubmit}
        className="glass-panel-glow p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl transition-all duration-300 focus-within:ring-2 focus-within:ring-purple-500/50"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Main Input */}
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="url"
              value={url}
              onChange={handleInputChange}
              placeholder="Dán link video hoặc ảnh TikTok vào đây (vd: tiktok.com/@user/video/...)"
              disabled={isLoading}
              className="w-full pl-11 pr-20 py-3.5 text-sm sm:text-base bg-slate-900/90 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-800 disabled:opacity-60 transition"
              aria-label="TikTok URL Input"
              autoComplete="off"
              spellCheck={false}
            />

            {/* Quick Action Buttons inside input */}
            <div className="absolute right-2 flex items-center space-x-1">
              {url ? (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading}
                  title="Xóa link"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  disabled={isLoading}
                  title="Dán từ clipboard"
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/90 hover:bg-slate-700 hover:text-white rounded-lg transition border border-slate-700/50"
                >
                  <Clipboard className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Dán link</span>
                </button>
              )}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 active:scale-[0.98] rounded-xl transition shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang Xử Lý...</span>
              </>
            ) : (
              <>
                <span>Tải Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Clipboard Feedback Notice */}
      {clipboardFeedback && (
        <p className="text-xs text-indigo-300 mt-2 text-center animate-fade-in font-medium">
          {clipboardFeedback}
        </p>
      )}

      {/* Inline Validation Error */}
      {inlineError && (
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-xl px-4 py-2.5 mt-3 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{inlineError}</span>
        </div>
      )}

      {/* Helpful Sample Links */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
        <span className="text-slate-400">Link Mẫu Thử Nghiệm:</span>
        {SAMPLE_URLS.map((sample) => (
          <button
            key={sample.label}
            type="button"
            onClick={() => handleSelectSample(sample.url)}
            className="px-2.5 py-1 rounded-md bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-purple-300 transition-colors"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
