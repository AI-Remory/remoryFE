import { useAuth } from './hooks/useAuth'
import { matchRoute } from './routes'
import './App.css'

function AdminAccessDenied() {
  return (
    <main className="app-loading" role="alert">
      관리자 권한이 없습니다. 관리자 기능은 /auth/me 응답의 role이 ADMIN 또는 admin일 때만 사용할 수 있습니다.
      <br />
      <a href="/dashboard">대시보드로 이동</a>
    </main>
  )
}

function App() {
  const { pathname } = window.location
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const route = matchRoute(pathname)

  if (isLoading) {
    return <main className="app-loading">불러오는 중...</main>
  }

  if (pathname.startsWith('/auth') && isAuthenticated) {
    window.location.replace('/dashboard')
    return <main className="app-loading">이동하는 중...</main>
  }

  if (route?.protected && !isAuthenticated) {
    window.location.replace('/auth')
    return <main className="app-loading">로그인 화면으로 이동하는 중...</main>
  }

  if (route?.group === 'admin' && !isAdmin) {
    return <AdminAccessDenied />
  }

  const Page = route?.component

  if (Page) {
    return <Page />
  }

  window.location.replace(isAuthenticated ? '/dashboard' : '/')
  return <main className="app-loading">이동하는 중...</main>
}

export default App
