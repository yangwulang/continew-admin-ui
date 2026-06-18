import http from '@/utils/http'

const BASE_URL = '/finance/fin-print-order'

// ===== 订单响应类型 =====

export interface PrintOrderResp {
  id: string
  orderNo: string
  customerId: number
  customerName?: string
  projectName?: string
  totalAmount: number
  status: string
  printStatus?: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'PARTIAL_FAILED' | 'FAILED'
  billingRecordId?: number
  remark?: string
  createTime?: string
  // 支付相关字段
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'BILLING'
  balancePaid: number
  thirdPartyPaid: number
  payChannel?: string
  expireTime?: string
}

export interface PrintOrderDetailResp extends PrintOrderResp {
  createUser?: string
  updateUser?: string
  updateTime?: string
}

export interface PrintOrderQuery {
  status?: string
  printStatus?: string
  customerId?: string
  sort: Array<string>
}

export interface PrintOrderPageQuery extends PrintOrderQuery, PageQuery {}

// ===== 订单文件项 =====

export interface PrintOrderItemResp {
  id: string
  orderId: string
  fileUrl: string
  fileName: string
  pageCount: number
  copies: number
  subtotalAmount: number
  sort: number
  printStatus?: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED'
  createTime?: string
}

// ===== 打印属性相关 =====

export interface PrintAttributeOptionItem {
  id: number
  name: string
  code: string
  priceMode: string
  price: number
  isDefault: boolean
  sort: number
}

export interface PrintAttributeWithOptions {
  id: number
  name: string
  code: string
  inputType: string
  isRequired: boolean
  sort: number
  options: PrintAttributeOptionItem[]
}

// ===== 价格计算（多文件） =====

export interface PrintPriceItemReq {
  fileName: string
  optionIds: Array<number>
  pageCount: number
  copies: number
}

export interface PrintPriceCalculateReq {
  customerId?: number
  deptId?: number
  items: Array<PrintPriceItemReq>
  couponCode?: string
  couponRecordIds?: number[]
}

export interface PriceDetail {
  attributeName: string
  optionName: string
  priceMode: string
  price: number
  calculatedAmount: number
}

export interface ItemPriceResult {
  fileName: string
  perPageSum: number
  pageCost: number
  multipliedCost: number
  fixedSum: number
  subtotalAmount: number
  details: Array<PriceDetail>
}

export interface PrintPriceCalculateResp {
  totalAmount: number
  items: Array<ItemPriceResult>
  discountAmount?: number
  finalAmount?: number
  couponDetails?: CouponDiscountDetail[]
}

export interface CouponDiscountDetail {
  recordId: number
  templateId: number
  templateName: string
  couponType: string
  discountAmount: number
}

// ===== 文件上传 =====

export interface PrintFileUploadResp {
  fileUrl: string
  fileName: string
  pageCount: number
}

// ===== 创建订单响应 =====

export interface PrintOrderCreateResp {
  orderId: string
  orderNo: string
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'BILLING'
  totalAmount: number
  balancePaid: number
  remainAmount: number
  billingCustomer?: boolean
}

// ===== 三方支付响应 =====

export interface PrintPaymentInitResp {
  qrCodeUrl: string
  payUrl: string
  outTradeNo: string
  amount: number
  expireTime: string
  channel: string
}

// ===== 创建订单（多文件） =====

export interface PrintOrderItemCreateReq {
  fileUrl: string
  fileName: string
  pageCount: number
  copies: number
  optionIds: Array<number>
}

export interface PrintOrderCreateReq {
  customerId: number
  projectName?: string
  deptId?: number
  items: Array<PrintOrderItemCreateReq>
  remark?: string
  couponCode?: string
  couponRecordIds?: number[]
}

// ===== 聚合详情类型 =====

export interface PrintOrderOptionDetail {
  id: string
  attributeName: string
  optionName: string
  priceMode: string
  price: number
  calculatedAmount: number
}

