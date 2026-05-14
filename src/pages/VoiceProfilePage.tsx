import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Mic, RefreshCw, Sparkles } from 'lucide-react'
import { ApiError } from '../lib/apiClient'
import { getPersonaIdFromTarget, REMORY_PERSONA_ID_KEY } from '../services/personaSession'
import { personaApi } from '../services/personaApi'
import { targetApi } from '../services/targetApi'
import type { ApiId, Persona, Target, VoiceProfile } from '../types/api'
import './OperationsPage.css'

type PersonaOption = {
  personaId: string
  name: string
  loadedDetail: boolean
}

type PersonaResolveResult = {
  option: PersonaOption | null
  forbidden: boolean
  unresolved: boolean
}

type PersonaOptionsResult = {
  options: PersonaOption[]
  hasForbiddenPersona: boolean
  hasUnresolvedPersona: boolean
}

const personaOwnerErrorMessage = '현재 계정이 이 페르소나의 소유자가 아닙니다. 페르소나를 만든 사용자 계정으로 로그인해주세요.'
const personaLoadErrorMessage = '페르소나 정보를 불러오지 못했습니다.'
const voiceProfileLoadErrorMessage = '음성 프로필 정보를 불러오지 못했습니다.'
const voiceProfileActionErrorMessage = '음성 프로필 요청을 완료하지 못했습니다.'
const noPersonaGuideMessage = '아직 생성된 페르소나가 없습니다. 먼저 페르소나 설정을 완료해주세요.'

function toStorageId(value: ApiId | null | undefined) {
  return value === null || value === undefined ? null : String(value)
}

function normalizeStatus(status: string | null | undefined) {
  return (status ?? '').toUpperCase()
}

function getPersonaId(target: Target) {
  return getPersonaIdFromTarget(target)
}

function targetMayHavePersona(target: Target) {
  return Boolean(getPersonaId(target) || target.persona || target.has_persona)
}

function getStoredPersonaId() {
  return window.localStorage.getItem(REMORY_PERSONA_ID_KEY)?.trim() || null
}

function getPersonaDisplayName(persona?: Persona | null, target?: Target) {
  return (
    persona?.persona_name ??
    persona?.name ??
    persona?.nickname ??
    target?.persona?.persona_name ??
    target?.persona?.name ??
    target?.persona?.nickname ??
    target?.name ??
    target?.nickname ??
    '페르소나'
  )
}

function getVoiceProfileStatusMessage(status: string) {
  switch (status) {
    case 'PENDING':
      return '먼저 평가를 진행해주세요.'
    case 'FAILED':
      return '음성 프로필 생성/평가에 실패했습니다. 음성 샘플을 추가한 뒤 다시 생성해주세요.'
    case 'NEEDS_MORE_SAMPLES':
      return '음성 샘플이 부족합니다. 더 긴 음성 파일을 추가해주세요.'
    default:
      return ''
  }
}

function createPersonaOption(personaId: string, target?: Target, persona?: Persona | null, loadedDetail = false): PersonaOption {
  return {
    personaId,
    name: getPersonaDisplayName(persona, target),
    loadedDetail,
  }
}

async function createPersonaOptionFromDetail(personaId: string, target?: Target) {
  const persona = await personaApi.getPersona(personaId)
  const resolvedPersonaId = toStorageId(persona.id) ?? personaId

  return createPersonaOption(resolvedPersonaId, target, persona, true)
}

async function resolveTargetWithPersonaId(target: Target) {
  const personaId = getPersonaId(target)

  if (personaId) {
    return { target, personaId }
  }

  if (!target.has_persona) {
    return null
  }

  try {
    const detailedTarget = await targetApi.getTarget(target.id)
    const detailedPersonaId = getPersonaId(detailedTarget)

    return detailedPersonaId ? { target: detailedTarget, personaId: detailedPersonaId } : null
  } catch {
    return null
  }
}

async function createPersonaOptionFromTarget(target: Target): Promise<PersonaResolveResult> {
  const resolved = await resolveTargetWithPersonaId(target)

  if (!resolved) {
    return { option: null, forbidden: false, unresolved: targetMayHavePersona(target) }
  }

  try {
    return {
      option: await createPersonaOptionFromDetail(resolved.personaId, resolved.target),
      forbidden: false,
      unresolved: false,
    }
  } catch (error) {
    const fallbackOption = resolved.target.persona
      ? createPersonaOption(resolved.personaId, resolved.target, resolved.target.persona, false)
      : null

    return {
      option: fallbackOption,
      forbidden: error instanceof ApiError && error.status === 403,
      unresolved: !fallbackOption,
    }
  }
}

