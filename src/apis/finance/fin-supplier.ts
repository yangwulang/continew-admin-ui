import http from '@/utils/http'
import type { LabelValueState } from '@/types/global'

const BASE_URL = '/finance/fin-supplier'

export interface FinSupplierResp {
  id: string
  name: string
  contact: string
  phone: string
  address: string
  status: number
  remark: string
  createTime: string
}

export interface FinSupplierDetailResp extends FinSupplierResp {}

export interface FinSupplierQuery {
  name?: string
  status?: number
  sort: Array<string>
}

export interface FinSupplierPageQuery extends FinSupplierQuery, PageQuery {}

/** @desc 查询供应商列表 */
export function listFinSupplier(query: FinSupplierPageQuery) {
  return http.get<PageRes<FinSupplierResp[]>>(BASE_URL, query)
}

/** @desc 查询供应商详情 */
export function getFinSupplier(id: string) {
  return http.get<FinSupplierDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增供应商 */
export function addFinSupplier(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改供应商 */
export function updateFinSupplier(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除供应商 */
export function deleteFinSupplier(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出供应商 */
export function exportFinSupplier(query: FinSupplierQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 查询供应商字典 */
export function listFinSupplierDict() {
  return http.get<LabelValueState[]>(`${BASE_URL}/dict`)
}
