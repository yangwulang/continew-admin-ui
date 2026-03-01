import http from '@/utils/http'

const BASE_URL = '/finance/fin-customer'

export interface FinCustomerResp {
  id: string
  userId: string
  username: string
  nickname: string
  phone: string
  email: string
  enablePrepaid: boolean
  allowNegativeBalance: boolean
  remark: string
  createTime: string
}

export interface FinCustomerDetailResp extends FinCustomerResp {}

export interface FinCustomerQuery {
  username?: string
  sort: Array<string>
}

export interface FinCustomerPageQuery extends FinCustomerQuery, PageQuery {}

export function listFinCustomer(query: FinCustomerPageQuery) {
  return http.get<PageRes<FinCustomerResp[]>>(BASE_URL, query)
}

export function getFinCustomer(id: string) {
  return http.get<FinCustomerDetailResp>(`${BASE_URL}/${id}`)
}

export interface FinCustomerCreateReq {
  userId: string
  enablePrepaid: boolean
  allowNegativeBalance: boolean
  remark?: string
}

export function addFinCustomer(data: FinCustomerCreateReq) {
  return http.post(BASE_URL, data)
}

export function updateFinCustomer(data: Partial<FinCustomerCreateReq>, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deleteFinCustomer(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}
