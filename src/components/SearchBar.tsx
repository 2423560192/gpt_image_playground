import { useEffect, useRef, type ReactNode } from 'react'
import { ALL_FAVORITES_COLLECTION_ID, clearFailedTasks, getTaskFavoriteCollectionIds, useStore, taskMatchesFilterStatus, taskMatchesSearchQuery } from '../store'
import { useTooltip } from '../hooks/useTooltip'
import Select from './Select'
import { ChevronLeftIcon, CollectionManageIcon, FavoriteIcon, TrashIcon } from './icons'
import ViewportTooltip from './ViewportTooltip'

function SearchActionButton({
  tooltip,
  className,
  disabled = false,
  onClick,
  children,
}: {
  tooltip: string
  className: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  const tooltipState = useTooltip()

  return (
    <span className="relative inline-flex" {...tooltipState.handlers}>
      <button
        type="button"
        onClick={() => {
          tooltipState.dismiss()
          if (disabled) return
          onClick()
        }}
        disabled={disabled}
        className={className}
        aria-label={tooltip}
      >
        {children}
      </button>
      <ViewportTooltip visible={tooltipState.visible} className="whitespace-nowrap">
        {tooltip}
      </ViewportTooltip>
    </span>
  )
}

export default function SearchBar() {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const filterStatus = useStore((s) => s.filterStatus)
  const setFilterStatus = useStore((s) => s.setFilterStatus)
  const clearSelection = useStore((s) => s.clearSelection)
  const filterFavorite = useStore((s) => s.filterFavorite)
  const setFilterFavorite = useStore((s) => s.setFilterFavorite)
  const activeFavoriteCollectionId = useStore((s) => s.activeFavoriteCollectionId)
  const setActiveFavoriteCollectionId = useStore((s) => s.setActiveFavoriteCollectionId)
  const openManageCollectionsModal = useStore((s) => s.openManageCollectionsModal)
  const failedCount = useStore((s) => {
    const q = s.searchQuery.trim().toLowerCase()
    return s.tasks.filter((task) => {
      if (!taskMatchesFilterStatus(task, 'error')) return false
      if (s.filterFavorite) {
        if (!task.isFavorite) return false
        if (s.activeFavoriteCollectionId && s.activeFavoriteCollectionId !== ALL_FAVORITES_COLLECTION_ID && !getTaskFavoriteCollectionIds(task).includes(s.activeFavoriteCollectionId)) return false
      }
      return taskMatchesSearchQuery(task, q)
    }).length
  })
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)
  const inCollectionOverview = filterFavorite && !activeFavoriteCollectionId
  const isFailedFilter = filterStatus === 'error'
  const favoriteTooltip = activeFavoriteCollectionId ? '返回收藏夹' : filterFavorite ? '退出收藏夹' : '收藏夹'

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (document.activeElement !== inputRef.current) return

      const target = event.target instanceof Element ? event.target : document.elementFromPoint(event.clientX, event.clientY)
      if (!target) return
      if (rootRef.current?.contains(target)) return
      if (!target.closest('[data-drag-select-surface]')) return
      if (target.closest('.task-card-wrapper, .favorite-collection-card-wrapper')) return

      inputRef.current?.blur()
    }

    document.addEventListener('mousedown', handleDocumentMouseDown, true)
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown, true)
  }, [])

  const handleFavoriteClick = () => {
    if (activeFavoriteCollectionId) {
      setActiveFavoriteCollectionId(null)
      return
    }
    setFilterFavorite(!filterFavorite)
  }

  const handleClearFailed = () => {
    const state = useStore.getState()
    const q = state.searchQuery.trim().toLowerCase()
    const failedTaskIds = state.tasks
      .filter((task) => {
        if (!taskMatchesFilterStatus(task, 'error')) return false
        if (state.filterFavorite) {
          if (!task.isFavorite) return false
          if (state.activeFavoriteCollectionId && state.activeFavoriteCollectionId !== ALL_FAVORITES_COLLECTION_ID && !getTaskFavoriteCollectionIds(task).includes(state.activeFavoriteCollectionId)) return false
        }
        return taskMatchesSearchQuery(task, q)
      })
      .map((task) => task.id)
    const failedTaskCount = failedTaskIds.length
    if (failedTaskCount === 0) return

    setConfirmDialog({
      title: '清除失败记录',
      message: `确定清除筛选范围内的失败记录吗？\n纯失败任务会被删除；部分失败任务只会清除失败标记，保留已成功图片。共 ${failedTaskCount} 条记录。`,
      confirmText: '清除',
      cancelText: '取消',
      tone: 'danger',
      action: () => clearFailedTasks(failedTaskIds),
    })
  }

  const handleStatusChange = (val: any) => {
    if (val === filterStatus) return
    setFilterStatus(val)
    clearSelection()
  }

  return (
    <div ref={rootRef} data-no-drag-select className="mx-auto mb-4 mt-5 flex max-w-4xl gap-3 rounded-[24px] border border-white/80 bg-white/74 p-2.5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.55)] backdrop-blur-2xl ring-1 ring-slate-900/[0.03] dark:border-white/[0.08] dark:bg-slate-950/42 dark:ring-white/[0.06]">
      <div className="flex gap-2 flex-shrink-0 z-20">
        <SearchActionButton
          tooltip={favoriteTooltip}
          onClick={handleFavoriteClick}
          className={`p-2.5 rounded-xl border transition-all shadow-sm ${
            filterFavorite
              ? 'border-blue-500/20 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300'
              : 'border-slate-200/80 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
          }`}
        >
          {activeFavoriteCollectionId ? <ChevronLeftIcon className="w-5 h-5" /> : <FavoriteIcon filled={filterFavorite} className="w-5 h-5" />}
        </SearchActionButton>
        {inCollectionOverview && (
          <SearchActionButton
            tooltip="管理收藏夹"
            onClick={openManageCollectionsModal}
            className="p-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
          >
            <CollectionManageIcon className="w-5 h-5" />
          </SearchActionButton>
        )}
        {!inCollectionOverview && (
          <>
            <div className="relative w-[88px]">
              <Select
                value={filterStatus}
                onChange={handleStatusChange}
                options={[
                  { label: '全部', value: 'all' },
                  { label: '已完成', value: 'done' },
                  { label: '生成中', value: 'running' },
                  { label: '失败', value: 'error' },
                ]}
                className="px-3 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition dark:border-white/[0.08] dark:bg-slate-900/80 dark:hover:bg-white/[0.06]"
              />
            </div>
            {isFailedFilter && (
              <button
                type="button"
                onClick={handleClearFailed}
                disabled={failedCount === 0}
                title={failedCount > 0 ? `清除 ${failedCount} 条失败记录` : '没有失败记录'}
                aria-label={failedCount > 0 ? `清除 ${failedCount} 条失败记录` : '没有失败记录'}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-white disabled:hover:text-slate-400 dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-slate-300 dark:disabled:hover:bg-slate-900 dark:disabled:hover:text-slate-500"
              >
                <TrashIcon className="h-[18px] w-[18px]" />
              </button>
            )}
          </>
        )}
      </div>
      <div className="relative z-10 flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          type="text"
          placeholder={inCollectionOverview ? '搜索收藏夹名称...' : '搜索提示词、参数...'}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm shadow-[0_1px_2px_rgb(15,23,42,0.04)] focus:outline-none focus:ring-[3px] focus:ring-blue-500/15 focus:border-blue-400 transition-all duration-200 dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-100"
        />
      </div>
    </div>
  )
}
