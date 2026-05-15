import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { ApiError } from '../lib/apiClient'
import { normalizeAssetUrl } from '../lib/mediaUrl'
import { consentApi } from '../services/consentApi'
import { fetchProtectedFileObjectUrl, revokeObjectUrl } from '../lib/protectedFile'
import { ensureMomPersonaId } from '../services/personaSession'
import { photoMemoryApi } from '../services/photoMemoryApi'
import { shareApi } from '../services/shareApi'
import { createShareLinkWithConsentRetry } from '../services/storybookShare'
import { storybookApi } from '../services/storybookApi'
import type { ApiId, PhotoMemory, ShareLink, StoryBook, StoryChapter } from '../types/api'
import './StorybookPage.css'

type IconName =
  | 'share'
  | 'more'
  | 'heart'
  | 'book'
  | 'sparkle'
  | 'chevron'
  | 'reorder'
  | 'leaf'
  | 'meal'
  | 'mic'
  | 'home'
  | 'chat'
  | 'my'

type Photo = {
  id: string
  src?: string
  alt: string
  title: string
  memoryId?: string
}

type Chapter = {
  id: string
  label: string
  title: string
  duration: string
  icon: 'leaf' | 'meal' | 'mic'
  summary?: string | null
  content?: string | null
  order_index?: number | null
}

type StorybookChapterItem = Chapter & {
  storybookId: ApiId
  storybookTitle: string
}

type PhotoUploadForm = {
  title: string
  description: string
  taken_at: string
  location: string
}

const STORYBOOK_NOTICE_KEY = 'remory_storybook_notice'

const photos: Photo[] = [
  {
    id: 'young-mom',
    src: '/images/storybook/memory-young-mom.png',
    alt: '산책길에서 찍은 엄마의 젊은 날 사진',
    title: '산책길 사진',
  },
  {
    id: 'mom-child',
    src: '/images/storybook/memory-mom-child.png',
    alt: '엄마와 아이가 함께 웃고 있는 추억 사진',
    title: '함께 웃던 날',
  },
  {
    id: 'family-table',
    src: '/images/storybook/memory-family-table.png',
    alt: '가족이 식탁에 모여 있는 추억 사진',
    title: '가족의 식탁',
  },
]

const chapters: Chapter[] = [
  { id: 'walk', label: '첫 번째 기억', title: '산책길', duration: '0:45', icon: 'leaf' },
  { id: 'family-table', label: '두 번째 기억', title: '가족의 식탁', duration: '1:12', icon: 'meal' },
  { id: 'voice', label: '세 번째 기억', title: '다정한 목소리', duration: '0:36', icon: 'mic' },
]

function formatDate(createdAt?: string) {
  if (!createdAt) {
    return '2024.05.20'
  }

  const date = new Date(createdAt)

  if (Number.isNaN(date.getTime())) {
    return '2024.05.20'
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\s/g, '')
}

function getChapterIcon(index: number): Chapter['icon'] {
  const icons: Chapter['icon'][] = ['leaf', 'meal', 'mic']
  return icons[index % icons.length]
}

function mapStoryChapters(apiChapters: StoryChapter[]): Chapter[] {
  return [...apiChapters].sort((left, right) => {
    const leftOrder = left.order_index ?? left.order ?? 0
    const rightOrder = right.order_index ?? right.order ?? 0

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return String(left.id).localeCompare(String(right.id))
  }).map((chapter, index) => ({
    id: String(chapter.id),
    label: chapter.label ?? `${chapter.order_index ?? index + 1}번째 기억`,
    title: chapter.title,
    duration: chapter.duration ? String(chapter.duration) : '0:00',
    icon: getChapterIcon(index),
    summary: chapter.summary ?? null,
    content: chapter.content ?? null,
    order_index: chapter.order_index ?? chapter.order ?? null,
  }))
}

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    if (error.status === 422 && hasTakenAtValidationError(error.detail)) {
      return '촬영일 형식이 올바르지 않습니다. 다시 선택해주세요.'
    }

    return error.message
  }

  return fallbackMessage
}

function splitChapterPreview(content?: string | null) {
  return content
    ?.split(/\n{2,}|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 3) ?? []
}

