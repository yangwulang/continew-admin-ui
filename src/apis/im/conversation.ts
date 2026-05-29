import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/im/conversation'

/** @desc 查询当前用户会话列表 */
export function listImConversation() {
  return http.get<T.ImConversationVO[]>(`${BASE_URL}`)
}

/** @desc 置顶/取消置顶 */
export function pinImConversation(convId: string, pinned: boolean) {
  return http.post(`${BASE_URL}/${convId}/pin`, undefined, { params: { pinned } })
}

/** @desc 免打扰/取消 */
export function muteImConversation(convId: string, muted: boolean) {
  return http.post(`${BASE_URL}/${convId}/mute`, undefined, { params: { muted } })
}

/** @desc 删除会话（隐藏） */
export function hideImConversation(convId: string) {
  return http.post(`${BASE_URL}/${convId}/hide`)
}

/** @desc 清空未读 */
export function clearImUnread(convId: string) {
  return http.post(`${BASE_URL}/${convId}/clear-unread`)
}
