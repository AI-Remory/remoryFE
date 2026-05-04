import { useState } from 'react'
import type { ProfilePhoto } from '../data/mockProfilePhotos'

type SeasonalPhotoGridProps = {
  photos: ProfilePhoto[]
  season: string
}

function getPhotoDate(photo: ProfilePhoto) {
  return photo.takenAt ?? photo.createdAt ?? photo.uploadedAt ?? new Date().toISOString()
}

function formatPhotoDate(photo: ProfilePhoto) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(getPhotoDate(photo)))
}

function SeasonalPhotoGrid({ photos, season }: SeasonalPhotoGridProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  if (photos.length === 0) {
    return (
      <section className="season-empty" aria-live="polite">
        <p>No {season} memories yet.</p>
        <span>Upload a photo, add a voice, and save this season in Remory.</span>
      </section>
    )
  }

  return (
    <section className="season-photo-grid" aria-live="polite">
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          className={`season-photo-card season-photo-card--${(index % 6) + 1}`}
          aria-label={`Open ${photo.title} memory`}
        >
          <span className="season-photo-card__image">
            {!failedImages[photo.id] ? (
              <img
                src={photo.src}
                alt={photo.alt}
                onError={() =>
                  setFailedImages((current) => ({ ...current, [photo.id]: true }))
                }
              />
            ) : (
              <span role="img" aria-label={photo.alt} />
            )}
          </span>
          <span className="season-photo-card__meta">
            <span>
              <strong>{photo.title}</strong>
              <small>{formatPhotoDate(photo)}</small>
            </span>
            <span>{photo.hasVoice ? 'voice saved' : 'voice pending'}</span>
          </span>
          {photo.location ? (
            <span className="season-photo-card__location">{photo.location}</span>
          ) : null}
        </button>
      ))}
    </section>
  )
}

export default SeasonalPhotoGrid
