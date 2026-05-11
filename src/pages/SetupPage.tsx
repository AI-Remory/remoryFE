import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { REMORY_PERSONA_ID_KEY, REMORY_TARGET_ID_KEY } from '../services/personaSession'
import { targetApi } from '../services/targetApi'
import type { ApiId } from '../types/api'
import './SetupPage.css'

type SetupStep = 1 | 2 | 3 | 4 | 5
type ConsentKey = 'privacy' | 'photo' | 'voice' | 'persona'
type SetupIconName =
  | 'arrow'
  | 'back'
  | 'chat'
  | 'check'
  | 'chevron'
  | 'heart'
  | 'image'
  | 'mic'
  | 'note'
  | 'play'
  | 'sparkle'
  | 'upload'

type PersonaDraft = {
  name: string
  relationship: string
  description: string
}

type QuickChoice = PersonaDraft & {
  label: string
}

const TOTAL_STEPS = 5
const SETUP_COMPLETED_KEY = 'remory_setup_completed'
const SETUP_MEMORY_NOTES_KEY = 'remory_setup_memory_notes'
const SETUP_SKIPPED_KEY = 'remory_setup_skipped'
const defaultPhotoPreviewPaths = [
  '/images/setup/setup-photo-1.png',
  '/images/setup/setup-photo-2.png',
  '/images/setup/setup-photo-3.png',
]

const quickChoices: QuickChoice[] = [
  {
    label: '엄마',
    name: '엄마',
    relationship: 'parent',
    description: '따뜻한 조언을 해주는 분',
  },
  {
    label: '아빠',
    name: '아빠',
    relationship: 'parent',
    description: '든든하게 곁을 지켜주는 분',
  },
  {
    label: '할머니',
    name: '할머니',
    relationship: 'grandparent',
    description: '다정한 이야기를 들려주는 분',
  },
  {
    label: '할아버지',
    name: '할아버지',
    relationship: 'grandparent',
    description: '삶의 지혜를 나눠주는 분',
  },
  {
    label: '친구',
    name: '친구',
    relationship: 'friend',
    description: '편하게 추억을 나누는 사람',
  },
  {
    label: '나 자신',
    name: '나 자신',
    relationship: 'self',
    description: '나의 기억과 이야기를 남기고 싶은 사람',
  },
]

const consentItems: Array<{ key: ConsentKey; label: string }> = [
  { key: 'privacy', label: '개인정보 수집 및 이용' },
  { key: 'photo', label: '사진 데이터 사용' },
  { key: 'voice', label: '음성 데이터 사용' },
  { key: 'persona', label: 'AI 페르소나 생성을 위한 데이터 활용' },
]

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
      aria-label={step === 4 ? '초기 설정 4단계 중 4단계' : `초기 설정 ${TOTAL_STEPS}단계 중 ${step}단계`}
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

