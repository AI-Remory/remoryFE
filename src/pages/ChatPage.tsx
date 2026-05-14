import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ApiError } from '../lib/apiClient'
import { normalizeAssetUrl } from '../lib/mediaUrl'
import { fetchProtectedFileObjectUrl, revokeObjectUrl } from '../lib/protectedFile'
import { chatApi } from '../services/chatApi'
import { personaApi } from '../services/personaApi'
import { ensureMomPersonaId, REMORY_CHAT_ID_KEY, REMORY_PERSONA_ID_KEY } from '../services/personaSession'
import { buildRealtimeVoiceUrl, type RealtimeVoiceMessage } from '../services/realtimeVoiceApi'
import { targetApi } from '../services/targetApi'
import type { ApiId, ChatMessage as ApiChatMessage, Persona, Target } from '../types/api'
import './ChatPage.css'

type Sender = 'user' | 'mom'

type ChatMessage = {
  id: string
  sender: Sender
  text: string
  audioPath?: string
  time: string
}

type ChatPersona = {
  name: string
  subtitle: string
  description: string
  image: string
}

type VoiceLog = {
  id: string
  text: string
  tone: 'info' | 'user' | 'persona' | 'error'
}

type IconName = 'back' | 'history' | 'chevron' | 'sparkle' | 'book' | 'leaf' | 'mic' | 'send' | 'home' | 'chat' | 'my'

const defaultPersona: ChatPersona = {
  name: '엄마',
  subtitle: '따뜻한 조언을 해주는 분',
  description: '가족의 추억과 사랑을 기억하고 있어요.',
  image: '/images/my-page/persona-mom.png',
}

function getPersonaDisplayName(persona: Persona | null, target: Target | undefined) {
  return persona?.persona_name ?? persona?.nickname ?? persona?.name ?? target?.nickname ?? target?.name ?? defaultPersona.name
}

function mapPersonaToChatPersona(persona: Persona | null, target: Target | undefined): ChatPersona {
  return {
    name: getPersonaDisplayName(persona, target),
    subtitle:
      persona?.speaking_style ??
      target?.description ??
      target?.relationship ??
      target?.target_type ??
      defaultPersona.subtitle,
    description:
      persona?.personality_summary ??
      persona?.memory_summary ??
      persona?.description ??
      target?.persona?.description ??
      '소중한 기억과 대화를 이어가고 있어요.',
    image: normalizeAssetUrl(
      persona?.image_url ??
        persona?.image_path ??
        persona?.profile_image_url ??
        persona?.profile_image_path ??
        target?.image_url ??
        target?.profile_image_path ??
        target?.persona?.image_url,
    ) || defaultPersona.image,
  }
}

async function getReadyPersonaStatus(personaId: ApiId) {
  try {
    const response = await personaApi.getPersonaStatus(personaId)
    const normalizedStatus = String(response.status ?? '').toUpperCase()

    if (normalizedStatus === 'PENDING') {
      throw new Error('페르소나가 아직 준비 중입니다. 잠시 후 다시 시도해주세요.')
    }

    if (normalizedStatus === 'FAILED') {
      throw new Error('페르소나 생성에 실패했습니다. 다시 설정해주세요.')
    }

    return response
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        window.localStorage.removeItem(REMORY_PERSONA_ID_KEY)
        window.localStorage.removeItem(REMORY_CHAT_ID_KEY)
        throw new Error('이전 페르소나 정보를 초기화했어요. 다시 설정해주세요.', { cause: error })
      }

      return null
    }

    throw error
  }
}
const MOCK_CHAT_MESSAGES_KEY = 'remory_mock_chat_messages'
const STORYBOOK_NOTICE_KEY = 'remory_storybook_notice'
const REALTIME_VOICE_URL_MISSING_MESSAGE = '실시간 음성 연결 주소가 설정되지 않았습니다. 오디오 메시지를 대신 사용해주세요.'

