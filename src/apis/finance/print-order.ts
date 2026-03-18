import http from '@/utils/http'

const BASE_URL = '/finance/fin-print-order'

// ===== 订单响应类型 =====

export interface PrintOrderResp {
  id: string
  orderNo: string
  customerId: number
  totalAmount: number
  status: string
  billingRecordId?: number
  remark?: string
  createTime?: string
}

export interface PrintOrderDetailResp extends PrintOrderResp {
  createUser?: string
  updateUser?: string
  updateTime?: string
}

export interface PrintOrderQuery {
  status?: string
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
  items: Array<PrintPriceItemReq>
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
}

// ===== 文件上传 =====

export interface PrintFileUploadResp {
  fileUrl: string
  fileName: string
  pageCount: number
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
  items: Array<PrintOrderItemCreateReq>
  remark?: string
}

// ===== API 函数 =====

export function listPrintOrder(query: PrintOrderPageQuery) {
  return http.get<PageRes<PrintOrderResp[]>>(BASE_URL, query)
}

export function getPrintOrder(id: string) {
  return http.get<PrintOrderDetailResp>(`${BASE_URL}/${id}`)
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
  return http.post<number>(`${BASE_URL}/create`, data)
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
