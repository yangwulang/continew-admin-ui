import http from '@/utils/http'
import type { LabelValueState } from '@/types/global'
import type { FinSupplierMaterialResp } from '@/apis/finance/fin-supplier-material'

const BASE_URL = '/finance/fin-material'

export interface FinMaterialResp {
  id: string
  categoryId: string
  name: string
  code: string
  imageUrl: string
  defaultUnitPrice: number
  minPrice: number
  supplierCount: number
  unit: string
  status: number
  remark: string
  createTime: string
}

export interface FinMaterialDetailResp extends FinMaterialResp {
  suppliers: FinSupplierMaterialResp[]
}

export interface FinMaterialQuery {
  categoryId?: string
  categoryIds?: string[]
  name?: string
  status?: number
  sort: Array<string>
}

export interface FinMaterialPageQuery extends FinMaterialQuery, PageQuery {}

/** @desc 查询物料列表 */
export function listFinMaterial(query: FinMaterialPageQuery) {
  return http.get<PageRes<FinMaterialResp[]>>(BASE_URL, query)
}

/** @desc 查询物料详情 */
export function getFinMaterial(id: string) {
  return http.get<FinMaterialDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增物料 */
export function addFinMaterial(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改物料 */
export function updateFinMaterial(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除物料 */
export function deleteFinMaterial(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出物料 */
export function exportFinMaterial(query: FinMaterialQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 查询物料字典 */
export function listFinMaterialDict() {
  return http.get<LabelValueState[]>(`${BASE_URL}/dict`)
}
