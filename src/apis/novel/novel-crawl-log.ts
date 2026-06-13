import http from '@/utils/http'

const BASE_URL = '/novel/novel-crawl-log'

export interface NovelCrawlLogResp {
  id: string
  sourceId: string
  novelId: string
  crawlType: number
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

export interface NovelCrawlLogQuery {
  sourceId?: string
  status?: number
  crawlType?: number
  sort: Array<string>
}

export interface NovelCrawlLogPageQuery extends NovelCrawlLogQuery, PageQuery {}

export function listNovelCrawlLog(query: NovelCrawlLogPageQuery) {
  return http.get<PageRes<NovelCrawlLogResp[]>>(BASE_URL, query)
}

export function getNovelCrawlLog(id: string) {
  return http.get<NovelCrawlLogResp>(`${BASE_URL}/${id}`)
}
