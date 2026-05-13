import './OnboardingPage.css'

type OnboardingAction = {
  title: string
  description: string
  href: string
  status: string
}

const onboardingActions: OnboardingAction[] = [
  {
    title: '기억 대상 만들기',
    description: '기억을 남길 대상의 이름과 관계 정보를 직접 입력합니다.',
    href: '/targets/new',
    status: '먼저 필요',
  },
  {
    title: '관계 입증 요청하기',
    description: 'Target 생성 후 필요한 관계 입증 자료를 사용자가 직접 제출합니다.',
    href: '/verification',
    status: '직접 진행',
  },
  {
    title: '동의 관리하기',
    description: 'Persona, 사진, 음성, 공유 관련 동의 상태를 확인하고 관리합니다.',
    href: '/consents',
    status: '준비 중인 기능',
  },
  {
    title: '사진/음성 업로드하기',
    description: 'Target을 선택한 뒤 사진 또는 음성 파일을 명시적으로 업로드합니다.',
    href: '/target-media',
    status: '직접 업로드',
  },
]

function OnboardingPage() {
  return (
    <main className="setup-page">
      <section className="setup-page__container setup-page__container--guide" aria-label="Remory 온보딩 안내">
        <div className="setup-page__guide-hero">
          <span className="setup-page__guide-eyebrow">온보딩</span>
          <h1>처음 설정은 사용자가 직접 시작합니다</h1>
          <p>
            회원가입 직후 서비스가 기억 대상, 동의, 관계 입증, 페르소나, 스토리북을 자동 생성하지
            않습니다. 아래 작업 중 필요한 항목을 선택해 진행하세요.
          </p>
        </div>

        <section className="setup-page__guide-grid" aria-label="온보딩 작업">
          {onboardingActions.map((action) => (
            <article className="setup-page__guide-card" key={action.title}>
              <span>{action.status}</span>
              <h2>{action.title}</h2>
              <p>{action.description}</p>
              <a href={action.href}>이동하기</a>
            </article>
          ))}
        </section>

        <section className="setup-page__guide-note" aria-label="자동 생성 방지 정책">
          <h2>자동 생성 제거 정책</h2>
          <ul>
            <li>회원가입 성공 후 필요한 로그인 정보만 저장합니다.</li>
            <li>기억 대상, 페르소나, 스토리북 생성은 사용자가 해당 화면에서 버튼을 눌렀을 때만 요청합니다.</li>
            <li>예시 데이터를 실제 데이터처럼 저장하지 않습니다.</li>
            <li>백엔드에 없는 기본 캠페인, 기본 프로필, 기본 스토리는 생성하지 않습니다.</li>
          </ul>
        </section>

        <div className="setup-page__guide-actions">
          <a href="/targets/new">기억 대상 만들기</a>
          <a href="/home">나중에 하기</a>
        </div>
      </section>
    </main>
  )
}

export default OnboardingPage
