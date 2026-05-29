<template>
  <div class="screen">
    <!-- 顶部 -->
    <header class="screen__header">
      <div class="header__decor left" />
      <div class="header__title">
        <span class="title-text">智能业务运营中心 · 数据大屏</span>
        <span class="title-sub">CONTINEW INTELLIGENCE OPERATION CENTER</span>
      </div>
      <div class="header__decor right" />
      <div class="header__time">
        <span class="time-text">{{ now }}</span>
        <a-button type="text" size="mini" class="exit-btn" @click="exit">
          <template #icon><IconCloseCircle /></template>
          返回后台
        </a-button>
      </div>
    </header>

    <!-- KPI -->
    <section class="screen__kpis">
      <div v-for="k in screenData.kpis.value" :key="k.key" class="kpi-card">
        <div class="kpi-icon">
          <component :is="iconCompMap[k.icon] || 'icon-fire'" :size="32" />
        </div>
        <div class="kpi-body">
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-value">{{ formatNumber(k.value) }}<span class="kpi-unit">{{ k.unit }}</span></div>
          <div class="kpi-delta" :class="{ up: (k.delta || 0) >= 0, down: (k.delta || 0) < 0 }">
            <IconArrowRise v-if="(k.delta || 0) >= 0" />
            <IconArrowFall v-else />
            {{ Math.abs(k.delta || 0) }}% vs 昨日
          </div>
        </div>
      </div>
    </section>

    <!-- 主体 -->
    <section class="screen__body">
      <!-- 左列 -->
      <div class="col col-left">
        <PanelBox title="近 7 日业务趋势">
          <VChart :option="trendOption" autoresize class="chart" />
        </PanelBox>
        <PanelBox title="实时订单流">
          <div class="order-list">
            <div class="order-list__head">
              <span>单号</span><span>客户</span><span>金额</span><span>状态</span><span>时间</span>
            </div>
            <div class="order-list__body">
              <div v-for="(o, i) in screenData.orders.value" :key="o.no" class="order-row" :style="{ animationDelay: `${i * 0.1}s` }">
                <span class="t">{{ o.no }}</span>
                <span>{{ o.customer }}</span>
                <span class="amount">¥{{ o.amount }}</span>
                <span class="status" :data-st="o.status">{{ o.status }}</span>
                <span class="time">{{ o.time }}</span>
              </div>
            </div>
          </div>
        </PanelBox>
      </div>

      <!-- 中列 -->
      <div class="col col-center">
        <div class="center-stat">
          <div class="ring">
            <VChart :option="ringOption" autoresize class="ring-chart" />
            <div class="ring-info">
              <div class="num">{{ totalCount }}</div>
              <div class="lab">业务总单量</div>
            </div>
          </div>
          <div class="legend">
            <div v-for="(s, i) in screenData.share.value" :key="s.name" class="legend-item">
              <span class="dot" :style="{ background: pieColors[i] }" />
              <span class="name">{{ s.name }}</span>
              <span class="val">{{ s.value }}</span>
            </div>
          </div>
        </div>
        <PanelBox title="财务收支对比（近 6 月）">
          <VChart :option="financeOption" autoresize class="chart" />
        </PanelBox>
      </div>

      <!-- 右列 -->
      <div class="col col-right">
        <PanelBox title="IM 在线人数（24h）">
          <VChart :option="onlineOption" autoresize class="chart" />
        </PanelBox>
        <PanelBox title="影视采集 Top 来源">
          <VChart :option="spideOption" autoresize class="chart" />
        </PanelBox>
        <PanelBox title="IM 实时消息流">
          <div class="feed-list">
            <div v-for="f in screenData.feeds.value" :key="f.id" class="feed-row">
              <div class="feed-row__head">
                <span class="user">{{ f.user }}</span>
                <span class="time">{{ f.time }}</span>
              </div>
              <div class="feed-row__msg">{{ f.preview }}</div>
            </div>
          </div>
        </PanelBox>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import {
  IconArrowFall,
  IconArrowRise,
  IconCloseCircle,
  IconCloud,
  IconFire,
  IconMessage,
  IconPrinter,
  IconVideoCamera,
} from '@arco-design/web-vue/es/icon'
import PanelBox from './PanelBox.vue'
import { useScreenData } from './mock'

