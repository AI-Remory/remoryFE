import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../lib/apiClient'
import { ensureMomPersonaId } from '../services/personaSession'
import { storybookApi } from '../services/storybookApi'
import type { StoryBookDetail, StoryChapter } from '../types/api'
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

  return (
    <main className="storybook-detail-page">
      <section className="storybook-detail-page__container" aria-label="스토리북 상세">
        <header className="storybook-detail-page__header">
          <button type="button" onClick={() => window.history.back()}>
            뒤로가기
          </button>
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
