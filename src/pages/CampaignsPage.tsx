import CampaignViewer from '../components/CampaignViewer'
import { campaigns } from '../data/campaigns'

function CampaignsPage() {
  return <CampaignViewer campaigns={campaigns} />
}

export default CampaignsPage
