export type TargetId = number

export type TargetType = 'parent' | 'grandparent' | 'friend' | 'romantic' | 'self' | 'other'

export type TargetCreateRequest = {
  name: string
  description?: string | null
  target_type?: TargetType
}

export type TargetUpdateRequest = {
  name?: string | null
  description?: string | null
  target_type?: TargetType | null
}

export type TargetResponse = {
  created_at: string
  updated_at: string
  id: TargetId
  user_id: number
  name: string
  description: string | null
  target_type: TargetType
  profile_image_path: string | null
  is_deleted: boolean
}

export type TargetDetailResponse = TargetResponse & {
  media_count?: number
  has_persona?: boolean
}

export type PaginatedTargetResponse = {
  total: number
  skip: number
  limit: number
  items: TargetResponse[]
}

export type TargetListParams = {
  skip?: number
  limit?: number
}
