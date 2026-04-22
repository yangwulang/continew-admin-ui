import http from '@/utils/http'

const BASE_URL = '/finance/fin-customer-material-price'

export interface FinCustomerMaterialPriceResp {
  id: string
  customerId: string
  materialId: string
  unitPrice: number
  effectiveFrom: string
  effectiveTo: string
  customerName?: string
  materialName?: string
  createTime: string
}

export interface FinCustomerMaterialPriceDetailResp extends FinCustomerMaterialPriceResp {}

export interface FinCustomerMaterialPriceQuery {
  customerId?: string
  materialId?: string
  sort: Array<string>
}

export interface FinCustomerMaterialPricePageQuery extends FinCustomerMaterialPriceQuery, PageQuery {}

/** @desc 查询客户物料价格列表 */
export function listFinCustomerMaterialPrice(query: FinCustomerMaterialPricePageQuery) {
  return http.get<PageRes<FinCustomerMaterialPriceResp[]>>(BASE_URL, query)
}

/** @desc 查询客户物料价格详情 */
export function getFinCustomerMaterialPrice(id: string) {
  return http.get<FinCustomerMaterialPriceDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增客户物料价格 */
export function addFinCustomerMaterialPrice(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改客户物料价格 */
export function updateFinCustomerMaterialPrice(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除客户物料价格 */
export function deleteFinCustomerMaterialPrice(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}
