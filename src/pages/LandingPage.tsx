import './LandingPage.css'

function LandingPage() {
  const handleStartMemory = () => {
    window.location.href = '/auth'
  }

  const handleEmailLogin = () => {
    window.location.href = '/auth'
  }

  return (
    <main className="remory-onboarding-page" aria-label="Remory 소개">
      <section className="remory-onboarding-screen" aria-label="Remory 시작 화면">
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
            disabled
            title="지금은 준비 중인 기능이에요."
          >
            !
          </button>
        </header>

        <div className="remory-hero-image-wrap">
          <img
            className="remory-hero-image"
            src="/images/remory-hero.png"
            alt="소중한 사람의 사진과 목소리로 남기는 기억"
          />
        </div>

        <section className="remory-onboarding-copy">
          <h1 className="remory-onboarding-title">
            소중한 사람의 기억을
            <br />
            더 오래 <span>간직해요.</span>
          </h1>
          <p className="remory-onboarding-subtitle">
            사진과 음성을 모아 페르소나를 만들고,
            <br />
            추억을 스토리북으로 정리해 보세요.
          </p>
        </section>

        <div className="remory-onboarding-pager" aria-label="소개 화면 1 / 3">
          <span className="is-active" />
          <span />
          <span />
        </div>

        <section className="remory-onboarding-actions" aria-label="시작하기">
          <button className="remory-onboarding-primary" type="button" onClick={handleStartMemory}>
            시작하기
          </button>
          <button className="remory-onboarding-secondary" type="button" disabled title="지금은 준비 중인 기능이에요.">
            <span className="remory-onboarding-google" aria-hidden="true">
              G
            </span>
            Google로 계속하기
          </button>
          <button className="remory-onboarding-secondary" type="button" onClick={handleEmailLogin}>
            <span className="remory-onboarding-mail" aria-hidden="true" />
            이메일로 로그인
          </button>
          <button className="remory-onboarding-text-button" type="button" disabled title="지금은 준비 중인 기능이에요.">
            둘러보기
          </button>
        </section>
      </section>
    </main>
  )
}

export default LandingPage
