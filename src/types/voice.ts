export type VoiceCallStatus = 'disconnected' | 'connecting' | 'connected' | 'recording' | 'processing' | 'ended'

export type VoiceClientMessage =
  | {
      type: 'start'
      chat_id: number
    }
  | {
      type: 'audio_chunk'
      data: string
      mime_type: 'audio/webm'
    }
  | {
      type: 'end_utterance'
    }
  | {
      type: 'stop'
    }

export type VoiceServerMessage =
  | {
      type: 'session_started'
      session_id: number
    }
  | {
      type: 'partial_transcript'
      text: string
    }
  | {
      type: 'final_transcript'
      text: string
    }
  | {
      type: 'persona_text'
      text: string
    }
  | {
      type: 'persona_audio'
      audio_url?: string | null
      audio_file_path?: string | null
    }
  | {
      type: 'error'
      message: string
    }
  | {
      type: 'session_ended'
    }

export type VoiceCallMessage = {
  id: string
  sender: 'USER' | 'PERSONA' | 'SYSTEM'
  message_type: 'TEXT' | 'AUDIO'
  text?: string
  audio_url?: string
  audio_file_path?: string
  created_at: string
}
