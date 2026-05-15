import { targetApi } from './targetApi'
import type { ApiId, Target } from '../types/api'

export const REMORY_TARGET_ID_KEY = 'remory_target_id'
export const REMORY_PERSONA_ID_KEY = 'remory_persona_id'
export const REMORY_CHAT_ID_KEY = 'remory_chat_id'

function isStoredId(value: string | null): value is string {
  return value !== null && value.trim().length > 0
}

function toStorageId(value: ApiId | null | undefined) {
  return value === null || value === undefined ? null : String(value)
}

export function getPersonaIdFromTarget(target: Target) {
  return toStorageId(target.persona_id ?? target.persona?.id)
}

export type ResolvedTargetPersona = {
  target: Target
  personaId: string
}

export function targetMayHavePersona(target: Target) {
  return Boolean(getPersonaIdFromTarget(target) || target.persona || target.has_persona)
}

export async function resolveTargetPersona(target: Target): Promise<ResolvedTargetPersona | null> {
  const directPersonaId = getPersonaIdFromTarget(target)

  if (directPersonaId) {
    return { target, personaId: directPersonaId }
  }

  if (target.has_persona === false && !target.persona) {
    return null
  }

  try {
    const detailedTarget = await targetApi.getTarget(target.id)
    const mergedTarget = { ...target, ...detailedTarget }
    const detailedPersonaId = getPersonaIdFromTarget(mergedTarget)

    if (detailedPersonaId) {
      return { target: mergedTarget, personaId: detailedPersonaId }
    }

    if (mergedTarget.has_persona) {
      const persona = await targetApi.createPersona(mergedTarget.id)
      const personaId = toStorageId(persona.id)

      return personaId
        ? {
            target: {
              ...mergedTarget,
              persona,
              persona_id: persona.id,
            },
            personaId,
          }
        : null
    }

    return null
  } catch {
    return null
  }
}

export async function resolveTargetPersonas(targets: Target[], limit = Number.POSITIVE_INFINITY) {
  const resolvedPersonas: ResolvedTargetPersona[] = []
  const seenPersonaIds = new Set<string>()

  for (const target of targets) {
    const resolved = await resolveTargetPersona(target)

    if (!resolved || seenPersonaIds.has(resolved.personaId)) {
      continue
    }

    seenPersonaIds.add(resolved.personaId)
    resolvedPersonas.push(resolved)

    if (resolvedPersonas.length >= limit) {
      break
    }
  }

  return resolvedPersonas
}

export function storeActivePersonaSession(personaId: string, targetId?: ApiId | null) {
  const nextPersonaId = personaId.trim()
  const previousPersonaId = window.localStorage.getItem(REMORY_PERSONA_ID_KEY)

  if (!nextPersonaId) {
    return
  }

  if (previousPersonaId && previousPersonaId !== nextPersonaId) {
    window.localStorage.removeItem(REMORY_CHAT_ID_KEY)
  }

  if (targetId !== undefined && targetId !== null) {
    window.localStorage.setItem(REMORY_TARGET_ID_KEY, String(targetId))
  }

  window.localStorage.setItem(REMORY_PERSONA_ID_KEY, nextPersonaId)
}

export async function ensureMomPersonaId(): Promise<string> {
  const storedPersonaId = window.localStorage.getItem(REMORY_PERSONA_ID_KEY)

  if (isStoredId(storedPersonaId)) {
    return storedPersonaId.trim()
  }

  if (storedPersonaId) {
    window.localStorage.removeItem(REMORY_PERSONA_ID_KEY)
  }

  const response = await targetApi.listTargets()
  const resolvedTargetPersonas = await resolveTargetPersonas(response.items, 1)
  const resolvedPersona = resolvedTargetPersonas[0]

  if (!resolvedPersona) {
    throw new Error('설정에서 검증 승인 후 페르소나를 만들어주세요.')
  }

  storeActivePersonaSession(resolvedPersona.personaId, resolvedPersona.target.id)

  return resolvedPersona.personaId
}
