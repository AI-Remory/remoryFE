import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { ApiError } from '../lib/apiClient'
import { normalizeAssetUrl } from '../lib/mediaUrl'
import { getKoreanSafeText, getPersonaDisplayNameText } from '../lib/personaDisplayText'
import { consentApi, CONSENT_TYPES } from '../services/consentApi'
import { personaApi } from '../services/personaApi'
import {
  clearActivePersonaSession,
  getActiveTargetId,
  storeActivePersonaSession,
  storeActiveTargetId,
} from '../services/personaSession'
import { targetApi } from '../services/targetApi'
import { verificationApi } from '../services/verificationApi'
import type { ApiId, ConsentType, Persona, VerificationRequest, VerificationStatus, VerificationType } from '../types/api'
import './SetupPage.css'

type SetupStep = 1 | 2 | 3 | 4 | 5
type ConsentKey =
  | 'privacy'
  | 'photo'
  | 'voice'
  | 'voiceCloning'
  | 'persona'
  | 'aiNotice'
  | 'dataRetention'
  | 'thirdPartyAi'
type SetupIconName =
  | 'arrow'
  | 'back'
  | 'camera'
  | 'chat'
  | 'check'
  | 'chevron'
  | 'edit'
  | 'flower'
  | 'heart'
  | 'home'
  | 'image'
  | 'mic'
  | 'note'
  | 'play'
  | 'plus'
  | 'sparkle'
  | 'upload'
  | 'user'

type RelationshipChoice = '엄마' | '아빠' | '할머니' | '친구' | '직접 입력'

type PersonaDraft = {
  name: string
  relationship: string
  relationshipLabel: string
  description: string
}

const TOTAL_STEPS = 5
const SETUP_COMPLETED_KEY = 'remory_setup_completed'
const SETUP_MEMORY_NOTES_KEY = 'remory_setup_memory_notes'
const defaultPhotoPreviewPaths = [
  '/images/setup/setup-photo-1.png',
  '/images/setup/setup-photo-2.png',
  '/images/setup/setup-photo-3.png',
]
const relationshipChoices: RelationshipChoice[] = ['엄마', '아빠', '할머니', '친구', '직접 입력']

const consentItems: Array<{ key: ConsentKey; label: string; type: ConsentType }> = [
  { key: 'privacy', label: '개인정보 및 프로필 동의', type: CONSENT_TYPES.targetProfile },
  { key: 'photo', label: '사진 업로드 동의', type: CONSENT_TYPES.photoUpload },
  { key: 'voice', label: '음성 업로드 동의', type: CONSENT_TYPES.voiceUpload },
  { key: 'voiceCloning', label: '음성 클로닝 동의', type: CONSENT_TYPES.voiceCloning },
  { key: 'persona', label: 'AI 페르소나 생성 동의', type: CONSENT_TYPES.aiPersonaCreation },
  { key: 'aiNotice', label: 'AI 응답 고지 동의', type: CONSENT_TYPES.aiResponseNotice },
  { key: 'dataRetention', label: '데이터 보관 동의', type: CONSENT_TYPES.dataRetention },
  { key: 'thirdPartyAi', label: '외부 AI 처리 동의', type: CONSENT_TYPES.thirdPartyAiProcessing },
]

const defaultConsents: Record<ConsentKey, boolean> = {
  privacy: false,
  photo: false,
  voice: false,
  voiceCloning: false,
  persona: false,
  aiNotice: false,
  dataRetention: false,
  thirdPartyAi: false,
}

const resubmittableVerificationStatuses = new Set<VerificationStatus>([
  'NEED_MORE_INFO',
  'REJECTED',
  'EXPIRED',
  'REVOKED',
])

