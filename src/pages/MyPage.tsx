import { AppShell } from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import './MyPage.css'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getRoleLabel(role: string | undefined) {
  if (role === 'admin' || role === 'ADMIN') {
    return '관리자'
  }

  if (role === 'user' || role === 'USER') {
    return '일반 사용자'
  }

  return 'role 필드 없음'
}

function MyPage() {
  const { user, isAdmin, logout } = useAuth()

  async function handleLogout() {
    await logout()
    window.location.href = '/auth'
  }

  return (
    <AppShell title="내 계정" subtitle="백엔드가 제공하는 계정 정보만 표시합니다." badge="API 연결됨">
      <main className="account-page" aria-label="내 계정">
        <section className="account-page__profile">
          <div className="account-page__avatar" aria-hidden="true">
            {user?.nickname?.slice(0, 1) ?? 'R'}
          </div>
          <div>
            <p className="account-page__eyebrow">현재 로그인 계정</p>
            <h1>{user?.nickname ?? '사용자'}</h1>
            <p>{user?.email ?? '이메일 정보를 불러올 수 없습니다.'}</p>
          </div>
        </section>

        <section className="account-page__section" aria-label="계정 정보">
          <div className="account-page__section-heading">
            <h2>계정 정보</h2>
            <span>GET /auth/me</span>
          </div>
          <dl className="account-page__details">
            <div>
              <dt>사용자 ID</dt>
              <dd>{user?.id ?? '-'}</dd>
            </div>
            <div>
              <dt>이메일</dt>
              <dd>{user?.email ?? '-'}</dd>
            </div>
            <div>
              <dt>이름</dt>
              <dd>{user?.nickname ?? '-'}</dd>
            </div>
            <div>
              <dt>역할</dt>
              <dd>{getRoleLabel(user?.role)}</dd>
            </div>
            <div>
              <dt>가입일</dt>
              <dd>{user?.created_at ? formatDateTime(user.created_at) : '-'}</dd>
            </div>
            <div>
              <dt>최근 수정일</dt>
              <dd>{user?.updated_at ? formatDateTime(user.updated_at) : '-'}</dd>
            </div>
          </dl>
          {!user?.role && (
            <p className="account-page__note">
              현재 OpenAPI의 UserResponse에는 role 필드가 포함되어 있지 않습니다. role이 없으면 관리자 권한으로 판단하지 않습니다.
            </p>
          )}
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
            알림, 결제, 구독, 저장공간, 외부 계정 연결은 현재 확인된 백엔드 API가 없어 표시하지 않습니다.
          </p>
        </section>
      </main>
    </AppShell>
  )
}

export default MyPage
