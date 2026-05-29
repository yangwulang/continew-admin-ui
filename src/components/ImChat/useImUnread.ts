import { ref } from 'vue'

/**
 * 全局 IM 未读消息总数
 * - ImChat 组件根据自身 conversations 同步写入
 * - 顶部导航栏消息按钮通过角标读取展示
 */
export const unreadTotal = ref(0)

export function setImUnreadTotal(n: number) {
  unreadTotal.value = Math.max(0, n)
}
