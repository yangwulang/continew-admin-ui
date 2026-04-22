import http from '@/utils/http'

const BASE_URL = '/finance/fin-dept-material-price'

export interface FinDeptMaterialPriceResp {
  id: string
  deptId: string
  materialId: string
  unitPrice: number
  effectiveFrom: string
  effectiveTo: string
  deptName?: string
  materialName?: string
  createTime: string
}

export interface FinDeptMaterialPriceDetailResp extends FinDeptMaterialPriceResp {}

export interface FinDeptMaterialPriceQuery {
  deptId?: string
  materialId?: string
  sort: Array<string>
}

export interface FinDeptMaterialPricePageQuery extends FinDeptMaterialPriceQuery, PageQuery {}

/** @desc 查询部门物料价格列表 */
export function listFinDeptMaterialPrice(query: FinDeptMaterialPricePageQuery) {
  return http.get<PageRes<FinDeptMaterialPriceResp[]>>(BASE_URL, query)
}

/** @desc 查询部门物料价格详情 */
export function getFinDeptMaterialPrice(id: string) {
  return http.get<FinDeptMaterialPriceDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增部门物料价格 */
export function addFinDeptMaterialPrice(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改部门物料价格 */
export function updateFinDeptMaterialPrice(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除部门物料价格 */
export function deleteFinDeptMaterialPrice(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}
