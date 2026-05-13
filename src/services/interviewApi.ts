import { apiClient } from '../lib/apiClient'
import type {
  AIInterviewAnswer,
  AIInterviewQuestion,
  AIInterviewSession,
  AIInterviewSessionDetail,
  ApiId,
  InterviewType,
} from '../types/api'

type CreateInterviewSessionPayload = {
  session_type: InterviewType
  title?: string | null
  target_id?: ApiId | null
  photo_memory_id?: ApiId | null
}

type CreateInterviewQuestionPayload = {
  question_type?: string | null
}

type CreateInterviewAnswerPayload = {
  question_id: ApiId
  answer_text?: string | null
  answer_audio_path?: string | null
}

export const interviewApi = {
  createInterviewSession(payload: CreateInterviewSessionPayload) {
    return apiClient.post<AIInterviewSession>('/interviews', payload)
  },

  getInterviewSession(sessionId: ApiId) {
    return apiClient.get<AIInterviewSessionDetail>(`/interviews/${sessionId}`)
  },

  createQuestion(sessionId: ApiId, payload: CreateInterviewQuestionPayload = {}) {
    return apiClient.post<AIInterviewQuestion>(`/interviews/${sessionId}/questions`, payload)
  },

  createAnswer(sessionId: ApiId, payload: CreateInterviewAnswerPayload) {
    return apiClient.post<AIInterviewAnswer>(`/interviews/${sessionId}/answers`, payload)
  },
}
