import { useCallback, useEffect, useRef, useState } from 'react'
import {
  blobToBase64,
  createVoiceSocket,
  sendVoiceAudioChunk,
  sendVoiceEndUtterance,
  sendVoiceStart,
  sendVoiceStop,
} from '../services/voiceSocketService'
import type { VoiceCallMessage, VoiceCallStatus, VoiceServerMessage } from '../types/voice'

type ConnectOptions = {
  personaId: number
  chatId: number
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createTextMessage(sender: VoiceCallMessage['sender'], text: string): VoiceCallMessage {
  return {
    id: createMessageId(),
    sender,
    message_type: 'TEXT',
    text,
    created_at: new Date().toISOString(),
  }
}

function createAudioMessage(message: Pick<VoiceCallMessage, 'audio_file_path' | 'audio_url'>): VoiceCallMessage {
  return {
    id: createMessageId(),
    sender: 'PERSONA',
    message_type: 'AUDIO',
    audio_file_path: message.audio_file_path,
    audio_url: message.audio_url,
    created_at: new Date().toISOString(),
  }
}

function getRecorderMimeType() {
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')) {
    return 'audio/webm'
  }

  return null
}

export function useVoiceCall() {
  const socketRef = useRef<WebSocket | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const statusRef = useRef<VoiceCallStatus>('disconnected')
  const endedByUserRef = useRef(false)

  const [status, setStatusState] = useState<VoiceCallStatus>('disconnected')
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [partialTranscript, setPartialTranscript] = useState('')
  const [messages, setMessages] = useState<VoiceCallMessage[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isMicPermissionDenied, setIsMicPermissionDenied] = useState(false)

  const setStatus = useCallback((nextStatus: VoiceCallStatus) => {
    statusRef.current = nextStatus
    setStatusState(nextStatus)
  }, [])

  const stopRecorder = useCallback(() => {
    const recorder = recorderRef.current

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }

    recorderRef.current = null
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const cleanupMedia = useCallback(() => {
    stopRecorder()
    stopStream()
  }, [stopRecorder, stopStream])

  const closeSocket = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
      socketRef.current.close()
    }

    socketRef.current = null
  }, [])

  const handleServerMessage = useCallback(
    (message: VoiceServerMessage) => {
      switch (message.type) {
        case 'session_started':
          setSessionId(message.session_id)
          setStatus('connected')
          break
        case 'partial_transcript':
          setPartialTranscript(message.text)
          break
        case 'final_transcript':
          setPartialTranscript('')
          setMessages((current) => [...current, createTextMessage('USER', message.text)])
          setStatus('processing')
          break
        case 'persona_text':
          setMessages((current) => [...current, createTextMessage('PERSONA', message.text)])
          setStatus('connected')
          break
        case 'persona_audio':
          setMessages((current) => [
            ...current,
            createAudioMessage({
              audio_file_path: message.audio_file_path ?? undefined,
              audio_url: message.audio_url ?? undefined,
            }),
          ])
          setStatus('connected')
          break
        case 'error':
          setErrorMessage(message.message)
          setMessages((current) => [...current, createTextMessage('SYSTEM', message.message)])
          if (statusRef.current === 'processing') {
            setStatus('connected')
          }
          break
        case 'session_ended':
          cleanupMedia()
          setStatus('ended')
          break
        default:
          break
      }
    },
    [cleanupMedia, setStatus],
  )

  const connect = useCallback(
    ({ personaId, chatId }: ConnectOptions) => {
      if (!Number.isInteger(personaId) || personaId <= 0) {
        setErrorMessage('페르소나를 먼저 선택해 주세요.')
        return
      }

      if (!Number.isInteger(chatId) || chatId <= 0) {
        setErrorMessage('대화를 먼저 선택해 주세요.')
        return
      }

      cleanupMedia()
      closeSocket()
      endedByUserRef.current = false
      setMessages([])
      setPartialTranscript('')
      setSessionId(null)
      setErrorMessage(null)
      setIsMicPermissionDenied(false)
      setStatus('connecting')

      try {
        const socket = createVoiceSocket(personaId)
        socketRef.current = socket

        socket.addEventListener('open', () => {
          try {
            sendVoiceStart(socket, chatId)
            setStatus('connected')
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '음성 대화를 시작하지 못했어요.')
            setStatus('disconnected')
          }
        })

        socket.addEventListener('message', (event) => {
          try {
            handleServerMessage(JSON.parse(event.data) as VoiceServerMessage)
          } catch {
            setErrorMessage('응답을 처리하지 못했어요. 다시 시도해 주세요.')
          }
        })

        socket.addEventListener('error', () => {
          setErrorMessage('음성 대화 연결에 실패했어요.')
          setStatus('disconnected')
        })

        socket.addEventListener('close', () => {
          socketRef.current = null
          cleanupMedia()

          if (endedByUserRef.current || statusRef.current === 'ended') {
            setStatus('ended')
          } else if (statusRef.current !== 'disconnected') {
            setStatus('disconnected')
          }
        })
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '음성 대화 연결에 실패했어요.')
        setStatus('disconnected')
      }
    },
    [cleanupMedia, closeSocket, handleServerMessage, setStatus],
  )

  const startRecording = useCallback(async () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setErrorMessage('음성 대화 연결이 아직 준비되지 않았어요.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('이 브라우저에서는 마이크 녹음을 사용할 수 없어요.')
      return
    }

    setErrorMessage(null)
    setIsMicPermissionDenied(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getRecorderMimeType()

      if (!mimeType) {
        stream.getTracks().forEach((track) => track.stop())
        setErrorMessage('이 브라우저에서는 음성 녹음을 지원하지 않아요.')
        setStatus('connected')
        return
      }

      const recorder = new MediaRecorder(stream, { mimeType })

      streamRef.current = stream
      recorderRef.current = recorder

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size === 0) {
          return
        }

        void blobToBase64(event.data)
          .then((data) => {
            sendVoiceAudioChunk(socketRef.current, data)
          })
          .catch((error: unknown) => {
            setErrorMessage(error instanceof Error ? error.message : '음성 전송 중 문제가 발생했어요.')
          })
      })

      recorder.addEventListener('stop', () => {
        stopStream()
      })

      recorder.start(1000)
      setStatus('recording')
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
        setIsMicPermissionDenied(true)
        setErrorMessage('마이크 권한이 필요해요.')
      } else {
        setErrorMessage(error instanceof Error ? error.message : '녹음을 시작하지 못했어요.')
      }

      cleanupMedia()
      setStatus(socketRef.current?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected')
    }
  }, [cleanupMedia, setStatus, stopStream])

  const endUtterance = useCallback(() => {
    try {
      cleanupMedia()
      sendVoiceEndUtterance(socketRef.current)
      setStatus('processing')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '발화를 마치지 못했어요.')
    }
  }, [cleanupMedia, setStatus])

  const stopCall = useCallback(() => {
    endedByUserRef.current = true

    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        sendVoiceStop(socketRef.current)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '음성 대화를 종료하지 못했어요.')
    } finally {
      cleanupMedia()
      closeSocket()
      setStatus('ended')
    }
  }, [cleanupMedia, closeSocket, setStatus])

  useEffect(() => {
    return () => {
      cleanupMedia()
      closeSocket()
    }
  }, [cleanupMedia, closeSocket])

  return {
    status,
    sessionId,
    partialTranscript,
    messages,
    errorMessage,
    isMicPermissionDenied,
    connect,
    startRecording,
    endUtterance,
    stopCall,
  }
}
