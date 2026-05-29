import http from '@/utils/http'

const BASE_URL = '/spide/sp-play-source'

export interface SpPlaySourceResp {
  id: string
  movieId: string
  sourceName: string
  sourceCode: string
  sort: number
  createTime: string
}

export interface SpPlaySourceDetailResp extends SpPlaySourceResp {}

export interface SpPlaySourceQuery {
  movieId?: string
  sourceName?: string
  sort: Array<string>
}

export interface SpPlaySourcePageQuery extends SpPlaySourceQuery, PageQuery {}

export function listSpPlaySource(query: SpPlaySourcePageQuery) {
  return http.get<PageRes<SpPlaySourceResp[]>>(BASE_URL, query)
}

export function getSpPlaySource(id: string) {
  return http.get<SpPlaySourceDetailResp>(`${BASE_URL}/${id}`)
}

export function addSpPlaySource(data: any) {
  return http.post(BASE_URL, data)
}

export function updateSpPlaySource(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deleteSpPlaySource(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}