function getShareUrl(shareLink: ShareLink) {
  const fallbackToken = shareLink.token
  const rawShareUrl = shareLink.share_url?.trim()
  let token = fallbackToken

  if (rawShareUrl) {
    try {
      const url = new URL(rawShareUrl, window.location.origin)
      const shareToken = url.pathname.startsWith('/share/')
        ? decodeURIComponent(url.pathname.slice('/share/'.length).split('/')[0] ?? '')
        : ''

      token = shareToken || fallbackToken
    } catch {
      token = fallbackToken
    }
  }

  return `${window.location.origin}/share/${encodeURIComponent(token)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasTakenAtValidationError(detail: unknown) {
  const details = Array.isArray(detail) ? detail : [detail]

  return details.some((item) => {
    if (!isRecord(item)) {
      return false
    }

    const loc = item.loc
    const type = typeof item.type === 'string' ? item.type : ''
    const message = `${typeof item.msg === 'string' ? item.msg : ''} ${typeof item.message === 'string' ? item.message : ''}`

    return Array.isArray(loc) && loc.includes('taken_at') && (
      type.includes('datetime') || message.toLowerCase().includes('datetime')
    )
  })
}

function getPhotoMemoryTitle(memory: PhotoMemory, index = 0) {
  return memory.title ?? memory.caption ?? memory.description ?? `추억 사진 ${index + 1}`
}

function getPhotoMemoryImageApiPath(memory: PhotoMemory) {
  return memory.image_api_url?.trim() || `/api/v1/photo-memories/${memory.id}/image`
}

function mapPhotoMemories(apiPhotoMemories: PhotoMemory[]): Photo[] {
  return apiPhotoMemories.map((memory, index) => ({
    id: String(memory.id),
    memoryId: String(memory.id),
    title: getPhotoMemoryTitle(memory, index),
    alt: getPhotoMemoryTitle(memory, index),
  }))
}

function sortStorybooks(items: StoryBook[]) {
  return [...items].sort((left, right) => {
    const rightTime = Date.parse(right.created_at ?? '')
    const leftTime = Date.parse(left.created_at ?? '')

    if (!Number.isNaN(rightTime) && !Number.isNaN(leftTime) && rightTime !== leftTime) {
      return rightTime - leftTime
    }

    const rightId = Number(right.id)
    const leftId = Number(left.id)

    if (!Number.isNaN(rightId) && !Number.isNaN(leftId) && rightId !== leftId) {
      return rightId - leftId
    }

    return String(right.id).localeCompare(String(left.id))
  })
}

function isSameApiId(left: ApiId | null | undefined, right: ApiId | null | undefined) {
  return left != null && right != null && String(left) === String(right)
}

function StorybookIcon({ name }: { name: IconName }) {
  switch (name) {
    case 'share':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7h14v-7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'more':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h.01M12 12h.01M19 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 20.2C6.8 16.2 4 13.3 4 9.7A4.1 4.1 0 0 1 8.1 5.5c1.7 0 3.1.8 3.9 2.1.8-1.3 2.2-2.1 3.9-2.1A4.1 4.1 0 0 1 20 9.7c0 3.6-2.8 6.5-8 10.5Z" />
        </svg>
      )
    case 'book':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 4.5h5.2c1 0 1.8.8 1.8 1.8V21c0-1.2-1-2.2-2.2-2.2H5V4.5ZM19 4.5h-5.2c-1 0-1.8.8-1.8 1.8V21c0-1.2 1-2.2 2.2-2.2H19V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="m12 3 1.4 5.1L18.5 10l-5.1 1.9L12 17l-1.4-5.1L5.5 10l5.1-1.9L12 3ZM5 15l.7 2.2L8 18l-2.3.8L5 21l-.7-2.2L2 18l2.3-.8L5 15ZM18 15l.7 2.2L21 18l-2.3.8L18 21l-.7-2.2L15 18l2.3-.8L18 15Z" />
        </svg>
      )
    case 'chevron':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'reorder':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 4v14m0 0-3-3m3 3 3-3M16 20V6m0 0-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M19 4C11.2 4.4 6.1 8.8 5.5 17.8 11 17.5 16.8 13.3 19 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M5.5 17.8c2.6-3 5.4-5 9.1-6.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'meal':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 4v7M4.8 4v7M9.2 4v7M4.8 11h4.4M7 11v9M16.5 4v16M16.5 4c2.4 1.5 3.3 3.6 3.1 6.8h-3.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'mic':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="3.5" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10.7 12 4l8 6.7V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 18.5 3.7 22l4-1.1a9.8 9.8 0 0 0 4.3.9c5 0 9-3.6 9-8.1s-4-8.1-9-8.1-9 3.6-9 8.1c0 1.8.7 3.5 2 4.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8 13h.01M12 13h.01M16 13h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'my':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 20c.8-4.1 3.3-6.3 7-6.3s6.2 2.2 7 6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
  }
}

function StorybookPage() {
  const [currentStorybook, setCurrentStorybook] = useState<StoryBook | null>(null)
  const [storybookItems, setStorybookItems] = useState<StoryBook[]>([])
  const [allChapterItems, setAllChapterItems] = useState<StorybookChapterItem[]>([])
  const [chapterItems, setChapterItems] = useState<Chapter[]>(chapters)
  const [selectedChapterId, setSelectedChapterId] = useState('')
  const [photoItems, setPhotoItems] = useState<Photo[]>(photos)
  const [photoMemories, setPhotoMemories] = useState<PhotoMemory[]>([])
  const [photoImageUrls, setPhotoImageUrls] = useState<Record<string, string>>({})
  const [selectedPhotoMemoryId, setSelectedPhotoMemoryId] = useState('')
  const [isPhotoFormOpen, setIsPhotoFormOpen] = useState(false)
  const [photoUploadForm, setPhotoUploadForm] = useState<PhotoUploadForm>({
    title: '',
    description: '',
    taken_at: '',
    location: '',
  })
  const [photoUploadFile, setPhotoUploadFile] = useState<File | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isCreatingStorybook, setIsCreatingStorybook] = useState(false)
  const [isRegeneratingStorybook, setIsRegeneratingStorybook] = useState(false)
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false)
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [isLoadingShareLinks, setIsLoadingShareLinks] = useState(false)
  const [isCreatingShareLink, setIsCreatingShareLink] = useState(false)
  const [isDisablingShareLink, setIsDisablingShareLink] = useState(false)
  const [isShareConsentPromptOpen, setIsShareConsentPromptOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState(() => {
    const notice = window.sessionStorage.getItem(STORYBOOK_NOTICE_KEY) ?? window.localStorage.getItem(STORYBOOK_NOTICE_KEY) ?? ''
    window.localStorage.removeItem(STORYBOOK_NOTICE_KEY)

    return notice
  })
  const [errorMessage, setErrorMessage] = useState('')

  const selectStorybook = useCallback(async (storybookId: ApiId) => {
    const detail = await storybookApi.getStorybook(storybookId)
    const detailChapters = detail.chapters?.length ? detail.chapters : await storybookApi.listChapters(detail.id)
    const mappedChapters = detailChapters.length > 0 ? mapStoryChapters(detailChapters) : []

    setCurrentStorybook(detail)
    setChapterItems(mappedChapters)
    setSelectedChapterId(mappedChapters[0]?.id ?? '')
    setShareLinks([])
    setIsSharePanelOpen(false)
    setIsShareConsentPromptOpen(false)

    return detail
  }, [])

  const loadAllStorybookChapters = useCallback(async (storybooks: StoryBook[]) => {
    const chapterGroups = await Promise.all(
      storybooks.map(async (storybook) => {
        try {
          const storyChapters = await storybookApi.listChapters(storybook.id)

          return mapStoryChapters(storyChapters).map((chapter) => ({
            ...chapter,
            storybookId: storybook.id,
            storybookTitle: storybook.title,
          }))
        } catch {
          return []
        }
      }),
    )

    const nextAllChapters = chapterGroups.flat()
    setAllChapterItems(nextAllChapters)

    return nextAllChapters
  }, [])

  const loadStorybooks = useCallback(async (preferredStorybookId?: ApiId) => {
    const storybooks = sortStorybooks(await storybookApi.listStorybooks())

    setStorybookItems(storybooks)
    await loadAllStorybookChapters(storybooks)

    const selectedStorybook = preferredStorybookId
      ? storybooks.find((storybook) => isSameApiId(storybook.id, preferredStorybookId))
      : storybooks[0]

    if (!selectedStorybook) {
      setCurrentStorybook(null)
      setAllChapterItems([])
      setChapterItems(chapters)
      return null
    }

    return selectStorybook(selectedStorybook.id)
  }, [loadAllStorybookChapters, selectStorybook])

  const loadPhotoMemories = useCallback(async () => {
    const nextPhotoMemories = await photoMemoryApi.listPhotoMemories()
    const nextPhotoItems = mapPhotoMemories(nextPhotoMemories)

    setPhotoMemories(nextPhotoMemories)
    setPhotoItems(nextPhotoItems.length > 0 ? nextPhotoItems : photos)
    setSelectedPhotoMemoryId((current) =>
      current && nextPhotoMemories.some((memory) => String(memory.id) === current) ? current : '',
    )

    return nextPhotoMemories
  }, [])

  useEffect(() => {
    window.sessionStorage.removeItem(STORYBOOK_NOTICE_KEY)
    window.localStorage.removeItem(STORYBOOK_NOTICE_KEY)

    const timeoutId = window.setTimeout(() => {
      loadStorybooks().catch(() => {
        // Keep the existing mock storybook when storybook APIs are unavailable.
      })
      loadPhotoMemories().catch(() => {
        // Keep the existing mock photo memories when the API is unavailable.
      })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadPhotoMemories, loadStorybooks])

  useEffect(() => {
    let ignore = false
    const objectUrls: string[] = []

    const timeoutId = window.setTimeout(() => {
      setPhotoImageUrls({})

      if (photoMemories.length === 0) {
        return
      }

      Promise.all(
        photoMemories.map(async (memory) => {
          try {
            const objectUrl = await fetchProtectedFileObjectUrl(getPhotoMemoryImageApiPath(memory))

            if (ignore) {
              revokeObjectUrl(objectUrl)
              return null
            }

            objectUrls.push(objectUrl)

            return [String(memory.id), objectUrl] as const
          } catch {
            return null
          }
        }),
      ).then((entries) => {
        if (ignore) {
          return
        }

        setPhotoImageUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)))
      })
    }, 0)

    return () => {
      ignore = true
      window.clearTimeout(timeoutId)
      objectUrls.forEach(revokeObjectUrl)
    }
  }, [photoMemories])

  const selectedPhotoMemory =
    photoMemories.find((memory) => String(memory.id) === selectedPhotoMemoryId) ?? null
  const activeShareLink = shareLinks.find((shareLink) => shareLink.is_active) ?? null
  const activeShareUrl = activeShareLink ? getShareUrl(activeShareLink) : ''
  const visibleChapterItems: StorybookChapterItem[] = allChapterItems.length > 0
    ? allChapterItems
    : chapterItems.map((chapter) => ({
        ...chapter,
        storybookId: currentStorybook?.id ?? 'mock',
        storybookTitle: currentStorybook?.title ?? '샘플 스토리북',
      }))
  const selectedChapterIndex = visibleChapterItems.findIndex((chapter) => chapter.id === selectedChapterId)
  const selectedChapter = selectedChapterIndex >= 0
    ? visibleChapterItems[selectedChapterIndex]
    : visibleChapterItems[0] ?? null
  const selectedChapterLabel = selectedChapter
    ? `${(selectedChapterIndex >= 0 ? selectedChapterIndex : 0) + 1}번째 기억`
    : ''
  const selectedChapterPreviewParagraphs = splitChapterPreview(selectedChapter?.content)
  const coverTitle = currentStorybook?.title ?? '엄마의 따뜻한 말 한마디'
  const coverImageUrl = normalizeAssetUrl(currentStorybook?.cover_image_url) || '/images/storybook/storybook-cover-mom.png'
  const coverTitleLines = coverTitle.split(' ')
  const coverFirstLine = coverTitleLines.slice(0, -1).join(' ') || '엄마의 따뜻한'
  const coverSecondLine = coverTitleLines.at(-1) ?? '말 한마디'
  const coverSubtitle = currentStorybook?.subtitle ?? currentStorybook?.summary ?? '기억을 다시 만나보세요'
  const coverDate = formatDate(currentStorybook?.created_at)

  const handleChatNavigation = async () => {
    try {
      await ensureMomPersonaId()
      window.location.href = '/chat'
    } catch {
      window.location.href = '/setup'
    }
  }

  const handlePhotoUploadFormChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.currentTarget

    setPhotoUploadForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handlePhotoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoUploadFile(event.currentTarget.files?.[0] ?? null)
    event.currentTarget.value = ''
  }

  const resetPhotoUploadForm = () => {
    setPhotoUploadForm({
      title: '',
      description: '',
      taken_at: '',
      location: '',
    })
    setPhotoUploadFile(null)
  }

  const handlePhotoUploadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isUploadingPhoto) {
      return
    }

    if (!photoUploadForm.title.trim()) {
      setErrorMessage('사진 기억 제목을 입력해주세요.')
      return
    }

    if (!photoUploadFile) {
      setErrorMessage('업로드할 사진 파일을 선택해주세요.')
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsUploadingPhoto(true)

    try {
      const photoMemory = await photoMemoryApi.createPhotoMemory({
        title: photoUploadForm.title,
        description: photoUploadForm.description,
        taken_at: photoUploadForm.taken_at,
        location: photoUploadForm.location,
        file: photoUploadFile,
      })
      const nextSelectedId = String(photoMemory.id)

      setSelectedPhotoMemoryId(nextSelectedId)
      await loadPhotoMemories().catch(() => {
        const createdPhoto = mapPhotoMemories([photoMemory])[0]

        setPhotoMemories((current) => [photoMemory, ...current])

        if (createdPhoto) {
          setPhotoItems((current) => [createdPhoto, ...current])
        }
      })
      setSelectedPhotoMemoryId(nextSelectedId)
      setStatusMessage('사진 기억을 추가했어요. 사진을 선택해 스토리북을 만들 수 있어요.')
      setIsPhotoFormOpen(false)
      resetPhotoUploadForm()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '사진 기억을 추가하지 못했습니다.'))
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleCreateStorybookFromPhoto = async () => {
    if (isCreatingStorybook) {
      return
    }

    if (!selectedPhotoMemory) {
      setErrorMessage('스토리북으로 만들 사진 기억을 선택해주세요.')
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsCreatingStorybook(true)

    try {
      const photoMemoryTitle = getPhotoMemoryTitle(selectedPhotoMemory)
      const storybook = await storybookApi.createStorybook({
        title: `${photoMemoryTitle} 스토리북`,
        photo_memory_id: selectedPhotoMemory.id,
        visibility: 'PRIVATE',
      })

      const refreshedStorybooks = await storybookApi.listStorybooks().catch(() => null)

      if (refreshedStorybooks) {
        const sortedStorybooks = sortStorybooks(refreshedStorybooks)
        const nextStorybooks = sortedStorybooks.some((item) => isSameApiId(item.id, storybook.id))
          ? sortedStorybooks
          : sortStorybooks([storybook, ...sortedStorybooks])

        setStorybookItems(nextStorybooks)
        await loadAllStorybookChapters(nextStorybooks)
      } else {
        const nextStorybooks = [
          storybook,
          ...storybookItems.filter((item) => !isSameApiId(item.id, storybook.id)),
        ]

        setStorybookItems(nextStorybooks)
        await loadAllStorybookChapters(nextStorybooks)
      }

      try {
        await selectStorybook(storybook.id)
      } catch {
        setCurrentStorybook(storybook)
        setChapterItems([])
      }

      setStatusMessage('새 스토리북을 만들었어요. 아래에서 다른 스토리북도 선택할 수 있어요.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '스토리북을 만들지 못했습니다.'))
    } finally {
      setIsCreatingStorybook(false)
    }
  }

  const handleRegenerateStorybook = async () => {
    if (!currentStorybook || isRegeneratingStorybook) {
      setErrorMessage('재생성할 스토리북이 없습니다.')
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsRegeneratingStorybook(true)

    try {
      const regenerated = await storybookApi.regenerateStorybook(currentStorybook.id)
      const nextChapters = regenerated.chapters?.length
        ? regenerated.chapters
        : await storybookApi.listChapters(regenerated.id)
      const mappedChapters = mapStoryChapters(nextChapters)

      setCurrentStorybook(regenerated)
      setChapterItems(mappedChapters)
      setSelectedChapterId(mappedChapters[0]?.id ?? '')
      await loadStorybooks(regenerated.id).catch(() => undefined)
      setStatusMessage('선택한 스토리북을 다시 생성했어요.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '스토리북을 재생성하지 못했습니다.'))
    } finally {
      setIsRegeneratingStorybook(false)
    }
  }

  const handleOpenStorybookDetail = (chapterId?: string, storybookId?: ApiId) => {
    const targetStorybookId = storybookId ?? selectedChapter?.storybookId ?? currentStorybook?.id

    if (!targetStorybookId) {
      setErrorMessage('볼 스토리북이 없습니다.')
      setStatusMessage('')
      return
    }

    const hash = chapterId ? `#chapter-${encodeURIComponent(chapterId)}` : ''
    window.location.assign(`/storybook/${targetStorybookId}${hash}`)
  }

  const handleOpenSharePanel = async () => {
    if (!currentStorybook) {
      setErrorMessage('공유할 스토리북이 없습니다.')
      setStatusMessage('')
      return
    }

    setIsSharePanelOpen(true)
    setErrorMessage('')
    setStatusMessage('')
    setIsShareConsentPromptOpen(false)
    setIsLoadingShareLinks(true)

    try {
      const links = await shareApi.listShareLinks(currentStorybook.id)
      setShareLinks(links)

      if (links.some((link) => link.is_active)) {
        setStatusMessage('사용 중인 공유 링크를 불러왔어요.')
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '공유 링크를 불러오지 못했습니다.'))
    } finally {
      setIsLoadingShareLinks(false)
    }
  }

  const handleCreateShareLink = async () => {
    if (!currentStorybook || isCreatingShareLink) {
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsCreatingShareLink(true)

    try {
      const hasConsent = await consentApi.hasStorybookShareConsent()

      if (!hasConsent) {
        setIsShareConsentPromptOpen(true)
        return
      }

      const shareLink = await createShareLinkWithConsentRetry(currentStorybook.id)
      setShareLinks((current) => [shareLink, ...current.filter((link) => String(link.id) !== String(shareLink.id))])
      setStatusMessage('공유 링크를 만들었어요.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '공유 링크를 만들지 못했습니다.'))
    } finally {
      setIsCreatingShareLink(false)
    }
  }

  const handleConfirmShareConsent = async () => {
    if (!currentStorybook || isCreatingShareLink) {
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsCreatingShareLink(true)

    try {
      await consentApi.createStorybookShareConsent()
      const shareLink = await createShareLinkWithConsentRetry(currentStorybook.id)

      setShareLinks((current) => [shareLink, ...current.filter((link) => String(link.id) !== String(shareLink.id))])
      setIsShareConsentPromptOpen(false)
      setStatusMessage('공유 동의를 저장하고 링크를 만들었어요.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '공유 링크를 만들지 못했습니다.'))
    } finally {
      setIsCreatingShareLink(false)
    }
  }

  const handleCancelShareConsent = () => {
    setIsShareConsentPromptOpen(false)
    setErrorMessage('')
    setStatusMessage('')
  }

  const handleCopyShareUrl = async () => {
    if (!activeShareUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(activeShareUrl)
      setStatusMessage('공유 링크를 복사했어요.')
      setErrorMessage('')
    } catch {
      setErrorMessage('복사에 실패했습니다. 링크를 직접 선택해주세요.')
    }
  }

  const handleDisableShareLink = async () => {
    if (!activeShareLink || isDisablingShareLink) {
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsDisablingShareLink(true)

    try {
      const response = await shareApi.disableShareLink(activeShareLink.id)

      setShareLinks((current) =>
        current.map((link) =>
          String(link.id) === String(response.id)
            ? {
                ...link,
                is_active: response.is_active,
                disabled_at: response.disabled_at,
              }
            : link,
        ),
      )
      setStatusMessage('공유 링크를 비활성화했어요.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '공유 링크를 비활성화하지 못했습니다.'))
    } finally {
      setIsDisablingShareLink(false)
    }
  }

  return (
    <main className="storybook-page">
      <section className="storybook-page__container" aria-label="나의 스토리북">
        <header className="storybook-page__header">
          <span />
          <h1 className="storybook-page__title">나의 스토리북</h1>
          <div className="storybook-page__header-actions">
            <button className="storybook-page__icon-button" type="button" aria-label="스토리북 공유" onClick={handleOpenSharePanel}>
              <StorybookIcon name="share" />
            </button>
            <button className="storybook-page__icon-button" type="button" aria-label="스토리북 메뉴 열기" onClick={() => window.alert('스토리북 메뉴는 준비 중입니다.')}>
              <StorybookIcon name="more" />
            </button>
          </div>
        </header>

        <section className="storybook-page__cover">
          <img src={coverImageUrl} alt="" aria-hidden="true" />
          <div className="storybook-page__cover-content">
            <StorybookIcon name="heart" />
            <h2 className="storybook-page__cover-title">
              {coverFirstLine}
              <br />
              {coverSecondLine}
            </h2>
            <p className="storybook-page__cover-subtitle">{coverSubtitle}</p>
            <p className="storybook-page__cover-date">
              <StorybookIcon name="book" />
              생성일 {coverDate}
            </p>
          </div>
        </section>

        <button className="storybook-page__ready-card" type="button" onClick={handleChatNavigation}>
          <span className="storybook-page__ready-icon">
            <StorybookIcon name="sparkle" />
          </span>
          <span className="storybook-page__ready-text">
            <strong>AI 대화 준비 완료</strong>
            <span>
              음성 <b>0:28</b> · 사진 <b>15장</b> · 기억 <b>{visibleChapterItems.length}챕터</b>
            </span>
            <small>엄마의 목소리와 사진을 바탕으로 AI가 대화를 준비했어요.</small>
          </span>
          <StorybookIcon name="chevron" />
        </button>

        {statusMessage && (
          <p className="storybook-page__status-message" role="status">
            {statusMessage}
          </p>
        )}
        {errorMessage && (
          <p className="storybook-page__error-message" role="alert">
            {errorMessage}
          </p>
        )}

        {isSharePanelOpen && (
          <section className="storybook-page__share-panel" aria-label="스토리북 공유 링크">
            <div className="storybook-page__share-heading">
              <h2>공유 링크</h2>
              <button type="button" onClick={() => setIsSharePanelOpen(false)}>
                닫기
              </button>
            </div>

            {isLoadingShareLinks ? (
              <p className="storybook-page__share-helper">공유 링크를 확인하고 있어요.</p>
            ) : activeShareLink ? (
              <div className="storybook-page__share-body">
                <label>
                  <span>공유 URL</span>
                  <input type="text" value={activeShareUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
                </label>
                <div className="storybook-page__share-actions">
                  <button type="button" onClick={handleCopyShareUrl}>
                    복사
                  </button>
                  <button type="button" onClick={handleDisableShareLink} disabled={isDisablingShareLink}>
                    {isDisablingShareLink ? '비활성화 중...' : '링크 비활성화'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="storybook-page__share-body">
                {isShareConsentPromptOpen ? (
                  <div className="storybook-page__share-consent">
                    <p>스토리북을 링크로 공유하려면 공유 동의가 필요합니다. 계속하시겠어요?</p>
                    <div className="storybook-page__share-actions">
                      <button type="button" onClick={handleConfirmShareConsent} disabled={isCreatingShareLink}>
                        {isCreatingShareLink ? '처리 중...' : '동의하고 공유 링크 만들기'}
                      </button>
                      <button type="button" onClick={handleCancelShareConsent} disabled={isCreatingShareLink}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="storybook-page__share-helper">활성화된 공유 링크가 없습니다.</p>
                    <button className="storybook-page__share-create-button" type="button" onClick={handleCreateShareLink} disabled={isCreatingShareLink || !currentStorybook}>
                      {isCreatingShareLink ? '공유 링크 생성 중...' : '공유 링크 만들기'}
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        <section className="storybook-page__section storybook-page__section--photos">
          <div className="storybook-page__section-header">
            <h2>기억 속 사진</h2>
            <div className="storybook-page__section-actions">
              <button type="button" onClick={() => setIsPhotoFormOpen((current) => !current)}>
                사진 기억 추가
              </button>
              <button type="button" onClick={() => window.alert('전체 사진 보기는 준비 중입니다.')}>
                전체보기 <StorybookIcon name="chevron" />
              </button>
            </div>
          </div>
          {isPhotoFormOpen && (
            <form className="storybook-page__photo-form" onSubmit={handlePhotoUploadSubmit}>
              <label>
                <span>제목</span>
                <input
                  name="title"
                  type="text"
                  maxLength={60}
                  value={photoUploadForm.title}
                  onChange={handlePhotoUploadFormChange}
                  placeholder="예: 제주도 바닷가에서"
                />
              </label>
              <label>
                <span>설명</span>
                <textarea
                  name="description"
                  rows={3}
                  value={photoUploadForm.description}
                  onChange={handlePhotoUploadFormChange}
                  placeholder="사진에 담긴 기억을 적어주세요"
                />
              </label>
              <div className="storybook-page__photo-form-grid">
                <label>
                  <span>촬영일</span>
                  <input
                    name="taken_at"
                    type="date"
                    value={photoUploadForm.taken_at}
                    onChange={handlePhotoUploadFormChange}
                  />
                </label>
                <label>
                  <span>장소</span>
                  <input
                    name="location"
                    type="text"
                    maxLength={80}
                    value={photoUploadForm.location}
                    onChange={handlePhotoUploadFormChange}
                    placeholder="예: 제주도"
                  />
                </label>
              </div>
              <label className="storybook-page__file-picker">
                <span>사진</span>
                <input type="file" accept="image/*" onChange={handlePhotoFileChange} />
                <em>{photoUploadFile?.name ?? '사진 파일을 선택해주세요'}</em>
              </label>
              <div className="storybook-page__photo-form-actions">
                <button type="button" onClick={() => setIsPhotoFormOpen(false)} disabled={isUploadingPhoto}>
                  취소
                </button>
                <button type="submit" disabled={isUploadingPhoto}>
                  {isUploadingPhoto ? '업로드 중...' : '사진 기억 저장'}
                </button>
              </div>
            </form>
          )}
          <div className="storybook-page__photo-list">
            {photoItems.map((photo) => {
              const photoImageUrl = photo.memoryId ? photoImageUrls[photo.memoryId] : photo.src

              return (
                <button
                  className={`storybook-page__photo-card${photo.memoryId && photo.memoryId === selectedPhotoMemoryId ? ' is-selected' : ''}`}
                  type="button"
                  key={photo.id}
                  aria-pressed={photo.memoryId ? photo.memoryId === selectedPhotoMemoryId : undefined}
                  onClick={() => {
                    if (photo.memoryId) {
                      setSelectedPhotoMemoryId(photo.memoryId)
                      setStatusMessage(`${photo.title} 사진을 선택했어요.`)
                      setErrorMessage('')
                    } else {
                      setErrorMessage('업로드한 사진 기억을 선택하면 스토리북을 만들 수 있어요.')
                    }
                  }}
                >
                  {photoImageUrl ? (
                    <img src={photoImageUrl} alt={photo.alt} />
                  ) : (
                    <span className="storybook-page__photo-placeholder">{photo.title}</span>
                  )}
                </button>
              )
            })}
          </div>
          {selectedPhotoMemory && (
            <div className="storybook-page__selected-photo-action">
              <p>{getPhotoMemoryTitle(selectedPhotoMemory)} 사진으로 스토리북을 만들 수 있어요.</p>
              <button type="button" onClick={handleCreateStorybookFromPhoto} disabled={isCreatingStorybook}>
                <StorybookIcon name="book" />
                {isCreatingStorybook ? '스토리북 생성 중...' : '이 사진으로 스토리북 만들기'}
              </button>
            </div>
          )}
        </section>

        <section className="storybook-page__section storybook-page__section--chapters">
          <div className="storybook-page__section-header">
            <div>
              <h2>스토리 챕터</h2>
              <p className="storybook-page__current-storybook">
                전체 {visibleChapterItems.length}개 챕터
              </p>
            </div>
            <button type="button" onClick={() => window.alert('챕터 순서 변경은 준비 중입니다.')}>
              순서 변경 <StorybookIcon name="reorder" />
            </button>
          </div>
          <div className="storybook-page__chapter-card">
            {visibleChapterItems.map((chapter, index) => (
              <button
                className={`storybook-page__chapter-row${selectedChapter?.id === chapter.id && isSameApiId(selectedChapter.storybookId, chapter.storybookId) ? ' is-selected' : ''}`}
                type="button"
                key={`${chapter.storybookId}-${chapter.id}`}
                onClick={() => setSelectedChapterId(chapter.id)}
              >
                <span className="storybook-page__chapter-icon">
                  <StorybookIcon name={chapter.icon} />
                </span>
                <span className="storybook-page__chapter-label">{index + 1}번째 기억</span>
                <span className="storybook-page__chapter-title-group">
                  <strong>{chapter.title}</strong>
                  <small>{chapter.storybookTitle}</small>
                </span>
                <span className="storybook-page__chapter-duration">{chapter.duration}</span>
                <StorybookIcon name="chevron" />
              </button>
            ))}
          </div>
          {selectedChapter && (
            <section className="storybook-page__chapter-preview" aria-label="선택한 챕터 미리보기">
              <span>{selectedChapterLabel}</span>
              <h3>{selectedChapter.title}</h3>
              <small>{selectedChapter.storybookTitle}</small>
              {selectedChapter.summary && <p className="storybook-page__chapter-preview-summary">{selectedChapter.summary}</p>}
              {selectedChapterPreviewParagraphs.length > 0 ? (
                <div className="storybook-page__chapter-preview-content">
                  {selectedChapterPreviewParagraphs.map((paragraph, index) => (
                    <p key={`${selectedChapter.storybookId}-${selectedChapter.id}-preview-${index}`}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="storybook-page__chapter-preview-empty">아직 표시할 챕터 본문이 없습니다.</p>
              )}
              <button type="button" onClick={() => handleOpenStorybookDetail(undefined, selectedChapter.storybookId)}>
                <StorybookIcon name="book" />
                전체 스토리북 보기
              </button>
            </section>
          )}
        </section>

        <section className="storybook-page__actions" aria-label="스토리북 작업">
          <button className="storybook-page__primary-button" type="button" onClick={handleChatNavigation}>
            <StorybookIcon name="sparkle" />
            AI와 대화 시작
          </button>
          <button className="storybook-page__secondary-button" type="button" onClick={() => handleOpenStorybookDetail()}>
            <StorybookIcon name="book" />
            스토리북 보기
          </button>
          <button className="storybook-page__secondary-button" type="button" onClick={handleRegenerateStorybook} disabled={!currentStorybook || isRegeneratingStorybook}>
            <StorybookIcon name="sparkle" />
            {isRegeneratingStorybook ? '재생성 중...' : '재생성'}
          </button>
        </section>

        <nav className="storybook-page__bottom-nav" aria-label="하단 네비게이션">
          <button className="storybook-page__nav-button" type="button" onClick={() => { window.location.href = '/home' }}>
            <StorybookIcon name="home" />
            <span>홈</span>
          </button>
          <button className="storybook-page__nav-button" type="button" onClick={handleChatNavigation}>
            <StorybookIcon name="chat" />
            <span>대화</span>
          </button>
          <button className="storybook-page__nav-button is-active" type="button" aria-current="page">
            <StorybookIcon name="book" />
            <span>스토리북</span>
          </button>
          <button className="storybook-page__nav-button" type="button" onClick={() => { window.location.href = '/my' }}>
            <StorybookIcon name="my" />
            <span>마이</span>
          </button>
        </nav>
      </section>
    </main>
  )
}

export default StorybookPage
