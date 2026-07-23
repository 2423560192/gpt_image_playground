import { useEffect, useMemo, useState } from 'react'
import { initStore } from './store'
import { useStore } from './store'
import { activateFirstImportedProfile, buildSettingsFromUrlParams, clearUrlSettingParams, hasUrlSettingParams } from './lib/urlSettings'
import { isDefaultConfigOnlyEnabled, mergeImportedSettings } from './lib/apiProfiles'
import { getCustomProviderConfigUrl, loadCustomProviderSettingsFromUrl } from './lib/customProviderConfigUrl'
import { useDockerApiUrlMigrationNotice } from './hooks/useDockerApiUrlMigrationNotice'
import type { AppSettings } from './types'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import TaskGrid from './components/TaskGrid'
import AgentWorkspace from './components/AgentWorkspace'
import InputBar from './components/InputBar'
import DetailModal from './components/DetailModal'
import Lightbox from './components/Lightbox'
import SettingsModal from './components/SettingsModal'
import ConfirmDialog from './components/ConfirmDialog'
import Toast from './components/Toast'
import MaskEditorModal from './components/MaskEditorModal'
import ImageContextMenu from './components/ImageContextMenu'
import SupportPromptModal from './components/SupportPromptModal'
import { FavoriteCollectionPickerModal, FavoriteCollectionsView, ManageCollectionsModal } from './components/FavoriteCollections'
import { useGlobalClickSuppression } from './lib/clickSuppression'

let customProviderConfigUrlImportStarted = false

