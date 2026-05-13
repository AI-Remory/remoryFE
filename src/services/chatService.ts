import { apiClient } from './apiClient'
import type {
  ChatId,
  PersonaChatCreateRequest,
  PersonaChatResponse,
  PersonaMessageCreateRequest,
  PersonaMessagePairResponse,
  PersonaMessageResponse,
} from '../types/chat'

export const chatService = {
  createPersonaChat(personaId: number, payload: PersonaChatCreateRequest) {
    return apiClient.post<PersonaChatResponse>(`/personas/${personaId}/chats`, payload)
  },

  listPersonaChats(personaId: number) {
    return apiClient.get<PersonaChatResponse[]>(`/personas/${personaId}/chats`)
  },

  listChatMessages(chatId: ChatId) {
    return apiClient.get<PersonaMessageResponse[]>(`/chats/${chatId}/messages`)
  },

  createChatMessage(chatId: ChatId, payload: PersonaMessageCreateRequest) {
    return apiClient.post<PersonaMessagePairResponse>(`/chats/${chatId}/messages`, payload)
  },

  createChatAudioMessage(chatId: ChatId, file: File, generateAudio = false) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('generate_audio', String(generateAudio))

    return apiClient.post<PersonaMessagePairResponse>(`/chats/${chatId}/audio`, formData)
  },
}
