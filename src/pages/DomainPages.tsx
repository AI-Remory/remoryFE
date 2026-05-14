import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { MemoryGroupSelector, StorybookSelector, TargetSelector } from '../components/selectors/EntitySelectors'
import { useVoiceCall } from '../hooks/useVoiceCall'
import { adminService } from '../services/adminService'
import { ApiError } from '../services/apiClient'
import { chatService } from '../services/chatService'
import { consentService } from '../services/consentService'
import { deletionService } from '../services/deletionService'
import { groupService } from '../services/groupService'
import { interviewService } from '../services/interviewService'
import { mediaService } from '../services/mediaService'
import { mockFeatureService } from '../services/mock/mockFeatureService'
import { personaService } from '../services/personaService'
import { photoMemoryService } from '../services/photoMemoryService'
import { reportService } from '../services/reportService'
import { targetService } from '../services/targetService'
import { verificationService } from '../services/verificationService'
import { voiceProfileService } from '../services/voiceProfileService'
import { shareLinkService } from '../services/shareLinkService'
import { storybookService } from '../services/storybookService'
import type { MockFeaturePageKey } from '../data/mockFeaturePages'
import type {
  AdminReportAction,
  AdminReportResponse,
  AuditAction,
  AuditLogResponse,
  AuditTargetType,
  RateLimitEventResponse,
  UsageLimitResponse,
  VerificationRequestAdminResponse,
} from '../types/admin'
import type { ChatId, PersonaChatResponse, PersonaMessageResponse, SenderType } from '../types/chat'
import type { ConsentResponse, ConsentType } from '../types/consent'
import type { DeletionRequestResponse, DeletionStatus, DeletionTargetType } from '../types/deletion'
import type {
  GroupMemberResponse,
  GroupMemberRole,
  GroupStoryBookListItemResponse,
  MemoryGroupDetailResponse,
  MemoryGroupResponse,
} from '../types/group'
import type {
  AIInterviewQuestionResponse,
  AIInterviewSessionDetailResponse,
  AIInterviewSessionResponse,
  InterviewType,
} from '../types/interview'
import type { MediaType, TargetMediaResponse } from '../types/media'
import type { PersonaDetailResponse, PersonaStatus, PersonaStatusResponse } from '../types/persona'
import type { PhotoMemoryResponse } from '../types/photoMemory'
import type { PublicSharedStoryBookResponse, ShareLinkResponse } from '../types/shareLink'
import type { ReportReasonType, ReportResponse, ReportStatus, ReportTargetType } from '../types/report'
import type {
  StoryBookDetailResponse,
  StoryBookResponse,
  StoryBookVisibility,
  StoryChapterResponse,
} from '../types/storybook'
import type { TargetDetailResponse, TargetResponse, TargetType } from '../types/target'
import type { VerificationRequestResponse, VerificationStatus, VerificationType } from '../types/verification'
import type { VoiceCallMessage, VoiceCallStatus } from '../types/voice'
import type { PersonaVoiceProfileResponse, VoiceProfileStatus } from '../types/voiceProfile'
import { getDisplayLabel } from '../utils/displayLabels'
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
const interviewTypeOptions: InterviewType[] = ['TARGET_PROFILE', 'PHOTO_MEMORY', 'SELF_STORY']
const storyBookVisibilityOptions: StoryBookVisibility[] = ['PRIVATE', 'LINK', 'GROUP', 'PUBLIC']
const groupMemberRoleOptions: GroupMemberRole[] = ['OWNER', 'MEMBER', 'VIEWER']
const verificationStatusOptions: VerificationStatus[] = ['PENDING', 'NEED_MORE_INFO', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED']
const reportStatusOptions: ReportStatus[] = ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED', 'ACTION_TAKEN']
const adminReportActionOptions: AdminReportAction[] = ['reviewing', 'resolve', 'reject', 'action-taken']
const auditActionOptions: AuditAction[] = [
  'USER_SIGNUP',
  'TARGET_CREATED',
  'TARGET_UPDATED',
  'TARGET_DELETED',
  'CONSENT_CREATED',
  'CONSENT_REVOKED',
  'VERIFICATION_SUBMITTED',
  'VERIFICATION_APPROVED',
  'VERIFICATION_REJECTED',
  'VERIFICATION_NEED_MORE_INFO',
  'VERIFICATION_REVOKED',
  'PERSONA_CREATED',
  'PERSONA_CHAT_CREATED',
  'PERSONA_MESSAGE_CREATED',
  'VOICE_PROFILE_CREATED',
  'VOICE_PROFILE_REVIEWED',
  'VOICE_SYNTHESIZED',
  'VOICE_CALL_STARTED',
  'VOICE_CALL_ENDED',
  'DELETION_REQUESTED',
  'DELETION_COMPLETED',
  'DELETION_REJECTED',
  'REPORT_CREATED',
  'REPORT_RESOLVED',
  'REPORT_REVIEWING',
  'REPORT_REJECTED',
  'REPORT_ACTION_TAKEN',
  'RATE_LIMIT_BLOCKED',
  'ABNORMAL_REQUEST_BLOCKED',
]
const auditTargetTypeOptions: AuditTargetType[] = [
  'TARGET',
  'CONSENT',
  'VERIFICATION_REQUEST',
  'PERSONA',
  'PERSONA_CHAT',
  'PERSONA_MESSAGE',
  'VOICE_PROFILE',
  'DELETION_REQUEST',
  'REPORT',
  'USER',
  'SYSTEM',
]
const deletionTargetTypeOptions: DeletionTargetType[] = [
  'TARGET',
  'TARGET_MEDIA',
  'PERSONA',
  'PERSONA_CHAT',
  'PERSONA_MESSAGE',
  'PHOTO_MEMORY',
  'STORYBOOK',
  'SHARE_LINK',
  'MEMORY_GROUP',
  'VERIFICATION_REQUEST',
  'ACCOUNT',
  'VOICE_PROFILE',
  'VOICE_CALL_SESSION',
]
const reportTargetTypeOptions: ReportTargetType[] = ['PERSONA', 'PERSONA_CHAT', 'PERSONA_MESSAGE', 'STORYBOOK', 'SHARE_LINK', 'TARGET', 'USER']
const reportReasonTypeOptions: ReportReasonType[] = [
  'UNAUTHORIZED_VOICE_USE',
  'PRIVACY_VIOLATION',
  'HARMFUL_CONTENT',
  'IMPERSONATION',
  'COPYRIGHT_OR_RIGHTS',
  'SPAM',
  'OTHER',
]
type AdminApiConnectionStatus = 'connected' | 'partially-connected'
const ADMIN_USAGE_API_STATUS: AdminApiConnectionStatus = 'partially-connected'

function getAdminReportActionLabel(action: AdminReportAction) {
  switch (action) {
    case 'reviewing':
      return '검토 시작'
    case 'resolve':
      return '처리 완료'
    case 'reject':
      return '반려'
    case 'action-taken':
      return '조치 완료'
    default:
      return action
  }
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return '요청에 실패했습니다.'
}

function getApiErrorDetailText(error: unknown) {
  if (!(error instanceof ApiError)) {
    return null
  }

  if (typeof error.detail === 'string') {
    return error.detail
  }

  if (Array.isArray(error.detail) || (typeof error.detail === 'object' && error.detail)) {
    return JSON.stringify(error.detail, null, 2)
  }

  return null
}

function isBackendSetupPendingError(error: unknown) {
  if (!(error instanceof ApiError) || error.status < 500) {
    return false
  }

  const detailText = getApiErrorDetailText(error)?.toLowerCase() ?? ''
  const messageText = error.message.toLowerCase()
  const fullText = `${messageText}\n${detailText}`

  return /(sqlalchemy|pymysql|programmingerror|operationalerror|relation .* does not exist|table .* doesn't exist|base table|undefined table|migration)/.test(fullText)
}

function getUsageLimitErrorMessage(error: unknown) {
  if (isBackendSetupPendingError(error)) {
    return '서버 설정이 아직 준비되지 않았어요.'
  }

  if (error instanceof ApiError && error.status >= 500) {
    return '이용 한도 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
  }

  return getApiErrorMessage(error)
}

function getRateLimitErrorMessage(error: unknown) {
  if (isBackendSetupPendingError(error)) {
    return '서버 설정이 아직 준비되지 않았어요.'
  }

  if (error instanceof ApiError && error.status >= 500) {
    return '요청 제한 기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
  }

  return getApiErrorMessage(error)
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
      return '페르소나가 준비되었습니다. 채팅과 음성 통화를 사용할 수 있습니다.'
    case 'PENDING':
      return '페르소나를 만들고 있어요. 잠시 뒤 다시 확인해 주세요.'
    case 'FAILED':
      return '페르소나를 만들지 못했어요. 잠시 후 다시 시도해 주세요.'
    default:
      return '알 수 없는 페르소나 상태입니다.'
  }
}

function PersonaStatusBadge({ status }: { status: PersonaStatus }) {
  return <span className={`persona-status-badge persona-status-badge--${status.toLowerCase()}`}>{getDisplayLabel(status)}</span>
}

function isVoiceProfileReadyForCall(profile: PersonaVoiceProfileResponse | null | undefined) {
  return (
    profile?.status === 'READY' &&
    (profile.review_status === 'USER_CONFIRMED' || profile.review_status === 'ADMIN_APPROVED')
  )
}

function getVoiceProfileStatusMessage(profile: PersonaVoiceProfileResponse | null) {
  if (!profile) {
    return '이 페르소나의 음성 프로필이 아직 없습니다.'
  }

  switch (profile.status) {
    case 'READY':
      return isVoiceProfileReadyForCall(profile)
        ? '음성 프로필이 준비되고 확인되었습니다. 음성 통화를 사용할 수 있습니다.'
        : '음성 프로필은 준비되었지만 사용자 또는 관리자 확인이 필요합니다.'
    case 'NEEDS_MORE_SAMPLES':
      return '사용하려면 음성 샘플이 더 필요합니다.'
    case 'FAILED':
      return profile.error_message ?? '음성 프로필 생성에 실패했습니다.'
    case 'PROCESSING':
      return '음성 프로필을 처리 중입니다.'
    case 'PENDING':
      return '음성 프로필이 대기 중입니다.'
    case 'REVOKED':
      return '음성 프로필이 철회되었습니다.'
    default:
      return '음성 프로필 상태를 확인할 수 없습니다.'
  }
}

function VoiceProfileStatusBadge({ status }: { status?: VoiceProfileStatus | null }) {
  return <span className={`persona-status-badge persona-status-badge--${(status ?? 'pending').toLowerCase()}`}>{getDisplayLabel(status)}</span>
}

function getSenderLabel(senderType: SenderType) {
  switch (senderType) {
    case 'USER':
      return '사용자'
    case 'PERSONA':
      return '페르소나'
    case 'SYSTEM':
      return '시스템'
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
    <AppShell title="기억 대상" subtitle="등록한 대상을 확인하고 다음 작업으로 이어갈 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">기억 대상 목록</span>
            <h1>기억 대상 목록</h1>
            <p>등록된 기억 대상을 한눈에 확인할 수 있습니다.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        {isLoading && <TargetStateMessage title="기억 대상을 불러오는 중" message="대상 목록을 불러오고 있어요." />}

        {!isLoading && errorMessage && (
          <TargetStateMessage
            title={isPermissionError ? '권한 없음' : '기억 대상 목록을 불러오지 못했습니다'}
            message={isPermissionError ? '이 대상 목록을 볼 권한이 없어요.' : errorMessage}
          />
        )}

        {!isLoading && !errorMessage && targets.length === 0 && (
          <TargetStateMessage
            action={{ href: '/targets/new', label: '기억 대상 만들기' }}
            title="아직 기억 대상이 없습니다"
            message="미디어, 동의, 입증, 페르소나 흐름을 준비하려면 첫 기억 대상을 만들어 주세요."
          />
        )}

        {!isLoading && !errorMessage && targets.length > 0 && (
          <>
            <section className="domain-page__metrics" aria-label="기억 대상 요약">
              <article>
                <span>전체</span>
                <strong>{total}</strong>
              </article>
              <article>
                <span>불러옴</span>
                <strong>{targets.length}</strong>
              </article>
              <article>
                <span>준비 상태</span>
                <strong></strong>
              </article>
            </section>

            <section className="target-card-grid" aria-label="기억 대상 카드">
              {targets.map((target) => (
                <article className="target-card" key={target.id}>
                  <div className="target-card__avatar">
                    <TargetImage target={target} />
                  </div>
                  <div className="target-card__body">
                    <div className="target-card__title-row">
                      <h2>{target.name}</h2>
                      <span>{getDisplayLabel(target.target_type)}</span>
                    </div>
                    {target.description && <p>{target.description}</p>}
                    <dl>
                      <div>
                        <dt>최근 수정</dt>
                        <dd>{formatDateTime(target.updated_at)}</dd>
                      </div>
                      <div>
                        <dt>상태</dt>
          <dd>{target.is_deleted ? '삭제됨' : '사용 중'}</dd>
                      </div>
                    </dl>
                    <a href={`/targets/detail?target_id=${target.id}`}>상세 보기</a>
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
    <AppShell title="대상 추가하기" subtitle="기억을 남길 사람의 기본 정보를 입력해 주세요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">대상 추가</span>
            <h1>대상 추가하기</h1>
            <p>이름과 관계를 입력하면 바로 다음 단계로 이동할 수 있어요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <form className="target-form" onSubmit={handleSubmit}>
          <div className="target-form__field">
                <label htmlFor="target-name">이름</label>
            <input
              id="target-name"
              minLength={1}
              maxLength={255}
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
              value={name}
            />
            <p className="target-form__helper">필수 항목입니다. 1~255자로 입력하세요.</p>
          </div>

          <div className="target-form__field">
                <label htmlFor="target-description">설명</label>
            <textarea
              id="target-description"
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              value={description}
            />
            <p className="target-form__helper">선택 항목이에요.</p>
          </div>

          <div className="target-form__field">
            <label htmlFor="target-type">관계</label>
            <select id="target-type" onChange={(event) => setTargetType(event.target.value as TargetType)} value={targetType}>
              {targetTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {getDisplayLabel(option)}
                </option>
              ))}
            </select>
            <p className="target-form__helper">가장 가까운 관계를 선택해 주세요.</p>
          </div>

          {errorMessage && (
            <p className="target-form__error" role="alert">
              {isPermissionError ? '이 기억 대상을 만들 권한이 없습니다.' : errorMessage}
            </p>
          )}

          <div className="target-form__actions">
            <a href="/targets">목록으로 돌아가기</a>
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? '추가 중...' : '대상 추가하기'}
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
  const [errorMessage, setErrorMessage] = useState<string | null>(() => (targetId ? null : '대상을 먼저 선택해 주세요.'))
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
      setNotice('대상 정보를 저장했어요.')
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!targetId || !window.confirm('이 대상을 삭제할까요?')) {
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
      setErrorMessage('관계 입증이 승인된 뒤에 페르소나를 만들 수 있어요.')
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
    <AppShell title="대상 정보" subtitle="대상 정보를 수정하고 준비 상태를 확인할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">기억 대상 상세</span>
            <h1>기억 대상 상세</h1>
            <p>기억 대상의 기본 정보와 준비 상태를 확인합니다.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">준비 상태</span>
        </header>

        {isLoading && <TargetStateMessage title="대상 정보를 불러오는 중" message="잠시만 기다려 주세요." />}

        {!isLoading && errorMessage && !target && (
          <TargetStateMessage
            action={{ href: '/targets', label: '목록으로 돌아가기' }}
            title={isPermissionError ? '권한 없음' : '기억 대상 상세를 불러오지 못했습니다'}
            message={isPermissionError ? '이 대상을 볼 권한이 없어요.' : errorMessage}
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
                  <dt>관계</dt>
                  <dd>{getDisplayLabel(target.target_type)}</dd>
                </div>
                <div>
                  <dt>프로필 사진</dt>
                  <dd>{target.profile_image_path ? '등록됨' : '없음'}</dd>
                </div>
                <div>
                  <dt>상태</dt>
              <dd>{target.is_deleted ? '삭제됨' : '사용 중'}</dd>
                </div>
                {target.media_count !== undefined && (
                  <div>
                    <dt>등록한 사진·음성</dt>
                    <dd>{target.media_count}</dd>
                  </div>
                )}
                {target.has_persona !== undefined && (
                  <div>
                    <dt>페르소나</dt>
                    <dd>{target.has_persona ? '만들어짐' : '아직 없음'}</dd>
                  </div>
                )}
                <div>
                  <dt>등록일</dt>
                  <dd>{formatDateTime(target.created_at)}</dd>
                </div>
                <div>
                  <dt>최근 수정</dt>
                  <dd>{formatDateTime(target.updated_at)}</dd>
                </div>
              </dl>
            </article>

            <form className="target-form" onSubmit={handleUpdate}>
              <section className="target-api-state">
                <h2>페르소나 준비 조건</h2>
                {gateErrorMessage && <p role="alert">{gateErrorMessage}</p>}
                <dl>
                  <div>
                    <dt>입증</dt>
                    <dd>{getLatestApprovedVerification(verificationRequests) ? '승인됨' : '승인 필요'}</dd>
                  </div>
                  <div>
                    <dt>페르소나 동의</dt>
                    <dd>{hasPersonaCreationConsent(consents) ? '동의 완료' : '동의 없음 또는 철회됨'}</dd>
                  </div>
                </dl>
                <p>
                  페르소나를 만들려면 관계 입증 승인이 필요해요. 승인 후 다시 진행해 주세요.</p>
                <div className="target-form__actions">
          <a href={`/compliance/verification?target_id=${target.id}`}>관계 입증 요청 보기</a>
          <a href={`/compliance/consent?target_id=${target.id}`}>동의 기록 보기</a>
                </div>
              </section>

              <div className="target-form__field">
                <label htmlFor="detail-target-name">이름</label>
                <input
                  id="detail-target-name"
                  onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
                  required
                  type="text"
                  value={formValues.name}
                />
              </div>

              <div className="target-form__field">
                <label htmlFor="detail-target-description">설명</label>
                <textarea
                  id="detail-target-description"
                  onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
                  rows={5}
                  value={formValues.description}
                />
              </div>

              <div className="target-form__field">
                <label htmlFor="detail-target-type">관계</label>
                <select
                  id="detail-target-type"
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, target_type: event.target.value as TargetType }))
                  }
                  value={formValues.target_type}
                >
                  {targetTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {getDisplayLabel(option)}
                    </option>
                  ))}
                </select>
              </div>

              {notice && <p className="target-form__notice">{notice}</p>}
              {errorMessage && (
                <p className="target-form__error" role="alert">
                  {isPermissionError ? '이 대상을 수정할 권한이 없어요.' : errorMessage}
                </p>
              )}

              <div className="target-form__actions">
                <a href="/targets">목록으로 돌아가기</a>
                <button disabled={isSaving} type="submit">
                  {isSaving ? '저장 중...' : '변경사항 저장'}
                </button>
                <button disabled={isDeleting} onClick={handleDelete} type="button">
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
                <button
                  disabled={isCreatingPersona || !getLatestApprovedVerification(verificationRequests)}
                  onClick={handleCreatePersona}
                  type="button"
                >
                  {isCreatingPersona ? '페르소나를 만들고 있어요...' : '페르소나 만들기'}
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
  const fileUrl = toPlayableFileUrl(media.file_api_url ?? media.file_path)

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
      setErrorMessage('대상을 먼저 선택해 주세요.')
      return
    }

    setActiveTargetId(parsedTargetId)
    void loadMedia(parsedTargetId)
  }

  async function handleUpload(mediaType: MediaType) {
    if (!activeTargetId) {
      setErrorMessage('대상을 먼저 선택해 주세요.')
      return
    }

    const file = mediaType === 'image' ? imageFile : voiceFile

    if (!file) {
      setErrorMessage(mediaType === 'image' ? '사진 파일을 선택해 주세요.' : '음성 파일을 선택해 주세요.')
      return
    }

    setUploadingMediaType(mediaType)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const response = await mediaService.uploadTargetMedia(activeTargetId, mediaType, file)
      setNotice(response.message ?? '파일을 올렸어요.')
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
    if (!activeTargetId || !window.confirm('이 파일을 삭제할까요?')) {
      return
    }

    setDeletingMediaId(mediaId)
    setErrorMessage(null)
    setNotice(null)
    setIsPermissionError(false)

    try {
      const response = await mediaService.deleteMedia(mediaId)
      setNotice(response.message ?? '파일을 삭제했어요.')
      await loadMedia(activeTargetId)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setDeletingMediaId(null)
    }
  }

  void handleTargetSubmit

  return (
    <AppShell title="사진·음성 올리기" subtitle="대상을 선택한 뒤 사진과 음성을 등록할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">사진·음성 올리기</span>
            <h1>사진·음성 올리기</h1>
            <p>대상에 연결할 사진과 음성을 올려 주세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <TargetSelector
          selectedId={activeTargetId}
          title="자료를 올릴 대상을 선택해 주세요"
          onSelect={(target) => {
            setTargetIdInput(String(target.id))
            setActiveTargetId(target.id)
            void loadMedia(target.id)
          }}
        />

        {activeTargetId && (
          <section className="target-media-upload-grid" aria-label="사진·음성 올리기">
            <article className="target-media-upload-card">
              <h2>사진 업로드</h2>
              <div className="target-form__field">
                <label htmlFor="target-image-file">파일</label>
                <input
                  accept="image"
                  id="target-image-file"
                  onChange={(event) => handleImageFileChange(event.target.files?.[0] ?? null)}
                  type="file"
                />
                <p className="target-form__helper">jpg, png 파일을 권장해요.</p>
              </div>
              {imagePreviewUrl && (
                <div className="target-media-local-preview">
                  <img alt={imageFile?.name ?? '선택한 사진 미리보기'} src={imagePreviewUrl} />
                </div>
              )}
              <button disabled={uploadingMediaType === 'image'} onClick={() => void handleUpload('image')} type="button">
                {uploadingMediaType === 'image' ? '업로드 중...' : '사진 업로드'}
              </button>
            </article>

            <article className="target-media-upload-card">
              <h2>음성 업로드</h2>
              <div className="target-form__field">
                <label htmlFor="target-voice-file">파일</label>
                <input
                  accept="audio"
                  id="target-voice-file"
                  onChange={(event) => handleVoiceFileChange(event.target.files?.[0] ?? null)}
                  type="file"
                />
                <p className="target-form__helper">mp3, wav 파일을 권장해요.</p>
              </div>
              {voicePreviewUrl && (
                <div className="target-media-local-audio">
                  <audio controls preload="metadata" src={voicePreviewUrl} />
                </div>
              )}
              <button disabled={uploadingMediaType === 'voice'} onClick={() => void handleUpload('voice')} type="button">
                {uploadingMediaType === 'voice' ? '업로드 중...' : '음성 업로드'}
              </button>
            </article>
          </section>
        )}

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && (
          <p className="target-form__error" role="alert">
            {isPermissionError ? '이 대상의 자료를 볼 권한이 없어요.' : errorMessage}
          </p>
        )}

        {isLoading && <TargetStateMessage title="미디어를 불러오는 중" message="이 대상의 미디어 파일을 불러오고 있습니다." />}

        {!isLoading && activeTargetId && !errorMessage && mediaItems.length === 0 && (
          <TargetStateMessage
            title="아직 미디어가 없습니다"
            message="이 기억 대상에 연결할 사진 또는 음성 파일을 업로드하세요."
          />
        )}

        {!isLoading && mediaItems.length > 0 && (
          <section className="target-media-grid" aria-label="기억 대상 미디어 목록">
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
                      <dt>파일 형식</dt>
                      <dd>{media.mime_type}</dd>
                    </div>
                    <div>
                      <dt>파일 크기</dt>
                      <dd>{formatFileSize(media.file_size)}</dd>
                    </div>
                    <div>
                      <dt>재생 길이(초)</dt>
          <dd>{media.duration_seconds ?? '없음'}</dd>
                    </div>
                    <div>
                      <dt>상태</dt>
                    <dd>{media.is_deleted ? '삭제됨' : '사용 중'}</dd>
                    </div>
                    <div>
                      <dt>등록일</dt>
                      <dd>{formatDateTime(media.created_at)}</dd>
                    </div>
                  </dl>
                  <button disabled={deletingMediaId === media.id} onClick={() => void handleDelete(media.id)} type="button">
                    {deletingMediaId === media.id ? '삭제 중...' : '파일 삭제'}
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
          <h2>{persona.persona_name ?? `페르소나 ${persona.id}`}</h2>
          <PersonaStatusBadge status={currentStatus} />
        </div>
        <p>{getPersonaStatusMessage(currentStatus)}</p>
        <dl>
          <div>
            <dt>연결 대상</dt>
            <dd>{persona.target_id ? '연결됨' : '없음'}</dd>
          </div>
          <div>
            <dt>이름</dt>
            <dd>{persona.persona_name ?? '없음'}</dd>
          </div>
          <div>
            <dt>말투</dt>
            <dd>{persona.speaking_style ?? '없음'}</dd>
          </div>
          <div>
            <dt>성격 요약</dt>
            <dd>{persona.personality_summary ?? '없음'}</dd>
          </div>
          <div>
            <dt>기억 요약</dt>
            <dd>{persona.memory_summary ?? '없음'}</dd>
          </div>
          <div>
            <dt>음성 프로필</dt>
            <dd>{persona.is_voice_profile_created ? '준비됨' : '아직 없음'}</dd>
          </div>
          <div>
            <dt>동의 상태</dt>
            <dd>{persona.is_consent_required ? '동의 필요' : '동의 확인됨'}</dd>
          </div>
          <div>
            <dt>등록일</dt>
            <dd>{formatDateTime(persona.created_at)}</dd>
          </div>
          <div>
            <dt>최근 수정</dt>
            <dd>{formatDateTime(persona.updated_at)}</dd>
          </div>
        </dl>
      </article>

      <aside className="persona-action-card">
        <h2>작업</h2>
        <p>{isReady ? '대화가 가능한 상태예요. 음성 대화를 시작하려면 음성 프로필 확인도 필요해요.' : '아직 준비 중이라 대화 기능을 사용할 수 없어요.'}</p>
        <div className="persona-action-card__actions">
          <a aria-disabled={!isReady} href={isReady ? `/persona-chat?persona_id=${persona.id}` : undefined}>
            대화 시작하기</a>
          <a aria-disabled={!canUseVoiceCall} href={canUseVoiceCall ? `/persona-voice-call?persona_id=${persona.id}` : undefined}>
            음성 대화</a>
          <a href={`/personas/voice-profile?persona_id=${persona.id}`}>음성 프로필</a>
          {onRefreshStatus && (
            <button disabled={isRefreshingStatus} onClick={onRefreshStatus} type="button">
              {isRefreshingStatus ? '새로고침 중...' : '상태 새로고침'}
            </button>
          )}
        </div>

        <section className="target-api-state">
          <h2>음성 프로필 조건</h2>
          <p>{getVoiceProfileStatusMessage(persona.voice_profile ?? null)}</p>
          {persona.voice_profile ? (
          <dl>
            <div>
              <dt>음성 프로필</dt>
              <dd>등록됨</dd>
            </div>
            <div>
              <dt>음성 프로필 상태</dt>
              <dd>{getDisplayLabel(persona.voice_profile.status)}</dd>
            </div>
            <div>
              <dt>확인 상태</dt>
              <dd>{getDisplayLabel(persona.voice_profile.review_status)}</dd>
            </div>
            <div>
              <dt>품질 점수</dt>
              <dd>{persona.voice_profile.quality_score ?? '없음'}</dd>
            </div>
          </dl>
          ) : (
            <p>음성 프로필이 아직 없습니다.</p>
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
      setErrorMessage('대상을 먼저 선택해 주세요.')
      return
    }

    void loadConsents(targetId)
  }

  async function handleCreateConsent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetId = Number(targetIdInput)

    if (!Number.isInteger(targetId) || targetId <= 0) {
      setErrorMessage('대상을 먼저 선택해 주세요.')
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
      setNotice('동의 기록을 저장했어요.')
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
      setNotice('동의가 철회되었습니다.')
      await loadConsents(activeTargetId)
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setRevokingConsentId(null)
    }
  }

  void handleSelectTarget

  return (
    <AppShell title="동의 관리" subtitle="대상별 동의 상태를 확인하고 새 동의를 기록할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">동의 관리</span>
            <h1>동의 기록</h1>
            <p>필요한 동의 항목을 확인하고 관리해 주세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <TargetSelector
          selectedId={activeTargetId}
          title="동의를 관리할 대상을 선택해 주세요"
          onSelect={(target) => {
            setTargetIdInput(String(target.id))
            void loadConsents(target.id)
          }}
        />

        <form className="target-form" onSubmit={handleCreateConsent}>
          <div className="target-form__field">
            <label htmlFor="consent-type">동의 항목</label>
            <select id="consent-type" onChange={(event) => setConsentType(event.target.value as ConsentType)} value={consentType}>
              {consentTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {getDisplayLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="target-form__field">
            <label htmlFor="consent-version">동의 버전</label>
            <input id="consent-version" onChange={(event) => setConsentVersion(event.target.value)} value={consentVersion} />
          </div>

          <div className="target-form__field">
            <label htmlFor="consent-text">동의 안내 문구</label>
            <textarea id="consent-text" onChange={(event) => setConsentTextSnapshot(event.target.value)} rows={4} value={consentTextSnapshot} />
          </div>

          <div className="target-form__field">
            <label htmlFor="consent-details">상세 내용</label>
            <textarea id="consent-details" onChange={(event) => setDetails(event.target.value)} rows={3} value={details} />
          </div>

          <label className="target-form__checkbox">
            <input checked={isConsented} onChange={(event) => setIsConsented(event.target.checked)} type="checkbox" />
            동의함</label>

          {notice && <p className="target-form__notice">{notice}</p>}
          {errorMessage && (
            <p className="target-form__error" role="alert">
              {isPermissionError ? errorMessage : errorMessage}
            </p>
          )}

          <div className="target-form__actions">
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? '저장 중...' : '동의 기록 저장'}
            </button>
          </div>
        </form>

        <section className="target-card-grid" aria-label="동의 기록">
          {consents.map((consent) => (
            <article className="target-card" key={consent.id}>
              <div className="target-card__body">
                <div className="target-card__title-row">
                  <h2>{getDisplayLabel(consent.consent_type)}</h2>
                  <span>{consent.revoked_at ? '철회됨' : consent.is_consented ? '동의 완료' : '미동의'}</span>
                </div>
                <dl>
                  <div>
                    <dt>동의 버전</dt>
                    <dd>{consent.consent_version}</dd>
                  </div>
                  <div>
                    <dt>동의한 시각</dt>
          <dd>{consent.agreed_at ? formatDateTime(consent.agreed_at) : '없음'}</dd>
                  </div>
                  <div>
                    <dt>철회 시각</dt>
          <dd>{consent.revoked_at ? formatDateTime(consent.revoked_at) : '없음'}</dd>
                  </div>
                </dl>
                {consent.details && <p>{consent.details}</p>}
                <button disabled={Boolean(consent.revoked_at) || revokingConsentId === consent.id} onClick={() => void handleRevoke(consent.id)} type="button">
                  {revokingConsentId === consent.id ? '철회 중...' : '동의 철회'}
                </button>
              </div>
            </article>
          ))}
        </section>

        {activeTargetId && consents.length === 0 && !isLoading && (
          <TargetStateMessage title="동의 기록이 없습니다" message="이 대상에 등록된 동의 기록이 아직 없어요." />
        )}
      </main>
    </AppShell>
  )
}

function getVerificationStatusMessage(status: VerificationStatus) {
  switch (status) {
    case 'APPROVED':
      return '승인되어 페르소나와 음성 대화를 사용할 수 있어요.'
    case 'PENDING':
      return '관리자 검토를 기다리고 있습니다.'
    case 'NEED_MORE_INFO':
      return '관리자가 추가 정보를 요청했어요. 상세 내용을 확인해 주세요.'
    case 'REJECTED':
      return '요청이 반려되었어요. 안내 사유를 확인해 주세요.'
    case 'EXPIRED':
      return '유효 기간이 지났어요. 다시 요청해 주세요.'
    case 'REVOKED':
      return '철회되었습니다. 새 입증 요청을 제출하세요.'
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
      setErrorMessage('대상을 먼저 선택해 주세요.')
      return
    }

    void loadRequests(targetId)
  }

  async function handleSubmitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetId = Number(targetIdInput)

    if (!Number.isInteger(targetId) || targetId <= 0) {
      setErrorMessage('대상을 먼저 선택해 주세요.')
      return
    }

    if (!file) {
      setErrorMessage('입증 자료 파일을 선택해 주세요.')
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
      setNotice('관계 입증 요청을 보냈어요.')
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

  void handleSelectTarget

  return (
    <AppShell title="관계 입증 요청" subtitle="대상별 관계 입증 요청 상태를 확인할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">관계 입증</span>
            <h1>관계 입증 요청</h1>
            <p>입증 자료를 제출하고 검토 상태를 확인해 주세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">승인 필요</span>
        </header>

        <TargetSelector
          selectedId={activeTargetId}
          title="관계 입증할 대상을 선택해 주세요"
          onSelect={(target) => {
            setTargetIdInput(String(target.id))
            void loadRequests(target.id)
          }}
        />

        <form className="target-form" onSubmit={handleSubmitVerification}>
          <div className="target-form__field">
            <label htmlFor="verification-type">입증 방법</label>
            <select
              id="verification-type"
              onChange={(event) => setVerificationType(event.target.value as VerificationType)}
              value={verificationType}
            >
              {verificationTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {getDisplayLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="target-form__field">
            <label htmlFor="applicant-note">추가 설명</label>
            <textarea id="applicant-note" onChange={(event) => setApplicantNote(event.target.value)} rows={4} value={applicantNote} />
          </div>

          <div className="target-form__field">
            <label htmlFor="verification-file">파일</label>
            <input id="verification-file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required type="file" />
            <p className="target-form__helper">파일과 설명을 함께 제출하면 검토에 도움이 돼요.</p>
          </div>

          {notice && <p className="target-form__notice">{notice}</p>}
          {errorMessage && (
            <p className="target-form__error" role="alert">
              {isPermissionError ? errorMessage : errorMessage}
            </p>
          )}

          <div className="target-form__actions">
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? '요청 중...' : '관계 입증 요청'}
            </button>
          </div>
        </form>

        <section className="target-card-grid" aria-label="입증 요청">
          {requests.map((request) => (
            <article className="target-card" key={request.id}>
              <div className="target-card__body">
                <div className="target-card__title-row">
                  <h2>{getDisplayLabel(request.verification_type)}</h2>
                  <span>{getDisplayLabel(request.status)}</span>
                </div>
                <p>{getVerificationStatusMessage(request.status)}</p>
                <dl>
                  <div>
                    <dt>제출한 파일</dt>
                    <dd>{request.original_filename}</dd>
                  </div>
                  <div>
                    <dt>파일 형식</dt>
                    <dd>{request.mime_type}</dd>
                  </div>
                  <div>
                    <dt>파일 크기</dt>
                    <dd>{formatFileSize(request.file_size)}</dd>
                  </div>
                  <div>
                    <dt>요청일</dt>
                    <dd>{formatDateTime(request.created_at)}</dd>
                  </div>
                </dl>
                {request.admin_note && <p>검토 메모: {request.admin_note}</p>}
                {request.rejection_reason && <p>안내 사유: {request.rejection_reason}</p>}
                <button onClick={() => void handleOpenDetail(request.id)} type="button">
                  상세 보기</button>
              </div>
            </article>
          ))}
        </section>

        {activeTargetId && requests.length === 0 && !isLoading && (
          <TargetStateMessage title="관계 입증 요청이 없어요" message="페르소나를 만들려면 관계 입증 승인이 필요해요." />
        )}

        {selectedRequest && (
          <section className="target-detail-card">
            <h2>입증 상세</h2>
            <dl>
              <div>
                <dt>상태</dt>
                <dd>{getDisplayLabel(selectedRequest.status)}</dd>
              </div>
              <div>
                <dt>추가 설명</dt>
                <dd>{selectedRequest.applicant_note ?? '없음'}</dd>
              </div>
              <div>
                <dt>관리자 메모</dt>
                <dd>{selectedRequest.admin_note ?? '없음'}</dd>
              </div>
              <div>
                <dt>검토 시각</dt>
                <dd>{selectedRequest.reviewed_at ? formatDateTime(selectedRequest.reviewed_at) : '없음'}</dd>
              </div>
              <div>
                <dt>유효 기한</dt>
                <dd>{selectedRequest.expires_at ? formatDateTime(selectedRequest.expires_at) : '없음'}</dd>
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
      setErrorMessage('대상을 먼저 선택해 주세요.')
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
    <AppShell title="페르소나 만들기" subtitle="대상을 선택해 새로운 페르소나를 만들 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">페르소나 만들기</span>
            <h1>페르소나 만들기</h1>
            <p>대상별로 페르소나를 만들고 바로 대화를 시작할 수 있어요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">대상</span>
        </header>

        <TargetSelector
          selectedId={Number(targetIdInput) || null}
          title="페르소나를 만들 대상을 선택해 주세요"
          onSelect={(target) => setTargetIdInput(String(target.id))}
        />

        <div className="target-form__actions">
          <a href="/targets">대상 목록 보기</a>
          <button disabled={isCreating || !targetIdInput} onClick={(event) => void handleCreatePersona(event as unknown as FormEvent<HTMLFormElement>)} type="button">
            {isCreating ? '만드는 중...' : '페르소나 만들기'}
          </button>
        </div>

        {errorMessage && (
          <p className="target-form__error" role="alert">
            {isPermissionError ? '이 기억 대상의 페르소나를 만들 권한이 없습니다.' : errorMessage}
          </p>
        )}

        {!persona && !errorMessage && (
          <TargetStateMessage
            title="목록 서비스 없음"
            message="먼저 대상을 선택하면 페르소나를 만들 수 있어요."
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
  const [errorMessage, setErrorMessage] = useState<string | null>(() => (personaId ? null : '페르소나를 먼저 선택해 주세요.'))
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
    <AppShell title="페르소나 상세" subtitle="페르소나 상태와 준비 정보를 확인할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">페르소나 상세</span>
            <h1>페르소나 상세</h1>
            <p>현재 페르소나의 상태와 음성 프로필 준비 여부를 확인해 주세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">페르소나</span>
        </header>

        {isLoading && <TargetStateMessage title="페르소나를 불러오는 중" message="잠시만 기다려 주세요." />}

        {!isLoading && errorMessage && !persona && (
          <TargetStateMessage
            action={{ href: '/personas', label: '페르소나 만들기로 이동' }}
            title={isPermissionError ? '권한 없음' : '페르소나 상세를 불러오지 못했습니다'}
            message={isPermissionError ? '이 페르소나를 볼 권한이 없어요.' : errorMessage}
          />
        )}

        {errorMessage && persona && (
          <p className="target-form__error" role="alert">
            {isPermissionError ? '이 페르소나 상태를 조회할 권한이 없어요.' : errorMessage}
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
  const audioPath = message.audio_api_url ?? message.audio_file_path
  const audioUrl = audioPath ? toPlayableFileUrl(audioPath) : null

  return (
    <article className={`persona-chat-message persona-chat-message--${message.sender_type.toLowerCase()}`}>
      <header>
        <strong>{getSenderLabel(message.sender_type)}</strong>
        <span>{getDisplayLabel(message.message_type)}</span>
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
  const [personaIdInput] = useState(() => (initialPersonaId ? String(initialPersonaId) : ''))
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
      setErrorMessage('페르소나를 먼저 선택해 주세요.')
      return
    }

    setActivePersonaId(personaId)
    void loadChats(personaId, null)
  }

  async function handleCreateChat() {
    if (!activePersonaId) {
      setErrorMessage('페르소나를 먼저 선택해 주세요.')
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
      setSendErrorMessage('대화방을 먼저 선택해 주세요.')
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

  void handlePersonaSubmit

  return (
    <AppShell title="대화" subtitle="페르소나와의 대화를 시작하고 이어갈 수 있어요.">
      <main className="domain-page target-api-page persona-chat-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">대화</span>
            <h1>대화</h1>
            <p>대화방을 만들고 메시지를 주고받아 보세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">채팅 서비스</span>
        </header>

        {!activePersonaId && (
          <TargetStateMessage
            action={{ href: '/personas', label: '페르소나 선택하기' }}
            title="대화를 시작할 페르소나가 필요해요"
            message="먼저 페르소나를 선택하거나 새로 만들어 주세요."
          />
        )}

        {errorMessage && (
          <p className="target-form__error" role="alert">
            {isPermissionError ? '이 대화 정보를 볼 권한이 없어요.' : errorMessage}
          </p>
        )}

        {activePersonaId && (
          <section className="persona-chat-layout">
            <aside className="persona-chat-sidebar">
              <h2>채팅방</h2>
              <div className="target-form__field">
                <label htmlFor="chat-title">제목</label>
                <input
                  id="chat-title"
                  maxLength={255}
                  onChange={(event) => setChatTitle(event.target.value)}
                  placeholder="선택 제목"
                  type="text"
                  value={chatTitle}
                />
              </div>
              <button disabled={isCreatingChat} onClick={() => void handleCreateChat()} type="button">
                {isCreatingChat ? '만드는 중...' : '새 대화 시작'}
              </button>

              {isLoadingChats && <p className="persona-chat-empty">채팅방을 불러오는 중...</p>}

              {!isLoadingChats && chats.length === 0 && (
                <p className="persona-chat-empty">아직 채팅방이 없습니다. 새 채팅을 시작해 메시지를 보내세요.</p>
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
                      <strong>{chat.title ?? `대화 ${chat.id}`}</strong>
                      <span>{formatDateTime(chat.updated_at)}</span>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="persona-chat-thread">
              <div className="persona-chat-thread__header">
                <h2>메시지</h2>
                <span>{activeChatId ? `대화방 ${activeChatId}` : '선택된 채팅 없음'}</span>
              </div>

              {isLoadingMessages && <p className="persona-chat-empty">메시지를 불러오는 중...</p>}

              {!isLoadingMessages && activeChatId && messages.length === 0 && (
                <p className="persona-chat-empty">아직 메시지가 없습니다. 첫 텍스트 메시지를 보내세요.</p>
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
                      다시 시도</button>
                  )}
                </div>
              )}

              <form className="persona-chat-composer" onSubmit={handleSendMessage}>
                <label htmlFor="persona-chat-message">내용</label>
                <textarea
                  disabled={!activeChatId || isSending}
                  id="persona-chat-message"
                  onChange={(event) => setMessageContent(event.target.value)}
                  placeholder="텍스트 메시지를 입력하세요"
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
                  음성 응답도 받기</label>
                <button disabled={!activeChatId || isSending || !messageContent.trim()} type="submit">
                  {isSending ? '보내는 중...' : '메시지 보내기'}
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
        <h2>음성 프로필</h2>
        <VoiceProfileStatusBadge status={profile.status} />
      </div>
      <p>{getVoiceProfileStatusMessage(profile)}</p>
      <dl>
        <div>
          <dt>페르소나 연결</dt>
          <dd>{profile.persona_id ? '연결됨' : '없음'}</dd>
        </div>
        <div>
          <dt>대상 연결</dt>
          <dd>{profile.target_id ? '연결됨' : '없음'}</dd>
        </div>
        <div>
          <dt>확인 상태</dt>
          <dd>{getDisplayLabel(profile.review_status)}</dd>
        </div>
        <div>
          <dt>참고 음성 수</dt>
          <dd>{profile.reference_audio_count ?? '없음'}</dd>
        </div>
        <div>
          <dt>참고 음성 길이(초)</dt>
          <dd>{profile.reference_audio_total_seconds ?? '없음'}</dd>
        </div>
        <div>
          <dt>참고 음성 길이(ms)</dt>
          <dd>{profile.total_reference_duration_ms ?? '없음'}</dd>
        </div>
        <div>
          <dt>품질 점수</dt>
          <dd>{profile.quality_score ?? '없음'}</dd>
        </div>
        <div>
          <dt>유사도 점수</dt>
          <dd>{profile.similarity_score ?? '없음'}</dd>
        </div>
        <div>
          <dt>잡음 점수</dt>
          <dd>{profile.noise_score ?? '없음'}</dd>
        </div>
        <div>
          <dt>음성 모델</dt>
          <dd>{profile.voice_provider ?? '없음'}</dd>
        </div>
        <div>
          <dt>음성 이름</dt>
          <dd>{profile.voice_id ?? '없음'}</dd>
        </div>
        <div>
          <dt>표시 이름</dt>
          <dd>{profile.voice_name ?? '없음'}</dd>
        </div>
        <div>
          <dt>검토 메모</dt>
          <dd>{profile.review_note ?? '없음'}</dd>
        </div>
        <div>
          <dt>안내</dt>
          <dd>{profile.error_message ?? '없음'}</dd>
        </div>
        <div>
          <dt>생성일</dt>
          <dd>{formatDateTime(profile.created_at)}</dd>
        </div>
        <div>
          <dt>최근 수정</dt>
          <dd>{formatDateTime(profile.updated_at)}</dd>
        </div>
      </dl>

      {sampleAudioUrl && (
        <div className="target-media-local-audio">
          <p>샘플 음성</p>
          <audio controls preload="metadata" src={sampleAudioUrl} />
        </div>
      )}

      {referenceAudioUrl && (
        <div className="target-media-local-audio">
          <p>참고 음성</p>
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
      setErrorMessage('페르소나를 먼저 선택해 주세요.')
      return
    }

    void loadProfile(personaId)
  }

  async function handleCreate() {
    const personaId = getPersonaIdFromInput()

    if (!personaId) {
      setErrorMessage('페르소나를 먼저 선택해 주세요.')
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
      setNotice('음성 프로필 생성이 요청되었습니다.')
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
      setErrorMessage('페르소나를 먼저 선택해 주세요.')
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
      setNotice('음성 프로필 평가가 완료되었습니다.')
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
      setErrorMessage('페르소나를 먼저 선택해 주세요.')
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
      setNotice('음성 프로필 확인이 완료되었습니다.')
    } catch (error) {
      setIsPermissionError(isOwnerOnlyError(error))
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsConfirming(false)
    }
  }

  const canEnterVoiceCall = isVoiceProfileReadyForCall(profile)

  void setPersonaIdInput
  void isCreating
  void isEvaluating
  void handleLoad
  void handleCreate
  void handleEvaluate

  return (
    <AppShell title="음성 프로필" subtitle="음성 프로필 상태를 확인하고 사용자 확인을 진행할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">음성 프로필</span>
            <h1>음성 프로필</h1>
            <p>음성 프로필이 준비되면 음성 대화를 시작할 수 있어요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <form className="target-form" onSubmit={handleConfirm}>
          <div className="target-form__field">
            <label htmlFor="voice-profile-review-note">확인 메모</label>
            <textarea
              id="voice-profile-review-note"
              onChange={(event) => setReviewNote(event.target.value)}
              rows={3}
              value={reviewNote}
            />
            <p className="target-form__helper">필요하면 간단한 메모를 남겨 주세요.</p>
          </div>
          <div className="target-form__actions">
            <button disabled={isConfirming} type="submit">
              {isConfirming ? '확인 중...' : '사용자 확인'}
            </button>
            <a aria-disabled={!canEnterVoiceCall} href={canEnterVoiceCall && activePersonaId ? `/persona-voice-call?persona_id=${activePersonaId}` : undefined}>
              음성 대화</a>
          </div>
        </form>

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && (
          <p className="target-form__error" role="alert">
            {isPermissionError ? errorMessage : errorMessage}
          </p>
        )}

        {isLoading && <TargetStateMessage title="음성 프로필을 불러오는 중" message="잠시만 기다려 주세요." />}

        {!isLoading && activePersonaId && !profile && !errorMessage && (
          <TargetStateMessage title="음성 프로필이 없습니다" message="대상 음성 미디어를 업로드한 뒤 음성 프로필을 만들어 주세요." />
        )}

        {profile && <VoiceProfileDetailCard profile={profile} />}
      </main>
    </AppShell>
  )
}

function getSessionIdFromLocation() {
  const params = new URLSearchParams(window.location.search)
  const value = params.get('session_id') ?? params.get('id') ?? window.location.pathname.split('/').filter(Boolean).at(-1)
  const sessionId = Number(value)

  return Number.isInteger(sessionId) && sessionId > 0 ? sessionId : null
}

function PhotoMemoryPreview({ photoMemory }: { photoMemory: PhotoMemoryResponse }) {
  return <img alt={photoMemory.title} src={toPlayableFileUrl(photoMemory.image_api_url ?? photoMemory.file_path)} />
}

function InterviewSessionCard({ session }: { session: AIInterviewSessionResponse }) {
  return (
    <article className="target-card">
      <div className="target-card__body">
        <div className="target-card__title-row">
          <h2>{session.title ?? `인터뷰 ${session.id}`}</h2>
          <span>{getDisplayLabel(session.status)}</span>
        </div>
        <dl>
          <div>
            <dt>인터뷰 유형</dt>
            <dd>{getDisplayLabel(session.session_type)}</dd>
          </div>
          <div>
            <dt>연결 대상</dt>
            <dd>{session.target_id ? '연결됨' : '없음'}</dd>
          </div>
          <div>
            <dt>사진 기억 연결</dt>
            <dd>{session.photo_memory_id ? '연결됨' : '없음'}</dd>
          </div>
          <div>
            <dt>생성일</dt>
            <dd>{formatDateTime(session.created_at)}</dd>
          </div>
        </dl>
        <div className="target-form__actions">
          <a href={`/interviews/session?session_id=${session.id}`}>인터뷰 보기</a>
          <a href={`/storybooks/create?interview_session_id=${session.id}`}>스토리북에 사용</a>
        </div>
      </div>
    </article>
  )
}

function InterviewListApiPage() {
  const [sessionType, setSessionType] = useState<InterviewType>('SELF_STORY')
  const [title, setTitle] = useState('')
  const [targetId, setTargetId] = useState('')
  const [photoMemoryId, setPhotoMemoryId] = useState('')
  const [createdSession, setCreatedSession] = useState<AIInterviewSessionResponse | null>(null)
  const [photoMemories, setPhotoMemories] = useState<PhotoMemoryResponse[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPhotoMemories, setIsLoadingPhotoMemories] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [photoMemoryErrorMessage, setPhotoMemoryErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    photoMemoryService
      .listPhotoMemories()
      .then((response) => {
        if (isMounted) {
          setPhotoMemories(response)
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setPhotoMemoryErrorMessage(getApiErrorMessage(error))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPhotoMemories(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    const parsedTargetId = targetId ? Number(targetId) : null
    const parsedPhotoMemoryId = photoMemoryId ? Number(photoMemoryId) : null

    try {
      const response = await interviewService.createSession({
        session_type: sessionType,
        title: title || null,
        target_id: Number.isInteger(parsedTargetId) ? parsedTargetId : null,
        photo_memory_id: Number.isInteger(parsedPhotoMemoryId) ? parsedPhotoMemoryId : null,
      })
      setCreatedSession(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell title="인터뷰" subtitle="인터뷰를 만들고 스토리북 재료로 활용할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">인터뷰 목록</span>
            <h1>인터뷰 세션 만들기</h1>
            <p>인터뷰를 만들고 생성된 세션을 스토리북에 연결할 수 있어요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <form className="target-form" onSubmit={handleCreateSession}>
          <div className="target-form__field">
            <label htmlFor="interview-session-type">인터뷰 유형</label>
            <select id="interview-session-type" onChange={(event) => setSessionType(event.target.value as InterviewType)} value={sessionType}>
              {interviewTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {getDisplayLabel(option)}
                </option>
              ))}
            </select>
          </div>
          <div className="target-form__field">
            <label htmlFor="interview-title">제목</label>
            <input id="interview-title" maxLength={255} onChange={(event) => setTitle(event.target.value)} value={title} />
          </div>
          <TargetSelector
            selectedId={Number(targetId) || null}
            title="인터뷰할 대상을 선택해 주세요"
            onSelect={(target) => setTargetId(String(target.id))}
          />
          <div className="target-form__field">
            <label htmlFor="interview-photo-memory-id">연결할 사진 기억 번호</label>
            <input
              id="interview-photo-memory-id"
              inputMode="numeric"
              onChange={(event) => setPhotoMemoryId(event.target.value)}
              type="number"
              value={photoMemoryId}
            />
          </div>

          {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}

          <div className="target-form__actions">
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? '생성 중...' : '세션 생성'}
            </button>
          </div>
        </form>

        {createdSession && <InterviewSessionCard session={createdSession} />}

        <section className="target-api-state">
          <h2>스토리북 소스 선택</h2>
          <p>나중에 스토리북을 만들 소스로 생성된 인터뷰 세션 또는 사진 기억을 선택하세요.</p>
          {createdSession && <a href={`/storybooks/create?interview_session_id=${createdSession.id}`}>생성한 인터뷰 세션 사용</a>}
        </section>

        {isLoadingPhotoMemories && <TargetStateMessage title="사진 기억 소스를 불러오는 중" message="사용 가능한 사진 기억을 불러오고 있습니다." />}
        {photoMemoryErrorMessage && <p className="target-form__error" role="alert">{photoMemoryErrorMessage}</p>}
        {!isLoadingPhotoMemories && photoMemories.length > 0 && (
          <section className="target-card-grid" aria-label="사진 기억 스토리북 소스">
            {photoMemories.map((photoMemory) => (
              <article className="target-card" key={photoMemory.id}>
                <div className="target-card__body">
                  <div className="target-card__title-row">
                    <h2>{photoMemory.title}</h2>
                    <span>사진 기억</span>
                  </div>
                  <p>{photoMemory.description ?? photoMemory.ai_caption ?? '설명이 없습니다.'}</p>
                  <a href={`/storybooks/create?photo_memory_id=${photoMemory.id}`}>스토리북에 사용</a>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </AppShell>
  )
}

function InterviewSessionApiPage() {
  const [initialSessionId] = useState(() => getSessionIdFromLocation())
  const [sessionIdInput, setSessionIdInput] = useState(() => (initialSessionId ? String(initialSessionId) : ''))
  const [session, setSession] = useState<AIInterviewSessionDetailResponse | null>(null)
  const [questionType, setQuestionType] = useState('')
  const [answerQuestionId, setAnswerQuestionId] = useState('')
  const [answerText, setAnswerText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false)
  const [isSavingAnswer, setIsSavingAnswer] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadSession = useCallback(async (sessionId: number) => {
    setIsLoading(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      const response = await interviewService.getSession(sessionId)
      setSession(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialSessionId) {
      return
    }

    const timerId = window.setTimeout(() => {
      void loadSession(initialSessionId)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [initialSessionId, loadSession])

  function getSessionIdFromInput() {
    const sessionId = Number(sessionIdInput)
    return Number.isInteger(sessionId) && sessionId > 0 ? sessionId : null
  }

  function handleLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const sessionId = getSessionIdFromInput()

    if (!sessionId) {
      setErrorMessage('인터뷰 세션을 먼저 선택해 주세요.')
      return
    }

    void loadSession(sessionId)
  }

  async function handleCreateQuestion() {
    const sessionId = getSessionIdFromInput()

    if (!sessionId) {
      setErrorMessage('인터뷰 세션을 먼저 선택해 주세요.')
      return
    }

    setIsCreatingQuestion(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      await interviewService.createQuestion(sessionId, questionType ? { question_type: questionType } : null)
      setNotice('질문을 생성했어요.')
      await loadSession(sessionId)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsCreatingQuestion(false)
    }
  }

  async function handleCreateAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const sessionId = getSessionIdFromInput()
    const questionId = Number(answerQuestionId)

    if (!sessionId || !Number.isInteger(questionId) || questionId <= 0) {
      setErrorMessage('질문을 먼저 선택해 주세요.')
      return
    }

    setIsSavingAnswer(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      await interviewService.createAnswer(sessionId, {
        question_id: questionId,
        answer_text: answerText || null,
        answer_audio_path: null,
      })
      setNotice('답변을 저장했어요.')
      await loadSession(sessionId)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSavingAnswer(false)
    }
  }

  void setSessionIdInput
  void setQuestionType
  void isCreatingQuestion
  void handleLoad
  void handleCreateQuestion

  return (
    <AppShell title="인터뷰 세션" subtitle="질문과 답변을 확인하고 답변을 저장할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">인터뷰 세션</span>
            <h1>인터뷰 세션</h1>
            <p>질문과 답변 기록을 확인해 보세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <form className="target-form" onSubmit={handleCreateAnswer}>
          <div className="target-form__field">
            <label htmlFor="answer-question-id">답변할 질문 번호</label>
            <input
              id="answer-question-id"
              inputMode="numeric"
              onChange={(event) => setAnswerQuestionId(event.target.value)}
              required
              type="number"
              value={answerQuestionId}
            />
          </div>
          <div className="target-form__field">
            <label htmlFor="answer-text">답변 내용</label>
            <textarea id="answer-text" onChange={(event) => setAnswerText(event.target.value)} rows={4} value={answerText} />
          </div>
          <button disabled={isSavingAnswer} type="submit">
            {isSavingAnswer ? '저장 중...' : '답변 저장'}
          </button>
        </form>

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}
        {isLoading && <TargetStateMessage title="세션을 불러오는 중" message="인터뷰 세션 상세를 불러오고 있습니다." />}

        {session && (
          <section className="target-detail-card">
            <div className="target-card__title-row">
              <h2>{session.title ?? `인터뷰 ${session.id}`}</h2>
              <span>{getDisplayLabel(session.status)}</span>
            </div>
            <dl>
              <div>
                <dt>인터뷰 유형</dt>
                <dd>{getDisplayLabel(session.session_type)}</dd>
              </div>
              <div>
                <dt>연결 대상</dt>
                <dd>{session.target_id ? '연결됨' : '없음'}</dd>
              </div>
              <div>
                <dt>사진 기억 연결</dt>
                <dd>{session.photo_memory_id ? '연결됨' : '없음'}</dd>
              </div>
              <div>
                <dt>생성일</dt>
                <dd>{formatDateTime(session.created_at)}</dd>
              </div>
            </dl>
            <a href={`/storybooks/create?interview_session_id=${session.id}`}>이 세션을 스토리북에 사용</a>
          </section>
        )}

        {session?.questions && (
          <section className="target-card-grid" aria-label="인터뷰 질문">
            {session.questions.map((question: AIInterviewQuestionResponse) => (
              <article className="target-card" key={question.id}>
                <div className="target-card__body">
                  <div className="target-card__title-row">
                    <h2>질문 {question.order_index}</h2>
                    <span>{question.question_type ?? '없음'}</span>
                  </div>
                  <p>{question.question_text}</p>
                  <button onClick={() => setAnswerQuestionId(String(question.id))} type="button">
                    이 질문에 답하기</button>
                  {question.answers?.map((answer) => (
                    <dl key={answer.id}>
                      <div>
                        <dt>답변 번호</dt>
                        <dd>{answer.id}</dd>
                      </div>
                      <div>
                        <dt>답변 내용</dt>
                        <dd>{answer.answer_text ?? '없음'}</dd>
                      </div>
                      <div>
                        <dt>답변 음성</dt>
                        <dd>{answer.answer_audio_path ? '등록됨' : '없음'}</dd>
                      </div>
                    </dl>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </AppShell>
  )
}

function PhotoMemoryListApiPage() {
  const [photoMemories, setPhotoMemories] = useState<PhotoMemoryResponse[]>([])
  const [selectedPhotoMemory, setSelectedPhotoMemory] = useState<PhotoMemoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadPhotoMemories = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await photoMemoryService.listPhotoMemories()
      setPhotoMemories(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadPhotoMemories()
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [loadPhotoMemories])

  async function handleLoadDetail(photoMemoryId: number) {
    setErrorMessage(null)
    setNotice(null)

    try {
      const response = await photoMemoryService.getPhotoMemory(photoMemoryId)
      setSelectedPhotoMemory(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  async function handleDelete(photoMemoryId: number) {
    setDeletingId(photoMemoryId)
    setErrorMessage(null)
    setNotice(null)

    try {
      const response = await photoMemoryService.deletePhotoMemory(photoMemoryId)
      setNotice(response.message ?? '사진 기억을 삭제했어요.')
      await loadPhotoMemories()
      if (selectedPhotoMemory?.id === photoMemoryId) {
        setSelectedPhotoMemory(null)
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AppShell title="사진 기억" subtitle="사진 기억을 확인하고 정리할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">사진 기억 목록</span>
            <h1>사진 기억</h1>
            <p>사진 기억 기록은 스토리북 소스로 선택할 수 있습니다.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <div className="target-form__actions">
          <a href="/memories/photos/upload">사진 기억 올리기</a>
          <button disabled={isLoading} onClick={() => void loadPhotoMemories()} type="button">
            새로고침</button>
        </div>

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}
        {isLoading && <TargetStateMessage title="사진 기억을 불러오는 중" message="사진 기억을 불러오고 있습니다." />}
        {!isLoading && photoMemories.length === 0 && <TargetStateMessage title="사진 기억이 없습니다" message="사진으로 스토리북을 만들려면 사진 기억을 업로드하세요." />}

        <section className="target-media-grid" aria-label="사진 기억 목록">
          {photoMemories.map((photoMemory) => (
            <article className="target-media-card" key={photoMemory.id}>
              <div className="target-media-card__preview">
                <PhotoMemoryPreview photoMemory={photoMemory} />
              </div>
              <div className="target-media-card__body">
                <div className="target-card__title-row">
                  <h2>{photoMemory.title}</h2>
                  <span>{photoMemory.mime_type}</span>
                </div>
                <p>{photoMemory.description ?? photoMemory.ai_caption ?? '설명이 없습니다.'}</p>
                <dl>
                  <div>
                    <dt>파일 크기</dt>
                    <dd>{formatFileSize(photoMemory.file_size)}</dd>
                  </div>
                  <div>
                    <dt>촬영 시각</dt>
            <dd>{photoMemory.taken_at ? formatDateTime(photoMemory.taken_at) : '없음'}</dd>
                  </div>
                  <div>
                    <dt>장소</dt>
            <dd>{photoMemory.location ?? '없음'}</dd>
                  </div>
                </dl>
                <div className="target-form__actions">
                  <button onClick={() => void handleLoadDetail(photoMemory.id)} type="button">
                    상세 보기</button>
                  <a href={`/storybooks/create?photo_memory_id=${photoMemory.id}`}>스토리북에 사용</a>
                  <button disabled={deletingId === photoMemory.id} onClick={() => void handleDelete(photoMemory.id)} type="button">
                    {deletingId === photoMemory.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {selectedPhotoMemory && (
          <section className="target-detail-card">
            <h2>사진 기억 상세</h2>
            <dl>
              <div>
                <dt>원본 파일명</dt>
                <dd>{selectedPhotoMemory.original_filename}</dd>
              </div>
              <div>
                <dt>저장 파일명</dt>
                <dd>{selectedPhotoMemory.stored_filename}</dd>
              </div>
              <div>
                <dt>감정 키워드</dt>
            <dd>{selectedPhotoMemory.emotion_keywords?.join(', ') ?? '없음'}</dd>
              </div>
              <div>
                <dt>삭제 시각</dt>
            <dd>{selectedPhotoMemory.deleted_at ? formatDateTime(selectedPhotoMemory.deleted_at) : '없음'}</dd>
              </div>
            </dl>
          </section>
        )}
      </main>
    </AppShell>
  )
}

function PhotoMemoryUploadApiPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [takenAt, setTakenAt] = useState('')
  const [location, setLocation] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [createdPhotoMemory, setCreatedPhotoMemory] = useState<PhotoMemoryResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleFileChange(nextFile: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setFile(nextFile)
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setErrorMessage('사진 파일을 선택해 주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await photoMemoryService.createPhotoMemory({
        title,
        description: description || null,
        taken_at: takenAt ? new Date(takenAt).toISOString() : null,
        location: location || null,
        file,
      })
      setCreatedPhotoMemory(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell title="사진 기억 올리기" subtitle="사진과 설명을 등록해 스토리북 재료로 사용할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">사진 기억 업로드</span>
            <h1>사진 기억 올리기</h1>
            <p>사진, 촬영 시각, 장소를 함께 등록해 주세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <form className="target-form" onSubmit={handleSubmit}>
          <div className="target-form__field">
            <label htmlFor="photo-memory-title">제목</label>
            <input id="photo-memory-title" onChange={(event) => setTitle(event.target.value)} required value={title} />
          </div>
          <div className="target-form__field">
            <label htmlFor="photo-memory-description">설명</label>
            <textarea id="photo-memory-description" onChange={(event) => setDescription(event.target.value)} rows={4} value={description} />
          </div>
          <div className="target-form__field">
            <label htmlFor="photo-memory-taken-at">촬영 시각</label>
            <input id="photo-memory-taken-at" onChange={(event) => setTakenAt(event.target.value)} type="datetime-local" value={takenAt} />
          </div>
          <div className="target-form__field">
            <label htmlFor="photo-memory-location">장소</label>
            <input id="photo-memory-location" onChange={(event) => setLocation(event.target.value)} value={location} />
          </div>
          <div className="target-form__field">
            <label htmlFor="photo-memory-file">파일</label>
            <input accept="image" id="photo-memory-file" onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)} required type="file" />
          </div>

          {previewUrl && (
            <div className="target-media-local-preview">
              <img alt={file?.name ?? 'Selected photo memory preview'} src={previewUrl} />
            </div>
          )}

          {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}

          <div className="target-form__actions">
            <a href="/memories/photos">목록으로 돌아가기</a>
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? '올리는 중...' : '사진 기억 올리기'}
            </button>
          </div>
        </form>

        {createdPhotoMemory && (
          <section className="target-detail-card">
            <h2>업로드가 완료됐어요</h2>
            <p>{createdPhotoMemory.title}</p>
            <div className="target-form__actions">
              <a href={`/storybooks/create?photo_memory_id=${createdPhotoMemory.id}`}>스토리북에 사용</a>
          <a href="/memories/photos">사진 기억 보기</a>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  )
}

function getStorybookIdFromLocation() {
  const params = new URLSearchParams(window.location.search)
  const value = params.get('storybook_id') ?? params.get('id') ?? window.location.pathname.split('/').filter(Boolean).at(-1)
  const storybookId = Number(value)

  return Number.isInteger(storybookId) && storybookId > 0 ? storybookId : null
}

function getShareTokenFromLocation() {
  const params = new URLSearchParams(window.location.search)
  return params.get('token') ?? window.location.pathname.split('/').filter(Boolean).at(-1) ?? ''
}

function getGroupIdFromLocation() {
  const params = new URLSearchParams(window.location.search)
  const value = params.get('group_id') ?? params.get('id') ?? window.location.pathname.split('/').filter(Boolean).at(-1)
  const groupId = Number(value)

  return Number.isInteger(groupId) && groupId > 0 ? groupId : null
}

function StorybookSummaryCard({ storybook }: { storybook: StoryBookResponse }) {
  return (
    <article className="target-card">
      <div className="target-card__body">
        <div className="target-card__title-row">
          <h2>{storybook.title}</h2>
          <span>{getDisplayLabel(storybook.status)}</span>
        </div>
        <p>{storybook.summary ?? '요약이 없습니다.'}</p>
        <dl>
          <div>
            <dt>생성 방식</dt>
            <dd>{storybook.source_type}</dd>
          </div>
          <div>
            <dt>공개 범위</dt>
            <dd>{getDisplayLabel(storybook.visibility)}</dd>
          </div>
          <div>
            <dt>인터뷰 연결</dt>
          <dd>{storybook.interview_session_id ? '연결됨' : '없음'}</dd>
          </div>
          <div>
            <dt>사진 기억 연결</dt>
          <dd>{storybook.photo_memory_id ? '연결됨' : '없음'}</dd>
          </div>
        </dl>
        <div className="target-form__actions">
          <a href={`/storybooks/detail?storybook_id=${storybook.id}`}>상세 보기</a>
          <a href={`/storybooks/share?storybook_id=${storybook.id}`}>공유 링크</a>
        </div>
      </div>
    </article>
  )
}

function StorybookListApiPage() {
  const [storybooks, setStorybooks] = useState<StoryBookResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadStorybooks = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await storybookService.listStorybooks()
      setStorybooks(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadStorybooks()
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [loadStorybooks])

  return (
    <AppShell title="스토리북" subtitle="스토리북 목록을 확인하고 공유할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">스토리북 목록</span>
            <h1>스토리북</h1>
            <p>현재 사용자의 삭제되지 않은 스토리북을 반환합니다.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <div className="target-form__actions">
          <a href="/storybooks/create">스토리북 만들기</a>
          <button disabled={isLoading} onClick={() => void loadStorybooks()} type="button">새로고침</button>
        </div>

        {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}
        {isLoading && <TargetStateMessage title="스토리북을 불러오는 중" message="백엔드에서 스토리북 목록을 불러오고 있습니다." />}
        {!isLoading && storybooks.length === 0 && <TargetStateMessage title="스토리북이 없습니다" message="인터뷰 세션 또는 사진 기억 소스로 스토리북을 만들어 주세요." />}

        <section className="target-card-grid" aria-label="스토리북 목록">
          {storybooks.map((storybook) => (
            <StorybookSummaryCard key={storybook.id} storybook={storybook} />
          ))}
        </section>
      </main>
    </AppShell>
  )
}

function StorybookCreateApiPage() {
  const params = new URLSearchParams(window.location.search)
  const [title, setTitle] = useState('')
  const [interviewSessionId, setInterviewSessionId] = useState(params.get('interview_session_id') ?? '')
  const [photoMemoryId, setPhotoMemoryId] = useState(params.get('photo_memory_id') ?? '')
  const [visibility, setVisibility] = useState<StoryBookVisibility>('PRIVATE')
  const [createdStorybook, setCreatedStorybook] = useState<StoryBookDetailResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    const parsedInterviewSessionId = interviewSessionId ? Number(interviewSessionId) : null
    const parsedPhotoMemoryId = photoMemoryId ? Number(photoMemoryId) : null

    try {
      const response = await storybookService.createStorybook({
        title,
        interview_session_id: Number.isInteger(parsedInterviewSessionId) ? parsedInterviewSessionId : null,
        photo_memory_id: Number.isInteger(parsedPhotoMemoryId) ? parsedPhotoMemoryId : null,
        visibility,
      })
      setCreatedStorybook(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell title="스토리북 만들기" subtitle="인터뷰나 사진 기억을 바탕으로 스토리북을 만들어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">스토리북 생성</span>
            <h1>스토리북 만들기</h1>
            <p>제목과 공개 범위를 선택해 스토리북을 만들어 주세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <form className="target-form" onSubmit={handleCreate}>
          <div className="target-form__field">
            <label htmlFor="storybook-title">제목</label>
            <input id="storybook-title" maxLength={255} minLength={1} onChange={(event) => setTitle(event.target.value)} required value={title} />
          </div>
          <div className="target-form__field">
            <label htmlFor="storybook-interview-session-id">인터뷰 세션 번호</label>
            <input id="storybook-interview-session-id" inputMode="numeric" onChange={(event) => setInterviewSessionId(event.target.value)} type="number" value={interviewSessionId} />
          </div>
          <div className="target-form__field">
            <label htmlFor="storybook-photo-memory-id">사진 기억 번호</label>
            <input id="storybook-photo-memory-id" inputMode="numeric" onChange={(event) => setPhotoMemoryId(event.target.value)} type="number" value={photoMemoryId} />
          </div>
          <div className="target-form__field">
            <label htmlFor="storybook-visibility">공개 범위</label>
            <select id="storybook-visibility" onChange={(event) => setVisibility(event.target.value as StoryBookVisibility)} value={visibility}>
              {storyBookVisibilityOptions.map((option) => (
                <option key={option} value={option}>{getDisplayLabel(option)}</option>
              ))}
            </select>
          </div>

          {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}
          <div className="target-form__actions">
            <a href="/storybooks">목록으로 돌아가기</a>
            <button disabled={isSubmitting} type="submit">{isSubmitting ? '생성 중...' : '스토리북 만들기'}</button>
          </div>
        </form>

        {createdStorybook && (
          <section className="target-detail-card">
            <h2>스토리북이 만들어졌어요</h2>
            <p>{createdStorybook.summary ?? createdStorybook.title}</p>
            <div className="target-form__actions">
              <a href={`/storybooks/detail?storybook_id=${createdStorybook.id}`}>상세 보기</a>
              <a href={`/storybooks/share?storybook_id=${createdStorybook.id}`}>공유 링크 생성</a>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  )
}

function StoryChapterList({ chapters }: { chapters: StoryChapterResponse[] }) {
  return (
    <section className="target-card-grid" aria-label="스토리 챕터">
      {chapters.map((chapter) => (
        <article className="target-card" key={chapter.id}>
          <div className="target-card__body">
            <div className="target-card__title-row">
              <h2>{chapter.title}</h2>
              <span>#{chapter.order_index}</span>
            </div>
            {chapter.summary && <p>{chapter.summary}</p>}
            <p>{chapter.content}</p>
            <dl>
              <div>
                <dt>id</dt>
                <dd>{chapter.id}</dd>
              </div>
              <div>
                <dt>updated_at</dt>
                <dd>{formatDateTime(chapter.updated_at)}</dd>
              </div>
            </dl>
          </div>
        </article>
      ))}
    </section>
  )
}

function StorybookDetailApiPage() {
  const [initialStorybookId] = useState(() => getStorybookIdFromLocation())
  const [storybookIdInput, setStorybookIdInput] = useState(() => (initialStorybookId ? String(initialStorybookId) : ''))
  const [storybook, setStorybook] = useState<StoryBookDetailResponse | null>(null)
  const [chapters, setChapters] = useState<StoryChapterResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadStorybook = useCallback(async (storybookId: number) => {
    setIsLoading(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      const [detail, chapterList] = await Promise.all([
        storybookService.getStorybook(storybookId),
        storybookService.listChapters(storybookId),
      ])
      setStorybook(detail)
      setChapters(chapterList)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialStorybookId) {
      return
    }

    const timerId = window.setTimeout(() => {
      void loadStorybook(initialStorybookId)
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [initialStorybookId, loadStorybook])

  function getStorybookIdFromInput() {
    const storybookId = Number(storybookIdInput)
    return Number.isInteger(storybookId) && storybookId > 0 ? storybookId : null
  }

  function handleLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const storybookId = getStorybookIdFromInput()

    if (!storybookId) {
      setErrorMessage('스토리북을 선택해 주세요.')
      return
    }

    void loadStorybook(storybookId)
  }

  async function handleRegenerate() {
    const storybookId = storybook?.id ?? getStorybookIdFromInput()

    if (!storybookId) {
      setErrorMessage('스토리북을 선택해 주세요.')
      return
    }

    setIsRegenerating(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      const response = await storybookService.regenerateStorybook(storybookId)
      setStorybook(response)
      setChapters(response.chapters ?? (await storybookService.listChapters(storybookId)))
      setNotice('스토리북을 다시 생성했어요.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsRegenerating(false)
    }
  }

  void handleLoad

  return (
    <AppShell title="스토리북 상세" subtitle="스토리북 내용과 챕터를 확인할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">스토리북 상세</span>
            <h1>스토리북 상세</h1>
            <p>스토리북 본문과 챕터를 확인해 보세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">관리 가능</span>
        </header>

        <StorybookSelector
          selectedId={Number(storybookIdInput) || null}
          title="내용을 볼 스토리북을 선택해 주세요"
          onSelect={(selectedStorybook) => {
            setStorybookIdInput(String(selectedStorybook.id))
            void loadStorybook(selectedStorybook.id)
          }}
        />
        <div className="target-form__actions">
          <button disabled={!storybook || isRegenerating} onClick={() => void handleRegenerate()} type="button">{isRegenerating ? '생성 중...' : '스토리 다시 만들기'}</button>
        </div>

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}
        {isLoading && <TargetStateMessage title="스토리북을 불러오는 중" message="스토리북과 챕터를 불러오고 있습니다." />}

        {storybook && (
          <section className="target-detail-card">
            <div className="target-card__title-row">
              <h2>{storybook.title}</h2>
              <span>{getDisplayLabel(storybook.status)}</span>
            </div>
            <p>{storybook.summary ?? '요약이 없습니다.'}</p>
            <dl>
              <div>
                <dt>생성 방식</dt>
                <dd>{storybook.source_type}</dd>
              </div>
              <div>
                <dt>공개 범위</dt>
                <dd>{getDisplayLabel(storybook.visibility)}</dd>
              </div>
              <div>
                <dt>생성일</dt>
                <dd>{formatDateTime(storybook.created_at)}</dd>
              </div>
            </dl>
            <div className="target-form__actions">
              <a href={`/storybooks/share?storybook_id=${storybook.id}`}>공유 링크</a>
            </div>
          </section>
        )}

        <StoryChapterList chapters={chapters} />
      </main>
    </AppShell>
  )
}

function StorybookShareApiPage() {
  const [initialStorybookId] = useState(() => getStorybookIdFromLocation())
  const [storybookIdInput, setStorybookIdInput] = useState(() => (initialStorybookId ? String(initialStorybookId) : ''))
  const [expiresAt, setExpiresAt] = useState('')
  const [shareLinks, setShareLinks] = useState<ShareLinkResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [disablingId, setDisablingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadShareLinks = useCallback(async (storybookId: number) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await shareLinkService.listShareLinks(storybookId)
      setShareLinks(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialStorybookId) {
      return
    }

    const timerId = window.setTimeout(() => {
      void loadShareLinks(initialStorybookId)
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [initialStorybookId, loadShareLinks])

  function getStorybookIdFromShareInput() {
    const storybookId = Number(storybookIdInput)
    return Number.isInteger(storybookId) && storybookId > 0 ? storybookId : null
  }

  function handleLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const storybookId = getStorybookIdFromShareInput()

    if (!storybookId) {
      setErrorMessage('스토리북을 선택해 주세요.')
      return
    }

    void loadShareLinks(storybookId)
  }

  async function handleCreateShareLink() {
    const storybookId = getStorybookIdFromShareInput()

    if (!storybookId) {
      setErrorMessage('스토리북을 선택해 주세요.')
      return
    }

    setIsCreating(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      await shareLinkService.createShareLink(storybookId, expiresAt ? { expires_at: new Date(expiresAt).toISOString() } : null)
      setNotice('공유 링크를 만들었어요.')
      await loadShareLinks(storybookId)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDisableShareLink(shareLinkId: number) {
    const storybookId = getStorybookIdFromShareInput()
    setDisablingId(shareLinkId)
    setErrorMessage(null)
    setNotice(null)

    try {
      await shareLinkService.disableShareLink(shareLinkId)
      setNotice('공유 링크를 비활성화했어요.')
      if (storybookId) {
        await loadShareLinks(storybookId)
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setDisablingId(null)
    }
  }

  void isLoading
  void handleLoad

  return (
    <AppShell title="스토리북 공유" subtitle="공유 링크를 만들고 사용 여부를 관리할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">스토리북 공유</span>
            <h1>공유 링크</h1>
            <p>공유 링크를 생성하고 필요할 때 비활성화해 주세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">관리 가능</span>
        </header>

        <StorybookSelector
          selectedId={Number(storybookIdInput) || null}
          title="공유할 스토리북을 선택해 주세요"
          onSelect={(selectedStorybook) => {
            setStorybookIdInput(String(selectedStorybook.id))
            void loadShareLinks(selectedStorybook.id)
          }}
        />
        <form className="target-form" onSubmit={(event) => { event.preventDefault(); void handleCreateShareLink() }}>
          <div className="target-form__field">
            <label htmlFor="share-expires-at">만료 시각 (선택)</label>
            <input id="share-expires-at" onChange={(event) => setExpiresAt(event.target.value)} type="datetime-local" value={expiresAt} />
          </div>
          <div className="target-form__actions">
            <button disabled={!storybookIdInput || isCreating} type="submit">{isCreating ? '생성 중...' : '공유 링크 만들기'}</button>
          </div>
        </form>

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}

        <section className="target-card-grid" aria-label="공유 링크">
          {shareLinks.map((shareLink) => (
            <article className="target-card" key={shareLink.id}>
              <div className="target-card__body">
                <div className="target-card__title-row">
                  <h2>공유 링크</h2>
                  <span>{shareLink.is_active ? '사용 중' : '중지됨'}</span>
                </div>
                <dl>
                  <div>
                    <dt>링크</dt>
                    <dd>{shareLink.share_url}</dd>
                  </div>
                  <div>
                    <dt>만료 시각</dt>
          <dd>{shareLink.expires_at ? formatDateTime(shareLink.expires_at) : '없음'}</dd>
                  </div>
                  <div>
                    <dt>중지 시각</dt>
          <dd>{shareLink.disabled_at ? formatDateTime(shareLink.disabled_at) : '없음'}</dd>
                  </div>
                </dl>
                <div className="target-form__actions">
          <a href={`/share/${shareLink.token}`}>공유 페이지 보기</a>
                  <button disabled={!shareLink.is_active || disablingId === shareLink.id} onClick={() => void handleDisableShareLink(shareLink.id)} type="button">
                    {disablingId === shareLink.id ? '중지 중...' : '공유 중지'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  )
}

function PublicShareApiPage() {
  const [token] = useState(() => getShareTokenFromLocation())
  const [sharedStorybook, setSharedStorybook] = useState<PublicSharedStoryBookResponse | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(token))
  const [errorMessage, setErrorMessage] = useState<string | null>(() => (token ? null : '공유 주소가 올바르지 않아요.'))

  useEffect(() => {
    if (!token) {
      return
    }

    let isMounted = true

    shareLinkService
      .getPublicSharedStorybook(token)
      .then((response) => {
        if (isMounted) {
          setSharedStorybook(response)
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(getApiErrorMessage(error))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <main className="domain-page target-api-page">
      <header className="domain-page__hero">
        <div>
          <span className="domain-page__eyebrow">공개 공유</span>
          <h1>{sharedStorybook?.title ?? '공유 스토리북'}</h1>
          <p>{sharedStorybook?.summary ?? '공유된 스토리북입니다.'}</p>
        </div>
        <span className="domain-page__badge domain-page__badge--connected">인증 없음</span>
      </header>

      {isLoading && <TargetStateMessage title="공유 스토리북을 불러오는 중" message="공유 토큰으로 공개 스토리북을 불러오고 있습니다." />}
      {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}

      {sharedStorybook && (
        <>
          <section className="target-detail-card">
            <h2>{sharedStorybook.title}</h2>
            <p>{sharedStorybook.summary ?? '요약이 없습니다.'}</p>
            <dl>
              <div>
                <dt>공개 범위</dt>
                <dd>{getDisplayLabel(sharedStorybook.visibility)}</dd>
              </div>
            </dl>
          </section>

          <section className="target-card-grid" aria-label="공개 스토리 챕터">
            {sharedStorybook.chapters.map((chapter) => (
              <article className="target-card" key={`${chapter.order_index}-${chapter.title}`}>
                <div className="target-card__body">
                  <div className="target-card__title-row">
                    <h2>{chapter.title}</h2>
                    <span>#{chapter.order_index}</span>
                  </div>
                  {chapter.summary && <p>{chapter.summary}</p>}
                  <p>{chapter.content}</p>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  )
}

function GroupRoleBadge({ role }: { role: GroupMemberRole }) {
  return <span className={`persona-status-badge persona-status-badge--${role.toLowerCase()}`}>{getDisplayLabel(role)}</span>
}

function MemoryGroupCard({ group }: { group: MemoryGroupResponse }) {
  return (
    <article className="target-card">
      <div className="target-card__body">
        <div className="target-card__title-row">
          <h2>{group.name}</h2>
          <span>#{group.id}</span>
        </div>
        <p>{group.description ?? '설명이 없습니다.'}</p>
        <dl>
          <div>
            <dt>만든 사람</dt>
            <dd>{group.owner_id}</dd>
          </div>
          <div>
            <dt>생성일</dt>
            <dd>{formatDateTime(group.created_at)}</dd>
          </div>
          <div>
            <dt>삭제 시각</dt>
          <dd>{group.deleted_at ? formatDateTime(group.deleted_at) : '없음'}</dd>
          </div>
        </dl>
        <div className="target-form__actions">
        <a href={`/groups/detail?group_id=${group.id}`}>그룹 보기</a>
        </div>
      </div>
    </article>
  )
}

function MemoryGroupListApiPage() {
  const [groups, setGroups] = useState<MemoryGroupResponse[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadGroups = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await groupService.listGroups()
      setGroups(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadGroups()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadGroups])

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      await groupService.createGroup({
        name,
        description: description || null,
      })
      setNotice('그룹을 만들었어요.')
      setName('')
      setDescription('')
      await loadGroups()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AppShell title="기억 그룹" subtitle="그룹을 만들고 공유할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">기억 그룹 목록</span>
            <h1>기억 그룹</h1>
            <p>내가 참여 중인 그룹을 확인할 수 있어요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <form className="target-form" onSubmit={handleCreateGroup}>
          <div className="target-form__field">
            <label htmlFor="group-name">이름</label>
            <input id="group-name" maxLength={255} minLength={1} onChange={(event) => setName(event.target.value)} required value={name} />
            <p className="target-form__helper">그룹 이름을 입력해 주세요.</p>
          </div>
          <div className="target-form__field">
            <label htmlFor="group-description">설명</label>
            <textarea id="group-description" onChange={(event) => setDescription(event.target.value)} value={description} />
            <p className="target-form__helper">선택 항목이에요.</p>
          </div>
          <div className="target-form__actions">
            <button disabled={isCreating} type="submit">{isCreating ? '생성 중...' : '그룹 만들기'}</button>
            <button disabled={isLoading} onClick={() => void loadGroups()} type="button">{isLoading ? '불러오는 중...' : '새로고침'}</button>
          </div>
        </form>

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}
        {isLoading && <TargetStateMessage title="그룹을 불러오는 중" message="그룹 목록을 불러오고 있어요." />}
        {!isLoading && groups.length === 0 && <TargetStateMessage title="그룹이 없습니다" message="멤버와 스토리북을 공유하려면 기억 그룹을 만들어 주세요." />}

        <section className="target-card-grid" aria-label="기억 그룹 목록">
          {groups.map((group) => (
            <MemoryGroupCard group={group} key={group.id} />
          ))}
        </section>
      </main>
    </AppShell>
  )
}

function MemoryGroupDetailApiPage() {
  const [initialGroupId] = useState(() => getGroupIdFromLocation())
  const [groupIdInput, setGroupIdInput] = useState(() => (initialGroupId ? String(initialGroupId) : ''))
  const [group, setGroup] = useState<MemoryGroupDetailResponse | null>(null)
  const [members, setMembers] = useState<GroupMemberResponse[]>([])
  const [groupStorybooks, setGroupStorybooks] = useState<GroupStoryBookListItemResponse[]>([])
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState<GroupMemberRole>('MEMBER')
  const [storybookId, setStorybookId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isSharingStorybook, setIsSharingStorybook] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const canAddMember = group?.my_role === 'OWNER'

  const getGroupIdFromInput = useCallback(() => {
    const groupId = Number(groupIdInput)
    return Number.isInteger(groupId) && groupId > 0 ? groupId : null
  }, [groupIdInput])

  const loadGroup = useCallback(async (groupId: number) => {
    setIsLoading(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      const [groupDetail, memberList, storybookList] = await Promise.all([
        groupService.getGroup(groupId),
        groupService.listGroupMembers(groupId),
        groupService.listGroupStorybooks(groupId),
      ])
      setGroup(groupDetail)
      setMembers(memberList)
      setGroupStorybooks(storybookList)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialGroupId) {
      return
    }

    const timerId = window.setTimeout(() => {
      void loadGroup(initialGroupId)
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [initialGroupId, loadGroup])

  function handleLoadGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const groupId = getGroupIdFromInput()

    if (!groupId) {
      setErrorMessage('그룹 번호를 확인해 주세요.')
      return
    }

    void loadGroup(groupId)
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const groupId = group?.id ?? getGroupIdFromInput()
    const userId = Number(memberUserId)

    if (!groupId) {
      setErrorMessage('그룹 번호를 확인해 주세요.')
      return
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      setErrorMessage('사용자 번호를 확인해 주세요.')
      return
    }

    setIsAddingMember(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      await groupService.addGroupMember(groupId, { user_id: userId, role: memberRole })
      setNotice('Group member added.')
      setMemberUserId('')
      await loadGroup(groupId)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsAddingMember(false)
    }
  }

  async function handleShareStorybook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const groupId = group?.id ?? getGroupIdFromInput()
    const parsedStorybookId = Number(storybookId)

    if (!groupId) {
      setErrorMessage('그룹 번호를 확인해 주세요.')
      return
    }

    if (!Number.isInteger(parsedStorybookId) || parsedStorybookId <= 0) {
      setErrorMessage('스토리북을 선택해 주세요.')
      return
    }

    setIsSharingStorybook(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      await groupService.shareStorybookToGroup(groupId, parsedStorybookId)
      setNotice('스토리북을 그룹에 공유했어요.')
      setStorybookId('')
      await loadGroup(groupId)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSharingStorybook(false)
    }
  }

  void handleLoadGroup

  return (
    <AppShell title="기억 그룹 상세" subtitle="그룹 멤버와 공유된 스토리북을 확인할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">기억 그룹 상세</span>
            <h1>기억 그룹 상세</h1>
            <p>그룹 정보와 공유 상태를 한눈에 확인해 보세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">관리 가능</span>
        </header>

        <MemoryGroupSelector
          selectedId={group?.id ?? (Number(groupIdInput) || null)}
          title="확인할 그룹을 선택해 주세요"
          onSelect={(selectedGroup) => {
            setGroupIdInput(String(selectedGroup.id))
            void loadGroup(selectedGroup.id)
          }}
        />

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}
        {isLoading && <TargetStateMessage title="그룹을 불러오는 중" message="그룹 상세, 멤버, 그룹 스토리북을 불러오고 있습니다." />}

        {group && (
          <section className="target-detail-card">
            <div className="target-card__title-row">
              <h2>{group.name}</h2>
              <GroupRoleBadge role={group.my_role} />
            </div>
            <p>{group.description ?? '설명이 없습니다.'}</p>
            <dl>
              <div>
                <dt>만든 사람</dt>
                <dd>{group.owner_id}</dd>
              </div>
              <div>
                <dt>내 역할</dt>
                <dd>{group.my_role}</dd>
              </div>
              <div>
                <dt>최근 수정</dt>
                <dd>{formatDateTime(group.updated_at)}</dd>
              </div>
            </dl>
          </section>
        )}

        <section className="mock-feature-layout">
          <form className="target-form" onSubmit={handleAddMember}>
            <h2>멤버 추가</h2>
            <p className="target-form__helper">현재는 사용자 번호를 알아야 멤버를 추가할 수 있어요.</p>
            <div className="target-form__field">
              <label htmlFor="group-member-user-id">사용자</label>
              <input id="group-member-user-id" inputMode="numeric" onChange={(event) => setMemberUserId(event.target.value)} required type="number" value={memberUserId} />
            </div>
            <div className="target-form__field">
              <label htmlFor="group-member-role">역할</label>
              <select id="group-member-role" onChange={(event) => setMemberRole(event.target.value as GroupMemberRole)} value={memberRole}>
                {groupMemberRoleOptions.map((role) => (
                  <option key={role} value={role}>{getDisplayLabel(role)}</option>
                ))}
              </select>
            </div>
            <div className="target-form__actions">
              <button disabled={!group || !canAddMember || isAddingMember} type="submit">
                {isAddingMember ? '추가 중...' : '멤버 추가'}
              </button>
            </div>
            {group && !canAddMember && <p className="target-form__helper">소유자만 멤버를 추가할 수 있어요.</p>}
          </form>

          <form className="target-form" onSubmit={handleShareStorybook}>
            <h2>스토리북 공유</h2>
            <StorybookSelector
              selectedId={Number(storybookId) || null}
              title="그룹에 공유할 스토리북을 선택해 주세요"
              onSelect={(selectedStorybook) => setStorybookId(String(selectedStorybook.id))}
            />
            <div className="target-form__actions">
              <button disabled={!group || !storybookId || isSharingStorybook} type="submit">{isSharingStorybook ? '공유 중...' : '그룹에 공유하기'}</button>
            </div>
          </form>
        </section>

        <section className="target-card-grid" aria-label="그룹 멤버">
          {members.map((member) => (
            <article className="target-card" key={member.id}>
              <div className="target-card__body">
                <div className="target-card__title-row">
                  <h2>사용자 #{member.user_id}</h2>
                  <GroupRoleBadge role={member.role} />
                </div>
                <dl>
                  <div>
                    <dt>참여 시각</dt>
                    <dd>{formatDateTime(member.created_at)}</dd>
                  </div>
                  <div>
                    <dt>삭제 시각</dt>
          <dd>{member.deleted_at ? formatDateTime(member.deleted_at) : '없음'}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </section>

        {group && members.length === 0 && <TargetStateMessage title="멤버가 없습니다" message="그룹 멤버 목록 준비 상태가 빈 배열을 반환했습니다." />}

        <section className="target-card-grid" aria-label="그룹 스토리북">
          {groupStorybooks.map((storybook) => (
            <article className="target-card" key={storybook.id}>
              <div className="target-card__body">
                <div className="target-card__title-row">
                  <h2>{storybook.title}</h2>
                  <span>{getDisplayLabel(storybook.visibility)}</span>
                </div>
                <p>{storybook.summary ?? '요약이 없습니다.'}</p>
                <dl>
                  <div>
                    <dt>생성일</dt>
                    <dd>{formatDateTime(storybook.created_at)}</dd>
                  </div>
                </dl>
                <div className="target-form__actions">
        <a href={`/storybooks/detail?storybook_id=${storybook.id}`}>스토리북 보기</a>
                </div>
              </div>
            </article>
          ))}
        </section>

        {group && groupStorybooks.length === 0 && <TargetStateMessage title="그룹 스토리북이 없습니다" message="내 스토리북 중 하나를 이 그룹에 공유하세요." />}
      </main>
    </AppShell>
  )
}

function DeletionStatusBadge({ status }: { status: DeletionStatus }) {
  return <span className={`persona-status-badge persona-status-badge--${status.toLowerCase()}`}>{status}</span>
}

function DeletionRequestCard({
  request,
  onCancel,
  onView,
  isCancelling,
}: {
  request: DeletionRequestResponse
  onCancel: (requestId: number) => void
  onView: (requestId: number) => void
  isCancelling: boolean
}) {
  return (
    <article className="target-card">
      <div className="target-card__body">
        <div className="target-card__title-row">
          <h2>{request.target_type}</h2>
          <DeletionStatusBadge status={request.status} />
        </div>
        <p>{request.reason ?? '요청 사유가 없습니다.'}</p>
        <dl>
          <div>
            <dt>요청</dt>
            <dd>{request.id}</dd>
          </div>
          <div>
            <dt>대상</dt>
            <dd>{request.target_id ? '연결됨' : '없음'}</dd>
          </div>
          <div>
            <dt>요청 시각</dt>
            <dd>{formatDateTime(request.requested_at)}</dd>
          </div>
          <div>
            <dt>처리 시각</dt>
            <dd>{request.processed_at ? formatDateTime(request.processed_at) : '없음'}</dd>
          </div>
          <div>
            <dt>관리자 메모</dt>
            <dd>{request.admin_note ?? '없음'}</dd>
          </div>
          <div>
            <dt>오류 안내</dt>
            <dd>{request.error_message ?? '없음'}</dd>
          </div>
        </dl>
        <div className="target-form__actions">
          <button onClick={() => onView(request.id)} type="button">상세 보기</button>
          <button disabled={request.status !== 'PENDING' || isCancelling} onClick={() => onCancel(request.id)} type="button">
            {isCancelling ? '취소 중...' : '요청 취소'}
          </button>
        </div>
      </div>
    </article>
  )
}

function DeletionRequestApiPage() {
  const [requests, setRequests] = useState<DeletionRequestResponse[]>([])
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequestResponse | null>(null)
  const [targetType, setTargetType] = useState<DeletionTargetType>('TARGET')
  const [targetId, setTargetId] = useState('')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadDeletionRequests = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await deletionService.listDeletionRequests()
      setRequests(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadDeletionRequests()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadDeletionRequests])

  async function handleCreateDeletionRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!window.confirm('삭제 요청을 생성할까요? 이 작업은 민감한 데이터 삭제 흐름을 시작합니다.')) {
      return
    }

    const parsedTargetId = targetId ? Number(targetId) : null

    if (parsedTargetId !== null && (!Number.isInteger(parsedTargetId) || parsedTargetId <= 0)) {
      setErrorMessage('대상을 올바르게 선택해 주세요.')
      return
    }

    setIsCreating(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      const response = await deletionService.createDeletionRequest({
        target_type: targetType,
        target_id: parsedTargetId,
        reason: reason || null,
      })
      setSelectedRequest(response)
      setNotice('삭제 요청을 보냈어요.')
      setTargetId('')
      setReason('')
      await loadDeletionRequests()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleLoadDetailById(requestId: number) {
    setErrorMessage(null)
    setNotice(null)

    try {
      const response = await deletionService.getDeletionRequest(requestId)
      setSelectedRequest(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  async function handleCancelDeletionRequest(requestId: number) {
    if (!window.confirm('삭제 요청을 취소할까요?')) {
      return
    }

    setCancellingId(requestId)
    setErrorMessage(null)
    setNotice(null)

    try {
      const response = await deletionService.cancelDeletionRequest(requestId)
      setSelectedRequest(response)
      setNotice('삭제 요청을 취소했어요.')
      await loadDeletionRequests()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <AppShell title="삭제 요청" subtitle="데이터 삭제 요청을 보내고 상태를 확인할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">삭제 요청</span>
            <h1>삭제 요청</h1>
            <p>삭제 요청 상태와 처리 흐름을 확인합니다.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">삭제 서비스</span>
        </header>

        <form className="target-form" onSubmit={handleCreateDeletionRequest}>
          <div className="target-form__field">
            <label htmlFor="deletion-target-type">삭제 대상 유형</label>
            <select id="deletion-target-type" onChange={(event) => setTargetType(event.target.value as DeletionTargetType)} value={targetType}>
              {deletionTargetTypeOptions.map((option) => (
                <option key={option} value={option}>{getDisplayLabel(option)}</option>
              ))}
            </select>
          </div>
          <TargetSelector
            selectedId={Number(targetId) || null}
            title="삭제 요청할 대상을 선택해 주세요"
            onSelect={(target) => setTargetId(String(target.id))}
          />
          <div className="target-form__field">
            <label htmlFor="deletion-reason">사유</label>
            <textarea id="deletion-reason" onChange={(event) => setReason(event.target.value)} value={reason} />
          </div>
          <div className="target-form__actions">
            <button disabled={isCreating} type="submit">{isCreating ? '생성 중...' : '삭제 요청 만들기'}</button>
            <button disabled={isLoading} onClick={() => void loadDeletionRequests()} type="button">{isLoading ? '불러오는 중...' : '새로고침'}</button>
          </div>
        </form>

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}
        {isLoading && <TargetStateMessage title="삭제 요청을 불러오는 중" message="현재 사용자의 삭제 요청을 불러오고 있습니다." />}

        {selectedRequest && (
          <section className="target-detail-card">
            <div className="target-card__title-row">
              <h2>선택한 요청 {selectedRequest.id}</h2>
              <DeletionStatusBadge status={selectedRequest.status} />
            </div>
            <p>{selectedRequest.reason ?? '요청 사유가 없습니다.'}</p>
            <dl>
              <div>
                <dt>삭제 대상 유형</dt>
                <dd>{getDisplayLabel(selectedRequest.target_type)}</dd>
              </div>
              <div>
                <dt>대상</dt>
                <dd>{selectedRequest.target_id ? '연결됨' : '없음'}</dd>
              </div>
              <div>
                <dt>최근 수정</dt>
                <dd>{formatDateTime(selectedRequest.updated_at)}</dd>
              </div>
            </dl>
          </section>
        )}

        {!isLoading && requests.length === 0 && <TargetStateMessage title="삭제 요청이 없습니다" message="백엔드가 반환한 삭제 요청이 없습니다." />}

        <section className="target-card-grid" aria-label="삭제 요청">
          {requests.map((request) => (
            <DeletionRequestCard
              isCancelling={cancellingId === request.id}
              key={request.id}
              onCancel={(requestId) => void handleCancelDeletionRequest(requestId)}
              onView={(requestId) => void handleLoadDetailById(requestId)}
              request={request}
            />
          ))}
        </section>
      </main>
    </AppShell>
  )
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <span className={`persona-status-badge persona-status-badge--${status.toLowerCase()}`}>{status}</span>
}

function ReportCard({ report, onView }: { report: ReportResponse; onView: (reportId: number) => void }) {
  return (
    <article className="target-card">
      <div className="target-card__body">
        <div className="target-card__title-row">
          <h2>{getDisplayLabel(report.target_type)}</h2>
          <ReportStatusBadge status={report.status} />
        </div>
        <p>{report.reason_detail ?? report.reason_type}</p>
        <dl>
          <div>
            <dt>신고 유형</dt>
            <dd>{report.reason_type}</dd>
          </div>
          <div>
            <dt>신고 시각</dt>
            <dd>{formatDateTime(report.created_at)}</dd>
          </div>
          <div>
            <dt>검토자</dt>
            <dd>{report.reviewed_by ?? '없음'}</dd>
          </div>
          <div>
            <dt>관리자 메모</dt>
            <dd>{report.admin_note ?? '없음'}</dd>
          </div>
        </dl>
        <div className="target-form__actions">
          <button onClick={() => onView(report.id)} type="button">상세 보기</button>
        </div>
      </div>
    </article>
  )
}

function ReportApiPage() {
  const [reports, setReports] = useState<ReportResponse[]>([])
  const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null)
  const [targetType, setTargetType] = useState<ReportTargetType>('PERSONA')
  const [targetId, setTargetId] = useState('')
  const [reasonType, setReasonType] = useState<ReportReasonType>('OTHER')
  const [reasonDetail, setReasonDetail] = useState('')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadReports = useCallback(async (nextPage = page, nextSize = size) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await reportService.listReports(nextPage, nextSize)
      setReports(response.items)
      setTotal(response.total)
      setPage(nextPage)
      setSize(nextSize)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [page, size])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadReports(1, 20)
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadReports])

  async function handleCreateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!window.confirm('신고를 제출할까요? 신고 대상과 사유가 정확한지 확인해 주세요.')) {
      return
    }

    const parsedTargetId = Number(targetId)

    if (!Number.isInteger(parsedTargetId) || parsedTargetId <= 0) {
      setErrorMessage('대상을 먼저 선택해 주세요.')
      return
    }

    setIsCreating(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      const response = await reportService.createReport({
        target_type: targetType,
        target_id: parsedTargetId,
        reason_type: reasonType,
        reason_detail: reasonDetail || null,
      })
      setSelectedReport(response)
      setNotice('신고를 접수했어요.')
      setTargetId('')
      setReasonDetail('')
      await loadReports(1, size)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleLoadReportDetail(reportId: number) {
    setErrorMessage(null)
    setNotice(null)

    try {
      const response = await reportService.getReport(reportId)
      setSelectedReport(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  function handlePageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void loadReports(page, size)
  }

  return (
    <AppShell title="신고하기" subtitle="문제가 있는 내용을 신고하고 처리 상태를 확인할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">신고</span>
            <h1>신고</h1>
            <p>신고 대상과 사유를 선택해 접수해 주세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">신고 서비스</span>
        </header>

        <form className="target-form" onSubmit={handleCreateReport}>
          <div className="target-form__field">
            <label htmlFor="report-target-type">신고 대상 유형</label>
            <select id="report-target-type" onChange={(event) => setTargetType(event.target.value as ReportTargetType)} value={targetType}>
              {reportTargetTypeOptions.map((option) => (
                <option key={option} value={option}>{getDisplayLabel(option)}</option>
              ))}
            </select>
          </div>
          <TargetSelector
            selectedId={Number(targetId) || null}
            title="신고할 대상을 선택해 주세요"
            onSelect={(target) => setTargetId(String(target.id))}
          />
          <div className="target-form__field">
            <label htmlFor="report-reason-type">신고 사유</label>
            <select id="report-reason-type" onChange={(event) => setReasonType(event.target.value as ReportReasonType)} value={reasonType}>
              {reportReasonTypeOptions.map((option) => (
                <option key={option} value={option}>{getDisplayLabel(option)}</option>
              ))}
            </select>
          </div>
          <div className="target-form__field">
            <label htmlFor="report-reason-detail">상세 설명</label>
            <textarea id="report-reason-detail" onChange={(event) => setReasonDetail(event.target.value)} value={reasonDetail} />
          </div>
          <div className="target-form__actions">
            <button disabled={isCreating} type="submit">{isCreating ? '접수 중...' : '신고하기'}</button>
          </div>
        </form>

        <form className="target-form target-media-target-form" onSubmit={handlePageSubmit}>
          <div className="target-form__field">
            <label htmlFor="report-page">페이지</label>
            <input id="report-page" min={1} onChange={(event) => setPage(Number(event.target.value))} required type="number" value={page} />
          </div>
          <div className="target-form__field">
            <label htmlFor="report-size">표시 개수</label>
            <input id="report-size" max={100} min={1} onChange={(event) => setSize(Number(event.target.value))} required type="number" value={size} />
          </div>
          <div className="target-form__actions">
            <button disabled={isLoading} type="submit">{isLoading ? '불러오는 중...' : '신고 불러오기'}</button>
          </div>
        </form>

        {notice && <p className="target-form__notice">{notice}</p>}
        {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}
        {isLoading && <TargetStateMessage title="신고를 불러오는 중" message="백엔드에서 사용자 신고를 불러오고 있습니다." />}

        <section className="domain-page__metrics" aria-label="신고 페이지 정보">
          <article>
            <span>전체</span>
            <strong>{total}</strong>
          </article>
          <article>
            <span>페이지</span>
            <strong>{page}</strong>
          </article>
          <article>
            <span>표시 개수</span>
            <strong>{size}</strong>
          </article>
        </section>

        {selectedReport && (
          <section className="target-detail-card">
            <div className="target-card__title-row">
              <h2>선택한 신고</h2>
              <ReportStatusBadge status={selectedReport.status} />
            </div>
            <p>{selectedReport.reason_detail ?? selectedReport.reason_type}</p>
            <dl>
              <div>
                <dt>신고 대상 유형</dt>
                <dd>{getDisplayLabel(selectedReport.target_type)}</dd>
              </div>
              <div>
                <dt>대상</dt>
                <dd>{selectedReport.target_id ? '연결됨' : '없음'}</dd>
              </div>
              <div>
                <dt>최근 수정</dt>
                <dd>{formatDateTime(selectedReport.updated_at)}</dd>
              </div>
            </dl>
          </section>
        )}

        {!isLoading && reports.length === 0 && <TargetStateMessage title="신고가 없어요" message="등록된 신고가 없어요." />}

        <section className="target-card-grid" aria-label="신고">
          {reports.map((report) => (
            <ReportCard key={report.id} onView={(reportId) => void handleLoadReportDetail(reportId)} report={report} />
          ))}
        </section>
      </main>
    </AppShell>
  )
}

const voiceStatusLabel: Record<VoiceCallStatus, string> = {
  disconnected: '연결 전',
  connecting: '연결 중',
  connected: '연결됨',
  recording: '말하는 중',
  processing: '처리 중',
  ended: '종료됨',
}

function VoiceCallBubble({ message }: { message: VoiceCallMessage }) {
  const audioPath = message.audio_api_url ?? message.audio_url ?? message.audio_file_path
  const audioUrl = audioPath ? toPlayableFileUrl(audioPath) : null

  return (
    <article className={`voice-call-message voice-call-message--${message.sender.toLowerCase()}`}>
      <header>
        <strong>{message.sender}</strong>
        <span>{getDisplayLabel(message.message_type)}</span>
      </header>
      {message.text && <p>{message.text}</p>}
      {audioUrl && <audio controls preload="metadata" src={audioUrl} />}
      <small>{formatDateTime(message.created_at)}</small>
    </article>
  )
}

function PersonaVoiceCallApiPage() {
  const [initialPersonaId] = useState(() => getPersonaIdFromLocation())
  const [personaIdInput] = useState(() => (initialPersonaId ? String(initialPersonaId) : ''))
  const [voiceProfileGate, setVoiceProfileGate] = useState<PersonaVoiceProfileResponse | null>(null)
  const [voiceProfileGateError, setVoiceProfileGateError] = useState<string | null>(null)
  const [isCheckingVoiceProfile, setIsCheckingVoiceProfile] = useState(false)
  const voiceCall = useVoiceCall()

  const canConnect = voiceCall.status === 'disconnected' || voiceCall.status === 'ended'
  const canRecord = voiceCall.status === 'connected'
  const canEndUtterance = voiceCall.status === 'recording'
  const canStop = voiceCall.status === 'connected' || voiceCall.status === 'recording' || voiceCall.status === 'processing'

  async function handleConnect() {
    const personaId = Number(personaIdInput)

    if (!Number.isInteger(personaId) || personaId <= 0) {
      setVoiceProfileGateError('페르소나를 올바르게 선택해 주세요.')
      return
    }

    setIsCheckingVoiceProfile(true)
    setVoiceProfileGateError(null)

    try {
      const profile = await voiceProfileService.getVoiceProfile(personaId)
      setVoiceProfileGate(profile)

      if (!isVoiceProfileReadyForCall(profile)) {
        setVoiceProfileGateError('음성 대화를 시작하려면 음성 프로필이 준비되고 확인되어야 해요.')
        return
      }

      const chats = await chatService.listPersonaChats(personaId)
      const chat = chats[0] ?? (await chatService.createPersonaChat(personaId, { title: '새 대화' }))
      voiceCall.connect({ personaId, chatId: chat.id })
    } catch (error) {
      setVoiceProfileGate(null)
      setVoiceProfileGateError(getApiErrorMessage(error))
    } finally {
      setIsCheckingVoiceProfile(false)
    }
  }

  return (
    <AppShell title="음성 대화" subtitle="페르소나와 실시간 음성 대화를 진행할 수 있어요.">
      <main className="domain-page target-api-page voice-call-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">음성 대화</span>
            <h1>음성 대화</h1>
            <p>음성 프로필 준비 상태를 확인한 뒤 대화를 시작해 주세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">준비 확인</span>
        </header>

        <section className="voice-call-layout">
          <div className="voice-call-panel voice-call-panel--controls">
                {canConnect && !personaIdInput && (
              <TargetStateMessage
                action={{ href: '/personas', label: '페르소나 선택하기' }}
                title="먼저 페르소나를 선택해 주세요"
                message="페르소나를 선택한 뒤 음성 대화를 시작할 수 있어요."
              />
            )}
            <button disabled={!canConnect || !personaIdInput || voiceCall.status === 'connecting' || isCheckingVoiceProfile} onClick={() => void handleConnect()} type="button">
              {isCheckingVoiceProfile ? '준비 상태 확인 중...' : voiceCall.status === 'connecting' ? '연결 중...' : '연결하기'}
            </button>

            <div className="voice-call-status-card">
              <span className={`voice-call-status voice-call-status--${voiceCall.status}`}>{voiceStatusLabel[voiceCall.status]}</span>
              <dl>
                <div>
                  <dt>세션 상태</dt>
                  <dd>{voiceCall.sessionId ?? '시작 전'}</dd>
                </div>
                <div>
                  <dt>음성 형식</dt>
                  <dd>오디오</dd>
                </div>
                <div>
                  <dt>음성 프로필 상태</dt>
                  <dd>{getDisplayLabel(voiceProfileGate?.status)}</dd>
                </div>
                <div>
                  <dt>확인 상태</dt>
                  <dd>{getDisplayLabel(voiceProfileGate?.review_status)}</dd>
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
                음성 조각을 녹음하려면 브라우저 마이크 권한이 필요합니다.</p>
            )}

            <div className="voice-call-actions" aria-label="음성 통화 컨트롤">
              <button disabled={!canRecord} onClick={() => void voiceCall.startRecording()} type="button">
                말하기 시작</button>
              <button disabled={!canEndUtterance} onClick={voiceCall.endUtterance} type="button">
                발화 종료</button>
              <button disabled={!canStop} onClick={voiceCall.stopCall} type="button">
                통화 종료</button>
            </div>
          </div>

          <section className="voice-call-panel voice-call-panel--conversation" aria-label="음성 대화">
            <div className="voice-call-live-caption">
              <span>실시간 자막</span>
              <p>{voiceCall.partialTranscript || '실시간 자막을 기다리는 중...'}</p>
            </div>

            {voiceCall.messages.length === 0 && (
              <p className="persona-chat-empty">
                연결 후 말하기를 시작하고 발화 종료를 누르면 최종 자막과 페르소나 응답 이벤트를 받을 수 있습니다.</p>
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

function getRecordValue(record: Record<string, unknown>, key: string) {
  const value = record[key]

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (value === null || value === undefined) {
    return '없음'
  }

  return JSON.stringify(value)
}

function getRecordId(record: Record<string, unknown>) {
  const id = Number(record.id)
  return Number.isInteger(id) && id > 0 ? id : null
}

function AdminPermissionMessage({ message }: { message: string | null }) {
  if (!message) {
    return null
  }

  return <p className="target-form__error" role="alert">{message}</p>
}

function AdminDashboardApiPage() {
  const [counts, setCounts] = useState({ verifications: 0, reports: 0, auditLogs: 0, usageLimits: 0, rateLimitEvents: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    const [verificationsResult, reportsResult, auditLogsResult, usageLimitsResult, rateLimitEventsResult] = await Promise.allSettled([
      adminService.listVerificationRequests({ page: 1, size: 5 }),
      adminService.listReports({ page: 1, size: 5 }),
      adminService.listAuditLogs({ page: 1, size: 5 }),
      adminService.listUsageLimits({ page: 1, size: 5 }),
      adminService.listRateLimitEvents({ page: 1, size: 5 }),
    ])

    setCounts({
      verifications: verificationsResult.status === 'fulfilled' ? verificationsResult.value.total : 0,
      reports: reportsResult.status === 'fulfilled' ? reportsResult.value.total : 0,
      auditLogs: auditLogsResult.status === 'fulfilled' ? auditLogsResult.value.total : 0,
      usageLimits: usageLimitsResult.status === 'fulfilled' ? usageLimitsResult.value.total : 0,
      rateLimitEvents: rateLimitEventsResult.status === 'fulfilled' ? rateLimitEventsResult.value.total : 0,
    })

    const issues: string[] = []

    if (verificationsResult.status === 'rejected') {
      issues.push(getApiErrorMessage(verificationsResult.reason))
    }

    if (reportsResult.status === 'rejected') {
      issues.push(getApiErrorMessage(reportsResult.reason))
    }

    if (auditLogsResult.status === 'rejected') {
      issues.push(getApiErrorMessage(auditLogsResult.reason))
    }

    if (usageLimitsResult.status === 'rejected') {
      issues.push(getUsageLimitErrorMessage(usageLimitsResult.reason))
    }

    if (rateLimitEventsResult.status === 'rejected') {
      issues.push(getRateLimitErrorMessage(rateLimitEventsResult.reason))
    }

    setErrorMessage(issues.length > 0 ? issues.join('\n') : null)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadDashboard()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadDashboard])

  return (
    <AppShell title="관리자" subtitle="관리자 권한이 있는 계정만 이 화면을 이용할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">관리자 대시보드</span>
            <h1>관리자 대시보드</h1>
            <p>관리자 권한이 필요한 화면입니다.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected"></span>
        </header>

        <div className="target-form__actions">
          <a href="/admin/verification">입증 검토</a>
          <a href="/admin/reports">신고</a>
          <a href="/admin/audit-logs">활동 기록</a>
          <a href="/admin/voice-profiles">음성 프로필</a>
          <button disabled={isLoading} onClick={() => void loadDashboard()} type="button">{isLoading ? '불러오는 중...' : '새로고침'}</button>
        </div>

        <AdminPermissionMessage message={errorMessage} />
        {isLoading && <TargetStateMessage title="관리자 요약을 불러오는 중" message="요약 정보를 불러오고 있습니다." />}

        <section className="domain-page__metrics" aria-label="관리자 합계">
          <article><span>입증</span><strong>{counts.verifications}</strong></article>
          <article><span>신고</span><strong>{counts.reports}</strong></article>
          <article><span>감사 로그</span><strong>{counts.auditLogs}</strong></article>
          <article><span>사용량 제한</span><strong>{counts.usageLimits}</strong></article>
          <article><span>요청 제한 기록</span><strong>{counts.rateLimitEvents}</strong></article>
        </section>

        <AdminUsageLimitPanel />
      </main>
    </AppShell>
  )
}

function AdminVerificationCard({ request }: { request: VerificationRequestAdminResponse }) {
  return (
    <article className="target-card">
      <div className="target-card__body">
        <div className="target-card__title-row">
          <h2>요청 {request.id}</h2>
          <span>{request.status}</span>
        </div>
        <p>{request.original_filename}</p>
        <dl>
          <div><dt>사용자</dt><dd>{request.user_id}</dd></div>
          <div><dt>대상 연결</dt><dd>{request.target_id ? '연결됨' : '없음'}</dd></div>
          <div><dt>입증 방법</dt><dd>{getDisplayLabel(request.verification_type)}</dd></div>
          <div><dt>파일 형식</dt><dd>{request.mime_type}</dd></div>
          <div><dt>파일 크기</dt><dd>{formatFileSize(request.file_size)}</dd></div>
          <div><dt>관리자 메모</dt><dd>{request.admin_note ?? '없음'}</dd></div>
        </dl>
      </div>
    </article>
  )
}

function AdminVerificationReviewApiPage() {
  const [requests, setRequests] = useState<VerificationRequestAdminResponse[]>([])
  const [selected, setSelected] = useState<VerificationRequestAdminResponse | null>(null)
  const [status, setStatus] = useState<VerificationStatus | ''>('')
  const [requestId, setRequestId] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await adminService.listVerificationRequests({ status, page: 1, size: 20 })
      setRequests(response.items)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadRequests()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadRequests])

  function getRequestId() {
    const id = Number(requestId || selected?.id)
    return Number.isInteger(id) && id > 0 ? id : null
  }

  async function handleDetail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = getRequestId()

    if (!id) {
      setErrorMessage('요청 번호를 확인해 주세요.')
      return
    }

    try {
      setSelected(await adminService.getVerificationRequest(id))
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  async function handleDownloadFile() {
    const id = getRequestId()

    if (!id) {
      setErrorMessage('요청 번호를 확인해 주세요.')
      return
    }

    try {
      const blob = await adminService.downloadVerificationFile(id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  async function handleVerificationAction(action: 'approve' | 'reject' | 'need-more-info' | 'revoke') {
    const id = getRequestId()

    if (!id) {
      setErrorMessage('요청 번호를 확인해 주세요.')
      return
    }

    setErrorMessage(null)
    setNotice(null)

    try {
      let response: VerificationRequestAdminResponse

      if (action === 'approve') {
        response = await adminService.approveVerificationRequest(id, { admin_note: adminNote || null, expires_at: expiresAt ? new Date(expiresAt).toISOString() : null })
      } else if (action === 'reject') {
        response = await adminService.rejectVerificationRequest(id, { rejection_reason: rejectionReason, admin_note: adminNote || null })
      } else if (action === 'need-more-info') {
        response = await adminService.requestMoreVerificationInfo(id, { admin_note: adminNote })
      } else {
        response = await adminService.revokeVerificationRequest(id, { admin_note: adminNote || null })
      }

      setSelected(response)
      setNotice('입증 요청을 처리했어요.')
      await loadRequests()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  return (
    <AppShell title="관리자 입증 검토" subtitle="관계 입증 기록을 검토합니다.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">관리자 입증 검토</span>
            <h1>입증 검토</h1>
            <p>입증 요청 목록 확인, 상세 조회, 승인/거절/추가 정보 요청/승인 철회를 처리할 수 있어요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">입증 관리자</span>
        </header>

        <form className="target-form target-media-target-form" onSubmit={(event) => { event.preventDefault(); void loadRequests() }}>
          <div className="target-form__field">
            <label htmlFor="admin-verification-status">상태</label>
            <select id="admin-verification-status" onChange={(event) => setStatus(event.target.value as VerificationStatus | '')} value={status}>
              <option value="">전체</option>
              {verificationStatusOptions.map((option) => <option key={option} value={option}>{getDisplayLabel(option)}</option>)}
            </select>
          </div>
          <button disabled={isLoading} type="submit">{isLoading ? '불러오는 중...' : '불러오기'}</button>
        </form>

        <form className="target-form" onSubmit={handleDetail}>
          <div className="target-form__field">
            <label htmlFor="admin-verification-id">요청</label>
            <input id="admin-verification-id" inputMode="numeric" onChange={(event) => setRequestId(event.target.value)} type="number" value={requestId} />
          </div>
          <div className="target-form__field">
            <label htmlFor="admin-verification-note">관리자 메모</label>
            <textarea id="admin-verification-note" onChange={(event) => setAdminNote(event.target.value)} value={adminNote} />
          </div>
          <div className="target-form__field">
            <label htmlFor="admin-verification-rejection">거절 사유</label>
            <input id="admin-verification-rejection" minLength={5} onChange={(event) => setRejectionReason(event.target.value)} value={rejectionReason} />
          </div>
          <div className="target-form__field">
            <label htmlFor="admin-verification-expires">만료 시각</label>
            <input id="admin-verification-expires" onChange={(event) => setExpiresAt(event.target.value)} type="datetime-local" value={expiresAt} />
          </div>
          <div className="target-form__actions">
            <button type="submit">상세 불러오기</button>
            <button onClick={() => void handleDownloadFile()} type="button">증빙 파일 내려받기</button>
            <button onClick={() => void handleVerificationAction('approve')} type="button">승인</button>
            <button disabled={rejectionReason.length < 5} onClick={() => void handleVerificationAction('reject')} type="button">거절</button>
            <button disabled={adminNote.length < 5} onClick={() => void handleVerificationAction('need-more-info')} type="button">추가 정보 요청</button>
            <button onClick={() => void handleVerificationAction('revoke')} type="button">승인 철회</button>
          </div>
        </form>

        {notice && <p className="target-form__notice">{notice}</p>}
        <AdminPermissionMessage message={errorMessage} />
        {selected && <AdminVerificationCard request={selected} />}

        <section className="target-card-grid" aria-label="입증 요청 목록">
          {requests.map((request) => <AdminVerificationCard key={request.id} request={request} />)}
        </section>
      </main>
    </AppShell>
  )
}

function AdminReportCard({ report }: { report: AdminReportResponse }) {
  const id = getRecordId(report)

  return (
    <article className="target-card">
      <div className="target-card__body">
        <div className="target-card__title-row">
          <h2>Report{id ? `#${id}` : ''}</h2>
          <span>{getRecordValue(report, 'status')}</span>
        </div>
        <dl>
          {Object.keys(report).slice(0, 12).map((key) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{getRecordValue(report, key)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  )
}

function AdminReportsApiPage() {
  const [reports, setReports] = useState<AdminReportResponse[]>([])
  const [selected, setSelected] = useState<AdminReportResponse | null>(null)
  const [status, setStatus] = useState<ReportStatus | ''>('')
  const [reportId, setReportId] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [total, setTotal] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    try {
      const response = await adminService.listReports({ status, page: 1, size: 20 })
      setReports(response.items)
      setTotal(response.total)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }, [status])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadReports()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadReports])

  function getReportId() {
    const id = Number(reportId || (selected ? getRecordId(selected) : null))
    return Number.isInteger(id) && id > 0 ? id : null
  }

  async function handleDetail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = getReportId()

    if (!id) {
      setErrorMessage('신고 번호를 확인해 주세요.')
      return
    }

    try {
      setSelected(await adminService.getReport(id))
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  async function handleAction(action: AdminReportAction) {
    const id = getReportId()

    if (!id) {
      setErrorMessage('신고 번호를 확인해 주세요.')
      return
    }

    try {
      const response = await adminService.updateReport(id, action, adminNote ? { admin_note: adminNote } : null)
      setSelected(response)
      setNotice(`신고 ${id}번 상태를 변경했어요.`)
      setErrorMessage(null)
      await loadReports()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  return (
    <AppShell title="관리자 신고" subtitle="사용자 신고를 검토하고 처리 상태를 변경할 수 있어요.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">관리자 신고</span>
            <h1>관리자 신고</h1>
            <p>신고 내용을 확인하고 상태를 업데이트해 주세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">신고 관리자</span>
        </header>

        <form className="target-form target-media-target-form" onSubmit={(event) => { event.preventDefault(); void loadReports() }}>
          <div className="target-form__field">
            <label htmlFor="admin-report-status">상태</label>
            <select id="admin-report-status" onChange={(event) => setStatus(event.target.value as ReportStatus | '')} value={status}>
              <option value="">전체</option>
              {reportStatusOptions.map((option) => <option key={option} value={option}>{getDisplayLabel(option)}</option>)}
            </select>
          </div>
          <button type="submit">신고 불러오기</button>
        </form>

        <form className="target-form" onSubmit={handleDetail}>
          <div className="target-form__field">
            <label htmlFor="admin-report-id">신고 번호</label>
            <input id="admin-report-id" inputMode="numeric" onChange={(event) => setReportId(event.target.value)} type="number" value={reportId} />
          </div>
          <div className="target-form__field">
            <label htmlFor="admin-report-note">관리자 메모</label>
            <textarea id="admin-report-note" onChange={(event) => setAdminNote(event.target.value)} value={adminNote} />
          </div>
          <div className="target-form__actions">
            <button type="submit">상세 불러오기</button>
            {adminReportActionOptions.map((action) => (
              <button key={action} onClick={() => void handleAction(action)} type="button">{getAdminReportActionLabel(action)}</button>
            ))}
          </div>
        </form>

        {notice && <p className="target-form__notice">{notice}</p>}
        <AdminPermissionMessage message={errorMessage} />
        <section className="domain-page__metrics"><article><span>전체</span><strong>{total}</strong></article></section>
        {selected && <AdminReportCard report={selected} />}
        <section className="target-card-grid" aria-label="관리자 신고">
          {reports.map((report, index) => <AdminReportCard key={`${getRecordId(report) ?? index}`} report={report} />)}
        </section>
      </main>
    </AppShell>
  )
}

function AdminAuditLogsApiPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([])
  const [rateLimitEvents, setRateLimitEvents] = useState<RateLimitEventResponse[]>([])
  const [action, setAction] = useState<AuditAction | ''>('')
  const [targetType, setTargetType] = useState<AuditTargetType | ''>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadLogs = useCallback(async () => {
    const [logsResult, rateLimitsResult] = await Promise.allSettled([
      adminService.listAuditLogs({ action, target_type: targetType, page: 1, size: 20 }),
      adminService.listRateLimitEvents({ page: 1, size: 20 }),
    ])

    if (logsResult.status === 'fulfilled') {
      setAuditLogs(logsResult.value.items)
    } else {
      setAuditLogs([])
    }

    if (rateLimitsResult.status === 'fulfilled') {
      setRateLimitEvents(rateLimitsResult.value.items)
    } else {
      setRateLimitEvents([])
    }

    const issues: string[] = []
    if (logsResult.status === 'rejected') {
      issues.push(getApiErrorMessage(logsResult.reason))
    }
    if (rateLimitsResult.status === 'rejected') {
      issues.push(getRateLimitErrorMessage(rateLimitsResult.reason))
    }

    setErrorMessage(issues.length > 0 ? issues.join('\n') : null)
  }, [action, targetType])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadLogs()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadLogs])

  return (
    <AppShell title="활동 기록" subtitle="서비스 활동과 요청 제한 기록을 확인합니다.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">관리자 감사 로그</span>
            <h1>감사 로그</h1>
            <p>필터로 필요한 활동만 골라 확인할 수 있어요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">활동 로그</span>
        </header>

        <form className="target-form target-media-target-form" onSubmit={(event) => { event.preventDefault(); void loadLogs() }}>
          <div className="target-form__field">
            <label htmlFor="audit-action">작업</label>
            <select id="audit-action" onChange={(event) => setAction(event.target.value as AuditAction | '')} value={action}>
              <option value="">전체</option>
              {auditActionOptions.map((option) => <option key={option} value={option}>{getDisplayLabel(option)}</option>)}
            </select>
          </div>
          <div className="target-form__field">
            <label htmlFor="audit-target-type">대상 유형</label>
            <select id="audit-target-type" onChange={(event) => setTargetType(event.target.value as AuditTargetType | '')} value={targetType}>
              <option value="">전체</option>
              {auditTargetTypeOptions.map((option) => <option key={option} value={option}>{getDisplayLabel(option)}</option>)}
            </select>
          </div>
          <button type="submit">로그 불러오기</button>
        </form>

        <AdminPermissionMessage message={errorMessage} />
        <section className="target-card-grid" aria-label="감사 로그">
          {auditLogs.map((log) => (
            <article className="target-card" key={log.id}>
              <div className="target-card__body">
                <div className="target-card__title-row"><h2>{log.action}</h2><span>#{log.id}</span></div>
                <p>{log.description ?? '설명이 없습니다.'}</p>
                <dl>
                  <div><dt>행동한 사용자</dt><dd>{log.actor_user_id ?? '없음'}</dd></div>
                  <div><dt>대상 유형</dt><dd>{log.target_type ?? '없음'}</dd></div>
          <div><dt>대상 연결</dt><dd>{log.target_id ? '연결됨' : '없음'}</dd></div>
                  <div><dt>기록 시각</dt><dd>{formatDateTime(log.created_at)}</dd></div>
                </dl>
              </div>
            </article>
          ))}
        </section>

        <section className="target-card-grid" aria-label="요청 제한 기록">
          {rateLimitEvents.map((event) => (
            <article className="target-card" key={event.id}>
              <div className="target-card__body">
          <div className="target-card__title-row"><h2>{event.event_type}</h2><span>{event.blocked ? '차단됨' : '기록됨'}</span></div>
                <p>{event.reason ?? event.event_type}</p>
                <dl>
                  <div><dt>사용자</dt><dd>{event.user_id ?? '없음'}</dd></div>
                  <div><dt>횟수</dt><dd>{event.count}</dd></div>
                  <div><dt>집계 구간(초)</dt><dd>{event.window_seconds ?? '없음'}</dd></div>
                  <div><dt>기록 시각</dt><dd>{formatDateTime(event.created_at)}</dd></div>
                </dl>
              </div>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  )
}

function AdminVoiceProfileReviewApiPage() {
  const [voiceProfileId, setVoiceProfileId] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [profile, setProfile] = useState<PersonaVoiceProfileResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function getVoiceProfileId() {
    const id = Number(voiceProfileId || profile?.id)
    return Number.isInteger(id) && id > 0 ? id : null
  }

  async function handleLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = getVoiceProfileId()

    if (!id) {
      setErrorMessage('음성 프로필 번호를 확인해 주세요.')
      return
    }

    try {
      setProfile(await adminService.getVoiceProfile(id))
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  async function handleAction(action: 'approve' | 'reject' | 'revoke') {
    const id = getVoiceProfileId()

    if (!id) {
      setErrorMessage('음성 프로필 번호를 확인해 주세요.')
      return
    }

    try {
      const payload = { review_note: reviewNote || null }
      const response =
        action === 'approve'
          ? await adminService.approveVoiceProfile(id, payload)
          : action === 'reject'
            ? await adminService.rejectVoiceProfile(id, payload)
            : await adminService.revokeVoiceProfile(id, payload)
      setProfile(response)
      setNotice(`음성 프로필 ${response.id} 처리 결과를 저장했어요.`)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  return (
    <AppShell title="관리자 음성 프로필" subtitle="음성 프로필 기록을 검토합니다.">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">관리자 음성 프로필 검토</span>
            <h1>음성 프로필 검토</h1>
            <p>상세 확인 후 승인, 거절, 승인 철회를 진행할 수 있어요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">음성 프로필 관리자</span>
        </header>

        <form className="target-form" onSubmit={handleLoad}>
          <div className="target-form__field">
            <label htmlFor="admin-voice-profile-id">음성 프로필 번호</label>
            <input id="admin-voice-profile-id" inputMode="numeric" onChange={(event) => setVoiceProfileId(event.target.value)} type="number" value={voiceProfileId} />
          </div>
          <div className="target-form__field">
            <label htmlFor="admin-voice-profile-note">검토 메모</label>
            <textarea id="admin-voice-profile-note" onChange={(event) => setReviewNote(event.target.value)} value={reviewNote} />
          </div>
          <div className="target-form__actions">
            <button type="submit">프로필 불러오기</button>
            <button onClick={() => void handleAction('approve')} type="button">승인</button>
            <button onClick={() => void handleAction('reject')} type="button">거절</button>
            <button onClick={() => void handleAction('revoke')} type="button">승인 철회</button>
          </div>
        </form>

        {notice && <p className="target-form__notice">{notice}</p>}
        <AdminPermissionMessage message={errorMessage} />
        {profile && <VoiceProfileDetailCard profile={profile} />}
      </main>
    </AppShell>
  )
}

function AdminUsageLimitPanel() {
  const [usageLimits, setUsageLimits] = useState<UsageLimitResponse[]>([])
  const [userId, setUserId] = useState('')
  const [personaId, setPersonaId] = useState('')
  const [voiceLimit, setVoiceLimit] = useState('')
  const [sttLimit, setSttLimit] = useState('')
  const [callLimit, setCallLimit] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [technicalDetail, setTechnicalDetail] = useState<string | null>(null)

  const loadUsageLimits = useCallback(async () => {
    setIsLoading(true)
    setNotice(null)

    try {
      const response = await adminService.listUsageLimits({ page: 1, size: 20 })
      setUsageLimits(response.items)
      setErrorMessage(null)
      setTechnicalDetail(null)
    } catch (error) {
      setErrorMessage(getUsageLimitErrorMessage(error))
      setTechnicalDetail(getApiErrorDetailText(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  async function updateUserLimit() {
    const id = Number(userId)

    if (!Number.isInteger(id) || id <= 0) {
      setErrorMessage('사용자 번호를 확인해 주세요.')
      return
    }

    try {
      await adminService.updateUserUsageLimit(id, {
        voice_generation_limit: voiceLimit ? Number(voiceLimit) : null,
        stt_request_limit: sttLimit ? Number(sttLimit) : null,
        voice_call_seconds_limit: callLimit ? Number(callLimit) : null,
      })
      setNotice('사용자 이용 한도를 저장했어요.')
      setTechnicalDetail(null)
      await loadUsageLimits()
    } catch (error) {
      setErrorMessage(getUsageLimitErrorMessage(error))
      setTechnicalDetail(getApiErrorDetailText(error))
    }
  }

  async function updatePersonaLimit() {
    const id = Number(personaId)

    if (!Number.isInteger(id) || id <= 0) {
      setErrorMessage('페르소나 번호를 확인해 주세요.')
      return
    }

    try {
      await adminService.updatePersonaUsageLimit(id, {
        voice_generation_limit: voiceLimit ? Number(voiceLimit) : null,
        voice_call_seconds_limit: callLimit ? Number(callLimit) : null,
      })
      setNotice('페르소나 이용 한도를 저장했어요.')
      setTechnicalDetail(null)
    } catch (error) {
      setErrorMessage(getUsageLimitErrorMessage(error))
      setTechnicalDetail(getApiErrorDetailText(error))
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadUsageLimits()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadUsageLimits])

  return (
    <section className="target-detail-card">
      <h2>사용량 제한</h2>
      <p className="target-form__helper">연결 상태: {ADMIN_USAGE_API_STATUS}</p>

      <form className="target-form target-media-target-form" onSubmit={(event) => { event.preventDefault(); void updateUserLimit() }}>
        <div className="target-form__field"><label htmlFor="usage-user-id">사용자 번호</label><input id="usage-user-id" onChange={(event) => setUserId(event.target.value)} type="number" value={userId} /></div>
        <div className="target-form__field"><label htmlFor="usage-persona-id">페르소나 번호</label><input id="usage-persona-id" onChange={(event) => setPersonaId(event.target.value)} type="number" value={personaId} /></div>
        <div className="target-form__field"><label htmlFor="usage-voice-limit">음성 생성 한도</label><input id="usage-voice-limit" onChange={(event) => setVoiceLimit(event.target.value)} type="number" value={voiceLimit} /></div>
        <div className="target-form__field"><label htmlFor="usage-stt-limit">음성 인식 한도</label><input id="usage-stt-limit" onChange={(event) => setSttLimit(event.target.value)} type="number" value={sttLimit} /></div>
        <div className="target-form__field"><label htmlFor="usage-call-limit">음성 대화 시간 한도(초)</label><input id="usage-call-limit" onChange={(event) => setCallLimit(event.target.value)} type="number" value={callLimit} /></div>
        <div className="target-form__actions">
          <button disabled={isLoading} type="submit">사용자 제한 수정</button>
          <button disabled={isLoading} onClick={() => void updatePersonaLimit()} type="button">페르소나 제한 수정</button>
          <button disabled={isLoading} onClick={() => void loadUsageLimits()} type="button">{isLoading ? '불러오는 중...' : '새로고침'}</button>
        </div>
      </form>
      {notice && <p className="target-form__notice">{notice}</p>}
      <AdminPermissionMessage message={errorMessage} />
      {technicalDetail && (
        <details className="target-form__helper">
          <summary>자세히 보기</summary>
          <pre>{technicalDetail}</pre>
        </details>
      )}
      {!isLoading && usageLimits.length === 0 && (
        <TargetStateMessage title="이용 한도 데이터가 없어요" message="현재 등록된 이용 한도 데이터가 없어요." />
      )}
      <section className="target-card-grid" aria-label="사용량 제한">
        {usageLimits.map((limit) => (
          <article className="target-card" key={limit.id}>
            <div className="target-card__body">
              <div className="target-card__title-row"><h2>User #{limit.user_id}</h2><span>{limit.period_ym}</span></div>
              <dl>
                <div><dt>voice_generation</dt><dd>{limit.voice_generation_count} /{limit.voice_generation_limit}</dd></div>
                <div><dt>음성 인식</dt><dd>{limit.stt_request_count} /{limit.stt_request_limit}</dd></div>
                <div><dt>voice_call_seconds</dt><dd>{limit.voice_call_seconds} /{limit.voice_call_seconds_limit}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </section>
    </section>
  )
}

export function MockFeaturePage({ pageKey }: { pageKey: MockFeaturePageKey }) {
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

            <div className="mock-feature-list" aria-label={`${page.title} 예시 기록`}>
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
              <h2>나중에 제공</h2>
              <div className="mock-feature-actions">
                {page.actions.map((action) => (
                  <button disabled key={action.label} title={action.disabledReason} type="button">
                    {action.label}
                  </button>
                ))}
              </div>
              <p className="mock-feature-disabled-note">아직 준비 중인 기능입니다.{page.developerNote}</p>
            </section>

            <section className="mock-feature-endpoints" aria-label="준비 중인 항목">
              <h2>준비 중인 항목</h2>
              <ul>
                {page.plannedItems.map((item) => (
                  <li key={item.label}>
                    <span>준비 중</span>
                    <code>{item.label}</code>
                    {item.note && <small>{item.note}</small>}
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

function toFriendlyErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    const detail = typeof error.detail === 'string' ? error.detail : ''
    return detail ? `관리자 승인 후 이용할 수 있어요. ${detail}` : '관리자 승인 후 이용할 수 있어요.'
  }

  return getApiErrorMessage(error)
}

function ConsentApiPageV2() {
  const [initialTargetId] = useState(() => getTargetIdFromLocation())
  const [activeTargetId, setActiveTargetId] = useState<number | null>(null)
  const [consents, setConsents] = useState<ConsentResponse[]>([])
  const [consentNote, setConsentNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [revokingConsentId, setRevokingConsentId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const requiredConsentOptions: ConsentType[] = [
    'ai_persona_creation_consent',
    'ai_response_notice_consent',
    'voice_cloning_consent',
    'data_retention_consent',
    'third_party_ai_processing_consent',
  ]
  const optionalConsentOptions: ConsentType[] = [
    'target_profile_consent',
    'photo_upload_consent',
    'voice_upload_consent',
    'storybook_share_consent',
    'group_share_consent',
  ]

  const [selectedConsentTypes, setSelectedConsentTypes] = useState<ConsentType[]>(requiredConsentOptions)

  const loadConsents = useCallback(async (targetId: number) => {
    setIsLoading(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      const response = await consentService.listTargetConsents(targetId)
      setConsents(response)
      setActiveTargetId(targetId)
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialTargetId) {
      return
    }

    const timerId = window.setTimeout(() => {
      void loadConsents(initialTargetId)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [initialTargetId, loadConsents])

  function toggleConsent(type: ConsentType) {
    setSelectedConsentTypes((previous) => {
      if (previous.includes(type)) {
        return previous.filter((item) => item !== type)
      }

      return [...previous, type]
    })
  }

  async function handleCreateConsent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeTargetId) {
      setErrorMessage('대상을 먼저 선택해 주세요.')
      return
    }

    if (selectedConsentTypes.length === 0) {
      setErrorMessage('저장할 동의 항목을 선택해 주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      await Promise.all(
        selectedConsentTypes.map((consentType) => consentService.createConsent({
          target_id: activeTargetId,
          consent_type: consentType,
          consent_version: 'v1',
          details: consentNote || null,
          is_agreed: true,
          is_consented: true,
        })),
      )
      setNotice('선택한 동의를 저장했어요.')
      await loadConsents(activeTargetId)
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error))
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

    try {
      await consentService.revokeConsent(consentId)
      setNotice('동의를 철회했어요.')
      await loadConsents(activeTargetId)
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error))
    } finally {
      setRevokingConsentId(null)
    }
  }

  return (
    <AppShell title="동의 관리" subtitle="페르소나를 만들기 전에 필요한 동의 항목을 한 번에 확인할 수 있어요." badge="필수 단계">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">동의</span>
            <h1>필요한 동의를 확인해 주세요.</h1>
            <p>필수 동의와 선택 동의를 구분해서 저장할 수 있어요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">필수 단계</span>
        </header>

        <TargetSelector
          selectedId={activeTargetId}
          title="동의를 확인할 대상을 선택해 주세요."
          onSelect={(target) => {
            void loadConsents(target.id)
          }}
        />

        <form className="target-form" onSubmit={handleCreateConsent}>
          <div className="target-form__field">
            <label>필수 동의</label>
            <div className="target-form__checkbox-list">
              {requiredConsentOptions.map((option) => (
                <label className="target-form__checkbox" key={option}>
                  <input checked={selectedConsentTypes.includes(option)} onChange={() => toggleConsent(option)} type="checkbox" />
                  <span>{getDisplayLabel(option)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="target-form__field">
            <label>선택 동의</label>
            <div className="target-form__checkbox-list">
              {optionalConsentOptions.map((option) => (
                <label className="target-form__checkbox" key={option}>
                  <input checked={selectedConsentTypes.includes(option)} onChange={() => toggleConsent(option)} type="checkbox" />
                  <span>{getDisplayLabel(option)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="target-form__field">
            <label htmlFor="consent-note-v2">관리자에게 남길 메모, 선택 사항</label>
            <textarea id="consent-note-v2" onChange={(event) => setConsentNote(event.target.value)} rows={3} value={consentNote} />
          </div>

          {notice && <p className="target-form__notice">{notice}</p>}
          {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}

          <div className="target-form__actions">
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? '저장 중...' : '선택한 동의 저장하기'}
            </button>
          </div>
        </form>

        <section className="target-card-grid" aria-label="동의 기록">
          {consents.map((consent) => (
            <article className="target-card" key={consent.id}>
              <div className="target-card__body">
                <div className="target-card__title-row">
                  <h2>{getDisplayLabel(consent.consent_type)}</h2>
                  <span>{consent.revoked_at ? '철회됨' : consent.is_consented ? '동의 완료' : '미동의'}</span>
                </div>
                <dl>
                  <div>
                    <dt>동의 버전</dt>
                    <dd>{consent.consent_version}</dd>
                  </div>
                  <div>
                    <dt>동의 시각</dt>
                    <dd>{consent.agreed_at ? formatDateTime(consent.agreed_at) : '없음'}</dd>
                  </div>
                  <div>
                    <dt>철회 시각</dt>
                    <dd>{consent.revoked_at ? formatDateTime(consent.revoked_at) : '없음'}</dd>
                  </div>
                </dl>
                {consent.details && <p>{consent.details}</p>}
                <button disabled={Boolean(consent.revoked_at) || revokingConsentId === consent.id} onClick={() => void handleRevoke(consent.id)} type="button">
                  {revokingConsentId === consent.id ? '철회 중...' : '동의 철회'}
                </button>
              </div>
            </article>
          ))}
        </section>

        {activeTargetId && consents.length === 0 && !isLoading && (
          <TargetStateMessage title="동의 기록이 없어요" message="아직 저장된 동의가 없어요. 위에서 필요한 항목을 선택해 저장해 주세요." />
        )}
      </main>
    </AppShell>
  )
}

function getVerificationStatusMessageV2(status: VerificationStatus) {
  if (status === 'APPROVED') return '승인 완료 상태예요. 페르소나 만들기를 진행할 수 있어요.'
  if (status === 'PENDING') return '관리자 검토를 기다리는 중이에요.'
  if (status === 'NEED_MORE_INFO') return '추가 자료가 필요해요. 상세 안내를 확인해 주세요.'
  if (status === 'REJECTED') return '요청이 반려되었어요. 안내 사유를 확인해 주세요.'
  if (status === 'EXPIRED') return '유효 기간이 지났어요. 다시 요청해 주세요.'
  if (status === 'REVOKED') return '철회된 요청이에요. 필요하면 새로 요청해 주세요.'
  return status
}

function TargetVerificationApiPageV2() {
  const [initialTargetId] = useState(() => getTargetIdFromLocation())
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

  const loadRequests = useCallback(async (targetId: number) => {
    setIsLoading(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      const response = await verificationService.listTargetVerificationRequests(targetId, { skip: 0, limit: 20 })
      setRequests(response.items)
      setActiveTargetId(targetId)
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialTargetId) {
      return
    }

    const timerId = window.setTimeout(() => {
      void loadRequests(initialTargetId)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [initialTargetId, loadRequests])

  async function handleSubmitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeTargetId) {
      setErrorMessage('대상을 먼저 선택해 주세요.')
      return
    }

    if (!file) {
      setErrorMessage('증빙 자료 파일을 선택해 주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      await verificationService.createVerificationRequest(activeTargetId, {
        verification_type_param: verificationType,
        applicant_note: applicantNote || null,
        file,
      })
      setNotice('관계 입증 요청을 보냈어요.')
      setFile(null)
      await loadRequests(activeTargetId)
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleOpenDetail(requestId: number) {
    setErrorMessage(null)
    setNotice(null)

    try {
      const detail = await verificationService.getVerificationRequest(requestId)
      setSelectedRequest(detail)
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error))
    }
  }

  return (
    <AppShell title="관계 입증 요청" subtitle="안전한 페르소나 생성을 위해 관계를 확인할 수 있는 자료가 필요해요." badge="승인 필요">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">관계 입증</span>
            <h1>관계 입증 요청하기</h1>
            <p>입증 방식과 증빙 자료를 선택해 요청을 제출해 주세요.</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">승인 필요</span>
        </header>

        <TargetSelector
          selectedId={activeTargetId}
          title="관계를 확인할 대상을 선택해 주세요."
          onSelect={(target) => {
            void loadRequests(target.id)
          }}
        />

        <form className="target-form" onSubmit={handleSubmitVerification}>
          <div className="target-form__field">
            <label htmlFor="verification-type-v2">입증 방식 선택</label>
            <select
              id="verification-type-v2"
              onChange={(event) => setVerificationType(event.target.value as VerificationType)}
              value={verificationType}
            >
              {verificationTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {getDisplayLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="target-form__field">
            <label htmlFor="applicant-note-v2">관리자에게 남길 메모, 선택 사항</label>
            <textarea id="applicant-note-v2" onChange={(event) => setApplicantNote(event.target.value)} rows={4} value={applicantNote} />
          </div>

          <div className="target-form__field">
            <label htmlFor="verification-file-v2">증빙 자료 올리기</label>
            <input id="verification-file-v2" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required type="file" />
            <p className="target-form__helper">가족관계증명서, 신분증 일부 가림본, 서명 확인서 등 관계를 확인할 수 있는 파일을 올려 주세요.</p>
          </div>

          {notice && <p className="target-form__notice">{notice}</p>}
          {errorMessage && <p className="target-form__error" role="alert">{errorMessage}</p>}

          <div className="target-form__actions">
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? '요청 중...' : '관계 입증 요청하기'}
            </button>
          </div>
        </form>

        <section className="target-card-grid" aria-label="입증 요청">
          {requests.map((request) => (
            <article className="target-card" key={request.id}>
              <div className="target-card__body">
                <div className="target-card__title-row">
                  <h2>{getDisplayLabel(request.verification_type)}</h2>
                  <span>{getDisplayLabel(request.status)}</span>
                </div>
                <p>{getVerificationStatusMessageV2(request.status)}</p>
                <dl>
                  <div>
                    <dt>제출 파일</dt>
                    <dd>{request.original_filename}</dd>
                  </div>
                  <div>
                    <dt>파일 형식</dt>
                    <dd>{request.mime_type}</dd>
                  </div>
                  <div>
                    <dt>파일 크기</dt>
                    <dd>{formatFileSize(request.file_size)}</dd>
                  </div>
                  <div>
                    <dt>요청일</dt>
                    <dd>{formatDateTime(request.created_at)}</dd>
                  </div>
                </dl>
                {request.admin_note && <p>검토 메모: {request.admin_note}</p>}
                {request.rejection_reason && <p>안내 사유: {request.rejection_reason}</p>}
                <button onClick={() => void handleOpenDetail(request.id)} type="button">
                  상세 보기
                </button>
              </div>
            </article>
          ))}
        </section>

        {activeTargetId && requests.length === 0 && !isLoading && (
          <TargetStateMessage title="관계 입증 요청이 없어요" message="페르소나를 만들기 전에 관계 입증 요청을 진행해 주세요." />
        )}

        {selectedRequest && (
          <section className="target-detail-card">
            <h2>입증 상세</h2>
            <dl>
              <div>
                <dt>상태</dt>
                <dd>{getDisplayLabel(selectedRequest.status)}</dd>
              </div>
              <div>
                <dt>추가 설명</dt>
                <dd>{selectedRequest.applicant_note ?? '없음'}</dd>
              </div>
              <div>
                <dt>관리자 메모</dt>
                <dd>{selectedRequest.admin_note ?? '없음'}</dd>
              </div>
              <div>
                <dt>검토 시각</dt>
                <dd>{selectedRequest.reviewed_at ? formatDateTime(selectedRequest.reviewed_at) : '없음'}</dd>
              </div>
              <div>
                <dt>유효 기한</dt>
                <dd>{selectedRequest.expires_at ? formatDateTime(selectedRequest.expires_at) : '없음'}</dd>
              </div>
            </dl>
          </section>
        )}
      </main>
    </AppShell>
  )
}

void ConsentApiPage
void TargetVerificationApiPage


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
  return <ConsentApiPageV2 />
}

export function TargetVerificationPage() {
  return <TargetVerificationApiPageV2 />
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
  return <InterviewListApiPage />
}

export function InterviewSessionPage() {
  return <InterviewSessionApiPage />
}

export function PhotoMemoryListPage() {
  return <PhotoMemoryListApiPage />
}

export function PhotoMemoryUploadPage() {
  return <PhotoMemoryUploadApiPage />
}

export function StorybookListPage() {
  return <StorybookListApiPage />
}

export function StorybookDetailPage() {
  return <StorybookDetailApiPage />
}

export function StorybookCreatePage() {
  return <StorybookCreateApiPage />
}

export function StorybookSharePage() {
  return <StorybookShareApiPage />
}

export function PublicSharePage() {
  return <PublicShareApiPage />
}

export function MemoryGroupListPage() {
  return <MemoryGroupListApiPage />
}

export function MemoryGroupDetailPage() {
  return <MemoryGroupDetailApiPage />
}

export function DeletionRequestPage() {
  return <DeletionRequestApiPage />
}

export function ReportPage() {
  return <ReportApiPage />
}

export function AdminDashboardPage() {
  return <AdminDashboardApiPage />
}

export function AdminVerificationReviewPage() {
  return <AdminVerificationReviewApiPage />
}

export function AdminReportsPage() {
  return <AdminReportsApiPage />
}

export function AdminAuditLogsPage() {
  return <AdminAuditLogsApiPage />
}

export function AdminVoiceProfileReviewPage() {
  return <AdminVoiceProfileReviewApiPage />
}

