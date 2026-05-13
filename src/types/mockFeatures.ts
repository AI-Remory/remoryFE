export type MockDomainKey =
  | 'consentLog'
  | 'targetVerificationRequest'
  | 'personaVoiceProfile'
  | 'aiInterviewSession'
  | 'photoMemory'
  | 'storybook'
  | 'storybookCreate'
  | 'shareLink'
  | 'memoryGroup'
  | 'deletionRequest'
  | 'report'

export type MockStatusTone = 'ready' | 'pending' | 'review' | 'blocked' | 'done' | 'admin'

export type MockApiEndpoint = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  note?: string
}

export type MockMetric = {
  label: string
  value: string
}

export type MockAction = {
  label: string
  disabledReason: string
}

export type MockRecord = {
  id: string
  title: string
  subtitle: string
  status: string
  statusTone: MockStatusTone
  meta: Array<[string, string]>
}

export type MockFeaturePageDefinition = {
  key: MockDomainKey
  title: string
  eyebrow: string
  description: string
  badge: string
  priority: string
  detailTitle: string
  detailDescription: string
  developerNote: string
  metrics: MockMetric[]
  actions: MockAction[]
  records: MockRecord[]
  endpoints: MockApiEndpoint[]
}

export type ConsentLogMock = MockRecord
export type TargetVerificationRequestMock = MockRecord
export type PersonaVoiceProfileMock = MockRecord
export type AIInterviewSessionMock = MockRecord
export type PhotoMemoryMock = MockRecord
export type StoryBookMock = MockRecord
export type StoryChapterMock = MockRecord
export type ShareLinkMock = MockRecord
export type MemoryGroupMock = MockRecord
export type DeletionRequestMock = MockRecord
export type ReportMock = MockRecord
export type AuditLogMock = MockRecord
