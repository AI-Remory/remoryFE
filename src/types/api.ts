export type ApiId = string | number

export type User = {
  id: ApiId
  email: string
  nickname: string
  role?: 'USER' | 'ADMIN'
  created_at?: string
  updated_at?: string
}

export type AuthResponse = {
  access_token: string
  refresh_token: string
  token_type?: string
  user: User
}

export type Persona = {
  id: ApiId
  target_id?: ApiId
  status?: 'PENDING' | 'READY' | 'FAILED' | string
  persona_name?: string
  speaking_style?: string
  personality_summary?: string
  memory_summary?: string
  system_prompt?: string
  is_voice_profile_created?: boolean
  is_consent_required?: boolean
  name?: string
  nickname?: string
  description?: string | null
  image_url?: string | null
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

export type TargetMediaUploadResponse = {
  file_id: ApiId
  target_id: ApiId
  uploaded_by: ApiId
  original_filename: string
  stored_filename: string
  file_api_url?: string | null
  file_path: string
  media_type: 'image' | 'voice' | string
  file_size: number
  mime_type: string
  message: string
}
