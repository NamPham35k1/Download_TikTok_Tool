'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Tool của Nam IT tải video không logo bằng cách nào?',
    answer:
      'Hệ thống backend của Nam IT kết nối trực tiếp đến máy chủ CDN của TikTok để lấy luồng video gốc chất lượng cao trước khi hệ thống TikTok chèn hình mờ (watermark) logo, giúp bạn nhận được video sắc nét và sạch sẽ nhất.',
  },
  {
    question: 'Tool Nam IT có hỗ trợ tải album ảnh slideshow TikTok không?',
    answer:
      'Có! Đối với bài đăng chứa nhiều ảnh (carousel/slideshow), công cụ của Nam IT tự động trích xuất toàn bộ ảnh theo thứ tự gốc, cho phép bạn xem ảnh kích thước lớn, tải từng ảnh hoặc bấm tải trọn bộ bằng 1 file ZIP.',
  },
  {
    question: 'Tính năng tải trọn bộ ảnh dạng file ZIP hoạt động ra sao?',
    answer:
      'Máy chủ của Nam IT sẽ tải tuần tự các bức ảnh gốc với tên file chuẩn (tiktok-photo-01.jpg, tiktok-photo-02.jpg...), nén tự động thành file .zip và chuyển trực tiếp về thiết bị của bạn.',
  },
  {
    question: 'Tool của Nam IT có hoạt động trên điện thoại (iPhone / Android) không?',
    answer:
      'Hoàn toàn tương thích! Bạn có thể sử dụng web tool của Nam IT trên mọi trình duyệt web như Safari, Chrome, Edge trên iPhone, iPad, điện thoại Android, máy tính Windows và MacBook mà không cần cài thêm app.',
  },
  {
    question: 'Có tải được video từ tài khoản TikTok riêng tư (Private) không?',
    answer:
      'Không. Vì lý do bảo mật và quyền riêng tư của nền tảng, tool chỉ hỗ trợ tải các video và album ảnh được tác giả đăng ở chế độ Công khai (Public).',
  },
  {
    question: 'Sử dụng web tool của Nam IT có mất phí hay phải đăng ký không?',
    answer:
      'Hoàn toàn miễn phí 100%! Bạn không cần tạo tài khoản, không cần đăng nhập hay trả bất kỳ chi phí nào.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium mb-3">
          <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
          <span>Giải Đáp Thắc Mắc</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Câu Hỏi Thường Gặp Về Tool Nam IT
        </h2>
        <p className="text-sm text-slate-400">
          Giải đáp chi tiết các thắc mắc khi sử dụng công cụ tải TikTok của Nam IT.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.question}
              className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-semibold text-sm sm:text-base text-white hover:text-purple-300 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-4 ${
                    isOpen ? 'rotate-180 text-purple-400' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-3 animate-fade-in">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
