import http from '@/utils/http'

const BASE_URL = '/finance/fin-billing-item'

export interface FinBillingItemResp {
  id: string
  billingRecordId: string
  itemType: string
  printOrderId: string | null
  materialId: string | null
  materialName: string
  unitPrice: number
  quantity: number
  amount: number
  remark: string
  createTime: string
}

export interface FinBillingItemQuery {
  billingRecordId?: string
  sort: Array<string>
}

export interface FinBillingItemPageQuery extends FinBillingItemQuery, PageQuery {}

/** @desc 查询记账明细列表 */
export function listFinBillingItem(query: FinBillingItemPageQuery) {
  return http.get<PageRes<FinBillingItemResp[]>>(BASE_URL, query)
}

/** @desc 查询记账明细详情 */
export function getFinBillingItem(id: string) {
  return http.get<FinBillingItemResp>(`${BASE_URL}/${id}`)
}
