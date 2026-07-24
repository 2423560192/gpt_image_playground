import { createPortal } from 'react-dom'
import { useRef } from 'react'
import type { AppMode } from '../types'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'
import { usePreventBackgroundScroll } from '../hooks/usePreventBackgroundScroll'

interface HelpModalProps {
  appMode: AppMode
  isFavoriteCollectionOverview?: boolean
  onClose: () => void
}

export default function HelpModal({ appMode, isFavoriteCollectionOverview = false, onClose }: HelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  useCloseOnEscape(true, onClose)
  usePreventBackgroundScroll(true, modalRef)

  return createPortal(
    <div data-no-drag-select className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-overlay-in" />
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/50 bg-white/95 p-5 shadow-2xl ring-1 ring-black/5 animate-modal-in dark:border-white/10 dark:bg-gray-900/95 dark:ring-white/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100">
            <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" strokeWidth={2} strokeLinecap="round" />
            </svg>
            操作指南
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10" aria-label="关闭">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {appMode === 'editor' ? (
          <div className="space-y-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
            <p>点击“打开图片”上传本地图片，或从“最近作品”中选择一张生成结果。</p>
            <p>编辑器支持旋转、水平/垂直翻转、中心比例裁剪，以及亮度、对比度和饱和度调整。</p>
            <p>预览和导出都在浏览器本地完成。点击“导出 PNG”即可下载处理后的原尺寸图片。</p>
          </div>
        ) : isFavoriteCollectionOverview ? (
          <div className="space-y-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
            <p>点击收藏夹进入详情。桌面端可用 Ctrl/⌘ 点击或拖框多选，移动端可在卡片上左右滑动选择。</p>
            <p>选中后可批量下载或删除收藏夹。</p>
          </div>
        ) : (
          <div className="space-y-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
            <p>在底部输入提示词并设置参数，即可提交图片生成任务。添加参考图后可继续进行图生图或局部重绘。</p>
            <p>桌面端可用 Ctrl/⌘ 点击或拖框多选任务，移动端可在任务卡片上左右滑动选择。</p>
            <p>点击任务可查看详情、复用参数、编辑输出、收藏或下载图片。</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
