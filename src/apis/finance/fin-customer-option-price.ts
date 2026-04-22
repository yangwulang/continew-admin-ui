import http from '@/utils/http'

const BASE_URL = '/finance/fin-customer-option-price'

export interface FinCustomerOptionPriceResp {
  id: string
  customerId: string
  optionId: string
  priceMode: string
  price: number
  effectiveFrom: string
  effectiveTo: string
  customerName?: string
  optionName?: string
  createTime: string
}

export interface FinCustomerOptionPriceQuery {
  customerId?: string
  optionId?: string
  sort: Array<string>
}

export interface FinCustomerOptionPricePageQuery extends FinCustomerOptionPriceQuery, PageQuery {}

export function listFinCustomerOptionPrice(query: FinCustomerOptionPricePageQuery) {
  return http.get<PageRes<FinCustomerOptionPriceResp[]>>(BASE_URL, query)
}

export function getFinCustomerOptionPrice(id: string) {
  return http.get(`${BASE_URL}/${id}`)
}

export function addFinCustomerOptionPrice(data: any) {
  return http.post(BASE_URL, data)
}

export function updateFinCustomerOptionPrice(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deleteFinCustomerOptionPrice(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}
