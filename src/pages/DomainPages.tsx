import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { useVoiceCall } from '../hooks/useVoiceCall'
import { ApiError } from '../services/apiClient'
import { chatService } from '../services/chatService'
import { consentService } from '../services/consentService'
import { mediaService } from '../services/mediaService'
import { mockFeatureService } from '../services/mock/mockFeatureService'
import { personaService } from '../services/personaService'
import { targetService } from '../services/targetService'
import { verificationService } from '../services/verificationService'
import { voiceProfileService } from '../services/voiceProfileService'
import type { MockFeaturePageKey } from '../data/mockFeaturePages'
import type { ChatId, PersonaChatResponse, PersonaMessageResponse, SenderType } from '../types/chat'
import type { ConsentResponse, ConsentType } from '../types/consent'
import type { MediaType, TargetMediaResponse } from '../types/media'
import type { PersonaDetailResponse, PersonaStatus, PersonaStatusResponse } from '../types/persona'
import type { TargetDetailResponse, TargetResponse, TargetType } from '../types/target'
import type { VerificationRequestResponse, VerificationStatus, VerificationType } from '../types/verification'
import type { VoiceCallMessage, VoiceCallStatus } from '../types/voice'
import type { PersonaVoiceProfileResponse, VoiceProfileStatus } from '../types/voiceProfile'
import { toPlayableFileUrl } from '../utils/fileUrl'
import './DomainPages.css'

const targetTypeOptions: TargetType[] = ['parent', 'grandparent', 'friend', 'romantic', 'self', 'other']
const consentTypeOptions: ConsentType[] = [
  'target_profile_consent',
  'photo_upload_consent',
  'voice_upload_consent',
  'voice_cloning_consent',
  'ai_persona_creation_consent',
  'ai_response_notice_consent',
  'storybook_share_consent',
  'group_share_consent',
  'data_retention_consent',
  'third_party_ai_processing_consent',
  'voice_collection',
  'photo_collection',
  'persona_creation',
  'data_usage',
  'ai_processing',
  'ai_response_notice',
  'storybook_share',
]
const verificationTypeOptions: VerificationType[] = ['FAMILY_RELATION_CERTIFICATE', 'ID_CARD', 'SELF_DECLARATION', 'OTHER']

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