async function createPersonaOptionsFromTargets(targets: Target[]): Promise<PersonaOptionsResult> {
  const options: PersonaOption[] = []
  const seenPersonaIds = new Set<string>()
  let hasForbiddenPersona = false
  let hasUnresolvedPersona = false

  for (const target of targets) {
    const result = await createPersonaOptionFromTarget(target)

    if (result.forbidden) {
      hasForbiddenPersona = true
    }

    if (result.unresolved) {
      hasUnresolvedPersona = true
    }

    if (!result.option || seenPersonaIds.has(result.option.personaId)) {
      continue
    }

    seenPersonaIds.add(result.option.personaId)
    options.push(result.option)
  }

  return { options, hasForbiddenPersona, hasUnresolvedPersona }
}

function mergePersonaOptions(options: PersonaOption[]) {
  const merged = new Map<string, PersonaOption>()

  options.forEach((option) => {
    const current = merged.get(option.personaId)

    if (!current || (!current.loadedDetail && option.loadedDetail)) {
      merged.set(option.personaId, option)
    }
  })

  return Array.from(merged.values())
}

function VoiceProfilePage() {
  const [personaOptions, setPersonaOptions] = useState<PersonaOption[]>([])
  const [selectedPersonaId, setSelectedPersonaId] = useState('')
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [personaLoadFailed, setPersonaLoadFailed] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const voiceProfileStatus = normalizeStatus(voiceProfile?.status)
  const voiceProfileStatusMessage = getVoiceProfileStatusMessage(voiceProfileStatus)
  const canConfirmVoiceProfile = Boolean(selectedPersonaId && voiceProfileStatus === 'READY' && !isSubmitting)
  const hasNoPersonas = !isLoading && !personaLoadFailed && personaOptions.length === 0

  useEffect(() => {
    let ignore = false

    async function loadPersonas() {
      setErrorMessage('')
      setPersonaLoadFailed(false)

      const storedPersonaId = getStoredPersonaId()
      let storedPersonaOption: PersonaOption | null = null
      let hasForbiddenPersona = false

      if (storedPersonaId) {
        try {
          storedPersonaOption = await createPersonaOptionFromDetail(storedPersonaId)
        } catch (error) {
          hasForbiddenPersona = error instanceof ApiError && error.status === 403
          window.localStorage.removeItem(REMORY_PERSONA_ID_KEY)
        }
      }

      let targetPersonaResult: PersonaOptionsResult = {
        options: [],
        hasForbiddenPersona: false,
        hasUnresolvedPersona: false,
      }
      let targetLoadFailed = false

      try {
        const response = await targetApi.listTargets()
        targetPersonaResult = await createPersonaOptionsFromTargets(response.items)
      } catch {
        targetLoadFailed = true
      }

      const nextOptions = mergePersonaOptions(
        storedPersonaOption ? [storedPersonaOption, ...targetPersonaResult.options] : targetPersonaResult.options,
      )
      const selectedOption = storedPersonaOption ?? nextOptions[0] ?? null
      const nextPersonaLoadFailed = (targetLoadFailed || targetPersonaResult.hasUnresolvedPersona) && nextOptions.length === 0
      const nextHasForbiddenPersona = hasForbiddenPersona || targetPersonaResult.hasForbiddenPersona

      if (!ignore) {
        setPersonaOptions(nextOptions)
        setSelectedPersonaId(selectedOption?.personaId ?? '')
        setPersonaLoadFailed(nextPersonaLoadFailed)

        if (selectedOption) {
          window.localStorage.setItem(REMORY_PERSONA_ID_KEY, selectedOption.personaId)
        }

        if (nextHasForbiddenPersona) {
          setErrorMessage(personaOwnerErrorMessage)
        } else if (nextPersonaLoadFailed) {
          setErrorMessage(personaLoadErrorMessage)
        }

        setIsLoading(false)
      }
    }

    loadPersonas()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const timeoutId = window.setTimeout(() => {
      if (!selectedPersonaId) {
        setVoiceProfile(null)
        return
      }

      personaApi.getVoiceProfile(selectedPersonaId)
        .then((profile) => {
          if (!ignore) {
            setVoiceProfile(profile)
            setErrorMessage('')
          }
        })
        .catch((error) => {
          if (!ignore) {
            setVoiceProfile(null)

            if (error instanceof ApiError && error.status === 403) {
              setErrorMessage(personaOwnerErrorMessage)
              return
            }

            if (!(error instanceof ApiError && error.status === 404)) {
              setErrorMessage(voiceProfileLoadErrorMessage)
            }
          }
        })
    }, 0)

    return () => {
      ignore = true
      window.clearTimeout(timeoutId)
    }
  }, [selectedPersonaId])

  const handlePersonaChange = (personaId: string) => {
    setSelectedPersonaId(personaId)

    if (personaId) {
      window.localStorage.setItem(REMORY_PERSONA_ID_KEY, personaId)
    }
  }

  const runVoiceAction = async (action: 'create' | 'evaluate' | 'confirm') => {
    if (!selectedPersonaId || isSubmitting) {
      return
    }

    if (action === 'confirm' && !canConfirmVoiceProfile) {
      return
    }

    setIsSubmitting(true)
    setStatusMessage('')
    setErrorMessage('')

    try {
      const nextProfile = action === 'create'
        ? await personaApi.createVoiceProfile(selectedPersonaId)
        : action === 'evaluate'
          ? await personaApi.evaluateVoiceProfile(selectedPersonaId)
          : await personaApi.confirmVoiceProfile(selectedPersonaId, reviewNote)

      setVoiceProfile(nextProfile)
      setStatusMessage(
        action === 'create'
          ? '음성 프로필 생성이 요청됐어요.'
          : action === 'evaluate'
            ? '음성 프로필 평가를 요청했어요.'
            : '사용자 확인을 저장했어요.',
      )
    } catch (error) {
      if (action === 'evaluate' && error instanceof ApiError) {
        setErrorMessage(error.message || voiceProfileActionErrorMessage)
        return
      }

      setErrorMessage(voiceProfileActionErrorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="ops-page">
      <section className="ops-page__container" aria-label="음성 프로필 관리">
        <header className="ops-page__header">
          <button className="ops-page__back" type="button" onClick={() => window.location.assign('/my')}>
            <ArrowLeft size={17} /> 마이
          </button>
          <span className="ops-page__eyebrow">Voice Profile</span>
          <h1>음성 프로필</h1>
          <p>페르소나의 음성 프로필 생성, 평가, 사용자 확인을 관리합니다.</p>
        </header>

        {statusMessage && <p className="ops-page__status">{statusMessage}</p>}
        {errorMessage && <p className="ops-page__error">{errorMessage}</p>}

        <section className="ops-page__grid">
          <div className="ops-page__panel">
            <h2>페르소나 선택</h2>
            <div className="ops-page__form">
              <label>
                페르소나
                <select
                  value={selectedPersonaId}
                  onChange={(event) => handlePersonaChange(event.currentTarget.value)}
                  disabled={isLoading || personaOptions.length === 0}
                >
                  {isLoading && <option value="">페르소나를 불러오는 중입니다</option>}
                  {hasNoPersonas && <option value="">페르소나 없음</option>}
                  {personaLoadFailed && <option value="">페르소나 정보를 불러오지 못했습니다</option>}
                  {personaOptions.map((persona) => (
                    <option value={persona.personaId} key={persona.personaId}>
                      {persona.name}
                    </option>
                  ))}
                </select>
              </label>
              {hasNoPersonas && (
                <div className="ops-page__state-note" role="status">
                  <p>{noPersonaGuideMessage}</p>
                  <button className="ops-page__button-secondary" type="button" onClick={() => window.location.assign('/setup')}>
                    페르소나 설정하기
                  </button>
                </div>
              )}
              <label>
                확인 메모
                <textarea rows={3} value={reviewNote} onChange={(event) => setReviewNote(event.currentTarget.value)} />
              </label>
              <div className="ops-page__button-row">
                <button className="ops-page__button" type="button" onClick={() => runVoiceAction('create')} disabled={!selectedPersonaId || isSubmitting}>
                  <Mic size={17} /> 생성
                </button>
                <button className="ops-page__button-secondary" type="button" onClick={() => runVoiceAction('evaluate')} disabled={!selectedPersonaId || isSubmitting}>
                  <RefreshCw size={17} /> 평가
                </button>
                <button className="ops-page__button-secondary" type="button" onClick={() => runVoiceAction('confirm')} disabled={!canConfirmVoiceProfile}>
                  <CheckCircle2 size={17} /> 확인
                </button>
              </div>
            </div>
          </div>

          <div className="ops-page__panel">
            <h2>상태</h2>
            {voiceProfile ? (
              <article className="ops-page__item">
                <div className="ops-page__item-header">
                  <strong>Voice Profile #{voiceProfile.id ?? '-'}</strong>
                  <span className="ops-page__badge">{voiceProfile.status ?? 'UNKNOWN'}</span>
                </div>
                <p>검수 상태: {voiceProfile.review_status ?? '없음'}</p>
                <p>{voiceProfile.review_note ?? '표시할 메모가 없습니다.'}</p>
                {voiceProfileStatusMessage && <p className="ops-page__state-note">{voiceProfileStatusMessage}</p>}
              </article>
            ) : (
              <p className="ops-page__empty">
                <Sparkles size={17} /> 아직 음성 프로필이 없습니다.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default VoiceProfilePage
