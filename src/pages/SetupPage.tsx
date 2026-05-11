import { useState, type ChangeEvent, type FormEvent } from 'react'
import { REMORY_PERSONA_ID_KEY, REMORY_TARGET_ID_KEY } from '../services/personaSession'
import { targetApi } from '../services/targetApi'
import './SetupPage.css'

type SetupStep = 1 | 2 | 3 | 4 | 5
type ConsentKey = 'privacy' | 'photo' | 'voice' | 'persona'
type SetupIconName = 'image' | 'mic' | 'chat' | 'check' | 'sparkle' | 'upload' | 'arrow'

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
const SETUP_SKIPPED_KEY = 'remory_setup_skipped'

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
    case 'arrow':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
  }
}

function StepProgress({ step }: { step: SetupStep }) {
  return (
    <div className="setup-page__progress" aria-label={`초기 설정 ${step}단계, 총 ${TOTAL_STEPS}단계`}>
      <p className="setup-page__step-count">
        <span>{step}</span>
        <em> / {TOTAL_STEPS}</em>
      </p>
      <div className="setup-page__dots" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <span
            className={`setup-page__dot${index + 1 === step ? ' setup-page__dot--active' : ''}`}
            key={`setup-step-dot-${index + 1}`}
          />
        ))}
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
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const allConsented = consentItems.every((item) => consents[item.key])
  const personaName = personaDraft.name.trim() || '엄마'
  const personaRelationship = personaDraft.relationship.trim() || 'parent'
  const personaDescription = personaDraft.description.trim() || '따뜻한 조언을 해주는 분'

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
    setPhotoFile(event.target.files?.[0] ?? null)
  }

  const handleVoiceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVoiceFile(event.target.files?.[0] ?? null)
  }

  const handlePersonaSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStep(4)
  }

  const handleCreatePersona = async () => {
    if (isSubmitting) {
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const target = await targetApi.createTarget({
        name: personaName,
        description: personaDescription,
        target_type: personaRelationship,
      })

      window.localStorage.setItem(REMORY_TARGET_ID_KEY, String(target.id))

      if (photoFile) {
        await targetApi.uploadTargetMedia(target.id, 'image', photoFile)
      }

      if (voiceFile) {
        await targetApi.uploadTargetMedia(target.id, 'voice', voiceFile)
      }

      const persona = await targetApi.createPersona(target.id)

      window.localStorage.setItem(REMORY_PERSONA_ID_KEY, String(persona.id))
      window.localStorage.setItem(SETUP_COMPLETED_KEY, 'true')
      setIsComplete(true)
    } catch {
      setErrorMessage('초기 설정 저장에 실패했습니다. 백엔드 서버 연결을 확인해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="setup-page">
      <section className="setup-page__container" aria-label="리메모리 초기 설정">
        <StepProgress step={step} />

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
          <div className="setup-page__step">
            <h1 className="setup-page__title setup-page__title--compact">사진이나 음성을 추가해보세요</h1>
            <p className="setup-page__description setup-page__description--compact">
              사진과 음성을 추가하면 AI가 말투와 기억의 맥락을 더 잘 이해할 수 있어요.
            </p>

            <div className="setup-page__upload-grid">
              <div className="setup-page__upload-field">
                <input
                  className="setup-page__file-input"
                  id="setup-photo-file"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                <label className="setup-page__upload-card" htmlFor="setup-photo-file">
                  <span className="setup-page__upload-icon setup-page__upload-icon--image">
                    <SetupIcon name="image" />
                  </span>
                  <span className="setup-page__upload-copy">
                    <strong>사진 업로드</strong>
                    <small>{photoFile ? photoFile.name : '사진 파일을 선택해주세요.'}</small>
                  </span>
                  <SetupIcon name="upload" />
                </label>
              </div>

              <div className="setup-page__upload-field">
                <input
                  className="setup-page__file-input"
                  id="setup-voice-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleVoiceChange}
                />
                <label className="setup-page__upload-card" htmlFor="setup-voice-file">
                  <span className="setup-page__upload-icon setup-page__upload-icon--voice">
                    <SetupIcon name="mic" />
                  </span>
                  <span className="setup-page__upload-copy">
                    <strong>음성 업로드</strong>
                    <small>{voiceFile ? voiceFile.name : '음성 파일을 선택해주세요.'}</small>
                  </span>
                  <SetupIcon name="upload" />
                </label>
              </div>
            </div>

            <div className="setup-page__split-actions">
              <button
                className="setup-page__secondary-action-button"
                type="button"
                onClick={() => {
                  setPhotoFile(null)
                  setVoiceFile(null)
                  setStep(5)
                }}
              >
                건너뛰기
              </button>
              <button className="setup-page__primary-button" type="button" onClick={() => setStep(5)}>
                다음
                <SetupIcon name="arrow" />
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
                      <dd>{photoFile ? '추가됨' : '없음'}</dd>
                    </div>
                    <div>
                      <dt>음성 추가 여부</dt>
                      <dd>{voiceFile ? '추가됨' : '없음'}</dd>
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
                    onClick={handleCreatePersona}
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
