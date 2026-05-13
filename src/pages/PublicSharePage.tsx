import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../lib/apiClient'
import { shareApi } from '../services/shareApi'
import type { PublicSharedStoryBook } from '../types/api'
import './PublicSharePage.css'

function getShareToken() {
  const prefix = '/share/'
  const { pathname } = window.location

  if (!pathname.startsWith(prefix)) {
    return ''
  }

  return decodeURIComponent(pathname.slice(prefix.length).split('/')[0] ?? '')
}

function getPublicShareErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 404 || error.status === 410
      ? '공유 링크가 만료되었거나 비활성화되었습니다.'
      : error.message
  }

  return '공유 링크가 만료되었거나 비활성화되었습니다.'
}

function PublicSharePage() {
  const token = useMemo(() => getShareToken(), [])
  const [storybook, setStorybook] = useState<PublicSharedStoryBook | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadPublicShare() {
      if (!token) {
        setErrorMessage('공유 링크가 만료되었거나 비활성화되었습니다.')
        setIsLoading(false)
        return
      }

      try {
        const response = await shareApi.getPublicShare(token)

        if (!ignore) {
          setStorybook(response)
          setErrorMessage('')
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getPublicShareErrorMessage(error))
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadPublicShare()

    return () => {
      ignore = true
    }
  }, [token])

  const chapters = [...(storybook?.chapters ?? [])].sort((left, right) => left.order_index - right.order_index)

  return (
    <main className="public-share-page">
      <section className="public-share-page__container" aria-label="공유 스토리북">
        {isLoading ? (
          <p className="public-share-page__loading">공유 스토리북을 불러오고 있어요.</p>
        ) : errorMessage ? (
          <section className="public-share-page__empty" role="alert">
            <h1>공유 스토리북</h1>
            <p>{errorMessage}</p>
            <button type="button" onClick={() => { window.location.href = '/' }}>
              Remory로 돌아가기
            </button>
          </section>
        ) : storybook ? (
          <>
            <header className="public-share-page__header">
              <span>{storybook.visibility ?? 'SHARED'}</span>
              <h1>{storybook.title}</h1>
              {storybook.summary && <p>{storybook.summary}</p>}
            </header>

            <section className="public-share-page__chapters" aria-label="스토리 챕터">
              {chapters.length > 0 ? (
                chapters.map((chapter) => (
                  <article className="public-share-page__chapter" key={`${chapter.order_index}-${chapter.title}`}>
                    <span>{chapter.order_index + 1}</span>
                    <h2>{chapter.title}</h2>
                    {chapter.summary && <p className="public-share-page__chapter-summary">{chapter.summary}</p>}
                    <p>{chapter.content}</p>
                  </article>
                ))
              ) : (
                <p className="public-share-page__loading">아직 표시할 챕터가 없습니다.</p>
              )}
            </section>

            <button className="public-share-page__home-button" type="button" onClick={() => { window.location.href = '/' }}>
              Remory로 돌아가기
            </button>
          </>
        ) : null}
      </section>
    </main>
  )
}

export default PublicSharePage
