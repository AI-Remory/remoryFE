import { apiClient } from '../lib/apiClient'
import type { ApiId, PaginatedResponse, Report } from '../types/api'

type CreateReportPayload = {
  target_type: string
  target_id: ApiId
  reason_type: string
  reason_detail?: string | null
}

export const reportApi = {
  createReport(payload: CreateReportPayload) {
    return apiClient.post<Report>('/reports', payload)
  },

  async listReports(page = 1, size = 20) {
    const response = await apiClient.get<PaginatedResponse<Report> | Report[]>(`/reports?page=${page}&size=${size}`)

    return Array.isArray(response) ? response : response.items
  },

  getReport(reportId: ApiId) {
    return apiClient.get<Report>(`/reports/${reportId}`)
  },
}
