import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { ApiError } from '../services/apiClient'
import { mediaService } from '../services/mediaService'
import { personaService } from '../services/personaService'
import { targetService } from '../services/targetService'
import type { MediaType, TargetMediaResponse } from '../types/media'
import type { PersonaDetailResponse, PersonaStatus, PersonaStatusResponse } from '../types/persona'
import type { TargetDetailResponse, TargetResponse, TargetType } from '../types/target'
import { toPlayableFileUrl } from '../utils/fileUrl'
import './DomainPages.css'

type BadgeKind = 'connected' | 'next' | 'mock' | 'admin'

type Metric = {
  label: string
  value: string
  tone?: string
}

type TimelineItem = {
  title: string
  description: string
  status: string
}

type DomainPageConfig = {
  title: string
  eyebrow: string
  description: string
  badge: string
  badgeKind: BadgeKind
  primaryAction?: string
  secondaryAction?: string
  metrics: Metric[]
  cards: TimelineItem[]
  detailTitle: string
  detailRows: Array<[string, string]>
}

const targetTypeOptions: TargetType[] = ['parent', 'grandparent', 'friend', 'romantic', 'self', 'other']

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Request failed.'
}

function isOwnerOnlyError(error: unknown) {
  return error instanceof ApiError && error.status === 403
}

function getTargetIdFromLocation() {
  const { pathname, search } = window.location
  const params = new URLSearchParams(search)
  const value = params.get('target_id') ?? params.get('id') ?? pathname.split('/').filter(Boolean).at(-1)
  const targetId = Number(value)

  return Number.isInteger(targetId) && targetId > 0 ? targetId : null
}

