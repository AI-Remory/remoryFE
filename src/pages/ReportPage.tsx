import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Flag } from 'lucide-react'
import { ApiError } from '../lib/apiClient'
import { reportApi } from '../services/reportApi'
import type { Report } from '../types/api'
import './OperationsPage.css'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError || error instanceof Error ? error.message : fallback
}

const reportTargetOptions = [
  { value: 'STORYBOOK', label: '스토리북' },
  { value: 'PERSONA', label: '페르소나' },
  { value: 'PERSONA_CHAT', label: '페르소나 채팅' },
  { value: 'PERSONA_MESSAGE', label: '페르소나 메시지' },
  { value: 'SHARE_LINK', label: '공유 링크' },
  { value: 'TARGET', label: '대상' },
  { value: 'USER', label: '사용자' },
] as const

const reportReasonOptions = [
  { value: 'HARMFUL_CONTENT', label: '부적절한 콘텐츠' },
  { value: 'PRIVACY_VIOLATION', label: '개인정보 침해' },
  { value: 'UNAUTHORIZED_VOICE_USE', label: '무단 음성 사용' },
  { value: 'IMPERSONATION', label: '사칭' },
  { value: 'COPYRIGHT_OR_RIGHTS', label: '저작권/권리 침해' },
  { value: 'SPAM', label: '스팸' },
  { value: 'OTHER', label: '기타' },
] as const

type ReportTargetType = (typeof reportTargetOptions)[number]['value']
type ReportReasonType = (typeof reportReasonOptions)[number]['value']

function ReportPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [targetType, setTargetType] = useState<ReportTargetType>('STORYBOOK')
  const [targetId, setTargetId] = useState('')
  const [reasonType, setReasonType] = useState<ReportReasonType>('HARMFUL_CONTENT')
  const [reasonDetail, setReasonDetail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadReports = async () => {
    setReports(await reportApi.listReports())
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadReports().catch((error) => {
        setErrorMessage(getErrorMessage(error, '신고 목록을 불러오지 못했습니다.'))
      })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!targetId.trim() || isSubmitting) {
      setErrorMessage('신고 대상 ID를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setStatusMessage('')

    try {
      await reportApi.createReport({
        target_type: targetType,
        target_id: targetId.trim(),
        reason_type: reasonType,
        reason_detail: reasonDetail.trim() || null,
      })

      setReasonDetail('')
      await loadReports()
      setStatusMessage('신고를 접수했어요.')
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '신고 접수에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="ops-page">
      <section className="ops-page__container" aria-label="신고">
        <header className="ops-page__header">
          <button className="ops-page__back" type="button" onClick={() => window.location.assign('/my')}>
            <ArrowLeft size={17} /> 마이
          </button>
          <span className="ops-page__eyebrow">Report</span>
          <h1>신고</h1>
          <p>스토리북, 페르소나, 그룹 등 문제 리소스를 신고합니다.</p>
        </header>

        {statusMessage && <p className="ops-page__status">{statusMessage}</p>}
        {errorMessage && <p className="ops-page__error">{errorMessage}</p>}

        <section className="ops-page__grid">
          <form className="ops-page__panel ops-page__form" onSubmit={handleSubmit}>
            <h2>신고 접수</h2>
            <label>
              대상 유형
              <select value={targetType} onChange={(event) => setTargetType(event.currentTarget.value as ReportTargetType)}>
                {reportTargetOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              대상 ID
              <input value={targetId} onChange={(event) => setTargetId(event.currentTarget.value)} />
            </label>
            <label>
              사유 유형
              <select value={reasonType} onChange={(event) => setReasonType(event.currentTarget.value as ReportReasonType)}>
                {reportReasonOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              상세 사유
              <textarea rows={4} value={reasonDetail} onChange={(event) => setReasonDetail(event.currentTarget.value)} />
            </label>
            <button className="ops-page__button" type="submit" disabled={isSubmitting}>
              <Flag size={17} /> 신고 접수
            </button>
          </form>

          <div className="ops-page__panel">
            <h2>내 신고 목록</h2>
            <div className="ops-page__list">
              {reports.length > 0 ? reports.map((report) => (
                <article className="ops-page__item" key={String(report.id)}>
                  <div className="ops-page__item-header">
                    <strong>{report.target_type} #{report.target_id}</strong>
                    <span className="ops-page__badge">{report.status ?? 'PENDING'}</span>
                  </div>
                  <small>{report.reason_type}</small>
                  <p>{report.reason_detail ?? '상세 사유 없음'}</p>
                </article>
              )) : <p className="ops-page__empty">아직 신고가 없습니다.</p>}
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default ReportPage
