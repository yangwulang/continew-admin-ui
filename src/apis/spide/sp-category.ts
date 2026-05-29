import http from '@/utils/http'
import type { LabelValueState } from '@/types/global'

const BASE_URL = '/spide/sp-category'

export interface SpCategoryResp {
  id: string
  sourceId: string
  categoryCode: string
  categoryName: string
  parentId: string
  sort: number
  status: number
  createTime: string
}

export interface SpCategoryDetailResp extends SpCategoryResp {}

export interface SpCategoryQuery {
  categoryName?: string
  sourceId?: string
  sort: Array<string>
}

export interface SpCategoryPageQuery extends SpCategoryQuery, PageQuery {}

export function listSpCategory(query: SpCategoryPageQuery) {
  return http.get<PageRes<SpCategoryResp[]>>(BASE_URL, query)
}

export function getSpCategory(id: string) {
  return http.get<SpCategoryDetailResp>(`${BASE_URL}/${id}`)
}

export function addSpCategory(data: any) {
  return http.post(BASE_URL, data)
}

export function updateSpCategory(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deleteSpCategory(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 查询分类字典 */
export function listSpCategoryDict() {
  return http.get<LabelValueState[]>(`${BASE_URL}/dict`)
}
