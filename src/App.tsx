import AuthPage from './pages/AuthPage'
import CampaignsPage from './pages/CampaignsPage'
import ChatPage from './pages/ChatPage'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import MyPage from './pages/MyPage'
import ProfilePage from './pages/ProfilePage'
import SetupPage from './pages/SetupPage'
import StorybookPage from './pages/StorybookPage'
import { useAuth } from './hooks/useAuth'
import './App.css'

const protectedPaths = ['/campaigns', '/profile', '/setup', '/home', '/chat', '/storybook', '/my']

function App() {
  const { pathname } = window.location
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <main className="app-loading">Loading...</main>
  }

  if (pathname.startsWith('/auth') && isAuthenticated) {
    window.location.replace('/home')
    return <main className="app-loading">Loading...</main>
  }

  if (protectedPaths.some((path) => pathname.startsWith(path)) && !isAuthenticated) {
    window.location.replace('/auth')
    return <main className="app-loading">Loading...</main>
  }

  if (pathname.startsWith('/campaigns')) {
    return <CampaignsPage />
  }

  if (pathname.startsWith('/profile')) {
    return <ProfilePage />
  }

  if (pathname.startsWith('/auth')) {
    return <AuthPage />
  }

  if (pathname.startsWith('/setup')) {
    return <SetupPage />
  }

  if (pathname.startsWith('/home')) {
    return <HomePage />
  }

  if (pathname.startsWith('/chat')) {
    return <ChatPage />
  }

  if (pathname.startsWith('/storybook')) {
    return <StorybookPage />
  }

  if (pathname.startsWith('/my')) {
    return <MyPage />
  }

  return <LandingPage />
}

export default App
