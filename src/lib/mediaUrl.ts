export function normalizeAssetUrl(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  if (trimmedValue.startsWith('/uploads/')) {
    return trimmedValue
  }

  if (trimmedValue.startsWith('uploads/')) {
    return `/${trimmedValue}`
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    try {
      const url = new URL(trimmedValue)

      if (url.pathname.startsWith('/uploads/')) {
        return `${url.pathname}${url.search}${url.hash}`
      }
    } catch {
      return trimmedValue
    }
  }

  return trimmedValue
}
