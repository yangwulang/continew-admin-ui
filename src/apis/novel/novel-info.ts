import http from '@/utils/http'

const BASE_URL = '/novel/novel-info'

export interface NovelInfoResp {
  id: string
  bookName: string
  author: string
  coverUrl: string
  description: string
  wordCount: number
  chapterCount: number
  status: number
  sourceType: number
  sourceId: string
  sourceBookId: string
  fileUrl: string
  reviewer: string
  reviewTime: string
  reviewRemark: string
  categoryIds: string[]
  categoryNames: string[]
  createTime: string
}

export interface NovelInfoDetailResp extends NovelInfoResp {}

export interface NovelInfoQuery {
  bookName?: string
  author?: string
  status?: number
  sourceType?: number
  sort: Array<string>
}

export interface NovelInfoPageQuery extends NovelInfoQuery, PageQuery {}

export function listNovelInfo(query: NovelInfoPageQuery) {
  return http.get<PageRes<NovelInfoResp[]>>(BASE_URL, query)
}

export function getNovelInfo(id: string) {
  return http.get<NovelInfoDetailResp>(`${BASE_URL}/${id}`)
}

export interface NovelInfoReq {
  bookName: string
  author?: string
  coverUrl?: string
  description?: string
  sourceType: number
  status: number
  categoryIds?: string[]
}

export function addNovelInfo(data: NovelInfoReq) {
  return http.post(BASE_URL, data)
}

export function updateNovelInfo(data: Partial<NovelInfoReq>, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deleteNovelInfo(ids: string[]) {
  return http.del(BASE_URL, { ids })
}

/** 上传TXT并解析 */
export function uploadNovelTxt(formData: FormData) {
  return http.post(`${BASE_URL}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}

/** 提交审核 */
export function submitNovelInfo(id: string) {
  return http.put(`${BASE_URL}/${id}/submit`)
}

/** 审核通过 */
export function approveNovelInfo(id: string) {
  return http.put(`${BASE_URL}/${id}/approve`)
}

/** 审核驳回 */
export function rejectNovelInfo(id: string, remark: string) {
  return http.put(`${BASE_URL}/${id}/reject`, {}, { params: { remark } })
}

/** 下架 */
export function offlineNovelInfo(id: string) {
  return http.put(`${BASE_URL}/${id}/offline`)
}
