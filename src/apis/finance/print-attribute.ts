import http from '@/utils/http'

const BASE_URL = '/finance/fin-print-attribute'

export interface PrintAttributeResp {
  id: string
  name: string
  code: string
  inputType: string
  isRequired: boolean
  sort: number
  status: number
  createTime?: string
}

export interface PrintAttributeQuery {
  sort: Array<string>
}

export interface PrintAttributePageQuery extends PrintAttributeQuery, PageQuery {}

export interface PrintAttributeReq {
  name: string
  code: string
  inputType: string
  isRequired: boolean
  sort: number
  status: number
}

export function listPrintAttribute(query: PrintAttributePageQuery) {
  return http.get<PageRes<PrintAttributeResp[]>>(BASE_URL, query)
}

export function getPrintAttribute(id: string) {
  return http.get<PrintAttributeResp>(`${BASE_URL}/${id}`)
}

export function addPrintAttribute(data: PrintAttributeReq) {
  return http.post(BASE_URL, data)
}

export function updatePrintAttribute(data: PrintAttributeReq, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deletePrintAttribute(ids: string[]) {
  return http.del(BASE_URL, { ids })
}