use([CanvasRenderer, BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const router = useRouter()
const screenData = useScreenData()

const iconCompMap: Record<string, any> = {
  'icon-printer': IconPrinter,
  'icon-cloud': IconCloud,
  'icon-video-camera': IconVideoCamera,
  'icon-message': IconMessage,
  'icon-fire': IconFire,
}

// 时钟
const now = ref('')
let clockTimer: number | null = null
function tickClock() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  now.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 数值动画格式化
function formatNumber(n: number) {
  return new Intl.NumberFormat('zh-CN').format(n)
}

// 退出大屏
function exit() {
  router.push('/dashboard/workplace')
}

// 自动刷新
let refreshTimer: number | null = null

onMounted(() => {
  tickClock()
  clockTimer = window.setInterval(tickClock, 1000)
  refreshTimer = window.setInterval(() => screenData.refresh(), 5000)
})
onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (refreshTimer) clearInterval(refreshTimer)
})

// ===== 图表配置 =====
const pieColors = ['#36CFC9', '#597EF7', '#9254DE', '#FFC53D', '#FF7875', '#73D13D']
const baseTextStyle = { color: '#cfe1ff', fontSize: 12 }

const trendOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,30,60,0.85)', borderColor: '#36CFC9', textStyle: { color: '#fff' } },
  legend: { textStyle: baseTextStyle, top: 4, right: 8 },
  grid: { left: 36, right: 16, top: 36, bottom: 24 },
  xAxis: {
    type: 'category',
    data: screenData.trend.value.days,
    axisLabel: { color: '#9bb6e0' },
    axisLine: { lineStyle: { color: '#264068' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#9bb6e0' },
    splitLine: { lineStyle: { color: 'rgba(60,100,160,0.25)' } },
  },
  series: [
    { name: '订单', type: 'line', smooth: true, data: screenData.trend.value.order, lineStyle: { color: '#36CFC9' }, itemStyle: { color: '#36CFC9' }, areaStyle: { color: 'rgba(54,207,201,0.18)' } },
    { name: '记账(百)', type: 'line', smooth: true, data: screenData.trend.value.amount.map((v) => Math.round(v / 100)), lineStyle: { color: '#597EF7' }, itemStyle: { color: '#597EF7' }, areaStyle: { color: 'rgba(89,126,247,0.16)' } },
    { name: '采集', type: 'line', smooth: true, data: screenData.trend.value.spide, lineStyle: { color: '#FFC53D' }, itemStyle: { color: '#FFC53D' }, areaStyle: { color: 'rgba(255,197,61,0.16)' } },
  ],
}))

const totalCount = computed(() => screenData.share.value.reduce((s, c) => s + c.value, 0))

const ringOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item', backgroundColor: 'rgba(15,30,60,0.85)', borderColor: '#36CFC9', textStyle: { color: '#fff' } },
  series: [
    {
      type: 'pie',
      radius: ['62%', '85%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderColor: '#0b1f3a', borderWidth: 3 },
      label: { show: false },
      data: screenData.share.value.map((s, i) => ({ ...s, itemStyle: { color: pieColors[i] } })),
    },
  ],
}))

const onlineOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,30,60,0.85)', borderColor: '#36CFC9', textStyle: { color: '#fff' } },
  grid: { left: 36, right: 16, top: 12, bottom: 24 },
  xAxis: {
    type: 'category',
    data: screenData.online.value.hours,
    axisLabel: { color: '#9bb6e0', interval: 3 },
    axisLine: { lineStyle: { color: '#264068' } },
  },
  yAxis: { type: 'value', axisLabel: { color: '#9bb6e0' }, splitLine: { lineStyle: { color: 'rgba(60,100,160,0.25)' } } },
  series: [
    { type: 'line', smooth: true, showSymbol: false, data: screenData.online.value.values, lineStyle: { color: '#9254DE', width: 2 }, areaStyle: { color: 'rgba(146,84,222,0.25)' } },
  ],
}))

const spideOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(15,30,60,0.85)', borderColor: '#36CFC9', textStyle: { color: '#fff' } },
  grid: { left: 64, right: 16, top: 8, bottom: 16 },
  xAxis: { type: 'value', axisLabel: { color: '#9bb6e0' }, splitLine: { lineStyle: { color: 'rgba(60,100,160,0.25)' } } },
  yAxis: {
    type: 'category',
    data: screenData.spideTop.value.map((s) => s.name).reverse(),
    axisLabel: { color: '#9bb6e0' },
    axisLine: { lineStyle: { color: '#264068' } },
  },
  series: [
    {
      type: 'bar',
      barWidth: 12,
      data: screenData.spideTop.value.map((s) => s.value).reverse(),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [{ offset: 0, color: '#36CFC9' }, { offset: 1, color: '#597EF7' }],
        },
        borderRadius: [0, 6, 6, 0],
      },
    },
  ],
}))

const financeOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(15,30,60,0.85)', borderColor: '#36CFC9', textStyle: { color: '#fff' } },
  legend: { textStyle: baseTextStyle, top: 4, right: 8 },
  grid: { left: 48, right: 16, top: 36, bottom: 24 },
  xAxis: { type: 'category', data: screenData.finance.value.months, axisLabel: { color: '#9bb6e0' }, axisLine: { lineStyle: { color: '#264068' } } },
  yAxis: { type: 'value', axisLabel: { color: '#9bb6e0' }, splitLine: { lineStyle: { color: 'rgba(60,100,160,0.25)' } } },
  series: [
    { name: '收入', type: 'bar', barWidth: 14, data: screenData.finance.value.income, itemStyle: { color: '#36CFC9', borderRadius: [4, 4, 0, 0] } },
    { name: '支出', type: 'bar', barWidth: 14, data: screenData.finance.value.expense, itemStyle: { color: '#FF7875', borderRadius: [4, 4, 0, 0] } },
  ],
}))
</script>

