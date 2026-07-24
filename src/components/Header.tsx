import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { useTooltip } from '../hooks/useTooltip'
import { dismissAllTooltips } from '../lib/tooltipDismiss'
import ViewportTooltip from './ViewportTooltip'
import HelpModal from './HelpModal'
import { useFavoriteCollectionTitle } from './FavoriteCollections'
import { HelpCircleIcon, InstallIcon, SettingsIcon } from './icons'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isInstalledPwa() {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

export default function Header() {
  const appMode = useStore((s) => s.appMode)
  const setAppMode = useStore((s) => s.setAppMode)
  const setShowSettings = useStore((s) => s.setShowSettings)
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)
  const activeFavoriteCollectionId = useStore((s) => s.activeFavoriteCollectionId)
  const filterFavorite = useStore((s) => s.filterFavorite)
  const favoriteCollectionTitle = useFavoriteCollectionTitle()
  const [showHelp, setShowHelp] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isPwaInstalled, setIsPwaInstalled] = useState(isInstalledPwa)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  const installTooltip = useTooltip()
  const helpTooltip = useTooltip()
  const settingsTooltip = useTooltip()

  useEffect(() => {
    if (appMode !== 'gallery') {
      setScrollDirection('up')
      return
    }

    let lastScrollY = window.scrollY
    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        if (currentScrollY < 20 || currentScrollY < lastScrollY - 10) setScrollDirection('up')
        if (currentScrollY > lastScrollY + 10) setScrollDirection('down')
        lastScrollY = currentScrollY
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [appMode])

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
      setIsPwaInstalled(false)
    }
    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setIsPwaInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (installPrompt) {
      const event = installPrompt
      setInstallPrompt(null)
      try {
        await event.prompt()
        const choice = await event.userChoice
        setIsPwaInstalled(choice.outcome === 'accepted')
      } catch {
        setIsPwaInstalled(isInstalledPwa())
      }
      return
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setConfirmDialog({
      title: '安装为应用',
      message: isIos
        ? '在 Safari 中点击“分享”，再选择“添加到主屏幕”即可安装。'
        : '请在浏览器菜单中选择“安装应用”或“添加到主屏幕”。',
      showCancel: false,
      confirmText: '我知道了',
      icon: 'info',
      action: () => {},
    })
  }

  const showFavoriteCollectionTitle = appMode === 'gallery' && Boolean(activeFavoriteCollectionId)

  return (
    <>
      <header data-no-drag-select className="safe-area-top fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/75">
        <div className="safe-area-x safe-header-inner relative mx-auto flex max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setAppMode('gallery')}
            className="inline-flex min-w-0 items-center gap-2 font-display text-[17px] font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg"
          >
            <img src="./logo.png" alt="星柴AI生图" className="h-7 w-7 shrink-0 rounded-xl" />
            <span className="truncate">{showFavoriteCollectionTitle ? favoriteCollectionTitle : '星柴AI生图'}</span>
          </button>

          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/80 p-1.5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:flex">
            <button
              type="button"
              onClick={() => setAppMode('gallery')}
              className={`rounded-full px-4 py-1.5 text-sm transition-all ${appMode === 'gallery' ? 'bg-white font-medium text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              画廊
            </button>
            <button
              type="button"
              onClick={() => setAppMode('editor')}
              className={`rounded-full px-4 py-1.5 text-sm transition-all ${appMode === 'editor' ? 'bg-white font-medium text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              图片编辑
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {!isPwaInstalled && (
              <div className="relative" {...installTooltip.handlers}>
                <button
                  type="button"
                  onClick={() => {
                    dismissAllTooltips()
                    void handleInstallClick()
                  }}
                  className="rounded-xl border border-slate-200/80 bg-white/70 p-2 text-slate-500 shadow-sm transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white"
                  aria-label="安装为应用"
                >
                  <InstallIcon className="h-5 w-5" />
                </button>
                <ViewportTooltip visible={installTooltip.visible} className="whitespace-nowrap">安装为应用</ViewportTooltip>
              </div>
            )}
            <div className="relative" {...helpTooltip.handlers}>
              <button
                type="button"
                onClick={() => {
                  dismissAllTooltips()
                  setShowHelp(true)
                }}
                className="rounded-xl border border-slate-200/80 bg-white/70 p-2 text-slate-500 shadow-sm transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white"
                aria-label="操作指南"
              >
                <HelpCircleIcon className="h-5 w-5" />
              </button>
              <ViewportTooltip visible={helpTooltip.visible} className="whitespace-nowrap">操作指南</ViewportTooltip>
            </div>
            <div className="relative" {...settingsTooltip.handlers}>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="rounded-xl border border-slate-200/80 bg-white/70 p-2 text-slate-500 shadow-sm transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white"
                aria-label="设置"
              >
                <SettingsIcon className="h-5 w-5" />
              </button>
              <ViewportTooltip visible={settingsTooltip.visible} className="whitespace-nowrap">设置</ViewportTooltip>
            </div>
          </div>
        </div>

        <div className={`safe-area-x grid grid-cols-2 gap-1 overflow-hidden px-3 transition-all duration-300 sm:hidden ${appMode === 'gallery' && scrollDirection === 'down' ? 'max-h-0 opacity-0' : 'max-h-20 pb-2 opacity-100'}`}>
          <button
            type="button"
            onClick={() => setAppMode('gallery')}
            className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${appMode === 'gallery' ? 'bg-slate-100 font-medium text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500'}`}
          >
            画廊
          </button>
          <button
            type="button"
            onClick={() => setAppMode('editor')}
            className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${appMode === 'editor' ? 'bg-slate-100 font-medium text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500'}`}
          >
            图片编辑
          </button>
        </div>
      </header>

      <div className="safe-area-top invisible pointer-events-none" aria-hidden="true">
        <div className="safe-header-inner" />
        <div className={`overflow-hidden transition-all duration-300 sm:hidden ${appMode === 'gallery' && scrollDirection === 'down' ? 'h-0' : 'h-[2.8rem]'}`} />
      </div>

      {showHelp && (
        <HelpModal
          appMode={appMode}
          isFavoriteCollectionOverview={appMode === 'gallery' && filterFavorite && !activeFavoriteCollectionId}
          onClose={() => setShowHelp(false)}
        />
      )}
    </>
  )
}
