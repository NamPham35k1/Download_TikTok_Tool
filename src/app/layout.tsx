import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nam IT TikTok Tool — Tải Video & Ảnh TikTok Không Logo',
  description:
    'Tool của Nam IT hỗ trợ tải video TikTok không watermark (HD), tải trọn bộ ảnh slideshow dạng ZIP và tách nhạc MP3 chất lượng cao, miễn phí và không cần đăng ký.',
  keywords: [
    'Nam IT',
    'Nam IT Tool',
    'Nam IT TikTok',
    'Tool tải TikTok Nam IT',
    'TikTok downloader Nam IT',
    'Tải video TikTok không logo',
    'Tải ảnh TikTok slideshow ZIP',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-purple-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
