'use client';

import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import { PhotoItem } from '@/lib/providers/types';

interface PhotoLightboxModalProps {
  photos: PhotoItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
  onDownloadPhoto: (photo: PhotoItem) => void;
}

export function PhotoLightboxModal({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onSelectIndex,
  onDownloadPhoto,
}: PhotoLightboxModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          onSelectIndex(currentIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < photos.length - 1) {
          onSelectIndex(currentIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onClose, onSelectIndex]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo Preview Lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4"
    >
      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2 text-sm font-medium text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <Eye className="w-4 h-4 text-purple-400" />
          <span>
            Ảnh {currentIndex + 1} / {photos.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onDownloadPhoto(currentPhoto)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Ảnh Này</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Preview"
            className="p-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prev / Next Navigation Buttons */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={() => onSelectIndex(currentIndex - 1)}
          aria-label="Previous photo"
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-full border border-slate-700/60 shadow-lg transition z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          type="button"
          onClick={() => onSelectIndex(currentIndex + 1)}
          aria-label="Next photo"
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-full border border-slate-700/60 shadow-lg transition z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Image */}
      <div className="max-w-4xl max-h-[80vh] flex items-center justify-center relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto.imageUrl}
          alt={`TikTok Slideshow item ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-slate-800"
        />
      </div>

      {/* Bottom Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 overflow-x-auto px-4 py-2">
          {photos.map((item, idx) => (
            <button
              key={item.index}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-transform duration-200 flex-shrink-0 ${
                idx === currentIndex
                  ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/30'
                  : 'border-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
