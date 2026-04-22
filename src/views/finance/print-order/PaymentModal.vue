<template>
  <a-modal
    v-model:visible="visible"
    title="支付订单"
    :mask-closable="false"
    :esc-to-close="false"
    :width="520"
    :footer="false"
    @close="handleClose"
  >
    <!-- 订单信息摘要 -->
    <a-descriptions :column="2" bordered size="small" style="margin-bottom: 16px">
      <a-descriptions-item label="订单号" :span="2">{{ orderNo }}</a-descriptions-item>
      <a-descriptions-item label="订单金额">¥ {{ totalAmount.toFixed(2) }}</a-descriptions-item>
      <a-descriptions-item label="余额已付">¥ {{ balancePaid.toFixed(2) }}</a-descriptions-item>
      <a-descriptions-item label="待支付" :span="2">
        <span style="color: #f53f3f; font-size: 18px; font-weight: 700">¥ {{ remainAmount.toFixed(2) }}</span>
      </a-descriptions-item>
    </a-descriptions>

    <!-- 支付方式选择 -->
    <a-tabs v-model:active-key="activeChannel" @change="onChannelChange">
      <a-tab-pane key="WECHAT" title="微信支付">
        <template #title>
          <a-space>
            <icon-wechat />
            微信支付
          </a-space>
        </template>
      </a-tab-pane>
      <a-tab-pane key="ALIPAY" title="支付宝">
        <template #title>
          <a-space>
            <icon-alipay-circle />
            支付宝
          </a-space>
        </template>
      </a-tab-pane>
    </a-tabs>

    <!-- 支付内容区域 -->
    <div style="text-align: center; padding: 24px 0">
      <a-spin v-if="qrLoading" tip="正在发起支付..." />

      <!-- 支付宝：页面跳转提示 -->
      <template v-else-if="activeChannel === 'ALIPAY' && alipayWindowOpened">
        <div style="font-size: 48px; color: #1677ff">
          <icon-alipay-circle />
        </div>
        <div style="margin-top: 12px; font-size: 15px; color: var(--color-text-1); font-weight: 500">
          支付宝支付页面已在新窗口打开
        </div>
        <div style="margin-top: 8px; color: var(--color-text-3); font-size: 13px">
          请在新窗口完成支付，完成后本弹窗将自动关闭
        </div>
        <div style="margin-top: 16px">
          <a-button type="outline" @click="onChannelChange('ALIPAY')">重新打开支付页</a-button>
        </div>
      </template>

      <!-- 微信：展示二维码 -->
      <template v-else-if="activeChannel === 'WECHAT' && qrCodeUrl">
        <div style="display: inline-block; padding: 12px; background: white; border-radius: 8px; border: 1px solid #e5e6eb">
          <QrcodeVue :value="qrCodeUrl" :size="200" level="M" />
        </div>
        <div style="margin-top: 12px; color: var(--color-text-3); font-size: 13px">
          请使用微信扫描二维码完成支付
        </div>
        <!-- 倒计时 -->
        <div v-if="countdown > 0" style="margin-top: 8px; color: var(--color-text-3); font-size: 12px">
          二维码有效期：{{ Math.floor(countdown / 60) }}:{{ String(countdown % 60).padStart(2, '0') }}
        </div>
        <div v-else style="margin-top: 8px; color: #f53f3f; font-size: 12px">
          二维码已过期，请重新获取
          <a-button type="text" size="small" @click="onChannelChange(activeChannel)">重新生成</a-button>
        </div>
      </template>

      <a-empty v-else description="点击上方支付方式发起支付" />
    </div>

    <!-- 底部按钮 -->
    <div style="text-align: center; padding-top: 8px; border-top: 1px solid var(--color-border-2)">
      <a-space>
        <a-button @click="handleClose">取消支付（稍后支付）</a-button>
        <a-button
          v-if="activeChannel === 'WECHAT' && countdown <= 0 && qrCodeUrl"
          type="primary"
          @click="onChannelChange(activeChannel)"
        >
          重新生成二维码
        </a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import QrcodeVue from 'qrcode.vue'
import { initiatePayment, queryPaymentStatus } from '@/apis/finance/print-order'

const props = defineProps<{
  orderId: string
  remainAmount: number
  balancePaid: number
  totalAmount: number
  orderNo: string
}>()

const emit = defineEmits<{
  (e: 'paid'): void
  (e: 'closed'): void
}>()

const visible = ref(false)
const activeChannel = ref<'WECHAT' | 'ALIPAY'>('WECHAT')
const qrLoading = ref(false)
const qrCodeUrl = ref('')
const countdown = ref(0)
// 支付宝页面支付：标记是否已打开支付页
const alipayWindowOpened = ref(false)

let pollTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null
// 防止支付成功后轮询回调重复触发
let paymentDone = false

const clearTimers = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const onChannelChange = async (channel: string) => {
  activeChannel.value = channel as 'WECHAT' | 'ALIPAY'
  clearTimers()
  paymentDone = false
  qrCodeUrl.value = ''
  countdown.value = 0
  alipayWindowOpened.value = false

  qrLoading.value = true
  try {
    const { data } = await initiatePayment(props.orderId, channel)

    if (channel === 'ALIPAY') {
      // 支付宝：新窗口打开页面支付
      window.open(data.payUrl, '_blank')
      alipayWindowOpened.value = true
    } else {
      // 微信：展示二维码
      qrCodeUrl.value = data.qrCodeUrl
      // 计算倒计时（秒）
      const expireTime = data.expireTime ? new Date(data.expireTime).getTime() : Date.now() + 30 * 60 * 1000
      countdown.value = Math.max(0, Math.floor((expireTime - Date.now()) / 1000))
      // 启动倒计时
      countdownTimer = setInterval(() => {
        countdown.value = Math.max(0, countdown.value - 1)
      }, 1000)
    }

    // 启动轮询（微信和支付宝都需要轮询结果）
    pollTimer = setInterval(async () => {
      if (paymentDone) return
      try {
        const { data: status } = await queryPaymentStatus(props.orderId)
        if (status === 'PAID') {
          paymentDone = true
          clearTimers()
          Message.success('支付成功！')
          visible.value = false
          emit('paid')
        }
      } catch {
        // 忽略轮询错误
      }
    }, 2000)
  } catch (e: any) {
    Message.error(e?.msg || '发起支付失败')
  } finally {
    qrLoading.value = false
  }
}

const handleClose = () => {
  clearTimers()
  visible.value = false
  emit('closed')
}

const onOpen = () => {
  paymentDone = false
  visible.value = true
  qrCodeUrl.value = ''
  countdown.value = 0
  // 打开时自动生成微信支付二维码
  nextTick(() => {
    onChannelChange('WECHAT')
  })
}

// 监听弹窗关闭，确保定时器一定被销毁
watch(visible, (val) => {
  if (!val) {
    clearTimers()
  }
})

onUnmounted(() => {
  clearTimers()
})

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