function SetupPage() {
  const [step, setStep] = useState<SetupStep>(1)
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({
    privacy: false,
    photo: false,
    voice: false,
    persona: false,
  })
  const [selectedChoice, setSelectedChoice] = useState('엄마')
  const [personaDraft, setPersonaDraft] = useState<PersonaDraft>({
    name: '엄마',
    relationship: 'parent',
    description: '따뜻한 조언을 해주는 분',
  })
  const [targetId, setTargetId] = useState<ApiId | null>(() => window.localStorage.getItem(REMORY_TARGET_ID_KEY))
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([])
  const [selectedVoiceFile, setSelectedVoiceFile] = useState<File | null>(null)
  const [memoryNotes, setMemoryNotes] = useState<string[]>([])
  const [memoryNoteInput, setMemoryNoteInput] = useState('')
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [failedDefaultPhotoIndexes, setFailedDefaultPhotoIndexes] = useState<Set<number>>(() => new Set())
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const allConsented = consentItems.every((item) => consents[item.key])
  const personaName = personaDraft.name.trim() || '엄마'
  const personaRelationship = personaDraft.relationship.trim() || 'parent'
  const personaDescription = personaDraft.description.trim() || '따뜻한 조언을 해주는 분'
  const memoryNoteCount = memoryNotes.length
  const memoryTypesAdded = [
    selectedPhotoFiles.length > 0,
    selectedVoiceFile !== null,
    memoryNoteCount > 0,
  ].filter(Boolean).length

  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photoPreviewUrls])

  const handleSkipSetup = () => {
    window.localStorage.setItem(SETUP_SKIPPED_KEY, 'true')
    window.location.href = '/home'
  }

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
      persona: checked,
    })
  }

  const handleQuickChoice = (choice: QuickChoice) => {
    setSelectedChoice(choice.label)
    setPersonaDraft({
      name: choice.name,
      relationship: choice.relationship,
      description: choice.description,
    })
  }

  const updatePersonaDraft = (field: keyof PersonaDraft, value: string) => {
    setSelectedChoice('')
    setPersonaDraft((current) => ({
      ...current,
      [field]: value,
    }))
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
  }

  const handlePersonaSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStep(4)
  }

  const ensureTargetId = async () => {
    if (targetId !== null) {
      return targetId
    }

    const target = await targetApi.createTarget({
      name: personaName,
      description: personaDescription,
      target_type: personaRelationship,
    })

    setTargetId(target.id)
    window.localStorage.setItem(REMORY_TARGET_ID_KEY, String(target.id))

    return target.id
  }

  const handleCreatePersona = async (skipMediaUpload = false) => {
    if (isSubmitting) {
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const nextTargetId = await ensureTargetId()

      if (memoryNotes.length > 0) {
        window.localStorage.setItem(SETUP_MEMORY_NOTES_KEY, JSON.stringify(memoryNotes))
      }

      if (!skipMediaUpload) {
        await Promise.all(selectedPhotoFiles.map((file) => targetApi.uploadTargetMedia(nextTargetId, 'image', file)))

        if (selectedVoiceFile) {
          await targetApi.uploadTargetMedia(nextTargetId, 'voice', selectedVoiceFile)
        }
      }

      const persona = await targetApi.createPersona(nextTargetId)

      window.localStorage.setItem(REMORY_PERSONA_ID_KEY, String(persona.id))
      window.localStorage.setItem(SETUP_COMPLETED_KEY, 'true')
      setIsComplete(true)
      setStep(5)
    } catch {
      setErrorMessage('기억 데이터를 저장하지 못했습니다. 백엔드 서버 연결을 확인해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="setup-page">
      <section className="setup-page__container" aria-label="리메모리 초기 설정">
        <StepProgress step={step} onBack={step === 4 ? () => setStep(3) : undefined} />

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
              <button className="setup-page__secondary-button" type="button" onClick={handleSkipSetup}>
                나중에 할게요
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
          <form className="setup-page__step" onSubmit={handlePersonaSubmit}>
            <h1 className="setup-page__title setup-page__title--compact">누구의 기억을 남기고 싶나요?</h1>

            <div className="setup-page__choice-grid" aria-label="빠른 관계 선택">
              {quickChoices.map((choice) => (
                <button
                  className={`setup-page__choice-card${selectedChoice === choice.label ? ' setup-page__choice-card--selected' : ''}`}
                  type="button"
                  key={choice.label}
                  aria-pressed={selectedChoice === choice.label}
                  onClick={() => handleQuickChoice(choice)}
                >
                  <span>{choice.label}</span>
                  {selectedChoice === choice.label && <SetupIcon name="check" />}
                </button>
              ))}
            </div>

            <div className="setup-page__field-group">
              <label className="setup-page__label" htmlFor="setup-persona-name">이름</label>
              <input
                className="setup-page__input"
                id="setup-persona-name"
                type="text"
                value={personaDraft.name}
                required
                onChange={(event) => updatePersonaDraft('name', event.target.value)}
              />
            </div>

            <div className="setup-page__field-group">
              <label className="setup-page__label" htmlFor="setup-persona-relationship">관계</label>
              <input
                className="setup-page__input"
                id="setup-persona-relationship"
                type="text"
                value={personaDraft.relationship}
                required
                onChange={(event) => updatePersonaDraft('relationship', event.target.value)}
              />
            </div>

            <div className="setup-page__field-group">
              <label className="setup-page__label" htmlFor="setup-persona-description">어떤 사람인지 설명</label>
              <textarea
                className="setup-page__input setup-page__textarea"
                id="setup-persona-description"
                value={personaDraft.description}
                required
                rows={4}
                onChange={(event) => updatePersonaDraft('description', event.target.value)}
              />
            </div>

            <div className="setup-page__actions">
              <button className="setup-page__primary-button" type="submit">
                다음
                <SetupIcon name="arrow" />
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
                <label className="setup-page__memory-card" htmlFor="setup-photo-file">
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
                <label className="setup-page__memory-card" htmlFor="setup-voice-file">
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
                      <span>00:28</span>
                    </span>
                    {selectedVoiceFile && <span className="setup-page__audio-file-name">{selectedVoiceFile.name}</span>}
                  </span>
                  <SetupIcon name="chevron" className="setup-page__memory-chevron" />
                </label>
              </div>

              <article className="setup-page__memory-card setup-page__memory-card--note">
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
                <div className="setup-page__note-editor">
                  <label className="setup-page__sr-only" htmlFor="setup-memory-note">기억 설명 입력</label>
                  <textarea
                    className="setup-page__note-input"
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
              </article>
            </div>

            <div className="setup-page__memory-tip">
              <span>
                <SetupIcon name="sparkle" />
              </span>
              <p>
                3가지 중 <strong>2가지</strong>를 추가하면 더 자연스러운 대화가 가능해요.
                <small>현재 {memoryTypesAdded}가지가 추가됐어요.</small>
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

            {errorMessage && (
              <p className="setup-page__error" role="alert">
                {errorMessage}
              </p>
            )}

            <div className="setup-page__memory-actions">
              <button
                className="setup-page__create-button"
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleCreatePersona(false)}
              >
                <SetupIcon name="sparkle" />
                {isSubmitting ? '페르소나 생성 중...' : '페르소나 생성하기'}
              </button>
              <button
                className="setup-page__skip-button"
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleCreatePersona(true)}
              >
                나중에 추가할게요
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="setup-page__step">
            {isComplete ? (
              <div className="setup-page__complete-card" role="status">
                <span className="setup-page__complete-icon">
                  <SetupIcon name="sparkle" />
                </span>
                <h1 className="setup-page__title setup-page__title--compact">{personaName} 페르소나가 준비됐어요</h1>
                <p className="setup-page__description setup-page__description--compact">
                  이제 대화를 시작하거나 홈에서 페르소나를 확인할 수 있어요.
                </p>
                <div className="setup-page__split-actions">
                  <button className="setup-page__primary-button" type="button" onClick={() => { window.location.href = '/chat' }}>
                    {personaName}와 대화하기
                  </button>
                  <button className="setup-page__secondary-action-button" type="button" onClick={() => { window.location.href = '/home' }}>
                    홈으로 가기
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="setup-page__title setup-page__title--compact">{personaName} 페르소나를 준비할게요</h1>
                <p className="setup-page__description setup-page__description--compact">
                  입력한 정보를 바탕으로 AI 페르소나를 만들고 대화를 시작할 수 있어요.
                </p>

                <div className="setup-page__summary-card">
                  <dl>
                    <div>
                      <dt>이름</dt>
                      <dd>{personaName}</dd>
                    </div>
                    <div>
                      <dt>관계</dt>
                      <dd>{personaRelationship}</dd>
                    </div>
                    <div>
                      <dt>설명</dt>
                      <dd>{personaDescription}</dd>
                    </div>
                    <div>
                      <dt>사진 추가 여부</dt>
                      <dd>{selectedPhotoFiles.length > 0 ? `${selectedPhotoFiles.length}장 추가됨` : '없음'}</dd>
                    </div>
                    <div>
                      <dt>음성 추가 여부</dt>
                      <dd>{selectedVoiceFile ? '1개 추가됨' : '없음'}</dd>
                    </div>
                    <div>
                      <dt>설명 추가 여부</dt>
                      <dd>{memoryNoteCount > 0 ? `${memoryNoteCount}개 추가됨` : '없음'}</dd>
                    </div>
                  </dl>
                </div>

                {errorMessage && (
                  <p className="setup-page__error" role="alert">
                    {errorMessage}
                  </p>
                )}

                <div className="setup-page__actions">
                  <button
                    className="setup-page__primary-button"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleCreatePersona(false)}
                  >
                    <SetupIcon name="sparkle" />
                    {isSubmitting ? '저장 중...' : '페르소나 만들기'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default SetupPage
