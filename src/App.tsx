import CampaignsPage from './pages/CampaignsPage'
import ProfilePage from './pages/ProfilePage'
import './App.css'

function App() {
  if (window.location.pathname.startsWith('/profile')) {
    return <ProfilePage />
  }

  return <CampaignsPage />
}

export default App
