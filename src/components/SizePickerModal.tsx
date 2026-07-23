import { useRef, useState } from 'react'
import { calculateImageSize, normalizeImageSize, type SizeTier } from '../lib/size'

const TIERS: SizeTier[] = ['1K', '2K', '4K']
const RATIOS = [
  { label: '默认 1:1', value: '1:1' },
  { label: '摄影 9:16', value: '9:16' },
  { label: '电影 16:9', value: '16:9' },
  { label: '社交媒体 3:4', value: '3:4' },
  { label: '电脑桌面 4:3', value: '4:3' },
  { label: '单反摄影 2:3', value: '2:3' },
  { label: '单反摄像 3:2', value: '3:2' },
  { label: '超宽银幕 21:9', value: '21:9' },
]

interface Props {
  currentSize: string
  anchor: DOMRect | null
  onSelect: (size: string) => void
  onClose: () => void
  allowAuto?: boolean
}

function findPresetForSize(size: string) {
  const normalized = normalizeImageSize(size)
  for (const tier of TIERS) {
    for (const ratio of RATIOS) {
      if (calculateImageSize(tier, ratio.value) === normalized) {
        return { tier, ratio: ratio.value }
      }
    }
  }
  return null
}

export default function SizePickerModal({ currentSize, anchor, onSelect, onClose, allowAuto = true }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const mouseDownTargetRef = useRef<EventTarget | null>(null)
  const currentPreset = findPresetForSize(currentSize)
  const [tier, setTier] = useState<SizeTier | null>(
    currentSize === 'auto' && allowAuto ? null : currentPreset?.tier ?? '1K',
  )
  const [ratio, setRatio] = useState(currentPreset?.ratio ?? '1:1')
  const previewSize = tier ? normalizeImageSize(calculateImageSize(tier, ratio) ?? '') : 'auto'
  const panelWidth = Math.min(Math.max(anchor?.width ?? 320, 320), window.innerWidth - 24)
  const panelLeft = Math.min(
    Math.max(anchor?.left ?? (window.innerWidth - panelWidth) / 2, 12),
    window.innerWidth - panelWidth - 12,
  )
  const openAbove = Boolean(anchor && window.innerHeight - anchor.bottom < Math.min(560, window.innerHeight * 0.72))
  const panelStyle = openAbove
    ? { left: panelLeft, width: panelWidth, bottom: window.innerHeight - (anchor?.top ?? 0) + 8 }
    : { left: panelLeft, width: panelWidth, top: (anchor?.bottom ?? 80) + 8 }
  const optionClass = (active: boolean) => `flex min-h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold transition-all ${
    active
      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/[0.06] dark:bg-slate-700 dark:text-blue-300 dark:ring-white/[0.08]'
      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
  }`

  return (
    <div
      data-no-drag-select
      className="fixed inset-0 z-[70]"
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target
      }}
      onMouseUp={(e) => {
        if (
          panelRef.current &&
          mouseDownTargetRef.current &&
          !panelRef.current.contains(mouseDownTargetRef.current as Node) &&
          !panelRef.current.contains(e.target as Node)
        ) {
          onClose()
        }
        mouseDownTargetRef.current = null
      }}
    >
      <div
        ref={panelRef}
        style={panelStyle}
        className="fixed z-10 max-h-[72vh] overflow-y-auto rounded-[20px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_50px_-12px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/[0.04] backdrop-blur-2xl animate-dropdown-down dark:border-white/[0.1] dark:bg-slate-900/95 dark:ring-white/[0.06]"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">画面尺寸</h3>
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">分别选择分辨率与图像比例</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <section>
            <div className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">分辨率</div>
            <div className={`grid gap-1 rounded-2xl bg-slate-100/90 p-1 dark:bg-white/[0.05] ${allowAuto ? 'grid-cols-4' : 'grid-cols-3'}`}>
              {allowAuto && (
                <button type="button" onClick={() => setTier(null)} className={optionClass(tier === null)}>
                  auto
                </button>
              )}
              {TIERS.map((item) => (
                <button key={item} type="button" onClick={() => setTier(item)} className={optionClass(tier === item)}>
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">图像比例</div>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]">
              {RATIOS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  disabled={!tier}
                  onClick={() => setRatio(item.value)}
                  className={`flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-xs transition-colors last:border-b-0 dark:border-white/[0.05] ${
                    !tier
                      ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                      : ratio === item.value
                        ? 'bg-blue-50/80 font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{item.label}</span>
                  {tier && ratio === item.value && (
                    <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </section>

          <div className="rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-white/[0.04]">
            <div className="text-[10px] text-slate-400 dark:text-slate-500">将使用</div>
            <div className="mt-1 font-mono text-base font-semibold text-slate-800 dark:text-slate-100">
              {previewSize}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.1]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect(previewSize)
              onClose()
            }}
            className="flex-1 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}