function SetupIcon({ name, className }: { name: SetupIconName; className?: string }) {
  switch (name) {
    case 'back':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M20.8 6.8 11.6 16l9.2 9.2M12 16h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'image':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="5" y="7" width="22" height="18" rx="3.5" stroke="currentColor" strokeWidth="2.2" />
          <path d="m8.5 22 6.1-6.2 4.1 4 2.6-2.8 3.2 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="21.5" cy="12.5" r="2.1" fill="currentColor" />
        </svg>
      )
    case 'user':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="11.2" r="5.2" fill="currentColor" />
          <path d="M6.8 26.2c1.1-5.5 4.5-8.3 9.2-8.3s8.1 2.8 9.2 8.3" fill="currentColor" />
        </svg>
      )
    case 'mic':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="11.8" y="4.5" width="8.4" height="15" rx="4.2" stroke="currentColor" strokeWidth="2.3" />
          <path d="M7.5 15.8a8.5 8.5 0 0 0 17 0M16 24.5v3.3M11.7 27.8h8.6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      )
    case 'chat':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M7.4 22.4 5.6 27l5.1-1.4c1.5.7 3.3 1.1 5.3 1.1 6.4 0 11.6-4.5 11.6-10S22.4 6.8 16 6.8 4.4 11.3 4.4 16.8c0 2.1 1.1 4.1 3 5.6Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M11.1 16.9h.02M16 16.9h.02M20.9 16.9h.02" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'camera':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M11.2 10.2 13 7.5h6l1.8 2.7h3.7a2.5 2.5 0 0 1 2.5 2.5v10.1a2.5 2.5 0 0 1-2.5 2.5h-17A2.5 2.5 0 0 1 5 22.8V12.7a2.5 2.5 0 0 1 2.5-2.5h3.7Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx="16" cy="17.6" r="4.2" stroke="currentColor" strokeWidth="2.2" />
        </svg>
      )
    case 'plus':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'edit':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m4.5 16.6-.8 3.7 3.7-.8L18.8 8.1l-2.9-2.9L4.5 16.6Z" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m14.8 6.3 2.9 2.9" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      )
    case 'flower':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M23.8 39.5c.4-8.8 3.4-16.4 9-22.8" stroke="#9f8f6b" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M20.7 28.3c-3.7-6.4-8.2-9-13.5-7.9 1.1 5.2 4.8 8 11.1 8.4" fill="#d7c39a" />
          <path d="M29.6 19.6c-4.4-2.3-5-5.9-1.8-10.8 5.2 2.3 5.8 5.9 1.8 10.8Z" fill="#f2b58d" />
          <path d="M34.4 20.6c-.2-5 2.6-7.3 8.2-7-1 5.4-3.7 7.8-8.2 7Z" fill="#efc5a5" />
          <path d="M26.5 25.5c-4.5-3.8-4.6-7.6-.3-11.5 4.7 3.8 4.8 7.6.3 11.5Z" fill="#f3a874" />
          <path d="M26.8 33.2c4.8-2.3 8.2-1 10.1 3.8-5 1.9-8.4.6-10.1-3.8Z" fill="#d9caa0" />
        </svg>
      )
    case 'note':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M9 5.8h11.3L25 10.5v15.7H9V5.8Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M20.2 6.2v4.7h4.4M12.5 14.5h7.2M12.5 18.8h6.1M12.5 23h3.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'heart':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 27s-9.4-5.7-11.4-12.2C3.3 10.6 5.7 7 9.7 7c2.4 0 4.4 1.3 5.4 3.1C16.1 8.3 18.1 7 20.5 7c4 0 6.4 3.6 5.1 7.8C23.6 21.3 16 27 16 27Z" fill="currentColor" />
        </svg>
      )
    case 'home':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M5.5 15.5 16 6l10.5 9.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 14.5V27h7v-7h3v7h7V14.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'check':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m5.2 12.2 4.1 4.1 9.5-9.7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="m14.1 3.8 2.2 7.9 7.9 2.2-7.9 2.3-2.2 7.9-2.3-7.9-7.9-2.3 7.9-2.2 2.3-7.9Z" fill="currentColor" />
          <path d="m24.9 18.2 1.1 3.8 3.8 1.1-3.8 1.1-1.1 3.8-1.1-3.8-3.8-1.1 3.8-1.1 1.1-3.8Z" fill="currentColor" />
        </svg>
      )
    case 'upload':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 21V6.8M10.8 12l5.2-5.2 5.2 5.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.2 19.8v4.7A2.5 2.5 0 0 0 9.7 27h12.6a2.5 2.5 0 0 0 2.5-2.5v-4.7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'play':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m9 7 8 5-8 5V7Z" fill="currentColor" />
        </svg>
      )
    case 'chevron':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'arrow':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
  }
}

