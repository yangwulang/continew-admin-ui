import http from '@/utils/http'
import type { LabelValueState } from '@/types/global'

const BASE_URL = '/finance/fin-material-category'

export interface FinMaterialCategoryResp {
  id: string
  parentId: string
  name: string
  sort: number
  status: number
  remark: string
  createTime: string
  children?: FinMaterialCategoryResp[]
}

export interface FinMaterialCategoryQuery {
  name?: string
  status?: number
  sort: Array<string>
}

/** @desc 查询物料分类树形列表 */
export function listFinMaterialCategory(query: FinMaterialCategoryQuery) {
  return http.get<FinMaterialCategoryResp[]>(`${BASE_URL}/tree`, query)
}

/** @desc 查询物料分类详情 */
export function getFinMaterialCategory(id: string) {
  return http.get<FinMaterialCategoryResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增物料分类 */
export function addFinMaterialCategory(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改物料分类 */
export function updateFinMaterialCategory(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除物料分类 */
export function deleteFinMaterialCategory(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 查询物料分类字典 */
export function listFinMaterialCategoryDict() {
  return http.get<LabelValueState[]>(`${BASE_URL}/dict`)
}
