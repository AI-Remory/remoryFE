import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { MemoryGalleryItem } from '../data/memoryGallery'

type FloatingMemoryImageProps = {
  item: MemoryGalleryItem
  scrollY: number
  reduceMotion: boolean
}

function FloatingMemoryImage({
  item,
  scrollY,
  reduceMotion,
}: FloatingMemoryImageProps) {
  const [hasImageError, setHasImageError] = useState(false)
  const movement = reduceMotion ? 0 : scrollY * item.speed

  const style = {
    '--memory-width': item.width,
    '--memory-top': item.top,
    '--memory-left': item.left,
    '--memory-rotate': item.rotate,
    '--memory-tone': item.tone,
    transform: `translate3d(0, ${-movement}px, 0) rotate(${item.rotate})`,
  } as CSSProperties

  return (
    <figure className="floating-memory" style={style}>
      <div className="floating-memory__frame">
        {!hasImageError ? (
          <img
            src={item.src}
            alt={item.alt}
            loading="eager"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className="floating-memory__fallback" role="img" aria-label={item.alt} />
        )}
      </div>
      <figcaption>{item.title}</figcaption>
    </figure>
  )
}

export default FloatingMemoryImage