const initialMessages: ChatMessage[] = [
  { id: '1', sender: 'user', text: '엄마, 우리 제주도 여행 기억나?', time: '오후 3:21' },
  {
    id: '2',
    sender: 'mom',
    text: '그럼~ 바람도 좋고, 바다도 얼마나 예뻤는지! 성산일출봉에서 본 일출은 잊을 수가 없지.',
    time: '오후 3:21',
  },
  { id: '3', sender: 'user', text: '맞아! 그때 엄마가 찍어준 사진 아직도 핸드폰 배경이야 😊', time: '오후 3:22' },
  { id: '4', sender: 'mom', text: '정말? 우리 딸이 웃는 모습이 얼마나 예뻤는데~ 그 사진 나도 참 좋아해.', time: '오후 3:22' },
  { id: '5', sender: 'user', text: '그날 먹었던 해산물도 최고였지! 엄마가 고른 식당 진짜 맛있었어.', time: '오후 3:23' },
  { id: '6', sender: 'mom', text: '후훗, 입맛도 비슷한 우리 딸 🥰 그때 신선한 전복죽이랑 갈치조림 기억나?', time: '오후 3:23' },
  {
    id: '7',
    sender: 'user',
    text: '기억나! 그리고 협재해수욕장에서 모래놀이도 했잖아. 엄마가 모래사장에 하트 그려줬던 거 💛',
    time: '오후 3:24',
  },
  { id: '8', sender: 'mom', text: '그럼, 우리 둘만의 비밀 하트였지~ 다음에 또 같이 가자. 이번엔 우도도 가보고!', time: '오후 3:24' },
]

function formatMessageTime(createdAt?: string) {
  if (!createdAt) {
    return '방금'
  }

  const date = new Date(createdAt)

  if (Number.isNaN(date.getTime())) {
    return '방금'
  }

  return date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isUserMessage(message: ApiChatMessage) {
  const senderType = message.sender_type?.toLowerCase()
  const sender = message.sender?.toLowerCase()
  const role = message.role?.toLowerCase()

  return senderType === 'user' || sender === 'user' || role === 'user'
}

function getMessageAudioApiPath(message: ApiChatMessage) {
  const audioApiUrl = message.audio_api_url?.trim()

  if (audioApiUrl) {
    return audioApiUrl
  }

  const isAudioMessage = String(message.message_type ?? '').toUpperCase() === 'AUDIO'

  if (!isAudioMessage || message.chat_id === undefined || message.chat_id === null) {
    return ''
  }

  return `/api/v1/chats/${message.chat_id}/messages/${message.id}/audio`
}

function mapApiMessage(message: ApiChatMessage): ChatMessage {
  const audioPath = getMessageAudioApiPath(message)

  return {
    id: String(message.id),
    sender: isUserMessage(message) ? 'user' : 'mom',
    text: message.content ?? (audioPath ? '음성 메시지' : ''),
    audioPath: audioPath || undefined,
    time: formatMessageTime(message.created_at),
  }
}

function ProtectedAudio({ path }: { path: string }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let ignore = false
    let objectUrl = ''

    fetchProtectedFileObjectUrl(path)
      .then((nextObjectUrl) => {
        if (ignore) {
          revokeObjectUrl(nextObjectUrl)
          return
        }

        objectUrl = nextObjectUrl
        setSrc(nextObjectUrl)
      })
      .catch(() => {
        if (!ignore) {
          setSrc('')
        }
      })

    return () => {
      ignore = true

      if (objectUrl) {
        revokeObjectUrl(objectUrl)
      }
    }
  }, [path])

  if (!src) {
    return null
  }

  return <audio className="chat-page__audio" src={src} controls />
}

function isStoredApiId(value: string | null): value is string {
  return value !== null && value.trim().length > 0
}

function getRequestedPersonaId() {
  const requestedPersonaId = new URLSearchParams(window.location.search).get('personaId')?.trim()

  return requestedPersonaId || null
}

function getChatErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError && error.status === 0) {
    return '백엔드 채팅 서버에 연결할 수 없습니다. 서버 실행 상태를 확인해주세요.'
  }

  if (error instanceof ApiError) {
    return error.message
  }

  return fallbackMessage
}

function getChatSetupErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return getChatErrorMessage(error, '페르소나를 준비하지 못했습니다. 다시 시도해주세요.')
  }

  if (error instanceof Error) {
    const message = error.message

    if (
      message.includes('페르소나가 아직 준비 중') ||
      message.includes('페르소나 생성에 실패') ||
      message.includes('이전 페르소나 정보를 초기화') ||
      message.includes('설정에서 검증 승인 후 페르소나')
    ) {
      return message
    }
  }

  return '페르소나를 준비하지 못했습니다. 다시 시도해주세요.'
}

