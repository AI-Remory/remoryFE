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

function findTargetWithPersona(targets: Target[]) {
  return targets.find((target) => getPersonaIdFromTarget(target))
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
  const target = findTargetWithPersona(response.items)
  const personaId = target ? getPersonaIdFromTarget(target) : null

  if (!target || !personaId) {
    throw new Error('설정에서 검증 승인 후 페르소나를 만들어주세요.')
  }

  storeActivePersonaSession(personaId, target.id)

  return personaId
}
