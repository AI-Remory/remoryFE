type CampaignNavigationProps = {
  onStart: () => void
}

function CampaignNavigation({ onStart }: CampaignNavigationProps) {
  return (
    <header className="campaign-nav" aria-label="Remory campaign navigation">
      <a className="campaign-nav__brand" href="/" aria-label="Remory home">
        Remory
      </a>
      <nav className="campaign-nav__links" aria-label="Primary">
        <a href="#archive">기록소</a>
        <a href="#voices">목소리</a>
        <button type="button" onClick={onStart} aria-label="기억 시작하기">
          시작하기
        </button>
      </nav>
    </header>
  )
}

export default CampaignNavigation
