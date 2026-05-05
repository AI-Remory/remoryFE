import CampaignsPage from './pages/CampaignsPage'
import ProfilePage from './pages/ProfilePage'
import './App.css'

function App() {
  const { pathname } = window.location

  if (pathname.startsWith('/campaigns')) {
    return <CampaignsPage />
  }

  return <ProfilePage />
}

export default App
