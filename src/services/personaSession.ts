import { targetApi } from './targetApi'
import type { ApiId, Target } from '../types/api'

export const REMORY_TARGET_ID_KEY = 'remory_target_id'
export const REMORY_PERSONA_ID_KEY = 'remory_persona_id'
export const REMORY_CHAT_ID_KEY = 'remory_chat_id'

function isBackendId(value: string | null): value is string {
  return value !== null && /^\d+$/.test(value)
}

function toStorageId(value: ApiId | null | undefined) {
  return value === null || value === undefined ? null : String(value)
}

function getPersonaIdFromTarget(target: Target) {
  return toStorageId(target.persona_id ?? target.persona?.id)
}

function findTargetWithPersona(targets: Target[]) {
  return targets.find((target) => getPersonaIdFromTarget(target))
}

export async function ensureMomPersonaId(): Promise<string> {
  const storedPersonaId = window.localStorage.getItem(REMORY_PERSONA_ID_KEY)

  if (isBackendId(storedPersonaId)) {
    return storedPersonaId
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

  window.localStorage.setItem(REMORY_TARGET_ID_KEY, String(target.id))
  window.localStorage.setItem(REMORY_PERSONA_ID_KEY, personaId)

  return personaId
}
