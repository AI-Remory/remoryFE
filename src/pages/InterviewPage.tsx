import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../lib/apiClient'
import { interviewApi } from '../services/interviewApi'
import { REMORY_TARGET_ID_KEY } from '../services/personaSession'
import { storybookApi } from '../services/storybookApi'
import { targetApi } from '../services/targetApi'
import type { AIInterviewAnswer, AIInterviewQuestion, AIInterviewSessionDetail, ApiId, Target } from '../types/api'
import './InterviewPage.css'

const REMORY_INTERVIEW_SESSION_ID_KEY = 'remory_interview_session_id'

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  return fallbackMessage
}

function isSameApiId(left: ApiId | null | undefined, right: ApiId | null | undefined) {
  return left !== null && left !== undefined && right !== null && right !== undefined && String(left) === String(right)
}

function getQuestionText(question: AIInterviewQuestion, index: number) {
  return question.question_text?.trim() || `기억을 들려줄 질문 ${index + 1}`
}

function sortQuestions(questions: AIInterviewQuestion[]) {
  return [...questions].sort((left, right) => {
    const leftOrder = left.order_index ?? 0
    const rightOrder = right.order_index ?? 0

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return String(left.id).localeCompare(String(right.id))
  })
}

function appendAnswerToQuestion(question: AIInterviewQuestion, answer: AIInterviewAnswer) {
  return {
    ...question,
    answers: [...(question.answers ?? []), answer],
  }
}

