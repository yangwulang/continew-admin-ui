<template>
  <div class="portal">
    <!-- 顶部背景动效 -->
    <div class="portal__bg">
      <div class="bg-grid" />
      <div class="bg-glow glow-1" />
      <div class="bg-glow glow-2" />
      <div class="bg-glow glow-3" />
    </div>

    <!-- 导航 -->
    <header class="nav" :class="{ scrolled }">
      <div class="nav__inner">
        <div class="nav__brand" @click="scrollTo('hero')">
          <div class="brand-logo">
            <IconApps :size="22" />
          </div>
          <div class="brand-text">
            <span class="brand-name">FINTECH CLOUD</span>
            <span class="brand-sub">智慧财务运营平台</span>
          </div>
        </div>
        <nav class="nav__menu">
          <a v-for="m in menus" :key="m.key" :class="{ active: activeMenu === m.key }" @click="scrollTo(m.key)">
            {{ m.label }}
          </a>
        </nav>
        <div class="nav__actions">
          <a-button class="btn-ghost" size="medium" @click="goLogin">
            <template #icon><IconUser /></template>
            登录
          </a-button>
          <a-button type="primary" class="btn-primary" size="medium" @click="goLogin">
            免费试用
            <template #icon><IconArrowRight /></template>
          </a-button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section id="hero" class="hero">
      <div class="hero__inner">
        <div class="hero__left">
          <div class="tag-row">
            <span class="tag-dot" />
            <span>新一代企业级财务 SaaS 平台</span>
          </div>
          <h1 class="hero__title">
            <span class="line">让<span class="grad">财务</span>更智能</span>
            <span class="line">让<span class="grad">业务</span>更高效</span>
          </h1>
          <p class="hero__desc">
            集成智慧记账、客户管理、电子签名、打印订单、数据大屏于一体，<br>
            为中大型企业提供一站式智能化财务运营解决方案。
          </p>
          <div class="hero__btns">
            <a-button type="primary" size="large" class="btn-primary" @click="goLogin">
              立即体验
              <template #icon><IconArrowRight /></template>
            </a-button>
            <a-button size="large" class="btn-ghost" @click="scrollTo('features')">
              了解更多
            </a-button>
          </div>
          <div class="hero__stats">
            <div v-for="s in heroStats" :key="s.label" class="stat">
              <div class="stat__num">
                <span class="num">{{ s.value }}</span>
                <span class="suf">{{ s.suffix }}</span>
              </div>
              <div class="stat__lab">{{ s.label }}</div>
            </div>
          </div>
        </div>
        <div class="hero__right">
          <!-- 数据看板 mock 视觉 -->
          <div class="dash">
            <div class="dash__head">
              <span class="d-dot d-dot--r" />
              <span class="d-dot d-dot--y" />
              <span class="d-dot d-dot--g" />
              <span class="d-title">财务运营中心</span>
            </div>
            <div class="dash__body">
              <div class="d-kpis">
                <div v-for="(k, i) in dashKpis" :key="i" class="d-kpi" :style="{ animationDelay: `${i * 0.1}s` }">
                  <div class="d-kpi__lab">{{ k.label }}</div>
                  <div class="d-kpi__val">{{ k.value }}</div>
                  <div class="d-kpi__delta" :class="{ up: k.delta > 0 }">↑ {{ k.delta }}%</div>
                </div>
              </div>
              <div class="d-chart">
                <svg viewBox="0 0 320 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#36cfc9" stop-opacity="0.5" />
                      <stop offset="100%" stop-color="#36cfc9" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <path :d="areaPath" fill="url(#lg)" />
                  <path :d="linePath" fill="none" stroke="#36cfc9" stroke-width="2" />
                  <path :d="line2Path" fill="none" stroke="#597ef7" stroke-width="2" stroke-dasharray="4 3" />
                </svg>
              </div>
              <div class="d-bars">
                <div v-for="(b, i) in bars" :key="i" class="d-bar" :style="{ height: `${b}%`, animationDelay: `${i * 0.06}s` }" />
              </div>
            </div>
          </div>
          <!-- 浮动徽章 -->
          <div class="badge badge--1">
            <IconCheckCircle /> ISO 27001
          </div>
          <div class="badge badge--2">
            <IconSafe /> 等保三级
          </div>
        </div>
      </div>
    </section>

    <!-- 核心能力 -->
    <section id="features" class="section">
      <div class="section__head">
        <div class="section__tag">CORE CAPABILITIES</div>
        <h2 class="section__title">六大核心能力 · 全链路业财融合</h2>
        <p class="section__desc">覆盖业务到财务的全流程，让数据流动起来，让决策更智能</p>
      </div>
      <div class="features">
        <div v-for="(f, i) in features" :key="f.title" class="feature" :style="{ animationDelay: `${i * 0.08}s` }">
          <div class="feature__icon" :style="{ background: f.color }">
            <component :is="f.icon" :size="28" />
          </div>
          <h3 class="feature__title">{{ f.title }}</h3>
          <p class="feature__desc">{{ f.desc }}</p>
          <div class="feature__more" @click="goLogin">
            <span>立即了解</span>
            <IconRight />
          </div>
        </div>
      </div>
    </section>

    <!-- 解决方案 -->
    <section id="solutions" class="section section--alt">
      <div class="section__head">
        <div class="section__tag">SOLUTIONS</div>
        <h2 class="section__title">行业解决方案</h2>
        <p class="section__desc">针对不同业态深度定制，开箱即用</p>
      </div>
      <div class="solutions">
        <div v-for="(s, i) in solutions" :key="s.title" class="sol" :class="`sol--${i}`">
          <div class="sol__bg" />
          <div class="sol__content">
            <div class="sol__num">0{{ i + 1 }}</div>
            <h3 class="sol__title">{{ s.title }}</h3>
            <p class="sol__desc">{{ s.desc }}</p>
            <ul class="sol__list">
              <li v-for="p in s.points" :key="p">
                <IconCheckCircle />{{ p }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- 数字指标 -->
    <section class="metrics">
      <div v-for="m in metrics" :key="m.label" class="metric">
        <div class="metric__num">{{ m.value }}<span>{{ m.unit }}</span></div>
        <div class="metric__lab">{{ m.label }}</div>
      </div>
    </section>

    <!-- 客户口碑 -->
    <section id="cases" class="section">
      <div class="section__head">
        <div class="section__tag">CUSTOMER VOICES</div>
        <h2 class="section__title">服务千行百业 · 客户口碑</h2>
      </div>
      <div class="cases">
        <div v-for="c in cases" :key="c.author" class="case">
          <div class="case__quote">"</div>
          <p class="case__text">{{ c.text }}</p>
          <div class="case__meta">
            <div class="case__avatar" :style="{ background: c.color }">{{ c.author[0] }}</div>
            <div>
              <div class="case__name">{{ c.author }}</div>
              <div class="case__role">{{ c.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="cta__bg" />
      <div class="cta__inner">
        <h2 class="cta__title">开启您的智能财务新时代</h2>
        <p class="cta__desc">30 秒注册 · 免费试用 30 天 · 专属顾问 1V1 服务</p>
        <div class="cta__btns">
          <a-button type="primary" size="large" class="btn-primary" @click="goLogin">
            立即开始
            <template #icon><IconArrowRight /></template>
          </a-button>
          <a-button size="large" class="btn-ghost">
            预约演示
          </a-button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer id="about" class="footer">
      <div class="footer__inner">
        <div class="footer__col footer__col--brand">
          <div class="brand">
            <div class="brand-logo">
              <IconApps :size="22" />
            </div>
            <div>
              <div class="brand-name">FINTECH CLOUD</div>
              <div class="brand-sub">智慧财务运营平台</div>
            </div>
          </div>
          <p class="footer__txt">致力于为企业提供领先的财务数字化解决方案</p>
        </div>
        <div v-for="g in footerGroups" :key="g.title" class="footer__col">
          <div class="footer__title">{{ g.title }}</div>
          <a v-for="l in g.links" :key="l">{{ l }}</a>
        </div>
      </div>
      <div class="footer__copy">
        © {{ year }} FinTech Cloud. All Rights Reserved · 赣 ICP 备 2026012708 号
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconApps,
  IconArrowRight,
  IconCheckCircle,
  IconCloud,
  IconEdit,
  IconFile,
  IconPrinter,
  IconRight,
  IconSafe,
  IconUser,
  IconUserGroup,
  IconWifi,
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const scrolled = ref(false)
const activeMenu = ref('hero')
const year = new Date().getFullYear()

const menus = [
  { key: 'hero', label: '首页' },
  { key: 'features', label: '产品能力' },
  { key: 'solutions', label: '解决方案' },
  { key: 'cases', label: '客户案例' },
  { key: 'about', label: '关于我们' },
]

const heroStats = [
  { value: '50000', suffix: '+', label: '企业客户' },
  { value: '99.99', suffix: '%', label: '系统可用性' },
  { value: '12', suffix: '亿', label: '日均处理流水' },
]

const dashKpis = [
  { label: '今日营收', value: '¥ 286,540', delta: 12 },
  { label: '订单数', value: '1,284', delta: 8 },
  { label: '客户数', value: '326', delta: 5 },
]

const bars = [40, 65, 50, 78, 55, 88, 70, 92, 60, 75, 88, 95]
// 静态 SVG 路径
const linePath = 'M0,90 C30,80 60,50 90,55 C120,60 150,30 180,40 C210,50 240,20 270,18 C290,16 310,30 320,28'
const line2Path = 'M0,100 C40,85 70,80 100,72 C130,64 160,55 190,60 C220,65 250,50 280,40 C300,34 315,42 320,38'
const areaPath = `${linePath} L320,120 L0,120 Z`

const features = [
  { icon: IconCloud, title: '智慧记账', desc: '凭证自动生成、智能对账、多账套并行管理，财务效率提升 80%', color: 'linear-gradient(135deg,#36cfc9,#597ef7)' },
  { icon: IconUserGroup, title: '客户管理', desc: '全生命周期客户档案、信用评估、应收账款一站式跟踪', color: 'linear-gradient(135deg,#597ef7,#9254de)' },
  { icon: IconEdit, title: '电子签名', desc: '法律合规电子签章、远程签字流程、移动端无缝签署', color: 'linear-gradient(135deg,#9254de,#f759ab)' },
  { icon: IconPrinter, title: '打印订单', desc: '订单驱动的多设备调度，自动计价 + 多文件独立配置', color: 'linear-gradient(135deg,#f759ab,#ffc53d)' },
  { icon: IconFile, title: '智能开票', desc: '与税务深度对接，开票一键完成、发票合规归档', color: 'linear-gradient(135deg,#ffc53d,#36cfc9)' },
  { icon: IconWifi, title: '数据大屏', desc: '实时业务监控、智能预警、移动端随时随地掌控业务', color: 'linear-gradient(135deg,#36cfc9,#9254de)' },
]

const solutions = [
  { title: '印刷与广告', desc: '面向印刷企业的订单计价 + 打印调度 + 财务对账一体化方案', points: ['多文件独立配置', '碳粉覆盖率智能计价', '客户分级折扣'] },
  { title: '设计与文化', desc: '为设计工作室提供项目化签约、阶段付款、电子合同管理', points: ['里程碑收款', '版权登记管理', '客户在线签字'] },
  { title: '中小服务业', desc: '帮助中小企业完成业务到财务的数字化升级，0 IT 门槛上手', points: ['SaaS 模式开箱即用', '多端同步', '7×24 客服支持'] },
]

const metrics = [
  { value: '50000', unit: '+', label: '注册企业' },
  { value: '180', unit: '+', label: '服务行业' },
  { value: '1.2', unit: '亿', label: '日处理订单' },
  { value: '99.99', unit: '%', label: '可用性 SLA' },
]

const cases = [
  { text: '上线 3 个月，财务月结效率从 5 天缩短到 1 天，对账准确率达到 100%。', author: '王经理', role: '深圳某印刷集团 财务总监', color: 'linear-gradient(135deg,#36cfc9,#597ef7)' },
  { text: '客户管理 + 电子签名打通后，合同签约从平均 3 天变成 30 分钟，签约率翻倍。', author: '李总', role: '上海某文化传播 CEO', color: 'linear-gradient(135deg,#597ef7,#9254de)' },
  { text: '数据大屏让管理层第一次清晰看见业务全貌，月度决策更敏捷、更准确。', author: '张总', role: '杭州某服务集团 总裁', color: 'linear-gradient(135deg,#9254de,#f759ab)' },
]

const footerGroups = [
  { title: '产品', links: ['智慧记账', '客户管理', '电子签名', '打印订单', '数据大屏'] },
  { title: '解决方案', links: ['印刷企业', '设计工作室', '中小服务商', '集团企业'] },
  { title: '服务', links: ['帮助中心', 'API 文档', '在线客服', '商务合作', '渠道加盟'] },
  { title: '关于', links: ['公司介绍', '加入我们', '隐私政策', '服务协议'] },
]

function goLogin() {
  router.push('/login')
}
function scrollTo(id: string) {
  activeMenu.value = id
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}
function onScroll() {
  scrolled.value = window.scrollY > 30
}
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style lang="scss" scoped>
$primary: #36cfc9;
$secondary: #597ef7;
$accent: #9254de;
$bg-deep: #050b1f;
$bg-mid: #0b1939;
$text-main: #e6efff;
$text-sub: #9bb6e0;

.portal {
  position: relative;
  width: 100%;
  min-height: 100vh;
  color: $text-main;
  background: $bg-deep;
  overflow-x: hidden;
  font-family: 'Microsoft YaHei', sans-serif;
}

// 背景动效
.portal__bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.bg-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(54, 207, 201, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(54, 207, 201, 0.08) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
}
.bg-glow {
  position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4;
  &.glow-1 { width: 600px; height: 600px; top: -200px; left: -100px; background: $primary; }
  &.glow-2 { width: 700px; height: 700px; top: 30%; right: -200px; background: $secondary; }
  &.glow-3 { width: 500px; height: 500px; bottom: -100px; left: 30%; background: $accent; }
}

// Nav
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 18px 0; transition: all 0.3s ease;
  background: transparent;
  &.scrolled {
    background: rgba(5, 11, 31, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(54, 207, 201, 0.15);
    padding: 12px 0;
  }
}
.nav__inner {
  max-width: 1280px; margin: 0 auto; padding: 0 32px;
  display: flex; align-items: center; justify-content: space-between; gap: 32px;
}
.nav__brand { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.brand-logo {
  width: 40px; height: 40px; border-radius: 10px;
  background: linear-gradient(135deg, $primary, $secondary);
  display: flex; align-items: center; justify-content: center; color: #fff;
  box-shadow: 0 4px 20px rgba(54, 207, 201, 0.4);
}
.brand-name { font-size: 16px; font-weight: 800; letter-spacing: 2px; color: #fff; }
.brand-sub { font-size: 11px; color: $text-sub; }
.nav__menu { display: flex; gap: 36px;
  a { color: $text-sub; cursor: pointer; font-size: 14px; position: relative; transition: color 0.2s;
    &:hover, &.active { color: $primary; }
    &.active::after { content: ''; position: absolute; bottom: -8px; left: 0; right: 0; height: 2px; background: $primary; border-radius: 2px; }
  }
}
.nav__actions { display: flex; gap: 12px; }
.btn-ghost { background: transparent !important; border-color: rgba(54, 207, 201, 0.4) !important; color: #fff !important;
  &:hover { background: rgba(54, 207, 201, 0.1) !important; border-color: $primary !important; }
}
.btn-primary { background: linear-gradient(90deg, $primary, $secondary) !important; border: none !important;
  box-shadow: 0 4px 16px rgba(54, 207, 201, 0.35);
  &:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(54, 207, 201, 0.5); }
}

// Hero
.hero { position: relative; z-index: 1; padding: 140px 32px 80px; }
.hero__inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr 1fr; gap: 60px; align-items: center; }
.tag-row { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px;
  background: rgba(54, 207, 201, 0.1); border: 1px solid rgba(54, 207, 201, 0.3); border-radius: 99px; font-size: 12px; color: $primary;
  .tag-dot { width: 6px; height: 6px; border-radius: 50%; background: $primary; box-shadow: 0 0 8px $primary; }
}
.hero__title { font-size: 56px; font-weight: 800; line-height: 1.2; margin: 24px 0;
  .line { display: block; }
  .grad { background: linear-gradient(90deg, $primary, $secondary, $accent); -webkit-background-clip: text; background-clip: text; color: transparent; }
}
.hero__desc { font-size: 16px; color: $text-sub; line-height: 1.8; margin-bottom: 32px; }
.hero__btns { display: flex; gap: 16px; margin-bottom: 48px; }
.hero__stats { display: flex; gap: 48px; }
.stat__num { display: flex; align-items: baseline; gap: 2px;
  .num { font-size: 32px; font-weight: 800; color: #fff; font-family: 'Consolas', monospace; }
  .suf { font-size: 18px; color: $primary; }
}
.stat__lab { font-size: 13px; color: $text-sub; margin-top: 4px; }

// Dashboard mock
.hero__right { position: relative; }
.dash {
  background: linear-gradient(135deg, rgba(54, 207, 201, 0.06), rgba(89, 126, 247, 0.06));
  border: 1px solid rgba(54, 207, 201, 0.2);
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  animation: floatY 6s ease-in-out infinite;
}
.dash__head { display: flex; align-items: center; gap: 6px; padding: 12px 16px; border-bottom: 1px solid rgba(54, 207, 201, 0.15);
  .d-dot { width: 10px; height: 10px; border-radius: 50%; &--r { background: #ff5f57; } &--y { background: #febc2e; } &--g { background: #28c840; } }
  .d-title { margin-left: auto; font-size: 12px; color: $text-sub; }
}
.dash__body { padding: 20px; }
.d-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.d-kpi { padding: 12px; background: rgba(54, 207, 201, 0.05); border: 1px solid rgba(54, 207, 201, 0.15); border-radius: 6px;
  animation: slideIn 0.6s ease both;
  &__lab { font-size: 11px; color: $text-sub; }
  &__val { font-size: 18px; font-weight: 700; color: #fff; font-family: Consolas, monospace; margin: 4px 0; }
  &__delta { font-size: 11px; color: $primary; &.up::before { content: ''; } }
}
.d-chart { height: 120px;
  svg { width: 100%; height: 100%; }
}
.d-bars { display: flex; align-items: flex-end; gap: 6px; height: 50px; margin-top: 16px; }
.d-bar { flex: 1; background: linear-gradient(180deg, $primary, $secondary); border-radius: 2px 2px 0 0;
  animation: barIn 0.8s ease both;
}
@keyframes barIn { from { height: 0 !important; } }
@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } }
@keyframes floatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.badge { position: absolute; padding: 8px 14px; background: rgba(11, 25, 57, 0.9); border: 1px solid rgba(54, 207, 201, 0.4);
  border-radius: 8px; font-size: 12px; display: flex; align-items: center; gap: 6px; color: $primary;
  backdrop-filter: blur(8px); animation: floatY 4s ease-in-out infinite;
  &--1 { top: 40px; left: -20px; animation-delay: 0.5s; }
  &--2 { bottom: 40px; right: -20px; }
}

// Sections common
.section { position: relative; z-index: 1; padding: 100px 32px; }
.section--alt { background: linear-gradient(180deg, transparent, rgba(11, 25, 57, 0.6), transparent); }
.section__head { text-align: center; margin-bottom: 60px; }
.section__tag { display: inline-block; font-size: 12px; letter-spacing: 4px; color: $primary; margin-bottom: 12px; }
.section__title { font-size: 40px; font-weight: 800; margin: 0 0 16px;
  background: linear-gradient(90deg, #fff, $primary);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.section__desc { color: $text-sub; font-size: 15px; }

// Features
.features { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.feature {
  padding: 32px; background: linear-gradient(135deg, rgba(54, 207, 201, 0.04), rgba(89, 126, 247, 0.04));
  border: 1px solid rgba(54, 207, 201, 0.15); border-radius: 12px;
  transition: all 0.3s; cursor: pointer; animation: slideIn 0.6s ease both;
  &:hover { transform: translateY(-8px); border-color: $primary; box-shadow: 0 20px 40px rgba(54, 207, 201, 0.15); }
}
.feature__icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; margin-bottom: 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
.feature__title { font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #fff; }
.feature__desc { color: $text-sub; line-height: 1.7; min-height: 56px; }
.feature__more { margin-top: 20px; display: flex; align-items: center; gap: 4px; color: $primary; font-size: 13px; cursor: pointer;
  &:hover { gap: 8px; }
}

// Solutions
.solutions { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.sol { position: relative; padding: 40px 32px; border-radius: 12px; overflow: hidden; min-height: 360px;
  border: 1px solid rgba(54, 207, 201, 0.18);
  &__bg { position: absolute; inset: 0; opacity: 0.15; transition: opacity 0.3s; }
  &--0 .sol__bg { background: radial-gradient(circle at 70% 20%, $primary, transparent 60%); }
  &--1 .sol__bg { background: radial-gradient(circle at 70% 20%, $secondary, transparent 60%); }
  &--2 .sol__bg { background: radial-gradient(circle at 70% 20%, $accent, transparent 60%); }
  &__content { position: relative; }
  &__num { font-size: 60px; font-weight: 900; line-height: 1; opacity: 0.2;
    background: linear-gradient(90deg, $primary, $secondary); -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  &__title { font-size: 24px; font-weight: 700; margin: 16px 0 12px; color: #fff; }
  &__desc { color: $text-sub; line-height: 1.7; margin-bottom: 20px; }
  &__list { list-style: none; padding: 0; margin: 0;
    li { display: flex; align-items: center; gap: 8px; padding: 6px 0; color: $text-main; font-size: 14px;
      :deep(svg) { color: $primary; }
    }
  }
  &:hover .sol__bg { opacity: 0.3; }
}

// Metrics
.metrics { max-width: 1280px; margin: 40px auto; padding: 40px 32px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
  border-top: 1px solid rgba(54, 207, 201, 0.15);
  border-bottom: 1px solid rgba(54, 207, 201, 0.15);
}
.metric { text-align: center;
  &__num { font-size: 44px; font-weight: 800; color: #fff; font-family: Consolas, monospace;
    span { font-size: 20px; color: $primary; margin-left: 4px; }
  }
  &__lab { color: $text-sub; margin-top: 8px; font-size: 14px; }
}

// Cases
.cases { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.case { position: relative; padding: 36px 28px; background: linear-gradient(135deg, rgba(54, 207, 201, 0.04), rgba(89, 126, 247, 0.04));
  border: 1px solid rgba(54, 207, 201, 0.15); border-radius: 12px;
  &__quote { position: absolute; top: 8px; right: 20px; font-size: 80px; line-height: 1; color: $primary; opacity: 0.2; font-family: serif; }
  &__text { line-height: 1.8; color: $text-main; font-size: 14px; min-height: 90px; }
  &__meta { display: flex; align-items: center; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(54, 207, 201, 0.1); }
  &__avatar { width: 44px; height: 44px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  &__name { color: #fff; font-weight: 600; }
  &__role { color: $text-sub; font-size: 12px; margin-top: 2px; }
}

// CTA
.cta { position: relative; padding: 100px 32px; text-align: center; z-index: 1; }
.cta__bg { position: absolute; inset: 0; opacity: 0.3;
  background: radial-gradient(ellipse at center, $primary, transparent 60%);
}
.cta__inner { position: relative; max-width: 800px; margin: 0 auto; }
.cta__title { font-size: 44px; font-weight: 800; color: #fff; margin: 0 0 16px;
  background: linear-gradient(90deg, $primary, $accent); -webkit-background-clip: text; background-clip: text; color: transparent;
}
.cta__desc { color: $text-sub; font-size: 16px; margin-bottom: 32px; }
.cta__btns { display: flex; justify-content: center; gap: 16px; }

// Footer
.footer { position: relative; z-index: 1; padding: 60px 32px 30px; border-top: 1px solid rgba(54, 207, 201, 0.15); background: rgba(5, 11, 31, 0.6); }
.footer__inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.5fr repeat(4, 1fr); gap: 40px; }
.footer__col { display: flex; flex-direction: column; gap: 12px;
  .brand { display: flex; align-items: center; gap: 12px; }
  a { color: $text-sub; font-size: 13px; cursor: pointer; &:hover { color: $primary; } }
}
.footer__title { color: #fff; font-weight: 600; margin-bottom: 4px; }
.footer__txt { color: $text-sub; font-size: 13px; margin-top: 8px; }
.footer__copy { max-width: 1280px; margin: 40px auto 0; padding-top: 24px; border-top: 1px solid rgba(54, 207, 201, 0.1);
  text-align: center; color: $text-sub; font-size: 12px;
}

@media (max-width: 960px) {
  .nav__menu { display: none; }
  .hero__inner { grid-template-columns: 1fr; }
  .hero__title { font-size: 36px; }
  .features, .solutions, .cases { grid-template-columns: 1fr; }
  .metrics { grid-template-columns: repeat(2, 1fr); }
  .footer__inner { grid-template-columns: 1fr 1fr; }
}
</style>
