import { useEffect, useRef, useState } from 'react'
import type { Season } from '../utils/getSeasonFromDate'

type AnimatedSeasonTitleProps = {
  season: Season
}

const ANIMATION_MS = 1100

function AnimatedSeasonTitle({ season }: AnimatedSeasonTitleProps) {
  const [displaySeason, setDisplaySeason] = useState(season)
  const [exitingSeason, setExitingSeason] = useState<Season | null>(null)
  const previousSeasonRef = useRef(season)

  useEffect(() => {
    if (previousSeasonRef.current === season) {
      return
    }

    setExitingSeason(previousSeasonRef.current)
    setDisplaySeason(season)
    previousSeasonRef.current = season

    const timer = window.setTimeout(() => {
      setExitingSeason(null)
    }, ANIMATION_MS)

    return () => window.clearTimeout(timer)
  }, [season])

  return (
    <div className="animated-season-title" aria-hidden="true">
      <div className="animated-season-title__mask">
        {exitingSeason ? (
          <span
            key={`exit-${exitingSeason}`}
            className="animated-season-title__word animated-season-title__word--exit"
          >
            {exitingSeason}
          </span>
        ) : null}
        <span
          key={`enter-${displaySeason}`}
          className="animated-season-title__word animated-season-title__word--enter"
        >
          {displaySeason}
        </span>
      </div>
    </div>
  )
}

export default AnimatedSeasonTitle