export default function App() {
  const setSettings = useStore((s) => s.setSettings)
  const appMode = useStore((s) => s.appMode)
  const filterFavorite = useStore((s) => s.filterFavorite)
  const activeFavoriteCollectionId = useStore((s) => s.activeFavoriteCollectionId)
  const tasks = useStore((s) => s.tasks)
  const setDetailTaskId = useStore((s) => s.setDetailTaskId)
  const recentTasks = useMemo(() => [...tasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5), [tasks])
  const [isDesktopLayout, setIsDesktopLayout] = useState(() => window.innerWidth >= 1024)
  useDockerApiUrlMigrationNotice()
  useGlobalClickSuppression()

  useEffect(() => {
    const handleResize = () => setIsDesktopLayout(window.innerWidth >= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const customProviderConfigUrl = getCustomProviderConfigUrl()
    const defaultConfigOnly = isDefaultConfigOnlyEnabled()

    const applyUrlSettings = (baseSettings: Partial<AppSettings>) => {
      const nextSettings = buildSettingsFromUrlParams(baseSettings, searchParams)
      return Object.keys(nextSettings).length ? nextSettings : baseSettings
    }

    const clearAppliedUrlSettings = () => {
      if (!hasUrlSettingParams(searchParams)) return

      clearUrlSettingParams(searchParams)

      const nextSearch = searchParams.toString()
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
      window.history.replaceState(null, '', nextUrl)
    }

    if (customProviderConfigUrl && defaultConfigOnly && !customProviderConfigUrlImportStarted) {
      customProviderConfigUrlImportStarted = true
      void loadCustomProviderSettingsFromUrl(customProviderConfigUrl)
        .then((importedSettings) => {
          const state = useStore.getState()
          const baseSettings = importedSettings
            ? activateFirstImportedProfile(mergeImportedSettings(state.settings, importedSettings), importedSettings)
            : state.settings
          state.setSettings(applyUrlSettings(baseSettings))
          clearAppliedUrlSettings()
        })
        .catch((error) => {
          console.warn('Failed to import custom provider config URL:', error)
          const state = useStore.getState()
          state.setSettings(applyUrlSettings(state.settings))
          clearAppliedUrlSettings()
        })

      initStore()
      return
    }

    const nextSettings = buildSettingsFromUrlParams(useStore.getState().settings, searchParams)

    setSettings(nextSettings)

    clearAppliedUrlSettings()

    if (customProviderConfigUrl && !customProviderConfigUrlImportStarted) {
      customProviderConfigUrlImportStarted = true
      void loadCustomProviderSettingsFromUrl(customProviderConfigUrl)
        .then((importedSettings) => {
          if (!importedSettings) return
          const state = useStore.getState()
          state.setSettings(mergeImportedSettings(state.settings, importedSettings))
        })
        .catch((error) => {
          console.warn('Failed to import custom provider config URL:', error)
        })
    }

    initStore()
  }, [setSettings])

  useEffect(() => {
    const preventPageImageDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement | null)?.closest('img')) {
        e.preventDefault()
      }
    }

    document.addEventListener('dragstart', preventPageImageDrag)
    return () => document.removeEventListener('dragstart', preventPageImageDrag)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-900 dark:text-slate-100">
      <Header />
      {appMode === 'agent' ? (
        <AgentWorkspace />
      ) : (
        <main data-home-main data-drag-select-surface className="pb-48 pt-3 sm:pt-5 lg:pb-12">
          <div className="safe-area-x mx-auto w-full px-4 sm:px-6 lg:px-8 2xl:px-12">
            {isDesktopLayout ? (
              <div className="mx-auto max-w-[112rem]">
                <div data-no-drag-select className="mb-5 text-center">
                  <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 text-white shadow-[0_16px_32px_-16px_rgba(37,99,235,0.95)] ring-4 ring-blue-500/10 dark:ring-blue-400/10">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2.8l2.1 5.7 5.7 2.1-5.7 2.1-2.1 5.7-2.1-5.7-5.7-2.1 5.7-2.1L12 2.8zm5.8 12.4l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">星柴AI生图</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">高级轻量的 AI 图片创作工坊</p>
                </div>
                <div className="grid min-h-[calc(100vh-12rem)] grid-cols-[21rem_minmax(38rem,1fr)_19rem] items-start gap-6 xl:grid-cols-[22rem_minmax(44rem,1fr)_20rem] xl:gap-8 2xl:grid-cols-[23rem_minmax(48rem,1fr)_21rem]">
                  <aside data-no-drag-select className="sticky top-[5.5rem]">
                    <InputBar desktopInline />
                  </aside>
                  <section className="min-w-0">
                    {filterFavorite && !activeFavoriteCollectionId ? <FavoriteCollectionsView /> : <TaskGrid />}
                  </section>
                  <aside data-no-drag-select className="sticky top-[5.5rem]">
                    <div className="min-h-[calc(100vh-12rem)] rounded-[24px] border border-white/80 bg-white/86 p-4 shadow-[0_22px_60px_-44px_rgba(15,23,42,0.52)] backdrop-blur-2xl ring-1 ring-slate-900/[0.03] dark:border-white/[0.08] dark:bg-slate-950/58 dark:ring-white/[0.06]">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/10">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">历史记录</span>
                      </div>
                      {recentTasks.length ? (
                        <div className="space-y-2">
                          {recentTasks.map((task) => (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => setDetailTaskId(task.id)}
                              className="w-full rounded-xl border border-slate-200/70 bg-white/70 px-2.5 py-2 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/70 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-blue-400/20 dark:hover:bg-blue-500/10"
                            >
                              <div className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">{task.prompt || '无提示词'}</div>
                              <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{task.status === 'done' ? '已完成' : task.status === 'running' ? '生成中' : '失败'}</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-h-[26rem] flex-col items-center justify-center text-center text-[11px] text-slate-400 dark:text-slate-500">
                          <span>还没有作品</span>
                          <span className="mt-1">开始创作后会显示在这里</span>
                        </div>
                      )}
                    </div>
                  </aside>
              </div>
              </div>
            ) : (
              <>
                <div data-no-drag-select className="mb-5 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 text-white shadow-[0_16px_32px_-16px_rgba(37,99,235,0.95)] ring-4 ring-blue-500/10 dark:ring-blue-400/10">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2.8l2.1 5.7 5.7 2.1-5.7 2.1-2.1 5.7-2.1-5.7-5.7-2.1 5.7-2.1L12 2.8zm5.8 12.4l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400 sm:text-3xl">星柴AI生图</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">高级轻量的 AI 图片创作工坊</p>
                </div>
                <SearchBar />
                {filterFavorite && !activeFavoriteCollectionId ? <FavoriteCollectionsView /> : <TaskGrid />}
              </>
            )}
          </div>
        </main>
      )}
      {(appMode === 'agent' || !isDesktopLayout) && <InputBar />}
      <DetailModal />
      <Lightbox />
      <SettingsModal />
      <ConfirmDialog />
      <SupportPromptModal />
      <FavoriteCollectionPickerModal />
      <ManageCollectionsModal />
      <Toast />
      <MaskEditorModal />
      <ImageContextMenu />
    </div>
  )
}
