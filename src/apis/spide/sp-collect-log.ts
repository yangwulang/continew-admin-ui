import http from '@/utils/http'

const BASE_URL = '/spide/sp-collect-log'

export interface SpCollectLogResp {
  id: string
  sourceId: string
  collectType: number
  status: number
  totalCount: number
  successCount: number
  failCount: number
  errorMsg: string
  startTime: string
  endTime: string
  duration: number
  createTime: string
}

export interface SpCollectLogDetailResp extends SpCollectLogResp {}

export interface SpCollectLogQuery {
  sourceId?: string
  collectType?: number
  status?: number
  sort: Array<string>
}

export interface SpCollectLogPageQuery extends SpCollectLogQuery, PageQuery {}

export function listSpCollectLog(query: SpCollectLogPageQuery) {
  return http.get<PageRes<SpCollectLogResp[]>>(BASE_URL, query)
}

export function getSpCollectLog(id: string) {
  return http.get<SpCollectLogDetailResp>(`${BASE_URL}/${id}`)
}
