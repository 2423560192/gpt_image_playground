import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { FilerobotImageEditorConfig } from 'react-filerobot-image-editor'
import { ensureImageCached, ensureImageThumbnailCached, useStore } from '../store'
import { fileToDataUrl } from '../lib/dataUrl'
import { IMAGE_EDITOR_TRANSLATIONS } from '../lib/imageEditorTranslations'
import { EditIcon, ImportIcon } from './icons'

const FilerobotImageEditor = lazy(() => import('react-filerobot-image-editor'))

const EDITOR_TABS: NonNullable<FilerobotImageEditorConfig['tabsIds']> = [
  'Adjust',
  'Finetune',
  'Filters',
  'Annotate',
  'Watermark',
  'Resize',
]

function OutputThumbnail({ imageId, loading, onClick }: { imageId: string; loading: boolean; onClick: () => void }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let cancelled = false
    void ensureImageThumbnailCached(imageId).then((thumbnail) => {
      if (!cancelled) setSrc(thumbnail?.dataUrl ?? '')
    })
    return () => {
      cancelled = true
    }
  }, [imageId])

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="group relative aspect-square overflow-hidden rounded-xl border-2 border-transparent bg-slate-100 transition-all hover:border-blue-500 hover:shadow-md disabled:cursor-wait disabled:opacity-60 dark:bg-slate-800"
      aria-label="在画布中打开作品"
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" draggable={false} />
      ) : (
        <span className="block h-full w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
      )}
      {loading && <span className="absolute inset-0 grid place-items-center bg-black/35 text-xs font-medium text-white">加载中</span>}
    </button>
  )
}

export default function ImageEditorWorkspace() {
  const tasks = useStore((s) => s.tasks)
  const showToast = useStore((s) => s.showToast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [src, setSrc] = useState('')
  const [sourceName, setSourceName] = useState('图片')
  const [sourceKey, setSourceKey] = useState(0)
  const [loadingImageId, setLoadingImageId] = useState<string | null>(null)

  const recentImageIds = useMemo(() => {
    const ids: string[] = []
    for (const task of [...tasks].sort((a, b) => b.createdAt - a.createdAt)) {
      for (const id of task.outputImages) {
        if (!ids.includes(id)) ids.push(id)
        if (ids.length >= 24) return ids
      }
    }
    return ids
  }, [tasks])

  const selectSource = async (imageId: string) => {
    setLoadingImageId(imageId)
    try {
      const dataUrl = await ensureImageCached(imageId)
      if (!dataUrl) {
        showToast('无法读取这张图片', 'error')
        return
      }
      setSrc(dataUrl)
      setSourceName('星柴作品')
      setSourceKey((key) => key + 1)
    } finally {
      setLoadingImageId(null)
    }
  }

  const handleFile = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error')
      return
    }

    try {
      setSrc(await fileToDataUrl(file))
      setSourceName(file.name.replace(/\.[^.]+$/, '') || '图片')
      setSourceKey((key) => key + 1)
    } catch {
      showToast('图片读取失败', 'error')
    }
  }

  const handleSave: NonNullable<FilerobotImageEditorConfig['onSave']> = (imageData) => {
    const dataUrl = imageData.imageBase64 ?? imageData.imageCanvas?.toDataURL(imageData.mimeType, imageData.quality)
    if (!dataUrl) {
      showToast('图片导出失败', 'error')
      return
    }

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = imageData.fullName ?? `${sourceName}-编辑.${imageData.extension || 'png'}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    showToast('编辑后的图片已下载', 'success')
  }

  return (
    <main className={`safe-area-x mx-auto w-full px-3 sm:px-4 ${src ? 'flex h-[calc(100dvh-6.3rem)] max-w-none flex-col overflow-hidden pb-3 pt-3 sm:h-[calc(100dvh-3.5rem)]' : 'flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col items-center justify-center pb-6 pt-5 lg:px-6'}`}>
      <div className={`flex shrink-0 flex-wrap items-center justify-between gap-3 ${src ? 'mb-3' : 'mb-4'}`}>
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            画布编辑
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            自由绘制、文字、形状、裁剪、滤镜和尺寸调整均在浏览器本地完成
          </p>
        </div>
        <div className="hidden text-xs text-slate-400 sm:block">
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          void handleFile(file)
        }}
      />

      {src ? (
        <div className="image-editor-canvas-shell min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xl dark:border-white/10 dark:bg-slate-900">
          <Suspense
            fallback={(
              <div className="grid h-full place-items-center text-sm text-slate-500">
                <span className="animate-pulse">正在加载画布编辑器…</span>
              </div>
            )}
          >
            <FilerobotImageEditor
              key={sourceKey}
              source={src}
              tabsIds={EDITOR_TABS}
              defaultTabId="Annotate"
              defaultToolId="Pen"
              annotationsCommon={{ fill: '#2563eb', stroke: '#2563eb', strokeWidth: 2 }}
              Pen={{ stroke: '#2563eb', strokeWidth: 5, lineCap: 'round', tension: 0.3, selectAnnotationAfterDrawing: false }}
              Text={{
                text: '输入文字',
                fontFamily: 'Arial',
                fonts: ['Arial', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', 'sans-serif'],
              }}
              Crop={{ ratio: 'original' }}
              defaultSavedImageName={`${sourceName}-编辑`}
              defaultSavedImageType="png"
              savingPixelRatio={1}
              previewPixelRatio={window.devicePixelRatio || 1}
              useBackendTranslations={false}
              language="zh"
              translations={IMAGE_EDITOR_TRANSLATIONS}
              observePluginContainerSize
              resetOnImageSourceChange
              backgroundColor="#e2e8f0"
              onSave={handleSave}
              onClose={() => setSrc('')}
            />
          </Suspense>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_19rem]">
          <section className="flex min-h-[30rem] items-center justify-center rounded-3xl border border-slate-200/80 bg-slate-100/70 p-6 shadow-inner dark:border-white/10 dark:bg-black/20">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex max-w-md flex-col items-center rounded-3xl border-2 border-dashed border-slate-300 px-12 py-16 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-blue-500/5"
            >
              <ImportIcon className="mb-4 h-11 w-11 text-slate-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">打开一张图片进入画布</span>
              <span className="mt-2 text-sm leading-6 text-slate-500">支持画笔、文字、矩形、圆形、箭头、贴图、滤镜、裁剪与撤销重做</span>
            </button>
          </section>

          <aside className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h3 className="mb-1 text-sm font-bold text-slate-800 dark:text-slate-100">最近作品</h3>
            <p className="mb-4 text-xs text-slate-400">选择一张生成结果继续绘制</p>
            {recentImageIds.length ? (
              <div className="grid max-h-[26rem] grid-cols-3 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                {recentImageIds.map((imageId) => (
                  <OutputThumbnail
                    key={imageId}
                    imageId={imageId}
                    loading={loadingImageId === imageId}
                    onClick={() => void selectSource(imageId)}
                  />
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-xs text-slate-400">生成图片后会显示在这里</p>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}
