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
  const normalized = String(role).toUpperCase()

  if (normalized === 'ADMIN') {
    return '관리자'
  }

  if (normalized === 'USER') {
    return '일반 사용자'
  }

  return role
}

function MyPage() {
  const { user, isAdmin, logout } = useAuth()

  async function handleLogout() {
    await logout()
    window.location.href = '/login'
  }

  const userRole = user?.role

  return (
    <AppShell title="내 계정" subtitle="현재 로그인된 계정 정보를 확인할 수 있어요." badge="로그인됨">
      <main className="account-page" aria-label="내 계정">
        <section className="account-page__profile">
          <div className="account-page__avatar" aria-hidden="true">
            {user?.nickname?.slice(0, 1) || user?.email?.slice(0, 1) || 'R'}
          </div>
          <div>
            <p className="account-page__eyebrow">로그인된 계정</p>
            <h1>{user?.nickname ?? '이름 없음'}</h1>
            <p>{user?.email ?? '이메일 없음'}</p>
          </div>
        </section>

        <section className="account-page__section" aria-label="계정 정보">
          <div className="account-page__section-heading">
            <h2>계정 정보</h2>
            <span>기본 정보</span>
          </div>

          <dl className="account-page__details">
            <div>
              <dt>이메일</dt>
              <dd>{user?.email ?? '정보 없음'}</dd>
            </div>
            <div>
              <dt>이름</dt>
              <dd>{user?.nickname ?? '정보 없음'}</dd>
            </div>
            {userRole && (
              <div>
                <dt>권한</dt>
                <dd>{getRoleLabel(userRole)}</dd>
              </div>
            )}
            <div>
              <dt>가입일</dt>
              <dd>{user?.created_at ? formatDateTime(user.created_at) : '정보 없음'}</dd>
            </div>
            <div>
              <dt>최근 수정</dt>
              <dd>{user?.updated_at ? formatDateTime(user.updated_at) : '정보 없음'}</dd>
            </div>
          </dl>
        </section>

        <section className="account-page__section" aria-label="계정 작업">
          <div className="account-page__section-heading">
            <h2>계정에서 할 수 있는 일</h2>
          </div>
          <div className="account-page__actions">
            <a href="/safety/deletion-requests">데이터 삭제 요청 관리</a>
            {isAdmin && <a href="/admin">관리자 페이지</a>}
            <button type="button" onClick={() => void handleLogout()}>
              로그아웃
            </button>
          </div>
          <p className="account-page__note">지원하지 않는 기능은 화면에 노출하지 않았어요.</p>
        </section>
      </main>
    </AppShell>
  )
}

export default MyPage
