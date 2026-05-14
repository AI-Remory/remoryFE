import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, BookOpen, Plus, UserPlus, Users } from 'lucide-react'
import { ApiError } from '../lib/apiClient'
import { groupApi } from '../services/groupApi'
import { storybookApi } from '../services/storybookApi'
import type { GroupMember, GroupStoryBookListItem, MemoryGroup, StoryBook } from '../types/api'
import './OperationsPage.css'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

function isNumericId(value: string) {
  return value.trim() !== '' && Number.isFinite(Number(value))
}

function GroupPage() {
  const [groups, setGroups] = useState<MemoryGroup[]>([])
  const [storybooks, setStorybooks] = useState<StoryBook[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [groupStorybooks, setGroupStorybooks] = useState<GroupStoryBookListItem[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState('MEMBER')
  const [selectedStorybookId, setSelectedStorybookId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadGroups = async () => {
    const nextGroups = await groupApi.listGroups()
    setGroups(nextGroups)
    setSelectedGroupId((current) => current || (nextGroups[0] ? String(nextGroups[0].id) : ''))
  }

  useEffect(() => {
    let ignore = false

    async function loadInitialData() {
      try {
        const [nextGroups, nextStorybooks] = await Promise.all([
          groupApi.listGroups(),
          storybookApi.listStorybooks().catch(() => []),
        ])

        if (!ignore) {
          setGroups(nextGroups)
          setStorybooks(nextStorybooks)
          setSelectedGroupId(nextGroups[0] ? String(nextGroups[0].id) : '')
          setSelectedStorybookId(nextStorybooks[0] ? String(nextStorybooks[0].id) : '')
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getErrorMessage(error, '그룹 정보를 불러오지 못했습니다.'))
        }
      }
    }

    loadInitialData()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const timeoutId = window.setTimeout(() => {
      if (!selectedGroupId) {
        setMembers([])
        setGroupStorybooks([])
        return
      }

      Promise.all([
        groupApi.listMembers(selectedGroupId),
        groupApi.listStorybooks(selectedGroupId),
      ])
        .then(([nextMembers, nextGroupStorybooks]) => {
          if (!ignore) {
            setMembers(nextMembers)
            setGroupStorybooks(nextGroupStorybooks)
          }
        })
        .catch((error) => {
          if (!ignore) {
            setErrorMessage(getErrorMessage(error, '선택한 그룹 상세를 불러오지 못했습니다.'))
          }
        })
    }, 0)

    return () => {
      ignore = true
      window.clearTimeout(timeoutId)
    }
  }, [selectedGroupId])

  const handleCreateGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!groupName.trim() || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setStatusMessage('')

    try {
      const group = await groupApi.createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || null,
      })

      setGroupName('')
      setGroupDescription('')
      await loadGroups()
      setSelectedGroupId(String(group.id))
      setStatusMessage('그룹을 만들었어요.')
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '그룹을 만들지 못했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddMember = async () => {
    if (isSubmitting) {
      return
    }

    const trimmedMemberUserId = memberUserId.trim()

    if (!selectedGroupId) {
      setErrorMessage('그룹을 선택해주세요.')
      return
    }

    if (!trimmedMemberUserId) {
      setErrorMessage('추가할 사용자 ID를 입력해주세요.')
      return
    }

    if (!isNumericId(trimmedMemberUserId)) {
      setErrorMessage('사용자 ID는 숫자로 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setStatusMessage('')

    try {
      const member = await groupApi.addMember(selectedGroupId, {
        user_id: Number(trimmedMemberUserId),
        role: memberRole,
      })

      setMembers((current) => [member, ...current])
      setMemberUserId('')
      setStatusMessage('멤버를 추가했어요.')
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '멤버를 추가하지 못했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddStorybook = async () => {
    if (!selectedGroupId || !selectedStorybookId || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setStatusMessage('')

    try {
      const item = await groupApi.addStorybook(selectedGroupId, selectedStorybookId)
      setGroupStorybooks((current) => [item, ...current])
      setStatusMessage('그룹에 스토리북을 공유했어요.')
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '그룹 스토리북 공유에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedGroup = groups.find((group) => String(group.id) === selectedGroupId)

  return (
    <main className="ops-page">
      <section className="ops-page__container" aria-label="그룹 관리">
        <header className="ops-page__header">
          <button className="ops-page__back" type="button" onClick={() => window.location.assign('/my')}>
            <ArrowLeft size={17} /> 마이
          </button>
          <span className="ops-page__eyebrow">Group</span>
          <h1>그룹 공유</h1>
          <p>가족 그룹을 만들고 멤버와 스토리북을 연결합니다.</p>
        </header>

        {statusMessage && <p className="ops-page__status">{statusMessage}</p>}
        {errorMessage && <p className="ops-page__error">{errorMessage}</p>}

        <section className="ops-page__grid">
          <form className="ops-page__panel ops-page__form" onSubmit={handleCreateGroup}>
            <h2>새 그룹</h2>
            <label>
              그룹명
              <input value={groupName} onChange={(event) => setGroupName(event.currentTarget.value)} />
            </label>
            <label>
              설명
              <textarea rows={3} value={groupDescription} onChange={(event) => setGroupDescription(event.currentTarget.value)} />
            </label>
            <button className="ops-page__button" type="submit" disabled={!groupName.trim() || isSubmitting}>
              <Plus size={17} /> 그룹 만들기
            </button>
          </form>

          <div className="ops-page__panel">
            <h2>그룹 선택</h2>
            <div className="ops-page__form">
              <label>
                그룹
                <select value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.currentTarget.value)}>
                  <option value="">그룹 없음</option>
                  {groups.map((group) => (
                    <option value={String(group.id)} key={String(group.id)}>{group.name}</option>
                  ))}
                </select>
              </label>
              <p className="ops-page__helper">{selectedGroup?.description ?? '선택한 그룹 설명이 없습니다.'}</p>
            </div>
          </div>

          <div className="ops-page__panel">
            <h2>멤버 추가</h2>
            <div className="ops-page__form">
              <label>
                사용자 ID
                <input
                  type="number"
                  inputMode="numeric"
                  value={memberUserId}
                  onChange={(event) => setMemberUserId(event.currentTarget.value)}
                />
              </label>
              <label>
                역할
                <select value={memberRole} onChange={(event) => setMemberRole(event.currentTarget.value)}>
                  <option value="MEMBER">MEMBER</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </label>
              <button className="ops-page__button-secondary" type="button" onClick={handleAddMember} disabled={!selectedGroupId || isSubmitting}>
                <UserPlus size={17} /> 멤버 추가
              </button>
            </div>
          </div>

          <div className="ops-page__panel">
            <h2>스토리북 공유</h2>
            <div className="ops-page__form">
              <label>
                스토리북
                <select value={selectedStorybookId} onChange={(event) => setSelectedStorybookId(event.currentTarget.value)}>
                  <option value="">스토리북 없음</option>
                  {storybooks.map((storybook) => (
                    <option value={String(storybook.id)} key={String(storybook.id)}>{storybook.title}</option>
                  ))}
                </select>
              </label>
              <button className="ops-page__button-secondary" type="button" onClick={handleAddStorybook} disabled={!selectedGroupId || !selectedStorybookId || isSubmitting}>
                <BookOpen size={17} /> 그룹에 공유
              </button>
            </div>
          </div>
        </section>

        <section className="ops-page__grid" style={{ marginTop: 14 }}>
          <div className="ops-page__panel">
            <h2><Users size={18} /> 멤버</h2>
            <div className="ops-page__list">
              {members.length > 0 ? members.map((member) => (
                <article className="ops-page__item" key={String(member.id)}>
                  <div className="ops-page__item-header">
                    <strong>User #{member.user_id ?? '-'}</strong>
                    <span className="ops-page__badge">{member.role ?? 'MEMBER'}</span>
                  </div>
                </article>
              )) : <p className="ops-page__empty">아직 멤버가 없습니다.</p>}
            </div>
          </div>

          <div className="ops-page__panel">
            <h2><BookOpen size={18} /> 공유된 스토리북</h2>
            <div className="ops-page__list">
              {groupStorybooks.length > 0 ? groupStorybooks.map((item) => (
                <article className="ops-page__item" key={String(item.id)}>
                  <strong>{item.storybook?.title ?? item.title ?? `StoryBook #${item.storybook_id ?? item.id}`}</strong>
                </article>
              )) : <p className="ops-page__empty">아직 공유된 스토리북이 없습니다.</p>}
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default GroupPage