export interface PrintOrderItemWithOptions {
  id: string
  fileUrl: string
  fileName: string
  pageCount: number
  copies: number
  subtotalAmount: number
  sort: number
  printStatus?: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED'
  options: PrintOrderOptionDetail[]
}

export interface OrderCouponDetail {
  recordId: number
  templateId: number
  templateName: string
  couponType: string
  discountRate?: number
  reduceAmount?: number
  discountAmount: number
}

export interface PrintOrderFullDetailResp {
  id: string
  orderNo: string
  customerId: number
  customerName?: string
  projectName?: string
  totalAmount: number
  status: string
  printStatus?: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'PARTIAL_FAILED' | 'FAILED'
  billingRecordId?: number
  remark?: string
  createTime?: string
  updateTime?: string
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'BILLING'
  balancePaid: number
  thirdPartyPaid: number
  payChannel?: string
  expireTime?: string
  couponCode?: string
  discountAmount?: number
  originalAmount?: number
  couponDetails?: OrderCouponDetail[]
  items: PrintOrderItemWithOptions[]
}

// ===== API 函数 =====

export function listPrintOrder(query: PrintOrderPageQuery) {
  return http.get<PageRes<PrintOrderResp[]>>(BASE_URL, query)
}

export function getPrintOrder(id: string) {
  return http.get<PrintOrderDetailResp>(`${BASE_URL}/${id}`)
}

export function getPrintOrderFullDetail(id: string) {
  return http.get<PrintOrderFullDetailResp>(`${BASE_URL}/${id}/detail`)
}

export function deletePrintOrder(ids: Array<string>) {
  return http.del(BASE_URL, { ids })
}

/** 上传文件并检测页数 */
export function uploadPrintFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return http.post<PrintFileUploadResp>(`${BASE_URL}/upload`, formData)
}

/** 计算打印价格（多文件） */
export function calculatePrintPrice(data: PrintPriceCalculateReq) {
  return http.post<PrintPriceCalculateResp>(`${BASE_URL}/calculate`, data)
}

/** 创建打印订单（多文件） */
export function createPrintOrder(data: PrintOrderCreateReq) {
  return http.post<PrintOrderCreateResp>(`${BASE_URL}/create`, data)
}

/** 发起三方支付 */
export function initiatePayment(id: string, channel: string) {
  return http.post<PrintPaymentInitResp>(`${BASE_URL}/${id}/initiate-payment`, {}, { params: { channel } })
}

/** 轮询支付状态 */
export function queryPaymentStatus(id: string) {
  return http.get<string>(`${BASE_URL}/${id}/payment-status`)
}

/** 获取所有启用的打印属性和选项 */
export function listPrintAttributes() {
  return http.get<PrintAttributeWithOptions[]>(`${BASE_URL}/attributes`)
}

// ===== 订单文件项 API =====

const ORDER_ITEM_URL = '/finance/fin-print-order-item'

export interface PrintOrderItemQuery extends PageQuery {
  orderId?: string
  sort: Array<string>
}

export function listPrintOrderItems(query: PrintOrderItemQuery) {
  return http.get<PageRes<PrintOrderItemResp[]>>(ORDER_ITEM_URL, query)
}

// ===== 订单选项明细 API =====

const ORDER_OPTION_URL = '/finance/fin-print-order-option'

export interface PrintOrderOptionResp {
  id: string
  itemId: string
  attributeId: string
  attributeName: string
  optionId: string
  optionName: string
  priceMode: string
  price: number
  calculatedAmount: number
}

export interface PrintOrderOptionQuery extends PageQuery {
  itemId?: string
  sort: Array<string>
}

export function listPrintOrderOptions(query: PrintOrderOptionQuery) {
  return http.get<PageRes<PrintOrderOptionResp[]>>(ORDER_OPTION_URL, query)
}

export function updateItemPrintStatus(itemId: string, status: string) {
  return http.put<void>(`${BASE_URL}/items/${itemId}/print-status`, undefined, { params: { status } })
}

export function syncOrderPrintStatus(id: string) {
  return http.post<void>(`${BASE_URL}/${id}/sync-print-status`)
}
