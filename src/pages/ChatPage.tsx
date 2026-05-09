import { useEffect, useState } from 'react'
import { chatApi } from '../services/chatApi'
import type { ApiId, ChatMessage as ApiChatMessage } from '../types/api'
import './ChatPage.css'

type Sender = 'user' | 'mom'

type ChatMessage = {
  id: string
  sender: Sender
  text: string
  time: string
}

type IconName = 'back' | 'history' | 'chevron' | 'sparkle' | 'book' | 'leaf' | 'send' | 'home' | 'chat' | 'my'

const momAvatar = '/images/my-page/persona-mom.png'
const MOCK_CHAT_MESSAGES_KEY = 'remory_mock_chat_messages'

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

const fallbackResponses = [
  '응, 지금은 조용히 지내고 있어. 네가 이렇게 말 걸어주니까 마음이 한결 따뜻해진다.',
  '그 말 들으니까 예전 생각이 난다. 그때 우리는 사소한 일에도 참 많이 웃었지.',
  '요즘은 네 하루가 어떤지 궁금해. 밥은 잘 챙겨 먹고 있는 거지?',
  '아이고, 그런 날도 있지. 괜찮아, 천천히 말해도 돼. 내가 듣고 있을게.',
  '그 이야기는 조금 더 듣고 싶다. 너한테는 어떤 기억으로 남아 있어?',
  '나는 네가 그렇게 기억해주는 것만으로도 참 고맙다. 마음이 따뜻해져.',
  '그래, 그런 마음이 들 수 있어. 오늘 있었던 일부터 하나씩 이야기해볼까?',
  '네 목소리가 들리는 것 같아서 좋다. 무슨 일이든 편하게 말해줘.',
]

const fallbackKeywordResponses: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['뭐해', '뭐하', '하고 있어', '하시'],
    response: '나는 네 이야기 기다리고 있었지. 너는 지금 뭐 하고 있었어?',
  },
  {
    keywords: ['밥', '먹', '식사', '배고'],
    response: '밥은 꼭 챙겨 먹어야지. 예전에 내가 해주던 반찬 중에 뭐가 제일 생각나?',
  },
  {
    keywords: ['힘들', '우울', '속상', '피곤', '지쳐'],
    response: '많이 힘들었구나. 괜찮아, 오늘은 잘 버틴 것만으로도 충분해.',
  },
  {
    keywords: ['기억', '생각나', '추억'],
    response: '그 기억은 나한테도 소중하게 느껴져. 그때 장면을 조금 더 자세히 말해줄래?',
  },
  {
    keywords: ['사랑', '보고싶', '보고 싶'],
    response: '나도 많이 보고 싶어. 이렇게 말해줘서 고맙고, 네 마음이 잘 전해졌어.',
  },
  {
    keywords: ['아니', '아냐', '아뇨', '싫'],
    response: '그랬구나. 내가 다르게 들었나 봐. 네가 원하는 쪽으로 다시 이야기해줄래?',
  },
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

function mapApiMessage(message: ApiChatMessage): ChatMessage {
  return {
    id: String(message.id),
    sender: isUserMessage(message) ? 'user' : 'mom',
    text: message.content,
    time: formatMessageTime(message.created_at),
  }
}

function isBackendPersonaId(personaId: string) {
  return /^\d+$/.test(personaId)
}

function createFallbackResponse(text: string, messageCount: number) {
  const normalizedText = text.trim().toLowerCase()
  const matchedResponse = fallbackKeywordResponses.find(({ keywords }) =>
    keywords.some((keyword) => normalizedText.includes(keyword)),
  )

  if (matchedResponse) {
    return matchedResponse.response
  }

  const fallbackIndex = messageCount % fallbackResponses.length
  return fallbackResponses[fallbackIndex]
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const message = value as Partial<ChatMessage>
  return (
    typeof message.id === 'string' &&
    (message.sender === 'user' || message.sender === 'mom') &&
    typeof message.text === 'string' &&
    typeof message.time === 'string'
  )
}

