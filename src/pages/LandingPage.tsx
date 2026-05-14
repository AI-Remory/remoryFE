import './LandingPage.css'

function LandingPage() {
  const handleStartMemory = () => {
    window.location.href = '/auth?tab=login'
  }

  const handleContinueWithGoogle = () => {
    window.location.href = '/auth?tab=login'
  }

  const handleExplore = () => {
    window.location.href = '/home'
  }

  const handleOpenInfo = () => {
    window.alert('서비스 안내는 준비 중입니다.')
  }

  return (
    <main className="remory-onboarding-page" aria-label="Remory onboarding">
      <section className="remory-onboarding-screen" aria-label="Remory first onboarding screen">
        <header className="remory-onboarding-header">
          <div className="remory-onboarding-brand" aria-label="Remory">
            <span className="remory-onboarding-logo" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>Remory</span>
          </div>
          <button
            className="remory-onboarding-info"
            type="button"
            aria-label="서비스 안내 보기"
            onClick={handleOpenInfo}
          >
            !
          </button>
        </header>

        <div className="remory-hero-image-wrap">
          <img
            className="remory-hero-image"
            src="/images/remory-hero.png"
            alt="소중한 사람의 목소리와 기억을 담은 스토리북"
          />
        </div>

        <section className="remory-onboarding-copy">
          <h1 className="remory-onboarding-title">
            소중한 사람의 <br className="remory-onboarding-mobile-break" />
            목소리와
            <br />
            기억을, 다시 <span>대화로.</span>
          </h1>
          <p className="remory-onboarding-subtitle">
            사진과 음성으로 AI 페르소나를 만들고,
            <br />
            추억을 스토리북으로 남겨보세요.
          </p>
        </section>

        <div className="remory-onboarding-pager" aria-label="온보딩 1 / 3">
          <span className="is-active" />
          <span />
          <span />
        </div>

        <section className="remory-onboarding-actions" aria-label="시작 및 로그인">
          <button className="remory-onboarding-primary" type="button" onClick={handleStartMemory}>
            기억 시작하기
          </button>
          <button className="remory-onboarding-secondary" type="button" onClick={handleContinueWithGoogle}>
            <span className="remory-onboarding-google" aria-hidden="true">
              G
            </span>
            Google로 계속하기
          </button>
          <button className="remory-onboarding-text-button" type="button" onClick={handleExplore}>
            계정 없이 둘러보기
          </button>
        </section>
      </section>
    </main>
  )
}

export default LandingPage
