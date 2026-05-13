import { apiClient } from './apiClient'
import type {
  AIInterviewAnswerCreateRequest,
  AIInterviewAnswerResponse,
  AIInterviewQuestionCreateRequest,
  AIInterviewQuestionResponse,
  AIInterviewSessionCreateRequest,
  AIInterviewSessionDetailResponse,
  AIInterviewSessionResponse,
} from '../types/interview'

export const interviewService = {
  createSession(payload: AIInterviewSessionCreateRequest) {
    return apiClient.post<AIInterviewSessionResponse>('/interviews', payload)
  },

  getSession(sessionId: number) {
    return apiClient.get<AIInterviewSessionDetailResponse>(`/interviews/${sessionId}`)
  },

  createQuestion(sessionId: number, payload?: AIInterviewQuestionCreateRequest | null) {
    return apiClient.post<AIInterviewQuestionResponse>(`/interviews/${sessionId}/questions`, payload ?? null)
  },

  createAnswer(sessionId: number, payload: AIInterviewAnswerCreateRequest) {
    return apiClient.post<AIInterviewAnswerResponse>(`/interviews/${sessionId}/answers`, payload)
  },
}

