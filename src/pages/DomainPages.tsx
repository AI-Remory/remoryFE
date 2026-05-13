import { AppShell } from '../components/layout/AppShell'
import './DomainPages.css'

type BadgeKind = 'connected' | 'next' | 'mock' | 'admin'

type Metric = {
  label: string
  value: string
  tone?: string
}

type TimelineItem = {
  title: string
  description: string
  status: string
}

type DomainPageConfig = {
  title: string
  eyebrow: string
  description: string
  badge: string
  badgeKind: BadgeKind
  primaryAction?: string
  secondaryAction?: string
  metrics: Metric[]
  cards: TimelineItem[]
  detailTitle: string
  detailRows: Array<[string, string]>
}

const priorityBadge = {
  connected: 'API 연결됨',
  next: 'API 연결 예정',
  mock: 'Mock',
  admin: 'ADMIN',
} satisfies Record<BadgeKind, string>

const baseCards = {
  target: [
    { title: '엄마 프로필', description: 'target_type parent, media 12개, persona READY', status: 'READY' },
    { title: '할머니 프로필', description: '검증 요청 PENDING, 사진 8개 업로드', status: 'PENDING' },
    { title: '내 기록', description: 'self 타입 target, 자기 회고용 persona 준비 중', status: 'DRAFT' },
  ],
  persona: [
    { title: '따뜻한 말투', description: 'speaking_style과 memory_summary 기반 응답 구성', status: 'READY' },
    { title: '목소리 프로필', description: 'voice sample 품질 평가 후 사용자 확인 대기', status: 'NEEDS_MORE_SAMPLES' },
    { title: '동의 확인', description: 'AI persona creation consent 필요', status: 'REQUIRED' },
  ],
  story: [
    { title: '제주 여행의 밤', description: 'PHOTO_MEMORY 기반 4개 챕터 생성', status: 'GENERATED' },
    { title: '어릴 적 생일', description: 'SELF_STORY 초안 작성 중', status: 'DRAFT' },
    { title: '공유 링크', description: 'LINK 공개 범위, 만료일 설정 가능', status: 'ACTIVE' },
  ],
  admin: [
    { title: '검증 요청 18건', description: '신분증, 가족관계 증명서, 자기 선언 검토', status: 'REVIEW' },
    { title: '신고 5건', description: '음성 도용, 개인정보 침해, 유해 콘텐츠', status: 'PENDING' },
    { title: '감사 로그', description: 'USER_SIGNUP, PERSONA_CREATED, REPORT_CREATED', status: 'LIVE' },
  ],
}

function makeConfig(partial: Partial<DomainPageConfig> & Pick<DomainPageConfig, 'title' | 'eyebrow'>): DomainPageConfig {
  return {
    description: '백엔드 명세 기준으로 화면 구조를 먼저 준비했습니다. 실제 연결 전까지는 mock data로 사용자 흐름을 확인합니다.',
    badge: priorityBadge.mock,
    badgeKind: 'mock',
    primaryAction: '새 항목',
    secondaryAction: '목록 보기',
    metrics: [
      { label: '상태', value: 'Mock' },
      { label: '우선순위', value: '5순위' },
      { label: '데이터', value: '샘플' },
    ],
    cards: baseCards.target,
    detailTitle: 'API 연결 계획',
    detailRows: [
      ['Endpoint', 'docs/frontend-api-map.md 기준 확인 후 연결'],
      ['Service layer', '페이지 직접 fetch 없이 src/services 사용'],
      ['Response', 'OpenAPI schema 필드명 그대로 사용'],
    ],
    ...partial,
  }
}

