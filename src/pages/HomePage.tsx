import { useEffect, useState } from 'react'
import { ApiError } from '../lib/apiClient'
import { normalizeAssetUrl } from '../lib/mediaUrl'
import { authApi } from '../services/authApi'
import { personaApi } from '../services/personaApi'
import {
  clearActivePersonaSession,
  ensureMomPersonaId,
  getActivePersonaId,
  getPersonaIdFromTarget,
  resolveTargetPersonas,
  storeActivePersonaSession,
  targetMayHavePersona,
  type ResolvedTargetPersona,
} from '../services/personaSession'
import { storybookApi } from '../services/storybookApi'
import { targetApi } from '../services/targetApi'
import type { Persona, Target } from '../types/api'
import './HomePage.css'

type IconName = 'bell' | 'chat' | 'check' | 'plus' | 'sparkle' | 'info' | 'mic' | 'photo' | 'home' | 'book' | 'my' | 'chevron'

type HomePersona = {
  id: string
  targetId?: string
  personaId?: string
  name: string
  image: string
  summary?: string
  active?: boolean
}

const mockPersonas: HomePersona[] = [
  { id: 'mom', name: '엄마', image: '/images/my-page/persona-mom.png', active: true },
  { id: 'grandma', name: '할머니', image: '/images/my-page/persona-grandma.png' },
  { id: 'me', name: '나', image: '/images/my-page/persona-me.png' },
]

const chatLines = [
  { speaker: '나', text: '“엄마, 그때 제주도 여행 기억나?”' },
  { speaker: '엄마', text: '“그럼, 바닷바람이 정말 시원했지.”' },
  { speaker: '나', text: '“엄마가 특히 성산일출봉을 좋아했잖아.”' },
  { speaker: '엄마', text: '“응, 그때 같이 찍은 사진도 아직 기억나.”' },
]

const memoryCards = [
  {
    id: 'interview',
    title: 'AI 인터뷰로 기억 추가',
    description: '질문을 통해 소중한 추억과 이야기를 들려드려요.',
    icon: 'mic' as const,
  },
  {
    id: 'photo',
    title: '사진으로 기억 추가',
    description: '사진과 함께 기억을 더 생생하게 남겨보세요.',
    icon: 'photo' as const,
  },
]

function mapResolvedTargetsToPersonas(resolvedTargetPersonas: ResolvedTargetPersona[]): HomePersona[] {
  const personas: HomePersona[] = []

  for (const { target, personaId } of resolvedTargetPersonas) {
    const index = personas.length

    personas.push({
      id: String(target.id),
      targetId: String(target.id),
      personaId,
      name: target.nickname ?? target.name ?? target.persona?.nickname ?? target.persona?.name ?? `페르소나 ${index + 1}`,
      summary: target.persona?.personality_summary ?? target.persona?.memory_summary ?? target.description ?? undefined,
      image: normalizeAssetUrl(
        target.image_url ?? target.profile_image_path ?? target.persona?.image_url ?? mockPersonas[index]?.image,
      ) || '/images/my-page/persona-mom.png',
      active: index === 0,
    })

    if (personas.length >= 3) {
      break
    }
  }

  return personas
}

function getPersonaDisplayName(persona: Persona, fallbackName = '페르소나') {
  return persona.persona_name ?? persona.nickname ?? persona.name ?? fallbackName
}

function getPersonaImage(persona: Persona, target?: Target, fallbackImage = '/images/my-page/persona-mom.png') {
  return normalizeAssetUrl(
    persona.image_url ??
      persona.image_path ??
      persona.profile_image_url ??
      persona.profile_image_path ??
      target?.image_url ??
      target?.profile_image_path,
  ) || fallbackImage
}

function findTargetForPersona(targets: Target[], persona: Persona, personaId: string) {
  return targets.find((target) => {
    const targetPersonaId = target.persona_id ?? target.persona?.id

    if (targetPersonaId !== undefined && targetPersonaId !== null && String(targetPersonaId) === personaId) {
      return true
    }

    return persona.target_id !== undefined && persona.target_id !== null && String(target.id) === String(persona.target_id)
  })
}

function mapPersonaDetailToHomePersona(persona: Persona, targets: Target[], fallbackIndex = 0): HomePersona {
  const personaId = String(persona.id)
  const target = findTargetForPersona(targets, persona, personaId)

  return {
    id: target ? String(target.id) : personaId,
    targetId: target ? String(target.id) : undefined,
    personaId,
    name: getPersonaDisplayName(persona, target?.nickname ?? target?.name ?? `페르소나 ${fallbackIndex + 1}`),
    summary: persona.personality_summary ?? persona.memory_summary ?? persona.description ?? target?.description ?? undefined,
    image: getPersonaImage(persona, target, mockPersonas[fallbackIndex]?.image),
    active: true,
  }
}

