import mitt from 'mitt'
import { type Ref, ref } from 'vue'
import type { ImPacket } from '@/apis/im/type'
import { OpCode } from '@/apis/im/type'
import { getToken } from '@/utils/auth'

/** IM 客户端事件总线类型 */
export interface ImEvents extends Record<string | symbol, unknown> {
  open: void
  close: void
  /** 收到任意业务帧 */
  packet: ImPacket
  /** 新消息推送（NEW_MSG） */
  newMsg: ImPacket
  /** 服务端 ACK（MSG_ACK） */
  msgAck: ImPacket
  /** 已读通知（READ_NOTIFY） */
  readNotify: ImPacket
  /** 撤回（RECALL） */
  recall: ImPacket
  /** 输入中（TYPING） */
  typing: ImPacket
  /** 在线状态（PRESENCE） */
  presence: ImPacket
  /** 系统通知（SYS_NOTIFY） */
  sysNotify: ImPacket
  /** 错误（ERROR） */
  error: ImPacket
}

const bus = mitt<ImEvents>()

let socket: WebSocket | null = null
let heartbeatTimer: number | null = null
let reconnectTimer: number | null = null
let reconnectAttempts = 0
const isConnected = ref(false)

/** 生成本地 deviceId（保留在 localStorage） */
const getDeviceId = () => {
  const KEY = 'IM_DEVICE_ID'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem(KEY, id)
  }
  return id
}

const stopHeartbeat = () => {
  if (heartbeatTimer != null) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

/** 启动心跳 */
const startHeartbeat = () => {
  stopHeartbeat()
  heartbeatTimer = window.setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ op: OpCode.HEARTBEAT }))
    }
  }, 25000)
}

/** 建立连接 */
const connect = (): void => {
  const token = getToken()
  if (!token) return
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  const base = import.meta.env.VITE_API_IM_WS_URL || 'ws://localhost:9100'
  const url = `${base}/im?token=${encodeURIComponent(token)}&deviceId=${encodeURIComponent(getDeviceId())}`

  socket = new WebSocket(url)

  socket.onopen = () => {
    isConnected.value = true
    reconnectAttempts = 0
    startHeartbeat()
    bus.emit('open')
  }

  socket.onmessage = (event) => {
    try {
      const packet = JSON.parse(event.data as string) as ImPacket
      bus.emit('packet', packet)
      switch (packet.op) {
        case OpCode.NEW_MSG:
          bus.emit('newMsg', packet)
          break
        case OpCode.MSG_ACK:
          bus.emit('msgAck', packet)
          break
        case OpCode.READ_NOTIFY:
          bus.emit('readNotify', packet)
          break
        case OpCode.RECALL:
          bus.emit('recall', packet)
          break
        case OpCode.TYPING:
          bus.emit('typing', packet)
          break
        case OpCode.PRESENCE:
          bus.emit('presence', packet)
          break
        case OpCode.SYS_NOTIFY:
          bus.emit('sysNotify', packet)
          break
        case OpCode.ERROR:
          bus.emit('error', packet)
          break
        default:
          break
      }
    } catch {
      // ignore parse error
    }
  }

  socket.onerror = (e) => {
    // 错误时一般紧跟 close，由 close 处理重连
    console.error('WebSocket error:', e)
  }

  socket.onclose = () => {
    isConnected.value = false
    stopHeartbeat()
    bus.emit('close')
    socket = null
    scheduleReconnect()
  }
}

/** 安排重连 */
function scheduleReconnect() {
  if (reconnectTimer != null) return
  const delay = Math.min(30000, 1000 * 2 ** Math.min(reconnectAttempts, 5))
  reconnectAttempts += 1
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    connect()
  }, delay)
}

/** 主动断开 */
const disconnect = () => {
  if (reconnectTimer != null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  reconnectAttempts = 0
  stopHeartbeat()
  if (socket) {
    socket.onclose = null
    try {
      socket.close()
    } catch {
      /* ignore */
    }
    socket = null
  }
  isConnected.value = false
}

/** 发送任意 Packet */
const send = <T = any>(packet: ImPacket<T>) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return false
  socket.send(JSON.stringify(packet))
  return true
}

/** 发送消息（走 WS 通道，更快返 ACK） */
const wsSendMessage = (params: {
  convType: 'P2P' | 'GROUP'
  targetId: number | string
  msgType: 'TEXT' | 'IMAGE' | 'FILE'
  content?: string
  attach?: { url?: string, name?: string, size?: number, thumbUrl?: string, mimeType?: string }
  quoteMsgId?: number | string
  mentions?: Array<number | string>
  clientSeq?: string
}) => {
  return send({
    op: OpCode.SEND_MSG,
    seq: params.clientSeq ?? `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    data: params,
  })
}

/** 已读上报（WS 通道） */
const wsReportRead = (convId: string, readMsgId: number | string) => {
  return send({
    op: OpCode.READ,
    data: { convId, readMsgId },
  })
}

/** 输入中（WS 通道） */
const wsTyping = (convId: string, targetId: number | string) => {
  return send({
    op: OpCode.TYPING,
    data: { convId, targetId },
  })
}

/**
 * useImSocket 单例 Hook
 */
export function useImSocket(): {
  isConnected: Ref<boolean>
  bus: typeof bus
  connect: () => void
  disconnect: () => void
  send: typeof send
  wsSendMessage: typeof wsSendMessage
  wsReportRead: typeof wsReportRead
  wsTyping: typeof wsTyping
} {
  return {
    isConnected,
    bus,
    connect,
    disconnect,
    send,
    wsSendMessage,
    wsReportRead,
    wsTyping,
  }
}
