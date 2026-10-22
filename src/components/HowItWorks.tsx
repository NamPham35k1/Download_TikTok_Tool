import React from 'react';
import { Copy, Sparkles, DownloadCloud } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Sao Chép Link TikTok',
      description:
        'Mở ứng dụng hoặc trang web TikTok, chọn video hoặc album ảnh bạn muốn lưu, bấm nút Chia sẻ (Share) -> Sao chép liên kết (Copy Link).',
      icon: Copy,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      step: '02',
      title: 'Dán Vào Tool Nam IT',
      description:
        'Dán đường link vào ô nhập liệu phía trên. Hệ thống của Nam IT sẽ tự động phân tích và trích xuất dữ liệu gốc chất lượng cao nhất.',
      icon: Sparkles,
      color: 'from-indigo-500 to-cyan-500',
    },
    {
      step: '03',
      title: 'Tải File Sạch Về Máy',
      description:
        'Lựa chọn tải video HD không logo, tải nhạc chuông MP3 hoặc tải toàn bộ bộ ảnh slideshow được đóng gói sẵn trong file ZIP.',
      icon: DownloadCloud,
      color: 'from-cyan-500 to-emerald-500',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Cách Hoạt Động Của Tool Nam IT
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          Tải video và album ảnh TikTok nhanh chóng chỉ với 3 bước đơn giản, không cần cài đặt phần mềm.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="glass-panel p-6 rounded-2xl border border-slate-800/80 relative flex flex-col justify-between hover:border-slate-700 transition duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black font-mono text-slate-500">
                    {item.step}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} p-[1.5px]`}
                  >
                    <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
