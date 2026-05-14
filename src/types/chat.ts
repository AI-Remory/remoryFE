export type ChatId = number
export type MessageType = 'TEXT' | 'AUDIO'
export type SenderType = 'USER' | 'PERSONA' | 'SYSTEM'

export type PersonaChatCreateRequest = {
  title?: string | null
}

export type PersonaChatResponse = {
  created_at: string
  updated_at: string
  id: ChatId
  user_id: number
  persona_id: number
  title: string | null
  deleted_at: string | null
}

export type PersonaMessageCreateRequest = {
  message_type?: MessageType
  content?: string | null
  audio_file_path?: string | null
  generate_audio?: boolean
}

export type PersonaMessageResponse = {
  id: number
  chat_id: ChatId
  sender_type: SenderType
  message_type: MessageType
  content: string | null
  audio_api_url: string | null
  audio_file_path: string | null
  is_ai_generated: boolean
  created_at: string
  deleted_at: string | null
}

export type PersonaMessagePairResponse = {
  user_message: PersonaMessageResponse
  persona_message: PersonaMessageResponse
}
