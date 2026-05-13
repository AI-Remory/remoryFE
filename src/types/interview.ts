export type InterviewType = 'TARGET_PROFILE' | 'PHOTO_MEMORY' | 'SELF_STORY'
export type InterviewStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type AIInterviewSessionCreateRequest = {
  session_type: InterviewType
  title?: string | null
  target_id?: number | null
  photo_memory_id?: number | null
}

export type AIInterviewSessionResponse = {
  created_at: string
  updated_at: string
  id: number
  user_id: number
  target_id: number | null
  photo_memory_id: number | null
  session_type: InterviewType
  title: string | null
  status: InterviewStatus
  deleted_at: string | null
}

export type AIInterviewQuestionCreateRequest = {
  question_type?: string | null
}

export type AIInterviewAnswerCreateRequest = {
  question_id: number
  answer_text?: string | null
  answer_audio_path?: string | null
}

export type AIInterviewAnswerResponse = {
  created_at: string
  updated_at: string
  id: number
  session_id: number
  question_id: number
  answer_text: string | null
  answer_audio_path: string | null
  deleted_at: string | null
}

export type AIInterviewQuestionResponse = {
  id: number
  session_id: number
  question_text: string
  question_type: string | null
  order_index: number
  created_at: string
  answers?: AIInterviewAnswerResponse[]
}

export type AIInterviewSessionDetailResponse = AIInterviewSessionResponse & {
  questions?: AIInterviewQuestionResponse[]
}

