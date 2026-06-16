import http from '@/utils/http'

// ==================== 梯度定价规则 ====================

export interface PagePriceRuleResp {
  id: string
  ruleName: string
  minPages: number
  maxPages?: number
  unitPrice: number
  matchConfig?: string
  customerId?: string
  deptId?: string
  priority: number
  isActive: number
  remark?: string
  createTime: string
}

export interface PagePriceRuleReq {
  ruleName: string
  minPages: number
  maxPages?: number
  unitPrice: number
  matchConfig?: string
  customerId?: string
  deptId?: string
  priority?: number
  isActive?: number
  remark?: string
}

export function listPagePriceRules(customerId?: string, deptId?: string) {
  return http.get<PagePriceRuleResp[]>('/finance/page-price-rule', { customerId, deptId })
}

export function addPagePriceRule(data: PagePriceRuleReq) {
  return http.post<void>('/finance/page-price-rule', data)
}

export function updatePagePriceRule(id: string, data: PagePriceRuleReq) {
  return http.put<void>(`/finance/page-price-rule/${id}`, data)
}

export function deletePagePriceRule(id: string) {
  return http.del<void>(`/finance/page-price-rule/${id}`)
}

export function togglePagePriceRuleStatus(id: string, isActive: number) {
  return http.put<void>(`/finance/page-price-rule/${id}/status`, undefined, { params: { isActive } })
}

// ==================== 活动 ====================

export interface PromotionResp {
  id: string
  promoName: string
  startTime: string
  endTime: string
  isActive: number
  remark?: string
  createTime: string
}

export interface PromotionReq {
  promoName: string
  startTime: string
  endTime: string
  isActive?: number
  remark?: string
}

export function listPromotions() {
  return http.get<PromotionResp[]>('/finance/coupon/promotion/list')
}

export function addPromotion(data: PromotionReq) {
  return http.post<void>('/finance/coupon/promotion', data)
}

export function updatePromotion(id: string, data: PromotionReq) {
  return http.put<void>(`/finance/coupon/promotion/${id}`, data)
}

export function deletePromotion(id: string) {
  return http.del<void>(`/finance/coupon/promotion/${id}`)
}

export function togglePromotionStatus(id: string, isActive: number) {
  return http.put<void>(`/finance/coupon/promotion/${id}/status`, undefined, { params: { isActive } })
}

// ==================== 券模板 ====================

export interface CouponTemplateResp {
  id: string
  promotionId?: string
  templateName: string
  couponType: 'DISCOUNT' | 'REDUCE'
  discountRate?: number
  reduceAmount?: number
  minOrderAmount?: number
  totalCount?: number
  perUserLimit?: number
  validDays?: number
  expireTime?: string
  isActive: number
  remark?: string
  createTime: string
}

export interface CouponTemplateReq {
  promotionId?: string
  templateName: string
  couponType: 'DISCOUNT' | 'REDUCE'
  discountRate?: number
  reduceAmount?: number
  minOrderAmount?: number
  totalCount?: number
  perUserLimit?: number
  validDays?: number
  expireTime?: string
  isActive?: number
  remark?: string
}

export function listCouponTemplates(promotionId?: string) {
  return http.get<CouponTemplateResp[]>('/finance/coupon/template/list', { promotionId })
}

export function addCouponTemplate(data: CouponTemplateReq) {
  return http.post<void>('/finance/coupon/template', data)
}

export function updateCouponTemplate(id: string, data: CouponTemplateReq) {
  return http.put<void>(`/finance/coupon/template/${id}`, data)
}

export function deleteCouponTemplate(id: string) {
  return http.del<void>(`/finance/coupon/template/${id}`)
}

// ==================== 优惠券记录 ====================

export interface CouponRecordResp {
  id: string
  templateId: string
  couponCode: string
  customerId?: string
  status: 'UNUSED' | 'USED' | 'EXPIRED'
  usedOrderId?: string
  usedTime?: string
  expireTime: string
  createTime: string
}

export interface IssueCouponReq {
  templateId: string
  customerId?: string
  days?: number
}

export interface CouponCheckResult {
  valid: boolean
  message?: string
  discountAmount?: number
  finalAmount?: number
}

export function issueCoupon(data: IssueCouponReq) {
  return http.post<string>('/finance/coupon/issue', data)
}

export function claimCoupon(promotionId: string, customerId: string) {
  return http.post<string>('/finance/coupon/claim', { promotionId, customerId })
}

export function checkCoupon(couponCode: string, customerId?: string, orderAmount?: number) {
  return http.get<CouponCheckResult>('/finance/coupon/check', { couponCode, customerId, orderAmount })
}

export function listCoupons(templateId?: string, status?: string) {
  return http.get<CouponRecordResp[]>('/finance/coupon/list', { templateId, status })
}

export function listCustomerCoupons(customerId: string, status?: string) {
  return http.get<CouponRecordResp[]>('/finance/coupon/customer/list', { customerId, status })
}