function mergePersonaDetailIntoItems(items: HomePersona[], persona: Persona, targets: Target[]) {
  const detailItem = mapPersonaDetailToHomePersona(persona, targets)
  const existingIndex = items.findIndex((item) => item.personaId === detailItem.personaId)
  const nextItems = [...items]

  if (existingIndex >= 0) {
    nextItems[existingIndex] = {
      ...nextItems[existingIndex],
      ...detailItem,
    }
  } else {
    nextItems.unshift(detailItem)
  }

  return nextItems.slice(0, 3).map((item) => ({
    ...item,
    active: item.personaId === detailItem.personaId || item.id === detailItem.id,
  }))
}

async function resolveHomePersonaId(persona: HomePersona | undefined) {
  if (persona?.personaId) {
    return persona.personaId
  }

  if (!persona?.targetId) {
    return null
  }

  const target = await targetApi.getTarget(persona.targetId)
  return getPersonaIdFromTarget(target)
}

function clearStoredPersonaSession() {
  clearActivePersonaSession()
}

function getChatPath(personaId: string) {
  return `/chat?personaId=${encodeURIComponent(personaId)}`
}

function HomePageIcon({ name }: { name: IconName }) {
  switch (name) {
    case 'bell':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 9.8c0-3.4-2.3-5.8-6-5.8S6 6.4 6 9.8c0 4.4-1.7 5.5-2.4 6.4h16.8c-.7-.9-2.4-2-2.4-6.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9.6 19a2.5 2.5 0 0 0 4.8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 18.5 3.7 22l4-1.1a9.8 9.8 0 0 0 4.3.9c5 0 9-3.6 9-8.1s-4-8.1-9-8.1-9 3.6-9 8.1c0 1.8.7 3.5 2 4.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8 13h.01M12 13h.01M16 13h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6.5 12.2 3.6 3.7 7.4-8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'plus':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m12 3 1.4 5.1L18.5 10l-5.1 1.9L12 17l-1.4-5.1L5.5 10l5.1-1.9L12 3Z" fill="currentColor" />
        </svg>
      )
    case 'info':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 10.7v5M12 7.8h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'mic':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="3.5" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'photo':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="m6.5 16 4-4 3 3 2-2 2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="15.5" cy="9" r="1.2" fill="currentColor" />
        </svg>
      )
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10.7 12 4l8 6.7V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    case 'book':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 4.5h5.2c1 0 1.8.8 1.8 1.8V21c0-1.2-1-2.2-2.2-2.2H5V4.5ZM19 4.5h-5.2c-1 0-1.8.8-1.8 1.8V21c0-1.2 1-2.2 2.2-2.2H19V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    case 'my':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 20c.8-4.1 3.3-6.3 7-6.3s6.2 2.2 7 6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'chevron':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
  }
}

