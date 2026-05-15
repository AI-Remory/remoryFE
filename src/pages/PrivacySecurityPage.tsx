import { useEffect, useState } from 'react'
import { ArrowLeft, Flag, LogOut, Mail, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { authApi } from '../services/authApi'
import type { User } from '../types/api'
import './OperationsPage.css'

function PrivacySecurityPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let ignore = false

    authApi.me()
      .then((nextUser) => {
        if (!ignore) {
          setUser(nextUser)
        }
      })
      .catch(() => undefined)

    return () => {
      ignore = true
    }
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    await authApi.logout()
  }

  return (
    <main className="ops-page">
      <section className="ops-page__container" aria-label="개인정보 및 보안">
        <header className="ops-page__header">
          <button className="ops-page__back" type="button" onClick={() => window.location.assign('/my')}>
            <ArrowLeft size={17} /> 마이
          </button>
          <span className="ops-page__eyebrow">Privacy & Security</span>
          <h1>개인정보 및 보안</h1>
          <p>계정 정보와 데이터 관리 항목을 확인합니다.</p>
        </header>

        <section className="ops-page__grid">
          <div className="ops-page__panel">
            <h2>계정</h2>
            <article className="ops-page__item">
              <div className="ops-page__item-header">
                <strong>{user?.nickname ?? '사용자'}</strong>
                <span className="ops-page__badge">{user?.role ?? 'USER'}</span>
              </div>
              <p>
                <Mail size={15} /> {user?.email ?? '계정 정보를 불러오는 중입니다.'}
              </p>
            </article>
            <div className="ops-page__button-row">
              <button className="ops-page__button-secondary" type="button" onClick={() => window.location.assign('/profile')}>
                <UserRound size={17} /> 내 정보 수정
              </button>
              <button className="ops-page__button-secondary" type="button" onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut size={17} /> {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
          </div>

          <div className="ops-page__panel">
            <h2>데이터 관리</h2>
            <article className="ops-page__item">
              <div className="ops-page__item-header">
                <strong>보안 상태</strong>
                <span className="ops-page__badge">활성</span>
              </div>
              <p>
                <ShieldCheck size={15} /> 로그인된 계정 기준으로 데이터 접근 권한을 확인합니다.
              </p>
            </article>
            <div className="ops-page__button-row">
              <button className="ops-page__button-secondary" type="button" onClick={() => window.location.assign('/deletion')}>
                <Trash2 size={17} /> 삭제 요청
              </button>
              <button className="ops-page__button-secondary" type="button" onClick={() => window.location.assign('/report')}>
                <Flag size={17} /> 신고
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default PrivacySecurityPage
