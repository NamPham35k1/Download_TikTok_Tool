import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function ResponsibleUseNotice() {
  return (
    <section className="py-8 px-4 max-w-4xl mx-auto">
      <div className="rounded-2xl p-5 sm:p-6 bg-slate-900/60 border border-slate-800/90 text-slate-400 text-xs sm:text-sm leading-relaxed">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-200 text-sm">
              Lưu Ý Bản Quyền & Sử Dụng Có Trách Nhiệm — Nam IT
            </h3>
            <p>
              Web tool này được phát triển và tối ưu bởi <strong className="text-slate-300">Nam IT</strong> nhằm phục vụ mục đích học tập, nghiên cứu công nghệ và sao lưu nội dung cá nhân hợp pháp. Mọi bản quyền, thương hiệu và nội dung media thuộc quyền sở hữu của các nhà sáng tạo nội dung và ByteDance Ltd.
            </p>
            <p className="text-slate-400">
              Người dùng vui lòng tôn trọng quyền tác giả của người tạo ra video, không sử dụng các nội dung tải về cho mục đích thương mại trái phép khi chưa có sự đồng ý của chủ sở hữu video.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
