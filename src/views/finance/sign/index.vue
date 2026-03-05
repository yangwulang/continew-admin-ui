<template>
  <div class="sign-page">
    <!-- 加载中 -->
    <div v-if="pageLoading" class="sign-loading">
      <a-spin dot tip="加载中..." />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMsg" class="sign-error">
      <a-result status="error" :title="errorMsg">
        <template #subtitle>请检查签名链接是否正确或联系工作人员</template>
      </a-result>
    </div>

    <!-- 已签名 -->
    <div v-else-if="billingData?.status !== 'PENDING_SIGN'" class="sign-done">
      <a-result status="success" title="已完成签名">
        <template #subtitle>
          签名时间：{{ billingData?.signedAt || '—' }}
        </template>
      </a-result>
    </div>

    <!-- 正常签名流程 -->
    <div v-else class="sign-content">
      <!-- 账单信息卡片 -->
      <div class="sign-card billing-info">
        <div class="card-title">账单信息</div>
        <div class="billing-summary">
          <div class="summary-item">
            <span class="label">记账日期</span>
            <span class="value">{{ billingData?.billingDate }}</span>
          </div>
          <div class="summary-item total">
            <span class="label">合计金额</span>
            <span class="value amount">¥{{ formatAmount(billingData?.totalAmount) }}</span>
          </div>
        </div>
        <!-- 明细表格 -->
        <div class="billing-items">
          <div class="items-header">
            <span class="col-name">物料名称</span>
            <span class="col-price">单价</span>
            <span class="col-qty">数量</span>
            <span class="col-amount">金额</span>
          </div>
          <div v-for="(item, idx) in billingData?.items || []" :key="idx" class="items-row">
            <span class="col-name">{{ item.materialName }}</span>
            <span class="col-price">{{ formatAmount(item.unitPrice) }}</span>
            <span class="col-qty">{{ item.quantity }}</span>
            <span class="col-amount">{{ formatAmount(item.amount) }}</span>
          </div>
          <div v-if="!billingData?.items?.length" class="items-empty">暂无明细</div>
        </div>
      </div>

      <!-- 签名区域 -->
      <div class="sign-card sign-area">
        <div class="card-title">请在下方签名</div>
        <div ref="canvasWrapperRef" class="canvas-wrapper">
          <VueEsign
            ref="esignRef"
            :width="canvasWidth"
            :height="canvasHeight"
            :is-crop="false"
            :line-width="4"
            line-color="#333"
            bg-color="#fff"
          />
        </div>
        <div class="sign-actions">
          <a-button size="large" @click="handleReset">
            <template #icon><icon-undo /></template>
            重写
          </a-button>
          <a-button size="large" type="primary" :loading="submitting" @click="handleSubmit">
            <template #icon><icon-check /></template>
            确认签名
          </a-button>
        </div>
      </div>
    </div>

    <!-- 提交成功 -->
    <a-modal v-model:visible="showSuccess" :closable="false" :mask-closable="false" :footer="false" simple>
      <a-result status="success" title="签名成功" subtitle="您的签名已提交，感谢您的确认！" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import VueEsign from 'vue-esign'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import http from '@/utils/http'

const route = useRoute()

// 状态
const pageLoading = ref(true)
const errorMsg = ref('')
const billingData = ref<any>(null)
const submitting = ref(false)
const showSuccess = ref(false)

// 签名画布
const esignRef = ref()
const canvasWrapperRef = ref<HTMLDivElement>()
const canvasWidth = ref(600)
const canvasHeight = ref(260)

// 格式化金额
const formatAmount = (val: any) => {
  if (val === null || val === undefined) return '—'
  return Number(val).toFixed(2)
}

// 获取 token
const getToken = () => {
  return (route.query.token as string) || ''
}

// 获取租户ID
const getTenantId = () => {
  return (route.query.tenantId as string) || ''
}

