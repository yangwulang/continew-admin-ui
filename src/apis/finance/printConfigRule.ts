import http from '@/utils/http'

const BASE_URL = '/finance/print-config-rule'

/**
 * 获取指定属性的可用选项
 */
export function getAvailableOptions(attributeCode: string, currentAttributes?: Record<string, any>, customerId?: string, deptId?: string) {
  const params = new URLSearchParams({ attributeCode })
  if (customerId) params.append('customerId', customerId)
  if (deptId) params.append('deptId', deptId)
  return http.post<string[]>(`${BASE_URL}/available-options?${params.toString()}`, currentAttributes)
}

/**
 * 验证配置组合
 */
export function validatePrintConfig(attributes: Record<string, any>, customerId?: string, deptId?: string) {
  const params: Record<string, string> = {}
  if (customerId) {
    params.customerId = customerId
  }
  if (deptId) {
    params.deptId = deptId
  }
  return http.post(`${BASE_URL}/validate`, attributes, { params })
}

/**
 * 计算价格
 */
export function calculatePrintPrice(attributes: Record<string, any>) {
  return http.post<number>(`${BASE_URL}/calculate-price`, attributes)
}

// ========== 约束规则 CRUD ==========

/** 条件项 */
export interface ConditionItem {
  attributeCode: string
  operator: string
  value: string
}

export interface PrintConstraintResp {
  id: string
  name: string
  ruleType: string
  condAttributeCode: string
  condOperator: string
  condValue: string
  condLogic: string | null
  conditions: ConditionItem[] | null
  targetAttributeCode: string
  targetOptionCodes: string
  surchargeAmount: number | null
  surchargeMode: string | null
  errorMessage: string
  priority: number
  isActive: number
  customerId: string | null
  deptId: string | null
  createTime: string
}

export interface PrintConstraintReq {
  name: string
  ruleType: string
  condAttributeCode?: string
  condOperator?: string
  condValue?: string
  condLogic?: string | null
  conditions?: ConditionItem[] | null
  targetAttributeCode: string
  targetOptionCodes: string
  surchargeAmount?: number | null
  surchargeMode?: string | null
  errorMessage?: string
  priority?: number
  isActive?: number
  customerId?: string | null
  deptId?: string | null
}

/** 查询约束规则列表 */
export function listPrintConstraints() {
  return http.get<PrintConstraintResp[]>(`${BASE_URL}/rules`)
}

/** 新增约束规则 */
export function addPrintConstraint(data: PrintConstraintReq) {
  return http.post(`${BASE_URL}/rules`, data)
}

/** 修改约束规则 */
export function updatePrintConstraint(id: string, data: PrintConstraintReq) {
  return http.put(`${BASE_URL}/rules/${id}`, data)
}

/** 删除约束规则 */
export function deletePrintConstraint(id: string) {
  return http.del(`${BASE_URL}/rules/${id}`)
}

/** 切换规则启用状态 */
export function togglePrintConstraintStatus(id: string, isActive: number) {
  return http.put(`${BASE_URL}/rules/${id}/status`, null, { params: { isActive } })
}

/** 规则测试结果 */
export interface RuleTestResult {
  valid: boolean
  violations: string[]
  surcharge: number
  availableOptions: Record<string, string[]>
}

/** 测试规则 */
export function testRules(attributes: Record<string, any>, pageCount: number = 1, customerId?: string, deptId?: string) {
  const params = new URLSearchParams({ pageCount: String(pageCount) })
  if (customerId) params.append('customerId', customerId)
  if (deptId) params.append('deptId', deptId)
  return http.post<RuleTestResult>(`${BASE_URL}/test?${params.toString()}`, attributes)
}

// ========== 联动价格（组合定价） CRUD ==========

/** 联动价格 */
export interface ComboPriceResp {
  id: string
  optionId: string
  comboOptionId: string
  priceMode: string
  price: number
  customerId: string | null
  deptId: string | null
}

export interface ComboPriceReq {
  optionId: string
  comboOptionId: string
  priceMode: string
  price: number
  customerId?: string | null
  deptId?: string | null
}

/** 查询联动价格列表 */
export function listComboPrices(optionId?: string, comboOptionId?: string) {
  const params: Record<string, string> = {}
  if (optionId) params.optionId = optionId
  if (comboOptionId) params.comboOptionId = comboOptionId
  return http.get<ComboPriceResp[]>(`${BASE_URL}/combo-prices`, params)
}

/** 新增联动价格 */
export function addComboPrice(data: ComboPriceReq) {
  return http.post(`${BASE_URL}/combo-prices`, data)
}

/** 修改联动价格 */
export function updateComboPrice(id: string, data: ComboPriceReq) {
  return http.put(`${BASE_URL}/combo-prices/${id}`, data)
}

/** 删除联动价格 */
export function deleteComboPrice(id: string) {
  return http.del(`${BASE_URL}/combo-prices/${id}`)
}
