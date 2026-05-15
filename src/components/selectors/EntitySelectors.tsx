import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { groupService } from '../../services/groupService'
import { storybookService } from '../../services/storybookService'
import { targetService } from '../../services/targetService'
import type { MemoryGroupResponse } from '../../types/group'
import type { StoryBookResponse } from '../../types/storybook'
import type { TargetResponse } from '../../types/target'
import { getDisplayLabel } from '../../utils/displayLabels'

type SelectorState<T> = {
  items: T[]
  isLoading: boolean
  errorMessage: string | null
}

type SelectorCardProps = {
  isSelected: boolean
  title: string
  badge?: string | null
  description?: string | null
  updatedAt: string
  onClick: () => void
}

function SelectorCard({
  isSelected,
  title,
  badge,
  description,
  updatedAt,
  onClick,
}: SelectorCardProps) {
  return (
    <button
      className={`target-card target-card--stacked target-selector-card${isSelected ? ' target-selector-card--selected' : ''}`}
      onClick={onClick}
      type="button"
    >
      <span className="target-card__body">
        <span className="target-card__header">
          <span className="target-card__title-row">
            <strong>{title}</strong>
            {badge && <span>{badge}</span>}
          </span>
          {isSelected && (
            <span className="target-selector-card__selected-badge">
              <CheckCircle2 aria-hidden="true" size={15} />
              선택됨
            </span>
          )}
        </span>
        {description && <span className="target-card__description">{description}</span>}
        <span className="target-card__actions">
          <small>{new Date(updatedAt).toLocaleDateString('ko-KR')}</small>
        </span>
      </span>
    </button>
  )
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
  title = '대상을 선택해 주세요.',
  emptyActionHref = '/targets/new',
  emptyActionLabel = '대상 추가하기',
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
          setState({
            items: [],
            isLoading: false,
            errorMessage: error instanceof Error ? error.message : '대상 목록을 불러오지 못했어요.',
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (state.isLoading) {
    return <TargetSelectorState title={title} message="대상 목록을 불러오는 중이에요." />
  }

  if (state.errorMessage) {
    return <TargetSelectorState title={title} message={state.errorMessage} />
  }

  if (state.items.length === 0) {
    return (
      <TargetSelectorState
        action={{ href: emptyActionHref, label: emptyActionLabel }}
        title="먼저 대상을 등록해 주세요."
        message="대상이 있어야 사진과 음성을 올리고 페르소나 준비를 진행할 수 있어요."
      />
    )
  }

  return (
    <section className="target-api-state">
      <h2>{title}</h2>
      <div className="target-card-grid" aria-label={title}>
        {state.items.map((target) => (
          <SelectorCard
            badge={getDisplayLabel(target.target_type)}
            description={target.description}
            isSelected={selectedId === target.id}
            key={target.id}
            onClick={() => onSelect(target)}
            title={target.name}
            updatedAt={target.updated_at}
          />
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

export function StorybookSelector({ selectedId, title = '스토리북을 선택해 주세요.', onSelect }: StorybookSelectorProps) {
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
          setState({
            items: [],
            isLoading: false,
            errorMessage: error instanceof Error ? error.message : '스토리북 목록을 불러오지 못했어요.',
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (state.isLoading) {
    return <TargetSelectorState title={title} message="스토리북 목록을 불러오는 중이에요." />
  }

  if (state.errorMessage) {
    return <TargetSelectorState title={title} message={state.errorMessage} />
  }

  if (state.items.length === 0) {
    return (
      <TargetSelectorState
        action={{ href: '/storybooks/create', label: '스토리북 만들기' }}
        title="스토리북이 아직 없어요."
        message="먼저 스토리북을 만들고 공유 또는 연결 작업을 진행해 주세요."
      />
    )
  }

  return (
    <section className="target-api-state">
      <h2>{title}</h2>
      <div className="target-card-grid" aria-label={title}>
        {state.items.map((storybook) => (
          <SelectorCard
            badge={getDisplayLabel(storybook.status)}
            description={storybook.summary}
            isSelected={selectedId === storybook.id}
            key={storybook.id}
            onClick={() => onSelect(storybook)}
            title={storybook.title}
            updatedAt={storybook.updated_at}
          />
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

export function MemoryGroupSelector({ selectedId, title = '그룹을 선택해 주세요.', onSelect }: MemoryGroupSelectorProps) {
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
          setState({
            items: [],
            isLoading: false,
            errorMessage: error instanceof Error ? error.message : '그룹 목록을 불러오지 못했어요.',
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (state.isLoading) {
    return <TargetSelectorState title={title} message="그룹 목록을 불러오는 중이에요." />
  }

  if (state.errorMessage) {
    return <TargetSelectorState title={title} message={state.errorMessage} />
  }

  if (state.items.length === 0) {
    return (
      <TargetSelectorState
        action={{ href: '/groups', label: '그룹 만들기' }}
        title="그룹이 아직 없어요."
        message="그룹을 만들어야 공유 대상을 지정할 수 있어요."
      />
    )
  }

  return (
    <section className="target-api-state">
      <h2>{title}</h2>
      <div className="target-card-grid" aria-label={title}>
        {state.items.map((group) => (
          <SelectorCard
            description={group.description}
            isSelected={selectedId === group.id}
            key={group.id}
            onClick={() => onSelect(group)}
            title={group.name}
            updatedAt={group.updated_at}
          />
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
