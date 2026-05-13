import { AppShell } from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import './MyPage.css'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getRoleLabel(role: string) {
  if (role === 'admin' || role === 'ADMIN') {
    return '관리자'
  }

  if (role === 'user' || role === 'USER') {
    return '일반 사용자'
  }

  return role
}

function MyPage() {
  const { user, isAdmin, logout } = useAuth()

  async function handleLogout() {
    await logout()
    window.location.href = '/auth'
  }

  return (
    <AppShell title="내 계정" subtitle="현재 로그인한 사용자 정보를 표시합니다." badge="연결됨">
      <main className="account-page" aria-label="내 계정">
        <section className="account-page__profile">
          <div className="account-page__avatar" aria-hidden="true">
            {user?.nickname?.slice(0, 1) || user?.email?.slice(0, 1) || 'R'}
          </div>
          <div>
            <p className="account-page__eyebrow">현재 로그인 계정</p>
            <h1>{user?.nickname ?? '정보 없음'}</h1>
            <p>{user?.email ?? '정보 없음'}</p>
          </div>
        </section>

        <section className="account-page__section" aria-label="계정 정보">
          <div className="account-page__section-heading">
            <h2>계정 정보</h2>
            <span>로그인 계정</span>
          </div>

          <dl className="account-page__details">
            <div>
              <dt>사용자 ID</dt>
              <dd>{user?.id ?? '정보 없음'}</dd>
            </div>
            <div>
              <dt>이메일</dt>
              <dd>{user?.email ?? '정보 없음'}</dd>
            </div>
            <div>
              <dt>이름</dt>
              <dd>{user?.nickname ?? '정보 없음'}</dd>
            </div>
            {user?.role && (
              <div>
                <dt>역할</dt>
                <dd>{getRoleLabel(user.role)}</dd>
              </div>
            )}
            <div>
              <dt>생성일</dt>
              <dd>{user?.created_at ? formatDateTime(user.created_at) : '정보 없음'}</dd>
            </div>
            <div>
              <dt>수정일</dt>
              <dd>{user?.updated_at ? formatDateTime(user.updated_at) : '정보 없음'}</dd>
            </div>
          </dl>
        </section>

        <section className="account-page__section" aria-label="계정 작업">
          <div className="account-page__section-heading">
            <h2>사용 가능한 작업</h2>
          </div>
          <div className="account-page__actions">
            <a href="/safety/deletion-requests">삭제 요청 관리</a>
            {isAdmin && <a href="/admin">관리자 페이지</a>}
            <button type="button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
          <p className="account-page__note">
            알림, 결제, 구독, 저장공간, 외부 계정 연결처럼 아직 준비되지 않은 기능은 계정 페이지에 표시하지 않습니다.
          </p>
        </section>
      </main>
    </AppShell>
  )
}

export default MyPage
