import { useEffect, useState } from 'react'
import { ensureMomPersonaId } from '../services/personaSession'
import { storybookApi } from '../services/storybookApi'
import type { StoryBook, StoryChapter } from '../types/api'
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
  src: string
  alt: string
}

type Chapter = {
  id: string
  label: string
  title: string
  duration: string
  icon: 'leaf' | 'meal' | 'mic'
}

const photos: Photo[] = [
  {
    id: 'young-mom',
    src: '/images/storybook/memory-young-mom.png',
    alt: '산책길에서 찍은 엄마의 젊은 날 사진',
  },
  {
    id: 'mom-child',
    src: '/images/storybook/memory-mom-child.png',
    alt: '엄마와 아이가 함께 웃고 있는 추억 사진',
  },
  {
    id: 'family-table',
    src: '/images/storybook/memory-family-table.png',
    alt: '가족이 식탁에 모여 있는 추억 사진',
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
  return apiChapters.map((chapter, index) => ({
    id: String(chapter.id),
    label: chapter.label ?? `${chapter.order_index ?? index + 1}번째 기억`,
    title: chapter.title,
    duration: chapter.duration ? String(chapter.duration) : '0:00',
    icon: getChapterIcon(index),
  }))
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
  const [chapterItems, setChapterItems] = useState<Chapter[]>(chapters)

  useEffect(() => {
    let ignore = false

    async function loadStorybook() {
      try {
        const storybooks = await storybookApi.listStorybooks()
        const firstStorybook = storybooks[0]

        if (!firstStorybook) {
          return
        }

        const detail = await storybookApi.getStorybook(firstStorybook.id)
        const detailChapters = detail.chapters?.length ? detail.chapters : await storybookApi.listChapters(firstStorybook.id)

        if (!ignore) {
          setCurrentStorybook(detail)

          if (detailChapters.length > 0) {
            setChapterItems(mapStoryChapters(detailChapters))
          }
        }
      } catch {
        // Keep the existing mock storybook when storybook APIs are unavailable.
      }
    }

    loadStorybook()

    return () => {
      ignore = true
    }
  }, [])

  const coverTitle = currentStorybook?.title ?? '엄마의 따뜻한 말 한마디'
  const coverTitleLines = coverTitle.split(' ')
  const coverFirstLine = coverTitleLines.slice(0, -1).join(' ') || '엄마의 따뜻한'
  const coverSecondLine = coverTitleLines.at(-1) ?? '말 한마디'
  const coverSubtitle = currentStorybook?.subtitle ?? currentStorybook?.summary ?? '기억을 다시 만나보세요'
  const coverDate = formatDate(currentStorybook?.created_at)

  const handleChatNavigation = async () => {
    try {
      await ensureMomPersonaId()
      window.location.href = '/chat'
    } catch (error) {
      console.error('Failed to prepare persona before chat navigation', error)
    }
  }

  return (
    <main className="storybook-page">
      <section className="storybook-page__container" aria-label="나의 스토리북">
        <header className="storybook-page__header">
          <span />
          <h1 className="storybook-page__title">나의 스토리북</h1>
          <div className="storybook-page__header-actions">
            <button className="storybook-page__icon-button" type="button" aria-label="스토리북 공유" onClick={() => console.log('share storybook')}>
              <StorybookIcon name="share" />
            </button>
            <button className="storybook-page__icon-button" type="button" aria-label="스토리북 메뉴 열기" onClick={() => console.log('open storybook menu')}>
              <StorybookIcon name="more" />
            </button>
          </div>
        </header>

        <section className="storybook-page__cover">
          <img src={currentStorybook?.cover_image_url ?? '/images/storybook/storybook-cover-mom.png'} alt="" aria-hidden="true" />
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
              음성 <b>0:28</b> · 사진 <b>15장</b> · 기억 <b>{chapterItems.length}챕터</b>
            </span>
            <small>엄마의 목소리와 사진을 바탕으로 AI가 대화를 준비했어요.</small>
          </span>
          <StorybookIcon name="chevron" />
        </button>

        <section className="storybook-page__section">
          <div className="storybook-page__section-header">
            <h2>기억 속 사진</h2>
            <button type="button" onClick={() => console.log('view all photos')}>
              전체보기 <StorybookIcon name="chevron" />
            </button>
          </div>
          <div className="storybook-page__photo-list">
            {photos.map((photo) => (
              <button className="storybook-page__photo-card" type="button" key={photo.id} onClick={() => console.log('open photo', photo.id)}>
                <img src={photo.src} alt={photo.alt} />
              </button>
            ))}
          </div>
        </section>

        <section className="storybook-page__section">
          <div className="storybook-page__section-header">
            <h2>스토리 챕터</h2>
            <button type="button" onClick={() => console.log('reorder chapters')}>
              순서 변경 <StorybookIcon name="reorder" />
            </button>
          </div>
          <div className="storybook-page__chapter-card">
            {chapterItems.map((chapter) => (
              <button className="storybook-page__chapter-row" type="button" key={chapter.id} onClick={() => console.log('open chapter', chapter.id)}>
                <span className="storybook-page__chapter-icon">
                  <StorybookIcon name={chapter.icon} />
                </span>
                <span className="storybook-page__chapter-label">{chapter.label}</span>
                <strong>{chapter.title}</strong>
                <span className="storybook-page__chapter-duration">{chapter.duration}</span>
                <StorybookIcon name="chevron" />
              </button>
            ))}
          </div>
        </section>

        <section className="storybook-page__actions" aria-label="스토리북 작업">
          <button className="storybook-page__primary-button" type="button" onClick={handleChatNavigation}>
            <StorybookIcon name="sparkle" />
            AI와 대화 시작
          </button>
          <button className="storybook-page__secondary-button" type="button" onClick={() => console.log('view storybook')}>
            <StorybookIcon name="book" />
            스토리북 보기
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
