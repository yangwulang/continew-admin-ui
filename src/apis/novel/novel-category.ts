import http from '@/utils/http'
import type { LabelValueState } from '@/types/global'

const BASE_URL = '/novel/novel-category'

export interface NovelCategoryResp {
  id: string
  categoryName: string
  sort: number
  status: number
  description: string
  createTime: string
}

export interface NovelCategoryQuery {
  categoryName?: string
  status?: number
  sort: string[]
}

export interface NovelCategoryPageQuery extends NovelCategoryQuery, PageQuery {}

/** 分页查询分类列表 */
export function listNovelCategory(query: NovelCategoryPageQuery) {
  return http.get<PageRes<NovelCategoryResp[]>>(BASE_URL, query)
}

/** 查询分类详情 */
export function getNovelCategory(id: string) {
  return http.get<NovelCategoryResp>(`${BASE_URL}/${id}`)
}

export interface NovelCategoryReq {
  categoryName: string
  sort?: number
  status: number
  description?: string
}

export function addNovelCategory(data: NovelCategoryReq) {
  return http.post(BASE_URL, data)
}

export function updateNovelCategory(data: Partial<NovelCategoryReq>, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deleteNovelCategory(ids: string | string[]) {
  return http.del(`${BASE_URL}/${Array.isArray(ids) ? ids.join(',') : ids}`)
}

/** 分类字典 */
export function listNovelCategoryDict() {
  return http.get<LabelValueState[]>(`${BASE_URL}/dict`)
}
