import http from '@/utils/http'

const BASE_URL = '/novel/novel-chapter'

export interface NovelChapterResp {
  id: string
  novelId: string
  chapterNo: number
  title: string
  wordCount: number
  sortOrder: number
  createTime: string
}

export interface NovelChapterQuery {
  novelId?: string
  title?: string
  sort: string[]
}

export interface NovelChapterPageQuery extends NovelChapterQuery, PageQuery {}

/** 分页查询章节列表 */
export function listNovelChapter(query: NovelChapterPageQuery) {
  return http.get<PageRes<NovelChapterResp[]>>(BASE_URL, query)
}

/** 查询章节详情 */
export function getNovelChapter(id: string) {
  return http.get<NovelChapterDetailResp>(`${BASE_URL}/${id}`)
}

export interface NovelChapterDetailResp extends NovelChapterResp {
  content: string
  prevChapterId: string | null
  prevChapterTitle: string | null
  nextChapterId: string | null
  nextChapterTitle: string | null
}

export interface NovelChapterReq {
  novelId: string
  chapterNo: number
  title: string
  content?: string
  wordCount?: number
  sortOrder: number
}

/** 新增章节 */
export function addNovelChapter(data: NovelChapterReq) {
  return http.post(BASE_URL, data)
}

/** 修改章节 */
export function updateNovelChapter(data: Partial<NovelChapterReq>, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** 删除章节 */
export function deleteNovelChapter(ids: string | string[]) {
  return http.del(`${BASE_URL}/${Array.isArray(ids) ? ids.join(',') : ids}`)
}
