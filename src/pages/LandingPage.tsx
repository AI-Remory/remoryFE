import './LandingPage.css'

function LandingPage() {
  const handleStartMemory = () => {
    console.log('start memory')
  }

  const handleContinueWithGoogle = () => {
    console.log('continue with google')
  }

  const handleEmailLogin = () => {
    console.log('email login')
  }

  const handleExplore = () => {
    console.log('explore without account')
  }

  const handleOpenInfo = () => {
    console.log('open info')
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

        <section className="remory-onboarding-hero" aria-label="기억 스토리북 일러스트">
          <span className="remory-onboarding-petal remory-onboarding-petal--one" aria-hidden="true" />
          <span className="remory-onboarding-petal remory-onboarding-petal--two" aria-hidden="true" />
          <span className="remory-onboarding-petal remory-onboarding-petal--three" aria-hidden="true" />
          <span className="remory-onboarding-petal remory-onboarding-petal--four" aria-hidden="true" />
          <span className="remory-onboarding-leaf remory-onboarding-leaf--one" aria-hidden="true" />
          <span className="remory-onboarding-leaf remory-onboarding-leaf--two" aria-hidden="true" />

          <div className="remory-onboarding-paper remory-onboarding-paper--left" aria-hidden="true" />
          <div className="remory-onboarding-paper remory-onboarding-paper--right" aria-hidden="true" />
          <div className="remory-onboarding-small-photo" aria-hidden="true">
            <span />
          </div>

          <div className="remory-onboarding-portrait-card" aria-hidden="true">
            <span className="remory-onboarding-tape" />
            <div className="remory-onboarding-portrait">
              <span className="remory-onboarding-hair" />
              <span className="remory-onboarding-face" />
              <span className="remory-onboarding-neck" />
              <span className="remory-onboarding-shoulders" />
              <span className="remory-onboarding-smile" />
            </div>
          </div>

          <div className="remory-onboarding-memo">
            <span>엄마의 따뜻한</span>
            <strong>말 한마디</strong>
          </div>

          <div className="remory-onboarding-voice">
            <span className="remory-onboarding-wave" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>0:28</span>
          </div>

          <div className="remory-onboarding-book">
            <div className="remory-onboarding-book-page remory-onboarding-book-page--left">
              <div className="remory-onboarding-landscape" aria-hidden="true">
                <span className="remory-onboarding-sun" />
                <span className="remory-onboarding-hill remory-onboarding-hill--one" />
                <span className="remory-onboarding-hill remory-onboarding-hill--two" />
                <span className="remory-onboarding-tree remory-onboarding-tree--one" />
                <span className="remory-onboarding-tree remory-onboarding-tree--two" />
                <span className="remory-onboarding-people" />
              </div>
            </div>
            <div className="remory-onboarding-book-page remory-onboarding-book-page--right">
              <p>
                그날의 목소리
                <br />
                당신의 미소는
                <br />
                기억입니다.
              </p>
            </div>
          </div>
        </section>

        <section className="remory-onboarding-copy">
          <h1 className="remory-onboarding-title">
            소중한 사람의 목소리와
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
          <button className="remory-onboarding-secondary" type="button" onClick={handleEmailLogin}>
            <span className="remory-onboarding-mail" aria-hidden="true" />
            이메일 로그인
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
