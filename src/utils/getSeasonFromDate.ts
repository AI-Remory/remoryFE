export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter']

export function getSeasonFromDate(dateInput?: Date | string | null): Season {
  const fallbackDate = new Date()
  const date =
    dateInput instanceof Date
      ? dateInput
      : dateInput
        ? new Date(dateInput)
        : fallbackDate

  const validDate = Number.isNaN(date.getTime()) ? fallbackDate : date
  const month = validDate.getMonth() + 1

  if (month >= 3 && month <= 5) {
    return 'spring'
  }

  if (month >= 6 && month <= 8) {
    return 'summer'
  }

  if (month >= 9 && month <= 11) {
    return 'autumn'
  }

  return 'winter'
}

export function getCurrentSeason() {
  return getSeasonFromDate(new Date())
}
