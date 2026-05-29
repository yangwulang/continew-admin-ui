/**
 * 数据大屏 Mock 数据
 * 后续接入真实接口时只需替换 useScreenData 的实现即可
 */
import { ref } from 'vue'

export interface KpiItem {
  key: string
  label: string
  value: number
  unit?: string
  delta?: number // 同比/环比
  icon: string
}

export interface ScrollOrder {
  no: string
  customer: string
  amount: number
  status: string
  time: string
}

export interface FeedItem {
  id: string
  user: string
  preview: string
  time: string
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

/** 头部 KPI */
export function buildKpis(): KpiItem[] {
  return [
    { key: 'order', label: '今日打印订单', value: rand(120, 260), unit: '单', delta: rand(-5, 18), icon: 'icon-printer' },
    { key: 'amount', label: '今日记账金额', value: rand(8000, 38000), unit: '元', delta: rand(-3, 22), icon: 'icon-cloud' },
    { key: 'spide', label: '今日采集影视', value: rand(20, 90), unit: '部', delta: rand(0, 30), icon: 'icon-video-camera' },
    { key: 'im', label: 'IM 在线人数', value: rand(15, 80), unit: '人', delta: rand(-2, 12), icon: 'icon-message' },
  ]
}

/** 业务趋势：近 7 天各业务量 */
export function buildTrend() {
  const days = Array.from({ length: 7 }, (_, i) => `${7 - i}日前`).reverse()
  return {
    days,
    order: days.map(() => rand(80, 280)),
    amount: days.map(() => rand(5000, 30000)),
    spide: days.map(() => rand(10, 90)),
  }
}

/** 业务结构占比（饼图） */
export function buildShare() {
  return [
    { name: '打印订单', value: rand(120, 260) },
    { name: '财务记账', value: rand(80, 200) },
    { name: '影视采集', value: rand(40, 160) },
    { name: 'IM 通讯', value: rand(60, 180) },
  ]
}

/** IM 在线趋势：近 24 小时 */
export function buildOnline() {
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  return {
    hours,
    values: hours.map(() => rand(10, 90)),
  }
}

/** 影视采集 Top 来源 */
export function buildSpideTop() {
  const sources = ['优酷', '腾讯视频', '爱奇艺', 'B 站', '芒果 TV', '搜狐']
  return sources
    .map((s) => ({ name: s, value: rand(20, 200) }))
    .sort((a, b) => b.value - a.value)
}

/** 财务收支对比（近 6 个月） */
export function buildFinance() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月']
  return {
    months,
    income: months.map(() => rand(20000, 80000)),
    expense: months.map(() => rand(10000, 50000)),
  }
}

/** 实时订单滚动 */
export function buildOrders(): ScrollOrder[] {
  const customers = ['张先生', '李总', '王经理', '赵设计', '陈老师', '林老板', '蓝海科技', '远方文化']
  const statuses = ['待打印', '打印中', '已完成', '已对账']
  return Array.from({ length: 8 }, (_, i) => ({
    no: `PO${Date.now().toString().slice(-6)}${i}`,
    customer: customers[rand(0, customers.length - 1)],
    amount: rand(50, 1500),
    status: statuses[rand(0, statuses.length - 1)],
    time: new Date(Date.now() - rand(0, 3600 * 1000 * 5)).toLocaleTimeString('zh-CN', { hour12: false }),
  }))
}

/** IM 消息流 */
export function buildFeeds(): FeedItem[] {
  const users = ['客服小红', '运营小王', '设计师张', '财务李姐', '销售陈', '技术老刘']
  const previews = ['您好，请问订单 PO123 的进度？', '今日对账已上传', '@all 周会改到下午', '客户反馈打印质量很好', '请审核合同附件', '系统升级公告']
  return Array.from({ length: 6 }, (_, i) => ({
    id: `${Date.now()}-${i}`,
    user: users[rand(0, users.length - 1)],
    preview: previews[rand(0, previews.length - 1)],
    time: new Date(Date.now() - rand(0, 3600 * 1000)).toLocaleTimeString('zh-CN', { hour12: false }),
  }))
}

/** 一键聚合 */
export function useScreenData() {
  const kpis = ref(buildKpis())
  const trend = ref(buildTrend())
  const share = ref(buildShare())
  const online = ref(buildOnline())
  const spideTop = ref(buildSpideTop())
  const finance = ref(buildFinance())
  const orders = ref(buildOrders())
  const feeds = ref(buildFeeds())

  function refresh() {
    kpis.value = buildKpis()
    online.value = buildOnline()
    orders.value = buildOrders()
    feeds.value = buildFeeds()
  }

  function refreshAll() {
    kpis.value = buildKpis()
    trend.value = buildTrend()
    share.value = buildShare()
    online.value = buildOnline()
    spideTop.value = buildSpideTop()
    finance.value = buildFinance()
    orders.value = buildOrders()
    feeds.value = buildFeeds()
  }

  return { kpis, trend, share, online, spideTop, finance, orders, feeds, refresh, refreshAll }
}
