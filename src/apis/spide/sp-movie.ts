import http from '@/utils/http'

const BASE_URL = '/spide/sp-movie'

export interface SpMovieResp {
  id: string
  sourceId: string
  sourceMovieId: string
  movieName: string
  movieSubname: string
  categoryId: string
  coverUrl: string
  director: string
  actors: string
  releaseDate: string
  score: number
  description: string
  area: string
  year: number
  language: string
  duration: number
  status: number
  lastSyncTime: string
  createTime: string
}

export interface SpMovieDetailResp extends SpMovieResp {}

export interface SpMovieQuery {
  movieName?: string
  sourceId?: string
  categoryId?: string
  status?: number
  sort: Array<string>
}

export interface SpMoviePageQuery extends SpMovieQuery, PageQuery {}

export function listSpMovie(query: SpMoviePageQuery) {
  return http.get<PageRes<SpMovieResp[]>>(BASE_URL, query)
}

export function getSpMovie(id: string) {
  return http.get<SpMovieDetailResp>(`${BASE_URL}/${id}`)
}

export function addSpMovie(data: any) {
  return http.post(BASE_URL, data)
}

export function updateSpMovie(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deleteSpMovie(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 搜索影片(MeiliSearch) */
export function searchMovies(keyword: string, page = 1, size = 20) {
  return http.get<any[]>(`${BASE_URL}/search`, { keyword, page, size })
}

/** @desc 聚合搜索影片(跨源) */
export function searchAggregateMovies(keyword: string, page = 1, size = 20) {
  return http.get<Record<string, any>>(`${BASE_URL}/search/aggregate`, { keyword, page, size })
}