<style lang="scss" scoped>
.screen {
  --primary: #36cfc9;
  --secondary: #597ef7;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  color: #cfe1ff;
  background:
    radial-gradient(circle at 20% 10%, rgba(54, 207, 201, 0.1), transparent 40%),
    radial-gradient(circle at 80% 100%, rgba(89, 126, 247, 0.12), transparent 40%),
    linear-gradient(180deg, #04132e 0%, #061a3a 50%, #02091e 100%);
  display: flex;
  flex-direction: column;
  font-family: 'Microsoft YaHei', sans-serif;
}

.screen__header {
  position: relative;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(54, 207, 201, 0.15);
}
.header__decor {
  position: absolute; top: 50%; transform: translateY(-50%); height: 1px;
  background: linear-gradient(90deg, transparent, rgba(54, 207, 201, 0.6), transparent);
  width: 30%;
  &.left { left: 4%; }
  &.right { right: 4%; }
}
.header__title { text-align: center; }
.title-text {
  font-size: 26px; font-weight: 800; letter-spacing: 4px;
  background: linear-gradient(90deg, #36cfc9, #597ef7, #9254de);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: block;
}
.title-sub { font-size: 11px; color: #5d7ba8; letter-spacing: 3px; }
.header__time {
  position: absolute; right: 24px; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; gap: 12px;
}
.time-text { font-family: 'Consolas', monospace; font-size: 16px; color: #36cfc9; }
.exit-btn { color: #cfe1ff !important; }

.screen__kpis {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  padding: 14px 20px;
  flex-shrink: 0;
}
.kpi-card {
  position: relative;
  display: flex; align-items: center; gap: 16px;
  padding: 16px 20px;
  background:
    linear-gradient(135deg, rgba(54, 207, 201, 0.08), rgba(89, 126, 247, 0.06));
  border: 1px solid rgba(54, 207, 201, 0.25);
  border-radius: 8px;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute; left: 0; top: 0; width: 3px; height: 100%;
    background: linear-gradient(180deg, #36cfc9, #597ef7);
  }
}
.kpi-icon { color: #36cfc9; }
.kpi-label { font-size: 13px; color: #9bb6e0; }
.kpi-value { font-size: 28px; font-weight: 700; color: #fff; font-family: 'Consolas', monospace; }
.kpi-unit { font-size: 13px; color: #9bb6e0; margin-left: 4px; font-weight: normal; }
.kpi-delta { font-size: 11px; display: flex; align-items: center; gap: 4px;
  &.up { color: #5dd9c1; }
  &.down { color: #ff7875; }
}

.screen__body {
  flex: 1; display: grid; grid-template-columns: 26% 1fr 26%;
  gap: 16px; padding: 0 20px 20px; min-height: 0;
}
.col { display: flex; flex-direction: column; gap: 16px; min-height: 0; }
.col-center { gap: 16px; }
.chart { width: 100%; height: 100%; min-height: 200px; }

// 中央环
.center-stat {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(54, 207, 201, 0.04), rgba(89, 126, 247, 0.04));
  border: 1px solid rgba(54, 207, 201, 0.18);
  border-radius: 8px;
  padding: 20px;
  gap: 24px;
  min-height: 0;
}
.ring { position: relative; width: 280px; height: 280px; }
.ring-chart { width: 100%; height: 100%; }
.ring-info {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;
  .num { font-size: 36px; font-weight: 700; color: #fff; font-family: Consolas, monospace; }
  .lab { font-size: 12px; color: #9bb6e0; }
}
.legend { display: flex; flex-direction: column; gap: 14px; }
.legend-item { display: flex; align-items: center; gap: 10px; font-size: 14px;
  .dot { width: 10px; height: 10px; border-radius: 2px; }
  .name { color: #cfe1ff; min-width: 80px; }
  .val { color: #36cfc9; font-family: Consolas, monospace; font-weight: 700; }
}

// 订单滚动
.order-list { width: 100%; height: 100%; display: flex; flex-direction: column; font-size: 12px; }
.order-list__head, .order-row {
  display: grid; grid-template-columns: 1.5fr 1fr 0.8fr 0.8fr 1fr; gap: 6px; padding: 6px 8px;
}
.order-list__head { color: #5d7ba8; border-bottom: 1px dashed rgba(60, 100, 160, 0.4); }
.order-list__body { flex: 1; overflow: hidden; }
.order-row {
  border-bottom: 1px solid rgba(54, 207, 201, 0.06);
  animation: slideIn 0.4s ease both;
  .t { color: #36cfc9; font-family: Consolas, monospace; }
  .amount { color: #ffc53d; }
  .status { padding: 1px 6px; border-radius: 4px; text-align: center; font-size: 11px;
    &[data-st='待打印'] { background: rgba(255, 197, 61, 0.18); color: #ffc53d; }
    &[data-st='打印中'] { background: rgba(89, 126, 247, 0.18); color: #597ef7; }
    &[data-st='已完成'] { background: rgba(54, 207, 201, 0.18); color: #36cfc9; }
    &[data-st='已对账'] { background: rgba(146, 84, 222, 0.18); color: #9254de; }
  }
  .time { color: #5d7ba8; font-family: Consolas, monospace; font-size: 11px; }
}

// 消息流
.feed-list { display: flex; flex-direction: column; gap: 10px; padding: 4px; height: 100%; overflow: hidden; }
.feed-row {
  padding: 8px 10px; border-left: 2px solid #36cfc9; background: rgba(54, 207, 201, 0.05);
  border-radius: 0 4px 4px 0;
}
.feed-row__head { display: flex; justify-content: space-between; font-size: 12px; color: #9bb6e0; }
.feed-row__msg { font-size: 12px; color: #cfe1ff; margin-top: 4px; }

@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