function InterviewPage() {
  const [target, setTarget] = useState<Target | null>(null)
  const [session, setSession] = useState<AIInterviewSessionDetail | null>(null)
  const [questions, setQuestions] = useState<AIInterviewQuestion[]>([])
  const [answerText, setAnswerText] = useState('')
  const [isInitializing, setIsInitializing] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false)
  const [isSavingAnswer, setIsSavingAnswer] = useState(false)
  const [isCreatingStorybook, setIsCreatingStorybook] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const sortedQuestions = useMemo(() => sortQuestions(questions), [questions])
  const currentQuestion = sortedQuestions.at(-1) ?? null
  const hasTarget = target !== null
  const hasSession = session !== null

  useEffect(() => {
    let ignore = false

    async function loadInitialState() {
      try {
        const response = await targetApi.listTargets()
        const storedTargetId = window.localStorage.getItem(REMORY_TARGET_ID_KEY)
        const storedTarget = response.items.find((item) => isSameApiId(item.id, storedTargetId))
        const nextTarget = storedTarget ?? response.items[0] ?? null

        if (!ignore && nextTarget) {
          setTarget(nextTarget)
          window.localStorage.setItem(REMORY_TARGET_ID_KEY, String(nextTarget.id))
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getApiErrorMessage(error, '대상 정보를 불러오지 못했습니다.'))
        }
      }

      const storedSessionId = window.localStorage.getItem(REMORY_INTERVIEW_SESSION_ID_KEY)

      if (storedSessionId) {
        try {
          const detail = await interviewApi.getInterviewSession(storedSessionId)

          if (!ignore) {
            setSession(detail)
            setQuestions(sortQuestions(detail.questions ?? []))
            setStatusMessage('진행 중이던 인터뷰를 불러왔어요.')
          }
        } catch (error) {
          if (!ignore) {
            if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
              window.localStorage.removeItem(REMORY_INTERVIEW_SESSION_ID_KEY)
              setStatusMessage('이전 인터뷰 세션을 찾을 수 없어 새로 시작할 수 있어요.')
            } else {
              setErrorMessage(getApiErrorMessage(error, '인터뷰 세션을 불러오지 못했습니다.'))
            }
          }
        }
      }

      if (!ignore) {
        setIsInitializing(false)
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadInitialState()
    }, 0)

    return () => {
      ignore = true
      window.clearTimeout(timeoutId)
    }
  }, [])

  const handleStartInterview = async () => {
    if (!target || isStarting) {
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsStarting(true)

    try {
      const nextSession = await interviewApi.createInterviewSession({
        session_type: 'TARGET_PROFILE',
        title: '기억 인터뷰',
        target_id: target.id,
        photo_memory_id: null,
      })
      const nextQuestion = await interviewApi.createQuestion(nextSession.id)
      const nextDetail: AIInterviewSessionDetail = {
        ...nextSession,
        questions: [nextQuestion],
      }

      window.localStorage.setItem(REMORY_INTERVIEW_SESSION_ID_KEY, String(nextSession.id))
      setSession(nextDetail)
      setQuestions([nextQuestion])
      setAnswerText('')
      setStatusMessage('인터뷰를 시작했어요. 첫 질문에 답변해주세요.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '인터뷰를 시작하지 못했습니다.'))
    } finally {
      setIsStarting(false)
    }
  }

  const handleCreateNextQuestion = async () => {
    if (!session || isCreatingQuestion) {
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsCreatingQuestion(true)

    try {
      const question = await interviewApi.createQuestion(session.id)

      setQuestions((current) => [...current, question])
      setAnswerText('')
      setStatusMessage('새 질문을 받았어요.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '다음 질문을 받지 못했습니다.'))
    } finally {
      setIsCreatingQuestion(false)
    }
  }

  const handleSaveAnswer = async () => {
    const trimmedAnswer = answerText.trim()

    if (!session || !currentQuestion || isSavingAnswer) {
      return
    }

    if (!trimmedAnswer) {
      setErrorMessage('답변을 입력해주세요.')
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsSavingAnswer(true)

    try {
      const answer = await interviewApi.createAnswer(session.id, {
        question_id: currentQuestion.id,
        answer_text: trimmedAnswer,
        answer_audio_path: null,
      })

      setQuestions((current) =>
        current.map((question) =>
          isSameApiId(question.id, currentQuestion.id) ? appendAnswerToQuestion(question, answer) : question,
        ),
      )
      setAnswerText('')
      setStatusMessage('답변을 저장했어요. 다음 질문을 받을 수 있습니다.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '답변을 저장하지 못했습니다.'))
    } finally {
      setIsSavingAnswer(false)
    }
  }

  const handleCreateStorybook = async () => {
    if (!session || isCreatingStorybook) {
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsCreatingStorybook(true)

    try {
      const storybook = await storybookApi.createStorybook({
        title: `${target?.nickname ?? target?.name ?? '기억'} 인터뷰 스토리북`,
        interview_session_id: session.id,
        photo_memory_id: null,
        visibility: 'PRIVATE',
      })

      setStatusMessage('인터뷰 스토리북을 만들었어요.')
      window.location.assign(`/storybook/${storybook.id}`)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '인터뷰 스토리북을 만들지 못했습니다.'))
    } finally {
      setIsCreatingStorybook(false)
    }
  }

  return (
    <main className="interview-page">
      <section className="interview-page__container" aria-label="AI 인터뷰">
        <header className="interview-page__header">
          <button type="button" onClick={() => { window.location.assign('/home') }}>
            홈
          </button>
          <span>AI Interview</span>
          <h1>기억 인터뷰</h1>
          <p>질문에 답하면 소중한 기억을 텍스트로 차곡차곡 남길 수 있어요.</p>
        </header>

        {statusMessage && <p className="interview-page__status" role="status">{statusMessage}</p>}
        {errorMessage && <p className="interview-page__error" role="alert">{errorMessage}</p>}

        {isInitializing ? (
          <section className="interview-page__card">
            <p className="interview-page__loading">인터뷰를 준비하고 있어요.</p>
          </section>
        ) : !hasTarget ? (
          <section className="interview-page__card interview-page__empty">
            <h2>페르소나 설정이 필요해요</h2>
            <p>먼저 페르소나 설정을 완료해주세요.</p>
            <button type="button" onClick={() => { window.location.assign('/setup') }}>
              설정으로 이동
            </button>
          </section>
        ) : !hasSession ? (
          <section className="interview-page__card interview-page__start">
            <div>
              <span>대상</span>
              <strong>{target.nickname ?? target.name ?? '나의 페르소나'}</strong>
              {target.description && <p>{target.description}</p>}
            </div>
            <button type="button" onClick={handleStartInterview} disabled={isStarting}>
              {isStarting ? '인터뷰 시작 중...' : '인터뷰 시작하기'}
            </button>
          </section>
        ) : (
          <>
            <section className="interview-page__card interview-page__current">
              <div className="interview-page__current-heading">
                <span>현재 질문</span>
                <strong>{currentQuestion ? getQuestionText(currentQuestion, sortedQuestions.length - 1) : '질문을 받아주세요.'}</strong>
              </div>
              <textarea
                value={answerText}
                rows={5}
                placeholder="떠오르는 기억을 편하게 적어주세요."
                disabled={!currentQuestion || isSavingAnswer}
                onChange={(event) => setAnswerText(event.currentTarget.value)}
              />
              <div className="interview-page__actions">
                <button type="button" onClick={handleSaveAnswer} disabled={!currentQuestion || isSavingAnswer}>
                  {isSavingAnswer ? '답변 저장 중...' : '답변 저장'}
                </button>
                <button type="button" onClick={handleCreateNextQuestion} disabled={isCreatingQuestion}>
                  {isCreatingQuestion ? '질문 생성 중...' : '다음 질문 받기'}
                </button>
              </div>
            </section>

            <section className="interview-page__history" aria-label="인터뷰 질문과 답변">
              <h2>인터뷰 기록</h2>
              {sortedQuestions.length > 0 ? (
                sortedQuestions.map((question, index) => (
                  <article className="interview-page__qa" key={String(question.id)}>
                    <span>Q{index + 1}</span>
                    <h3>{getQuestionText(question, index)}</h3>
                    {(question.answers ?? []).length > 0 ? (
                      question.answers?.map((answer) => (
                        <p key={String(answer.id)}>{answer.answer_text || '음성 답변이 저장되었습니다.'}</p>
                      ))
                    ) : (
                      <p className="interview-page__pending-answer">아직 저장된 답변이 없습니다.</p>
                    )}
                  </article>
                ))
              ) : (
                <p className="interview-page__loading">아직 질문이 없습니다. 다음 질문을 받아주세요.</p>
              )}
            </section>
          </>
        )}

        <section className="interview-page__note">
          <strong>인터뷰를 스토리북으로 만들기</strong>
          <p>저장한 질문과 답변을 바탕으로 인터뷰 스토리북을 생성합니다.</p>
          <button type="button" onClick={handleCreateStorybook} disabled={!session || isCreatingStorybook}>
            {isCreatingStorybook ? '스토리북 생성 중...' : '이 인터뷰로 스토리북 만들기'}
          </button>
        </section>
      </section>
    </main>
  )
}

export default InterviewPage
