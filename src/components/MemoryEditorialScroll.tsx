import { useEffect, useRef, useState } from 'react'
import FloatingMemoryImage from './FloatingMemoryImage'
import { memoryGallery } from '../data/memoryGallery'

function MemoryEditorialScroll() {
  const [scrollY, setScrollY] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReduceMotion(mediaQuery.matches)

    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)

    return () => {
      mediaQuery.removeEventListener('change', updateMotionPreference)
    }
  }, [])

  useEffect(() => {
    const updateScroll = () => {
      frameRef.current = null
      setScrollY(window.scrollY)
    }

    const handleScroll = () => {
      if (frameRef.current !== null) {
        return
      }

      frameRef.current = window.requestAnimationFrame(updateScroll)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return (
    <main className="memory-editorial">
      <section className="memory-editorial__fixed" aria-labelledby="memory-title">
        <nav className="memory-editorial__nav" aria-label="Remory navigation">
          <a href="/" aria-label="Remory home">
            Remory
          </a>
          <div>
            <a href="#archive">Archive</a>
            <a href="#voice">Voice</a>
          </div>
        </nav>

        <p className="memory-editorial__intro">
          Remory is an AI memory archive that turns photographs into voice-based
          stories.
        </p>

        <div className="memory-editorial__title-wrap">
          <p>Photos become voices.</p>
          <h1 id="memory-title">
            Remory
            <span>Voice Archive</span>
          </h1>
        </div>

        <aside className="memory-editorial__meta" aria-label="Page progress">
          <span>{String(Math.min(Math.round(scrollY / 18), 99)).padStart(2, '0')}</span>
          <span>Scroll memories</span>
        </aside>

        <div className="memory-editorial__cta">
          <p>Keep a photo. Add a voice. Return to the moment.</p>
          <button type="button" aria-label="Start recording a memory with Remory">
            Start a memory
          </button>
        </div>
      </section>

      <section className="memory-editorial__scroll-space" aria-label="Floating memory gallery">
        <div className="memory-editorial__collage" aria-hidden={false}>
          {memoryGallery.map((item) => (
            <FloatingMemoryImage
              key={item.id}
              item={item}
              scrollY={scrollY}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </section>
    </main>
  )
}

export default MemoryEditorialScroll
