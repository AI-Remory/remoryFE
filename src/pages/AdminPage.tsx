import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Flag, RefreshCw, Trash2, XCircle } from 'lucide-react'
import { ApiError } from '../lib/apiClient'
import { adminApi } from '../services/adminApi'
import type { DeletionRequest, Report, VerificationRequest } from '../types/api'
import './OperationsPage.css'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

function isForbiddenError(error: unknown) {
  return error instanceof ApiError && error.status === 403
}

function AdminPage() {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([])
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [reviewNote, setReviewNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadDashboard = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [nextVerificationRequests, nextDeletionRequests, nextReports] = await Promise.all([
        adminApi.listVerificationRequests({ status: 'PENDING' }),
        adminApi.listDeletionRequests(),
        adminApi.listReports({ status: 'PENDING' }),
      ])

      setVerificationRequests(nextVerificationRequests)
      setDeletionRequests(nextDeletionRequests)
      setReports(nextReports)
    } catch (error) {
      setVerificationRequests([])
      setDeletionRequests([])
      setReports([])
      setErrorMessage(isForbiddenError(error) ? '관리자 권한이 필요합니다.' : getErrorMessage(error, '관리자 데이터를 불러오지 못했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const runAdminAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setErrorMessage('')
    setStatusMessage('')

    try {
      await action()
      await loadDashboard()
      setStatusMessage(successMessage)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '관리자 작업에 실패했습니다.'))
    }
  }

  return (
    <main className="ops-page">
      <section className="ops-page__container" aria-label="관리자 대시보드">
        <header className="ops-page__header">
          <button className="ops-page__back" type="button" onClick={() => window.location.assign('/my')}>
            <ArrowLeft size={17} /> 마이
          </button>
          <span className="ops-page__eyebrow">Admin</span>
          <h1>관리자 대시보드</h1>
          <p>검증 요청, 삭제 요청, 신고를 빠르게 검수합니다.</p>
          <button className="ops-page__button-secondary" type="button" onClick={loadDashboard} disabled={isLoading}>
            <RefreshCw size={17} /> 새로고침
          </button>
        </header>

        {statusMessage && <p className="ops-page__status">{statusMessage}</p>}
        {errorMessage && <p className="ops-page__error">{errorMessage}</p>}

        <section className="ops-page__panel" style={{ marginBottom: 14 }}>
          <h2>검수 메모</h2>
          <div className="ops-page__form">
            <label>
              메모 / 거절 사유
              <textarea rows={3} value={reviewNote} onChange={(event) => setReviewNote(event.currentTarget.value)} />
            </label>
          </div>
        </section>

        <section className="ops-page__grid">
          <div className="ops-page__panel">
            <h2>검증 요청</h2>
            <div className="ops-page__list">
              {verificationRequests.length > 0 ? verificationRequests.map((request) => (
                <article className="ops-page__item" key={String(request.id)}>
                  <div className="ops-page__item-header">
                    <strong>Request #{request.id}</strong>
                    <span className="ops-page__badge">{request.status ?? 'PENDING'}</span>
                  </div>
                  <small>Target #{request.target_id ?? '-'}</small>
                  <p>{request.applicant_note ?? '신청 메모 없음'}</p>
                  <div className="ops-page__button-row">
                    <button type="button" onClick={() => runAdminAction(
                      () => adminApi.approveVerificationRequest(request.id, reviewNote),
                      '검증 요청을 승인했어요.',
                    )}>
                      <CheckCircle2 size={16} /> 승인
                    </button>
                    <button type="button" onClick={() => runAdminAction(
                      () => adminApi.needMoreInfoVerificationRequest(request.id, reviewNote || '추가 정보가 필요합니다.'),
                      '추가 정보 요청을 보냈어요.',
                    )}>
                      <RefreshCw size={16} /> 추가 정보
                    </button>
                    <button type="button" onClick={() => runAdminAction(
                      () => adminApi.rejectVerificationRequest(request.id, reviewNote || '검증 요건을 충족하지 못했습니다.'),
                      '검증 요청을 거절했어요.',
                    )}>
                      <XCircle size={16} /> 거절
                    </button>
                  </div>
                </article>
              )) : <p className="ops-page__empty">대기 중인 검증 요청이 없습니다.</p>}
            </div>
          </div>

          <div className="ops-page__panel">
            <h2>삭제 요청</h2>
            <div className="ops-page__list">
              {deletionRequests.length > 0 ? deletionRequests.map((request) => (
                <article className="ops-page__item" key={String(request.id)}>
                  <div className="ops-page__item-header">
                    <strong>{request.target_type} #{request.target_id ?? '-'}</strong>
                    <span className="ops-page__badge">{request.status ?? 'PENDING'}</span>
                  </div>
                  <p>{request.reason ?? '사유 없음'}</p>
                  <div className="ops-page__button-row">
                    <button type="button" onClick={() => runAdminAction(
                      () => adminApi.approveAndProcessDeletionRequest(request.id),
                      '삭제 요청을 처리했어요.',
                    )}>
                      <Trash2 size={16} /> 처리
                    </button>
                    <button type="button" onClick={() => runAdminAction(
                      () => adminApi.rejectDeletionRequest(request.id),
                      '삭제 요청을 거절했어요.',
                    )}>
                      <XCircle size={16} /> 거절
                    </button>
                  </div>
                </article>
              )) : <p className="ops-page__empty">삭제 요청이 없습니다.</p>}
            </div>
          </div>

          <div className="ops-page__panel">
            <h2>신고</h2>
            <div className="ops-page__list">
              {reports.length > 0 ? reports.map((report) => (
                <article className="ops-page__item" key={String(report.id)}>
                  <div className="ops-page__item-header">
                    <strong>{report.target_type} #{report.target_id}</strong>
                    <span className="ops-page__badge">{report.status ?? 'PENDING'}</span>
                  </div>
                  <small>{report.reason_type}</small>
                  <p>{report.reason_detail ?? '상세 사유 없음'}</p>
                  <div className="ops-page__button-row">
                    <button type="button" onClick={() => runAdminAction(
                      () => adminApi.updateReportStatus(report.id, 'reviewing'),
                      '신고를 검토 중으로 변경했어요.',
                    )}>
                      <Flag size={16} /> 검토
                    </button>
                    <button type="button" onClick={() => runAdminAction(
                      () => adminApi.updateReportStatus(report.id, 'resolve'),
                      '신고를 해결 처리했어요.',
                    )}>
                      <CheckCircle2 size={16} /> 해결
                    </button>
                    <button type="button" onClick={() => runAdminAction(
                      () => adminApi.updateReportStatus(report.id, 'reject'),
                      '신고를 거절했어요.',
                    )}>
                      <XCircle size={16} /> 거절
                    </button>
                  </div>
                </article>
              )) : <p className="ops-page__empty">대기 중인 신고가 없습니다.</p>}
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default AdminPage