function getVoiceLog(message: RealtimeVoiceMessage): Omit<VoiceLog, 'id'> {
  switch (message.type) {
    case 'session_started':
      return { text: '실시간 음성 세션이 시작됐어요.', tone: 'info' }
    case 'final_transcript':
      return { text: `나: ${message.text ?? ''}`, tone: 'user' }
    case 'persona_text':
      return { text: `${defaultPersona.name}: ${message.text ?? ''}`, tone: 'persona' }
    case 'persona_audio':
      return { text: 'AI 음성 응답이 생성됐어요.', tone: 'persona' }
    case 'session_ended':
      return { text: '실시간 음성 세션이 종료됐어요.', tone: 'info' }
    case 'error':
      return { text: message.message ?? '실시간 음성 처리 중 오류가 발생했습니다.', tone: 'error' }
    default:
      return { text: `수신: ${message.type}`, tone: 'info' }
  }
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = String(reader.result ?? '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function ChatIcon({ name }: { name: IconName }) {
  switch (name) {
    case 'back':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 4 7 12l8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'history':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 4v4.6h4.6M12 7.8v4.6l3.1 2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'chevron':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m12 3 1.4 5.1L18.5 10l-5.1 1.9L12 17l-1.4-5.1L5.5 10l5.1-1.9L12 3Z" fill="currentColor" />
        </svg>
      )
    case 'book':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 4.5h5.2c1 0 1.8.8 1.8 1.8V21c0-1.2-1-2.2-2.2-2.2H5V4.5ZM19 4.5h-5.2c-1 0-1.8.8-1.8 1.8V21c0-1.2 1-2.2 2.2-2.2H19V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 4C11.8 4.3 5.6 8.7 5 17.5c5.8-.1 11.9-4.3 15-13.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M5 17.5c3-3.1 6.1-5.2 10-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'mic':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="3.5" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'send':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m21 3-8.2 18-2.7-7.1L3 11.2 21 3Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10.7 12 4l8 6.7V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 18.5 3.7 22l4-1.1a9.8 9.8 0 0 0 4.3.9c5 0 9-3.6 9-8.1s-4-8.1-9-8.1-9 3.6-9 8.1c0 1.8.7 3.5 2 4.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8 13h.01M12 13h.01M16 13h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'my':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 20c.8-4.1 3.3-6.3 7-6.3s6.2 2.2 7 6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
  }
}

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [personaId, setPersonaId] = useState<ApiId | null>(null)
  const [chatId, setChatId] = useState<ApiId | null>(null)
  const [persona, setPersona] = useState<ChatPersona>(defaultPersona)
  const [isSending, setIsSending] = useState(false)
  const [isSendingAudio, setIsSendingAudio] = useState(false)
  const [isPreparingChat, setIsPreparingChat] = useState(false)
  const [isVoiceSessionActive, setIsVoiceSessionActive] = useState(false)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const audioFileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const voiceSocketRef = useRef<WebSocket | null>(null)
  const isChatUnavailable = !chatId && Boolean(errorMessage)
  const shouldShowSetupAction =
    errorMessage.includes('다시 설정') ||
    errorMessage.includes('페르소나를 만들어주세요') ||
    errorMessage.includes('초기화')

  useEffect(() => {
    let ignore = false

    async function loadChat() {
      setIsPreparingChat(true)
      setErrorMessage('')
      window.localStorage.removeItem(MOCK_CHAT_MESSAGES_KEY)

      try {
        const requestedPersonaId = getRequestedPersonaId()
        const storedPersonaId = window.localStorage.getItem(REMORY_PERSONA_ID_KEY)

        if (requestedPersonaId) {
          if (storedPersonaId !== requestedPersonaId) {
            window.localStorage.removeItem(REMORY_CHAT_ID_KEY)
          }

          window.localStorage.setItem(REMORY_PERSONA_ID_KEY, requestedPersonaId)
        }

        const personaId = await ensureMomPersonaId()
        await getReadyPersonaStatus(personaId)
        const personaDetail = await personaApi.getPersona(personaId).catch(() => null)
        const targets = await targetApi.listTargets().catch(() => null)
        const currentTarget = targets?.items.find((target) => {
          const targetPersonaId = target.persona_id ?? target.persona?.id
          return targetPersonaId !== undefined && targetPersonaId !== null && String(targetPersonaId) === personaId
        })
        const nextPersona = mapPersonaToChatPersona(personaDetail, currentTarget)

        if (!ignore) {
          setPersonaId(personaId)
        }

        if (!ignore && (personaDetail || currentTarget)) {
          setPersona(nextPersona)
        }

        let chat

        try {
          const chats = await chatApi.listChats(personaId)
          const storedChatId = window.localStorage.getItem(REMORY_CHAT_ID_KEY)
          const storedChat = isStoredApiId(storedChatId)
            ? chats.find((item) => String(item.id) === storedChatId)
            : undefined

          chat = storedChat ?? chats[0] ?? await chatApi.createChat(personaId, `${nextPersona.name}와 대화`)
        } catch (error) {
          throw new Error(getChatErrorMessage(error, '채팅방을 준비하지 못했습니다. 다시 시도해주세요.'), {
            cause: error,
          })
        }

        if (ignore) {
          return
        }

        setChatId(chat.id)
        window.localStorage.setItem(REMORY_CHAT_ID_KEY, String(chat.id))

        const apiMessages = await chatApi.listMessages(chat.id)

        if (!ignore) {
          setMessages(apiMessages.length > 0 ? apiMessages.map(mapApiMessage) : initialMessages)
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getChatSetupErrorMessage(error))
        }
      } finally {
        if (!ignore) {
          setIsPreparingChat(false)
        }
      }
    }

    loadChat()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop()
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      voiceSocketRef.current?.close()
    }
  }, [])

  const handleSend = async () => {
    const text = input.trim()

    if (!text || isSending || isPreparingChat || isChatUnavailable) {
      return
    }

    if (!chatId) {
      setErrorMessage('채팅방을 준비하지 못했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setInput('')
    setIsSending(true)
    setErrorMessage('')

    try {
      const response = await chatApi.sendMessage(chatId, text)

      setMessages((current) => [
        ...current,
        mapApiMessage(response.user_message),
        mapApiMessage(response.persona_message),
      ])
    } catch (error) {
      setErrorMessage(getChatErrorMessage(error, '메시지를 저장하지 못했습니다.'))
    } finally {
      setIsSending(false)
    }
  }

  const handleAudioFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null
    event.currentTarget.value = ''

    if (!file || isSendingAudio) {
      return
    }

    if (!chatId) {
      setErrorMessage('채팅방을 준비하지 못했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setErrorMessage('')
    setIsSendingAudio(true)

    try {
      const response = await chatApi.sendAudioMessage(chatId, file)

      setMessages((current) => [
        ...current,
        mapApiMessage(response.user_message),
        mapApiMessage(response.persona_message),
      ])
    } catch (error) {
      setErrorMessage(getChatErrorMessage(error, '오디오 메시지를 보내지 못했습니다.'))
    } finally {
      setIsSendingAudio(false)
    }
  }

  const appendVoiceLog = (log: Omit<VoiceLog, 'id'>) => {
    setVoiceLogs((current) => [
      ...current.slice(-7),
      {
        ...log,
        id: `${Date.now()}-${current.length}`,
      },
    ])
  }

  const cleanupVoiceSession = () => {
    mediaRecorderRef.current = null
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    voiceSocketRef.current = null
    setIsVoiceRecording(false)
    setIsVoiceSessionActive(false)
  }

  const handleStartVoiceSession = async () => {
    if (isVoiceSessionActive || isVoiceRecording) {
      return
    }

    if (!personaId) {
      setErrorMessage('페르소나를 준비한 뒤 실시간 음성 대화를 시작할 수 있어요.')
      return
    }

    let realtimeVoiceUrl: string | null

    try {
      realtimeVoiceUrl = buildRealtimeVoiceUrl(personaId)
    } catch {
      setErrorMessage(REALTIME_VOICE_URL_MISSING_MESSAGE)
      return
    }

    if (!realtimeVoiceUrl) {
      setErrorMessage(REALTIME_VOICE_URL_MISSING_MESSAGE)
      return
    }

    let stream: MediaStream

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setErrorMessage('마이크 권한을 확인해주세요.')
      return
    }

    try {
      const socket = new WebSocket(realtimeVoiceUrl)

      mediaStreamRef.current = stream
      voiceSocketRef.current = socket
      setVoiceLogs([])
      setIsVoiceSessionActive(true)
      setErrorMessage('')

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'start', chat_id: chatId ?? undefined }))

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
        const recorder = new MediaRecorder(stream, { mimeType })

        recorder.ondataavailable = async (recordEvent) => {
          if (!recordEvent.data.size || socket.readyState !== WebSocket.OPEN) {
            return
          }

          const data = await blobToBase64(recordEvent.data)
          socket.send(JSON.stringify({ type: 'audio_chunk', mime_type: mimeType, data }))
        }

        recorder.start(1000)
        mediaRecorderRef.current = recorder
        setIsVoiceRecording(true)
      }

      socket.onmessage = (messageEvent) => {
        try {
          appendVoiceLog(getVoiceLog(JSON.parse(messageEvent.data) as RealtimeVoiceMessage))
        } catch {
          appendVoiceLog({ text: '실시간 음성 응답을 해석하지 못했습니다.', tone: 'error' })
        }
      }

      socket.onerror = () => {
        appendVoiceLog({ text: '실시간 음성 WebSocket 연결에 실패했습니다.', tone: 'error' })
      }

      socket.onclose = () => {
        cleanupVoiceSession()
      }
    } catch {
      stream.getTracks().forEach((track) => track.stop())
      cleanupVoiceSession()
      setErrorMessage('실시간 음성 WebSocket 연결에 실패했습니다.')
    }
  }

  const handleEndUtterance = () => {
    if (voiceSocketRef.current?.readyState === WebSocket.OPEN) {
      voiceSocketRef.current.send(JSON.stringify({ type: 'end_utterance' }))
      appendVoiceLog({ text: '말한 내용을 전송했어요.', tone: 'info' })
    }
  }

  const handleStopVoiceSession = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    if (voiceSocketRef.current?.readyState === WebSocket.OPEN) {
      voiceSocketRef.current.send(JSON.stringify({ type: 'stop' }))
    }

    voiceSocketRef.current?.close()
    cleanupVoiceSession()
  }

  const handleStorybookNavigation = () => {
    window.localStorage.setItem(STORYBOOK_NOTICE_KEY, '사진 기억을 선택하면 스토리북을 만들 수 있어요.')
    window.location.href = '/storybook'
  }

  return (
    <main className="chat-page">
      <section className="chat-page__container" aria-label={`${persona.name}와 대화`}>
        <header className="chat-page__header">
          <button className="chat-page__back-button" type="button" aria-label="이전 화면으로 돌아가기" onClick={() => window.history.back()}>
            <ChatIcon name="back" />
          </button>
          <h1 className="chat-page__title">{persona.name}와 대화</h1>
          <button className="chat-page__history-button" type="button" aria-label="대화 기록 열기" onClick={() => console.log('open chat history')}>
            <ChatIcon name="history" />
          </button>
        </header>

        {errorMessage && <p className="chat-page__error-message" role="alert">{errorMessage}</p>}
        {shouldShowSetupAction && (
          <button className="chat-page__setup-link" type="button" onClick={() => { window.location.href = '/setup' }}>
            설정으로 이동
          </button>
        )}

        <button className="chat-page__persona-card" type="button" onClick={() => console.log('open persona detail')}>
          <span className="chat-page__persona-avatar">
            <img src={persona.image} alt={`${persona.name} 페르소나`} />
          </span>
          <span className="chat-page__persona-info">
            <span className="chat-page__persona-title-row">
              <strong>{persona.name}</strong>
              <span className="chat-page__persona-badge">
                <ChatIcon name="sparkle" />
                AI 페르소나
              </span>
            </span>
            <span className="chat-page__persona-subtitle">{persona.subtitle}</span>
            <span className="chat-page__persona-description">{persona.description}</span>
          </span>
          <ChatIcon name="chevron" />
        </button>

        <section className="chat-page__conversation" aria-label="대화 메시지">
          <div className="chat-page__message-list">
            {messages.map((message) => {
              const isUser = message.sender === 'user'

              if (isUser) {
                return (
                  <div className="chat-page__message-row chat-page__message-row--user" key={message.id}>
                    <span className="chat-page__time">{message.time}</span>
                    <p className="chat-page__bubble chat-page__bubble--user">
                      {message.text}
                      {message.audioPath && <ProtectedAudio path={message.audioPath} />}
                    </p>
                  </div>
                )
              }

              return (
                <div className="chat-page__message-row chat-page__message-row--persona" key={message.id}>
                  <img className="chat-page__message-avatar" src={persona.image} alt="" aria-hidden="true" />
                  <div>
                    <p className="chat-page__bubble chat-page__bubble--persona">
                      {message.text}
                      {message.audioPath && <ProtectedAudio path={message.audioPath} />}
                    </p>
                    <span className="chat-page__time">{message.time}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="chat-page__bottom-area" aria-label="메시지 작성">
          <button className="chat-page__storybook-button" type="button" onClick={handleStorybookNavigation}>
            <ChatIcon name="book" />
            스토리북으로 만들기
          </button>

          <input
            ref={audioFileInputRef}
            className="chat-page__file-input"
            type="file"
            accept="audio/*"
            aria-label="오디오 메시지 파일 선택"
            onChange={handleAudioFileChange}
          />

          <button
            className="chat-page__audio-upload-button"
            type="button"
            disabled={isSendingAudio || isPreparingChat || isChatUnavailable}
            onClick={() => audioFileInputRef.current?.click()}
          >
            <ChatIcon name="mic" />
            {isSendingAudio ? '오디오 전송 중...' : '오디오 메시지 보내기'}
          </button>

          <button
            className="chat-page__voice-notice-button"
            type="button"
            disabled={isPreparingChat || isChatUnavailable}
            onClick={isVoiceSessionActive ? handleStopVoiceSession : handleStartVoiceSession}
          >
            <ChatIcon name="mic" />
            {isVoiceSessionActive ? '실시간 음성 종료' : '실시간 음성 시작'}
          </button>

          {(isVoiceSessionActive || voiceLogs.length > 0) && (
            <section className="chat-page__voice-panel" aria-label="실시간 음성 대화 상태">
              <div className="chat-page__voice-panel-heading">
                <strong>{isVoiceRecording ? '마이크 연결 중' : '음성 세션'}</strong>
                <button type="button" onClick={handleEndUtterance} disabled={!isVoiceSessionActive}>
                  말 끝내기
                </button>
              </div>
              <div className="chat-page__voice-log">
                {voiceLogs.length > 0 ? (
                  voiceLogs.map((log) => (
                    <p className={`chat-page__voice-log-line chat-page__voice-log-line--${log.tone}`} key={log.id}>
                      {log.text}
                    </p>
                  ))
                ) : (
                  <p className="chat-page__voice-log-line">말을 마친 뒤 말 끝내기를 눌러주세요.</p>
                )}
              </div>
            </section>
          )}

          <div className="chat-page__composer">
            <button className="chat-page__leaf-button" type="button" aria-label="기억 소재 선택">
              <ChatIcon name="leaf" />
            </button>
            <input
              className="chat-page__composer-input"
              aria-label="메시지 입력"
              value={input}
              placeholder={isPreparingChat ? '채팅방을 준비하고 있어요' : isChatUnavailable ? '설정을 완료한 뒤 대화할 수 있어요' : '메시지를 입력하세요'}
              disabled={isPreparingChat || isChatUnavailable}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSend()
                }
              }}
            />
            <button className="chat-page__send-button" type="button" aria-label="메시지 보내기" onClick={handleSend} disabled={isSending || isPreparingChat || isChatUnavailable}>
              <ChatIcon name="send" />
            </button>
          </div>
        </section>

        <nav className="chat-page__bottom-nav" aria-label="하단 네비게이션">
          <button className="chat-page__nav-button" type="button" onClick={() => { window.location.href = '/home' }}>
            <ChatIcon name="home" />
            <span>홈</span>
          </button>
          <button className="chat-page__nav-button is-active" type="button" aria-current="page">
            <ChatIcon name="chat" />
            <span>대화</span>
          </button>
          <button className="chat-page__nav-button" type="button" onClick={() => { window.location.href = '/storybook' }}>
            <ChatIcon name="book" />
            <span>스토리북</span>
          </button>
          <button className="chat-page__nav-button" type="button" onClick={() => { window.location.href = '/my' }}>
            <ChatIcon name="my" />
            <span>마이</span>
          </button>
        </nav>
      </section>
    </main>
  )
}

export default ChatPage
