<template>
  <a-drawer v-model:visible="visible" title="打印订单详情" :width="width >= 700 ? 700 : '100%'" :footer="false">
    <a-spin :loading="loading" style="width: 100%">
      <template v-if="detail">
        <!-- 订单基本信息 -->
        <a-descriptions :column="2" size="large" class="general-description">
          <a-descriptions-item label="订单编号" :span="2">{{ detail.orderNo }}</a-descriptions-item>
          <a-descriptions-item label="客户名称">{{ detail?.customerName || detail?.customerId }}</a-descriptions-item>
          <a-descriptions-item label="项目名称">{{ detail?.projectName || '—' }}</a-descriptions-item>
          <a-descriptions-item label="总金额">
            <span style="font-weight: 600; color: #f53f3f; font-size: 16px">{{ detail.totalAmount?.toFixed(2) }} 元</span>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="statusColorMap[detail.status] || 'gray'" size="small">
              {{ statusLabelMap[detail.status] || detail.status }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="打印状态">
            <a-tag :color="printStatusColorMap[detail.printStatus || 'PENDING']" size="small">
              {{ printStatusLabelMap[detail.printStatus || 'PENDING'] }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="关联记账 ID">{{ detail.billingRecordId || '暂无' }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ detail.createTime }}</a-descriptions-item>
          <a-descriptions-item label="备注" :span="2">{{ detail.remark || '暂无' }}</a-descriptions-item>
        </a-descriptions>

        <!-- 支付信息 -->
        <a-divider orientation="left">支付信息</a-divider>
        <a-descriptions :column="2" size="medium" class="general-description">
          <a-descriptions-item label="支付状态">
            <a-tag :color="paymentColorMap[detail.paymentStatus] || 'gray'" size="small">
              {{ paymentLabelMap[detail.paymentStatus] || detail.paymentStatus }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="支付渠道">{{ detail.payChannel || '—' }}</a-descriptions-item>
          <a-descriptions-item label="余额已付">¥ {{ (detail.balancePaid ?? 0).toFixed(2) }}</a-descriptions-item>
          <a-descriptions-item label="三方已付">¥ {{ (detail.thirdPartyPaid ?? 0).toFixed(2) }}</a-descriptions-item>
          <a-descriptions-item v-if="detail.expireTime" label="支付过期时间" :span="2">{{ detail.expireTime }}</a-descriptions-item>
        </a-descriptions>

        <!-- 优惠券信息 -->
        <template v-if="detail.couponDetails && detail.couponDetails.length > 0">
          <a-divider orientation="left">优惠券信息</a-divider>
          <a-descriptions :column="2" size="medium" class="general-description">
            <a-descriptions-item label="原始金额">
              <span style="text-decoration: line-through; color: #86909c">¥ {{ detail.originalAmount?.toFixed(2) }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="优惠抵扣">
              <span style="color: #f53f3f; font-weight: 600">-¥ {{ detail.discountAmount?.toFixed(2) }}</span>
            </a-descriptions-item>
          </a-descriptions>
          <div style="margin-top: 8px">
            <div v-for="c in detail.couponDetails" :key="c.recordId" style="margin-bottom: 8px; padding: 8px; background: var(--color-fill-1); border-radius: 4px">
              <a-space>
                <a-tag color="purple" size="small">{{ c.templateName }}</a-tag>
                <a-tag size="small" :color="c.couponType === 'DISCOUNT' ? 'blue' : 'green'">
                  {{ c.couponType === 'DISCOUNT' ? `${(c.discountRate ?? 0) * 10}折` : `减${c.reduceAmount?.toFixed(2)}元` }}
                </a-tag>
                <span style="color: #f53f3f; font-weight: 600">-¥{{ c.discountAmount?.toFixed(2) }}</span>
              </a-space>
            </div>
          </div>
        </template>
        <template v-else-if="detail.couponCode">
          <a-divider orientation="left">优惠券信息</a-divider>
          <a-descriptions :column="2" size="medium" class="general-description">
            <a-descriptions-item label="优惠券码" :span="2">
              <a-tag color="purple" size="medium">{{ detail.couponCode }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="原始金额">
              <span style="text-decoration: line-through; color: #86909c">¥ {{ detail.originalAmount?.toFixed(2) }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="优惠抵扣">
              <span style="color: #f53f3f; font-weight: 600">-¥ {{ detail.discountAmount?.toFixed(2) }}</span>
            </a-descriptions-item>
          </a-descriptions>
        </template>

        <!-- 文件项列表 -->
        <a-divider orientation="left">打印文件明细</a-divider>
        <a-empty v-if="!detail.items || detail.items.length === 0" description="暂无文件项" />
        <template v-else>
          <a-card
            v-for="(item, idx) in detail.items"
            :key="item.id"
            style="margin-bottom: 12px"
            :body-style="{ padding: '12px' }"
          >
            <template #title>
              <span>文件 {{ idx + 1 }} - {{ item.fileName }}</span>
            </template>
            <div style="margin-bottom: 8px">
              <a-space>
                <a-tag color="blue">{{ item.pageCount }} 页</a-tag>
                <a-tag color="green">{{ item.copies }} 份</a-tag>
                <a-tag color="arcoblue">小计：{{ item.subtotalAmount?.toFixed(2) }} 元</a-tag>
                <a-tag :color="printStatusColorMap[item.printStatus || 'PENDING']">
                  {{ printStatusLabelMap[item.printStatus || 'PENDING'] }}
                </a-tag>
              </a-space>
            </div>
            <div style="margin-bottom: 8px">
              <a-space>
                <a-button size="mini" @click="updateItemStatus(item.id, 'PRINTING')">设为打印中</a-button>
                <a-button size="mini" status="success" @click="updateItemStatus(item.id, 'COMPLETED')">设为完成</a-button>
                <a-button size="mini" status="danger" @click="updateItemStatus(item.id, 'FAILED')">设为失败</a-button>
                <a-button size="mini" @click="updateItemStatus(item.id, 'PENDING')">重置为待打印</a-button>
              </a-space>
            </div>
            <a-table :data="item.options" :pagination="false" size="small" :show-header="true">
              <template #columns>
                <a-table-column title="属性" data-index="attributeName" :width="120" />
                <a-table-column title="选项" data-index="optionName" :width="120" />
                <a-table-column title="计价方式" data-index="priceMode" :width="100">
                  <template #cell="{ record }">
                    <a-tag size="small" :color="priceModeColor[record.priceMode]">{{ priceModeLabel[record.priceMode] }}</a-tag>
                  </template>
                </a-table-column>
                <a-table-column title="单价/值" data-index="price" :width="100" />
                <a-table-column title="计算金额" data-index="calculatedAmount" :width="120">
                  <template #cell="{ record }">
                    <span style="font-weight: 600">{{ record.calculatedAmount?.toFixed(2) }}</span>
                  </template>
                </a-table-column>
              </template>
            </a-table>
          </a-card>
        </template>
      </template>
    </a-spin>
  </a-drawer>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { type PrintOrderFullDetailResp, getPrintOrderFullDetail, updateItemPrintStatus } from '@/apis/finance/print-order'

const { width } = useWindowSize()

const priceModeLabel: Record<string, string> = { PER_PAGE: '按页', FIXED: '固定', MULTIPLIER: '乘数' }
const priceModeColor: Record<string, string> = { PER_PAGE: 'blue', FIXED: 'green', MULTIPLIER: 'orange' }

const printStatusLabelMap: Record<string, string> = {
  PENDING: '待打印',
  PRINTING: '打印中',
  COMPLETED: '已完成',
  PARTIAL_FAILED: '部分失败',
  FAILED: '全部失败',
}
const printStatusColorMap: Record<string, string> = {
  PENDING: 'orangered',
  PRINTING: 'arcoblue',
  COMPLETED: 'green',
  PARTIAL_FAILED: 'orange',
  FAILED: 'red',
}

const statusLabelMap: Record<string, string> = {
  PENDING: '待处理',
  CONFIRMED: '已确认',
  PRINTING: '打印中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}
const statusColorMap: Record<string, string> = {
  PENDING: 'orangered',
  CONFIRMED: 'blue',
  PRINTING: 'arcoblue',
  COMPLETED: 'green',
  CANCELLED: 'gray',
}
const paymentLabelMap: Record<string, string> = { PAID: '已支付', PARTIAL: '余额已付/待补付', UNPAID: '待支付', BILLING: '记账' }
const paymentColorMap: Record<string, string> = { PAID: 'green', PARTIAL: 'orange', UNPAID: 'red', BILLING: 'purple' }

const visible = ref(false)
const loading = ref(false)
const detail = ref<PrintOrderFullDetailResp>()

const onOpen = async (id: string) => {
  detail.value = undefined
  loading.value = true
  visible.value = true
  try {
    const { data } = await getPrintOrderFullDetail(id)
    detail.value = data
  } finally {
    loading.value = false
  }
}

const updateItemStatus = async (itemId: string, status: string) => {
  try {
    await updateItemPrintStatus(itemId, status)
    Message.success('打印状态已更新')
    if (detail.value) {
      const { data } = await getPrintOrderFullDetail(detail.value.id)
      detail.value = data
    }
  } catch (e: any) {
    Message.error(e?.msg || '更新失败')
  }
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
