import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/apiClient'
import './AuthPage.css'

type AuthTab = 'signup' | 'login'

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.9" />
      <path d="M4.8 20c.8-4.4 3.4-6.7 7.2-6.7s6.4 2.3 7.2 6.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.9" />
      <path d="m4.6 7.2 7.4 6 7.4-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.9" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 12s3.2-5.4 8.5-5.4 8.5 5.4 8.5 5.4-3.2 5.4-8.5 5.4S3.5 12 3.5 12Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  )
}

function getTabFromPathname(pathname: string): AuthTab {
  if (pathname === '/signup' || pathname === '/auth/signup') {
    return 'signup'
  }

  return 'login'
}

function AuthPage() {
  const { login, register } = useAuth()
  const [activeTab, setActiveTab] = useState<AuthTab>(() => getTabFromPathname(window.location.pathname))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignup = activeTab === 'signup'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (isSubmitting) {
      return
    }

    if (isSignup) {
      if (password.length < 8) {
        setErrorMessage('비밀번호는 8자 이상으로 입력해 주세요.')
        return
      }

      if (password !== passwordConfirm) {
        setErrorMessage('비밀번호가 서로 달라요. 다시 확인해 주세요.')
        return
      }

      if (!agreedToTerms) {
        setErrorMessage('필수 약관 동의가 필요해요.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (isSignup) {
        await register({ email, nickname: name, password })
        window.location.href = '/onboarding'
      } else {
        await login({ email, password })
        window.location.href = '/dashboard'
      }
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '로그인 정보를 확인하지 못했어요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSwitchTab = (tab: AuthTab) => {
    setActiveTab(tab)
    setErrorMessage('')
    window.history.replaceState(null, '', tab === 'signup' ? '/signup' : '/login')
  }

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-label="Remory 계정">
        <aside className="auth-intro" aria-label="Remory 소개">
          <button className="auth-back-button" type="button" aria-label="이전 화면으로 돌아가기" onClick={() => window.history.back()}>
            <BackIcon />
          </button>
          <p className="auth-kicker">Remory</p>
          <h1>기억을 차분히 모아 오래 간직할 수 있도록 도와드려요.</h1>
          <p>계정으로 로그인하면 대상, 페르소나, 스토리북을 한곳에서 안전하게 관리할 수 있어요.</p>
        </aside>

        <section className="auth-card" aria-label={isSignup ? '회원가입' : '로그인'}>
          <div className="auth-card__heading">
            <p>계정</p>
            <h2>{isSignup ? '회원가입' : '로그인'}</h2>
          </div>

          <div className="auth-tab-wrapper" role="tablist" aria-label="계정 이용 방법 선택">
            <button className={`auth-tab-button${isSignup ? ' active' : ''}`} type="button" role="tab" aria-selected={isSignup} onClick={() => handleSwitchTab('signup')}>
              회원가입
            </button>
            <button className={`auth-tab-button${!isSignup ? ' active' : ''}`} type="button" role="tab" aria-selected={!isSignup} onClick={() => handleSwitchTab('login')}>
              로그인
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <label className="auth-input-box">
                <span className="auth-input-label">이름</span>
                <span className="auth-input-control">
                  <UserIcon />
                  <input type="text" placeholder="이름을 입력해 주세요" value={name} onChange={(event) => setName(event.target.value)} required />
                </span>
              </label>
            )}

            <label className="auth-input-box">
              <span className="auth-input-label">이메일</span>
              <span className="auth-input-control">
                <MailIcon />
                <input type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </span>
            </label>

            <label className="auth-input-box">
              <span className="auth-input-label">비밀번호</span>
              <span className="auth-input-control">
                <LockIcon />
                <input type={showPassword ? 'text' : 'password'} placeholder="비밀번호" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={isSignup ? 8 : undefined} />
                <button className="auth-eye-button" type="button" aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'} onClick={() => setShowPassword((current) => !current)}>
                  <EyeIcon />
                </button>
              </span>
            </label>

            {isSignup && (
              <label className="auth-input-box">
                <span className="auth-input-label">비밀번호 확인</span>
                <span className="auth-input-control">
                  <LockIcon />
                  <input type={showPasswordConfirm ? 'text' : 'password'} placeholder="비밀번호를 한 번 더 입력해 주세요" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} required minLength={8} />
                  <button className="auth-eye-button" type="button" aria-label={showPasswordConfirm ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'} onClick={() => setShowPasswordConfirm((current) => !current)}>
                    <EyeIcon />
                  </button>
                </span>
              </label>
            )}

            {isSignup && (
              <label className="auth-terms-row">
                <input type="checkbox" checked={agreedToTerms} onChange={(event) => setAgreedToTerms(event.target.checked)} />
                <span>개인정보 수집과 서비스 이용 약관에 동의합니다. (필수)</span>
              </label>
            )}

            <div className="auth-message-slot">
              {errorMessage && <p className="auth-error-message" role="alert">{errorMessage}</p>}
            </div>

            <button className="auth-submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '확인 중...' : isSignup ? '회원가입 완료' : '로그인'}
            </button>
          </form>

          <p className="auth-bottom-text">
            {isSignup ? '이미 계정이 있나요?' : '아직 계정이 없나요?'}{' '}
            <button className="auth-login-link" type="button" onClick={() => handleSwitchTab(isSignup ? 'login' : 'signup')}>
              {isSignup ? '로그인하기' : '회원가입하기'}
            </button>
          </p>
        </section>
      </section>
    </main>
  )
}

export default AuthPage
