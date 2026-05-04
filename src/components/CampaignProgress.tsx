import type { Campaign } from '../data/campaigns'

type CampaignProgressProps = {
  campaigns: Campaign[]
  activeIndex: number
  onSelect: (index: number) => void
}

function CampaignProgress({
  campaigns,
  activeIndex,
  onSelect,
}: CampaignProgressProps) {
  return (
    <aside className="campaign-progress" aria-label="캠페인 진행 상태">
      <p className="campaign-progress__count">
        <span>{String(activeIndex + 1).padStart(2, '0')}</span>
        <span aria-hidden="true">/</span>
        <span>{String(campaigns.length).padStart(2, '0')}</span>
      </p>
      <div className="campaign-progress__rail" aria-hidden="true">
        <span
          style={{
            transform: `scaleY(${(activeIndex + 1) / campaigns.length})`,
          }}
        />
      </div>
      <div className="campaign-progress__dots">
        {campaigns.map((campaign, index) => (
          <button
            key={campaign.id}
            type="button"
            className={index === activeIndex ? 'is-active' : ''}
            onClick={() => onSelect(index)}
            aria-label={`${campaign.title} 캠페인 보기`}
            aria-current={index === activeIndex ? 'step' : undefined}
          />
        ))}
      </div>
    </aside>
  )
}

export default CampaignProgress
