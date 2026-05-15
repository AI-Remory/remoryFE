import type { Persona, Target } from '../types/api'

const englishLetterPattern = /[A-Za-z]/g
const hangulPattern = /[가-힣]/

const targetTypeLabels: Record<string, string> = {
  parent: '부모님',
  grandparent: '조부모님',
  friend: '친구',
  romantic: '소중한 사람',
  self: '나',
  other: '소중한 사람',
}

export function isLikelyEnglishText(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue || hangulPattern.test(trimmedValue)) {
    return false
  }

  const englishLetterCount = trimmedValue.match(englishLetterPattern)?.length ?? 0

  return englishLetterCount >= 3
}

export function getKoreanSafeText(value: string | null | undefined) {
  const trimmedValue = value?.trim()

  if (!trimmedValue || isLikelyEnglishText(trimmedValue)) {
    return null
  }

  return trimmedValue
}

export function getTargetTypeLabel(target: Target | undefined) {
  const targetType = target?.target_type?.trim().toLowerCase()

  return targetType ? targetTypeLabels[targetType] : undefined
}

export function getPersonaDisplayNameText(
  persona: Persona | null | undefined,
  target: Target | undefined,
  fallbackName = '페르소나',
) {
  const personaName = persona?.persona_name ?? persona?.nickname ?? persona?.name
  const targetName = target?.nickname ?? target?.name

  if (personaName && !/\bpersona\b/i.test(personaName)) {
    return personaName
  }

  const cleanedPersonaName = personaName?.replace(/\s*persona\s*/gi, '').trim()

  return targetName ?? (cleanedPersonaName || fallbackName)
}
