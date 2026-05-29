import http from '@/utils/http'

const BASE_URL = '/spide/sp-episode'

export interface SpEpisodeResp {
  id: string
  playSourceId: string
  movieId: string
  episodeNum: number
  episodeTitle: string
  playUrl: string
  sort: number
  createTime: string
}

export interface SpEpisodeDetailResp extends SpEpisodeResp {}

export interface SpEpisodeQuery {
  episodeTitle?: string
  movieId?: string
  playSourceId?: string
  sort: Array<string>
}

export interface SpEpisodePageQuery extends SpEpisodeQuery, PageQuery {}

export function listSpEpisode(query: SpEpisodePageQuery) {
  return http.get<PageRes<SpEpisodeResp[]>>(BASE_URL, query)
}

export function getSpEpisode(id: string) {
  return http.get<SpEpisodeDetailResp>(`${BASE_URL}/${id}`)
}

export function addSpEpisode(data: any) {
  return http.post(BASE_URL, data)
}

export function updateSpEpisode(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deleteSpEpisode(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}
