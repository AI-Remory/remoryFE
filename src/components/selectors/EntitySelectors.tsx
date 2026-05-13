import { useEffect, useState } from 'react'
import { targetService } from '../../services/targetService'
import { groupService } from '../../services/groupService'
import { storybookService } from '../../services/storybookService'
import type { MemoryGroupResponse } from '../../types/group'
import type { StoryBookResponse } from '../../types/storybook'
import type { TargetResponse } from '../../types/target'
import { getDisplayLabel } from '../../utils/displayLabels'

type SelectorState<T> = {
  items: T[]
  isLoading: boolean
  errorMessage: string | null
}

type TargetSelectorProps = {
  selectedId?: number | null
  title?: string
  emptyActionHref?: string
  emptyActionLabel?: string
  onSelect: (target: TargetResponse) => void
}

export function TargetSelector({
  selectedId,
  title = '대상을 선택해 주세요',
  emptyActionHref = '/targets/new',
  emptyActionLabel = '대상 만들기',
  onSelect,
}: TargetSelectorProps) {
  const [state, setState] = useState<SelectorState<TargetResponse>>({ items: [], isLoading: true, errorMessage: null })

  useEffect(() => {
    let isMounted = true

    targetService
      .listTargets({ skip: 0, limit: 50 })
      .then((response) => {
        if (isMounted) {
          setState({ items: response.items, isLoading: false, errorMessage: null })
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setState({ items: [], isLoading: false, errorMessage: error instanceof Error ? error.message : '대상 목록을 불러오지 못했습니다.' })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (state.isLoading) {
    return <TargetSelectorState title={title} message="대상 목록을 불러오고 있습니다." />
  }

  if (state.errorMessage) {
    return <TargetSelectorState title={title} message={state.errorMessage} />
  }

  if (state.items.length === 0) {
    return (
      <TargetSelectorState
        action={{ href: emptyActionHref, label: emptyActionLabel }}
        title="먼저 대상을 만들어 주세요"
        message="사진, 동의, 페르소나를 연결할 대상을 먼저 등록해야 합니다."
      />
    )
  }

  return (
    <section className="target-api-state">
      <h2>{title}</h2>
      <div className="target-card-grid" aria-label={title}>
        {state.items.map((target) => (
          <button
            className={`target-card target-selector-card${selectedId === target.id ? ' target-selector-card--selected' : ''}`}
            key={target.id}
            onClick={() => onSelect(target)}
            type="button"
          >
            <span className="target-card__body">
              <span className="target-card__title-row">
                <strong>{target.name}</strong>
                <span>{getDisplayLabel(target.target_type)}</span>
              </span>
              {target.description && <span>{target.description}</span>}
              <small>{new Date(target.updated_at).toLocaleDateString('ko-KR')}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

type StorybookSelectorProps = {
  selectedId?: number | null
  title?: string
  onSelect: (storybook: StoryBookResponse) => void
}

export function StorybookSelector({ selectedId, title = '스토리북을 선택해 주세요', onSelect }: StorybookSelectorProps) {
  const [state, setState] = useState<SelectorState<StoryBookResponse>>({ items: [], isLoading: true, errorMessage: null })

  useEffect(() => {
    let isMounted = true

    storybookService
      .listStorybooks()
      .then((items) => {
        if (isMounted) {
          setState({ items, isLoading: false, errorMessage: null })
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setState({ items: [], isLoading: false, errorMessage: error instanceof Error ? error.message : '스토리북 목록을 불러오지 못했습니다.' })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (state.isLoading) {
    return <TargetSelectorState title={title} message="스토리북 목록을 불러오고 있습니다." />
  }

  if (state.errorMessage) {
    return <TargetSelectorState title={title} message={state.errorMessage} />
  }

  if (state.items.length === 0) {
    return <TargetSelectorState action={{ href: '/storybooks/new', label: '스토리북 만들기' }} title="먼저 스토리북을 만들어 주세요" message="공유하거나 확인할 스토리북이 아직 없습니다." />
  }

  return (
    <section className="target-api-state">
      <h2>{title}</h2>
      <div className="target-card-grid" aria-label={title}>
        {state.items.map((storybook) => (
          <button
            className={`target-card target-selector-card${selectedId === storybook.id ? ' target-selector-card--selected' : ''}`}
            key={storybook.id}
            onClick={() => onSelect(storybook)}
            type="button"
          >
            <span className="target-card__body">
              <span className="target-card__title-row">
                <strong>{storybook.title}</strong>
                <span>{getDisplayLabel(storybook.status)}</span>
              </span>
              {storybook.summary && <span>{storybook.summary}</span>}
              <small>{new Date(storybook.updated_at).toLocaleDateString('ko-KR')}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

type MemoryGroupSelectorProps = {
  selectedId?: number | null
  title?: string
  onSelect: (group: MemoryGroupResponse) => void
}

export function MemoryGroupSelector({ selectedId, title = '그룹을 선택해 주세요', onSelect }: MemoryGroupSelectorProps) {
  const [state, setState] = useState<SelectorState<MemoryGroupResponse>>({ items: [], isLoading: true, errorMessage: null })

  useEffect(() => {
    let isMounted = true

    groupService
      .listGroups()
      .then((items) => {
        if (isMounted) {
          setState({ items, isLoading: false, errorMessage: null })
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setState({ items: [], isLoading: false, errorMessage: error instanceof Error ? error.message : '그룹 목록을 불러오지 못했습니다.' })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (state.isLoading) {
    return <TargetSelectorState title={title} message="그룹 목록을 불러오고 있습니다." />
  }

  if (state.errorMessage) {
    return <TargetSelectorState title={title} message={state.errorMessage} />
  }

  if (state.items.length === 0) {
    return <TargetSelectorState action={{ href: '/groups', label: '그룹 만들기' }} title="먼저 그룹을 만들어 주세요" message="스토리북을 공유할 그룹이 아직 없습니다." />
  }

  return (
    <section className="target-api-state">
      <h2>{title}</h2>
      <div className="target-card-grid" aria-label={title}>
        {state.items.map((group) => (
          <button
            className={`target-card target-selector-card${selectedId === group.id ? ' target-selector-card--selected' : ''}`}
            key={group.id}
            onClick={() => onSelect(group)}
            type="button"
          >
            <span className="target-card__body">
              <span className="target-card__title-row">
                <strong>{group.name}</strong>
              </span>
              {group.description && <span>{group.description}</span>}
              <small>{new Date(group.updated_at).toLocaleDateString('ko-KR')}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function TargetSelectorState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: { href: string; label: string }
}) {
  return (
    <section className="target-api-state">
      <h2>{title}</h2>
      <p>{message}</p>
      {action && <a href={action.href}>{action.label}</a>}
    </section>
  )
}