// 加载账单数据
const loadBillingData = async () => {
  const token = getToken()
  const tenantId = getTenantId()
  if (!token || !tenantId) {
    errorMsg.value = '签名链接无效'
    pageLoading.value = false
    return
  }
  try {
    const res = await http.get<any>('/open/sign/billing', { token, tenantId })
    billingData.value = res.data
  } catch (e: any) {
    errorMsg.value = e?.msg || e?.message || '加载账单信息失败'
  } finally {
    pageLoading.value = false
  }
}

// 自适应画布尺寸
const updateCanvasSize = () => {
  if (canvasWrapperRef.value) {
    const w = canvasWrapperRef.value.clientWidth - 2 // 减去边框
    canvasWidth.value = Math.max(280, w)
    canvasHeight.value = window.innerWidth <= 768 ? 200 : 260
  }
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null
const onResize = () => {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    updateCanvasSize()
  }, 200)
}

// 重写签名
const handleReset = () => {
  esignRef.value?.reset()
}

// 提交签名
const handleSubmit = () => {
  if (!esignRef.value) return
  // vue-esign generate 使用回调函数: generate(callback, type, quality)
  esignRef.value.generate().then((base64) => {
    if (!base64) {
      Message.warning('请先签名')
      return
    }
    submitting.value = true
    const token = getToken()
    const tenantId = getTenantId()
    http.post('/open/sign/billing', { signImageData: base64 }, {
      params: { token, tenantId },
    }).then(() => {
      showSuccess.value = true
    }).catch((e: any) => {
      const msg = e?.msg || e?.message || '提交签名失败'
      Message.error(msg)
    }).finally(() => {
      submitting.value = false
    })
  })
}

onMounted(async () => {
  await loadBillingData()
  await nextTick()
  updateCanvasSize()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (resizeTimer) clearTimeout(resizeTimer)
})
</script>

<style scoped lang="less">
.sign-page {
  min-height: 100vh;
  background: #f5f6fa;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sign-loading,
.sign-error,
.sign-done {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  width: 100%;
}

.sign-content {
  width: 100%;
  max-width: 720px;
}

.sign-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e6eb;
}

/* 账单摘要 */
.billing-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item {
  flex: 1;
  min-width: 140px;
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;

  .label {
    font-size: 13px;
    color: #86909c;
    margin-bottom: 4px;
  }

  .value {
    font-size: 16px;
    font-weight: 500;
    color: #1d2129;
  }

  &.total .value.amount {
    font-size: 22px;
    font-weight: 700;
    color: #165dff;
  }
}

/* 明细列表 */
.billing-items {
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  overflow: hidden;
}

.items-header,
.items-row {
  display: flex;
  align-items: center;
  padding: 10px 12px;
}

.items-header {
  background: #f7f8fa;
  font-size: 13px;
  font-weight: 500;
  color: #86909c;
}

.items-row {
  font-size: 14px;
  color: #1d2129;
  border-top: 1px solid #f2f3f5;
}

.col-name {
  flex: 2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-price,
.col-qty,
.col-amount {
  flex: 1;
  text-align: right;
}

.items-empty {
  padding: 20px;
  text-align: center;
  color: #c9cdd4;
  font-size: 14px;
}

/* 签名区域 */
.canvas-wrapper {
  border: 1px dashed #c9cdd4;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  margin-bottom: 16px;
  touch-action: none;
}

.sign-actions {
  display: flex;
  gap: 12px;

  .arco-btn {
    flex: 1;
    height: 44px;
    font-size: 15px;
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .sign-page {
    padding: 12px;
  }

  .sign-card {
    padding: 16px;
    border-radius: 10px;
  }

  .card-title {
    font-size: 16px;
  }

  .summary-item {
    min-width: 100%;

    .value {
      font-size: 15px;
    }

    &.total .value.amount {
      font-size: 20px;
    }
  }

  .items-header {
    font-size: 12px;
    padding: 8px 10px;
  }

  .items-row {
    font-size: 13px;
    padding: 8px 10px;
  }

  .col-name {
    flex: 1.5;
  }

  .sign-actions .arco-btn {
    height: 48px;
    font-size: 16px;
  }
}
</style>
