import CampaignsPage from './pages/CampaignsPage'
import LandingPage from './pages/LandingPage'
import ProfilePage from './pages/ProfilePage'
import './App.css'

function App() {
  const { pathname } = window.location

  if (pathname.startsWith('/campaigns')) {
    return <CampaignsPage />
  }

  if (pathname.startsWith('/profile')) {
    return <ProfilePage />
  }

  return <LandingPage />
}

export default App
