import http from '@/utils/http'
import type { LabelValueState } from '@/types/global'

const BASE_URL = '/spide/sp-source'

export interface SpSourceResp {
  id: string
  sourceCode: string
  sourceName: string
  sourceType: number
  apiUrl: string
  apiKey: string
  configJson: string
  status: number
  sort: number
  remark: string
  lastSyncTime: string
  createTime: string
}

export interface SpSourceDetailResp extends SpSourceResp {}

export interface SpSourceQuery {
  sourceName?: string
  sourceType?: number
  status?: number
  sort: Array<string>
}

export interface SpSourcePageQuery extends SpSourceQuery, PageQuery {}

export function listSpSource(query: SpSourcePageQuery) {
  return http.get<PageRes<SpSourceResp[]>>(BASE_URL, query)
}

export function getSpSource(id: string) {
  return http.get<SpSourceDetailResp>(`${BASE_URL}/${id}`)
}

export interface SpSourceCreateReq {
  sourceCode: string
  sourceName: string
  sourceType: number
  apiUrl?: string
  apiKey?: string
  configJson?: string
  status: number
  sort?: number
  remark?: string
}

export function addSpSource(data: SpSourceCreateReq) {
  return http.post(BASE_URL, data)
}

export function updateSpSource(data: Partial<SpSourceCreateReq>, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deleteSpSource(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 查询数据源字典 */
export function listSpSourceDict() {
  return http.get<LabelValueState[]>(`${BASE_URL}/dict`)
}

/** @desc 全量采集 */
export function fullCollect(sourceId: string) {
  return http.post(`${BASE_URL}/${sourceId}/collect/full`)
}

/** @desc 增量采集 */
export function incrementalCollect(sourceId: string) {
  return http.post(`${BASE_URL}/${sourceId}/collect/incremental`)
}

/** @desc 单部采集 */
export function collectSingleMovie(sourceId: string, sourceMovieId: string) {
  return http.post(`${BASE_URL}/${sourceId}/collect/movie/${sourceMovieId}`)
}
