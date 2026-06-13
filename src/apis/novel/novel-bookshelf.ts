import http from '@/utils/http'

const BASE_URL = '/novel/bookshelf'

export interface NovelBookshelfResp {
  id: string
  novelId: string
  bookName: string
  author: string
  coverUrl: string
  chapterCount: number
  lastChapterId: string
  lastChapterNo: number
  lastChapterTitle: string
  readProgress: number
  lastReadTime: string
  isTop: number
  createTime: string
}

/** 获取我的书架 */
export function listMyBookshelf() {
  return http.get<NovelBookshelfResp[]>(BASE_URL)
}

/** 添加到书架 */
export function addToBookshelf(novelId: string) {
  return http.post(`${BASE_URL}/${novelId}`)
}

/** 从书架移除 */
export function removeFromBookshelf(novelId: string) {
  return http.del(`${BASE_URL}/${novelId}`)
}

/** 更新阅读进度 */
export function updateReadProgress(novelId: string, chapterId: string) {
  return http.put(`${BASE_URL}/${novelId}/progress`, {}, { params: { chapterId } })
}

/** 置顶/取消置顶 */
export function toggleBookshelfTop(novelId: string, isTop: number) {
  return http.put(`${BASE_URL}/${novelId}/top`, {}, { params: { isTop } })
}

/** 检查是否在书架中 */
export function checkInBookshelf(novelId: string) {
  return http.get<boolean>(`${BASE_URL}/${novelId}/check`)
}
