import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Flag, RefreshCw, Trash2, XCircle } from 'lucide-react'
import { ApiError } from '../lib/apiClient'
import { adminApi } from '../services/adminApi'
import type { ApiId, DeletionRequest, Report, VerificationRequest, VoiceProfile } from '../types/api'
import './OperationsPage.css'

const actionableVerificationStatuses = new Set(['PENDING', 'NEED_MORE_INFO'])
const actionableReportStatuses = new Set(['PENDING', 'REVIEWING'])
const adminPermissionMessage = '현재 계정은 관리자 권한이 없습니다. 닉네임이 admin이어도 백엔드 role이 ADMIN이어야 합니다.'
const adminVoiceProfilePermissionMessage = '관리자 권한이 필요합니다. 백엔드에서 role=ADMIN 계정으로 로그인해주세요.'

function normalizeStatus(status: string | undefined | null) {
  return (status ?? 'PENDING').toUpperCase()
}

function canProcessDeletionRequest(request: DeletionRequest) {
  return normalizeStatus(request.status) === 'PENDING'
}

function getDeletionStatusMessage(status: string | undefined) {
  switch (normalizeStatus(status)) {
    case 'COMPLETED':
      return '이미 처리 완료된 삭제 요청입니다.'
    case 'REJECTED':
      return '이미 거절된 삭제 요청입니다.'
    case 'FAILED':
      return '처리 중 실패한 삭제 요청입니다.'
    case 'CANCELLED':
      return '사용자가 취소한 삭제 요청입니다.'
    case 'PROCESSING':
      return '처리 중인 삭제 요청입니다.'
    default:
      return '현재 상태에서는 처리할 수 없습니다.'
  }
}

function canProcessVerificationRequest(request: VerificationRequest) {
  return actionableVerificationStatuses.has(normalizeStatus(request.status))
}

function getVerificationStatusMessage(status: string | undefined) {
  switch (normalizeStatus(status)) {
    case 'APPROVED':
      return '이미 승인된 검증 요청입니다.'
    case 'REJECTED':
      return '이미 거절된 검증 요청입니다.'
    case 'EXPIRED':
      return '만료된 검증 요청입니다.'
    case 'REVOKED':
      return '철회된 검증 요청입니다.'
    default:
      return '현재 상태에서는 처리할 수 없습니다.'
  }
}

function canProcessReport(report: Report) {
  return actionableReportStatuses.has(normalizeStatus(report.status))
}

