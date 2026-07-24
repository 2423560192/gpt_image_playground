import type { ApiProfile, TaskParams } from '../../types'
import { calculateImageSize, normalizeImageSize, type SizeTier } from '../../lib/size'
import { dismissAllTooltips } from '../../lib/tooltipDismiss'
import Select from '../Select'
import ButtonTooltip from './buttonTooltip'

const SIZE_TIERS: SizeTier[] = ['1K', '2K', '4K']
const RATIO_OPTIONS = [
  { label: '默认 1:1', value: '1:1' },
  { label: '摄影 9:16', value: '9:16' },
  { label: '电影 16:9', value: '16:9' },
  { label: '社交媒体 3:4', value: '3:4' },
  { label: '电脑桌面 4:3', value: '4:3' },
  { label: '单反摄影 2:3', value: '2:3' },
  { label: '单反摄像 3:2', value: '3:2' },
  { label: '超宽银幕 21:9', value: '21:9' },
]

interface HintTooltipState {
  visible: boolean
  show: () => void
  hide: () => void
  clearTimer: () => void
  startTouch: () => void
}

export default function InputParamsPanel({
  cols,
  expanded = false,
  params,
  setParams,
  activeProfile,
  isFalProvider,
  isFalTextToImage,
  displaySize,
  qualityOptions,
  selectClass,
  transparentOutputAvailable,
  showTransparentOutputControl,
  transparentOutputEnabled,
  transparentOutputHint,
  onTransparentOutputMenuOpenChange,
  compressionHint,
  compressionDisabled,
  outputCompressionInput,
  setOutputCompressionInput,
  commitOutputCompression,
  moderationHint,
  moderationDisabled,
  outputImageLimit,
  nInput,
  setNInputFocused,
  commitN,
  handleNInputChange,
  handleNLimitIncreaseAttempt,
  hideNLimitHint,
  nLimitHint,
  nLimitHintText,
  streamConcurrentByN,
  streamConcurrentHint,
  sizeHint,
  qualityHint,
  onOpenSizePicker,
}: {
  cols: string
  expanded?: boolean
  params: TaskParams
  setParams: (patch: Partial<TaskParams>) => void
  activeProfile: ApiProfile
  isFalProvider: boolean
  isFalTextToImage: boolean
  displaySize: string
  qualityOptions: Array<{ label: string; value: string }>
  selectClass: string
  transparentOutputAvailable: boolean
  showTransparentOutputControl: boolean
  transparentOutputEnabled: boolean
  transparentOutputHint: HintTooltipState
  onTransparentOutputMenuOpenChange: (open: boolean) => void
  compressionHint: HintTooltipState
  compressionDisabled: boolean
  outputCompressionInput: string
  setOutputCompressionInput: (value: string) => void
  commitOutputCompression: () => void
  moderationHint: HintTooltipState
  moderationDisabled: boolean
  outputImageLimit: number
  nInput: string
  setNInputFocused: (focused: boolean) => void
  commitN: () => void
  handleNInputChange: (value: string) => void
  handleNLimitIncreaseAttempt: (preventDefault: () => void) => void
  hideNLimitHint: () => void
  nLimitHint: HintTooltipState
  nLimitHintText: string
  streamConcurrentByN: boolean
  streamConcurrentHint: HintTooltipState
  sizeHint: HintTooltipState
  qualityHint: HintTooltipState
  onOpenSizePicker: (anchor: DOMRect) => void
}) {
  if (expanded) {
    const optionClass = (active: boolean, disabled = false) => `flex min-h-9 flex-1 items-center justify-center rounded-xl px-2 text-[11px] font-semibold transition-all ${
      disabled
        ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
        : active
          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/[0.06] dark:bg-slate-700 dark:text-blue-300 dark:ring-white/[0.08]'
          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
    }`
    const fieldClass = 'relative space-y-1.5'
    const labelClass = 'block text-xs font-bold text-slate-700 dark:text-slate-300'
    const groupClass = 'flex gap-1 rounded-2xl bg-slate-100/90 p-1 dark:bg-white/[0.05]'
    const qualityValue = activeProfile.codexCli
      ? 'auto'
      : isFalProvider && params.quality === 'auto'
        ? 'high'
        : params.quality
    const normalizedSize = normalizeImageSize(params.size)
    const sizePreset = SIZE_TIERS
      .flatMap((tier) => RATIO_OPTIONS.map((option) => ({ tier, ratio: option.value })))
      .find((item) => calculateImageSize(item.tier, item.ratio) === normalizedSize)
    const sizeTier = sizePreset?.tier ?? '1K'
    const sizeRatio = sizePreset?.ratio ?? '1:1'

    return (
      <div className="space-y-3.5 text-xs">
        <div
          className={fieldClass}
          onMouseEnter={sizeHint.show}
          onMouseLeave={sizeHint.hide}
          onTouchStart={sizeHint.startTouch}
          onTouchEnd={sizeHint.clearTimer}
          onTouchCancel={sizeHint.hide}
          onClick={sizeHint.show}
        >
          <span className="block text-xs font-medium text-blue-500 dark:text-blue-400">图片比例</span>
          <Select
            value={sizeRatio}
            onChange={(value) => setParams({ size: calculateImageSize(sizeTier, String(value)) ?? params.size })}
            options={RATIO_OPTIONS}
            className="rounded-xl border-2 border-blue-400 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all dark:border-blue-500 dark:bg-white/[0.04] dark:text-slate-200"
          />
          <ButtonTooltip
            visible={isFalTextToImage && sizeHint.visible}
            text={<>fal.ai 的文生图模式不支持 <code className="rounded bg-white/10 px-1 py-0.5 font-mono">auto</code> 参数</>}
          />
        </div>

        <div className={fieldClass}>
          <span className={labelClass}>分辨率</span>
          <div className="grid grid-cols-3 gap-2">
            {SIZE_TIERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setParams({ size: calculateImageSize(item, sizeRatio) ?? params.size })}
                className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                  sizeTier === item
                    ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-blue-300 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300'
                }`}
              >
                {item}{item === '1K' ? '(默认)' : ''}
              </button>
            ))}
          </div>
          <span className="block text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
            2K / 4K 更清晰，生成更慢、消耗更多额度
          </span>
        </div>

        <div
          className={fieldClass}
          onMouseEnter={qualityHint.show}
          onMouseLeave={qualityHint.hide}
          onTouchStart={qualityHint.startTouch}
          onTouchEnd={qualityHint.clearTimer}
          onTouchCancel={qualityHint.hide}
          onClick={qualityHint.show}
        >
          <span className={labelClass}>生成质量</span>
          <div className={groupClass}>
            {qualityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={activeProfile.codexCli}
                onClick={() => setParams({ quality: option.value as TaskParams['quality'] })}
                className={optionClass(qualityValue === option.value, activeProfile.codexCli)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <ButtonTooltip
            visible={(activeProfile.codexCli || isFalProvider) && qualityHint.visible}
            text={isFalProvider ? <>fal.ai 不支持 <code className="rounded bg-white/10 px-1 py-0.5 font-mono">auto</code> 质量参数</> : 'Codex CLI 不支持质量参数'}
          />
        </div>

        <div className={fieldClass}>
          <span className={labelClass}>输出格式</span>
          <div className={groupClass}>
            {[
              { label: 'PNG', value: 'png' },
              { label: 'JPEG', value: 'jpeg' },
              { label: 'WebP', value: 'webp' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setParams({
                  output_format: option.value as TaskParams['output_format'],
                  ...(option.value === 'png' ? { output_compression: null } : { transparent_output: false }),
                })}
                className={optionClass(params.output_format === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {showTransparentOutputControl ? (
          <div
            className={fieldClass}
            onMouseEnter={transparentOutputHint.show}
            onMouseLeave={transparentOutputHint.hide}
            onTouchStart={transparentOutputHint.startTouch}
            onTouchEnd={transparentOutputHint.clearTimer}
            onTouchCancel={transparentOutputHint.hide}
            onClick={transparentOutputHint.show}
          >
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/55 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <div>
                <span className={labelClass}>透明背景</span>
                <span className="mt-1 block text-[10px] text-slate-400 dark:text-slate-500">移除生成图片背景</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={transparentOutputEnabled}
                disabled={!transparentOutputAvailable}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!transparentOutputAvailable) return
                  onTransparentOutputMenuOpenChange(false)
                  setParams({ transparent_output: !transparentOutputEnabled, output_compression: null })
                }}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  !transparentOutputAvailable
                    ? 'cursor-not-allowed bg-slate-200 opacity-50 dark:bg-white/[0.08]'
                    : transparentOutputEnabled
                      ? 'bg-blue-500'
                      : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${transparentOutputEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <ButtonTooltip visible={transparentOutputHint.visible} text="基于提示词与后处理，并非模型原生生成" />
          </div>
        ) : (
          <label
            className={fieldClass}
            onMouseEnter={compressionHint.show}
            onMouseLeave={compressionHint.hide}
            onTouchStart={compressionHint.startTouch}
            onTouchEnd={compressionHint.clearTimer}
            onTouchCancel={compressionHint.hide}
            onClick={compressionHint.show}
          >
            <span className={labelClass}>输出压缩率</span>
            <div className="relative">
              <input
                value={outputCompressionInput}
                onChange={(e) => setOutputCompressionInput(e.target.value)}
                onBlur={commitOutputCompression}
                disabled={compressionDisabled}
                type="number"
                min={0}
                max={100}
                placeholder="0-100"
                className={`w-full rounded-2xl border border-slate-200/80 px-4 py-3 pr-10 text-xs shadow-sm outline-none transition-all dark:border-white/[0.08] ${
                  compressionDisabled
                    ? 'cursor-not-allowed bg-slate-100/70 text-slate-400 dark:bg-white/[0.04]'
                    : 'bg-white/70 text-slate-700 focus:border-blue-400 dark:bg-white/[0.03] dark:text-slate-200'
                }`}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
            </div>
            <ButtonTooltip visible={compressionHint.visible} text={isFalProvider ? 'fal.ai 不支持压缩率参数' : '仅 JPEG 和 WebP 支持压缩率'} />
          </label>
        )}

        <div
          className={fieldClass}
          onMouseEnter={moderationHint.show}
          onMouseLeave={moderationHint.hide}
          onTouchStart={moderationHint.startTouch}
          onTouchEnd={moderationHint.clearTimer}
          onTouchCancel={moderationHint.hide}
          onClick={moderationHint.show}
        >
          <span className={labelClass}>内容审核</span>
          <div className={groupClass}>
            {[
              { label: '自动', value: 'auto' },
              { label: '低敏感度', value: 'low' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={moderationDisabled}
                onClick={() => setParams({ moderation: option.value as TaskParams['moderation'] })}
                className={optionClass((moderationDisabled ? 'auto' : params.moderation) === option.value, moderationDisabled)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <ButtonTooltip visible={moderationDisabled && moderationHint.visible} text="fal.ai 不支持审核参数" />
        </div>

        <label
          className={fieldClass}
          onMouseEnter={streamConcurrentHint.show}
          onMouseLeave={() => {
            hideNLimitHint()
            streamConcurrentHint.hide()
          }}
          onTouchStart={() => {
            streamConcurrentHint.startTouch()
          }}
          onTouchEnd={() => {
            streamConcurrentHint.clearTimer()
          }}
          onTouchCancel={() => {
            hideNLimitHint()
            streamConcurrentHint.hide()
          }}
          onClick={() => {
            streamConcurrentHint.show()
          }}
        >
          <div className="flex items-center justify-between">
            <span className={labelClass}>生成数量</span>
            <span className="text-[10px] text-slate-400">最多 {outputImageLimit} 张</span>
          </div>
          <input
            value={nInput}
            onChange={(e) => handleNInputChange(e.target.value)}
            onFocus={() => setNInputFocused(true)}
            onBlur={() => {
              setNInputFocused(false)
              commitN()
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') handleNLimitIncreaseAttempt(() => e.preventDefault())
            }}
            onWheel={(e) => {
              if (e.deltaY < 0) handleNLimitIncreaseAttempt(() => e.preventDefault())
            }}
            type="number"
            min={1}
            max={outputImageLimit}
            className="w-full rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-xs text-slate-700 shadow-sm outline-none transition-all focus:border-blue-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-200"
          />
          <ButtonTooltip visible={nLimitHint.visible} text={nLimitHintText} />
          <ButtonTooltip visible={streamConcurrentByN && streamConcurrentHint.visible && !nLimitHint.visible} text="数量大于 1 时会将多图生成拆分为并发单图" />
        </label>
      </div>
    )
  }

  return (
    <div className={`grid ${cols} gap-2 text-xs flex-1`}>
      <label
        className="relative flex flex-col gap-0.5"
        onMouseEnter={sizeHint.show}
        onMouseLeave={sizeHint.hide}
        onTouchStart={sizeHint.startTouch}
        onTouchEnd={sizeHint.clearTimer}
        onTouchCancel={sizeHint.hide}
        onClick={sizeHint.show}
      >
        <span className="text-gray-400 dark:text-gray-500 ml-1">尺寸</span>
        <button
          type="button"
          onClick={(e) => { dismissAllTooltips(); onOpenSizePicker(e.currentTarget.getBoundingClientRect()) }}
          className="px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] focus:outline-none text-xs text-left transition-all duration-200 shadow-sm font-mono"
          title="选择尺寸"
        >
          {displaySize}
        </button>
        <ButtonTooltip
          visible={isFalTextToImage && sizeHint.visible}
          text={<>fal.ai 的文生图模式不支持 <code className="rounded bg-white/10 px-1 py-0.5 font-mono">auto</code> 参数</>}
        />
      </label>
      <label
        className="relative flex flex-col gap-0.5"
        onMouseEnter={qualityHint.show}
        onMouseLeave={qualityHint.hide}
        onTouchStart={qualityHint.startTouch}
        onTouchEnd={qualityHint.clearTimer}
        onTouchCancel={qualityHint.hide}
        onClick={qualityHint.show}
      >
        <span className="text-gray-400 dark:text-gray-500 ml-1">质量</span>
        <Select
          value={activeProfile.codexCli ? 'auto' : isFalProvider && params.quality === 'auto' ? 'high' : params.quality}
          onChange={(val) => {
            if (!activeProfile.codexCli) setParams({ quality: val as TaskParams['quality'] })
          }}
          options={qualityOptions}
          disabled={activeProfile.codexCli}
          showValueTooltips={false}
          className={activeProfile.codexCli
            ? 'px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-white/[0.08] bg-gray-100/50 dark:bg-white/[0.05] opacity-50 cursor-not-allowed text-xs transition-all duration-200 shadow-sm'
            : selectClass}
        />
        <ButtonTooltip
          visible={(activeProfile.codexCli || isFalProvider) && qualityHint.visible}
          text={isFalProvider ? <>fal.ai 不支持 <code className="rounded bg-white/10 px-1 py-0.5 font-mono">auto</code> 质量参数</> : 'Codex CLI 不支持质量参数'}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-gray-400 dark:text-gray-500 ml-1">格式</span>
        <Select
          value={params.output_format}
          onChange={(val) => {
            setParams({
              output_format: val as TaskParams['output_format'],
              ...(val === 'png' ? { output_compression: null } : { transparent_output: false }),
            })
          }}
          options={[
            { label: 'PNG', value: 'png' },
            { label: 'JPEG', value: 'jpeg' },
            { label: 'WebP', value: 'webp' },
          ]}
          showValueTooltips={false}
          className={selectClass}
        />
      </label>
      {showTransparentOutputControl ? (
        <label
          className="relative flex flex-col gap-0.5"
          onMouseEnter={transparentOutputHint.show}
          onMouseLeave={transparentOutputHint.hide}
          onTouchStart={transparentOutputHint.startTouch}
          onTouchEnd={transparentOutputHint.clearTimer}
          onTouchCancel={transparentOutputHint.hide}
          onClick={transparentOutputHint.show}
        >
          <span className="text-gray-400 dark:text-gray-500 ml-1">透明背景</span>
          <Select
            value={transparentOutputEnabled ? 'on' : 'off'}
            onChange={(val) => {
              if (!transparentOutputAvailable) return
              setParams({ transparent_output: val === 'on', output_compression: null })
            }}
            options={[
              { label: 'false', value: 'off' },
              { label: 'true', value: 'on' },
            ]}
            showValueTooltips={false}
            className={selectClass}
            onOpenChange={onTransparentOutputMenuOpenChange}
          />
          <ButtonTooltip visible={transparentOutputHint.visible} text="基于提示词与后处理，并非模型原生生成" />
        </label>
      ) : (
        <label
          className="relative flex flex-col gap-0.5"
          onMouseEnter={compressionHint.show}
          onMouseLeave={compressionHint.hide}
          onTouchStart={compressionHint.startTouch}
          onTouchEnd={compressionHint.clearTimer}
          onTouchCancel={compressionHint.hide}
          onClick={compressionHint.show}
        >
          <span className="text-gray-400 dark:text-gray-500 ml-1">压缩率</span>
          <input
            value={outputCompressionInput}
            onChange={(e) => setOutputCompressionInput(e.target.value)}
            onBlur={commitOutputCompression}
            disabled={compressionDisabled}
            type="number"
            min={0}
            max={100}
            placeholder="0-100"
            className={`px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-white/[0.08] focus:outline-none text-xs transition-all duration-200 shadow-sm ${
              compressionDisabled
                ? 'bg-gray-100/50 dark:bg-white/[0.05] opacity-50 cursor-not-allowed'
                : 'bg-white/50 dark:bg-white/[0.03]'
            }`}
          />
          <ButtonTooltip visible={compressionHint.visible} text={isFalProvider ? 'fal.ai 不支持压缩率参数' : '仅 JPEG 和 WebP 支持压缩率'} />
        </label>
      )}
      <label
        className="relative flex flex-col gap-0.5"
        onMouseEnter={moderationHint.show}
        onMouseLeave={moderationHint.hide}
        onTouchStart={moderationHint.startTouch}
        onTouchEnd={moderationHint.clearTimer}
        onTouchCancel={moderationHint.hide}
        onClick={moderationHint.show}
      >
        <span className="text-gray-400 dark:text-gray-500 ml-1">审核</span>
        <Select
          value={moderationDisabled ? 'auto' : params.moderation}
          onChange={(val) => {
            if (!moderationDisabled) setParams({ moderation: val as TaskParams['moderation'] })
          }}
          options={[
            { label: 'auto', value: 'auto' },
            { label: 'low', value: 'low' },
          ]}
          disabled={moderationDisabled}
          showValueTooltips={false}
          className={moderationDisabled
            ? 'px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-white/[0.08] bg-gray-100/50 dark:bg-white/[0.05] opacity-50 cursor-not-allowed text-xs transition-all duration-200 shadow-sm'
            : selectClass}
        />
        <ButtonTooltip visible={moderationDisabled && moderationHint.visible} text="fal.ai 不支持审核参数" />
      </label>
      <label
        className="relative flex flex-col gap-0.5"
        onMouseEnter={streamConcurrentHint.show}
        onMouseLeave={() => { hideNLimitHint(); streamConcurrentHint.hide() }}
        onTouchStart={streamConcurrentHint.startTouch}
        onTouchEnd={streamConcurrentHint.clearTimer}
        onTouchCancel={() => {
          hideNLimitHint()
          streamConcurrentHint.hide()
        }}
        onClick={streamConcurrentHint.show}
      >
        <span className="text-gray-400 dark:text-gray-500 ml-1">数量</span>
        <input
          value={nInput}
          onChange={(e) => handleNInputChange(e.target.value)}
          onFocus={() => setNInputFocused(true)}
          onBlur={() => {
            setNInputFocused(false)
            commitN()
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') handleNLimitIncreaseAttempt(() => e.preventDefault())
          }}
          onWheel={(e) => {
            if (e.deltaY < 0) handleNLimitIncreaseAttempt(() => e.preventDefault())
          }}
          type="number"
          min={1}
          max={outputImageLimit}
          className="rounded-xl border border-gray-200/60 bg-white/50 px-3 py-1.5 text-xs shadow-sm outline-none transition-all duration-200 dark:border-white/[0.08] dark:bg-white/[0.03]"
        />
        <ButtonTooltip visible={nLimitHint.visible} text={nLimitHintText} />
        <ButtonTooltip visible={streamConcurrentByN && streamConcurrentHint.visible && !nLimitHint.visible} text="数量大于 1 时会将多图生成拆分为并发单图" />
      </label>
    </div>
  )
}
