'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { UrlInputPanel } from '@/components/UrlInputPanel';
import { ResultsPanel } from '@/components/ResultsPanel';
import { HowItWorks } from '@/components/HowItWorks';
import { FaqSection } from '@/components/FaqSection';
import { ResponsibleUseNotice } from '@/components/ResponsibleUseNotice';
import { Footer } from '@/components/Footer';
import { NormalizedMediaResult } from '@/lib/providers/types';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<{
    code: string;
    message: string;
    recoverable: boolean;
  } | null>(null);
  const [mediaResult, setMediaResult] = useState<NormalizedMediaResult | null>(null);
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState<string>('');

  const handleResolveUrl = async (url: string) => {
    try {
      setIsLoading(true);
      setInlineError(null);
      setServerError(null);
      setMediaResult(null);
      setLastSubmittedUrl(url);

      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json || !json.success) {
        const errorData = json?.error || {
          code: 'FETCH_ERROR',
          message: 'Không thể kết nối đến máy chủ xử lý. Vui lòng kiểm tra lại kết nối mạng.',
          recoverable: true,
        };
        setServerError(errorData);
        return;
      }

      setMediaResult(json.data);
    } catch (err: unknown) {
      setServerError({
        code: 'NETWORK_ERROR',
        message:
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi mạng trong quá trình liên lạc với máy chủ.',
        recoverable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastSubmittedUrl) {
      handleResolveUrl(lastSubmittedUrl);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main id="home" className="flex-1">
        <Hero />

        <UrlInputPanel
          onSubmit={handleResolveUrl}
          isLoading={isLoading}
          inlineError={inlineError}
          setInlineError={setInlineError}
        />

        {/* LOADING SKELETON STATE */}
        {isLoading && (
          <div className="w-full max-w-4xl mx-auto px-4 mb-16 animate-pulse">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-72 aspect-[9/16] max-h-80 bg-slate-800/60 rounded-2xl flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-2 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                    <span className="text-xs font-medium">Đang phân tích link TikTok (Nam IT)...</span>
                  </div>
                </div>
                <div className="flex-1 w-full space-y-4 py-2">
                  <div className="h-6 bg-slate-800/80 rounded-md w-3/4" />
                  <div className="h-4 bg-slate-800/60 rounded-md w-1/2" />
                  <div className="h-10 bg-slate-800/40 rounded-xl w-full mt-6" />
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="h-14 bg-slate-800/60 rounded-xl" />
                    <div className="h-14 bg-slate-800/60 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SERVER ERROR STATE */}
        {serverError && !isLoading && (
          <div className="w-full max-w-2xl mx-auto px-4 mb-12 animate-fade-in">
            <div className="p-5 sm:p-6 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-slate-200 shadow-xl">
              <div className="flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-rose-900/50 text-rose-300 flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-white">Thông Báo Xử Lý • Nam IT</h3>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-900/60 text-rose-200">
                      {serverError.code}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-200/90 mt-1.5 leading-relaxed">
                    {serverError.message}
                  </p>

                  {serverError.recoverable && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center space-x-1.5 mt-4 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-800/60 hover:bg-rose-700 text-white transition border border-rose-700/50 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Thử Lại</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS RESULTS PANEL */}
        {mediaResult && !isLoading && <ResultsPanel media={mediaResult} />}

        {/* Informative Content Sections */}
        <HowItWorks />
        <FaqSection />
        <ResponsibleUseNotice />
      </main>

      <Footer />
    </div>
  );
}
