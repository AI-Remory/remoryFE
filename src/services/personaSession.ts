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

function findMomTarget(targets: Target[]) {
  return targets.find((target) => target.name === '엄마') ?? targets.find((target) => target.name?.toLowerCase() === 'mom')
}

async function createMomTarget() {
  return targetApi.createTarget({
    name: '엄마',
    description: '따뜻한 조언을 해주는 분',
    target_type: 'parent',
  })
}

async function createPersonaForTarget(targetId: ApiId) {
  try {
    return await targetApi.createPersona(targetId)
  } catch {
    throw new Error('페르소나 생성에 실패했습니다')
  }
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
  let target = findMomTarget(response.items)

  if (!target) {
    target = await createMomTarget()
  }

  window.localStorage.setItem(REMORY_TARGET_ID_KEY, String(target.id))

  const targetPersonaId = getPersonaIdFromTarget(target)

  if (targetPersonaId) {
    window.localStorage.setItem(REMORY_PERSONA_ID_KEY, targetPersonaId)
    return targetPersonaId
  }

  const persona = await createPersonaForTarget(target.id)
  const personaId = String(persona.id)

  window.localStorage.setItem(REMORY_PERSONA_ID_KEY, personaId)
  window.localStorage.setItem(REMORY_TARGET_ID_KEY, String(target.id))

  return personaId
}
