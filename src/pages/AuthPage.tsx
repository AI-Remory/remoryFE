import { useState, type FormEvent } from 'react'
import { ApiError } from '../lib/apiClient'
import { authApi } from '../services/authApi'
import './AuthPage.css'

type AuthTab = 'signup' | 'login'

function BackIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M17.5 5.25 8.75 14l8.75 8.75" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <circle cx="15" cy="9.25" r="5.1" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M5.5 25.25c.9-5.35 4.55-8.35 9.5-8.35s8.6 3 9.5 8.35"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <rect x="4.75" y="7.25" width="20.5" height="15.5" rx="1.7" stroke="currentColor" strokeWidth="2.2" />
      <path d="m5.7 8.25 9.3 7.55 9.3-7.55" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <rect x="6.75" y="13.25" width="16.5" height="11" rx="2.1" stroke="currentColor" strokeWidth="2.2" />
      <path d="M10 13.25V9.8a5 5 0 0 1 10 0v3.45" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15 17.75v2.75" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="31" height="31" viewBox="0 0 31 31" fill="none" aria-hidden="true">
      <path
        d="M3.9 15.5s4.2-7.05 11.6-7.05S27.1 15.5 27.1 15.5s-4.2 7.05-11.6 7.05S3.9 15.5 3.9 15.5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="15.5" cy="15.5" r="3.55" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  )
}

function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>('signup')
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
        setErrorMessage('비밀번호는 8자 이상이어야 합니다.')
        return
      }

      if (password !== passwordConfirm) {
        setErrorMessage('비밀번호가 일치하지 않습니다.')
        return
      }

      if (!agreedToTerms) {
        setErrorMessage('필수 약관에 동의해주세요.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (isSignup) {
        await authApi.register({
          email,
          nickname: name,
          password,
        })
      } else {
        await authApi.login({
          email,
          password,
        })
      }

      window.location.href = '/home'
    } catch (error) {
      const message = error instanceof ApiError ? error.message : '인증 요청에 실패했습니다.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSwitchTab = (tab: AuthTab) => {
    setActiveTab(tab)
  }

  const handleBottomAction = () => {
    setActiveTab(isSignup ? 'login' : 'signup')
  }

  return (
    <main className="auth-page">
      <section className="auth-container" aria-label="Remory authentication">
        <button
          className="auth-back-button"
          type="button"
          aria-label="이전 화면으로 돌아가기"
          onClick={() => window.history.back()}
        >
          <BackIcon />
        </button>

        <h1 className="auth-logo-title">Remory</h1>

        <div className="auth-tab-wrapper" role="tablist" aria-label="인증 방식 선택">
          <button
            className={`auth-tab-button${isSignup ? ' active' : ''}`}
            type="button"
            role="tab"
            aria-selected={isSignup}
            onClick={() => handleSwitchTab('signup')}
          >
            회원가입
          </button>
          <button
            className={`auth-tab-button${!isSignup ? ' active' : ''}`}
            type="button"
            role="tab"
            aria-selected={!isSignup}
            onClick={() => handleSwitchTab('login')}
          >
            로그인
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <label className="auth-input-box">
              <span className="auth-input-icon">
                <UserIcon />
              </span>
              <input
                aria-label="이름"
                type="text"
                placeholder="이름"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          )}

          <label className="auth-input-box">
            <span className="auth-input-icon">
              <MailIcon />
            </span>
            <input
              aria-label="이메일"
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="auth-input-box">
            <span className="auth-input-icon">
              <LockIcon />
            </span>
            <input
              aria-label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="auth-eye-button"
              type="button"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              onClick={() => setShowPassword((current) => !current)}
            >
              <EyeIcon />
            </button>
          </label>

          {isSignup && (
            <label className="auth-input-box">
              <span className="auth-input-icon">
                <LockIcon />
              </span>
              <input
                aria-label="비밀번호 확인"
                type={showPasswordConfirm ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
              <button
                className="auth-eye-button"
                type="button"
                aria-label={showPasswordConfirm ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'}
                onClick={() => setShowPasswordConfirm((current) => !current)}
              >
                <EyeIcon />
              </button>
            </label>
          )}

          {isSignup && (
            <div className="auth-terms-row">
              <button
                className={`auth-check-circle${agreedToTerms ? ' checked' : ''}`}
                type="button"
                aria-label="개인정보 및 데이터 사용 동의"
                aria-pressed={agreedToTerms}
                onClick={() => setAgreedToTerms((current) => !current)}
              >
                <span />
              </button>
              <p className="auth-terms-text">개인정보 수집 및 이용, 음성 및 데이터 사용에 동의합니다. (필수)</p>
              <button
                className="auth-detail-button"
                type="button"
                onClick={() => console.log('show terms detail')}
              >
                자세히 보기
              </button>
            </div>
          )}

          {errorMessage && <p className="auth-error-message" role="alert">{errorMessage}</p>}

          <button className="auth-submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : isSignup ? '회원가입 완료' : '로그인'}
          </button>
        </form>

        <p className="auth-bottom-text">
          {isSignup ? '이미 계정이 있나요?' : '아직 계정이 없나요?'}{' '}
          <button className="auth-login-link" type="button" onClick={handleBottomAction}>
            {isSignup ? '로그인' : '회원가입'}
          </button>
        </p>
      </section>
    </main>
  )
}

export default AuthPage
