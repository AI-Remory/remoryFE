import type { CSSProperties } from 'react'
import { seasons } from '../utils/getSeasonFromDate'
import type { Season } from '../utils/getSeasonFromDate'

type AnimatedSeasonTitleProps = {
  scrollProgress: number
}

const HOLD_RATIO = 0.78
const TRANSITION_RATIO = 1 - HOLD_RATIO

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function easeInOut(value: number) {
  return value * value * (3 - 2 * value)
}

function getHeldScrollProgress(scrollProgress: number) {
  const lastIndex = seasons.length - 1
  const clampedProgress = clamp(scrollProgress, 0, lastIndex)
  const segmentIndex = Math.min(Math.floor(clampedProgress), lastIndex - 1)
  const segmentProgress = clampedProgress - segmentIndex

  if (clampedProgress >= lastIndex) {
    return lastIndex
  }

  if (segmentProgress <= HOLD_RATIO) {
    return segmentIndex
  }

  const transitionProgress = clamp(
    (segmentProgress - HOLD_RATIO) / TRANSITION_RATIO,
  )

  return segmentIndex + easeInOut(transitionProgress)
}

function getWordVisibility(scrollProgress: number, index: number) {
  return clamp(1 - Math.abs(scrollProgress - index))
}

function getLetterReveal(visibility: number, index: number, total: number) {
  const stagger = total <= 1 ? 0 : index / (total - 1)

  return clamp((visibility - stagger * 0.18) / 0.82)
}

function AnimatedSeasonTitle({ scrollProgress }: AnimatedSeasonTitleProps) {
  const heldScrollProgress = getHeldScrollProgress(scrollProgress)

  const renderLetters = (text: Season, wordIndex: number) => {
    const seasonIndex = seasons.indexOf(text as Season) + 1
    const formattedIndex = String(seasonIndex).padStart(2, '0')
    const visibility = getWordVisibility(heldScrollProgress, wordIndex)
    const direction = wordIndex < heldScrollProgress ? -1 : 1
    const letters = text.split('')

    return (
      <div
        key={text}
        className="animated-season-title__word"
        style={
          {
            opacity: visibility,
            zIndex: Math.round(visibility * 10),
            transform: `translate3d(0, ${(1 - visibility) * 20 * direction}px, 0) scale(${
              0.985 + visibility * 0.015
            })`,
            clipPath: `inset(0 ${(1 - visibility) * 52}% 0 0)`,
          } as CSSProperties
        }
      >
        <div className="animated-season-title__letters">
          {letters.map((char, i) => {
            const reveal = getLetterReveal(visibility, i, letters.length)

            return (
              <span
                key={`${text}-${i}`}
                className="animated-season-title__letter"
                style={
                  {
                    opacity: reveal,
                    transform: `translate3d(0, ${(1 - reveal) * 14}px, 0)`,
                    clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
                  } as CSSProperties
                }
              >
                {char}
              </span>
            )
          })}
          <sup
            className="animated-season-title__number"
            style={
              {
                opacity: visibility,
                transform: `translate3d(0, ${(1 - visibility) * 8}px, 0)`,
              } as CSSProperties
            }
          >
            ({formattedIndex})
          </sup>
        </div>
      </div>
    )
  }

  return (
    <div className="animated-season-title" aria-hidden="true">
      {seasons.map((season, index) => renderLetters(season, index))}
      <div className="animated-season-title__ambient animated-season-title__ambient--left">
        memory
      </div>
      <div className="animated-season-title__ambient animated-season-title__ambient--right">
        archive
      </div>
    </div>
  )
}

export default AnimatedSeasonTitle
