import { apiClient } from '../lib/apiClient'
import type { ApiId, Chat, ChatMessage, SendMessageResponse } from '../types/api'

export const chatApi = {
  createChat(personaId: ApiId, title: string) {
    return apiClient.post<Chat>(`/personas/${personaId}/chats`, { title })
  },

  listChats(personaId: ApiId) {
    return apiClient.get<Chat[]>(`/personas/${personaId}/chats`)
  },

  listMessages(chatId: ApiId) {
    return apiClient.get<ChatMessage[]>(`/chats/${chatId}/messages`)
  },

  sendMessage(chatId: ApiId, content: string) {
    return apiClient.post<SendMessageResponse>(`/chats/${chatId}/messages`, {
      message_type: 'TEXT',
      content,
      audio_file_path: null,
    })
  },
}
