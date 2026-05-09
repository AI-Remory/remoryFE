export type ApiId = string | number

export type User = {
  id: ApiId
  email: string
  nickname: string
  created_at?: string
  updated_at?: string
}

export type AuthResponse = {
  access_token: string
  refresh_token: string
  user: User
}

export type Persona = {
  id: ApiId
  target_id?: ApiId
  name?: string
  nickname?: string
  description?: string | null
  image_url?: string | null
  created_at?: string
  updated_at?: string
}

export type Target = {
  id: ApiId
  name?: string
  nickname?: string
  relationship?: string | null
  description?: string | null
  image_url?: string | null
  persona_id?: ApiId | null
  persona?: Persona | null
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
  persona_id?: ApiId
  title: string
  created_at?: string
  updated_at?: string
}

export type ChatMessage = {
  id: ApiId
  chat_id?: ApiId
  sender?: 'USER' | 'PERSONA' | 'AI' | 'SYSTEM' | string
  role?: 'user' | 'assistant' | 'system' | string
  message_type?: 'TEXT' | 'AUDIO' | string
  content: string
  audio_file_path?: string | null
  created_at?: string
}

export type SendMessageResponse = {
  user_message: ChatMessage
  persona_message: ChatMessage
}

export type StoryBook = {
  id: ApiId
  title: string
  subtitle?: string | null
  cover_image_url?: string | null
  created_at?: string
  updated_at?: string
}

export type StoryChapter = {
  id: ApiId
  storybook_id?: ApiId
  title: string
  label?: string | null
  content?: string | null
  duration?: string | number | null
  order?: number | null
  created_at?: string
}

export type StoryBookDetail = StoryBook & {
  chapters?: StoryChapter[]
}
