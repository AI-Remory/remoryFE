import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Mic, RefreshCw, Sparkles } from 'lucide-react'
import { ApiError } from '../lib/apiClient'
import { personaApi } from '../services/personaApi'
import { targetApi } from '../services/targetApi'
import type { Target, VoiceProfile } from '../types/api'
import './OperationsPage.css'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

function getPersonaId(target: Target) {
  return target.persona_id ?? target.persona?.id ?? null
}

function VoiceProfilePage() {
  const [targets, setTargets] = useState<Target[]>([])
  const [selectedPersonaId, setSelectedPersonaId] = useState('')
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const personaTargets = useMemo(() => targets.filter((target) => getPersonaId(target)), [targets])

  useEffect(() => {
    let ignore = false

    async function loadTargets() {
      try {
        const response = await targetApi.listTargets()
        const nextTargets = response.items
        const firstPersonaId = nextTargets.map(getPersonaId).find(Boolean)

        if (!ignore) {
          setTargets(nextTargets)
          setSelectedPersonaId(firstPersonaId ? String(firstPersonaId) : '')
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getErrorMessage(error, '페르소나 목록을 불러오지 못했습니다.'))
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadTargets()

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

            if (!(error instanceof ApiError && error.status === 404)) {
              setErrorMessage(getErrorMessage(error, '음성 프로필을 불러오지 못했습니다.'))
            }
          }
        })
    }, 0)

    return () => {
      ignore = true
      window.clearTimeout(timeoutId)
    }
  }, [selectedPersonaId])

  const runVoiceAction = async (action: 'create' | 'evaluate' | 'confirm') => {
    if (!selectedPersonaId || isSubmitting) {
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
          ? '음성 프로필 생성을 요청했어요.'
          : action === 'evaluate'
            ? '음성 프로필 평가를 요청했어요.'
            : '사용자 확인을 저장했어요.',
      )
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '음성 프로필 요청에 실패했습니다.'))
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
                <select value={selectedPersonaId} onChange={(event) => setSelectedPersonaId(event.currentTarget.value)} disabled={isLoading}>
                  <option value="">페르소나 없음</option>
                  {personaTargets.map((target) => {
                    const personaId = getPersonaId(target)

                    return (
                      <option value={String(personaId)} key={String(target.id)}>
                        {target.nickname ?? target.name ?? `Target ${target.id}`}
                      </option>
                    )
                  })}
                </select>
              </label>
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
                <button className="ops-page__button-secondary" type="button" onClick={() => runVoiceAction('confirm')} disabled={!selectedPersonaId || isSubmitting}>
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
