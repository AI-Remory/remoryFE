import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../lib/apiClient'
import { consentApi } from '../services/consentApi'
import { ensureMomPersonaId } from '../services/personaSession'
import { shareApi } from '../services/shareApi'
import { createShareLinkWithConsentRetry } from '../services/storybookShare'
import { storybookApi } from '../services/storybookApi'
import type { ShareLink, StoryBookDetail, StoryChapter } from '../types/api'
import './StorybookDetailPage.css'

function getStorybookIdFromPath() {
  const prefix = '/storybook/'
  const { pathname } = window.location

  if (!pathname.startsWith(prefix)) {
    return ''
  }

  return decodeURIComponent(pathname.slice(prefix.length).split('/')[0] ?? '')
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 403 || error.status === 404
      ? '스토리북을 찾을 수 없습니다.'
      : error.message
  }

  return '스토리북을 불러오지 못했습니다.'
}

function getShareErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  return fallbackMessage
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

function formatDate(createdAt?: string) {
  if (!createdAt) {
    return '날짜 없음'
  }

  const date = new Date(createdAt)

  if (Number.isNaN(date.getTime())) {
    return '날짜 없음'
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function sortChapters(chapters: StoryChapter[]) {
  return [...chapters].sort((left, right) => {
    const leftOrder = left.order_index ?? left.order ?? 0
    const rightOrder = right.order_index ?? right.order ?? 0

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return String(left.id).localeCompare(String(right.id))
  })
}

function splitParagraphs(content?: string | null) {
  const paragraphs = content
    ?.split(/\n{2,}|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return paragraphs && paragraphs.length > 0 ? paragraphs : ['아직 작성된 본문이 없습니다.']
}

function StorybookDetailPage() {
  const storybookId = useMemo(() => getStorybookIdFromPath(), [])
  const [storybook, setStorybook] = useState<StoryBookDetail | null>(null)
  const [chapters, setChapters] = useState<StoryChapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [isLoadingShareLinks, setIsLoadingShareLinks] = useState(false)
  const [isCreatingShareLink, setIsCreatingShareLink] = useState(false)
  const [isDisablingShareLink, setIsDisablingShareLink] = useState(false)
  const [isShareConsentPromptOpen, setIsShareConsentPromptOpen] = useState(false)
  const [shareStatusMessage, setShareStatusMessage] = useState('')
  const [shareErrorMessage, setShareErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadStorybookDetail() {
      if (!storybookId) {
        setErrorMessage('스토리북을 찾을 수 없습니다.')
        setIsLoading(false)
        return
      }

      try {
        const detail = await storybookApi.getStorybook(storybookId)
        const detailChapters = await storybookApi.listChapters(storybookId)

        if (!ignore) {
          setStorybook(detail)
          setChapters(sortChapters(detailChapters.length > 0 ? detailChapters : detail.chapters ?? []))
          setErrorMessage('')
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getApiErrorMessage(error))
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadStorybookDetail()
    }, 0)

    return () => {
      ignore = true
      window.clearTimeout(timeoutId)
    }
  }, [storybookId])

  useEffect(() => {
    if (isLoading || chapters.length === 0 || !window.location.hash) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      const targetId = decodeURIComponent(window.location.hash.slice(1))
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [chapters.length, isLoading])

  const handleChatNavigation = async () => {
    try {
      await ensureMomPersonaId()
      window.location.assign('/chat')
    } catch {
      window.location.assign('/setup')
    }
  }

  const activeShareLink = shareLinks.find((shareLink) => shareLink.is_active) ?? null
  const activeShareUrl = activeShareLink ? getShareUrl(activeShareLink) : ''

  const handleOpenSharePanel = async () => {
    if (!storybookId || !storybook) {
      setShareErrorMessage('공유할 스토리북이 없습니다.')
      setShareStatusMessage('')
      return
    }

    setIsSharePanelOpen(true)
    setShareStatusMessage('')
    setShareErrorMessage('')
    setIsShareConsentPromptOpen(false)
    setIsLoadingShareLinks(true)

    try {
      const links = await shareApi.listShareLinks(storybookId)
      setShareLinks(links)

      if (links.some((link) => link.is_active)) {
        setShareStatusMessage('사용 중인 공유 링크를 불러왔어요.')
      }
    } catch (error) {
      setShareErrorMessage(getShareErrorMessage(error, '공유 링크를 불러오지 못했습니다.'))
    } finally {
      setIsLoadingShareLinks(false)
    }
  }

  const handleRegenerateStorybook = async () => {
    if (!storybookId || isRegenerating) {
      return
    }

    setErrorMessage('')
    setIsRegenerating(true)

    try {
      const regenerated = await storybookApi.regenerateStorybook(storybookId)
      const nextChapters = regenerated.chapters?.length
        ? regenerated.chapters
        : await storybookApi.listChapters(regenerated.id)

      setStorybook(regenerated)
      setChapters(sortChapters(nextChapters))
      setShareStatusMessage('스토리북을 다시 생성했어요.')
      setShareErrorMessage('')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleCreateShareLink = async () => {
    if (!storybookId || isCreatingShareLink) {
      return
    }

    setShareStatusMessage('')
    setShareErrorMessage('')
    setIsCreatingShareLink(true)

    try {
      const hasConsent = await consentApi.hasStorybookShareConsent()

      if (!hasConsent) {
        setIsShareConsentPromptOpen(true)
        return
      }

      const shareLink = await createShareLinkWithConsentRetry(storybookId)

      setShareLinks((current) => [shareLink, ...current.filter((link) => String(link.id) !== String(shareLink.id))])
      setShareStatusMessage('공유 링크를 만들었어요.')
    } catch (error) {
      setShareErrorMessage(getShareErrorMessage(error, '공유 링크를 만들지 못했습니다.'))
    } finally {
      setIsCreatingShareLink(false)
    }
  }

  const handleConfirmShareConsent = async () => {
    if (!storybookId || isCreatingShareLink) {
      return
    }

    setShareStatusMessage('')
    setShareErrorMessage('')
    setIsCreatingShareLink(true)

    try {
      await consentApi.createStorybookShareConsent()
      const shareLink = await createShareLinkWithConsentRetry(storybookId)

      setShareLinks((current) => [shareLink, ...current.filter((link) => String(link.id) !== String(shareLink.id))])
      setIsShareConsentPromptOpen(false)
      setShareStatusMessage('공유 동의를 저장하고 링크를 만들었어요.')
    } catch (error) {
      setShareErrorMessage(getShareErrorMessage(error, '공유 링크를 만들지 못했습니다.'))
    } finally {
      setIsCreatingShareLink(false)
    }
  }

  const handleCancelShareConsent = () => {
    setIsShareConsentPromptOpen(false)
    setShareStatusMessage('')
    setShareErrorMessage('')
  }

  const handleCopyShareUrl = async () => {
    if (!activeShareUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(activeShareUrl)
      setShareStatusMessage('공유 링크를 복사했어요.')
      setShareErrorMessage('')
    } catch {
      setShareErrorMessage('복사에 실패했습니다. 링크를 직접 선택해주세요.')
    }
  }

  const handleDisableShareLink = async () => {
    if (!activeShareLink || isDisablingShareLink) {
      return
    }

    setShareStatusMessage('')
    setShareErrorMessage('')
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
      setShareStatusMessage('공유 링크를 비활성화했어요.')
    } catch (error) {
      setShareErrorMessage(getShareErrorMessage(error, '공유 링크를 비활성화하지 못했습니다.'))
    } finally {
      setIsDisablingShareLink(false)
    }
  }

  return (
    <main className="storybook-detail-page">
      <section className="storybook-detail-page__container" aria-label="스토리북 상세">
        <header className="storybook-detail-page__header">
          <div className="storybook-detail-page__header-actions">
            <button type="button" onClick={() => window.history.back()}>
              뒤로가기
            </button>
            <span className="storybook-detail-page__header-action-group">
              <button type="button" onClick={handleRegenerateStorybook} disabled={!storybookId || !storybook || isRegenerating}>
                {isRegenerating ? '재생성 중...' : '재생성'}
              </button>
              <button type="button" onClick={handleOpenSharePanel} disabled={!storybookId || !storybook}>
                공유하기
              </button>
            </span>
          </div>
          <span>StoryBook</span>
          <h1>{storybook?.title ?? '스토리북'}</h1>
          {storybook?.summary && <p>{storybook.summary}</p>}
          {storybook && (
            <div className="storybook-detail-page__meta" aria-label="스토리북 정보">
              <span>{storybook.visibility ?? 'PRIVATE'}</span>
              <span>{storybook.status ?? 'DRAFT'}</span>
              <span>{formatDate(storybook.created_at)}</span>
            </div>
          )}
        </header>

        {isSharePanelOpen && (
          <section className="storybook-detail-page__share-panel" aria-label="스토리북 공유 링크">
            <div className="storybook-detail-page__share-heading">
              <h2>공유 링크</h2>
              <button type="button" onClick={() => setIsSharePanelOpen(false)}>
                닫기
              </button>
            </div>

            {shareStatusMessage && (
              <p className="storybook-detail-page__share-status" role="status">
                {shareStatusMessage}
              </p>
            )}
            {shareErrorMessage && (
              <p className="storybook-detail-page__share-error" role="alert">
                {shareErrorMessage}
              </p>
            )}

            {isLoadingShareLinks ? (
              <p className="storybook-detail-page__share-helper">공유 링크를 확인하고 있어요.</p>
            ) : activeShareLink ? (
              <div className="storybook-detail-page__share-body">
                <label>
                  <span>공유 URL</span>
                  <input type="text" value={activeShareUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
                </label>
                <div className="storybook-detail-page__share-actions">
                  <button type="button" onClick={handleCopyShareUrl}>
                    링크 복사
                  </button>
                  <button type="button" onClick={handleDisableShareLink} disabled={isDisablingShareLink}>
                    {isDisablingShareLink ? '비활성화 중...' : '링크 비활성화'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="storybook-detail-page__share-body">
                {isShareConsentPromptOpen ? (
                  <div className="storybook-detail-page__share-consent">
                    <p>스토리북을 링크로 공유하려면 공유 동의가 필요합니다. 계속하시겠어요?</p>
                    <div className="storybook-detail-page__share-actions">
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
                    <p className="storybook-detail-page__share-helper">활성화된 공유 링크가 없습니다.</p>
                    <button className="storybook-detail-page__share-create-button" type="button" onClick={handleCreateShareLink} disabled={isCreatingShareLink || !storybookId}>
                      {isCreatingShareLink ? '공유 링크 생성 중...' : '공유 링크 만들기'}
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {isLoading ? (
          <section className="storybook-detail-page__state">
            <p>스토리북을 불러오고 있어요.</p>
          </section>
        ) : errorMessage ? (
          <section className="storybook-detail-page__state" role="alert">
            <h2>스토리북을 찾을 수 없습니다.</h2>
            <p>{errorMessage}</p>
            <button type="button" onClick={() => { window.location.assign('/storybook') }}>
              목록으로 돌아가기
            </button>
          </section>
        ) : (
          <section className="storybook-detail-page__chapters" aria-label="챕터 목록">
            {chapters.length > 0 ? (
              chapters.map((chapter, index) => (
                <article className="storybook-detail-page__chapter" id={`chapter-${chapter.id}`} key={String(chapter.id)}>
                  <span>{chapter.label ?? `${chapter.order_index ?? index + 1}번째 기억`}</span>
                  <h2>{chapter.title}</h2>
                  {chapter.summary && <p className="storybook-detail-page__chapter-summary">{chapter.summary}</p>}
                  <div className="storybook-detail-page__chapter-content">
                    {splitParagraphs(chapter.content).map((paragraph, paragraphIndex) => (
                      <p key={`${chapter.id}-paragraph-${paragraphIndex}`}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <section className="storybook-detail-page__state">
                <p>아직 표시할 챕터가 없습니다.</p>
              </section>
            )}
          </section>
        )}

        <nav className="storybook-detail-page__bottom-nav" aria-label="하단 네비게이션">
          <button type="button" onClick={() => { window.location.assign('/home') }}>
            홈
          </button>
          <button type="button" onClick={handleChatNavigation}>
            대화
          </button>
          <button className="is-active" type="button" onClick={() => { window.location.assign('/storybook') }}>
            스토리북
          </button>
          <button type="button" onClick={() => { window.location.assign('/my') }}>
            마이
          </button>
        </nav>
      </section>
    </main>
  )
}

export default StorybookDetailPage
