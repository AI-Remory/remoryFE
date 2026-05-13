import './LandingPage.css'

const features = [
  {
    title: '소중한 사람의 페르소나 만들기',
    description: '관계 입증과 동의를 바탕으로 대화할 수 있는 페르소나를 준비해요.',
  },
  {
    title: '사진과 음성으로 기억 남기기',
    description: '사진, 목소리, 짧은 설명을 모아 더 자연스러운 기억 자료를 만들어요.',
  },
  {
    title: '스토리북으로 추억 공유하기',
    description: '정리된 이야기를 가족과 가까운 사람에게 조심스럽게 공유해요.',
  },
]

function LandingPage() {
  const goToAuth = () => {
    window.location.href = '/auth'
  }

  return (
    <main className="landing-page">
      <header className="landing-header" aria-label="Remory">
        <a className="landing-brand" href="/">
          <span className="landing-brand__mark" aria-hidden="true">R</span>
          <span>Remory</span>
        </a>
        <nav className="landing-nav" aria-label="시작 메뉴">
          <a href="/auth">로그인</a>
          <button type="button" onClick={goToAuth}>회원가입</button>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__media" aria-hidden="true">
          <img src="/images/remory-hero.png" alt="" />
        </div>
        <div className="landing-hero__content">
          <span className="ui-badge">기억을 다정하게 남기는 공간</span>
          <h1 id="landing-title">Remory</h1>
          <p>
            Remory는 사진과 음성, 이야기를 모아 소중한 사람의 기억을 페르소나와 스토리북으로 이어 주는 플랫폼입니다.
          </p>
          <div className="landing-hero__actions" aria-label="Remory 시작하기">
            <a className="landing-button landing-button--primary" href="/auth">로그인</a>
            <button className="landing-button landing-button--secondary" type="button" onClick={goToAuth}>회원가입</button>
            <a className="landing-button landing-button--ghost" href="#features">서비스 둘러보기</a>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features" aria-labelledby="features-title">
        <div className="landing-section-heading">
          <span>Remory에서 할 수 있는 일</span>
          <h2 id="features-title">기억을 남기고, 대화하고, 함께 봐요.</h2>
        </div>
        <div className="landing-feature-grid">
          {features.map((feature, index) => (
            <article className="landing-feature-card" key={feature.title}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default LandingPage