function getReportStatusMessage(status: string | undefined) {
  switch (normalizeStatus(status)) {
    case 'RESOLVED':
      return '이미 해결된 신고입니다.'
    case 'REJECTED':
      return '이미 거절된 신고입니다.'
    case 'ACTION_TAKEN':
      return '조치 완료된 신고입니다.'
    default:
      return '현재 상태에서는 처리할 수 없습니다.'
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

function isForbiddenError(error: unknown) {
  return error instanceof ApiError && error.status === 403
}

function formatValue(value: unknown) {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

function getVoiceProfileId(profile: VoiceProfile | null, fallbackId: string): ApiId | null {
  const trimmedFallbackId = fallbackId.trim()

  return profile?.id ?? (trimmedFallbackId || null)
}

function AdminPage() {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([])
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [reviewNote, setReviewNote] = useState('')
  const [voiceProfileId, setVoiceProfileId] = useState('')
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVoiceProfileLoading, setIsVoiceProfileLoading] = useState(false)
  const [isVoiceProfileSubmitting, setIsVoiceProfileSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const voiceProfileStatus = normalizeStatus(voiceProfile?.status)
  const canApproveVoiceProfile = Boolean(voiceProfile && voiceProfileStatus === 'READY' && !isVoiceProfileSubmitting)

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
      setErrorMessage(isForbiddenError(error) ? adminPermissionMessage : getErrorMessage(error, '관리자 데이터를 불러오지 못했습니다.'))
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
      setErrorMessage(isForbiddenError(error) ? adminPermissionMessage : getErrorMessage(error, '관리자 작업에 실패했습니다.'))
    }
  }

  const loadVoiceProfile = async () => {
    const nextVoiceProfileId = voiceProfileId.trim()

    if (!nextVoiceProfileId) {
      setErrorMessage('Voice Profile ID를 입력해주세요.')
      return
    }

    setIsVoiceProfileLoading(true)
    setStatusMessage('')
    setErrorMessage('')

    try {
      const nextVoiceProfile = await adminApi.getVoiceProfile(nextVoiceProfileId)

      setVoiceProfile(nextVoiceProfile)
      setStatusMessage('음성 프로필 정보를 불러왔습니다.')
    } catch (error) {
      setVoiceProfile(null)
      setErrorMessage(isForbiddenError(error) ? adminVoiceProfilePermissionMessage : '음성 프로필 정보를 불러오지 못했습니다.')
    } finally {
      setIsVoiceProfileLoading(false)
    }
  }

  const runVoiceProfileAction = async (
    action: (voiceProfileId: ApiId) => Promise<VoiceProfile>,
    successMessage: string,
  ) => {
    const targetVoiceProfileId = getVoiceProfileId(voiceProfile, voiceProfileId)

    if (!targetVoiceProfileId) {
      setErrorMessage('먼저 Voice Profile ID를 조회해주세요.')
      return
    }

    setIsVoiceProfileSubmitting(true)
    setStatusMessage('')
    setErrorMessage('')

    try {
      const nextVoiceProfile = await action(targetVoiceProfileId)

      setVoiceProfile(nextVoiceProfile)
      setStatusMessage(successMessage)
    } catch (error) {
      setErrorMessage(isForbiddenError(error) ? adminVoiceProfilePermissionMessage : getErrorMessage(error, '음성 프로필 검수 작업에 실패했습니다.'))
    } finally {
      setIsVoiceProfileSubmitting(false)
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
          <p>검증 요청, 삭제 요청, 신고, 음성 프로필 검수를 관리합니다.</p>
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

        <section className="ops-page__panel" style={{ marginBottom: 14 }}>
          <h2>음성 프로필 검수</h2>
          <div className="ops-page__form">
            <label>
              Voice Profile ID
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={voiceProfileId}
                onChange={(event) => setVoiceProfileId(event.currentTarget.value)}
              />
            </label>
            <div className="ops-page__button-row">
              <button className="ops-page__button-secondary" type="button" onClick={loadVoiceProfile} disabled={isVoiceProfileLoading}>
                <RefreshCw size={17} /> 조회
              </button>
            </div>
          </div>

          {voiceProfile && (
            <article className="ops-page__item">
              <div className="ops-page__item-header">
                <strong>Voice Profile #{voiceProfile.id ?? '-'}</strong>
                <span className="ops-page__badge">{voiceProfile.status ?? 'UNKNOWN'}</span>
              </div>
              <p>status: {formatValue(voiceProfile.status)}</p>
              <p>review_status: {formatValue(voiceProfile.review_status)}</p>
              <p>quality_score: {formatValue(voiceProfile['quality_score'])}</p>
              <p>error_message: {formatValue(voiceProfile['error_message'])}</p>
              <div className="ops-page__button-row">
                <button
                  type="button"
                  onClick={() => runVoiceProfileAction(
                    (id) => adminApi.approveVoiceProfile(id, reviewNote),
                    '음성 프로필을 승인했습니다.',
                  )}
                  disabled={!canApproveVoiceProfile}
                >
                  <CheckCircle2 size={16} /> 승인
                </button>
                <button
                  type="button"
                  onClick={() => runVoiceProfileAction(
                    (id) => adminApi.rejectVoiceProfile(id, reviewNote),
                    '음성 프로필을 거절했습니다.',
                  )}
                  disabled={isVoiceProfileSubmitting}
                >
                  <XCircle size={16} /> 거절
                </button>
                <button
                  type="button"
                  onClick={() => runVoiceProfileAction(
                    (id) => adminApi.revokeVoiceProfile(id, reviewNote),
                    '음성 프로필을 철회했습니다.',
                  )}
                  disabled={isVoiceProfileSubmitting}
                >
                  <RefreshCw size={16} /> 철회
                </button>
              </div>
              {voiceProfileStatus !== 'READY' && (
                <p className="ops-page__state-note">READY 상태에서만 승인할 수 있습니다.</p>
              )}
            </article>
          )}
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
                  <p>{request.applicant_note ?? '요청 메모 없음'}</p>
                  {canProcessVerificationRequest(request) ? (
                    <div className="ops-page__button-row">
                      <button type="button" onClick={() => runAdminAction(
                        () => adminApi.approveVerificationRequest(request.id, reviewNote),
                        '검증 요청을 승인했습니다.',
                      )}>
                        <CheckCircle2 size={16} /> 승인
                      </button>
                      <button type="button" onClick={() => runAdminAction(
                        () => adminApi.needMoreInfoVerificationRequest(request.id, reviewNote || '추가 정보가 필요합니다.'),
                        '추가 정보 요청을 보냈습니다.',
                      )}>
                        <RefreshCw size={16} /> 추가 정보
                      </button>
                      <button type="button" onClick={() => runAdminAction(
                        () => adminApi.rejectVerificationRequest(request.id, reviewNote || '검증 요건을 충족하지 못했습니다.'),
                        '검증 요청을 거절했습니다.',
                      )}>
                        <XCircle size={16} /> 거절
                      </button>
                    </div>
                  ) : (
                    <p className="ops-page__state-note">{getVerificationStatusMessage(request.status)}</p>
                  )}
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
                  {canProcessDeletionRequest(request) ? (
                    <div className="ops-page__button-row">
                      <button type="button" onClick={() => runAdminAction(
                        () => adminApi.approveAndProcessDeletionRequest(request.id),
                        '삭제 요청을 처리했습니다.',
                      )}>
                        <Trash2 size={16} /> 처리
                      </button>
                      <button type="button" onClick={() => runAdminAction(
                        () => adminApi.rejectDeletionRequest(request.id),
                        '삭제 요청을 거절했습니다.',
                      )}>
                        <XCircle size={16} /> 거절
                      </button>
                    </div>
                  ) : (
                    <p className="ops-page__state-note">{getDeletionStatusMessage(request.status)}</p>
                  )}
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
                  {canProcessReport(report) ? (
                    <div className="ops-page__button-row">
                      <button type="button" onClick={() => runAdminAction(
                        () => adminApi.updateReportStatus(report.id, 'reviewing'),
                        '신고를 검토 중으로 변경했습니다.',
                      )}>
                        <Flag size={16} /> 검토
                      </button>
                      <button type="button" onClick={() => runAdminAction(
                        () => adminApi.updateReportStatus(report.id, 'resolve'),
                        '신고를 해결 처리했습니다.',
                      )}>
                        <CheckCircle2 size={16} /> 해결
                      </button>
                      <button type="button" onClick={() => runAdminAction(
                        () => adminApi.updateReportStatus(report.id, 'reject'),
                        '신고를 거절했습니다.',
                      )}>
                        <XCircle size={16} /> 거절
                      </button>
                    </div>
                  ) : (
                    <p className="ops-page__state-note">{getReportStatusMessage(report.status)}</p>
                  )}
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
