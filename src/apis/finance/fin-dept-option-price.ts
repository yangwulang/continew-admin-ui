import http from '@/utils/http'

const BASE_URL = '/finance/fin-dept-option-price'

export interface FinDeptOptionPriceResp {
  id: string
  deptId: string
  optionId: string
  priceMode: string
  price: number
  effectiveFrom: string
  effectiveTo: string
  deptName?: string
  optionName?: string
  createTime: string
}

export interface FinDeptOptionPriceQuery {
  deptId?: string
  optionId?: string
  sort: Array<string>
}

export interface FinDeptOptionPricePageQuery extends FinDeptOptionPriceQuery, PageQuery {}

export function listFinDeptOptionPrice(query: FinDeptOptionPricePageQuery) {
  return http.get<PageRes<FinDeptOptionPriceResp[]>>(BASE_URL, query)
}

export function getFinDeptOptionPrice(id: string) {
  return http.get(`${BASE_URL}/${id}`)
}

export function addFinDeptOptionPrice(data: any) {
  return http.post(BASE_URL, data)
}

export function updateFinDeptOptionPrice(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deleteFinDeptOptionPrice(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}
