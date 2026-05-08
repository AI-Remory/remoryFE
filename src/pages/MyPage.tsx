import './MyPage.css'

type IconName =
  | 'bell'
  | 'camera'
  | 'people'
  | 'book'
  | 'mic'
  | 'editUser'
  | 'card'
  | 'settings'
  | 'shield'
  | 'headset'
  | 'home'
  | 'chat'
  | 'my'

type MenuItem = {
  id: string
  title: string
  description: string
  icon: IconName
}

const personas = [
  {
    id: 'mom',
    name: '엄마',
    description: '따뜻한 조언을 해주시는 분',
    image: '/images/my-page/persona-mom.png',
  },
  {
    id: 'grandma',
    name: '할머니',
    description: '지혜롭고 따뜻하신 분',
    image: '/images/my-page/persona-grandma.png',
  },
  {
    id: 'me',
    name: '나',
    description: '기록하고 있는 나',
    image: '/images/my-page/persona-me.png',
  },
]

const menuItems: MenuItem[] = [
  { id: 'edit-profile', title: '내 정보 수정', description: '프로필과 기본 정보를 관리해요', icon: 'editUser' },
  { id: 'subscription', title: '구독 / 이용권', description: '이용 중인 플랜과 결제 정보를 확인해요', icon: 'card' },
  { id: 'voice-records', title: '음성 기록 관리', description: '인터뷰 음성 파일을 확인하고 관리해요', icon: 'mic' },
  { id: 'storybook-archive', title: '스토리북 보관함', description: '완성된 스토리북을 확인하고 관리해요', icon: 'book' },
  { id: 'notifications', title: '알림 설정', description: '앱 알림과 이메일 수신을 설정해요', icon: 'bell' },
  { id: 'app-settings', title: '앱 설정', description: '언어, 테마 등 앱 환경을 설정해요', icon: 'settings' },
]

const wideMenuItems: MenuItem[] = [
  { id: 'privacy-security', title: '개인정보 및 보안', description: '개인정보 관리와 보안 설정을 확인해요', icon: 'shield' },
  { id: 'support', title: '고객센터', description: '문의하기, 자주 묻는 질문을 확인해요', icon: 'headset' },
]

