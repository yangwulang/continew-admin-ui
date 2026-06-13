import http from '@/utils/http'
import type { LabelValueState } from '@/types/global'

const BASE_URL = '/novel/novel-source'

export interface NovelSourceResp {
  id: string
  sourceName: string
  sourceUrl: string
  sourceType: string
  configJson: string
  status: number
  lastCrawlTime: string
  createTime: string
}

export interface NovelSourceQuery {
  sourceName?: string
  sourceType?: string
  status?: number
  sort: Array<string>
}

export interface NovelSourcePageQuery extends NovelSourceQuery, PageQuery {}

export function listNovelSource(query: NovelSourcePageQuery) {
  return http.get<PageRes<NovelSourceResp[]>>(BASE_URL, query)
}

export function getNovelSource(id: string) {
  return http.get<NovelSourceResp>(`${BASE_URL}/${id}`)
}

export interface NovelSourceReq {
  sourceName: string
  sourceUrl: string
  sourceType: string
  configJson?: string
  status: number
}

export function addNovelSource(data: NovelSourceReq) {
  return http.post(BASE_URL, data)
}

export function updateNovelSource(data: Partial<NovelSourceReq>, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deleteNovelSource(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

export function listNovelSourceDict() {
  return http.get<LabelValueState[]>(`${BASE_URL}/dict`)
}

/** 触发全量采集 */
export function fullCollectNovelSource(id: string) {
  return http.post(`${BASE_URL}/${id}/full-collect`)
}

/** 触发书籍列表采集 */
export function crawlBooks(id: string, page: number = 1) {
  return http.post(`${BASE_URL}/${id}/crawl-books`, {}, { params: { page } })
}

/** 触发章节采集 */
export function crawlChapters(id: string, novelId: string, sourceBookId: string) {
  return http.post(`${BASE_URL}/${id}/crawl-chapters`, {}, { params: { novelId, sourceBookId } })
}
