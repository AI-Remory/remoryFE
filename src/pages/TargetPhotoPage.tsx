import { useEffect, useState, type ChangeEvent } from 'react'
import { ArrowLeft, ImagePlus, RefreshCw, Upload } from 'lucide-react'
import { ApiError } from '../lib/apiClient'
import { fetchProtectedFileObjectUrl, revokeObjectUrl } from '../lib/protectedFile'
import { getActiveTargetId, storeActiveTargetId } from '../services/personaSession'
import { targetApi } from '../services/targetApi'
import type { ApiId, Target, TargetMedia } from '../types/api'
import './OperationsPage.css'

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof ApiError ? error.message : fallbackMessage
}

function getTargetIdFromSearch() {
  return new URLSearchParams(window.location.search).get('targetId')?.trim() || null
}

function isImageMedia(media: TargetMedia) {
  return String(media.media_type ?? '').toLowerCase() === 'image'
}

function getMediaFilePath(media: TargetMedia) {
  const fileApiUrl = media.file_api_url?.trim()

  if (fileApiUrl) {
    return fileApiUrl
  }

  if (media.target_id !== undefined && media.target_id !== null) {
    return `/api/v1/targets/${media.target_id}/media/${media.id}/file`
  }

  return ''
}

function TargetPhotoPage() {
  const [target, setTarget] = useState<Target | null>(null)
  const [mediaItems, setMediaItems] = useState<TargetMedia[]>([])
  const [mediaImageUrls, setMediaImageUrls] = useState<Record<string, string>>({})
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const targetName = target?.nickname ?? target?.name ?? '페르소나'

  const loadTargetMedia = async (targetId: ApiId) => {
    const media = await targetApi.listTargetMedia(targetId)
    const images = media.filter(isImageMedia)

    setMediaItems(images)
    return images
  }

  const resolveTarget = async () => {
    const requestedTargetId = getTargetIdFromSearch() ?? getActiveTargetId()

    if (requestedTargetId) {
      return targetApi.getTarget(requestedTargetId)
    }

    const response = await targetApi.listTargets()
    return response.items[0] ?? null
  }

  useEffect(() => {
    let ignore = false

    async function loadInitialData() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const nextTarget = await resolveTarget()

        if (!nextTarget) {
          throw new Error('사진을 추가할 페르소나를 찾지 못했습니다.')
        }

        const images = await targetApi.listTargetMedia(nextTarget.id).then((media) => media.filter(isImageMedia))

        if (!ignore) {
          setTarget(nextTarget)
          setMediaItems(images)
          storeActiveTargetId(nextTarget.id)
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getErrorMessage(error, '페르소나 사진 정보를 불러오지 못했습니다.'))
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const objectUrls: string[] = []

    if (mediaItems.length === 0) {
      return () => undefined
    }

    Promise.all(
      mediaItems.map(async (media) => {
        const filePath = getMediaFilePath(media)

        if (!filePath) {
          return null
        }

        try {
          const objectUrl = await fetchProtectedFileObjectUrl(filePath)

          if (ignore) {
            revokeObjectUrl(objectUrl)
            return null
          }

          objectUrls.push(objectUrl)

          return [String(media.id), objectUrl] as const
        } catch {
          return null
        }
      }),
    ).then((entries) => {
      if (!ignore) {
        setMediaImageUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)))
      }
    })

    return () => {
      ignore = true
      objectUrls.forEach(revokeObjectUrl)
    }
  }, [mediaItems])

  const handlePhotoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoFile(event.currentTarget.files?.[0] ?? null)
    event.currentTarget.value = ''
  }

  const handleUpload = async () => {
    if (isUploading) {
      return
    }

    if (!target) {
      setErrorMessage('사진을 추가할 페르소나를 먼저 선택해주세요.')
      return
    }

    if (!photoFile) {
      setErrorMessage('업로드할 사진 파일을 선택해주세요.')
      return
    }

    setIsUploading(true)
    setStatusMessage('')
    setErrorMessage('')

    try {
      await targetApi.uploadTargetMedia(target.id, 'image', photoFile)
      await loadTargetMedia(target.id)
      setPhotoFile(null)
      setStatusMessage(`${targetName}에게 사진을 추가했어요.`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '사진을 추가하지 못했습니다.'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <main className="ops-page">
      <section className="ops-page__container" aria-label="페르소나 사진 추가">
        <header className="ops-page__header">
          <button className="ops-page__back" type="button" onClick={() => window.location.assign('/home')}>
            <ArrowLeft size={17} /> 홈
          </button>
          <span className="ops-page__eyebrow">Photo Memory</span>
          <h1>사진으로 기억 추가</h1>
          <p>{targetName}에게 사진을 추가합니다.</p>
        </header>

        {statusMessage && <p className="ops-page__status">{statusMessage}</p>}
        {errorMessage && <p className="ops-page__error">{errorMessage}</p>}

        <section className="ops-page__grid">
          <div className="ops-page__panel">
            <h2>사진 업로드</h2>
            <div className="ops-page__form">
              <label>
                사진 파일
                <input type="file" accept="image/*" onChange={handlePhotoFileChange} disabled={isUploading} />
              </label>
              <p className="ops-page__helper">선택된 파일: {photoFile?.name ?? '없음'}</p>
              <div className="ops-page__button-row">
                <button className="ops-page__button" type="button" onClick={handleUpload} disabled={isUploading || isLoading}>
                  <Upload size={17} /> {isUploading ? '업로드 중...' : '사진 추가'}
                </button>
                <button
                  className="ops-page__button-secondary"
                  type="button"
                  onClick={() => target && void loadTargetMedia(target.id)}
                  disabled={!target || isLoading || isUploading}
                >
                  <RefreshCw size={17} /> 새로고침
                </button>
              </div>
            </div>
          </div>

          <div className="ops-page__panel">
            <h2>추가된 사진</h2>
            {isLoading ? (
              <p className="ops-page__empty">사진을 불러오는 중입니다.</p>
            ) : mediaItems.length > 0 ? (
              <div className="ops-page__thumbnail-grid">
                {mediaItems.map((media) => {
                  const imageUrl = mediaImageUrls[String(media.id)]

                  return (
                    <article className="ops-page__thumbnail" key={String(media.id)}>
                      {imageUrl ? <img src={imageUrl} alt="" /> : <ImagePlus size={28} />}
                      <small>{media.original_filename ?? `사진 #${media.id}`}</small>
                    </article>
                  )
                })}
              </div>
            ) : (
              <p className="ops-page__empty">
                <ImagePlus size={17} /> 아직 추가된 사진이 없습니다.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default TargetPhotoPage
