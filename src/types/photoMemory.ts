export type PhotoMemoryResponse = {
  created_at: string
  updated_at: string
  id: number
  user_id: number
  title: string
  description: string | null
  image_api_url?: string | null
  file_path: string
  original_filename: string
  stored_filename: string
  mime_type: string
  file_size: number
  taken_at: string | null
  location: string | null
  ai_caption: string | null
  emotion_keywords: string[] | null
  deleted_at: string | null
}

export type PhotoMemoryCreatePayload = {
  title: string
  description?: string | null
  taken_at?: string | null
  location?: string | null
  file: File
}

export type PhotoMemoryDeleteResponse = {
  message?: string
}
