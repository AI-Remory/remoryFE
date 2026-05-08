import './HomePage.css'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.7 12 4l8 6.7V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 18.5 3.7 22l4-1.1a9.8 9.8 0 0 0 4.3.9c5 0 9-3.6 9-8.1s-4-8.1-9-8.1-9 3.6-9 8.1c0 1.8.7 3.5 2 4.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 13h.01M12 13h.01M16 13h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 4.5h5.2c1 0 1.8.8 1.8 1.8V21c0-1.2-1-2.2-2.2-2.2H5V4.5ZM19 4.5h-5.2c-1 0-1.8.8-1.8 1.8V21c0-1.2 1-2.2 2.2-2.2H19V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function MyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c.8-4.1 3.3-6.3 7-6.3s6.2 2.2 7 6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function HomePage() {
  return (
    <main className="home-page">
      <section className="home-page__container" aria-label="Remory home">
        <header className="home-page__header">
          <p>Remory</p>
          <h1>안녕하세요, 현규님</h1>
          <span>오늘도 소중한 기억을 천천히 이어가요.</span>
        </header>

        <section className="home-page__ready-card">
          <span className="home-page__badge">Coming soon</span>
          <h2>오늘의 기억을 이어가세요</h2>
          <p>홈 화면 준비 중입니다. 곧 대화, 인터뷰, 스토리북 기록을 한곳에서 확인할 수 있어요.</p>
          <button type="button" onClick={() => console.log('continue memory')}>
            기억 이어가기
          </button>
        </section>

        <nav className="home-page__bottom-nav" aria-label="하단 네비게이션">
          <button className="home-page__nav-button is-active" type="button" aria-current="page">
            <HomeIcon />
            <span>홈</span>
          </button>
          <button className="home-page__nav-button" type="button" onClick={() => console.log('go chat')}>
            <ChatIcon />
            <span>대화</span>
          </button>
          <button className="home-page__nav-button" type="button" onClick={() => console.log('go storybook')}>
            <BookIcon />
            <span>스토리북</span>
          </button>
          <button className="home-page__nav-button" type="button" onClick={() => { window.location.href = '/my' }}>
            <MyIcon />
            <span>마이</span>
          </button>
        </nav>
      </section>
    </main>
  )
}

export default HomePage
