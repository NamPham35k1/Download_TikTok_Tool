'use client';

import React, { useState } from 'react';
import {
  Download,
  Film,
  Images,
  Music,
  FileArchive,
  Loader2,
  AlertTriangle,
  Sparkles,
  Maximize2,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { NormalizedMediaResult } from '@/lib/providers/types';
import { PhotoLightboxModal } from './PhotoLightboxModal';

interface ResultsPanelProps {
  media: NormalizedMediaResult;
}

export function ResultsPanel({ media }: ResultsPanelProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Helper to trigger browser download from a Blob
  const triggerBrowserBlobDownload = (blob: Blob, filename: string) => {
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Keep URL alive for 60 seconds so mobile download managers can finish reading
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 60000);
  };

  // Smart download handler supporting Web Share API Level 2 (Directly saves to iPhone Photos app)
  const handleSaveToDevice = async (variantUrl: string, filename: string, trackId: string) => {
    try {
      setSharingId(trackId);
      setDownloadError(null);

      // Fetch the video through our proxy
      const downloadProxyUrl = `/api/download?url=${encodeURIComponent(variantUrl)}&filename=${encodeURIComponent(filename)}&contentType=video/mp4`;
      const res = await fetch(downloadProxyUrl);
      if (!res.ok) {
        throw new Error(`Tải dữ liệu thất bại (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'video/mp4' });

      // If mobile supports Web Share API with files (iOS Safari)
      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: 'Nam IT TikTok Video',
        });
        return;
      }

      // Otherwise fallback to Blob download
      triggerBrowserBlobDownload(blob, filename);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User closed the share sheet
        return;
      }
      // If error or cancelled, fallback to direct download link
      window.open(
        `/api/download?url=${encodeURIComponent(variantUrl)}&filename=${encodeURIComponent(filename)}`,
        '_blank'
      );
    } finally {
      setSharingId(null);
    }
  };

  // Download all slideshow photos as a single ZIP archive through /api/download-zip
  const handleDownloadAllZip = async () => {
    if (!media.photos || media.photos.length === 0) return;

    try {
      setIsZipping(true);
      setDownloadError(null);

      const items = media.photos.map((p) => ({
        url: p.imageUrl,
        filename: p.filename,
      }));

      const res = await fetch('/api/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          zipFilename: `namit-tiktok-${media.id}-photos.zip`,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || `Đóng gói file ZIP thất bại (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      triggerBrowserBlobDownload(blob, `namit-tiktok-${media.id}-photos.zip`);
    } catch (err: unknown) {
      setDownloadError(err instanceof Error ? err.message : 'Lỗi khi đóng gói file ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  const isSlideshow = media.contentType === 'slideshow';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-16 animate-fade-in">
      {/* Top Media Header Card */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          {/* Media Visual Column */}
          <div className="w-full md:w-72 flex-shrink-0 flex flex-col items-center">
            <div className="relative w-full aspect-[9/16] max-h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.thumbnailUrl || (media.photos[0]?.imageUrl ?? '')}
                alt={media.title || 'TikTok thumbnail'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Overlay Badge */}
              <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/70 backdrop-blur-md text-white border border-white/10">
                {isSlideshow ? (
                  <>
                    <Images className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{media.photos.length} Ảnh</span>
                  </>
                ) : (
                  <>
                    <Film className="w-3.5 h-3.5 text-purple-400" />
                    <span>Video TikTok</span>
                  </>
                )}
              </div>

              {/* Enlarge preview trigger button */}
              {isSlideshow && media.photos.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPhotoIndex(0);
                    setLightboxOpen(true);
                  }}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white backdrop-blur border border-white/20 transition shadow"
                  title="Mở Xem Toàn Màn Hình"
                >
                  <Maximize2 className="w-4 h-4 text-purple-300" />
                </button>
              )}
            </div>

            {/* Author Attribution Card */}
            {media.author && (
              <div className="w-full mt-3 flex items-center space-x-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                {media.author.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.author.avatarUrl}
                    alt={media.author.nickname}
                    className="w-10 h-10 rounded-full object-cover border border-purple-500/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
                    {media.author.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {media.author.nickname}
                  </p>
                  <p className="text-xs text-slate-400 truncate">@{media.author.uniqueId}</p>
                </div>
              </div>
            )}
          </div>

          {/* Details & Actions Column */}
          <div className="flex-1 min-w-0 w-full flex flex-col justify-between">
            <div>
              {/* Content Type Pill & Verified Source */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Xử Lý Bởi Nam IT Tool</span>
                </span>
                <span className="text-xs text-slate-400">
                  Máy chủ: <strong className="text-slate-300">{media.providerName}</strong>
                </span>
              </div>

              {/* Title / Description */}
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3 line-clamp-3 leading-snug">
                {media.title || 'Nội dung video / bài đăng TikTok'}
              </h2>

              {/* Engagement Stats Bar */}
              {media.stats && (
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400 mb-6 pb-4 border-b border-slate-800">
                  {media.stats.playCount !== undefined && (
                    <span>
                      Lượt xem: <strong className="text-slate-200">{media.stats.playCount.toLocaleString()}</strong>
                    </span>
                  )}
                  {media.stats.likeCount !== undefined && (
                    <span>
                      Lượt thích: <strong className="text-slate-200">{media.stats.likeCount.toLocaleString()}</strong>
                    </span>
                  )}
                  {media.stats.commentCount !== undefined && (
                    <span>
                      Bình luận: <strong className="text-slate-200">{media.stats.commentCount.toLocaleString()}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Audio Banner if available */}
              {media.music && media.music.playUrl && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-6">
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <Music className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-200 truncate">
                        {media.music.title || 'Nhạc Nền Gốc'}
                      </p>
                      {media.music.author && (
                        <p className="text-[11px] text-slate-400 truncate">{media.music.author}</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={`/api/download?url=${encodeURIComponent(media.music.playUrl)}&filename=${encodeURIComponent(`namit-tiktok-${media.id}-audio.mp3`)}&contentType=audio/mpeg`}
                    download={`namit-tiktok-${media.id}-audio.mp3`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition flex-shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tải Nhạc MP3</span>
                  </a>
                </div>
              )}

              {/* Error Alert if download fails */}
              {downloadError && (
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs mb-4">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{downloadError}</span>
                </div>
              )}

              {/* ACTION SECTION: If Video -> Show Video Variants */}
              {!isSlideshow && media.videoVariants.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Các Định Dạng Video Có Thể Tải (Hỗ trợ iPhone & Android)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {media.videoVariants.map((variant) => {
                      const isNoWatermark = !variant.hasWatermark;
                      const isHd = variant.id.includes('hd');
                      const isThisSharing = sharingId === variant.id;
                      const safeFilename = `namit-tiktok-${media.id}-${variant.id}.mp4`;
                      const directDownloadUrl = `/api/download?url=${encodeURIComponent(
                        variant.downloadUrl
                      )}&filename=${encodeURIComponent(safeFilename)}&contentType=video/mp4`;

                      return (
                        <div
                          key={variant.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition duration-200 ${
                            isNoWatermark
                              ? 'bg-gradient-to-r from-purple-950/40 to-slate-900 border-purple-500/40 hover:border-purple-400'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-sm font-bold text-white">
                                {variant.qualityLabel}
                              </span>
                              {isHd && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500 text-white">
                                  HD
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {isNoWatermark ? 'Bản sạch không logo (Nam IT)' : 'Bản gốc có logo TikTok'}
                            </p>
                          </div>

                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            {/* Primary Action Button: Web Share API for iPhone (Lưu vào Album Ảnh) / Download */}
                            <button
                              type="button"
                              disabled={sharingId !== null}
                              onClick={() =>
                                handleSaveToDevice(variant.downloadUrl, safeFilename, variant.id)
                              }
                              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow transition cursor-pointer active:scale-95 disabled:opacity-60"
                              title="Tải về máy hoặc Lưu vào Album Ảnh"
                            >
                              {isThisSharing ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang tải...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Tải Về</span>
                                </>
                              )}
                            </button>

                            {/* Direct link as fallback */}
                            <a
                              href={directDownloadUrl}
                              download={safeFilename}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Tải file trực tiếp (.mp4)"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ACTION SECTION: If Slideshow -> Batch ZIP Download Button */}
              {isSlideshow && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">
                        Album Ảnh Slideshow ({media.photos.length} Bức Ảnh) • Nam IT
                      </p>
                      <p className="text-xs text-slate-400">
                        Bạn có thể bấm tải từng ảnh riêng lẻ phía dưới hoặc tải toàn bộ album được nén thành 1 file ZIP.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isZipping || media.photos.length === 0}
                    onClick={handleDownloadAllZip}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 transition shadow-lg shadow-indigo-900/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isZipping ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang nén {media.photos.length} ảnh thành file ZIP...</span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="w-5 h-5 text-indigo-200" />
                        <span>Tải Trọn Bộ Ảnh Dạng File ZIP ({media.photos.length} Ảnh)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slideshow Photo Grid */}
        {isSlideshow && media.photos.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center space-x-2">
              <Images className="w-4 h-4 text-purple-400" />
              <span>Bộ Sưu Tập Ảnh Chi Tiết (Nhấp vào ảnh để phóng to)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {media.photos.map((photo, index) => {
                const photoDownloadUrl = `/api/download?url=${encodeURIComponent(
                  photo.imageUrl
                )}&filename=${encodeURIComponent(`namit-${photo.filename}`)}&contentType=image/jpeg`;

                return (
                  <div
                    key={photo.index}
                    className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md"
                  >
                    {/* Image Thumbnail */}
                    <div
                      onClick={() => {
                        setSelectedPhotoIndex(index);
                        setLightboxOpen(true);
                      }}
                      className="aspect-square w-full cursor-pointer overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.imageUrl}
                        alt={`Ảnh slide ${photo.index}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Slide Number Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur">
                      #{photo.index}
                    </div>

                    {/* Download Single Photo Button */}
                    <div className="p-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono truncate">
                        {photo.filename}
                      </span>
                      <a
                        href={photoDownloadUrl}
                        download={`namit-${photo.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
                        title="Tải ảnh này về máy"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Download Helper Note */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-start space-x-3 text-xs text-slate-400 bg-slate-900/60 p-4 rounded-xl border border-purple-500/20">
          <Smartphone className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-bold text-sm text-purple-200">📱 Hướng dẫn tải video về máy trên iPhone:</p>
            <div className="space-y-1.5 text-slate-300">
              <p>
                <strong>Cách 1 (Lưu thẳng vào Album Ảnh):</strong> Bấm nút <strong>Tải Về</strong> màu tím ➔ Đợi 1–2 giây để tải dữ liệu ➔ Màn hình iPhone sẽ tự động bật bảng Chia sẻ ➔ Chọn dòng <strong>&ldquo;Lưu video&rdquo; (Save Video)</strong>. Video sẽ ngay lập tức xuất hiện trong <strong>Album Ảnh (Photos)</strong>!
              </p>
              <p>
                <strong>Cách 2 (Tải file vào ứng dụng Tệp):</strong> Bấm vào biểu tượng ô vuông mũi tên <strong>(↗️)</strong> bên cạnh ➔ Safari sẽ hỏi &ldquo;Bạn có muốn tải về?&rdquo; ➔ Bấm <strong>Tải về</strong>. File sẽ nằm trong ứng dụng <strong>Tệp (Files) ➔ Tải về</strong>.
              </p>
              <p className="pt-1 text-amber-300/90">
                ⚠️ <em>Lưu ý:</em> Nếu bạn đang mở link từ trong ứng dụng Zalo, Messenger hoặc Facebook, hãy bấm dấu 3 chấm <strong>(⋮)</strong> ở góc trên và chọn <strong>&ldquo;Mở bằng Safari&rdquo;</strong> để tránh bị ứng dụng chặn tải nhé!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isSlideshow && (
        <PhotoLightboxModal
          photos={media.photos}
          currentIndex={selectedPhotoIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onSelectIndex={(idx) => setSelectedPhotoIndex(idx)}
          onDownloadPhoto={(photo) => {
            const url = `/api/download?url=${encodeURIComponent(
              photo.imageUrl
            )}&filename=${encodeURIComponent(`namit-${photo.filename}`)}&contentType=image/jpeg`;
            window.open(url, '_blank');
          }}
        />
      )}
    </div>
  );
}
