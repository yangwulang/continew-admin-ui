import http from '@/utils/http'
import type { LabelValueState } from '@/types/global'

const BASE_URL = '/finance/fin-customer-address'

export interface FinCustomerAddressResp {
  id: string
  customerId: string
  contactName: string
  contactPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  longitude?: number
  latitude?: number
  isDefault: boolean
  remark?: string
  customerName: string
  createTime: string
}

export interface FinCustomerAddressDetailResp extends FinCustomerAddressResp {
  createUser?: string
  createUserString?: string
  updateTime?: string
  updateUserString?: string
}

export interface FinCustomerAddressQuery {
  customerId?: string
  contactName?: string
  sort: Array<string>
}

export interface FinCustomerAddressPageQuery extends FinCustomerAddressQuery, PageQuery {}

/** @desc 查询客户地址列表 */
export function listFinCustomerAddress(query: FinCustomerAddressPageQuery) {
  return http.get<PageRes<FinCustomerAddressResp[]>>(BASE_URL, query)
}

/** @desc 查询客户地址详情 */
export function getFinCustomerAddress(id: string) {
  return http.get<FinCustomerAddressDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增客户地址 */
export function addFinCustomerAddress(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改客户地址 */
export function updateFinCustomerAddress(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除客户地址 */
export function deleteFinCustomerAddress(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出客户地址 */
export function exportFinCustomerAddress(query: FinCustomerAddressQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 设为默认地址 */
export function setDefaultAddress(id: string) {
  return http.put(`${BASE_URL}/${id}/default`)
}

/** @desc 查询客户地址字典 */
export function listFinCustomerAddressDict(query?: FinCustomerAddressQuery) {
  return http.get<LabelValueState[]>(`${BASE_URL}/dict`, query)
}
