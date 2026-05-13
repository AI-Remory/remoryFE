import './SetupPage.css'

type SetupAction = {
  title: string
  description: string
  href: string
  status: string
}

const setupActions: SetupAction[] = [
  {
    title: 'Target 만들기',
    description: '기억을 남길 대상의 이름, 설명, 관계 유형을 사용자가 직접 입력합니다.',
    href: '/targets/new',
    status: 'required first',
  },
  {
    title: '관계 입증 요청하기',
    description: 'Target 생성 후 관계 입증 파일을 사용자가 직접 제출합니다.',
    href: '/verification',
    status: 'manual',
  },
  {
    title: '동의 관리하기',
    description: 'Persona, 사진, 음성, 공유 관련 동의를 사용자가 확인하고 관리합니다.',
    href: '/consents',
    status: 'manual',
  },
  {
    title: '사진/음성 업로드하기',
    description: 'Target을 선택한 뒤 사진 또는 음성 파일을 명시적으로 업로드합니다.',
    href: '/target-media',
    status: 'manual upload',
  },
]

function SetupPage() {
  return (
    <main className="setup-page">
      <section className="setup-page__container setup-page__container--guide" aria-label="Remory onboarding guide">
        <div className="setup-page__guide-hero">
          <span className="setup-page__guide-eyebrow">Onboarding</span>
          <h1>처음 설정은 사용자가 직접 시작합니다</h1>
          <p>
            회원가입 직후 프론트가 Target, ConsentLog, VerificationRequest, Persona, StoryBook을 자동 생성하지 않습니다.
            아래 순서대로 필요한 작업을 직접 선택해 진행하세요.
          </p>
        </div>

        <section className="setup-page__guide-grid" aria-label="Onboarding actions">
          {setupActions.map((action) => (
            <article className="setup-page__guide-card" key={action.title}>
              <span>{action.status}</span>
              <h2>{action.title}</h2>
              <p>{action.description}</p>
              <a href={action.href}>이동하기</a>
            </article>
          ))}
        </section>

        <section className="setup-page__guide-note" aria-label="Automatic creation policy">
          <h2>자동 생성 제거 정책</h2>
          <ul>
            <li>회원가입 성공 시 access token과 실제 refresh token만 저장합니다.</li>
            <li>Target, Persona, StoryBook 생성은 사용자가 해당 화면의 버튼을 눌렀을 때만 요청합니다.</li>
            <li>mock 데이터를 실제 데이터처럼 localStorage에 저장하지 않습니다.</li>
            <li>백엔드에 없는 기본 캠페인, 기본 프로필, 기본 스토리는 생성하지 않습니다.</li>
          </ul>
        </section>

        <div className="setup-page__guide-actions">
          <a href="/targets/new">Target 만들기</a>
          <a href="/home">나중에 하기</a>
        </div>
      </section>
    </main>
  )
}

export default SetupPage