function AppIcon({ name }: { name: IconName }) {
  switch (name) {
    case 'bell':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 9.8c0-3.4-2.3-5.8-6-5.8S6 6.4 6 9.8c0 4.4-1.7 5.5-2.4 6.4h16.8c-.7-.9-2.4-2-2.4-6.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9.6 19a2.5 2.5 0 0 0 4.8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'camera':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8.4 7.4 9.8 5h4.4l1.4 2.4H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.4a2 2 0 0 1 2-2h3.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="12" cy="13.6" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'people':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3.5 19c.6-3.7 2.6-5.5 5.5-5.5s4.9 1.8 5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15 6.2a2.7 2.7 0 0 1 0 5.1M16.2 14c2.3.5 3.7 2.1 4.3 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'book':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 4.5h5.2c1 0 1.8.8 1.8 1.8V21c0-1.2-1-2.2-2.2-2.2H5V4.5ZM19 4.5h-5.2c-1 0-1.8.8-1.8 1.8V21c0-1.2 1-2.2 2.2-2.2H19V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    case 'mic':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="3.5" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'editUser':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="10" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.5 19c.6-3.7 2.6-5.5 5.5-5.5 1.4 0 2.5.4 3.4 1.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m15 18.7 4.7-4.7 1.8 1.8-4.7 4.7H15v-1.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    case 'card':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3.5 10h17M7 15h4M16.5 14v4M14.5 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m9.7 3.8-.5 2.1a7.6 7.6 0 0 0-1.5.9l-2-.7-1.6 2.8 1.5 1.4a7.5 7.5 0 0 0 0 1.8l-1.5 1.4 1.6 2.8 2-.7c.5.4 1 .7 1.5.9l.5 2.1h3.2l.5-2.1c.6-.2 1.1-.5 1.5-.9l2 .7 1.6-2.8-1.5-1.4a7.5 7.5 0 0 0 0-1.8l1.5-1.4-1.6-2.8-2 .7a7.6 7.6 0 0 0-1.5-.9l-.5-2.1H9.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="11.3" cy="11.2" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3.5 19 6v5.4c0 4.4-2.7 7.6-7 9.1-4.3-1.5-7-4.7-7-9.1V6l7-2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="m9.2 12.1 1.9 1.9 3.8-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'headset':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4.5 13v-1a7.5 7.5 0 0 1 15 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M7 12.5H5.8c-.8 0-1.3.6-1.3 1.4v2.2c0 .8.5 1.4 1.3 1.4H7v-5ZM17 12.5h1.2c.8 0 1.3.6 1.3 1.4v2.2c0 .8-.5 1.4-1.3 1.4H17v-5ZM17 17.5c-.3 2-1.7 3-4.1 3H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10.7 12 4l8 6.7V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 18.5 3.7 22l4-1.1a9.8 9.8 0 0 0 4.3.9c5 0 9-3.6 9-8.1s-4-8.1-9-8.1-9 3.6-9 8.1c0 1.8.7 3.5 2 4.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8 13h.01M12 13h.01M16 13h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'my':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 20c.8-4.1 3.3-6.3 7-6.3s6.2 2.2 7 6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
  }
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MyPage() {
  return (
    <main className="my-page">
      <section className="my-page__container" aria-label="Remory my page">
        <header className="my-page__header">
          <div>
            <h1>마이</h1>
            <p>나의 추억 기록과 설정을 관리해요.</p>
          </div>
          <button className="my-page__notification" type="button" aria-label="알림 보기">
            <AppIcon name="bell" />
            <span />
          </button>
        </header>

        <section className="my-page__profile-card">
          <div className="my-page__profile-top">
            <div className="my-page__avatar-wrap">
              <div className="my-page__avatar">
                <img src="/images/my-page/user-profile.png" alt="현규님 프로필 사진" />
              </div>
              <button className="my-page__camera-button" type="button" aria-label="프로필 사진 변경">
                <AppIcon name="camera" />
              </button>
            </div>
            <div className="my-page__profile-copy">
              <h2>현규님</h2>
              <p>
                소중한 사람들과의 추억을
                <br />
                AI로 기록하고 있어요.
              </p>
            </div>
            <button className="my-page__profile-link" type="button" onClick={() => console.log('view profile')}>
              프로필 보기 <ChevronIcon />
            </button>
          </div>

          <div className="my-page__stats">
            <div>
              <AppIcon name="people" />
              <span>페르소나</span>
              <strong>3명</strong>
            </div>
            <div>
              <AppIcon name="book" />
              <span>스토리북</span>
              <strong>12권</strong>
            </div>
            <div>
              <AppIcon name="mic" />
              <span>인터뷰</span>
              <strong>28건</strong>
            </div>
          </div>
        </section>

        <section className="my-page__persona-section">
          <div className="my-page__section-heading">
            <h2>내 페르소나 관리</h2>
            <button type="button" onClick={() => console.log('view all personas')}>
              전체 보기 <ChevronIcon />
            </button>
          </div>
          <div className="my-page__persona-list">
            {personas.map((persona) => (
              <button
                className="my-page__persona-card"
                type="button"
                key={persona.id}
                onClick={() => console.log('persona click', persona.id)}
              >
                <span className="my-page__persona-avatar">
                  <img src={persona.image} alt={`${persona.name} 페르소나`} />
                </span>
                <span>
                  <strong>{persona.name}</strong>
                  <small>{persona.description}</small>
                </span>
                <ChevronIcon />
              </button>
            ))}
          </div>
          <button className="my-page__create-persona" type="button" onClick={() => console.log('create persona')}>
            + 새 페르소나 만들기
          </button>
        </section>

        <section className="my-page__menu-grid" aria-label="설정 메뉴">
          {menuItems.map((item) => (
            <button className="my-page__menu-card" type="button" key={item.id} onClick={() => console.log('menu click', item.id)}>
              <span className={`my-page__menu-icon my-page__menu-icon--${item.icon}`} aria-hidden="true">
                <AppIcon name={item.icon} />
              </span>
              <span className="my-page__menu-text">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <ChevronIcon />
            </button>
          ))}
        </section>

        <section className="my-page__wide-menu" aria-label="지원 및 보안 메뉴">
          {wideMenuItems.map((item) => (
            <button className="my-page__wide-card" type="button" key={item.id} onClick={() => console.log('menu click', item.id)}>
              <span className={`my-page__menu-icon my-page__menu-icon--${item.icon}`} aria-hidden="true">
                <AppIcon name={item.icon} />
              </span>
              <span className="my-page__menu-text">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <ChevronIcon />
            </button>
          ))}
        </section>

        <section className="my-page__monthly-banner">
          <div>
            <h2>이번 달의 추억 기록</h2>
            <p>
              4월에 남긴 추억이 3개 있어요.
              <br />
              계속 기록하며 소중한 기억을 모아보세요.
            </p>
          </div>
          <button type="button" onClick={() => console.log('view monthly memories')}>
            기록 보러 가기 <ChevronIcon />
          </button>
          <img
            className="my-page__banner-image"
            src="/images/my-page/monthly-memory-banner.png"
            alt=""
            aria-hidden="true"
          />
        </section>

        <nav className="my-page__bottom-nav" aria-label="하단 네비게이션">
          <button className="my-page__nav-button" type="button" onClick={() => { window.location.href = '/home' }}>
            <AppIcon name="home" />
            <span>홈</span>
          </button>
          <button className="my-page__nav-button" type="button" onClick={() => { window.location.href = '/chat' }}>
            <AppIcon name="chat" />
            <span>대화</span>
          </button>
          <button className="my-page__nav-button" type="button" onClick={() => { window.location.href = '/storybook' }}>
            <AppIcon name="book" />
            <span>스토리북</span>
          </button>
          <button className="my-page__nav-button is-active" type="button" aria-current="page">
            <AppIcon name="my" />
            <span>마이</span>
          </button>
        </nav>
      </section>
    </main>
  )
}

export default MyPage
