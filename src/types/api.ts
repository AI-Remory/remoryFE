export type ApiId = string | number

export type PaginatedResponse<T> = {
  total: number
  skip: number
  limit: number
  items: T[]
}

export type User = {
  id: ApiId
  email: string
  nickname: string
  role?: 'USER' | 'ADMIN' | string
  profile_image_url?: string | null
  profile_image_path?: string | null
  created_at?: string
  updated_at?: string
}

export type AuthResponse = {
  access_token: string
  refresh_token: string
  token_type?: string
  user: User
}

export type TokenResponse = {
  access_token: string
  refresh_token: string
  token_type?: string
}

export type MessageResponse = {
  message: string
}

export type PersonaStatus = 'PENDING' | 'READY' | 'FAILED' | string

export type VoiceProfile = {
  id?: ApiId
  persona_id?: ApiId
  status?: PersonaStatus | string
  review_status?: string | null
  review_note?: string | null
  audio_url?: string | null
  audio_path?: string | null
  file_path?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export type Persona = {
  id: ApiId
  target_id?: ApiId
  status?: PersonaStatus
  persona_name?: string
  speaking_style?: string
  personality_summary?: string
  memory_summary?: string
  system_prompt?: string
  is_voice_profile_created?: boolean
  is_consent_required?: boolean
  voice_profile?: VoiceProfile | null
  name?: string
  nickname?: string
  description?: string | null
  image_url?: string | null
  image_path?: string | null
  profile_image_url?: string | null
  profile_image_path?: string | null
  created_at?: string
  updated_at?: string
}

export type PersonaStatusResponse = {
  id?: ApiId
  persona_id?: ApiId
  target_id?: ApiId
  status: PersonaStatus
  message?: string | null
  detail?: string | null
  is_ready?: boolean
  is_voice_profile_created?: boolean
  is_consent_required?: boolean
  voice_profile?: VoiceProfile | null
  created_at?: string
  updated_at?: string
}

export type Target = {
  id: ApiId
  user_id?: ApiId
  name?: string
  nickname?: string
  relationship?: string | null
  description?: string | null
  target_type?: string
  profile_image_path?: string | null
  image_url?: string | null
  persona_id?: ApiId | null
  persona?: Persona | null
  is_deleted?: boolean
  media_count?: number
  has_persona?: boolean
  created_at?: string
  updated_at?: string
}

export type PaginatedTargets = {
  items: Target[]
  total?: number
  skip?: number
  limit?: number
}

export type Chat = {
  id: ApiId
  user_id?: ApiId
  persona_id?: ApiId
  title: string
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export type ChatMessage = {
  id: ApiId
  chat_id?: ApiId
  sender_type?: 'USER' | 'PERSONA' | 'SYSTEM' | string
  sender?: 'USER' | 'PERSONA' | 'AI' | 'SYSTEM' | string
  role?: 'user' | 'assistant' | 'system' | string
  message_type?: 'TEXT' | 'AUDIO' | string
  content?: string | null
  audio_api_url?: string | null
  audio_file_path?: string | null
  is_ai_generated?: boolean
  created_at?: string
  deleted_at?: string | null
}

export type SendMessageResponse = {
  user_message: ChatMessage
  persona_message: ChatMessage
}

export type StoryBook = {
  id: ApiId
  user_id?: ApiId
  photo_memory_id?: ApiId | null
  interview_session_id?: ApiId | null
  title: string
  summary?: string | null
  source_type?: 'INTERVIEW' | 'PHOTO_MEMORY' | 'SELF_STORY' | string
  status?: 'DRAFT' | 'GENERATED' | 'FAILED' | string
  visibility?: 'PRIVATE' | 'LINK' | 'GROUP' | 'PUBLIC' | string
  subtitle?: string | null
  cover_image_url?: string | null
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export type StoryChapter = {
  id: ApiId
  storybook_id?: ApiId
  title: string
  label?: string | null
  content?: string | null
  summary?: string | null
  duration?: string | number | null
  order?: number | null
  order_index?: number | null
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export type StoryBookDetail = StoryBook & {
  chapters?: StoryChapter[]
}

export type ShareLink = {
  id: ApiId
  storybook_id: ApiId
  owner_id?: ApiId
  token: string
  is_active: boolean
  expires_at?: string | null
  disabled_at?: string | null
  share_url?: string | null
  created_at?: string
  updated_at?: string
}

export type ShareLinkDisableResponse = {
  id: ApiId
  is_active: boolean
  disabled_at?: string | null
}

export type PublicStoryChapter = {
  title: string
  content: string
  summary?: string | null
  order_index: number
}

export type PublicSharedStoryBook = {
  title: string
  summary?: string | null
  visibility?: string
  chapters: PublicStoryChapter[]
}

export type InterviewType = 'TARGET_PROFILE' | 'PHOTO_MEMORY' | 'SELF_STORY' | string

export type InterviewStatus = string

export type AIInterviewAnswer = {
  id: ApiId
  session_id?: ApiId
  question_id?: ApiId
  answer_text?: string | null
  answer_audio_path?: string | null
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export type AIInterviewQuestion = {
  id: ApiId
  session_id?: ApiId
  question_text?: string | null
  question_type?: string | null
  order_index?: number | null
  created_at?: string
  answers?: AIInterviewAnswer[]
}

export type AIInterviewSession = {
  id: ApiId
  user_id?: ApiId
  target_id?: ApiId | null
  photo_memory_id?: ApiId | null
  session_type?: InterviewType
  title?: string | null
  status?: InterviewStatus
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export type AIInterviewSessionDetail = AIInterviewSession & {
  questions?: AIInterviewQuestion[]
}

export type PhotoMemory = {
  id: ApiId
  user_id?: ApiId
  target_id?: ApiId | null
  title?: string | null
  caption?: string | null
  description?: string | null
  summary?: string | null
  location?: string | null
  image_api_url?: string | null
  image_url?: string | null
  image_path?: string | null
  photo_url?: string | null
  photo_path?: string | null
  thumbnail_url?: string | null
  thumbnail_path?: string | null
  file_path?: string | null
  taken_at?: string | null
  memory_date?: string | null
  created_at?: string
  updated_at?: string
}

export type TargetMediaUploadResponse = {
  file_id: ApiId
  target_id: ApiId
  uploaded_by: ApiId
  original_filename: string
  stored_filename: string
  file_path: string
  media_type: 'image' | 'voice' | string
  file_size: number
  mime_type: string
  message: string
}

export type TargetMedia = {
  id: ApiId
  target_id?: ApiId
  media_type?: 'image' | 'voice' | string
  file_api_url?: string | null
  file_path?: string | null
  url?: string | null
  original_filename?: string | null
  stored_filename?: string | null
  file_size?: number | null
  mime_type?: string | null
  created_at?: string
  updated_at?: string
}

export type ConsentType =
  | 'target_profile_consent'
  | 'photo_upload_consent'
  | 'voice_upload_consent'
  | 'voice_cloning_consent'
  | 'ai_persona_creation_consent'
  | 'ai_response_notice_consent'
  | 'storybook_share_consent'
  | 'group_share_consent'
  | 'data_retention_consent'
  | 'third_party_ai_processing_consent'

export type Consent = {
  id: ApiId
  target_id?: ApiId
  consent_type: ConsentType | string
  consent_version?: string
  consent_text_snapshot?: string | null
  is_agreed?: boolean
  is_consented?: boolean
  is_revoked?: boolean
  revoked_at?: string | null
  details?: string | null
  created_at?: string
  updated_at?: string
}

export type VerificationType =
  | 'FAMILY_RELATION_CERTIFICATE'
  | 'ID_CARD'
  | 'SELF_DECLARATION'
  | 'OTHER'

export type VerificationStatus =
  | 'PENDING'
  | 'NEED_MORE_INFO'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVOKED'
  | string

export type VerificationRequest = {
  id: ApiId
  target_id?: ApiId
  verification_type?: VerificationType | string
  verification_type_param?: VerificationType | string
  applicant_note?: string | null
  status?: VerificationStatus
  reject_reason?: string | null
  reason?: string | null
  reviewer_note?: string | null
  file_path?: string | null
  created_at?: string
  updated_at?: string
}

export type MemoryGroup = {
  id: ApiId
  owner_id?: ApiId
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export type MemoryGroupDetail = MemoryGroup & {
  members?: GroupMember[]
  storybooks?: GroupStoryBookListItem[]
}

export type GroupMember = {
  id: ApiId
  group_id?: ApiId
  user_id?: ApiId
  role?: 'OWNER' | 'MEMBER' | 'VIEWER' | string
  created_at?: string
  updated_at?: string
}

export type GroupStoryBookListItem = {
  id: ApiId
  group_id?: ApiId
  storybook_id?: ApiId
  storybook?: StoryBook | null
  title?: string | null
  created_at?: string
  updated_at?: string
}

export type DeletionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'CANCELLED'
  | string

export type DeletionRequest = {
  id: ApiId
  user_id?: ApiId
  target_type: string
  target_id?: ApiId | null
  reason?: string | null
  status?: DeletionStatus
  created_at?: string
  updated_at?: string
}

export type ReportStatus =
  | 'PENDING'
  | 'REVIEWING'
  | 'RESOLVED'
  | 'REJECTED'
  | 'ACTION_TAKEN'
  | string

export type Report = {
  id: ApiId
  reporter_id?: ApiId
  target_type: string
  target_id: ApiId
  reason_type: string
  reason_detail?: string | null
  status?: ReportStatus
  created_at?: string
  updated_at?: string
}
