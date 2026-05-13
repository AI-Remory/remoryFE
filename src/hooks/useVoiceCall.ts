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
        setErrorMessage('persona_id must be a positive integer.')
        return
      }

      if (!Number.isInteger(chatId) || chatId <= 0) {
        setErrorMessage('chat_id must be a positive integer.')
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
            setErrorMessage(error instanceof Error ? error.message : 'Failed to start voice session.')
            setStatus('disconnected')
          }
        })

        socket.addEventListener('message', (event) => {
          try {
            handleServerMessage(JSON.parse(event.data) as VoiceServerMessage)
          } catch {
            setErrorMessage('Failed to parse voice server message.')
          }
        })

        socket.addEventListener('error', () => {
          setErrorMessage('Voice WebSocket connection failed.')
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
        setErrorMessage(error instanceof Error ? error.message : 'Voice WebSocket connection failed.')
        setStatus('disconnected')
      }
    },
    [cleanupMedia, closeSocket, handleServerMessage, setStatus],
  )

  const startRecording = useCallback(async () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setErrorMessage('Voice WebSocket is not connected.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('This browser does not support microphone recording.')
      return
    }

    setErrorMessage(null)
    setIsMicPermissionDenied(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getRecorderMimeType()

      if (!mimeType) {
        stream.getTracks().forEach((track) => track.stop())
        setErrorMessage('This browser does not support audio/webm recording.')
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
            setErrorMessage(error instanceof Error ? error.message : 'Failed to send audio chunk.')
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
        setErrorMessage('Microphone permission was denied.')
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to start microphone recording.')
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
      setErrorMessage(error instanceof Error ? error.message : 'Failed to end utterance.')
    }
  }, [cleanupMedia, setStatus])

  const stopCall = useCallback(() => {
    endedByUserRef.current = true

    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        sendVoiceStop(socketRef.current)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to stop voice session.')
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
