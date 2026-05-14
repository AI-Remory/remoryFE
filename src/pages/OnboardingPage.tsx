import './OnboardingPage.css'

type OnboardingAction = {
  title: string
  description: string
  href: string
  status: string
}

const onboardingActions: OnboardingAction[] = [
  {
    title: '대상 추가하기',
    description: '기억을 남길 사람의 이름과 관계를 먼저 등록해 주세요.',
    href: '/targets/new',
    status: '먼저 해요',
  },
  {
    title: '관계 입증 요청하기',
    description: '안전한 이용을 위해 필요한 자료를 직접 제출할 수 있어요.',
    href: '/compliance/verification',
    status: '지금 가능',
  },
  {
    title: '동의 관리하기',
    description: '사진, 음성, 페르소나, 공유에 필요한 동의 상태를 확인해요.',
    href: '/compliance/consent',
    status: '지금 가능',
  },
  {
    title: '사진·음성 올리기',
    description: '사진이나 음성을 올리면 더 자연스러운 페르소나를 만들 수 있어요.',
    href: '/targets/media',
    status: '지금 가능',
  },
]

function OnboardingPage() {
  return (
    <main className="setup-page">
      <section className="setup-page__container setup-page__container--guide" aria-label="Remory 시작 안내">
        <div className="setup-page__guide-hero">
          <span className="setup-page__guide-eyebrow">시작하기</span>
          <h1>필요한 것만 천천히 준비해 주세요.</h1>
          <p>Remory는 가입 직후 정보를 자동으로 만들지 않아요. 기억을 남길 사람과 자료를 사용자가 직접 선택해 추가합니다.</p>
        </div>

        <section className="setup-page__guide-grid" aria-label="시작 작업">
          {onboardingActions.map((action) => (
            <article className="setup-page__guide-card" key={action.title}>
              <span>{action.status}</span>
              <h2>{action.title}</h2>
              <p>{action.description}</p>
              <a href={action.href}>이동하기</a>
            </article>
          ))}
        </section>

        <section className="setup-page__guide-note" aria-label="자동 생성 안내">
          <h2>자동으로 만들지 않아요</h2>
          <ul>
            <li>가입 후에는 필요한 로그인 정보만 저장합니다.</li>
            <li>대상, 페르소나, 스토리북은 사용자가 버튼을 눌렀을 때만 만들어집니다.</li>
            <li>예시 데이터는 실제 기록처럼 저장하지 않습니다.</li>
            <li>준비되지 않은 기본 캠페인이나 기본 스토리를 임의로 만들지 않습니다.</li>
          </ul>
        </section>

        <div className="setup-page__guide-actions">
          <a href="/targets/new">대상 추가하기</a>
          <a href="/home">나중에 하기</a>
        </div>
      </section>
    </main>
  )
}

export default OnboardingPage
