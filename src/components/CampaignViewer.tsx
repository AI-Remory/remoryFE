import { useCallback, useEffect, useRef, useState } from 'react'
import type { Campaign } from '../data/campaigns'
import CampaignNavigation from './CampaignNavigation'
import CampaignProgress from './CampaignProgress'

type CampaignViewerProps = {
  campaigns: Campaign[]
}

const TRANSITION_LOCK_MS = 900
const WHEEL_THRESHOLD = 28
const TOUCH_THRESHOLD = 48

function CampaignViewer({ campaigns }: CampaignViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageFailed, setImageFailed] = useState<Record<string, boolean>>({})
  const lockRef = useRef(false)
  const touchStartYRef = useRef<number | null>(null)

  const activeCampaign = campaigns[activeIndex]

  const releaseLock = () => {
    window.setTimeout(() => {
      lockRef.current = false
    }, TRANSITION_LOCK_MS)
  }

  const moveCampaign = useCallback(
    (direction: 1 | -1) => {
      if (lockRef.current) {
        return
      }

      setActiveIndex((currentIndex) => {
        const nextIndex = Math.min(
          Math.max(currentIndex + direction, 0),
          campaigns.length - 1,
        )

        if (nextIndex === currentIndex) {
          return currentIndex
        }

        lockRef.current = true
        releaseLock()
        return nextIndex
      })
    },
    [campaigns.length],
  )

  const selectCampaign = (index: number) => {
    if (index === activeIndex) {
      return
    }

    lockRef.current = true
    setActiveIndex(index)
    releaseLock()
  }

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()

      if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) {
        return
      }

      moveCampaign(event.deltaY > 0 ? 1 : -1)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault()
        moveCampaign(1)
      }

      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault()
        moveCampaign(-1)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [moveCampaign])

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    touchStartYRef.current = event.touches[0].clientY
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const startY = touchStartYRef.current

    if (startY === null) {
      return
    }

    const deltaY = startY - event.changedTouches[0].clientY
    touchStartYRef.current = null

    if (Math.abs(deltaY) < TOUCH_THRESHOLD) {
      return
    }

    moveCampaign(deltaY > 0 ? 1 : -1)
  }

  const markImageFailed = (campaignId: string) => {
    setImageFailed((current) => ({ ...current, [campaignId]: true }))
  }

  return (
    <main
      className="campaign-viewer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="campaign-viewer__fallback" />
      {campaigns.map((campaign, index) => (
        <img
          key={campaign.id}
          className={`campaign-viewer__image ${
            index === activeIndex ? 'is-active' : ''
          } ${imageFailed[campaign.id] ? 'is-hidden' : ''}`}
          src={campaign.image}
          alt=""
          aria-hidden="true"
          onError={() => markImageFailed(campaign.id)}
        />
      ))}
      <div className="campaign-viewer__overlay" />

      <CampaignNavigation onStart={() => selectCampaign(0)} />

      <section className="campaign-viewer__content" aria-live="polite">
        <p className="campaign-viewer__eyebrow" key={`${activeCampaign.id}-meta`}>
          {activeCampaign.year} · {activeCampaign.location}
        </p>
        <h1 key={`${activeCampaign.id}-title`}>{activeCampaign.title}</h1>
        <p
          className="campaign-viewer__subtitle"
          key={`${activeCampaign.id}-subtitle`}
        >
          {activeCampaign.subtitle}
        </p>
        <p
          className="campaign-viewer__description"
          key={`${activeCampaign.id}-description`}
        >
          {activeCampaign.description}
        </p>
        <div className="campaign-viewer__actions">
          <button type="button" aria-label="기억 시작하기">
            기억 시작하기
          </button>
          <button type="button" aria-label="사진 업로드">
            사진 업로드
          </button>
          <button type="button" aria-label={activeCampaign.audioLabel}>
            {activeCampaign.audioLabel}
          </button>
        </div>
      </section>

      <CampaignProgress
        campaigns={campaigns}
        activeIndex={activeIndex}
        onSelect={selectCampaign}
      />

      <div className="campaign-viewer__mobile-controls">
        <button
          type="button"
          onClick={() => moveCampaign(-1)}
          disabled={activeIndex === 0}
          aria-label="이전 캠페인"
        >
          이전
        </button>
        <button
          type="button"
          onClick={() => moveCampaign(1)}
          disabled={activeIndex === campaigns.length - 1}
          aria-label="다음 캠페인"
        >
          다음
        </button>
      </div>
    </main>
  )
}

export default CampaignViewer
