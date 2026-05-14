export type MediaId = number
export type MediaType = 'image' | 'voice'

export type MediaUploadResponse = {
  file_id: MediaId
  target_id: number
  uploaded_by: number
  original_filename: string
  stored_filename: string
  file_api_url?: string | null
  file_path: string
  media_type: MediaType
  file_size: number
  mime_type: string
  message?: string
}

export type TargetMediaResponse = {
  created_at: string
  updated_at: string
  id: MediaId
  target_id: number
  uploaded_by: number
  media_type: MediaType
  original_filename: string
  stored_filename: string
  file_api_url?: string | null
  file_path: string
  mime_type: string
  file_size: number
  duration_seconds: number | null
  is_deleted: boolean
}

export type MediaDeleteResponse = {
  message?: string
}
