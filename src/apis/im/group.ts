import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/im/group'

/** @desc 创建群组 */
export function createImGroup(data: T.ImGroupCreateReq) {
  return http.post<{ groupId: number | string }>(`${BASE_URL}`, data)
}

/** @desc 群详情 */
export function getImGroup(groupId: number | string) {
  return http.get<T.ImGroupVO>(`${BASE_URL}/${groupId}`)
}

/** @desc 群成员 ID 列表 */
export function listImGroupMembers(groupId: number | string) {
  return http.get<Array<number | string>>(`${BASE_URL}/${groupId}/members`)
}

/** @desc 邀请成员 */
export function inviteImGroupMembers(groupId: number | string, userIds: Array<number | string>) {
  return http.post(`${BASE_URL}/${groupId}/invite`, userIds)
}

/** @desc 移除成员（仅群主） */
export function kickImGroupMembers(groupId: number | string, userIds: Array<number | string>) {
  return http.post(`${BASE_URL}/${groupId}/kick`, userIds)
}
