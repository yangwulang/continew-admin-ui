import http from '@/utils/http'

const BASE_URL = '/finance/fin-print-attribute-option'

export interface PrintAttributeOptionResp {
  id: string
  attributeId: string
  name: string
  code: string
  priceMode: string
  price: number
  isDefault: boolean
  sort: number
  status: number
  createTime?: string
}

export interface PrintAttributeOptionQuery {
  attributeId?: string
  sort: Array<string>
}

export interface PrintAttributeOptionPageQuery extends PrintAttributeOptionQuery, PageQuery {}

export interface PrintAttributeOptionReq {
  attributeId: string
  name: string
  code: string
  priceMode: string
  price: number
  isDefault: boolean
  sort: number
  status: number
}

export function listPrintAttributeOption(query: PrintAttributeOptionPageQuery) {
  return http.get<PageRes<PrintAttributeOptionResp[]>>(BASE_URL, query)
}

export function addPrintAttributeOption(data: PrintAttributeOptionReq) {
  return http.post(BASE_URL, data)
}

export function updatePrintAttributeOption(data: PrintAttributeOptionReq, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

export function deletePrintAttributeOption(ids: string[]) {
  return http.del(BASE_URL, { ids })
}
