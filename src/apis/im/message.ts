import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/im/message'

/** @desc 发送消息（REST 通道） */
export function sendImMessage(data: T.ImMessageSendReq) {
  return http.post<T.ImMessageSendResp>(`${BASE_URL}/send`, data)
}

/** @desc 拉取会话历史 */
export function listImMessage(convId: string, beforeMsgId?: number | string, size = 20) {
  return http.get<T.ImMessageVO[]>(`${BASE_URL}/${convId}/history`, { beforeMsgId, size })
}

/** @desc 撤回消息 */
export function recallImMessage(msgId: number | string) {
  return http.post(`${BASE_URL}/${msgId}/recall`)
}

/** @desc 上报已读 */
export function readImMessage(convId: string, readMsgId: number | string) {
  return http.post(`${BASE_URL}/${convId}/read`, undefined, { params: { readMsgId } })
}
