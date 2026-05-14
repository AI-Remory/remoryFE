import { useAuth } from '../hooks/useAuth'
import './LandingPage.css'

const features = [
  {
    title: '소중한 사람의 페르소나 만들기',
    description: '동의와 관계 입증을 바탕으로 대화할 수 있는 페르소나를 준비해요.',
  },
  {
    title: '사진과 음성으로 기억 남기기',
    description: '사진, 목소리, 이야기 기록을 모아 기억 자료를 차곡차곡 정리해요.',
  },
  {
    title: '스토리북으로 추억 공유하기',
    description: '정리된 이야기를 링크나 그룹으로 안전하게 공유할 수 있어요.',
  },
]

function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="landing-page">
      <header className="landing-header" aria-label="Remory">
        <a className="landing-brand" href="/">
          <span className="landing-brand__mark" aria-hidden="true">R</span>
          <span>Remory</span>
        </a>
        <nav className="landing-nav" aria-label="시작 메뉴">
          <a href="/login">로그인</a>
          <a href="/signup">회원가입</a>
          {isAuthenticated && <a href="/dashboard">홈으로 이동</a>}
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__media" aria-hidden="true">
          <img src="/images/remory-hero.png" alt="" />
        </div>
        <div className="landing-hero__content">
          <span className="ui-badge">기억을 따뜻하게 이어가는 공간</span>
          <h1 id="landing-title">Remory</h1>
          <p>사진과 음성, 이야기를 모아 기억을 정리하고 대화와 스토리북으로 이어갈 수 있어요.</p>
          <div className="landing-hero__actions" aria-label="Remory 시작하기">
            <a className="landing-button landing-button--primary" href="/login">로그인</a>
            <a className="landing-button landing-button--secondary" href="/signup">회원가입</a>
            <a className="landing-button landing-button--ghost" href="#features">서비스 둘러보기</a>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features" aria-labelledby="features-title">
        <div className="landing-section-heading">
          <span>핵심 기능</span>
          <h2 id="features-title">기억을 모으고, 정리하고, 나눌 수 있어요.</h2>
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