const configs = {
  targetList: makeConfig({
    title: 'Target 목록',
    eyebrow: 'TargetListPage',
    description: '내가 소유한 기억 대상 목록을 확인하고 persona 생성 흐름으로 진입합니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    primaryAction: 'Target 만들기',
    secondaryAction: '상세 보기',
    metrics: [
      { label: 'Targets', value: '3' },
      { label: 'Persona ready', value: '1' },
      { label: 'Media', value: '20' },
    ],
    cards: baseCards.target,
    detailTitle: '연결 대상 API',
    detailRows: [
      ['GET', '/targets'],
      ['POST', '/targets'],
      ['GET', '/targets/{target_id}'],
    ],
  }),
  targetCreate: makeConfig({
    title: 'Target 생성',
    eyebrow: 'TargetCreatePage',
    description: '이름, 설명, target_type을 입력해 새 기억 대상을 만드는 화면입니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    cards: [
      { title: 'name', description: '예: 엄마, 할머니, 나', status: 'required' },
      { title: 'description', description: '대상의 성격과 기억 범위를 짧게 기록', status: 'optional' },
      { title: 'target_type', description: 'parent, grandparent, friend, romantic, self, other', status: 'default other' },
    ],
    detailTitle: 'Request body',
    detailRows: [
      ['Schema', 'TargetCreateRequest'],
      ['Fields', 'name*, description, target_type'],
      ['Response', '201 TargetResponse'],
    ],
  }),
  targetDetail: makeConfig({
    title: 'Target 상세',
    eyebrow: 'TargetDetailPage',
    description: '대상 정보, media count, persona 생성 여부, 검증 상태를 한 화면에서 봅니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    cards: baseCards.target,
    detailRows: [
      ['GET', '/targets/{target_id}'],
      ['PUT', '/targets/{target_id}'],
      ['DELETE', '/targets/{target_id}'],
    ],
  }),
  targetMedia: makeConfig({
    title: 'Target Media',
    eyebrow: 'TargetMediaPage',
    description: '사진과 음성 샘플 업로드, 삭제, 목록 확인을 담당합니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    metrics: [
      { label: 'Images', value: '14' },
      { label: 'Voice', value: '6' },
      { label: 'Total size', value: '84MB' },
    ],
    cards: [
      { title: '봄날 사진', description: 'media_type image, original_filename spring.jpg', status: 'image' },
      { title: '인사 음성', description: 'media_type voice, duration_seconds 18', status: 'voice' },
      { title: '가족 앨범', description: 'profile_image_path 후보 이미지', status: 'image' },
    ],
    detailRows: [
      ['POST', '/targets/{target_id}/media multipart'],
      ['GET', '/targets/{target_id}/media'],
      ['DELETE', '/media/{media_id}'],
    ],
  }),
  consent: makeConfig({
    title: 'Consent Log',
    eyebrow: 'ConsentPage',
    description: '동의 생성, 대상별 동의 목록, 동의 철회 흐름을 표시합니다.',
    cards: [
      { title: 'AI persona creation', description: 'ai_persona_creation_consent v1.0', status: 'AGREED' },
      { title: 'Voice cloning', description: 'voice_cloning_consent, revoked_at 없음', status: 'AGREED' },
      { title: 'Group share', description: 'group_share_consent 검토 필요', status: 'PENDING' },
    ],
    detailRows: [
      ['POST', '/consents'],
      ['GET', '/consents'],
      ['PATCH', '/consents/{consent_id}/revoke'],
    ],
  }),
  verification: makeConfig({
    title: 'Target Verification',
    eyebrow: 'TargetVerificationPage',
    description: '검증 문서 제출과 검토 상태를 사용자에게 보여줍니다.',
    cards: [
      { title: '가족관계 증명서', description: 'FAMILY_RELATION_CERTIFICATE 업로드 완료', status: 'PENDING' },
      { title: '자기 선언', description: 'SELF_DECLARATION applicant_note 확인', status: 'NEED_MORE_INFO' },
      { title: '신분증', description: 'ID_CARD 검토 완료', status: 'APPROVED' },
    ],
    detailRows: [
      ['POST', '/targets/{target_id}/verification-requests multipart'],
      ['GET', '/targets/{target_id}/verification-requests'],
      ['GET', '/verification-requests/{request_id}'],
    ],
  }),
  personaList: makeConfig({
    title: 'Persona 목록',
    eyebrow: 'PersonaListPage',
    description: 'Target에서 생성된 persona의 준비 상태와 대화 진입점을 보여줍니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    cards: baseCards.persona,
    detailRows: [
      ['POST', '/targets/{target_id}/persona'],
      ['GET', '/personas/{persona_id}'],
      ['GET', '/personas/{persona_id}/status'],
    ],
  }),
  personaDetail: makeConfig({
    title: 'Persona 상세',
    eyebrow: 'PersonaDetailPage',
    description: '말투, 성격 요약, 기억 요약, system_prompt 상태를 점검합니다.',
    badge: 'API 연결 예정 · 2순위',
    badgeKind: 'next',
    cards: baseCards.persona,
    detailRows: [
      ['Schema', 'PersonaDetailResponse'],
      ['Status', 'PENDING, READY, FAILED'],
      ['Voice', 'voice_profile 포함 가능'],
    ],
  }),
  voiceProfile: makeConfig({
    title: 'Voice Profile',
    eyebrow: 'PersonaVoiceProfilePage',
    description: '음성 프로필 생성, 평가, 사용자 확인 상태를 관리합니다.',
    cards: [
      { title: 'Reference samples', description: 'reference_audio_count 6, total 74초', status: 'READY' },
      { title: 'Quality score', description: 'quality_score 0.82, noise_score 0.11', status: 'PASS' },
      { title: 'Review', description: 'review_status USER_CONFIRMED 대기', status: 'WAITING' },
    ],
    detailRows: [
      ['POST', '/personas/{persona_id}/voice-profile'],
      ['POST', '/personas/{persona_id}/voice-profile/evaluate'],
      ['PATCH', '/personas/{persona_id}/voice-profile/user-confirm'],
    ],
  }),
  personaChat: makeConfig({
    title: 'Persona Chat',
    eyebrow: 'PersonaChatPage',
    description: '채팅방 목록과 메시지 대화 흐름을 담당합니다.',
    badge: 'API 연결 예정 · 3순위',
    badgeKind: 'next',
    cards: [
      { title: '오늘의 안부', description: 'PersonaChatResponse title 오늘의 안부', status: 'OPEN' },
      { title: '사용자 메시지', description: 'message_type TEXT, sender_type USER', status: 'SENT' },
      { title: 'Persona 응답', description: 'PersonaMessagePairResponse persona_message', status: 'AI' },
    ],
    detailRows: [
      ['POST', '/personas/{persona_id}/chats'],
      ['GET', '/personas/{persona_id}/chats'],
      ['POST', '/chats/{chat_id}/messages'],
    ],
  }),
  voiceCall: makeConfig({
    title: 'Persona Voice Call',
    eyebrow: 'PersonaVoiceCallPage',
    description: 'WebSocket 음성 통화 세션, transcript, persona audio를 다룹니다.',
    badge: 'WebSocket 연결 예정 · 4순위',
    badgeKind: 'next',
    cards: [
      { title: 'session_started', description: 'voice call session id 수신', status: 'WS' },
      { title: 'final_transcript', description: '사용자 발화 STT 결과 표시', status: 'STT' },
      { title: 'persona_audio', description: 'audio_url 재생과 persona_text 표시', status: 'TTS' },
    ],
    detailRows: [
      ['WS', '/ws/personas/{persona_id}/voice?token=<access_token>'],
      ['Client', 'start, audio_chunk, end_utterance, stop'],
      ['Server', 'session_started, final_transcript, persona_text, persona_audio, session_ended, error'],
    ],
  }),
  interviewList: makeConfig({
    title: 'AI Interview',
    eyebrow: 'InterviewListPage',
    cards: [
      { title: '엄마의 어린 시절', description: 'TARGET_PROFILE interview in progress', status: 'IN_PROGRESS' },
      { title: '사진 속 기억', description: 'PHOTO_MEMORY 질문 6개 완료', status: 'COMPLETED' },
      { title: '나의 이야기', description: 'SELF_STORY draft session', status: 'DRAFT' },
    ],
    detailRows: [
      ['POST', '/interviews'],
      ['GET', '/interviews/{session_id}'],
      ['POST', '/interviews/{session_id}/questions'],
    ],
  }),
  interviewSession: makeConfig({
    title: 'Interview Session',
    eyebrow: 'InterviewSessionPage',
    description: '질문 생성과 답변 저장 흐름을 한 세션 안에서 구성합니다.',
    cards: [
      { title: '질문 1', description: '가장 선명한 어린 시절 기억은 무엇인가요?', status: 'ANSWERED' },
      { title: '질문 2', description: '그때 곁에 있던 사람은 누구였나요?', status: 'CURRENT' },
      { title: '답변', description: 'answer_text 또는 answer_audio_path 저장', status: 'READY' },
    ],
    detailRows: [
      ['Question', 'AIInterviewQuestionCreateRequest 또는 null'],
      ['Answer', 'question_id*, answer_text, answer_audio_path'],
      ['Response', 'AIInterviewSessionDetailResponse'],
    ],
  }),
  photoList: makeConfig({
    title: 'Photo Memories',
    eyebrow: 'PhotoMemoryListPage',
    cards: [
      { title: '제주 바닷가', description: 'location 제주, emotion_keywords 평온함', status: 'PHOTO' },
      { title: '생일 케이크', description: 'ai_caption 생성 예정', status: 'PHOTO' },
      { title: '졸업식', description: 'storybook source 후보', status: 'PHOTO' },
    ],
    detailRows: [
      ['GET', '/photo-memories'],
      ['GET', '/photo-memories/{photo_memory_id}'],
      ['DELETE', '/photo-memories/{photo_memory_id}'],
    ],
  }),
  photoUpload: makeConfig({
    title: 'Photo Upload',
    eyebrow: 'PhotoMemoryUploadPage',
    description: '사진 파일과 제목, 설명, 촬영일, 장소를 업로드합니다.',
    cards: [
      { title: 'title', description: '사진 기억 제목 required', status: 'required' },
      { title: 'file', description: 'multipart/form-data file required', status: 'required' },
      { title: 'metadata', description: 'description, taken_at, location optional', status: 'optional' },
    ],
    detailRows: [
      ['POST', '/photo-memories multipart'],
      ['Form', 'title*, description, taken_at, location, file*'],
      ['Response', '201 PhotoMemoryResponse'],
    ],
  }),
  storyList: makeConfig({
    title: 'Storybooks',
    eyebrow: 'StorybookListPage',
    cards: baseCards.story,
    detailRows: [
      ['GET', '/storybooks'],
      ['GET', '/storybooks/{storybook_id}'],
      ['POST', '/storybooks/{storybook_id}/regenerate'],
    ],
  }),
  storyDetail: makeConfig({
    title: 'Storybook Detail',
    eyebrow: 'StorybookDetailPage',
    description: '스토리북 요약, 공개 범위, 챕터 목록을 보여줍니다.',
    cards: [
      { title: 'Chapter 1', description: '낡은 사진첩을 꺼내던 오후', status: '1' },
      { title: 'Chapter 2', description: '서로의 이름을 다시 부르던 시간', status: '2' },
      { title: 'Chapter 3', description: '남겨진 목소리와 새로운 대화', status: '3' },
    ],
    detailRows: [
      ['GET', '/storybooks/{storybook_id}'],
      ['GET', '/storybooks/{storybook_id}/chapters'],
      ['Schema', 'StoryBookDetailResponse'],
    ],
  }),
  storyCreate: makeConfig({
    title: 'Storybook Create',
    eyebrow: 'StorybookCreatePage',
    description: '인터뷰 또는 사진 기억을 바탕으로 새 스토리북을 생성합니다.',
    cards: [
      { title: 'title', description: '스토리북 제목 required', status: 'required' },
      { title: 'source', description: 'interview_session_id 또는 photo_memory_id', status: 'optional' },
      { title: 'visibility', description: 'PRIVATE, LINK, GROUP, PUBLIC', status: 'default PRIVATE' },
    ],
    detailRows: [
      ['POST', '/storybooks'],
      ['Request', 'StoryBookCreateRequest'],
      ['Response', '201 StoryBookDetailResponse'],
    ],
  }),
  storyShare: makeConfig({
    title: 'Storybook Share',
    eyebrow: 'StorybookSharePage',
    description: '공유 링크 생성, 목록, 비활성화, 공개 조회 흐름을 담습니다.',
    cards: [
      { title: '가족 공유 링크', description: 'expires_at 2026-06-01', status: 'ACTIVE' },
      { title: '공개 미리보기', description: 'PublicSharedStoryBookResponse', status: 'PUBLIC' },
      { title: '비활성 링크', description: 'disabled_at 기록됨', status: 'DISABLED' },
    ],
    detailRows: [
      ['POST', '/storybooks/{storybook_id}/share-links'],
      ['GET', '/share/{token}'],
      ['PATCH', '/share-links/{share_link_id}/disable'],
    ],
  }),
  groupList: makeConfig({
    title: 'Memory Groups',
    eyebrow: 'MemoryGroupListPage',
    cards: [
      { title: '우리 가족', description: 'OWNER 1명, MEMBER 4명', status: 'OWNER' },
      { title: '추모 모임', description: 'VIEWER 포함 공유 그룹', status: 'MEMBER' },
      { title: '사진 정리팀', description: 'storybook 8권 공유', status: 'GROUP' },
    ],
    detailRows: [
      ['GET', '/groups'],
      ['POST', '/groups'],
      ['GET', '/groups/{group_id}'],
    ],
  }),
  groupDetail: makeConfig({
    title: 'Memory Group Detail',
    eyebrow: 'MemoryGroupDetailPage',
    cards: [
      { title: '멤버', description: 'GroupMemberResponse role OWNER/MEMBER/VIEWER', status: '4' },
      { title: '공유 스토리북', description: 'GroupStoryBookListItemResponse', status: '8' },
      { title: '권한', description: 'owner/member 권한 구조', status: 'ACL' },
    ],
    detailRows: [
      ['POST', '/groups/{group_id}/members'],
      ['GET', '/groups/{group_id}/members'],
      ['GET', '/groups/{group_id}/storybooks'],
    ],
  }),
  deletion: makeConfig({
    title: 'Deletion Requests',
    eyebrow: 'DeletionRequestPage',
    cards: [
      { title: 'Target 삭제 요청', description: 'target_type TARGET, status PENDING', status: 'PENDING' },
      { title: 'Voice profile 삭제', description: 'target_type VOICE_PROFILE', status: 'PROCESSING' },
      { title: '취소된 요청', description: 'status CANCELLED', status: 'CANCELLED' },
    ],
    detailRows: [
      ['POST', '/deletion-requests'],
      ['GET', '/deletion-requests'],
      ['PATCH', '/deletion-requests/{request_id}/cancel'],
    ],
  }),
  report: makeConfig({
    title: 'Reports',
    eyebrow: 'ReportPage',
    cards: [
      { title: '음성 도용 신고', description: 'UNAUTHORIZED_VOICE_USE', status: 'PENDING' },
      { title: '개인정보 침해', description: 'PRIVACY_VIOLATION', status: 'REVIEWING' },
      { title: '조치 완료', description: 'ACTION_TAKEN', status: 'DONE' },
    ],
    detailRows: [
      ['POST', '/reports'],
      ['GET', '/reports'],
      ['GET', '/reports/{report_id}'],
    ],
  }),
  adminDashboard: makeConfig({
    title: 'Admin Dashboard',
    eyebrow: 'AdminDashboardPage',
    badge: 'ADMIN · 구조 준비',
    badgeKind: 'admin',
    cards: baseCards.admin,
    metrics: [
      { label: 'Verification', value: '18' },
      { label: 'Reports', value: '5' },
      { label: 'Rate events', value: '42' },
    ],
    detailRows: [
      ['Role', 'ADMIN only'],
      ['Guard', 'UserResponse role 필드 확인 필요'],
      ['Scope', '/admin/* endpoints'],
    ],
  }),
  adminVerification: makeConfig({
    title: 'Admin Verification Review',
    eyebrow: 'AdminVerificationReviewPage',
    badge: 'ADMIN · Mock',
    badgeKind: 'admin',
    cards: baseCards.admin,
    detailRows: [
      ['GET', '/admin/verification-requests'],
      ['PATCH', '/admin/verification-requests/{request_id}/approve'],
      ['PATCH', '/admin/verification-requests/{request_id}/reject'],
    ],
  }),
  adminReports: makeConfig({
    title: 'Admin Reports',
    eyebrow: 'AdminReportsPage',
    badge: 'ADMIN · Mock',
    badgeKind: 'admin',
    cards: [
      { title: '검토 대기', description: 'PENDING 신고 목록', status: 'PENDING' },
      { title: '조치 완료', description: 'ACTION_TAKEN 상태 변경', status: 'ACTION' },
      { title: '반려', description: 'REJECTED 신고 기록', status: 'REJECTED' },
    ],
    detailRows: [
      ['GET', '/admin/reports'],
      ['PATCH', '/admin/reports/{report_id}/reviewing'],
      ['PATCH', '/admin/reports/{report_id}/action-taken'],
    ],
  }),
  adminAudit: makeConfig({
    title: 'Admin Audit Logs',
    eyebrow: 'AdminAuditLogsPage',
    badge: 'ADMIN · Mock',
    badgeKind: 'admin',
    cards: [
      { title: 'USER_SIGNUP', description: 'actor_user_id 12, target USER', status: 'AUTH' },
      { title: 'PERSONA_CREATED', description: 'target_type PERSONA, target_id 7', status: 'AI' },
      { title: 'RATE_LIMIT_BLOCKED', description: 'endpoint /voice, blocked true', status: 'LIMIT' },
    ],
    detailRows: [
      ['GET', '/admin/audit-logs'],
      ['Query', 'action, actor_user_id, target_type, target_id, start_date, end_date, page, size'],
      ['Response', 'PaginatedResponse<AuditLogResponse>'],
    ],
  }),
}

