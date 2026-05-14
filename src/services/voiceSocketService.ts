import { getAccessToken, WS_BASE_URL } from './apiClient'
import type { VoiceClientMessage } from '../types/voice'

function buildVoiceSocketUrl(personaId: number, token: string) {
  return `${WS_BASE_URL}/ws/personas/${personaId}/voice?token=${encodeURIComponent(token)}`
}

export function createVoiceSocket(personaId: number) {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error('로그인이 필요해요. 다시 로그인한 뒤 시도해 주세요.')
  }

  return new WebSocket(buildVoiceSocketUrl(personaId, accessToken))
}

export function sendVoiceSocketMessage(socket: WebSocket | null, message: VoiceClientMessage) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    throw new Error('음성 대화 연결이 준비되지 않았어요.')
  }

  socket.send(JSON.stringify(message))
}

export function sendVoiceStart(socket: WebSocket | null, chatId?: number) {
  sendVoiceSocketMessage(socket, {
    type: 'start',
    chat_id: chatId,
  })
}

export function sendVoiceAudioChunk(
  socket: WebSocket | null,
  data: string,
  mimeType: 'audio/webm' | 'audio/wav' | 'audio/mpeg' | 'audio/mp4' = 'audio/webm',
) {
  sendVoiceSocketMessage(socket, {
    type: 'audio_chunk',
    data,
    mime_type: mimeType,
  })
}

export function sendVoiceEndUtterance(socket: WebSocket | null) {
  sendVoiceSocketMessage(socket, {
    type: 'end_utterance',
  })
}

export function sendVoiceStop(socket: WebSocket | null) {
  sendVoiceSocketMessage(socket, {
    type: 'stop',
  })
}

export function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('음성 파일을 읽지 못했어요.'))
        return
      }

      const [, base64] = reader.result.split(',')
      resolve(base64 ?? reader.result)
    })

    reader.addEventListener('error', () => {
      reject(new Error('음성 파일을 읽지 못했어요.'))
    })

    reader.readAsDataURL(blob)
  })
}
