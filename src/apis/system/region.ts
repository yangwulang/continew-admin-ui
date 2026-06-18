import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/system/region'

/** @desc 查询子区域列表(懒加载) */
export function listRegionChildren(parentId: string | number) {
  return http.get<T.RegionResp[]>(`${BASE_URL}/children`, { parentId })
}

/** @desc 查询区域树列表 */
export function listRegion(query: T.RegionQuery) {
  return http.get<T.RegionResp[]>(`${BASE_URL}/tree`, query)
}

/** @desc 查询区域详情 */
export function getRegion(id: string) {
  return http.get<T.RegionResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增区域 */
export function addRegion(data: any) {
  return http.post<boolean>(`${BASE_URL}`, data)
}

/** @desc 修改区域 */
export function updateRegion(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除区域 */
export function deleteRegion(id: string) {
  return http.del(`${BASE_URL}`, { ids: [id] })
}

/** @desc 导出区域 */
export function exportRegion(query: T.RegionQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 查询区域字典树 */
export function listRegionDictTree(query: { description: string | unknown }) {
  return http.get<T.RegionResp[]>(`${BASE_URL}/dict/tree`, query)
}
