import http from '@/utils/http'

const BASE_URL = '/finance/fin-billing-record'

export interface FinBillingRecordResp {
  id: string
  customerId: string
  billingDate: string
  totalAmount: number
  status: string
  signUrl?: string
  signedAt?: string
  reviewedAt?: string
}

export interface FinBillingRecordDetailResp extends FinBillingRecordResp {
  createUser?: string
  createTime?: string
  updateUser?: string
  updateTime?: string
}

export interface FinBillingRecordQuery {
  customerId?: string
  status?: string
  sort: Array<string>
}

export interface FinBillingRecordPageQuery extends FinBillingRecordQuery, PageQuery {}

export interface FinBillingCreateItemReq {
  materialId: string
  quantity: number
  unitPrice?: number
  remark?: string
}

export interface FinBillingCreateReq {
  customerId: string
  billingDate: string
  items: FinBillingCreateItemReq[]
}

export interface FinBillingSignReq {
  signImageUrl: string
  signClientIp?: string
}

export interface FinBillingApproveReq {
  approved: boolean
  reviewRemark?: string
}

export function listFinBillingRecord(query: FinBillingRecordPageQuery) {
  return http.get<PageRes<FinBillingRecordResp[]>>(BASE_URL, query)
}

export function getFinBillingRecord(id: string) {
  return http.get<FinBillingRecordDetailResp>(`${BASE_URL}/${id}`)
}

export function addFinBillingRecordWithItems(data: FinBillingCreateReq) {
  return http.post(`${BASE_URL}/with-items`, data)
}

export function generateFinBillingSignLink(id: string) {
  return http.post<string>(`${BASE_URL}/${id}/sign-link`)
}

export function signFinBillingRecord(id: string, data: FinBillingSignReq) {
  return http.post(`${BASE_URL}/${id}/sign`, data)
}

export function approveFinBillingRecord(id: string, data: FinBillingApproveReq) {
  return http.post(`${BASE_URL}/${id}/approve`, data)
}
