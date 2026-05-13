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

export async function ensureMomPersonaId(): Promise<string> {
  const storedPersonaId = window.localStorage.getItem(REMORY_PERSONA_ID_KEY)

  if (isBackendId(storedPersonaId)) {
    return storedPersonaId
  }

  if (storedPersonaId) {
    window.localStorage.removeItem(REMORY_PERSONA_ID_KEY)
  }

  const response = await targetApi.listTargets()
  const targetWithPersona = response.items.find((target) => getPersonaIdFromTarget(target))
  const personaId = targetWithPersona ? getPersonaIdFromTarget(targetWithPersona) : null

  if (!targetWithPersona || !personaId) {
    throw new Error('No existing persona is available. Create a Target and Persona explicitly first.')
  }

  window.localStorage.setItem(REMORY_TARGET_ID_KEY, String(targetWithPersona.id))
  window.localStorage.setItem(REMORY_PERSONA_ID_KEY, personaId)

  return personaId
}
