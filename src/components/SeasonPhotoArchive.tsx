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
        const mostVisibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]

        const nextSeason = mostVisibleEntry?.target.getAttribute(
          'data-season',
        ) as Season | null

        if (nextSeason) {
          setActiveSeason(nextSeason)
        }
      },
      {
        root: null,
        rootMargin: '-28% 0px -36% 0px',
        threshold: [0.2, 0.35, 0.5, 0.65],
      },
    )

    seasons.forEach((season) => {
      const section = sectionRefs.current[season]

      if (section) {
        observer.observe(section)
      }
    })

    return () => observer.disconnect()
  }, [])

  return (
    <main className="profile-page">
      <AnimatedSeasonTitle season={activeSeason} />

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
