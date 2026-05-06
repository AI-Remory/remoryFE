import { useEffect, useMemo, useRef, useState } from 'react'
import { mockProfilePhotos } from '../data/mockProfilePhotos'
import type { ProfilePhoto } from '../data/mockProfilePhotos'
import {
  getCurrentSeason,
  getSeasonFromDate,
  seasons,
} from '../utils/getSeasonFromDate'
import type { Season } from '../utils/getSeasonFromDate'
import AnimatedSeasonTitle from './AnimatedSeasonTitle'
import SeasonalPhotoGrid from './SeasonalPhotoGrid'

function getPhotoDate(photo: ProfilePhoto) {
  return photo.takenAt ?? photo.createdAt ?? photo.uploadedAt ?? new Date().toISOString()
}

function SeasonPhotoArchive() {
  const [activeSeason, setActiveSeason] = useState<Season>(getCurrentSeason)
  const [titleScrollProgress, setTitleScrollProgress] = useState(0)
  const sectionRefs = useRef<Partial<Record<Season, HTMLElement>>>({})

  const photosBySeason = useMemo(() => {
    return seasons.reduce(
      (seasonMap, season) => {
        seasonMap[season] = mockProfilePhotos.filter(
          (photo) => getSeasonFromDate(getPhotoDate(photo)) === season,
        )
        return seasonMap
      },
      {
        spring: [],
        summer: [],
        autumn: [],
        winter: [],
      } as Record<Season, ProfilePhoto[]>,
    )
  }, [])

  const counts = useMemo(
    () =>
      seasons.reduce(
        (countMap, season) => {
          countMap[season] = photosBySeason[season].length
          return countMap
        },
        {
          spring: 0,
          summer: 0,
          autumn: 0,
          winter: 0,
        } as Record<Season, number>,
      ),
    [photosBySeason],
  )

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)
        if (visibleEntries.length === 0) return

        const mostVisible = visibleEntries.reduce((prev, current) => {
          return prev.intersectionRatio > current.intersectionRatio ? prev : current
        })

        const nextSeason = mostVisible.target.getAttribute('data-season') as Season
        if (nextSeason) {
          setActiveSeason((prev) => {
            if (prev !== nextSeason) {
              return nextSeason
            }
            return prev
          })
        }
      },
      {
        root: null,
        rootMargin: '-25% 0px -25% 0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      },
    )

    seasons.forEach((season) => {
      const el = sectionRefs.current[season]
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, []) // Empty dependency array for stable observer

  useEffect(() => {
    let animationFrame = 0

    const updateTitleProgress = () => {
      animationFrame = 0

      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll))

      setTitleScrollProgress(progress * (seasons.length - 1))
    }

    const handleScroll = () => {
      if (animationFrame) return
      animationFrame = window.requestAnimationFrame(updateTitleProgress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    updateTitleProgress()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return (
    <main className="profile-page">
      <AnimatedSeasonTitle scrollProgress={titleScrollProgress} />

      <header className="profile-hero">
        <a className="profile-hero__brand" href="/" aria-label="Go to Remory home">
          Remory
        </a>
        <div className="profile-hero__copy">
          <p>Personal profile</p>
          <h1>Min Seo's photo voice archive</h1>
          <span>
            Photos are grouped by the season they were taken, created, or uploaded.
          </span>
        </div>
      </header>

      <aside className="season-scroll-progress" aria-label="Season scroll progress">
        <div
          className="season-scroll-progress__indicator"
          style={{
            '--active-index': seasons.indexOf(activeSeason),
          } as React.CSSProperties}
        />
        {seasons.map((season) => (
          <span
            key={season}
            className={activeSeason === season ? 'is-active' : ''}
            aria-current={activeSeason === season ? 'step' : undefined}
          >
            {season} {counts[season]}
          </span>
        ))}
      </aside>

      <div className="season-scroll-stack">
        {seasons.map((season) => (
          <section
            key={season}
            ref={(element) => {
              if (element) {
                sectionRefs.current[season] = element
              }
            }}
            className="season-scroll-section"
            data-season={season}
            aria-labelledby={`${season}-heading`}
          >
            <div className="season-section-heading">
              <p>{String(counts[season]).padStart(2, '0')} memories</p>
              <h2 id={`${season}-heading`}>{season}</h2>
              <span>
                Scroll into this chapter to reveal the season title and its saved
                photo voices.
              </span>
            </div>
            <SeasonalPhotoGrid photos={photosBySeason[season]} season={season} />
          </section>
        ))}
      </div>
    </main>
  )
}

export default SeasonPhotoArchive
