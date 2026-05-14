// Protected backend files must be loaded through authenticated file APIs, not /uploads paths.
// Keep this helper for app-owned public assets and non-protected URLs only.
export function normalizeAssetUrl(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  if (trimmedValue.startsWith('/uploads/') || trimmedValue.startsWith('uploads/')) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    try {
      const url = new URL(trimmedValue)

      if (url.pathname.startsWith('/uploads/')) {
        return ''
      }
    } catch {
      return trimmedValue
    }
  }

  return trimmedValue
}