function getChatIdFromLocation() {
  const params = new URLSearchParams(window.location.search)
  const chatId = Number(params.get('chat_id'))

  return Number.isInteger(chatId) && chatId > 0 ? chatId : null
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

function isVoiceProfileReadyForCall(profile: PersonaVoiceProfileResponse | null | undefined) {
  return (
    profile?.status === 'READY' &&
    (profile.review_status === 'USER_CONFIRMED' || profile.review_status === 'ADMIN_APPROVED')
  )
}

function getVoiceProfileStatusMessage(profile: PersonaVoiceProfileResponse | null) {
  if (!profile) {
    return 'No voice profile has been returned for this Persona.'
  }

  switch (profile.status) {
    case 'READY':
      return isVoiceProfileReadyForCall(profile)
        ? 'Voice profile is READY and confirmed. Voice call entry is available.'
        : 'Voice profile is READY but user or admin confirmation is still required.'
    case 'NEEDS_MORE_SAMPLES':
      return 'Voice profile needs more voice samples before it can be used.'
    case 'FAILED':
      return profile.error_message ?? 'Voice profile generation failed.'
    case 'PROCESSING':
      return 'Voice profile is processing.'
    case 'PENDING':
      return 'Voice profile is pending.'
    case 'REVOKED':
      return 'Voice profile was revoked.'
    default:
      return 'Voice profile status is not available.'
  }
}

function VoiceProfileStatusBadge({ status }: { status?: VoiceProfileStatus | null }) {
  return <span className={`persona-status-badge persona-status-badge--${(status ?? 'pending').toLowerCase()}`}>{status ?? 'null'}</span>
}

function getSenderLabel(senderType: SenderType) {
  switch (senderType) {
    case 'USER':
      return 'User'
    case 'PERSONA':
      return 'Persona'
    case 'SYSTEM':
      return 'System'
    default:
      return senderType
  }
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

function getLatestApprovedVerification(requests: VerificationRequestResponse[]) {
  return requests.find((request) => request.status === 'APPROVED') ?? null
}

function hasPersonaCreationConsent(consents: ConsentResponse[]) {
  return consents.some(
    (consent) =>
      consent.consent_type === 'ai_persona_creation_consent' &&
      consent.is_consented &&
      consent.is_agreed &&
      !consent.revoked_at,
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
  const [consents, setConsents] = useState<ConsentResponse[]>([])
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequestResponse[]>([])
  const [gateErrorMessage, setGateErrorMessage] = useState<string | null>(null)

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

  useEffect(() => {
    if (!targetId) {
      return
    }

    let isMounted = true

    Promise.all([
      consentService.listTargetConsents(targetId),
      verificationService.listTargetVerificationRequests(targetId, { skip: 0, limit: 20 }),
    ])
      .then(([consentResponse, verificationResponse]) => {
        if (!isMounted) {
          return
        }

        setConsents(consentResponse)
        setVerificationRequests(verificationResponse.items)
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return
        }

        setGateErrorMessage(getApiErrorMessage(error))
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

    if (!getLatestApprovedVerification(verificationRequests)) {
      setErrorMessage('Persona creation requires an APPROVED verification request for this Target.')
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
              <section className="target-api-state">
                <h2>Persona gate</h2>
                {gateErrorMessage && <p role="alert">{gateErrorMessage}</p>}
                <dl>
                  <div>
                    <dt>verification</dt>
                    <dd>{getLatestApprovedVerification(verificationRequests) ? 'APPROVED' : 'APPROVED required'}</dd>
                  </div>
                  <div>
                    <dt>ai_persona_creation_consent</dt>
                    <dd>{hasPersonaCreationConsent(consents) ? 'consented' : 'not consented or revoked'}</dd>
                  </div>
                </dl>
                <p>
                  Persona creation is disabled until at least one Target verification request has status APPROVED. Server
                  403 detail is shown unchanged when returned.
                </p>
                <div className="target-form__actions">
                  <a href={`/verification?target_id=${target.id}`}>Open verification</a>
                  <a href={`/consents?target_id=${target.id}`}>Open consent</a>
                </div>
              </section>

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
                <button
                  disabled={isCreatingPersona || !getLatestApprovedVerification(verificationRequests)}
                  onClick={handleCreatePersona}
                  type="button"
                >
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
  const canUseVoiceCall = isReady && isVoiceProfileReadyForCall(persona.voice_profile)

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
        <p>{isReady ? 'READY status enables chat. Voice call also requires a READY and confirmed voice profile.' : 'Chat and voice call are disabled until status is READY.'}</p>
        <div className="persona-action-card__actions">
          <a aria-disabled={!isReady} href={isReady ? `/persona-chat?persona_id=${persona.id}` : undefined}>
            Open chat
          </a>
          <a aria-disabled={!canUseVoiceCall} href={canUseVoiceCall ? `/persona-voice-call?persona_id=${persona.id}` : undefined}>
            Voice call
          </a>
          <a href={`/personas/voice-profile?persona_id=${persona.id}`}>Voice profile</a>
          {onRefreshStatus && (
            <button disabled={isRefreshingStatus} onClick={onRefreshStatus} type="button">
              {isRefreshingStatus ? 'Refreshing...' : 'Refresh status'}
            </button>
          )}
        </div>

        <section className="target-api-state">
          <h2>Voice profile gate</h2>
          <p>{getVoiceProfileStatusMessage(persona.voice_profile ?? null)}</p>
          {persona.voice_profile ? (
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
          ) : (
            <p>No voice_profile field was returned in PersonaDetailResponse.</p>
          )}
        </section>
      </aside>
    </section>
  )
}

function ConsentApiPage() {
  const [initialTargetId] = useState(() => getTargetIdFromLocation())
  const [targetIdInput, setTargetIdInput] = useState(() => (initialTargetId ? String(initialTargetId) : ''))
  const [activeTargetId, setActiveTargetId] = useState<number | null>(null)
  const [consents, setConsents] = useState<ConsentResponse[]>([])
  const [consentType, setConsentType] = useState<ConsentType>('ai_persona_creation_consent')
  const [consentVersion, setConsentVersion] = useState('v1')
  const [consentTextSnapshot, setConsentTextSnapshot] = useState('')
  const [details, setDetails] = useState('')
  const [isConsented, setIsConsented] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [revokingConsentId, setRevokingConsentId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isPermissionError, setIsPermissionError] = useState(false)

  const loadConsents = useCallback(async (targetId: number) => {
    setIsLoading(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const response = await consentService.listTargetConsents(targetId)
      setConsents(response)
      setActiveTargetId(targetId)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialTargetId) {
      const timerId = window.setTimeout(() => {
        void loadConsents(initialTargetId)
      }, 0)

      return () => {
        window.clearTimeout(timerId)
      }
    }
  }, [initialTargetId, loadConsents])

  function handleSelectTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetId = Number(targetIdInput)

    if (!Number.isInteger(targetId) || targetId <= 0) {
      setErrorMessage('target_id must be a positive integer.')
      return
    }

    void loadConsents(targetId)
  }

  async function handleCreateConsent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetId = Number(targetIdInput)

    if (!Number.isInteger(targetId) || targetId <= 0) {
      setErrorMessage('target_id must be a positive integer.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      await consentService.createConsent({
        target_id: targetId,
        consent_type: consentType,
        consent_version: consentVersion,
        consent_text_snapshot: consentTextSnapshot || null,
        is_agreed: isConsented,
        is_consented: isConsented,
        details: details || null,
      })
      setNotice('Consent created.')
      await loadConsents(targetId)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRevoke(consentId: number) {
    if (!activeTargetId) {
      return
    }

    setRevokingConsentId(consentId)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      await consentService.revokeConsent(consentId)
      setNotice('Consent revoked.')
      await loadConsents(activeTargetId)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setRevokingConsentId(null)
    }
  }

  return (
    <AppShell title="Consent" subtitle="Connected to ConsentLog APIs." badge="API connected">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">ConsentPage</span>
            <h1>Target consent logs</h1>
            <p>Lists, creates, and revokes consent records using backend ConsentLog endpoints.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">GET POST PATCH</span>
        </header>

        <form className="target-form" onSubmit={handleSelectTarget}>
          <div className="target-form__field">
            <label htmlFor="consent-target-id">target_id</label>
            <input
              id="consent-target-id"
              inputMode="numeric"
              onChange={(event) => setTargetIdInput(event.target.value)}
              required
              type="number"
              value={targetIdInput}
            />
            <p className="target-form__helper">GET /targets/{'{target_id}'}/consents</p>
          </div>
          <div className="target-form__actions">
            <button disabled={isLoading} type="submit">
              {isLoading ? 'Loading...' : 'Load consents'}
            </button>
          </div>
        </form>

        <form className="target-form" onSubmit={handleCreateConsent}>
          <div className="target-form__field">
            <label htmlFor="consent-type">consent_type</label>
            <select id="consent-type" onChange={(event) => setConsentType(event.target.value as ConsentType)} value={consentType}>
              {consentTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="target-form__field">
            <label htmlFor="consent-version">consent_version</label>
            <input id="consent-version" onChange={(event) => setConsentVersion(event.target.value)} value={consentVersion} />
          </div>

          <div className="target-form__field">
            <label htmlFor="consent-text">consent_text_snapshot</label>
            <textarea id="consent-text" onChange={(event) => setConsentTextSnapshot(event.target.value)} rows={4} value={consentTextSnapshot} />
          </div>

          <div className="target-form__field">
            <label htmlFor="consent-details">details</label>
            <textarea id="consent-details" onChange={(event) => setDetails(event.target.value)} rows={3} value={details} />
          </div>

          <label className="target-form__checkbox">
            <input checked={isConsented} onChange={(event) => setIsConsented(event.target.checked)} type="checkbox" />
            is_agreed / is_consented
          </label>

          {notice && <p className="target-form__notice">{notice}</p>}
          {errorMessage && (
            <p className="target-form__error" role="alert">
              {isPermissionError ? errorMessage : errorMessage}
            </p>
          )}

          <div className="target-form__actions">
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Creating...' : 'Create consent'}
            </button>
          </div>
        </form>

        <section className="target-card-grid" aria-label="Consent records">
          {consents.map((consent) => (
            <article className="target-card" key={consent.id}>
              <div className="target-card__body">
                <div className="target-card__title-row">
                  <h2>{consent.consent_type}</h2>
                  <span>{consent.revoked_at ? 'REVOKED' : consent.is_consented ? 'CONSENTED' : 'NOT_CONSENTED'}</span>
                </div>
                <dl>
                  <div>
                    <dt>id</dt>
                    <dd>{consent.id}</dd>
                  </div>
                  <div>
                    <dt>consent_version</dt>
                    <dd>{consent.consent_version}</dd>
                  </div>
                  <div>
                    <dt>agreed_at</dt>
                    <dd>{consent.agreed_at ? formatDateTime(consent.agreed_at) : 'null'}</dd>
                  </div>
                  <div>
                    <dt>revoked_at</dt>
                    <dd>{consent.revoked_at ? formatDateTime(consent.revoked_at) : 'null'}</dd>
                  </div>
                </dl>
                {consent.details && <p>{consent.details}</p>}
                <button disabled={Boolean(consent.revoked_at) || revokingConsentId === consent.id} onClick={() => void handleRevoke(consent.id)} type="button">
                  {revokingConsentId === consent.id ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            </article>
          ))}
        </section>

        {activeTargetId && consents.length === 0 && !isLoading && (
          <TargetStateMessage title="No consents" message="No ConsentLog records were returned for this Target." />
        )}
      </main>
    </AppShell>
  )
}

function getVerificationStatusMessage(status: VerificationStatus) {
  switch (status) {
    case 'APPROVED':
      return 'Persona and voice features can be unlocked for this Target.'
    case 'PENDING':
      return 'Admin review is pending.'
    case 'NEED_MORE_INFO':
      return 'Admin requested more information. Check admin_note.'
    case 'REJECTED':
      return 'Rejected. Check rejection_reason.'
    case 'EXPIRED':
      return 'Expired. Submit a new verification request.'
    case 'REVOKED':
      return 'Revoked. Submit a new verification request.'
    default:
      return status
  }
}

function TargetVerificationApiPage() {
  const [initialTargetId] = useState(() => getTargetIdFromLocation())
  const [targetIdInput, setTargetIdInput] = useState(() => (initialTargetId ? String(initialTargetId) : ''))
  const [activeTargetId, setActiveTargetId] = useState<number | null>(null)
  const [requests, setRequests] = useState<VerificationRequestResponse[]>([])
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequestResponse | null>(null)
  const [verificationType, setVerificationType] = useState<VerificationType>('SELF_DECLARATION')
  const [applicantNote, setApplicantNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isPermissionError, setIsPermissionError] = useState(false)

  const loadRequests = useCallback(async (targetId: number) => {
    setIsLoading(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const response = await verificationService.listTargetVerificationRequests(targetId, { skip: 0, limit: 20 })
      setRequests(response.items)
      setActiveTargetId(targetId)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialTargetId) {
      const timerId = window.setTimeout(() => {
        void loadRequests(initialTargetId)
      }, 0)

      return () => {
        window.clearTimeout(timerId)
      }
    }
  }, [initialTargetId, loadRequests])

  function handleSelectTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetId = Number(targetIdInput)

    if (!Number.isInteger(targetId) || targetId <= 0) {
      setErrorMessage('target_id must be a positive integer.')
      return
    }

    void loadRequests(targetId)
  }

  async function handleSubmitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetId = Number(targetIdInput)

    if (!Number.isInteger(targetId) || targetId <= 0) {
      setErrorMessage('target_id must be a positive integer.')
      return
    }

    if (!file) {
      setErrorMessage('file is required.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      await verificationService.createVerificationRequest(targetId, {
        verification_type_param: verificationType,
        applicant_note: applicantNote || null,
        file,
      })
      setNotice('Verification request submitted.')
      setFile(null)
      await loadRequests(targetId)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleOpenDetail(requestId: number) {
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const detail = await verificationService.getVerificationRequest(requestId)
      setSelectedRequest(detail)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  return (
    <AppShell title="Target Verification" subtitle="Connected to TargetVerificationRequest APIs." badge="API connected">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">TargetVerificationPage</span>
            <h1>Target verification requests</h1>
            <p>Submit multipart verification files and review Target verification status.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">multipart/form-data</span>
        </header>

        <form className="target-form" onSubmit={handleSelectTarget}>
          <div className="target-form__field">
            <label htmlFor="verification-target-id">target_id</label>
            <input
              id="verification-target-id"
              inputMode="numeric"
              onChange={(event) => setTargetIdInput(event.target.value)}
              required
              type="number"
              value={targetIdInput}
            />
            <p className="target-form__helper">GET /targets/{'{target_id}'}/verification-requests</p>
          </div>
          <div className="target-form__actions">
            <button disabled={isLoading} type="submit">
              {isLoading ? 'Loading...' : 'Load requests'}
            </button>
          </div>
        </form>

        <form className="target-form" onSubmit={handleSubmitVerification}>
          <div className="target-form__field">
            <label htmlFor="verification-type">verification_type_param</label>
            <select
              id="verification-type"
              onChange={(event) => setVerificationType(event.target.value as VerificationType)}
              value={verificationType}
            >
              {verificationTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="target-form__field">
            <label htmlFor="applicant-note">applicant_note</label>
            <textarea id="applicant-note" onChange={(event) => setApplicantNote(event.target.value)} rows={4} value={applicantNote} />
          </div>

          <div className="target-form__field">
            <label htmlFor="verification-file">file</label>
            <input id="verification-file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required type="file" />
            <p className="target-form__helper">Multipart field names: verification_type_param, applicant_note, file.</p>
          </div>

          {notice && <p className="target-form__notice">{notice}</p>}
          {errorMessage && (
            <p className="target-form__error" role="alert">
              {isPermissionError ? errorMessage : errorMessage}
            </p>
          )}

          <div className="target-form__actions">
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Submitting...' : 'Submit verification'}
            </button>
          </div>
        </form>

        <section className="target-card-grid" aria-label="Verification requests">
          {requests.map((request) => (
            <article className="target-card" key={request.id}>
              <div className="target-card__body">
                <div className="target-card__title-row">
                  <h2>{request.verification_type}</h2>
                  <span>{request.status}</span>
                </div>
                <p>{getVerificationStatusMessage(request.status)}</p>
                <dl>
                  <div>
                    <dt>id</dt>
                    <dd>{request.id}</dd>
                  </div>
                  <div>
                    <dt>original_filename</dt>
                    <dd>{request.original_filename}</dd>
                  </div>
                  <div>
                    <dt>mime_type</dt>
                    <dd>{request.mime_type}</dd>
                  </div>
                  <div>
                    <dt>file_size</dt>
                    <dd>{formatFileSize(request.file_size)}</dd>
                  </div>
                  <div>
                    <dt>created_at</dt>
                    <dd>{formatDateTime(request.created_at)}</dd>
                  </div>
                </dl>
                {request.admin_note && <p>admin_note: {request.admin_note}</p>}
                {request.rejection_reason && <p>rejection_reason: {request.rejection_reason}</p>}
                <button onClick={() => void handleOpenDetail(request.id)} type="button">
                  Load detail
                </button>
              </div>
            </article>
          ))}
        </section>

        {activeTargetId && requests.length === 0 && !isLoading && (
          <TargetStateMessage title="No verification requests" message="Submit a verification request to unlock Persona creation after approval." />
        )}

        {selectedRequest && (
          <section className="target-detail-card">
            <h2>Verification detail #{selectedRequest.id}</h2>
            <dl>
              <div>
                <dt>status</dt>
                <dd>{selectedRequest.status}</dd>
              </div>
              <div>
                <dt>applicant_note</dt>
                <dd>{selectedRequest.applicant_note ?? 'null'}</dd>
              </div>
              <div>
                <dt>admin_note</dt>
                <dd>{selectedRequest.admin_note ?? 'null'}</dd>
              </div>
              <div>
                <dt>reviewed_at</dt>
                <dd>{selectedRequest.reviewed_at ? formatDateTime(selectedRequest.reviewed_at) : 'null'}</dd>
              </div>
              <div>
                <dt>expires_at</dt>
                <dd>{selectedRequest.expires_at ? formatDateTime(selectedRequest.expires_at) : 'null'}</dd>
              </div>
            </dl>
          </section>
        )}
      </main>
    </AppShell>
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

function ChatMessageBubble({ message }: { message: PersonaMessageResponse }) {
  const audioUrl = message.audio_file_path ? toPlayableFileUrl(message.audio_file_path) : null

  return (
    <article className={`persona-chat-message persona-chat-message--${message.sender_type.toLowerCase()}`}>
      <header>
        <strong>{getSenderLabel(message.sender_type)}</strong>
        <span>{message.message_type}</span>
      </header>
      {message.content && <p>{message.content}</p>}
      {message.message_type === 'AUDIO' && audioUrl && <audio controls preload="metadata" src={audioUrl} />}
      {message.message_type === 'TEXT' && audioUrl && <audio controls preload="metadata" src={audioUrl} />}
      <small>{formatDateTime(message.created_at)}</small>
    </article>
  )
}

function PersonaChatApiPage() {
  const [initialPersonaId] = useState(() => getPersonaIdFromLocation())
  const [initialChatId] = useState(() => getChatIdFromLocation())
  const [personaIdInput, setPersonaIdInput] = useState(() => (initialPersonaId ? String(initialPersonaId) : ''))
  const [activePersonaId, setActivePersonaId] = useState<number | null>(null)
  const [chats, setChats] = useState<PersonaChatResponse[]>([])
  const [activeChatId, setActiveChatId] = useState<ChatId | null>(initialChatId)
  const [messages, setMessages] = useState<PersonaMessageResponse[]>([])
  const [chatTitle, setChatTitle] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [generateAudio, setGenerateAudio] = useState(false)
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null)
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const [isPermissionError, setIsPermissionError] = useState(false)

  const loadMessages = useCallback(async (chatId: ChatId) => {
    setIsLoadingMessages(true)
    setErrorMessage(null)
    setIsPermissionError(false)

    try {
      const response = await chatService.listChatMessages(chatId)
      setMessages(response)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  const loadChats = useCallback(
    async (personaId: number, preferredChatId?: ChatId | null) => {
      setIsLoadingChats(true)
      setErrorMessage(null)
      setIsPermissionError(false)

      try {
        const response = await chatService.listPersonaChats(personaId)
        setChats(response)

        const nextChatId = preferredChatId ?? response[0]?.id ?? null
        setActiveChatId(nextChatId)

        if (nextChatId) {
          await loadMessages(nextChatId)
        } else {
          setMessages([])
        }
      } catch (error) {
        setIsPermissionError(isOwnerOnlyError(error))
        setErrorMessage(getApiErrorMessage(error))
      } finally {
        setIsLoadingChats(false)
      }
    },
    [loadMessages],
  )

  useEffect(() => {
    if (!initialPersonaId) {
      return
    }

    const timerId = window.setTimeout(() => {
      setActivePersonaId(initialPersonaId)
      void loadChats(initialPersonaId, initialChatId)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [initialChatId, initialPersonaId, loadChats])

  function handlePersonaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const personaId = Number(personaIdInput)

    if (!Number.isInteger(personaId) || personaId <= 0) {
      setErrorMessage('persona_id must be a positive integer.')
      return
    }

    setActivePersonaId(personaId)
    void loadChats(personaId, null)
  }

  async function handleCreateChat() {
    if (!activePersonaId) {
      setErrorMessage('persona_id is required before creating a chat.')
      return
    }

    setIsCreatingChat(true)
    setErrorMessage(null)
    setIsPermissionError(false)

    try {
      const createdChat = await chatService.createPersonaChat(activePersonaId, { title: chatTitle || null })
      setChats((current) => [createdChat, ...current.filter((chat) => chat.id !== createdChat.id)])
      setActiveChatId(createdChat.id)
      setMessages([])
      setChatTitle('')
      await loadMessages(createdChat.id)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsCreatingChat(false)
    }
  }

  async function sendTextMessage(content: string) {
    if (!activeChatId) {
      setSendErrorMessage('chat_id is required before sending a message.')
      return
    }

    setIsSending(true)
    setSendErrorMessage(null)

    try {
      const response = await chatService.createChatMessage(activeChatId, {
        message_type: 'TEXT',
        content,
        generate_audio: generateAudio,
      })

      setMessages((current) => [...current, response.user_message, response.persona_message])
      setMessageContent('')
      setLastFailedMessage(null)
    } catch (error) {
      setLastFailedMessage(content)
      setSendErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSending(false)
    }
  }

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = messageContent.trim()

    if (!content) {
      return
    }

    void sendTextMessage(content)
  }

  return (
    <AppShell title="Persona Chat" subtitle="Creates chats and sends Persona messages through backend APIs." badge="API connected">
      <main className="domain-page target-api-page persona-chat-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">PersonaChatPage</span>
            <h1>Persona chat</h1>
            <p>Uses PersonaChatResponse, PersonaMessageResponse, and PersonaMessagePairResponse as defined by OpenAPI.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">Chat API</span>
        </header>

        <form className="target-form target-media-target-form" onSubmit={handlePersonaSubmit}>
          <div className="target-form__field">
            <label htmlFor="chat-persona-id">persona_id</label>
            <input
              id="chat-persona-id"
              inputMode="numeric"
              onChange={(event) => setPersonaIdInput(event.target.value)}
              required
              type="number"
              value={personaIdInput}
            />
            <p className="target-form__helper">Path param for /personas/{'{persona_id}'}/chats.</p>
          </div>
          <div className="target-form__actions">
            <a href="/personas">Create persona</a>
            <button disabled={isLoadingChats} type="submit">
              {isLoadingChats ? 'Loading...' : 'Load chats'}
            </button>
          </div>
        </form>

        {errorMessage && (
          <p className="target-form__error" role="alert">
            {isPermissionError ? 'You do not have permission to access this chat resource.' : errorMessage}
          </p>
        )}

        {activePersonaId && (
          <section className="persona-chat-layout">
            <aside className="persona-chat-sidebar">
              <h2>Chats</h2>
              <div className="target-form__field">
                <label htmlFor="chat-title">title</label>
                <input
                  id="chat-title"
                  maxLength={255}
                  onChange={(event) => setChatTitle(event.target.value)}
                  placeholder="Optional title"
                  type="text"
                  value={chatTitle}
                />
              </div>
              <button disabled={isCreatingChat} onClick={() => void handleCreateChat()} type="button">
                {isCreatingChat ? 'Starting...' : 'Start new chat'}
              </button>

              {isLoadingChats && <p className="persona-chat-empty">Loading chat rooms...</p>}

              {!isLoadingChats && chats.length === 0 && (
                <p className="persona-chat-empty">No chat rooms yet. Start a new chat to send messages.</p>
              )}

              {chats.length > 0 && (
                <div className="persona-chat-list">
                  {chats.map((chat) => (
                    <button
                      className={chat.id === activeChatId ? 'is-active' : undefined}
                      key={chat.id}
                      onClick={() => {
                        setActiveChatId(chat.id)
                        void loadMessages(chat.id)
                      }}
                      type="button"
                    >
                      <strong>{chat.title ?? `Chat ${chat.id}`}</strong>
                      <span>{formatDateTime(chat.updated_at)}</span>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="persona-chat-thread">
              <div className="persona-chat-thread__header">
                <h2>Messages</h2>
                <span>{activeChatId ? `chat_id ${activeChatId}` : 'No chat selected'}</span>
              </div>

              {isLoadingMessages && <p className="persona-chat-empty">Loading messages...</p>}

              {!isLoadingMessages && activeChatId && messages.length === 0 && (
                <p className="persona-chat-empty">No messages yet. Send the first TEXT message.</p>
              )}

              <div className="persona-chat-messages" aria-live="polite">
                {messages.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))}
              </div>

              {sendErrorMessage && (
                <div className="persona-chat-send-error" role="alert">
                  <p>{sendErrorMessage}</p>
                  {lastFailedMessage && (
                    <button disabled={isSending} onClick={() => void sendTextMessage(lastFailedMessage)} type="button">
                      Retry
                    </button>
                  )}
                </div>
              )}

              <form className="persona-chat-composer" onSubmit={handleSendMessage}>
                <label htmlFor="persona-chat-message">content</label>
                <textarea
                  disabled={!activeChatId || isSending}
                  id="persona-chat-message"
                  onChange={(event) => setMessageContent(event.target.value)}
                  placeholder="Send a TEXT message"
                  rows={3}
                  value={messageContent}
                />
                <label className="persona-chat-checkbox" htmlFor="persona-chat-generate-audio">
                  <input
                    checked={generateAudio}
                    id="persona-chat-generate-audio"
                    onChange={(event) => setGenerateAudio(event.target.checked)}
                    type="checkbox"
                  />
                  generate_audio
                </label>
                <button disabled={!activeChatId || isSending || !messageContent.trim()} type="submit">
                  {isSending ? 'Sending...' : 'Send message'}
                </button>
              </form>
            </section>
          </section>
        )}
      </main>
    </AppShell>
  )
}

function VoiceProfileDetailCard({ profile }: { profile: PersonaVoiceProfileResponse }) {
  const sampleAudioUrl = profile.sample_audio_path ? toPlayableFileUrl(profile.sample_audio_path) : null
  const referenceAudioUrl = profile.reference_voice_file_path ? toPlayableFileUrl(profile.reference_voice_file_path) : null

  return (
    <article className="target-detail-card">
      <div className="target-card__title-row">
        <h2>Voice profile #{profile.id}</h2>
        <VoiceProfileStatusBadge status={profile.status} />
      </div>
      <p>{getVoiceProfileStatusMessage(profile)}</p>
      <dl>
        <div>
          <dt>persona_id</dt>
          <dd>{profile.persona_id}</dd>
        </div>
        <div>
          <dt>target_id</dt>
          <dd>{profile.target_id ?? 'null'}</dd>
        </div>
        <div>
          <dt>review_status</dt>
          <dd>{profile.review_status ?? 'null'}</dd>
        </div>
        <div>
          <dt>reference_audio_count</dt>
          <dd>{profile.reference_audio_count ?? 'null'}</dd>
        </div>
        <div>
          <dt>reference_audio_total_seconds</dt>
          <dd>{profile.reference_audio_total_seconds ?? 'null'}</dd>
        </div>
        <div>
          <dt>total_reference_duration_ms</dt>
          <dd>{profile.total_reference_duration_ms ?? 'null'}</dd>
        </div>
        <div>
          <dt>quality_score</dt>
          <dd>{profile.quality_score ?? 'null'}</dd>
        </div>
        <div>
          <dt>similarity_score</dt>
          <dd>{profile.similarity_score ?? 'null'}</dd>
        </div>
        <div>
          <dt>noise_score</dt>
          <dd>{profile.noise_score ?? 'null'}</dd>
        </div>
        <div>
          <dt>voice_provider</dt>
          <dd>{profile.voice_provider ?? 'null'}</dd>
        </div>
        <div>
          <dt>voice_id</dt>
          <dd>{profile.voice_id ?? 'null'}</dd>
        </div>
        <div>
          <dt>voice_name</dt>
          <dd>{profile.voice_name ?? 'null'}</dd>
        </div>
        <div>
          <dt>review_note</dt>
          <dd>{profile.review_note ?? 'null'}</dd>
        </div>
        <div>
          <dt>error_message</dt>
          <dd>{profile.error_message ?? 'null'}</dd>
        </div>
        <div>
          <dt>created_at</dt>
          <dd>{formatDateTime(profile.created_at)}</dd>
        </div>
        <div>
          <dt>updated_at</dt>
          <dd>{formatDateTime(profile.updated_at)}</dd>
        </div>
      </dl>

      {sampleAudioUrl && (
        <div className="target-media-local-audio">
          <p>sample_audio_path</p>
          <audio controls preload="metadata" src={sampleAudioUrl} />
        </div>
      )}

      {referenceAudioUrl && (
        <div className="target-media-local-audio">
          <p>reference_voice_file_path</p>
          <audio controls preload="metadata" src={referenceAudioUrl} />
        </div>
      )}
    </article>
  )
}

function PersonaVoiceProfileApiPage() {
  const [initialPersonaId] = useState(() => getPersonaIdFromLocation())
  const [personaIdInput, setPersonaIdInput] = useState(() => (initialPersonaId ? String(initialPersonaId) : ''))
  const [activePersonaId, setActivePersonaId] = useState<number | null>(null)
  const [profile, setProfile] = useState<PersonaVoiceProfileResponse | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isPermissionError, setIsPermissionError] = useState(false)

  const loadProfile = useCallback(async (personaId: number) => {
    setIsLoading(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const response = await voiceProfileService.getVoiceProfile(personaId)
      setProfile(response)
      setActivePersonaId(personaId)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
      setProfile(null)
      setActivePersonaId(personaId)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialPersonaId) {
      return
    }

    const timerId = window.setTimeout(() => {
      void loadProfile(initialPersonaId)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [initialPersonaId, loadProfile])

  function getPersonaIdFromInput() {
    const personaId = Number(personaIdInput)
    return Number.isInteger(personaId) && personaId > 0 ? personaId : null
  }

  function handleLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const personaId = getPersonaIdFromInput()

    if (!personaId) {
      setErrorMessage('persona_id must be a positive integer.')
      return
    }

    void loadProfile(personaId)
  }

  async function handleCreate() {
    const personaId = getPersonaIdFromInput()

    if (!personaId) {
      setErrorMessage('persona_id must be a positive integer.')
      return
    }

    setIsCreating(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const response = await voiceProfileService.createVoiceProfile(personaId)
      setProfile(response)
      setActivePersonaId(personaId)
      setNotice('Voice profile creation requested.')
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleEvaluate() {
    const personaId = activePersonaId ?? getPersonaIdFromInput()

    if (!personaId) {
      setErrorMessage('persona_id must be a positive integer.')
      return
    }

    setIsEvaluating(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const response = await voiceProfileService.evaluateVoiceProfile(personaId)
      setProfile(response)
      setActivePersonaId(personaId)
      setNotice('Voice profile evaluated.')
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsEvaluating(false)
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const personaId = activePersonaId ?? getPersonaIdFromInput()

    if (!personaId) {
      setErrorMessage('persona_id must be a positive integer.')
      return
    }

    setIsConfirming(true)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const response = await voiceProfileService.confirmVoiceProfile(personaId, {
        review_note: reviewNote || null,
      })
      setProfile(response)
      setActivePersonaId(personaId)
      setNotice('Voice profile confirmed.')
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsConfirming(false)
    }
  }

  const canEnterVoiceCall = isVoiceProfileReadyForCall(profile)

  return (
    <AppShell title="Persona Voice Profile" subtitle="Connected to PersonaVoiceProfile APIs." badge="API connected">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">PersonaVoiceProfilePage</span>
            <h1>Persona voice profile</h1>
            <p>Create, evaluate, confirm, and inspect the voice profile returned by the backend.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">GET POST PATCH</span>
        </header>

        <form className="target-form" onSubmit={handleLoad}>
          <div className="target-form__field">
            <label htmlFor="voice-profile-persona-id">persona_id</label>
            <input
              id="voice-profile-persona-id"
              inputMode="numeric"
              onChange={(event) => setPersonaIdInput(event.target.value)}
              required
              type="number"
              value={personaIdInput}
            />
            <p className="target-form__helper">Path param for /personas/{'{persona_id}'}/voice-profile.</p>
          </div>
          <div className="target-form__actions">
            <button disabled={isLoading} type="submit">
              {isLoading ? 'Loading...' : 'Load profile'}
            </button>
            <button disabled={isCreating} onClick={() => void handleCreate()} type="button">
              {isCreating ? 'Creating...' : 'Create profile'}
            </button>
            <button disabled={isEvaluating} onClick={() => void handleEvaluate()} type="button">
              {isEvaluating ? 'Evaluating...' : 'Evaluate'}
            </button>
          </div>
        </form>

        <form className="target-form" onSubmit={handleConfirm}>
          <div className="target-form__field">
            <label htmlFor="voice-profile-review-note">review_note</label>
            <textarea
              id="voice-profile-review-note"
              onChange={(event) => setReviewNote(event.target.value)}
              rows={3}
              value={reviewNote}
            />
            <p className="target-form__helper">PATCH /personas/{'{persona_id}'}/voice-profile/user-confirm</p>
          </div>
          <div className="target-form__actions">
            <button disabled={isConfirming} type="submit">
              {isConfirming ? 'Confirming...' : 'User confirm'}
            </button>
            <a aria-disabled={!canEnterVoiceCall} href={canEnterVoiceCall && activePersonaId ? `/persona-voice-call?persona_id=${activePersonaId}` : undefined}>
              Voice call
            </a>
          </div>
        </form>

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && (
          <p className="target-form__error" role="alert">
            {isPermissionError ? errorMessage : errorMessage}
          </p>
        )}

        {isLoading && <TargetStateMessage title="Loading voice profile" message="Fetching PersonaVoiceProfileResponse from the backend." />}

        {!isLoading && activePersonaId && !profile && !errorMessage && (
          <TargetStateMessage title="No voice profile" message="Create a voice profile after uploading Target voice media." />
        )}

        {profile && <VoiceProfileDetailCard profile={profile} />}
      </main>
    </AppShell>
  )
}

const voiceStatusLabel: Record<VoiceCallStatus, string> = {
  disconnected: 'disconnected',
  connecting: 'connecting',
  connected: 'connected',
  recording: 'recording',
  processing: 'processing',
  ended: 'ended',
}

function VoiceCallBubble({ message }: { message: VoiceCallMessage }) {
  const audioPath = message.audio_url ?? message.audio_file_path
  const audioUrl = audioPath ? toPlayableFileUrl(audioPath) : null

  return (
    <article className={`voice-call-message voice-call-message--${message.sender.toLowerCase()}`}>
      <header>
        <strong>{message.sender}</strong>
        <span>{message.message_type}</span>
      </header>
      {message.text && <p>{message.text}</p>}
      {audioUrl && <audio controls preload="metadata" src={audioUrl} />}
      <small>{formatDateTime(message.created_at)}</small>
    </article>
  )
}

function PersonaVoiceCallApiPage() {
  const [initialPersonaId] = useState(() => getPersonaIdFromLocation())
  const [initialChatId] = useState(() => getChatIdFromLocation())
  const [personaIdInput, setPersonaIdInput] = useState(() => (initialPersonaId ? String(initialPersonaId) : ''))
  const [chatIdInput, setChatIdInput] = useState(() => (initialChatId ? String(initialChatId) : ''))
  const [voiceProfileGate, setVoiceProfileGate] = useState<PersonaVoiceProfileResponse | null>(null)
  const [voiceProfileGateError, setVoiceProfileGateError] = useState<string | null>(null)
  const [isCheckingVoiceProfile, setIsCheckingVoiceProfile] = useState(false)
  const voiceCall = useVoiceCall()

  const canConnect = voiceCall.status === 'disconnected' || voiceCall.status === 'ended'
  const canRecord = voiceCall.status === 'connected'
  const canEndUtterance = voiceCall.status === 'recording'
  const canStop = voiceCall.status === 'connected' || voiceCall.status === 'recording' || voiceCall.status === 'processing'

  async function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const personaId = Number(personaIdInput)
    const chatId = Number(chatIdInput)

    if (!Number.isInteger(personaId) || personaId <= 0) {
      setVoiceProfileGateError('persona_id must be a positive integer.')
      return
    }

    setIsCheckingVoiceProfile(true)
    setVoiceProfileGateError(null)

    try {
      const profile = await voiceProfileService.getVoiceProfile(personaId)
      setVoiceProfileGate(profile)

      if (!isVoiceProfileReadyForCall(profile)) {
        setVoiceProfileGateError('Voice call requires voice profile status READY and review_status USER_CONFIRMED or ADMIN_APPROVED.')
        return
      }

      voiceCall.connect({ personaId, chatId })
    } catch (error) {
      setVoiceProfileGate(null)
      setVoiceProfileGateError(getApiErrorMessage(error))
    } finally {
      setIsCheckingVoiceProfile(false)
    }
  }

  return (
    <AppShell title="Persona Voice Call" subtitle="Realtime voice conversation over the documented WebSocket endpoint." badge="WebSocket connected">
      <main className="domain-page target-api-page voice-call-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">PersonaVoiceCallPage</span>
            <h1>Persona voice call</h1>
            <p>Uses /ws/personas/{'{persona_id}'}/voice with access token query authentication.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">Voice WebSocket</span>
        </header>

        <section className="voice-call-layout">
          <div className="voice-call-panel voice-call-panel--controls">
            <form className="target-form voice-call-form" onSubmit={handleConnect}>
              <div className="target-form__field">
                <label htmlFor="voice-persona-id">persona_id</label>
                <input
                  disabled={!canConnect}
                  id="voice-persona-id"
                  inputMode="numeric"
                  onChange={(event) => setPersonaIdInput(event.target.value)}
                  required
                  type="number"
                  value={personaIdInput}
                />
                <p className="target-form__helper">Path param for the voice WebSocket endpoint.</p>
              </div>

              <div className="target-form__field">
                <label htmlFor="voice-chat-id">chat_id</label>
                <input
                  disabled={!canConnect}
                  id="voice-chat-id"
                  inputMode="numeric"
                  onChange={(event) => setChatIdInput(event.target.value)}
                  required
                  type="number"
                  value={chatIdInput}
                />
                <p className="target-form__helper">Sent in the documented start message body.</p>
              </div>

              <button disabled={!canConnect || voiceCall.status === 'connecting' || isCheckingVoiceProfile} type="submit">
                {isCheckingVoiceProfile ? 'Checking voice profile...' : voiceCall.status === 'connecting' ? 'Connecting...' : 'Connect'}
              </button>
            </form>

            <div className="voice-call-status-card">
              <span className={`voice-call-status voice-call-status--${voiceCall.status}`}>{voiceStatusLabel[voiceCall.status]}</span>
              <dl>
                <div>
                  <dt>session_id</dt>
                  <dd>{voiceCall.sessionId ?? 'Not started'}</dd>
                </div>
                <div>
                  <dt>mime_type</dt>
                  <dd>audio/webm</dd>
                </div>
                <div>
                  <dt>voice_profile.status</dt>
                  <dd>{voiceProfileGate?.status ?? 'Not checked'}</dd>
                </div>
                <div>
                  <dt>review_status</dt>
                  <dd>{voiceProfileGate?.review_status ?? 'Not checked'}</dd>
                </div>
              </dl>
            </div>

            {voiceProfileGateError && (
              <p className="target-form__error" role="alert">
                {voiceProfileGateError}
              </p>
            )}

            {voiceCall.errorMessage && (
              <p className="target-form__error" role="alert">
                {voiceCall.errorMessage}
              </p>
            )}

            {voiceCall.isMicPermissionDenied && (
              <p className="target-form__helper" role="status">
                Browser microphone permission is required before recording audio chunks.
              </p>
            )}

            <div className="voice-call-actions" aria-label="Voice call controls">
              <button disabled={!canRecord} onClick={() => void voiceCall.startRecording()} type="button">
                Start speaking
              </button>
              <button disabled={!canEndUtterance} onClick={voiceCall.endUtterance} type="button">
                End utterance
              </button>
              <button disabled={!canStop} onClick={voiceCall.stopCall} type="button">
                End call
              </button>
            </div>
          </div>

          <section className="voice-call-panel voice-call-panel--conversation" aria-label="Voice conversation">
            <div className="voice-call-live-caption">
              <span>partial_transcript</span>
              <p>{voiceCall.partialTranscript || 'Waiting for live transcript...'}</p>
            </div>

            {voiceCall.messages.length === 0 && (
              <p className="persona-chat-empty">
                Connect, start speaking, and press End utterance to receive final transcript and persona response events.
              </p>
            )}

            <div className="voice-call-messages" aria-live="polite">
              {voiceCall.messages.map((message) => (
                <VoiceCallBubble key={message.id} message={message} />
              ))}
            </div>
          </section>
        </section>
      </main>
    </AppShell>
  )
}

function MockFeaturePage({ pageKey }: { pageKey: MockFeaturePageKey }) {
  const page = mockFeatureService.getPage(pageKey)

  return (
    <AppShell title={page.title} subtitle={page.description} badge={page.badge}>
      <main className="domain-page mock-feature-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">{page.eyebrow}</span>
            <h1>{page.title}</h1>
            <p>{page.description}</p>
          </div>
          <span className="domain-page__badge domain-page__badge--next">{page.badge}</span>
        </header>

        <section className="domain-page__metrics" aria-label={`${page.title} summary`}>
          {page.metrics.map((metric) => (
            <article key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <section className="mock-feature-layout">
          <div className="mock-feature-panel">
            <div className="mock-feature-panel__heading">
              <div>
                <span>{page.priority}</span>
                <h2>{page.detailTitle}</h2>
                <p>{page.detailDescription}</p>
              </div>
            </div>

            <div className="mock-feature-list" aria-label={`${page.title} mock records`}>
              {page.records.map((record) => (
                <article className="mock-feature-card" key={record.id}>
                  <div className="mock-feature-card__heading">
                    <div>
                      <h3>{record.title}</h3>
                      <p>{record.subtitle}</p>
                    </div>
                    <span className={`mock-feature-status mock-feature-status--${record.statusTone}`}>{record.status}</span>
                  </div>
                  <dl>
                    {record.meta.map(([term, value]) => (
                      <div key={`${record.id}-${term}`}>
                        <dt>{term}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </div>

          <aside className="mock-feature-panel mock-feature-panel--side">
            <section>
              <h2>Available later</h2>
              <div className="mock-feature-actions">
                {page.actions.map((action) => (
                  <button disabled key={action.label} title={action.disabledReason} type="button">
                    {action.label}
                  </button>
                ))}
              </div>
              <p className="mock-feature-disabled-note">
                These controls are intentionally disabled because this page is a mock skeleton. {page.developerNote}
              </p>
            </section>

            <section className="mock-feature-endpoints" aria-label="Planned API endpoints">
              <h2>Planned API paths</h2>
              <ul>
                {page.endpoints.map((endpoint) => (
                  <li key={`${endpoint.method}-${endpoint.path}`}>
                    <span>{endpoint.method}</span>
                    <code>{endpoint.path}</code>
                    {'note' in endpoint && endpoint.note && <small>{endpoint.note}</small>}
                  </li>
                ))}
              </ul>
            </section>
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
  return <ConsentApiPage />
}

export function TargetVerificationPage() {
  return <TargetVerificationApiPage />
}

export function PersonaListPage() {
  return <PersonaListApiPage />
}

export function PersonaDetailPage() {
  return <PersonaDetailApiPage />
}

export function PersonaVoiceProfilePage() {
  return <PersonaVoiceProfileApiPage />
}

export function PersonaChatPage() {
  return <PersonaChatApiPage />
}

export function PersonaVoiceCallPage() {
  return <PersonaVoiceCallApiPage />
}

export function InterviewListPage() {
  return <MockFeaturePage pageKey="aiInterviewSession" />
}

export function InterviewSessionPage() {
  return <MockFeaturePage pageKey="aiInterviewSession" />
}

export function PhotoMemoryListPage() {
  return <MockFeaturePage pageKey="photoMemory" />
}

export function PhotoMemoryUploadPage() {
  return <MockFeaturePage pageKey="photoMemory" />
}

export function StorybookListPage() {
  return <MockFeaturePage pageKey="storybook" />
}

export function StorybookDetailPage() {
  return <MockFeaturePage pageKey="storybook" />
}

export function StorybookCreatePage() {
  return <MockFeaturePage pageKey="storybookCreate" />
}

export function StorybookSharePage() {
  return <MockFeaturePage pageKey="shareLink" />
}

export function MemoryGroupListPage() {
  return <MockFeaturePage pageKey="memoryGroup" />
}

export function MemoryGroupDetailPage() {
  return <MockFeaturePage pageKey="memoryGroup" />
}

export function DeletionRequestPage() {
  return <MockFeaturePage pageKey="deletionRequest" />
}

export function ReportPage() {
  return <MockFeaturePage pageKey="report" />
}

export function AdminDashboardPage() {
  return <MockFeaturePage pageKey="adminDashboard" />
}

export function AdminVerificationReviewPage() {
  return <MockFeaturePage pageKey="adminVerificationReview" />
}

export function AdminReportsPage() {
  return <MockFeaturePage pageKey="adminReports" />
}

export function AdminAuditLogsPage() {
  return <MockFeaturePage pageKey="adminAuditLogs" />
}
