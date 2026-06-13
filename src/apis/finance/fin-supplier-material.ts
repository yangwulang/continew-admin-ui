import http from '@/utils/http'

const BASE_URL = '/finance/fin-supplier-material'

export interface FinSupplierMaterialResp {
  id: string
  supplierId: string
  supplierName: string
  materialId: string
  materialName: string
  supplierPrice: number
  ourPrice: number
  remark: string
  createTime: string
}

export interface FinSupplierMaterialDetailResp extends FinSupplierMaterialResp {}

export interface FinSupplierMaterialQuery {
  supplierId?: string
  materialId?: string
  sort: Array<string>
}

export interface FinSupplierMaterialPageQuery extends FinSupplierMaterialQuery, PageQuery {}

/** @desc 查询供应商物料价格列表 */
export function listFinSupplierMaterial(query: FinSupplierMaterialPageQuery) {
  return http.get<PageRes<FinSupplierMaterialResp[]>>(BASE_URL, query)
}

/** @desc 查询供应商物料价格详情 */
export function getFinSupplierMaterial(id: string) {
  return http.get<FinSupplierMaterialDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增供应商物料价格 */
export function addFinSupplierMaterial(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改供应商物料价格 */
export function updateFinSupplierMaterial(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除供应商物料价格 */
export function deleteFinSupplierMaterial(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}
