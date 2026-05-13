import { apiClient } from './apiClient'
import type { CreateReportRequest, PaginatedReportResponse, ReportResponse } from '../types/report'

export const reportService = {
  createReport(payload: CreateReportRequest) {
    return apiClient.post<ReportResponse>('/reports', payload)
  },

  listReports(page = 1, size = 20) {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    })

    return apiClient.get<PaginatedReportResponse>(`/reports?${params.toString()}`)
  },

  getReport(reportId: number) {
    return apiClient.get<ReportResponse>(`/reports/${reportId}`)
  },
}
