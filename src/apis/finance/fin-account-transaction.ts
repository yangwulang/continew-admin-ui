import http from '@/utils/http'

const BASE_URL = '/finance/fin-account-transaction'

export interface FinAccountTransactionResp {
  id: string
  customerId: string
  type: string
  direction: string
  amount: number
  balanceAfter: number
  channel?: string
  status: string
  occurTime: string
  remark?: string
}

export interface FinAccountTransactionDetailResp extends FinAccountTransactionResp {}

export interface FinAccountTransactionQuery {
  customerId?: string
  type?: string
  status?: string
  sort: Array<string>
}

export interface FinAccountTransactionPageQuery extends FinAccountTransactionQuery, PageQuery {}

export interface FinRechargeReq {
  customerId: string
  amount: number
  channel?: string
  remark?: string
}

export function listFinAccountTransaction(query: FinAccountTransactionPageQuery) {
  return http.get<PageRes<FinAccountTransactionResp[]>>(BASE_URL, query)
}

export function getFinAccountTransaction(id: string) {
  return http.get<FinAccountTransactionDetailResp>(`${BASE_URL}/${id}`)
}

export function rechargeFinAccount(data: FinRechargeReq) {
  return http.post<number>(`${BASE_URL}/recharge`, data)
}