function StepProgress({ onBack, step }: { onBack?: () => void; step: SetupStep }) {
  return (
    <div
      className={`setup-page__progress${onBack ? ' setup-page__progress--with-back' : ''}`}
      aria-label={`초기 설정 ${TOTAL_STEPS}단계 중 ${step}단계`}
    >
      {onBack && (
        <button className="setup-page__back-button" type="button" aria-label="이전 단계로 돌아가기" onClick={onBack}>
          <SetupIcon name="back" />
        </button>
      )}
      <div className="setup-page__step-area">
        <p className="setup-page__step-count">
          <span>{step}</span>
          <em> / {TOTAL_STEPS}</em>
        </p>
        <div className="setup-page__dots" aria-hidden="true">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => {
            const dotStep = index + 1

            return (
              <span
                className={[
                  'setup-page__dot',
                  dotStep <= step ? 'setup-page__dot--active' : '',
                  dotStep === step ? 'setup-page__dot--current' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={`setup-step-dot-${dotStep}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function mapRelationshipToTargetType(relationship: RelationshipChoice, customRelationship: string) {
  switch (relationship) {
    case '엄마':
    case '아빠':
      return 'parent'
    case '할머니':
      return 'grandparent'
    case '친구':
      return 'friend'
    case '직접 입력':
      return customRelationship.trim() || 'other'
  }
}

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  return fallbackMessage
}

function getLatestVerificationRequest(requests: VerificationRequest[] | null | undefined) {
  if (!Array.isArray(requests)) {
    return null
  }

  return [...requests].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0

    return rightTime - leftTime
  })[0] ?? null
}

function getVerificationStatusTitle(status: VerificationStatus | null) {
  switch (status) {
    case null:
      return '검증 요청 없음'
    case 'PENDING':
      return '검수 대기 중'
    case 'NEED_MORE_INFO':
      return '추가 정보 필요'
    case 'APPROVED':
      return '검증 승인 완료'
    case 'REJECTED':
      return '검증 거절'
    case 'EXPIRED':
      return '검증 만료'
    case 'REVOKED':
      return '검증 철회'
    default:
      return String(status)
  }
}

function getVerificationStatusDescription(request: VerificationRequest | null) {
  const status = request?.status ?? null

  switch (status) {
    case null:
      return '페르소나 생성 전에 검증 자료를 제출해주세요.'
    case 'PENDING':
      return '관리자 검수가 끝나면 페르소나 생성 버튼이 활성화됩니다.'
    case 'NEED_MORE_INFO':
      return request?.reviewer_note ?? '추가 자료가 필요합니다. 파일을 보완해 다시 제출해주세요.'
    case 'APPROVED':
      return '검증이 승인되어 페르소나를 만들 수 있어요.'
    case 'REJECTED':
      return request?.reject_reason ?? request?.reason ?? '검증이 거절되었습니다. 다른 자료로 다시 제출해주세요.'
    case 'EXPIRED':
    case 'REVOKED':
      return '다시 검증 자료를 제출해주세요.'
    default:
      return '검증 상태를 확인하고 있어요.'
  }
}

function isSameApiId(left: ApiId | null | undefined, right: ApiId | null | undefined) {
  return left !== null && left !== undefined && right !== null && right !== undefined && String(left) === String(right)
}

function SetupPage() {
  const [step, setStep] = useState<SetupStep>(1)
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>(defaultConsents)
  const [personaDraft, setPersonaDraft] = useState<PersonaDraft>({
    name: '엄마',
    relationship: 'parent',
    relationshipLabel: '엄마',
    description: '따뜻한 조언을 해주는 분',
  })
  const [personaName, setPersonaName] = useState('')
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipChoice>('엄마')
  const [customRelationship, setCustomRelationship] = useState('')
  const [personaDescription, setPersonaDescription] = useState('')
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null)
  const [targetId, setTargetId] = useState<ApiId | null>(null)
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([])
  const [selectedVoiceFile, setSelectedVoiceFile] = useState<File | null>(null)
  const [verificationFile, setVerificationFile] = useState<File | null>(null)
  const [verificationType, setVerificationType] = useState<VerificationType>('SELF_DECLARATION')
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null)
  const [completedPersona, setCompletedPersona] = useState<Persona | null>(null)
  const [memoryNotes, setMemoryNotes] = useState<string[]>([])
  const [memoryNoteInput, setMemoryNoteInput] = useState('')
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false)
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [failedDefaultPhotoIndexes, setFailedDefaultPhotoIndexes] = useState<Set<number>>(() => new Set())
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [hasSavedSetupData, setHasSavedSetupData] = useState(false)
  const [isTargetValidated, setIsTargetValidated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshingVerification, setIsRefreshingVerification] = useState(false)

  const allConsented = consentItems.every((item) => consents[item.key])
  const savedPersonaName = personaDraft.name.trim() || '엄마'
  const personaRelationship = personaDraft.relationship.trim() || 'parent'
  const savedPersonaDescription = personaDraft.description.trim() || '따뜻한 조언을 해주는 분'
  const completePersonaName =
    getPersonaDisplayNameText(completedPersona, undefined, savedPersonaName)
  const completePersonaSummary =
    getKoreanSafeText(completedPersona?.personality_summary) ??
    getKoreanSafeText(completedPersona?.memory_summary) ??
    getKoreanSafeText(completedPersona?.description) ??
    savedPersonaDescription
  const memoryNoteCount = memoryNotes.length
  const completePhotoCount = selectedPhotoFiles.length + (profileImageFile ? 1 : 0)
  const completeVoiceCount = selectedVoiceFile ? 1 : 0
  const completeProfileImageSrc =
    normalizeAssetUrl(
      completedPersona?.image_url ??
        completedPersona?.image_path ??
        completedPersona?.profile_image_url ??
        completedPersona?.profile_image_path,
    ) || profileImagePreviewUrl || '/images/my-page/persona-mom.png'
  const verificationStatus = verificationRequest?.status ?? null
  const canCreatePersona = verificationStatus === 'APPROVED'
  const canSubmitVerification =
    verificationStatus === null || resubmittableVerificationStatuses.has(verificationStatus)

  const clearStaleSetupStorage = useCallback(() => {
    clearActivePersonaSession()
    window.localStorage.removeItem(SETUP_COMPLETED_KEY)
    window.localStorage.removeItem(SETUP_MEMORY_NOTES_KEY)
    window.sessionStorage.removeItem(SETUP_COMPLETED_KEY)
    window.sessionStorage.removeItem(SETUP_MEMORY_NOTES_KEY)
    setTargetId(null)
    setVerificationRequest(null)
    setCompletedPersona(null)
    setHasSavedSetupData(false)
    setErrorMessage('')
  }, [])

  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photoPreviewUrls])

  useEffect(() => {
    return () => {
      if (profileImagePreviewUrl) {
        URL.revokeObjectURL(profileImagePreviewUrl)
      }
    }
  }, [profileImagePreviewUrl])

  useEffect(() => {
    let ignore = false

    async function validateStoredTarget() {
      const storedTargetId = getActiveTargetId()

      setIsTargetValidated(false)

      try {
        const response = await targetApi.listTargets()

        if (ignore) {
          return
        }

        const hasStoredTarget = response.items.some((target) => isSameApiId(target.id, storedTargetId))

        if (hasStoredTarget && storedTargetId) {
          setTargetId(storedTargetId)
        } else {
          clearStaleSetupStorage()

          if (storedTargetId) {
            setStatusMessage('이전 설정 정보를 초기화했어요. 다시 진행해주세요.')
          }
        }
      } catch {
        if (!ignore) {
          clearStaleSetupStorage()

          if (storedTargetId) {
            setStatusMessage('이전 설정 정보를 확인하지 못해 초기화했어요. 다시 진행해주세요.')
          }
        }
      } finally {
        if (!ignore) {
          setIsTargetValidated(true)
        }
      }
    }

    validateStoredTarget()

    return () => {
      ignore = true
    }
  }, [clearStaleSetupStorage])

  useEffect(() => {
    if (!isTargetValidated || targetId === null) {
      return
    }

    const currentTargetId = targetId
    let ignore = false

    async function loadVerificationStatus() {
      try {
        const requests = await verificationApi.listTargetVerificationRequests(currentTargetId)
        const safeRequests = Array.isArray(requests) ? requests : []
        const latestRequest = getLatestVerificationRequest(safeRequests)

        if (!ignore) {
          setVerificationRequest(latestRequest)
        }
      } catch (error) {
        if (!ignore && error instanceof ApiError && error.status === 404) {
          clearStaleSetupStorage()
          setStatusMessage('이전 설정 정보를 초기화했어요. 다시 진행해주세요.')
        }
      }
    }

    loadVerificationStatus()

    return () => {
      ignore = true
    }
  }, [clearStaleSetupStorage, isTargetValidated, targetId])

  const handleConsentChange = (key: ConsentKey, checked: boolean) => {
    setConsents((current) => ({
      ...current,
      [key]: checked,
    }))
  }

  const handleAllConsentChange = (checked: boolean) => {
    setConsents({
      privacy: checked,
      photo: checked,
      voice: checked,
      voiceCloning: checked,
      persona: checked,
      aiNotice: checked,
      dataRetention: checked,
      thirdPartyAi: checked,
    })
  }

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null

    setProfileImageFile(nextFile)
    setProfileImagePreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null)
    event.target.value = ''
  }

  const handleRelationshipSelect = (relationship: RelationshipChoice) => {
    setSelectedRelationship(relationship)

    if (relationship !== '직접 입력') {
      setCustomRelationship('')
    }
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextPhotoFiles = Array.from(event.target.files ?? [])

    setSelectedPhotoFiles(nextPhotoFiles)
    setPhotoPreviewUrls(nextPhotoFiles.slice(0, 3).map((file) => URL.createObjectURL(file)))
    event.target.value = ''
  }

  const handleVoiceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedVoiceFile(event.target.files?.[0] ?? null)
    event.target.value = ''
  }

  const handleVerificationFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVerificationFile(event.target.files?.[0] ?? null)
    event.target.value = ''
  }

  const handleDefaultPhotoError = (index: number) => {
    setFailedDefaultPhotoIndexes((current) => {
      const next = new Set(current)
      next.add(index)
      return next
    })
  }

  const handleAddMemoryNote = () => {
    const nextNote = memoryNoteInput.trim()

    if (!nextNote) {
      return
    }

    setMemoryNotes((current) => [...current, nextNote])
    setMemoryNoteInput('')
    setIsNoteEditorOpen(false)
  }

  const handlePersonaSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    const nextName = personaName.trim()
    const nextCustomRelationship = customRelationship.trim()

    if (!nextName) {
      setErrorMessage('페르소나 이름을 입력해주세요.')
      return
    }

    if (selectedRelationship === '직접 입력' && !nextCustomRelationship) {
      setErrorMessage('관계를 입력해주세요.')
      return
    }

    const relationshipLabel = selectedRelationship === '직접 입력' ? nextCustomRelationship : selectedRelationship
    const description = personaDescription.trim() || `${nextName}의 기억을 남기고 싶어요.`

    setPersonaDraft({
      name: nextName,
      relationship: mapRelationshipToTargetType(selectedRelationship, nextCustomRelationship),
      relationshipLabel,
      description,
    })
    setStep(4)
  }

  const buildDescription = () => {
    if (memoryNotes.length === 0) {
      return savedPersonaDescription
    }

    return `${savedPersonaDescription}\n\n추가 기억:\n${memoryNotes.join('\n')}`
  }

  const ensureTargetId = async () => {
    if (targetId !== null) {
      return targetId
    }

    const target = await targetApi.createTarget({
      name: savedPersonaName,
      description: buildDescription(),
      target_type: personaRelationship,
    })

    setTargetId(target.id)
    storeActiveTargetId(target.id)

    return target.id
  }

  const saveConsents = async (nextTargetId: ApiId) => {
    let existingConsentTypes: Set<string>

    try {
      const existingConsents = await consentApi.listTargetConsents(nextTargetId)
      existingConsentTypes = new Set(existingConsents.map((consent) => consent.consent_type))
    } catch (error) {
      const message = getApiErrorMessage(error, '기존 동의 목록을 확인하지 못했습니다.')
      throw new Error(`기존 동의 확인에 실패했습니다: ${message}`, { cause: error })
    }

    for (const item of consentItems) {
      if (!consents[item.key] || existingConsentTypes.has(item.type)) {
        continue
      }

      try {
        await consentApi.createConsent({
          target_id: nextTargetId,
          consent_type: item.type,
          consent_version: 'v1',
          consent_text_snapshot: `${item.label}에 동의합니다.`,
          is_agreed: true,
          is_consented: true,
          details: JSON.stringify({
            source: 'setup',
            label: item.label,
            target_id: String(nextTargetId),
            agreed_at: new Date().toISOString(),
          }),
        })
        existingConsentTypes.add(item.type)
      } catch (error) {
        const message = getApiErrorMessage(error, 'API 요청에 실패했습니다.')
        throw new Error(`동의 저장에 실패했습니다 (${item.type}): ${message}`, { cause: error })
      }
    }
  }

  const uploadSelectedMedia = async (nextTargetId: ApiId) => {
    if (profileImageFile) {
      await targetApi.uploadTargetMedia(nextTargetId, 'image', profileImageFile)
    }

    await Promise.all(selectedPhotoFiles.map((file) => targetApi.uploadTargetMedia(nextTargetId, 'image', file)))

    if (selectedVoiceFile) {
      await targetApi.uploadTargetMedia(nextTargetId, 'voice', selectedVoiceFile)
    }
  }

  const refreshVerificationStatus = async (nextTargetId: ApiId | null = targetId) => {
    if (nextTargetId === null) {
      return null
    }

    setIsRefreshingVerification(true)

    try {
      const requests = await verificationApi.listTargetVerificationRequests(nextTargetId)
      const safeRequests = Array.isArray(requests) ? requests : []
      const latestRequest = getLatestVerificationRequest(safeRequests)
      setVerificationRequest(latestRequest)
      setStatusMessage(latestRequest ? '검증 상태를 새로 확인했어요.' : '아직 제출된 검증 요청이 없어요.')

      return latestRequest
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        clearStaleSetupStorage()
        setStatusMessage('이전 설정 정보를 초기화했어요. 다시 진행해주세요.')
      } else {
        setErrorMessage('검증 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.')
      }

      return null
    } finally {
      setIsRefreshingVerification(false)
    }
  }

  const handleSubmitVerification = async () => {
    if (isSubmitting) {
      return
    }

    if (!verificationFile) {
      setErrorMessage('검증 요청을 제출하려면 증빙 파일을 선택해주세요.')
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsSubmitting(true)

    try {
      const nextTargetId = await ensureTargetId()

      if (!hasSavedSetupData) {
        await saveConsents(nextTargetId)
        await uploadSelectedMedia(nextTargetId)
        setHasSavedSetupData(true)
      }

      const request = await verificationApi.createVerificationRequest(nextTargetId, {
        verification_type_param: verificationType,
        applicant_note: buildDescription(),
        file: verificationFile,
      })

      setVerificationRequest(request)
      setStatusMessage('검증 요청이 접수되었습니다. 승인 후 페르소나를 만들 수 있어요.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '검증 요청을 제출하지 못했습니다. 백엔드 서버 연결을 확인해주세요.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreatePersona = async () => {
    if (isSubmitting) {
      return
    }

    if (!canCreatePersona) {
      setErrorMessage('검증 승인 후 페르소나를 만들 수 있어요.')
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsSubmitting(true)

    try {
      const nextTargetId = await ensureTargetId()
      const persona = await targetApi.createPersona(nextTargetId)
      const personaDetail = await personaApi.getPersona(persona.id).catch(() => persona)

      setCompletedPersona(personaDetail)
      storeActivePersonaSession(String(personaDetail.id), nextTargetId)
      window.sessionStorage.setItem(SETUP_MEMORY_NOTES_KEY, JSON.stringify(memoryNotes))
      window.sessionStorage.setItem(SETUP_COMPLETED_KEY, 'true')
      setStep(5)
    } catch (error) {
      const message = getApiErrorMessage(error, '검증 승인 후 페르소나를 만들 수 있어요.')
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerificationAction = () => {
    if (canCreatePersona) {
      void handleCreatePersona()
      return
    }

    if (canSubmitVerification) {
      void handleSubmitVerification()
      return
    }

    void refreshVerificationStatus()
  }

  const verificationActionLabel = canCreatePersona
    ? isSubmitting
      ? '페르소나 생성 중...'
      : '페르소나 생성하기'
    : canSubmitVerification
      ? isSubmitting
        ? '검증 제출 중...'
        : '검증 요청 제출하기'
      : isRefreshingVerification
        ? '상태 확인 중...'
        : '검증 상태 새로고침'

  return (
    <main className="setup-page">
      <section className="setup-page__container" aria-label="리메모리 초기 설정">
        <StepProgress
          step={step}
          onBack={
            step === 3
              ? () => setStep(2)
              : step === 4
                ? () => setStep(3)
                : undefined
          }
        />

        {step === 1 && (
          <div className="setup-page__step setup-page__step--welcome">
            <div className="setup-page__intro">
              <h1 className="setup-page__title">
                반가워요, 리메모리
                <span className="setup-page__tiny-heart" aria-hidden="true">♥</span>
              </h1>
              <p className="setup-page__description">
                소중한 사람의 사진, 목소리, 이야기를 담아
                <br />
                AI 페르소나로 기억을 오래도록 간직할 수 있어요.
              </p>
            </div>

            <div className="setup-page__hero-card">
              <img
                className="setup-page__hero-image"
                src="/images/setup/setup-welcome-book.png"
                alt="사진과 목소리, 추억을 담은 스토리북"
              />
            </div>

            <div className="setup-page__feature-card" aria-label="리메모리 기능 안내">
              <div className="setup-page__feature-row">
                <span className="setup-page__feature-icon setup-page__feature-icon--image">
                  <SetupIcon name="image" />
                </span>
                <span className="setup-page__feature-text">
                  <strong>사진과 추억 보관</strong>
                  <small>사진 속 순간과 이야기를 안전하게 보관해요.</small>
                </span>
              </div>
              <div className="setup-page__feature-row">
                <span className="setup-page__feature-icon setup-page__feature-icon--mic">
                  <SetupIcon name="mic" />
                </span>
                <span className="setup-page__feature-text">
                  <strong>목소리와 말투 기록</strong>
                  <small>목소리와 말투까지 담아 더 생생하게 기억해요.</small>
                </span>
              </div>
              <div className="setup-page__feature-row">
                <span className="setup-page__feature-icon setup-page__feature-icon--chat">
                  <SetupIcon name="chat" />
                </span>
                <span className="setup-page__feature-text">
                  <strong>AI와 다시 대화</strong>
                  <small>AI 페르소나와 대화하며 추억을 다시 떠올려요.</small>
                </span>
              </div>
            </div>

            <div className="setup-page__actions">
              <button className="setup-page__primary-button" type="button" onClick={() => setStep(2)}>
                <SetupIcon name="sparkle" />
                시작하기
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="setup-page__step">
            <h1 className="setup-page__title setup-page__title--compact">기억을 안전하게 다루기 위해 동의가 필요해요</h1>
            <p className="setup-page__description setup-page__description--compact">
              사진, 음성, 대화 데이터는 AI 페르소나와 스토리북 생성을 위해 사용됩니다.
            </p>

            <div className="setup-page__consent-card">
              {consentItems.map((item) => (
                <div className="setup-page__checkbox-row" key={item.key}>
                  <input
                    id={`setup-consent-${item.key}`}
                    type="checkbox"
                    checked={consents[item.key]}
                    onChange={(event) => handleConsentChange(item.key, event.target.checked)}
                  />
                  <label htmlFor={`setup-consent-${item.key}`}>{item.label}</label>
                </div>
              ))}
            </div>

            <div className="setup-page__all-consent">
              <input
                id="setup-consent-all"
                type="checkbox"
                checked={allConsented}
                onChange={(event) => handleAllConsentChange(event.target.checked)}
              />
              <label htmlFor="setup-consent-all">
                <SetupIcon name="check" />
                전체 동의
              </label>
            </div>

            <div className="setup-page__actions">
              <button
                className="setup-page__primary-button"
                type="button"
                disabled={!allConsented}
                onClick={() => setStep(3)}
              >
                동의하고 계속하기
                <SetupIcon name="arrow" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form className="setup-page__step setup-page__step--persona" onSubmit={handlePersonaSubmit}>
            <div className="setup-page__persona-heading">
              <h1 className="setup-page__persona-title">
                첫 페르소나를 만들어볼까요?
                <span className="setup-page__tiny-heart" aria-hidden="true">♥</span>
              </h1>
              <p className="setup-page__persona-description">소중한 사람의 첫 AI 페르소나를 만들어보세요.</p>
            </div>

            <div className="setup-page__persona-card">
              <div className="setup-page__avatar-picker">
                <input
                  className="setup-page__file-input"
                  id="setup-profile-image"
                  type="file"
                  accept="image/*"
                  aria-label="프로필 사진 선택"
                  onChange={handleProfileImageChange}
                />
                <label className="setup-page__avatar-preview" htmlFor="setup-profile-image">
                  {profileImagePreviewUrl ? (
                    <img src={profileImagePreviewUrl} alt="선택한 프로필 미리보기" />
                  ) : (
                    <span className="setup-page__avatar-placeholder">
                      <SetupIcon name="user" />
                    </span>
                  )}
                </label>
                <label className="setup-page__avatar-button" htmlFor="setup-profile-image" aria-label="프로필 사진 추가">
                  <SetupIcon name="camera" />
                  <SetupIcon name="plus" />
                </label>
              </div>

              <section className="setup-page__form-section">
                <label className="setup-page__form-label" htmlFor="setup-persona-name">
                  <SetupIcon name="user" />
                  이름
                </label>
                <input
                  className="setup-page__form-input"
                  id="setup-persona-name"
                  type="text"
                  maxLength={20}
                  placeholder="이름을 입력해주세요"
                  value={personaName}
                  onChange={(event) => setPersonaName(event.target.value)}
                />
              </section>

              <section className="setup-page__form-section">
                <span className="setup-page__form-label" id="setup-relationship-label">
                  <SetupIcon name="heart" />
                  나와의 관계
                </span>
                <div className="setup-page__relationship-chips" aria-labelledby="setup-relationship-label">
                  {relationshipChoices.map((relationship) => (
                    <button
                      className={`setup-page__relationship-chip${selectedRelationship === relationship ? ' setup-page__relationship-chip--selected' : ''}${relationship === '직접 입력' ? ' setup-page__relationship-chip--custom' : ''}`}
                      type="button"
                      key={relationship}
                      aria-pressed={selectedRelationship === relationship}
                      onClick={() => handleRelationshipSelect(relationship)}
                    >
                      {relationship}
                      {relationship === '직접 입력' && <SetupIcon name="edit" />}
                    </button>
                  ))}
                </div>
                {selectedRelationship === '직접 입력' && (
                  <label className="setup-page__sr-only" htmlFor="setup-custom-relationship">직접 관계 입력</label>
                )}
                {selectedRelationship === '직접 입력' && (
                  <input
                    className="setup-page__form-input setup-page__custom-relationship"
                    id="setup-custom-relationship"
                    type="text"
                    maxLength={20}
                    placeholder="관계를 입력해주세요"
                    value={customRelationship}
                    onChange={(event) => setCustomRelationship(event.target.value)}
                  />
                )}
              </section>

              <section className="setup-page__form-section">
                <label className="setup-page__form-label" htmlFor="setup-persona-description">
                  <SetupIcon name="chat" />
                  한 줄 소개
                </label>
                <div className="setup-page__intro-textarea-wrap">
                  <textarea
                    className="setup-page__form-input setup-page__intro-textarea"
                    id="setup-persona-description"
                    maxLength={50}
                    placeholder="어떤 분인지 한 줄로 소개해주세요"
                    value={personaDescription}
                    onChange={(event) => setPersonaDescription(event.target.value)}
                  />
                  <span className="setup-page__character-count">{personaDescription.length}/50</span>
                </div>
              </section>

              <div className="setup-page__persona-tip">
                <SetupIcon name="flower" />
                <p>
                  실제 사진과 자연스러운 설명을 넣으면
                  <br />
                  더 닮은 페르소나가 만들어져요.
                </p>
                <span aria-hidden="true">♥</span>
              </div>
            </div>

            {errorMessage && (
              <p className="setup-page__error" role="alert">
                {errorMessage}
              </p>
            )}

            <div className="setup-page__actions">
              <button className="setup-page__primary-button" type="submit">
                <SetupIcon name="sparkle" />
                다음
              </button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="setup-page__step setup-page__step--memory">
            <div className="setup-page__memory-heading">
              <h1 className="setup-page__memory-title">
                기억을 채워주세요
                <span className="setup-page__tiny-heart" aria-hidden="true">♥</span>
              </h1>
              <p className="setup-page__memory-description">
                사진, 음성, 설명을 추가하면
                <br />
                AI 페르소나가 더 생생하게 기억할 수 있어요.
              </p>
            </div>

            <div className="setup-page__memory-stack">
              <div className="setup-page__memory-field">
                <input
                  className="setup-page__file-input"
                  id="setup-photo-file"
                  type="file"
                  accept="image/*"
                  multiple
                  aria-label="사진 파일 선택"
                  onChange={handlePhotoChange}
                />
                <label className="setup-page__memory-card" htmlFor="setup-photo-file" aria-label="사진 추가">
                  <span className="setup-page__memory-card-icon">
                    <SetupIcon name="image" />
                  </span>
                  <span className="setup-page__memory-card-content">
                    <strong>사진 추가</strong>
                    <small>
                      소중한 순간을 사진으로
                      <br />
                      남겨주세요.
                    </small>
                    <em className="setup-page__memory-count">{selectedPhotoFiles.length}장 추가됨</em>
                  </span>
                  <span className="setup-page__memory-card-preview">
                    <span className="setup-page__photo-preview-list" aria-hidden="true">
                      {photoPreviewUrls.length > 0
                        ? photoPreviewUrls.map((url, index) => (
                            <span className="setup-page__photo-preview" key={url}>
                              <img src={url} alt="" />
                              {selectedPhotoFiles.length > 3 && index === 2 && (
                                <span className="setup-page__photo-overflow">+{selectedPhotoFiles.length - 3}</span>
                              )}
                            </span>
                          ))
                        : defaultPhotoPreviewPaths.map((path, index) => (
                            <span className="setup-page__photo-preview setup-page__photo-preview--placeholder" key={path}>
                              {failedDefaultPhotoIndexes.has(index) ? (
                                <span />
                              ) : (
                                <img src={path} alt="" onError={() => handleDefaultPhotoError(index)} />
                              )}
                            </span>
                          ))}
                    </span>
                  </span>
                  <SetupIcon name="chevron" className="setup-page__memory-chevron" />
                </label>
              </div>

              <div className="setup-page__memory-field">
                <input
                  className="setup-page__file-input"
                  id="setup-voice-file"
                  type="file"
                  accept="audio/*"
                  aria-label="음성 파일 선택"
                  onChange={handleVoiceChange}
                />
                <label className="setup-page__memory-card" htmlFor="setup-voice-file" aria-label="음성 추가">
                  <span className="setup-page__memory-card-icon setup-page__memory-card-icon--lavender">
                    <SetupIcon name="mic" />
                  </span>
                  <span className="setup-page__memory-card-content">
                    <strong>음성 추가</strong>
                    <small>
                      목소리를 녹음하면 더
                      <br />
                      자연스럽게 대화할 수 있어요.
                    </small>
                    <em className="setup-page__memory-count">{selectedVoiceFile ? 1 : 0}개 추가됨</em>
                  </span>
                  <span className="setup-page__memory-card-preview">
                    <span className="setup-page__audio-preview" aria-hidden="true">
                      <span className="setup-page__play-button">
                        <SetupIcon name="play" />
                      </span>
                      <span className="setup-page__waveform">
                        {Array.from({ length: 9 }, (_, index) => (
                          <i key={`setup-wave-${index}`} />
                        ))}
                      </span>
                      <span className="setup-page__audio-duration">00:28</span>
                    </span>
                    {selectedVoiceFile && <span className="setup-page__audio-file-name">{selectedVoiceFile.name}</span>}
                  </span>
                  <SetupIcon name="chevron" className="setup-page__memory-chevron" />
                </label>
              </div>

              <div className="setup-page__memory-note-wrap">
                <button
                  className="setup-page__memory-card setup-page__memory-card--note"
                  type="button"
                  aria-expanded={isNoteEditorOpen}
                  aria-label="설명 추가"
                  onClick={() => setIsNoteEditorOpen((current) => !current)}
                >
                  <span className="setup-page__memory-card-icon">
                    <SetupIcon name="note" />
                  </span>
                  <span className="setup-page__memory-card-content">
                    <strong>설명 추가</strong>
                    <small>
                      기억하고 싶은 이야기를
                      <br />
                      적어주세요.
                    </small>
                    <em className="setup-page__memory-count">{memoryNoteCount}개 추가됨</em>
                  </span>
                  <span className="setup-page__memory-card-preview">
                    <span className="setup-page__note-preview">
                      {memoryNotes[0] ?? (
                        <>
                          제주도 여행을 정말 좋아해요.
                          <br />
                          바닷바람과 성산일출봉을
                          <br />
                          특히 기억해요.
                        </>
                      )}
                    </span>
                  </span>
                  <SetupIcon name="chevron" className="setup-page__memory-chevron" />
                </button>
                {isNoteEditorOpen && (
                  <div className="setup-page__note-editor">
                  <label className="setup-page__sr-only" htmlFor="setup-memory-note">기억 설명 입력</label>
                  <textarea
                    className="setup-page__note-textarea"
                    id="setup-memory-note"
                    value={memoryNoteInput}
                    rows={3}
                    placeholder="예: 매년 봄이면 꽃구경 가는 걸 좋아했어요."
                    onChange={(event) => setMemoryNoteInput(event.target.value)}
                  />
                  <button
                    className="setup-page__note-add-button"
                    type="button"
                    disabled={memoryNoteInput.trim().length === 0}
                    onClick={handleAddMemoryNote}
                  >
                    설명 추가
                  </button>
                  </div>
                )}
              </div>
            </div>

            <div className="setup-page__memory-tip">
              <span>
                <SetupIcon name="sparkle" />
              </span>
              <p>
                3가지 중 <strong>2가지</strong>를 추가하면 더 자연스러운 대화가 가능해요.
              </p>
            </div>

            <div className="setup-page__memory-summary">
              <span className="setup-page__memory-summary-heart">
                <SetupIcon name="heart" />
              </span>
              <div className="setup-page__memory-summary-copy">
                <h2>지금까지 추가된 기억</h2>
                <div>
                  <span>
                    <SetupIcon name="image" />
                    사진 {selectedPhotoFiles.length}장
                  </span>
                  <span>
                    <SetupIcon name="mic" />
                    음성 {selectedVoiceFile ? 1 : 0}개
                  </span>
                  <span>
                    <SetupIcon name="note" />
                    설명 {memoryNoteCount}개
                  </span>
                </div>
              </div>
            </div>

            <section className="setup-page__verification-card" aria-label="검증 요청 상태">
              <div className="setup-page__verification-heading">
                <span>
                  <SetupIcon name={canCreatePersona ? 'check' : 'upload'} />
                </span>
                <div>
                  <h2>{getVerificationStatusTitle(verificationStatus)}</h2>
                  <p>{getVerificationStatusDescription(verificationRequest)}</p>
                </div>
              </div>

              {canSubmitVerification && (
                <div className="setup-page__verification-form">
                  <label className="setup-page__verification-label" htmlFor="setup-verification-type">
                    검증 유형
                  </label>
                  <select
                    className="setup-page__verification-select"
                    id="setup-verification-type"
                    value={verificationType}
                    onChange={(event) => setVerificationType(event.target.value as VerificationType)}
                  >
                    <option value="SELF_DECLARATION">본인 확인 진술</option>
                    <option value="FAMILY_RELATION_CERTIFICATE">가족관계증명서</option>
                    <option value="ID_CARD">신분증</option>
                    <option value="OTHER">기타</option>
                  </select>

                  <input
                    className="setup-page__file-input"
                    id="setup-verification-file"
                    type="file"
                    aria-label="검증 증빙 파일 선택"
                    onChange={handleVerificationFileChange}
                  />
                  <label className="setup-page__verification-upload" htmlFor="setup-verification-file">
                    <SetupIcon name="note" />
                    <span>
                      <strong>검증 자료</strong>
                      <small>{verificationFile?.name ?? '파일을 선택해주세요'}</small>
                    </span>
                  </label>
                </div>
              )}

              {statusMessage && (
                <p className="setup-page__status-message" role="status">
                  {statusMessage}
                </p>
              )}
            </section>

            {errorMessage && (
              <p className="setup-page__error" role="alert">
                {errorMessage}
              </p>
            )}

            <div className="setup-page__memory-actions">
              <button
                className="setup-page__create-button"
                type="button"
                disabled={isSubmitting || isRefreshingVerification}
                onClick={handleVerificationAction}
              >
                <SetupIcon name="sparkle" />
                {verificationActionLabel}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="setup-page__step setup-page__step--complete" role="status">
            <div className="setup-page__complete-heading">
              {Array.from({ length: 8 }, (_, index) => (
                <span className={`setup-page__complete-decoration setup-page__complete-decoration--${index + 1}`} key={`complete-decoration-${index + 1}`} aria-hidden="true" />
              ))}

              <h1 className="setup-page__complete-title">
                페르소나가 완성되었어요!
                <span className="setup-page__tiny-heart" aria-hidden="true">♥</span>
              </h1>
              <p className="setup-page__complete-description">
                이제 ‘{completePersonaName}’와 대화를 시작해보세요.
                <br />
                소중한 추억이 다시 살아납니다.
              </p>
            </div>

            <div className="setup-page__complete-card">
              <div className="setup-page__complete-avatar-wrap">
                <span className="setup-page__complete-flower setup-page__complete-flower--left" aria-hidden="true">
                  <SetupIcon name="flower" />
                </span>
                <span className="setup-page__complete-flower setup-page__complete-flower--right" aria-hidden="true">
                  <SetupIcon name="flower" />
                </span>
                <span className="setup-page__complete-heart-badge" aria-hidden="true">
                  <SetupIcon name="heart" />
                </span>
                <span className="setup-page__complete-avatar-ring">
                  <img
                    className="setup-page__complete-avatar"
                    src={completeProfileImageSrc}
                    alt={`${completePersonaName} 페르소나 프로필`}
                  />
                </span>
              </div>

              <h2 className="setup-page__complete-name">{completePersonaName}</h2>
              <p className="setup-page__complete-summary">{completePersonaSummary}</p>

              <div className="setup-page__complete-stats" aria-label="추가된 데이터 요약">
                <span className="setup-page__complete-stat">
                  <SetupIcon name="image" />
                  사진 {completePhotoCount}장
                </span>
                <span className="setup-page__complete-stat">
                  <SetupIcon name="mic" />
                  음성 {completeVoiceCount}개
                </span>
                <span className="setup-page__complete-stat">
                  <SetupIcon name="heart" />
                  기억 {memoryNoteCount}개
                </span>
              </div>

              <div className="setup-page__complete-divider" />

              <section className="setup-page__complete-chat-preview" aria-label="대화 미리보기">
                <div className="setup-page__complete-chat-row">
                  <img
                    className="setup-page__complete-chat-avatar"
                    src={completeProfileImageSrc}
                    alt=""
                    aria-hidden="true"
                  />
                  <p className="setup-page__complete-bubble setup-page__complete-bubble--user">
                    {completePersonaName}, 우리 제주도 여행 기억나?
                  </p>
                </div>
                <div className="setup-page__complete-chat-row setup-page__complete-chat-row--persona">
                  <p className="setup-page__complete-bubble setup-page__complete-bubble--persona">
                    그럼, 바닷바람이 참 좋았지.
                  </p>
                  <span className="setup-page__complete-chat-flower" aria-hidden="true">
                    <SetupIcon name="flower" />
                  </span>
                </div>
                <p className="setup-page__complete-chat-helper">
                  이제 {completePersonaName}와 함께 소중한 이야기를 나눠보세요.
                </p>
              </section>

              <div className="setup-page__complete-actions">
                <button className="setup-page__complete-primary-button" type="button" onClick={() => { window.location.href = '/chat' }}>
                  <SetupIcon name="sparkle" />
                  대화 시작하기
                </button>
                <button className="setup-page__complete-secondary-button" type="button" onClick={() => { window.location.href = '/home' }}>
                  <SetupIcon name="home" />
                  홈으로 가기
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default SetupPage