function getInitialMessages() {
  const storedMessages = window.localStorage.getItem(MOCK_CHAT_MESSAGES_KEY)

  if (!storedMessages) {
    return initialMessages
  }

  try {
    const parsed = JSON.parse(storedMessages)

    if (Array.isArray(parsed) && parsed.every(isChatMessage)) {
      return parsed
    }
  } catch {
    window.localStorage.removeItem(MOCK_CHAT_MESSAGES_KEY)
  }

  return initialMessages
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
  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages)
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState<ApiId | null>(null)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!chatId) {
      window.localStorage.setItem(MOCK_CHAT_MESSAGES_KEY, JSON.stringify(messages))
    }
  }, [chatId, messages])

  useEffect(() => {
    let ignore = false
    const personaId = window.localStorage.getItem('remory_persona_id')

    if (!personaId || !isBackendPersonaId(personaId)) {
      if (personaId) {
        window.localStorage.removeItem('remory_persona_id')
      }

      return () => {
        ignore = true
      }
    }

    const activePersonaId = personaId

    async function loadChat() {
      try {
        const chats = await chatApi.listChats(activePersonaId)
        const chat = chats[0] ?? await chatApi.createChat(activePersonaId, '엄마와 대화')

        if (ignore) {
          return
        }

        setChatId(chat.id)

        const apiMessages = await chatApi.listMessages(chat.id)

        if (!ignore && apiMessages.length > 0) {
          setMessages(apiMessages.map(mapApiMessage))
          window.localStorage.removeItem(MOCK_CHAT_MESSAGES_KEY)
        }
      } catch {
        // Keep the existing mock conversation when chat APIs are unavailable.
      }
    }

    loadChat()

    return () => {
      ignore = true
    }
  }, [])

  const appendMockResponse = (text: string) => {
    const personaReply = createFallbackResponse(text, messages.length)
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: '방금',
    }

    setMessages((current) => [...current, userMessage])

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `mom-${Date.now()}`,
          sender: 'mom',
          text: personaReply,
          time: '오후 3:25',
        },
      ])
    }, 600)
  }

  const handleSend = async () => {
    const text = input.trim()

    if (!text || isSending) {
      return
    }

    setInput('')

    if (!chatId) {
      appendMockResponse(text)
      return
    }

    setIsSending(true)

    try {
      const response = await chatApi.sendMessage(chatId, text)

      setMessages((current) => [
        ...current,
        mapApiMessage(response.user_message),
        mapApiMessage(response.persona_message),
      ])
    } catch {
      appendMockResponse(text)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="chat-page">
      <section className="chat-page__container" aria-label="엄마와 대화">
        <header className="chat-page__header">
          <button className="chat-page__back-button" type="button" aria-label="이전 화면으로 돌아가기" onClick={() => window.history.back()}>
            <ChatIcon name="back" />
          </button>
          <h1 className="chat-page__title">엄마와 대화</h1>
          <button className="chat-page__history-button" type="button" aria-label="대화 기록 열기" onClick={() => console.log('open chat history')}>
            <ChatIcon name="history" />
          </button>
        </header>

        <button className="chat-page__persona-card" type="button" onClick={() => console.log('open persona detail')}>
          <span className="chat-page__persona-avatar">
            <img src={momAvatar} alt="엄마 페르소나" />
          </span>
          <span className="chat-page__persona-info">
            <span className="chat-page__persona-title-row">
              <strong>엄마</strong>
              <span className="chat-page__persona-badge">
                <ChatIcon name="sparkle" />
                AI 페르소나
              </span>
            </span>
            <span className="chat-page__persona-subtitle">따뜻한 조언을 해주는 분</span>
            <span className="chat-page__persona-description">가족의 추억과 사랑을 기억하고 있어요.</span>
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
                    <p className="chat-page__bubble chat-page__bubble--user">{message.text}</p>
                  </div>
                )
              }

              return (
                <div className="chat-page__message-row chat-page__message-row--persona" key={message.id}>
                  <img className="chat-page__message-avatar" src={momAvatar} alt="" aria-hidden="true" />
                  <div>
                    <p className="chat-page__bubble chat-page__bubble--persona">{message.text}</p>
                    <span className="chat-page__time">{message.time}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="chat-page__bottom-area" aria-label="메시지 작성">
          <button className="chat-page__storybook-button" type="button" onClick={() => console.log('create storybook from chat')}>
            <ChatIcon name="book" />
            스토리북으로 만들기
          </button>

          <div className="chat-page__composer">
            <button className="chat-page__leaf-button" type="button" aria-label="기억 소재 선택">
              <ChatIcon name="leaf" />
            </button>
            <input
              className="chat-page__composer-input"
              aria-label="메시지 입력"
              value={input}
              placeholder="메시지를 입력하세요"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSend()
                }
              }}
            />
            <button className="chat-page__send-button" type="button" aria-label="메시지 보내기" onClick={handleSend} disabled={isSending}>
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
