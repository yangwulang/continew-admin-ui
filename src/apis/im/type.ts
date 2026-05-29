/** IM 模块类型定义 */

/** 会话类型 */
export type ConvType = 'P2P' | 'GROUP'

/** 消息内容类型 */
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'

/** 消息状态 */
export type MessageStatus = 'NORMAL' | 'RECALLED' | 'DELETED'

/** 群类型 */
export type GroupType = 'DEPT' | 'CUSTOM'

/** 成员角色 */
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'

/** 附件 */
export interface Attach {
  url?: string
  name?: string
  size?: number
  thumbUrl?: string
  mimeType?: string
}

/** 消息文档（与后端 ImMessage 对应） */
export interface ImMessageVO {
  id?: string
  msgId: number | string
  tenantId?: number | string
  convId: string
  convType: ConvType
  fromUserId: number | string
  targetId: number | string
  msgType: MessageType
  content?: string
  attach?: Attach
  quoteMsgId?: number | string
  mentions?: Array<number | string>
  status: MessageStatus
  serverTime: string
  clientSeq?: string
}

/** 会话文档 */
export interface ImConversationVO {
  id?: string
  tenantId?: number | string
  userId: number | string
  convId: string
  convType: ConvType
  targetId: number | string
  targetName?: string
  targetAvatar?: string
  lastMsgId?: number | string
  lastPreview?: string
  lastFromUserId?: number | string
  lastTime?: string
  unreadCount?: number
  pinned?: boolean
  muted?: boolean
  hidden?: boolean
  draft?: string
}

/** 群组 */
export interface ImGroupVO {
  id: number | string
  tenantId?: number | string
  name: string
  avatar?: string
  type: GroupType
  deptId?: number | string
  ownerId: number | string
  announcement?: string
  muteAll?: boolean
  status?: number
  createTime?: string
}

/** 发送消息请求 */
export interface ImMessageSendReq {
  convType: ConvType
  targetId: number | string
  msgType: MessageType
  content?: string
  attachUrl?: string
  attachName?: string
  attachSize?: number
  thumbUrl?: string
  mimeType?: string
  quoteMsgId?: number | string
  mentions?: Array<number | string>
  clientSeq?: string
}

/** 发送消息响应 */
export interface ImMessageSendResp {
  msgId: number | string
  convId: string
  serverTime: string
}

/** 创建群请求 */
export interface ImGroupCreateReq {
  name: string
  type?: GroupType
  deptId?: number | string
  memberIds: Array<number | string>
}

/** WebSocket 协议帧 */
export interface ImPacket<T = any> {
  op: number
  seq?: string
  data?: T
}

/** OpCode 常量 */
export const OpCode = {
  HEARTBEAT: 1,
  AUTH: 2,
  SEND_MSG: 1001,
  MSG_ACK: 1002,
  NEW_MSG: 1003,
  READ: 1010,
  READ_NOTIFY: 1011,
  RECALL: 1020,
  TYPING: 1030,
  PRESENCE: 1040,
  SYS_NOTIFY: 1900,
  ERROR: 1999,
} as const