function getPersonaIdFromLocation() {
  const { pathname, search } = window.location
  const params = new URLSearchParams(search)
  const value = params.get('persona_id') ?? params.get('id') ?? pathname.split('/').filter(Boolean).at(-1)
  const personaId = Number(value)

  return Number.isInteger(personaId) && personaId > 0 ? personaId : null
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getPersonaStatusMessage(status: PersonaStatus) {
  switch (status) {
    case 'READY':
      return 'Persona is ready. Chat and voice call entry points are available.'
    case 'PENDING':
      return 'Persona generation is pending. Refresh status until it becomes READY.'
    case 'FAILED':
      return 'Persona generation failed. Check server error detail when creating again.'
    default:
      return 'Unknown persona status.'
  }
}

function PersonaStatusBadge({ status }: { status: PersonaStatus }) {
  return <span className={`persona-status-badge persona-status-badge--${status.toLowerCase()}`}>{status}</span>
}

function TargetImage({ target }: { target: TargetResponse }) {
  if (target.profile_image_path) {
    return <img alt={target.name} src={target.profile_image_path} />
  }

  return <span aria-hidden="true">{target.name.slice(0, 1).toUpperCase()}</span>
}

function TargetStateMessage({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: { href: string; label: string }
}) {
  return (
    <section className="target-api-state">
      <h2>{title}</h2>
      <p>{message}</p>
      {action && <a href={action.href}>{action.label}</a>}
    </section>
  )
}

function TargetListApiPage() {
  const [targets, setTargets] = useState<TargetResponse[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPermissionError, setIsPermissionError] = useState(false)

  useEffect(() => {
    let isMounted = true

    targetService
      .listTargets({ skip: 0, limit: 20 })
      .then((response) => {
        if (!isMounted) {
          return
        }

        setTargets(response.items)
        setTotal(response.total)
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return
        }

        setIsPermissionError(isOwnerOnlyError(error))
        setErrorMessage(getApiErrorMessage(error))
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <AppShell title="Targets" subtitle="Targets returned by GET /targets." badge="API connected">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">TargetListPage</span>
            <h1>Target list</h1>
            <p>Response fields are rendered as provided by TargetResponse.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">GET /targets</span>
        </header>

        {isLoading && <TargetStateMessage title="Loading targets" message="Fetching your Target list from the backend." />}

        {!isLoading && errorMessage && (
          <TargetStateMessage
            title={isPermissionError ? 'No permission' : 'Target list failed'}
            message={isPermissionError ? 'You do not have permission to access these targets.' : errorMessage}
          />
        )}

        {!isLoading && !errorMessage && targets.length === 0 && (
          <TargetStateMessage
            action={{ href: '/targets/new', label: 'Create target' }}
            title="No targets yet"
            message="Create your first Target to prepare media, consent, verification, and persona flows."
          />
        )}

        {!isLoading && !errorMessage && targets.length > 0 && (
          <>
            <section className="domain-page__metrics" aria-label="Target summary">
              <article>
                <span>total</span>
                <strong>{total}</strong>
              </article>
              <article>
                <span>loaded</span>
                <strong>{targets.length}</strong>
              </article>
              <article>
                <span>endpoint</span>
                <strong>GET</strong>
              </article>
            </section>

            <section className="target-card-grid" aria-label="Target cards">
              {targets.map((target) => (
                <article className="target-card" key={target.id}>
                  <div className="target-card__avatar">
                    <TargetImage target={target} />
                  </div>
                  <div className="target-card__body">
                    <div className="target-card__title-row">
                      <h2>{target.name}</h2>
                      <span>{target.target_type}</span>
                    </div>
                    {target.description && <p>{target.description}</p>}
                    <dl>
                      <div>
                        <dt>id</dt>
                        <dd>{target.id}</dd>
                      </div>
                      <div>
                        <dt>is_deleted</dt>
                        <dd>{String(target.is_deleted)}</dd>
                      </div>
                      <div>
                        <dt>updated_at</dt>
                        <dd>{formatDateTime(target.updated_at)}</dd>
                      </div>
                    </dl>
                    <a href={`/targets/detail?target_id=${target.id}`}>Open detail</a>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </main>
    </AppShell>
  )
}

function TargetCreateApiPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('other')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPermissionError, setIsPermissionError] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setIsPermissionError(false)
    setIsSubmitting(true)

    try {
      const createdTarget = await targetService.createTarget({
        name,
        description: description || null,
        target_type: targetType,
      })

      window.location.href = `/targets/detail?target_id=${createdTarget.id}`
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell title="Create Target" subtitle="Creates a Target with POST /targets." badge="API connected">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">TargetCreatePage</span>
            <h1>Create target</h1>
            <p>Request body follows TargetCreateRequest: name, description, target_type.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">POST /targets</span>
        </header>

        <form className="target-form" onSubmit={handleSubmit}>
          <div className="target-form__field">
            <label htmlFor="target-name">name</label>
            <input
              id="target-name"
              minLength={1}
              maxLength={255}
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
              value={name}
            />
            <p className="target-form__helper">Required. 1 to 255 characters.</p>
          </div>

          <div className="target-form__field">
            <label htmlFor="target-description">description</label>
            <textarea
              id="target-description"
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              value={description}
            />
            <p className="target-form__helper">Optional. Sent as null when empty.</p>
          </div>

          <div className="target-form__field">
            <label htmlFor="target-type">target_type</label>
            <select id="target-type" onChange={(event) => setTargetType(event.target.value as TargetType)} value={targetType}>
              {targetTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="target-form__helper">OpenAPI TargetType enum.</p>
          </div>

          {errorMessage && (
            <p className="target-form__error" role="alert">
              {isPermissionError ? 'You do not have permission to create this Target.' : errorMessage}
            </p>
          )}

          <div className="target-form__actions">
            <a href="/targets">Cancel</a>
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Creating...' : 'Create target'}
            </button>
          </div>
        </form>
      </main>
    </AppShell>
  )
}

function TargetDetailApiPage() {
  const [targetId] = useState(() => getTargetIdFromLocation())
  const [target, setTarget] = useState<TargetDetailResponse | null>(null)
  const [formValues, setFormValues] = useState({ name: '', description: '', target_type: 'other' as TargetType })
  const [isLoading, setIsLoading] = useState(() => Boolean(targetId))
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreatingPersona, setIsCreatingPersona] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(() => (targetId ? null : 'target_id is required.'))
  const [notice, setNotice] = useState<string | null>(null)
  const [isPermissionError, setIsPermissionError] = useState(false)

  useEffect(() => {
    if (!targetId) {
      return
    }

    let isMounted = true

    targetService
      .getTarget(targetId)
      .then((response) => {
        if (!isMounted) {
          return
        }

        setTarget(response)
        setFormValues({
          name: response.name,
          description: response.description ?? '',
          target_type: response.target_type,
        })
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return
        }

        setIsPermissionError(isOwnerOnlyError(error))
        setErrorMessage(getApiErrorMessage(error))
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [targetId])

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!targetId) {
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const updatedTarget = await targetService.updateTarget(targetId, {
        name: formValues.name,
        description: formValues.description || null,
        target_type: formValues.target_type,
      })

      setTarget((current) => (current ? { ...current, ...updatedTarget } : { ...updatedTarget }))
      setNotice('Target updated.')
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!targetId || !window.confirm('Delete this Target?')) {
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      await targetService.deleteTarget(targetId)
      window.location.href = '/targets'
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
      setIsDeleting(false)
    }
  }

  async function handleCreatePersona() {
    if (!targetId) {
      return
    }

    setIsCreatingPersona(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const persona = await personaService.createPersona(targetId)
      window.location.href = `/personas/detail?persona_id=${persona.id}`
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsCreatingPersona(false)
    }
  }

  return (
    <AppShell title="Target Detail" subtitle="Reads, updates, and deletes an owned Target." badge="API connected">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">TargetDetailPage</span>
            <h1>Target detail</h1>
            <p>Detail response uses TargetDetailResponse fields.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">GET PUT DELETE</span>
        </header>

        {isLoading && <TargetStateMessage title="Loading target" message="Fetching Target detail from the backend." />}

        {!isLoading && errorMessage && !target && (
          <TargetStateMessage
            action={{ href: '/targets', label: 'Back to list' }}
            title={isPermissionError ? 'No permission' : 'Target detail failed'}
            message={isPermissionError ? 'You do not have permission to access this Target.' : errorMessage}
          />
        )}

        {!isLoading && target && (
          <section className="target-detail-layout">
            <article className="target-detail-card">
              <div className="target-card__avatar">
                <TargetImage target={target} />
              </div>
              <h2>{target.name}</h2>
              {target.description && <p>{target.description}</p>}
              <dl>
                <div>
                  <dt>id</dt>
                  <dd>{target.id}</dd>
                </div>
                <div>
                  <dt>user_id</dt>
                  <dd>{target.user_id}</dd>
                </div>
                <div>
                  <dt>target_type</dt>
                  <dd>{target.target_type}</dd>
                </div>
                <div>
                  <dt>profile_image_path</dt>
                  <dd>{target.profile_image_path ?? 'null'}</dd>
                </div>
                <div>
                  <dt>is_deleted</dt>
                  <dd>{String(target.is_deleted)}</dd>
                </div>
                {target.media_count !== undefined && (
                  <div>
                    <dt>media_count</dt>
                    <dd>{target.media_count}</dd>
                  </div>
                )}
                {target.has_persona !== undefined && (
                  <div>
                    <dt>has_persona</dt>
                    <dd>{String(target.has_persona)}</dd>
                  </div>
                )}
                <div>
                  <dt>created_at</dt>
                  <dd>{formatDateTime(target.created_at)}</dd>
                </div>
                <div>
                  <dt>updated_at</dt>
                  <dd>{formatDateTime(target.updated_at)}</dd>
                </div>
              </dl>
            </article>

            <form className="target-form" onSubmit={handleUpdate}>
              <div className="target-form__field">
                <label htmlFor="detail-target-name">name</label>
                <input
                  id="detail-target-name"
                  onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
                  required
                  type="text"
                  value={formValues.name}
                />
              </div>

              <div className="target-form__field">
                <label htmlFor="detail-target-description">description</label>
                <textarea
                  id="detail-target-description"
                  onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
                  rows={5}
                  value={formValues.description}
                />
              </div>

              <div className="target-form__field">
                <label htmlFor="detail-target-type">target_type</label>
                <select
                  id="detail-target-type"
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, target_type: event.target.value as TargetType }))
                  }
                  value={formValues.target_type}
                >
                  {targetTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {notice && <p className="target-form__notice">{notice}</p>}
              {errorMessage && (
                <p className="target-form__error" role="alert">
                  {isPermissionError ? 'You do not have permission to change this Target.' : errorMessage}
                </p>
              )}

              <div className="target-form__actions">
                <a href="/targets">Back to list</a>
                <button disabled={isSaving} type="submit">
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
                <button disabled={isDeleting} onClick={handleDelete} type="button">
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button disabled={isCreatingPersona} onClick={handleCreatePersona} type="button">
                  {isCreatingPersona ? 'Creating persona...' : 'Create persona'}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </AppShell>
  )
}

function MediaPreview({ media }: { media: TargetMediaResponse }) {
  const fileUrl = toPlayableFileUrl(media.file_path)

  if (media.media_type === 'image') {
    return <img alt={media.original_filename} src={fileUrl} />
  }

  return <audio controls preload="metadata" src={fileUrl} />
}

function TargetMediaApiPage() {
  const [initialTargetId] = useState(() => getTargetIdFromLocation())
  const [targetIdInput, setTargetIdInput] = useState(() => (initialTargetId ? String(initialTargetId) : ''))
  const [activeTargetId, setActiveTargetId] = useState<number | null>(null)
  const [mediaItems, setMediaItems] = useState<TargetMediaResponse[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingMediaType, setUploadingMediaType] = useState<MediaType | null>(null)
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isPermissionError, setIsPermissionError] = useState(false)

  const loadMedia = useCallback(async (targetId: number) => {
    setIsLoading(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const response = await mediaService.listTargetMedia(targetId)
      setMediaItems(response)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialTargetId) {
      return
    }

    const timerId = window.setTimeout(() => {
      setActiveTargetId(initialTargetId)
      void loadMedia(initialTargetId)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [initialTargetId, loadMedia])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  useEffect(() => {
    return () => {
      if (voicePreviewUrl) {
        URL.revokeObjectURL(voicePreviewUrl)
      }
    }
  }, [voicePreviewUrl])

  function setPreviewFile(file: File | null, mediaType: MediaType) {
    const setPreviewUrl = mediaType === 'image' ? setImagePreviewUrl : setVoicePreviewUrl

    if (!file) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  function handleImageFileChange(file: File | null) {
    setImageFile(file)
    setPreviewFile(file, 'image')
  }

  function handleVoiceFileChange(file: File | null) {
    setVoiceFile(file)
    setPreviewFile(file, 'voice')
  }

  function handleTargetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedTargetId = Number(targetIdInput)

    if (!Number.isInteger(parsedTargetId) || parsedTargetId <= 0) {
      setErrorMessage('target_id must be a positive integer.')
      return
    }

    setActiveTargetId(parsedTargetId)
    void loadMedia(parsedTargetId)
  }

  async function handleUpload(mediaType: MediaType) {
    if (!activeTargetId) {
      setErrorMessage('target_id is required before upload.')
      return
    }

    const file = mediaType === 'image' ? imageFile : voiceFile

    if (!file) {
      setErrorMessage(`${mediaType} file is required.`)
      return
    }

    setUploadingMediaType(mediaType)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const response = await mediaService.uploadTargetMedia(activeTargetId, mediaType, file)
      setNotice(response.message ?? 'File uploaded successfully.')
      if (mediaType === 'image') {
        handleImageFileChange(null)
      } else {
        handleVoiceFileChange(null)
      }
      await loadMedia(activeTargetId)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setUploadingMediaType(null)
    }
  }

  async function handleDelete(mediaId: number) {
    if (!activeTargetId || !window.confirm('Delete this media file?')) {
      return
    }

    setDeletingMediaId(mediaId)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const response = await mediaService.deleteMedia(mediaId)
      setNotice(response.message ?? 'Media deleted successfully.')
      await loadMedia(activeTargetId)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setDeletingMediaId(null)
    }
  }

  return (
    <AppShell title="Target Media" subtitle="Uploads and lists target media with real multipart APIs." badge="API connected">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">TargetMediaPage</span>
            <h1>Target media</h1>
            <p>Uses media_type and file multipart fields from OpenAPI.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">GET POST DELETE</span>
        </header>

        <form className="target-form target-media-target-form" onSubmit={handleTargetSubmit}>
          <div className="target-form__field">
            <label htmlFor="media-target-id">target_id</label>
            <input
              id="media-target-id"
              inputMode="numeric"
              onChange={(event) => setTargetIdInput(event.target.value)}
              required
              type="number"
              value={targetIdInput}
            />
            <p className="target-form__helper">Path param for /targets/{'{target_id}'}/media.</p>
          </div>
          <div className="target-form__actions">
            <a href="/targets">Open target list</a>
            <button type="submit">Load media</button>
          </div>
        </form>

        {activeTargetId && (
          <section className="target-media-upload-grid" aria-label="Media upload">
            <article className="target-media-upload-card">
              <h2>Photo upload</h2>
              <div className="target-form__field">
                <label htmlFor="target-image-file">file</label>
                <input
                  accept="image/*"
                  id="target-image-file"
                  onChange={(event) => handleImageFileChange(event.target.files?.[0] ?? null)}
                  type="file"
                />
                <p className="target-form__helper">Sent with media_type=image.</p>
              </div>
              {imagePreviewUrl && (
                <div className="target-media-local-preview">
                  <img alt={imageFile?.name ?? 'Selected image preview'} src={imagePreviewUrl} />
                </div>
              )}
              <button disabled={uploadingMediaType === 'image'} onClick={() => void handleUpload('image')} type="button">
                {uploadingMediaType === 'image' ? 'Uploading...' : 'Upload photo'}
              </button>
            </article>

            <article className="target-media-upload-card">
              <h2>Voice upload</h2>
              <div className="target-form__field">
                <label htmlFor="target-voice-file">file</label>
                <input
                  accept="audio/*"
                  id="target-voice-file"
                  onChange={(event) => handleVoiceFileChange(event.target.files?.[0] ?? null)}
                  type="file"
                />
                <p className="target-form__helper">Sent with media_type=voice.</p>
              </div>
              {voicePreviewUrl && (
                <div className="target-media-local-audio">
                  <audio controls preload="metadata" src={voicePreviewUrl} />
                </div>
              )}
              <button disabled={uploadingMediaType === 'voice'} onClick={() => void handleUpload('voice')} type="button">
                {uploadingMediaType === 'voice' ? 'Uploading...' : 'Upload voice'}
              </button>
            </article>
          </section>
        )}

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && (
          <p className="target-form__error" role="alert">
            {isPermissionError ? 'You do not have permission to access this target media.' : errorMessage}
          </p>
        )}

        {isLoading && <TargetStateMessage title="Loading media" message="Fetching media files for this target." />}

        {!isLoading && activeTargetId && !errorMessage && mediaItems.length === 0 && (
          <TargetStateMessage
            title="No media yet"
            message="Upload a photo or voice file to attach media to this Target."
          />
        )}

        {!isLoading && mediaItems.length > 0 && (
          <section className="target-media-grid" aria-label="Target media list">
            {mediaItems.map((media) => (
              <article className="target-media-card" key={media.id}>
                <div className="target-media-card__preview">
                  <MediaPreview media={media} />
                </div>
                <div className="target-media-card__body">
                  <div className="target-card__title-row">
                    <h2>{media.original_filename}</h2>
                    <span>{media.media_type}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>id</dt>
                      <dd>{media.id}</dd>
                    </div>
                    <div>
                      <dt>mime_type</dt>
                      <dd>{media.mime_type}</dd>
                    </div>
                    <div>
                      <dt>file_size</dt>
                      <dd>{formatFileSize(media.file_size)}</dd>
                    </div>
                    <div>
                      <dt>duration_seconds</dt>
                      <dd>{media.duration_seconds ?? 'null'}</dd>
                    </div>
                    <div>
                      <dt>file_path</dt>
                      <dd>{media.file_path}</dd>
                    </div>
                    <div>
                      <dt>is_deleted</dt>
                      <dd>{String(media.is_deleted)}</dd>
                    </div>
                    <div>
                      <dt>created_at</dt>
                      <dd>{formatDateTime(media.created_at)}</dd>
                    </div>
                  </dl>
                  <button disabled={deletingMediaId === media.id} onClick={() => void handleDelete(media.id)} type="button">
                    {deletingMediaId === media.id ? 'Deleting...' : 'Delete media'}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </AppShell>
  )
}

function PersonaDetailCard({
  persona,
  status,
  onRefreshStatus,
  isRefreshingStatus,
}: {
  persona: PersonaDetailResponse
  status?: PersonaStatusResponse | null
  onRefreshStatus?: () => void
  isRefreshingStatus?: boolean
}) {
  const currentStatus = status?.status ?? persona.status
  const isReady = currentStatus === 'READY'

  return (
    <section className="persona-detail-layout">
      <article className="persona-summary-card">
        <div className="target-card__title-row">
          <h2>{persona.persona_name ?? `Persona ${persona.id}`}</h2>
          <PersonaStatusBadge status={currentStatus} />
        </div>
        <p>{getPersonaStatusMessage(currentStatus)}</p>
        <dl>
          <div>
            <dt>id</dt>
            <dd>{persona.id}</dd>
          </div>
          <div>
            <dt>target_id</dt>
            <dd>{persona.target_id}</dd>
          </div>
          <div>
            <dt>persona_name</dt>
            <dd>{persona.persona_name ?? 'null'}</dd>
          </div>
          <div>
            <dt>speaking_style</dt>
            <dd>{persona.speaking_style ?? 'null'}</dd>
          </div>
          <div>
            <dt>personality_summary</dt>
            <dd>{persona.personality_summary ?? 'null'}</dd>
          </div>
          <div>
            <dt>memory_summary</dt>
            <dd>{persona.memory_summary ?? 'null'}</dd>
          </div>
          <div>
            <dt>system_prompt</dt>
            <dd>{persona.system_prompt ?? 'null'}</dd>
          </div>
          <div>
            <dt>is_voice_profile_created</dt>
            <dd>{String(persona.is_voice_profile_created)}</dd>
          </div>
          <div>
            <dt>is_consent_required</dt>
            <dd>{String(persona.is_consent_required)}</dd>
          </div>
          <div>
            <dt>created_at</dt>
            <dd>{formatDateTime(persona.created_at)}</dd>
          </div>
          <div>
            <dt>updated_at</dt>
            <dd>{formatDateTime(persona.updated_at)}</dd>
          </div>
        </dl>
      </article>

      <aside className="persona-action-card">
        <h2>Actions</h2>
        <p>{isReady ? 'READY status enables chat and voice call routes.' : 'Chat and voice call are disabled until status is READY.'}</p>
        <div className="persona-action-card__actions">
          <a aria-disabled={!isReady} href={isReady ? `/persona-chat?persona_id=${persona.id}` : undefined}>
            Open chat
          </a>
          <a aria-disabled={!isReady} href={isReady ? `/persona-voice-call?persona_id=${persona.id}` : undefined}>
            Voice call
          </a>
          {onRefreshStatus && (
            <button disabled={isRefreshingStatus} onClick={onRefreshStatus} type="button">
              {isRefreshingStatus ? 'Refreshing...' : 'Refresh status'}
            </button>
          )}
        </div>

        {persona.voice_profile && (
          <dl>
            <div>
              <dt>voice_profile.id</dt>
              <dd>{persona.voice_profile.id}</dd>
            </div>
            <div>
              <dt>voice_profile.status</dt>
              <dd>{persona.voice_profile.status ?? 'null'}</dd>
            </div>
            <div>
              <dt>review_status</dt>
              <dd>{persona.voice_profile.review_status ?? 'null'}</dd>
            </div>
            <div>
              <dt>quality_score</dt>
              <dd>{persona.voice_profile.quality_score ?? 'null'}</dd>
            </div>
          </dl>
        )}
      </aside>
    </section>
  )
}

function PersonaListApiPage() {
  const [targetIdInput, setTargetIdInput] = useState(() => {
    const targetId = getTargetIdFromLocation()
    return targetId ? String(targetId) : ''
  })
  const [persona, setPersona] = useState<PersonaDetailResponse | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPermissionError, setIsPermissionError] = useState(false)

  async function handleCreatePersona(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetId = Number(targetIdInput)

    if (!Number.isInteger(targetId) || targetId <= 0) {
      setErrorMessage('target_id must be a positive integer.')
      return
    }

    setIsCreating(true)
    setErrorMessage(null)
    setIsPermissionError(false)

    try {
      const response = await personaService.createPersona(targetId)
      setPersona(response)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AppShell title="Personas" subtitle="Persona list endpoint is not present in OpenAPI; creation uses Target." badge="API connected">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">PersonaListPage</span>
            <h1>Persona creation</h1>
            <p>No Persona list endpoint exists in the checked OpenAPI. Use target_id to create a Persona.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">POST /targets/{'{target_id}'}/persona</span>
        </header>

        <form className="target-form target-media-target-form" onSubmit={handleCreatePersona}>
          <div className="target-form__field">
            <label htmlFor="persona-target-id">target_id</label>
            <input
              id="persona-target-id"
              inputMode="numeric"
              onChange={(event) => setTargetIdInput(event.target.value)}
              required
              type="number"
              value={targetIdInput}
            />
            <p className="target-form__helper">The backend validates verification, consent, media, and ownership conditions.</p>
          </div>
          <div className="target-form__actions">
            <a href="/targets">Open targets</a>
            <button disabled={isCreating} type="submit">
              {isCreating ? 'Creating...' : 'Create persona'}
            </button>
          </div>
        </form>

        {errorMessage && (
          <p className="target-form__error" role="alert">
            {isPermissionError ? 'You do not have permission to create a Persona for this Target.' : errorMessage}
          </p>
        )}

        {!persona && !errorMessage && (
          <TargetStateMessage
            title="No list API"
            message="OpenAPI exposes create, detail, and status endpoints for Persona, but no Persona collection endpoint."
          />
        )}

        {persona && <PersonaDetailCard persona={persona} />}
      </main>
    </AppShell>
  )
}

function PersonaDetailApiPage() {
  const [personaId] = useState(() => getPersonaIdFromLocation())
  const [persona, setPersona] = useState<PersonaDetailResponse | null>(null)
  const [status, setStatus] = useState<PersonaStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(personaId))
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(() => (personaId ? null : 'persona_id is required.'))
  const [isPermissionError, setIsPermissionError] = useState(false)

  const refreshStatus = useCallback(async () => {
    if (!personaId) {
      return
    }

    setIsRefreshingStatus(true)
    setErrorMessage(null)
    setIsPermissionError(false)

    try {
      const response = await personaService.getPersonaStatus(personaId)
      setStatus(response)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsRefreshingStatus(false)
    }
  }, [personaId])

  useEffect(() => {
    if (!personaId) {
      return
    }

    let isMounted = true

    personaService
      .getPersona(personaId)
      .then((response) => {
        if (!isMounted) {
          return
        }

        setPersona(response)
        setStatus({ persona_id: response.id, target_id: response.target_id, status: response.status })
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return
        }

        setIsPermissionError(isOwnerOnlyError(error))
        setErrorMessage(getApiErrorMessage(error))
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [personaId])

  return (
    <AppShell title="Persona Detail" subtitle="Reads Persona detail and status from real backend APIs." badge="API connected">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">PersonaDetailPage</span>
            <h1>Persona detail</h1>
            <p>Response fields follow PersonaDetailResponse and PersonaStatusResponse.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">GET /personas/{'{persona_id}'}</span>
        </header>

        {isLoading && <TargetStateMessage title="Loading persona" message="Fetching Persona detail from the backend." />}

        {!isLoading && errorMessage && !persona && (
          <TargetStateMessage
            action={{ href: '/personas', label: 'Back to Persona creation' }}
            title={isPermissionError ? 'No permission' : 'Persona detail failed'}
            message={isPermissionError ? 'You do not have permission to access this Persona.' : errorMessage}
          />
        )}

        {errorMessage && persona && (
          <p className="target-form__error" role="alert">
            {isPermissionError ? 'You do not have permission to refresh this Persona status.' : errorMessage}
          </p>
        )}

        {!isLoading && persona && (
          <PersonaDetailCard
            isRefreshingStatus={isRefreshingStatus}
            onRefreshStatus={() => void refreshStatus()}
            persona={persona}
            status={status}
          />
        )}
      </main>
    </AppShell>
  )
}

const priorityBadge = {
  connected: 'API 연결됨',
  next: 'API 연결 예정',
  mock: 'Mock',
  admin: 'ADMIN',
} satisfies Record<BadgeKind, string>

const baseCards = {
  target: [
    { title: '엄마 프로필', description: 'target_type parent, media 12개, persona READY', status: 'READY' },
    { title: '할머니 프로필', description: '검증 요청 PENDING, 사진 8개 업로드', status: 'PENDING' },
    { title: '내 기록', description: 'self 타입 target, 자기 회고용 persona 준비 중', status: 'DRAFT' },
  ],
  persona: [
    { title: '따뜻한 말투', description: 'speaking_style과 memory_summary 기반 응답 구성', status: 'READY' },
    { title: '목소리 프로필', description: 'voice sample 품질 평가 후 사용자 확인 대기', status: 'NEEDS_MORE_SAMPLES' },
    { title: '동의 확인', description: 'AI persona creation consent 필요', status: 'REQUIRED' },
  ],
  story: [
    { title: '제주 여행의 밤', description: 'PHOTO_MEMORY 기반 4개 챕터 생성', status: 'GENERATED' },
    { title: '어릴 적 생일', description: 'SELF_STORY 초안 작성 중', status: 'DRAFT' },
    { title: '공유 링크', description: 'LINK 공개 범위, 만료일 설정 가능', status: 'ACTIVE' },
  ],
  admin: [
    { title: '검증 요청 18건', description: '신분증, 가족관계 증명서, 자기 선언 검토', status: 'REVIEW' },
    { title: '신고 5건', description: '음성 도용, 개인정보 침해, 유해 콘텐츠', status: 'PENDING' },
    { title: '감사 로그', description: 'USER_SIGNUP, PERSONA_CREATED, REPORT_CREATED', status: 'LIVE' },
  ],
}

function makeConfig(partial: Partial<DomainPageConfig> & Pick<DomainPageConfig, 'title' | 'eyebrow'>): DomainPageConfig {
  return {
    description: '백엔드 명세 기준으로 화면 구조를 먼저 준비했습니다. 실제 연결 전까지는 mock data로 사용자 흐름을 확인합니다.',
    badge: priorityBadge.mock,
    badgeKind: 'mock',
    primaryAction: '새 항목',
    secondaryAction: '목록 보기',
    metrics: [
      { label: '상태', value: 'Mock' },
      { label: '우선순위', value: '5순위' },
      { label: '데이터', value: '샘플' },
    ],
    cards: baseCards.target,
    detailTitle: 'API 연결 계획',
    detailRows: [
      ['Endpoint', 'docs/frontend-api-map.md 기준 확인 후 연결'],
      ['Service layer', '페이지 직접 fetch 없이 src/services 사용'],
      ['Response', 'OpenAPI schema 필드명 그대로 사용'],
    ],
    ...partial,
  }
}

const configs = {
  targetList: makeConfig({
    title: 'Target 목록',
    eyebrow: 'TargetListPage',
    description: '내가 소유한 기억 대상 목록을 확인하고 persona 생성 흐름으로 진입합니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    primaryAction: 'Target 만들기',
    secondaryAction: '상세 보기',
    metrics: [
      { label: 'Targets', value: '3' },
      { label: 'Persona ready', value: '1' },
      { label: 'Media', value: '20' },
    ],
    cards: baseCards.target,
    detailTitle: '연결 대상 API',
    detailRows: [
      ['GET', '/targets'],
      ['POST', '/targets'],
      ['GET', '/targets/{target_id}'],
    ],
  }),
  targetCreate: makeConfig({
    title: 'Target 생성',
    eyebrow: 'TargetCreatePage',
    description: '이름, 설명, target_type을 입력해 새 기억 대상을 만드는 화면입니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    cards: [
      { title: 'name', description: '예: 엄마, 할머니, 나', status: 'required' },
      { title: 'description', description: '대상의 성격과 기억 범위를 짧게 기록', status: 'optional' },
      { title: 'target_type', description: 'parent, grandparent, friend, romantic, self, other', status: 'default other' },
    ],
    detailTitle: 'Request body',
    detailRows: [
      ['Schema', 'TargetCreateRequest'],
      ['Fields', 'name*, description, target_type'],
      ['Response', '201 TargetResponse'],
    ],
  }),
  targetDetail: makeConfig({
    title: 'Target 상세',
    eyebrow: 'TargetDetailPage',
    description: '대상 정보, media count, persona 생성 여부, 검증 상태를 한 화면에서 봅니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    cards: baseCards.target,
    detailRows: [
      ['GET', '/targets/{target_id}'],
      ['PUT', '/targets/{target_id}'],
      ['DELETE', '/targets/{target_id}'],
    ],
  }),
  targetMedia: makeConfig({
    title: 'Target Media',
    eyebrow: 'TargetMediaPage',
    description: '사진과 음성 샘플 업로드, 삭제, 목록 확인을 담당합니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    metrics: [
      { label: 'Images', value: '14' },
      { label: 'Voice', value: '6' },
      { label: 'Total size', value: '84MB' },
    ],
    cards: [
      { title: '봄날 사진', description: 'media_type image, original_filename spring.jpg', status: 'image' },
      { title: '인사 음성', description: 'media_type voice, duration_seconds 18', status: 'voice' },
      { title: '가족 앨범', description: 'profile_image_path 후보 이미지', status: 'image' },
    ],
    detailRows: [
      ['POST', '/targets/{target_id}/media multipart'],
      ['GET', '/targets/{target_id}/media'],
      ['DELETE', '/media/{media_id}'],
    ],
  }),
  consent: makeConfig({
    title: 'Consent Log',
    eyebrow: 'ConsentPage',
    description: '동의 생성, 대상별 동의 목록, 동의 철회 흐름을 표시합니다.',
    cards: [
      { title: 'AI persona creation', description: 'ai_persona_creation_consent v1.0', status: 'AGREED' },
      { title: 'Voice cloning', description: 'voice_cloning_consent, revoked_at 없음', status: 'AGREED' },
      { title: 'Group share', description: 'group_share_consent 검토 필요', status: 'PENDING' },
    ],
    detailRows: [
      ['POST', '/consents'],
      ['GET', '/consents'],
      ['PATCH', '/consents/{consent_id}/revoke'],
    ],
  }),
  verification: makeConfig({
    title: 'Target Verification',
    eyebrow: 'TargetVerificationPage',
    description: '검증 문서 제출과 검토 상태를 사용자에게 보여줍니다.',
    cards: [
      { title: '가족관계 증명서', description: 'FAMILY_RELATION_CERTIFICATE 업로드 완료', status: 'PENDING' },
      { title: '자기 선언', description: 'SELF_DECLARATION applicant_note 확인', status: 'NEED_MORE_INFO' },
      { title: '신분증', description: 'ID_CARD 검토 완료', status: 'APPROVED' },
    ],
    detailRows: [
      ['POST', '/targets/{target_id}/verification-requests multipart'],
      ['GET', '/targets/{target_id}/verification-requests'],
      ['GET', '/verification-requests/{request_id}'],
    ],
  }),
  personaList: makeConfig({
    title: 'Persona 목록',
    eyebrow: 'PersonaListPage',
    description: 'Target에서 생성된 persona의 준비 상태와 대화 진입점을 보여줍니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    cards: baseCards.persona,
    detailRows: [
      ['POST', '/targets/{target_id}/persona'],
      ['GET', '/personas/{persona_id}'],
      ['GET', '/personas/{persona_id}/status'],
    ],
  }),
  personaDetail: makeConfig({
    title: 'Persona 상세',
    eyebrow: 'PersonaDetailPage',
    description: '말투, 성격 요약, 기억 요약, system_prompt 상태를 점검합니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    cards: baseCards.persona,
    detailRows: [
      ['Schema', 'PersonaDetailResponse'],
      ['Status', 'PENDING, READY, FAILED'],
      ['Voice', 'voice_profile 포함 가능'],
    ],
  }),
  voiceProfile: makeConfig({
    title: 'Voice Profile',
    eyebrow: 'PersonaVoiceProfilePage',
    description: '음성 프로필 생성, 평가, 사용자 확인 상태를 관리합니다.',
    cards: [
      { title: 'Reference samples', description: 'reference_audio_count 6, total 74초', status: 'READY' },
      { title: 'Quality score', description: 'quality_score 0.82, noise_score 0.11', status: 'PASS' },
      { title: 'Review', description: 'review_status USER_CONFIRMED 대기', status: 'WAITING' },
    ],
    detailRows: [
      ['POST', '/personas/{persona_id}/voice-profile'],
      ['POST', '/personas/{persona_id}/voice-profile/evaluate'],
      ['PATCH', '/personas/{persona_id}/voice-profile/user-confirm'],
    ],
  }),
  personaChat: makeConfig({
    title: 'Persona Chat',
    eyebrow: 'PersonaChatPage',
    description: '채팅방 목록과 메시지 대화 흐름을 담당합니다.',
    badge: 'API 연결 예정 · 3순위',
    badgeKind: 'next',
    cards: [
      { title: '오늘의 안부', description: 'PersonaChatResponse title 오늘의 안부', status: 'OPEN' },
      { title: '사용자 메시지', description: 'message_type TEXT, sender_type USER', status: 'SENT' },
      { title: 'Persona 응답', description: 'PersonaMessagePairResponse persona_message', status: 'AI' },
    ],
    detailRows: [
      ['POST', '/personas/{persona_id}/chats'],
      ['GET', '/personas/{persona_id}/chats'],
      ['POST', '/chats/{chat_id}/messages'],
    ],
  }),
  voiceCall: makeConfig({
    title: 'Persona Voice Call',
    eyebrow: 'PersonaVoiceCallPage',
    description: 'WebSocket 음성 통화 세션, transcript, persona audio를 다룹니다.',
    badge: 'WebSocket 연결 예정 · 4순위',
    badgeKind: 'next',
    cards: [
      { title: 'session_started', description: 'voice call session id 수신', status: 'WS' },
      { title: 'final_transcript', description: '사용자 발화 STT 결과 표시', status: 'STT' },
      { title: 'persona_audio', description: 'audio_url 재생과 persona_text 표시', status: 'TTS' },
    ],
    detailRows: [
      ['WS', '/ws/personas/{persona_id}/voice?token=<access_token>'],
      ['Client', 'start, audio_chunk, end_utterance, stop'],
      ['Server', 'session_started, final_transcript, persona_text, persona_audio, session_ended, error'],
    ],
  }),
  interviewList: makeConfig({
    title: 'AI Interview',
    eyebrow: 'InterviewListPage',
    cards: [
      { title: '엄마의 어린 시절', description: 'TARGET_PROFILE interview in progress', status: 'IN_PROGRESS' },
      { title: '사진 속 기억', description: 'PHOTO_MEMORY 질문 6개 완료', status: 'COMPLETED' },
      { title: '나의 이야기', description: 'SELF_STORY draft session', status: 'DRAFT' },
    ],
    detailRows: [
      ['POST', '/interviews'],
      ['GET', '/interviews/{session_id}'],
      ['POST', '/interviews/{session_id}/questions'],
    ],
  }),
  interviewSession: makeConfig({
    title: 'Interview Session',
    eyebrow: 'InterviewSessionPage',
    description: '질문 생성과 답변 저장 흐름을 한 세션 안에서 구성합니다.',
    cards: [
      { title: '질문 1', description: '가장 선명한 어린 시절 기억은 무엇인가요?', status: 'ANSWERED' },
      { title: '질문 2', description: '그때 곁에 있던 사람은 누구였나요?', status: 'CURRENT' },
      { title: '답변', description: 'answer_text 또는 answer_audio_path 저장', status: 'READY' },
    ],
    detailRows: [
      ['Question', 'AIInterviewQuestionCreateRequest 또는 null'],
      ['Answer', 'question_id*, answer_text, answer_audio_path'],
      ['Response', 'AIInterviewSessionDetailResponse'],
    ],
  }),
  photoList: makeConfig({
    title: 'Photo Memories',
    eyebrow: 'PhotoMemoryListPage',
    cards: [
      { title: '제주 바닷가', description: 'location 제주, emotion_keywords 평온함', status: 'PHOTO' },
      { title: '생일 케이크', description: 'ai_caption 생성 예정', status: 'PHOTO' },
      { title: '졸업식', description: 'storybook source 후보', status: 'PHOTO' },
    ],
    detailRows: [
      ['GET', '/photo-memories'],
      ['GET', '/photo-memories/{photo_memory_id}'],
      ['DELETE', '/photo-memories/{photo_memory_id}'],
    ],
  }),
  photoUpload: makeConfig({
    title: 'Photo Upload',
    eyebrow: 'PhotoMemoryUploadPage',
    description: '사진 파일과 제목, 설명, 촬영일, 장소를 업로드합니다.',
    cards: [
      { title: 'title', description: '사진 기억 제목 required', status: 'required' },
      { title: 'file', description: 'multipart/form-data file required', status: 'required' },
      { title: 'metadata', description: 'description, taken_at, location optional', status: 'optional' },
    ],
    detailRows: [
      ['POST', '/photo-memories multipart'],
      ['Form', 'title*, description, taken_at, location, file*'],
      ['Response', '201 PhotoMemoryResponse'],
    ],
  }),
  storyList: makeConfig({
    title: 'Storybooks',
    eyebrow: 'StorybookListPage',
    cards: baseCards.story,
    detailRows: [
      ['GET', '/storybooks'],
      ['GET', '/storybooks/{storybook_id}'],
      ['POST', '/storybooks/{storybook_id}/regenerate'],
    ],
  }),
  storyDetail: makeConfig({
    title: 'Storybook Detail',
    eyebrow: 'StorybookDetailPage',
    description: '스토리북 요약, 공개 범위, 챕터 목록을 보여줍니다.',
    cards: [
      { title: 'Chapter 1', description: '낡은 사진첩을 꺼내던 오후', status: '1' },
      { title: 'Chapter 2', description: '서로의 이름을 다시 부르던 시간', status: '2' },
      { title: 'Chapter 3', description: '남겨진 목소리와 새로운 대화', status: '3' },
    ],
    detailRows: [
      ['GET', '/storybooks/{storybook_id}'],
      ['GET', '/storybooks/{storybook_id}/chapters'],
      ['Schema', 'StoryBookDetailResponse'],
    ],
  }),
  storyCreate: makeConfig({
    title: 'Storybook Create',
    eyebrow: 'StorybookCreatePage',
    description: '인터뷰 또는 사진 기억을 바탕으로 새 스토리북을 생성합니다.',
    cards: [
      { title: 'title', description: '스토리북 제목 required', status: 'required' },
      { title: 'source', description: 'interview_session_id 또는 photo_memory_id', status: 'optional' },
      { title: 'visibility', description: 'PRIVATE, LINK, GROUP, PUBLIC', status: 'default PRIVATE' },
    ],
    detailRows: [
      ['POST', '/storybooks'],
      ['Request', 'StoryBookCreateRequest'],
      ['Response', '201 StoryBookDetailResponse'],
    ],
  }),
  storyShare: makeConfig({
    title: 'Storybook Share',
    eyebrow: 'StorybookSharePage',
    description: '공유 링크 생성, 목록, 비활성화, 공개 조회 흐름을 담습니다.',
    cards: [
      { title: '가족 공유 링크', description: 'expires_at 2026-06-01', status: 'ACTIVE' },
      { title: '공개 미리보기', description: 'PublicSharedStoryBookResponse', status: 'PUBLIC' },
      { title: '비활성 링크', description: 'disabled_at 기록됨', status: 'DISABLED' },
    ],
    detailRows: [
      ['POST', '/storybooks/{storybook_id}/share-links'],
      ['GET', '/share/{token}'],
      ['PATCH', '/share-links/{share_link_id}/disable'],
    ],
  }),
  groupList: makeConfig({
    title: 'Memory Groups',
    eyebrow: 'MemoryGroupListPage',
    cards: [
      { title: '우리 가족', description: 'OWNER 1명, MEMBER 4명', status: 'OWNER' },
      { title: '추모 모임', description: 'VIEWER 포함 공유 그룹', status: 'MEMBER' },
      { title: '사진 정리팀', description: 'storybook 8권 공유', status: 'GROUP' },
    ],
    detailRows: [
      ['GET', '/groups'],
      ['POST', '/groups'],
      ['GET', '/groups/{group_id}'],
    ],
  }),
  groupDetail: makeConfig({
    title: 'Memory Group Detail',
    eyebrow: 'MemoryGroupDetailPage',
    cards: [
      { title: '멤버', description: 'GroupMemberResponse role OWNER/MEMBER/VIEWER', status: '4' },
      { title: '공유 스토리북', description: 'GroupStoryBookListItemResponse', status: '8' },
      { title: '권한', description: 'owner/member 권한 구조', status: 'ACL' },
    ],
    detailRows: [
      ['POST', '/groups/{group_id}/members'],
      ['GET', '/groups/{group_id}/members'],
      ['GET', '/groups/{group_id}/storybooks'],
    ],
  }),
  deletion: makeConfig({
    title: 'Deletion Requests',
    eyebrow: 'DeletionRequestPage',
    cards: [
      { title: 'Target 삭제 요청', description: 'target_type TARGET, status PENDING', status: 'PENDING' },
      { title: 'Voice profile 삭제', description: 'target_type VOICE_PROFILE', status: 'PROCESSING' },
      { title: '취소된 요청', description: 'status CANCELLED', status: 'CANCELLED' },
    ],
    detailRows: [
      ['POST', '/deletion-requests'],
      ['GET', '/deletion-requests'],
      ['PATCH', '/deletion-requests/{request_id}/cancel'],
    ],
  }),
  report: makeConfig({
    title: 'Reports',
    eyebrow: 'ReportPage',
    cards: [
      { title: '음성 도용 신고', description: 'UNAUTHORIZED_VOICE_USE', status: 'PENDING' },
      { title: '개인정보 침해', description: 'PRIVACY_VIOLATION', status: 'REVIEWING' },
      { title: '조치 완료', description: 'ACTION_TAKEN', status: 'DONE' },
    ],
    detailRows: [
      ['POST', '/reports'],
      ['GET', '/reports'],
      ['GET', '/reports/{report_id}'],
    ],
  }),
  adminDashboard: makeConfig({
    title: 'Admin Dashboard',
    eyebrow: 'AdminDashboardPage',
    badge: 'ADMIN · 구조 준비',
    badgeKind: 'admin',
    cards: baseCards.admin,
    metrics: [
      { label: 'Verification', value: '18' },
      { label: 'Reports', value: '5' },
      { label: 'Rate events', value: '42' },
    ],
    detailRows: [
      ['Role', 'ADMIN only'],
      ['Guard', 'UserResponse role 필드 확인 필요'],
      ['Scope', '/admin/* endpoints'],
    ],
  }),
  adminVerification: makeConfig({
    title: 'Admin Verification Review',
    eyebrow: 'AdminVerificationReviewPage',
    badge: 'ADMIN · Mock',
    badgeKind: 'admin',
    cards: baseCards.admin,
    detailRows: [
      ['GET', '/admin/verification-requests'],
      ['PATCH', '/admin/verification-requests/{request_id}/approve'],
      ['PATCH', '/admin/verification-requests/{request_id}/reject'],
    ],
  }),
  adminReports: makeConfig({
    title: 'Admin Reports',
    eyebrow: 'AdminReportsPage',
    badge: 'ADMIN · Mock',
    badgeKind: 'admin',
    cards: [
      { title: '검토 대기', description: 'PENDING 신고 목록', status: 'PENDING' },
      { title: '조치 완료', description: 'ACTION_TAKEN 상태 변경', status: 'ACTION' },
      { title: '반려', description: 'REJECTED 신고 기록', status: 'REJECTED' },
    ],
    detailRows: [
      ['GET', '/admin/reports'],
      ['PATCH', '/admin/reports/{report_id}/reviewing'],
      ['PATCH', '/admin/reports/{report_id}/action-taken'],
    ],
  }),
  adminAudit: makeConfig({
    title: 'Admin Audit Logs',
    eyebrow: 'AdminAuditLogsPage',
    badge: 'ADMIN · Mock',
    badgeKind: 'admin',
    cards: [
      { title: 'USER_SIGNUP', description: 'actor_user_id 12, target USER', status: 'AUTH' },
      { title: 'PERSONA_CREATED', description: 'target_type PERSONA, target_id 7', status: 'AI' },
      { title: 'RATE_LIMIT_BLOCKED', description: 'endpoint /voice, blocked true', status: 'LIMIT' },
    ],
    detailRows: [
      ['GET', '/admin/audit-logs'],
      ['Query', 'action, actor_user_id, target_type, target_id, start_date, end_date, page, size'],
      ['Response', 'PaginatedResponse<AuditLogResponse>'],
    ],
  }),
}

function DomainShell({ config }: { config: DomainPageConfig }) {
  return (
    <AppShell title={config.title} subtitle={config.description} badge={config.badge}>
      <main className="domain-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">{config.eyebrow}</span>
            <h1>{config.title}</h1>
          </div>
          <span className={`domain-page__badge domain-page__badge--${config.badgeKind}`}>{config.badge}</span>
        </header>

        <section className="domain-page__metrics" aria-label="summary">
          {config.metrics.map((metric) => (
            <article key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <section className="domain-page__main-grid">
          <div className="domain-page__panel">
            <div className="domain-page__panel-heading">
              <h2>Workspace</h2>
              <div>
                {config.primaryAction && <button type="button">{config.primaryAction}</button>}
                {config.secondaryAction && <button type="button">{config.secondaryAction}</button>}
              </div>
            </div>
            <div className="domain-page__cards">
              {config.cards.map((card) => (
                <article className="domain-page__card" key={`${card.title}-${card.status}`}>
                  <span>{card.status}</span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="domain-page__panel domain-page__panel--detail">
            <h2>{config.detailTitle}</h2>
            <dl>
              {config.detailRows.map(([term, value]) => (
                <div key={`${term}-${value}`}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="domain-page__notice">
              실제 API 연결 시 `docs/frontend-api-map.md`와 OpenAPI schema를 다시 확인하고 service layer에만 요청 코드를 추가합니다.
            </p>
          </aside>
        </section>
      </main>
    </AppShell>
  )
}

export function TargetListPage() {
  return <TargetListApiPage />
}

export function TargetCreatePage() {
  return <TargetCreateApiPage />
}

export function TargetDetailPage() {
  return <TargetDetailApiPage />
}

export function TargetMediaPage() {
  return <TargetMediaApiPage />
}

export function ConsentPage() {
  return <DomainShell config={configs.consent} />
}

export function TargetVerificationPage() {
  return <DomainShell config={configs.verification} />
}

export function PersonaListPage() {
  return <PersonaListApiPage />
}

export function PersonaDetailPage() {
  return <PersonaDetailApiPage />
}

export function PersonaVoiceProfilePage() {
  return <DomainShell config={configs.voiceProfile} />
}

export function PersonaChatPage() {
  return <DomainShell config={configs.personaChat} />
}

export function PersonaVoiceCallPage() {
  return <DomainShell config={configs.voiceCall} />
}

export function InterviewListPage() {
  return <DomainShell config={configs.interviewList} />
}

export function InterviewSessionPage() {
  return <DomainShell config={configs.interviewSession} />
}

export function PhotoMemoryListPage() {
  return <DomainShell config={configs.photoList} />
}

export function PhotoMemoryUploadPage() {
  return <DomainShell config={configs.photoUpload} />
}

export function StorybookListPage() {
  return <DomainShell config={configs.storyList} />
}

export function StorybookDetailPage() {
  return <DomainShell config={configs.storyDetail} />
}

export function StorybookCreatePage() {
  return <DomainShell config={configs.storyCreate} />
}

export function StorybookSharePage() {
  return <DomainShell config={configs.storyShare} />
}

export function MemoryGroupListPage() {
  return <DomainShell config={configs.groupList} />
}

export function MemoryGroupDetailPage() {
  return <DomainShell config={configs.groupDetail} />
}

export function DeletionRequestPage() {
  return <DomainShell config={configs.deletion} />
}

export function ReportPage() {
  return <DomainShell config={configs.report} />
}

export function AdminDashboardPage() {
  return <DomainShell config={configs.adminDashboard} />
}

export function AdminVerificationReviewPage() {
  return <DomainShell config={configs.adminVerification} />
}

export function AdminReportsPage() {
  return <DomainShell config={configs.adminReports} />
}

export function AdminAuditLogsPage() {
  return <DomainShell config={configs.adminAudit} />
}
