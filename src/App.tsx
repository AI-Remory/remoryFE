import { useAuth } from './hooks/useAuth'
import { matchRoute } from './routes'
import './App.css'

function App() {
  const { pathname } = window.location
  const { isAuthenticated, isLoading } = useAuth()
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

  // TODO: Backend docs say admin APIs require User.role == "admin", but OpenAPI UserResponse has no role field.
  // Do not infer admin rights client-side; /admin/* endpoints return 403 for non-admin tokens.

  const Page = route?.component

  if (Page) {
    return <Page />
  }

  window.location.replace(isAuthenticated ? '/dashboard' : '/')
  return <main className="app-loading">이동하는 중...</main>
}

export default App
