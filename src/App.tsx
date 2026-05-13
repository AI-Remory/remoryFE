import AuthPage from './pages/AuthPage'
import CampaignsPage from './pages/CampaignsPage'
import ChatPage from './pages/ChatPage'
import HomePage from './pages/HomePage'
import InterviewPage from './pages/InterviewPage'
import LandingPage from './pages/LandingPage'
import MyPage from './pages/MyPage'
import ProfilePage from './pages/ProfilePage'
import PublicSharePage from './pages/PublicSharePage'
import SetupPage from './pages/SetupPage'
import StorybookDetailPage from './pages/StorybookDetailPage'
import StorybookPage from './pages/StorybookPage'
import './App.css'

function App() {
  const { pathname } = window.location

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

  if (pathname.startsWith('/interview')) {
    return <InterviewPage />
  }

  if (pathname.startsWith('/share/')) {
    return <PublicSharePage />
  }

  if (pathname.startsWith('/storybook/')) {
    return <StorybookDetailPage />
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
