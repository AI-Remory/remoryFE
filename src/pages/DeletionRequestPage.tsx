import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react'
import { ApiError } from '../lib/apiClient'
import { authApi } from '../services/authApi'
import { deletionApi } from '../services/deletionApi'
import { storybookApi } from '../services/storybookApi'
import { targetApi } from '../services/targetApi'
import type { DeletionRequest, StoryBook, Target } from '../types/api'
import './OperationsPage.css'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

const deletionTargetOptions = [
  { value: 'TARGET', label: 'Target' },
  { value: 'TARGET_MEDIA', label: 'Target Media' },
  { value: 'PERSONA', label: 'Persona' },
  { value: 'PERSONA_CHAT', label: 'Persona Chat' },
  { value: 'PERSONA_MESSAGE', label: 'Persona Message' },
  { value: 'PHOTO_MEMORY', label: 'Photo Memory' },
  { value: 'STORYBOOK', label: 'StoryBook' },
  { value: 'SHARE_LINK', label: 'Share Link' },
  { value: 'MEMORY_GROUP', label: 'Memory Group' },
  { value: 'VERIFICATION_REQUEST', label: 'Verification Request' },
  { value: 'ACCOUNT', label: 'Account' },
] as const

type DeletionTargetType = (typeof deletionTargetOptions)[number]['value']

const targetIdRequiredTypes = new Set<DeletionTargetType>([
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
])

function usesTargetSelect(targetType: DeletionTargetType) {
  return targetType === 'TARGET' || targetType === 'STORYBOOK'
}

function usesTargetInput(targetType: DeletionTargetType) {
  return targetIdRequiredTypes.has(targetType) && !usesTargetSelect(targetType)
}

function isNumericId(value: string) {
  return value.trim() !== '' && Number.isFinite(Number(value))
}

function DeletionRequestPage() {
  const [requests, setRequests] = useState<DeletionRequest[]>([])
  const [targets, setTargets] = useState<Target[]>([])
  const [storybooks, setStorybooks] = useState<StoryBook[]>([])
  const [targetType, setTargetType] = useState<DeletionTargetType>('TARGET')
  const [targetId, setTargetId] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadRequests = async () => {
    setRequests(await deletionApi.listDeletionRequests())
  }

  useEffect(() => {
    let ignore = false

    async function loadInitialData() {
      try {
        const [nextRequests, targetResponse, nextStorybooks] = await Promise.all([
          deletionApi.listDeletionRequests(),
          targetApi.listTargets().catch(() => ({ items: [] })),
          storybookApi.listStorybooks().catch(() => []),
        ])

        if (!ignore) {
          setRequests(nextRequests)
          setTargets(targetResponse.items)
          setStorybooks(nextStorybooks)
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getErrorMessage(error, '삭제 요청 목록을 불러오지 못했습니다.'))
        }
      }
    }

    loadInitialData()

    return () => {
      ignore = true
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setErrorMessage('')
    setStatusMessage('')

    const trimmedTargetId = targetId.trim()

    if (targetIdRequiredTypes.has(targetType) && !trimmedTargetId) {
      setErrorMessage('삭제 대상 ID를 입력해주세요.')
      return
    }

    if (targetIdRequiredTypes.has(targetType) && !isNumericId(trimmedTargetId)) {
      setErrorMessage('삭제 대상 ID는 숫자로 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const requestTargetId = targetType === 'ACCOUNT'
        ? (await authApi.me()).id
        : trimmedTargetId

      await deletionApi.createDeletionRequest({
        target_type: targetType,
        target_id: requestTargetId,
        reason: reason.trim() || null,
      })

      setTargetId('')
      setReason('')
      await loadRequests()
      setStatusMessage('삭제 요청을 제출했어요.')
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '삭제 요청 제출에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async (requestId: DeletionRequest['id']) => {
    setErrorMessage('')
    setStatusMessage('')

    try {
      await deletionApi.cancelDeletionRequest(requestId)
      await loadRequests()
      setStatusMessage('삭제 요청을 취소했어요.')
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '삭제 요청 취소에 실패했습니다.'))
    }
  }

  return (
    <main className="ops-page">
      <section className="ops-page__container" aria-label="삭제 요청">
        <header className="ops-page__header">
          <button className="ops-page__back" type="button" onClick={() => window.location.assign('/my')}>
            <ArrowLeft size={17} /> 마이
          </button>
          <span className="ops-page__eyebrow">Deletion</span>
          <h1>삭제 요청</h1>
          <p>내 데이터 삭제 요청을 만들고 진행 상태를 확인합니다.</p>
          <p className="ops-page__warning">삭제 요청은 실제 소유 데이터에 반영될 수 있습니다. 테스트할 때는 삭제해도 되는 리소스 ID만 사용해주세요.</p>
        </header>

        {statusMessage && <p className="ops-page__status">{statusMessage}</p>}
        {errorMessage && <p className="ops-page__error">{errorMessage}</p>}

        <section className="ops-page__grid">
          <form className="ops-page__panel ops-page__form" onSubmit={handleSubmit}>
            <h2>요청 생성</h2>
            <label>
              대상 유형
              <select value={targetType} onChange={(event) => {
                setTargetType(event.currentTarget.value as DeletionTargetType)
                setTargetId('')
              }}>
                {deletionTargetOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            {usesTargetSelect(targetType) && (
              <label>
                대상 ID
                <select value={targetId} onChange={(event) => setTargetId(event.currentTarget.value)}>
                  <option value="">삭제할 대상을 선택해주세요</option>
                  {targetType === 'TARGET' && targets.map((target) => (
                    <option value={String(target.id)} key={String(target.id)}>{target.name ?? `Target #${target.id}`}</option>
                  ))}
                  {targetType === 'STORYBOOK' && storybooks.map((storybook) => (
                    <option value={String(storybook.id)} key={String(storybook.id)}>{storybook.title}</option>
                  ))}
                </select>
              </label>
            )}
            {usesTargetInput(targetType) && (
              <label>
                대상 ID
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="삭제할 리소스 ID를 입력해주세요"
                  value={targetId}
                  onChange={(event) => setTargetId(event.currentTarget.value)}
                />
              </label>
            )}
            <label>
              사유
              <textarea rows={4} value={reason} onChange={(event) => setReason(event.currentTarget.value)} />
            </label>
            <button className="ops-page__button" type="submit" disabled={isSubmitting}>
              <Trash2 size={17} /> 삭제 요청 제출
            </button>
          </form>

          <div className="ops-page__panel">
            <h2>요청 목록</h2>
            <div className="ops-page__list">
              {requests.length > 0 ? requests.map((request) => (
                <article className="ops-page__item" key={String(request.id)}>
                  <div className="ops-page__item-header">
                    <strong>{request.target_type} #{request.target_id ?? '-'}</strong>
                    <span className="ops-page__badge">{request.status ?? 'PENDING'}</span>
                  </div>
                  <p>{request.reason ?? '사유 없음'}</p>
                  {request.status === 'PENDING' && (
                    <button type="button" onClick={() => handleCancel(request.id)}>
                      <RotateCcw size={16} /> 요청 취소
                    </button>
                  )}
                </article>
              )) : <p className="ops-page__empty">아직 삭제 요청이 없습니다.</p>}
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default DeletionRequestPage