function HomePage() {
  const [displayName, setDisplayName] = useState('현규')
  const [personaItems, setPersonaItems] = useState<HomePersona[]>([])
  const [isLoadingHomeData, setIsLoadingHomeData] = useState(true)
  const [hasLoadedRealTargets, setHasLoadedRealTargets] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [personaLoadError, setPersonaLoadError] = useState('')
  const activePersona = personaItems.find((persona) => persona.active)
  const hasNoLoadedPersonas = !isLoadingHomeData && personaItems.length === 0
  const hasNoPersonas = hasLoadedRealTargets && personaItems.length === 0
  const shouldShowPersonaEmpty = hasNoPersonas || Boolean(personaLoadError)
  const activePersonaName = activePersona?.name ?? '페르소나'
  const activePersonaSummary = activePersona?.summary

  useEffect(() => {
    let ignore = false

    async function loadHomeData() {
      try {
        const user = await authApi.me()

        if (!ignore && user.nickname) {
          setDisplayName(user.nickname)
        }
      } catch {
        // Keep the existing mock greeting when auth lookup fails.
      }

      try {
        const response = await targetApi.listTargets()
        const targets = response.items

        if (!ignore) {
          setHasLoadedRealTargets(true)
        }

        if (targets.length === 0) {
          if (!ignore) {
            clearStoredPersonaSession()
            setPersonaItems([])
            setErrorMessage('')
            setPersonaLoadError('')
          }
        } else {
          const storedPersonaId = getActivePersonaId()
          const resolvedTargetPersonas = await resolveTargetPersonas(targets)
          const resolvedTargets = resolvedTargetPersonas.map(({ target }) => target)
          const targetPersonas = mapResolvedTargetsToPersonas(resolvedTargetPersonas)
          const hasPersonaCandidate = targets.some(targetMayHavePersona)
          let loadedPersonaDetail = false
          let stalePersonaId: string | null = null

          if (storedPersonaId && !targetPersonas.some((persona) => persona.personaId === storedPersonaId)) {
            clearActivePersonaSession()
            stalePersonaId = storedPersonaId
          }

          if (storedPersonaId && !stalePersonaId) {
            try {
              const personaDetail = await personaApi.getPersona(storedPersonaId)
              loadedPersonaDetail = true

              if (!ignore) {
                setPersonaItems(mergePersonaDetailIntoItems(targetPersonas, personaDetail, resolvedTargets))
                storeActivePersonaSession(String(personaDetail.id), findTargetForPersona(resolvedTargets, personaDetail, String(personaDetail.id))?.id)
                setPersonaLoadError('')
              }
            } catch (error) {
              if (!ignore && error instanceof ApiError && (error.status === 403 || error.status === 404)) {
                clearActivePersonaSession()
                stalePersonaId = storedPersonaId
              }
              // Fall back to target-provided persona summaries when persona detail is unavailable.
            }
          }

          const fallbackPersonas = stalePersonaId
            ? targetPersonas.filter((persona) => persona.personaId !== stalePersonaId)
            : targetPersonas

          if (!ignore && !loadedPersonaDetail && fallbackPersonas.length > 0) {
            setPersonaItems(fallbackPersonas)
            setPersonaLoadError('')

            if (fallbackPersonas[0].personaId) {
              storeActivePersonaSession(fallbackPersonas[0].personaId, fallbackPersonas[0].targetId)
            }
          }

          if (!ignore && !loadedPersonaDetail && fallbackPersonas.length === 0) {
            setPersonaItems([])
            setPersonaLoadError(
              hasPersonaCandidate
                ? '페르소나 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
                : '',
            )
          }
        }
      } catch {
        if (!ignore) {
          setHasLoadedRealTargets(false)
          setPersonaItems([])
          setPersonaLoadError('페르소나 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        }
      } finally {
        if (!ignore) {
          setIsLoadingHomeData(false)
        }
      }

      storybookApi.listStorybooks().catch(() => undefined)
    }

    loadHomeData()

    return () => {
      ignore = true
    }
  }, [])

  const activatePersonaItem = (selectedPersona: HomePersona, personaId: string) => {
    setPersonaItems((current) =>
      current.map((item) => ({
        ...item,
        personaId: item.id === selectedPersona.id ? personaId : item.personaId,
        active: item.id === selectedPersona.id || item.personaId === personaId,
      })),
    )
  }

  const handlePersonaClick = async (persona: HomePersona) => {
    setErrorMessage('')

    try {
      const personaId = await resolveHomePersonaId(persona)

      if (!personaId) {
        setErrorMessage('선택한 페르소나 정보를 찾지 못했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      storeActivePersonaSession(personaId, persona.targetId)
      activatePersonaItem(persona, personaId)
      window.location.assign(getChatPath(personaId))
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '선택한 페르소나 정보를 불러오지 못했습니다. 다시 시도해주세요.')
    }
  }

  const handleChatNavigation = async () => {
    setErrorMessage('')

    if (hasNoLoadedPersonas) {
      window.location.assign('/setup')
      return
    }

    try {
      let personaId = await resolveHomePersonaId(activePersona)

      if (!personaId) {
        personaId = await ensureMomPersonaId()
      } else {
        storeActivePersonaSession(personaId, activePersona?.targetId)
      }

      if (activePersona) {
        activatePersonaItem(activePersona, personaId)
      }

      window.location.assign(getChatPath(personaId))
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '설정에서 검증 승인 후 페르소나를 만들어주세요.')
    }
  }

  const handleMemoryCardClick = (cardId: string) => {
    if (hasNoLoadedPersonas) {
      setErrorMessage('먼저 페르소나를 만들어주세요.')
      window.location.assign('/setup')
      return
    }

    if (cardId === 'interview') {
      window.location.assign('/interview')
      return
    }

    window.location.assign('/setup')
  }

  return (
    <main className="home-page">
      <section className="home-page__container" aria-label="Remory home">
        <header className="home-page__header">
          <h1>안녕하세요, {displayName}님</h1>
          <button className="home-page__notification" type="button" aria-label="알림 열기" onClick={() => window.alert('알림 기능은 준비 중입니다.')}>
            <HomePageIcon name="bell" />
            <span />
          </button>
        </header>

        {errorMessage && <p className="home-page__error-message" role="alert">{errorMessage}</p>}

        <section className="home-page__hero">
          <div className="home-page__hero-content">
            <h2 className="home-page__hero-title">
              오늘은 누구와
              <br />
              다시 대화해볼까요?
            </h2>
            <p className="home-page__hero-text">
              소중한 사람의 말투와 기억을 담은
              <br />
              AI 페르소나와 이야기를 이어가세요.
            </p>
            <button className="home-page__hero-button" type="button" onClick={handleChatNavigation}>
              <HomePageIcon name={hasNoLoadedPersonas ? 'plus' : 'chat'} />
              {hasNoLoadedPersonas ? '페르소나 만들기' : `${activePersonaName}와 대화하기`}
            </button>
          </div>
        </section>

        <section className="home-page__persona-section">
          <div className="home-page__section-heading">
            <h2>내 페르소나</h2>
            {!hasNoPersonas && personaItems.length > 0 && (
              <button type="button" onClick={() => { window.location.href = '/my' }}>
                전체 보기 <HomePageIcon name="chevron" />
              </button>
            )}
          </div>

          {isLoadingHomeData && <p className="home-page__persona-loading">페르소나를 불러오는 중입니다.</p>}

          {!isLoadingHomeData && shouldShowPersonaEmpty ? (
            <div className="home-page__persona-empty" role="status">
              <h3>{personaLoadError ? '페르소나 정보를 불러오지 못했습니다.' : '아직 생성된 페르소나가 없습니다.'}</h3>
              <p>{personaLoadError || '소중한 사람의 사진과 목소리를 등록해 페르소나를 만들어보세요.'}</p>
              {!personaLoadError && <small>생성된 페르소나가 없습니다. 설정에서 페르소나를 만들어주세요.</small>}
              <button type="button" onClick={() => { window.location.href = '/setup' }}>
                <HomePageIcon name="plus" />
                페르소나 만들기
              </button>
            </div>
          ) : !isLoadingHomeData && (
            <>
              <div className="home-page__persona-list" aria-label="페르소나 선택">
                {personaItems.map((persona) => (
                  <button
                    className={`home-page__persona-item${persona.active ? ' is-active' : ''}`}
                    type="button"
                    key={persona.id}
                    onClick={() => void handlePersonaClick(persona)}
                  >
                    <span className="home-page__persona-avatar">
                      <img src={persona.image} alt={`${persona.name} 페르소나`} />
                    </span>
                    {persona.active && (
                      <span className="home-page__persona-check">
                        <HomePageIcon name="check" />
                      </span>
                    )}
                    <strong>{persona.name}</strong>
                  </button>
                ))}

                <button className="home-page__persona-item home-page__persona-item--add" type="button" onClick={() => { window.location.href = '/setup' }}>
                  <span className="home-page__add-avatar">
                    <HomePageIcon name="plus" />
                  </span>
                  <strong>추가</strong>
                </button>
              </div>

              <div className="home-page__persona-preview">
                <h3>
                  <HomePageIcon name="sparkle" />
                  {activePersonaName}와 대화
                </h3>
                {activePersonaSummary && (
                  <p className="home-page__persona-summary">{activePersonaSummary}</p>
                )}
                <div className="home-page__preview-body">
                  <div className="home-page__chat-preview">
                    {chatLines.map((line, index) => (
                      <p className="home-page__chat-line" key={`${line.speaker}-${index}`}>
                        <span>{line.speaker}</span>
                        {line.text}
                      </p>
                    ))}
                  </div>
                  <button type="button" onClick={handleChatNavigation}>
                    이어서 대화하기
                  </button>
                </div>
              </div>

              <p className="home-page__hint">
                <HomePageIcon name="info" />
                다른 페르소나를 선택하면 이야기감 대화가 바뀝니다.
              </p>
            </>
          )}
        </section>

        <section className="home-page__memory-section">
          <h2>페르소나 기억 채우기</h2>
          <div className="home-page__memory-grid">
            {memoryCards.map((card) => (
              <button
                className={`home-page__memory-card home-page__memory-card--${card.id}`}
                type="button"
                key={card.id}
                onClick={() => handleMemoryCardClick(card.id)}
              >
                <span className="home-page__memory-icon">
                  <HomePageIcon name={card.icon} />
                </span>
                <span className="home-page__memory-text">
                  <strong>{card.title}</strong>
                  <small>{card.description}</small>
                </span>
                <HomePageIcon name="chevron" />
              </button>
            ))}
          </div>
        </section>

        <nav className="home-page__bottom-nav" aria-label="하단 네비게이션">
          <button className="home-page__nav-button is-active" type="button" aria-current="page">
            <HomePageIcon name="home" />
            <span>홈</span>
          </button>
          <button className="home-page__nav-button" type="button" onClick={handleChatNavigation}>
            <HomePageIcon name="chat" />
            <span>대화</span>
          </button>
          <button className="home-page__nav-button" type="button" onClick={() => { window.location.href = '/storybook' }}>
            <HomePageIcon name="book" />
            <span>스토리북</span>
          </button>
          <button className="home-page__nav-button" type="button" onClick={() => { window.location.href = '/my' }}>
            <HomePageIcon name="my" />
            <span>마이</span>
          </button>
        </nav>
      </section>
    </main>
  )
}

export default HomePage