function DomainShell({ config }: { config: DomainPageConfig }) {
  return (
    <AppShell title={config.title} subtitle={config.description} badge={config.badge}>
      <main className="domain-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">{config.eyebrow}</span>
            <h1>{config.title}</h1>
          </div>
          <span className={`domain-page__badge domain-page__badge--${config.badgeKind}`}>{config.badge}</span>
        </header>

        <section className="domain-page__metrics" aria-label="summary">
          {config.metrics.map((metric) => (
            <article key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <section className="domain-page__main-grid">
          <div className="domain-page__panel">
            <div className="domain-page__panel-heading">
              <h2>Workspace</h2>
              <div>
                {config.primaryAction && <button type="button">{config.primaryAction}</button>}
                {config.secondaryAction && <button type="button">{config.secondaryAction}</button>}
              </div>
            </div>
            <div className="domain-page__cards">
              {config.cards.map((card) => (
                <article className="domain-page__card" key={`${card.title}-${card.status}`}>
                  <span>{card.status}</span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="domain-page__panel domain-page__panel--detail">
            <h2>{config.detailTitle}</h2>
            <dl>
              {config.detailRows.map(([term, value]) => (
                <div key={`${term}-${value}`}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="domain-page__notice">
              실제 API 연결 시 `docs/frontend-api-map.md`와 OpenAPI schema를 다시 확인하고 service layer에만 요청 코드를 추가합니다.
            </p>
          </aside>
        </section>
      </main>
    </AppShell>
  )
}

export function TargetListPage() {
  return <DomainShell config={configs.targetList} />
}

export function TargetCreatePage() {
  return <DomainShell config={configs.targetCreate} />
}

export function TargetDetailPage() {
  return <DomainShell config={configs.targetDetail} />
}

export function TargetMediaPage() {
  return <DomainShell config={configs.targetMedia} />
}

export function ConsentPage() {
  return <DomainShell config={configs.consent} />
}

export function TargetVerificationPage() {
  return <DomainShell config={configs.verification} />
}

export function PersonaListPage() {
  return <DomainShell config={configs.personaList} />
}

export function PersonaDetailPage() {
  return <DomainShell config={configs.personaDetail} />
}

export function PersonaVoiceProfilePage() {
  return <DomainShell config={configs.voiceProfile} />
}

export function PersonaChatPage() {
  return <DomainShell config={configs.personaChat} />
}

export function PersonaVoiceCallPage() {
  return <DomainShell config={configs.voiceCall} />
}

export function InterviewListPage() {
  return <DomainShell config={configs.interviewList} />
}

export function InterviewSessionPage() {
  return <DomainShell config={configs.interviewSession} />
}

export function PhotoMemoryListPage() {
  return <DomainShell config={configs.photoList} />
}

export function PhotoMemoryUploadPage() {
  return <DomainShell config={configs.photoUpload} />
}

export function StorybookListPage() {
  return <DomainShell config={configs.storyList} />
}

export function StorybookDetailPage() {
  return <DomainShell config={configs.storyDetail} />
}

export function StorybookCreatePage() {
  return <DomainShell config={configs.storyCreate} />
}

export function StorybookSharePage() {
  return <DomainShell config={configs.storyShare} />
}

export function MemoryGroupListPage() {
  return <DomainShell config={configs.groupList} />
}

export function MemoryGroupDetailPage() {
  return <DomainShell config={configs.groupDetail} />
}

export function DeletionRequestPage() {
  return <DomainShell config={configs.deletion} />
}

export function ReportPage() {
  return <DomainShell config={configs.report} />
}

export function AdminDashboardPage() {
  return <DomainShell config={configs.adminDashboard} />
}

export function AdminVerificationReviewPage() {
  return <DomainShell config={configs.adminVerification} />
}

export function AdminReportsPage() {
  return <DomainShell config={configs.adminReports} />
}

export function AdminAuditLogsPage() {
  return <DomainShell config={configs.adminAudit} />
}
