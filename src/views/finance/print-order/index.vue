<template>
  <GiPageLayout>
    <GiTable
      title="打印订单"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1200 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['orderNo']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-select
          v-model="queryForm.status"
          placeholder="订单状态"
          allow-clear
          style="width: 150px"
          @change="search"
        >
          <a-option value="PENDING">待处理</a-option>
          <a-option value="PENDING_SIGN">待签字</a-option>
          <a-option value="CONFIRMED">已确认</a-option>
          <a-option value="PRINTING">打印中</a-option>
          <a-option value="COMPLETED">已完成</a-option>
          <a-option value="CANCELLED">已取消</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['finance:fin-print-order:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新建打印订单</template>
        </a-button>
      </template>
      <template #status="{ record }">
        <a-tag :color="statusColorMap[record.status] || 'gray'" size="small">{{ statusLabelMap[record.status] || record.status }}</a-tag>
      </template>
      <template #paymentStatus="{ record }">
        <a-tag :color="paymentStatusColorMap[record.paymentStatus] || 'gray'" size="small">
          {{ paymentStatusLabelMap[record.paymentStatus] || record.paymentStatus || '-' }}
        </a-tag>
      </template>
      <template #totalAmount="{ record }">
        <span style="font-weight: 600; color: #165dff">{{ record.totalAmount?.toFixed(2) }}</span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['finance:fin-print-order:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link
            v-if="record.paymentStatus === 'UNPAID' || record.paymentStatus === 'PARTIAL'"
            title="支付"
            style="color: #f53f3f"
            @click="onPay(record)"
          >支付</a-link>
          <a-link
            v-if="record.status === 'PENDING_SIGN' && record.billingRecordId"
            title="签名链接"
            style="color: #722ed1"
            @click="onSignLink(record)"
          >签名链接</a-link>
          <a-link
            v-if="record.status === 'PENDING'"
            v-permission="['finance:fin-print-order:delete']"
            status="danger"
            title="删除"
            @click="onDelete(record)"
          >
            删除
          </a-link>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="search" />
    <DetailDrawer ref="DetailDrawerRef" />
    <!-- 补付支付弹窗 -->
    <PaymentModal
      v-if="payingRecord"
      ref="PayModalRef"
      :order-id="payingRecord.id"
      :order-no="payingRecord.orderNo"
      :total-amount="payingRecord.totalAmount"
      :balance-paid="payingRecord.balancePaid ?? 0"
      :remain-amount="(payingRecord.totalAmount - (payingRecord.balancePaid ?? 0))"
      @paid="onPayDone"
      @closed="payingRecord = null"
    />

    <!-- 签名链接弹窗 -->
    <a-modal v-model:visible="signLinkVisible" title="签名链接" :width="500" ok-text="关闭">
      <a-space direction="vertical" fill style="width: 100%">
        <a-alert type="info">请复制以下链接发送给客户进行签名，链接提交后将自动失效</a-alert>
        <a-textarea :model-value="signLinkUrl" :auto-size="{ minRows: 2 }" readonly />
        <a-button type="primary" long @click="copySignLink">
          <template #icon><icon-copy /></template>
          复制链接
        </a-button>
      </a-space>
    </a-modal>
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import DetailDrawer from './DetailDrawer.vue'
import PaymentModal from './PaymentModal.vue'
import {
  type PrintOrderQuery,
  type PrintOrderResp,
  deletePrintOrder,
  listPrintOrder,
} from '@/apis/finance/print-order'
import { generateFinBillingSignLink } from '@/apis/finance/fin-billing-record'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import http from '@/utils/http'

defineOptions({ name: 'FinPrintOrder' })

const statusLabelMap: Record<string, string> = {
  PENDING: '待处理',
  CONFIRMED: '已确认',
  PENDING_SIGN: '待签字',
  PRINTING: '打印中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}
const statusColorMap: Record<string, string> = {
  PENDING: 'orangered',
  CONFIRMED: 'blue',
  PENDING_SIGN: 'purple',
  PRINTING: 'arcoblue',
  COMPLETED: 'green',
  CANCELLED: 'gray',
}
const paymentStatusLabelMap: Record<string, string> = {
  PAID: '已支付',
  PARTIAL: '余额已付/待补付',
  UNPAID: '待支付',
  BILLING: '记账',
}
const paymentStatusColorMap: Record<string, string> = {
  PAID: 'green',
  PARTIAL: 'orange',
  UNPAID: 'red',
  BILLING: 'purple',
}

const queryForm = reactive<PrintOrderQuery>({
  status: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listPrintOrder({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '订单编号', dataIndex: 'orderNo', width: 220 },
  { title: '客户名称', dataIndex: 'customerName', width: 150 },
  { title: '项目名称', dataIndex: 'projectName', width: 150 },
  { title: '金额', dataIndex: 'totalAmount', slotName: 'totalAmount', width: 120, align: 'right' },
  { title: '订单状态', dataIndex: 'status', slotName: 'status', width: 100, align: 'center' },
  { title: '支付状态', dataIndex: 'paymentStatus', slotName: 'paymentStatus', width: 130, align: 'center' },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 180,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['finance:fin-print-order:get', 'finance:fin-print-order:delete']),
  },
]

const reset = () => {
  queryForm.status = undefined
  search()
}

const onDelete = (record: PrintOrderResp) => {
  return handleDelete(() => deletePrintOrder([record.id]), {
    content: `是否确定删除订单「${record.orderNo}」？`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => {
  AddModalRef.value?.onOpen()
}

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
const onDetail = (record: PrintOrderResp) => {
  DetailDrawerRef.value?.onOpen(record.id)
}

// 支付按钮
const PayModalRef = ref<InstanceType<typeof PaymentModal>>()
const payingRecord = ref<PrintOrderResp | null>(null)
const onPay = async (record: PrintOrderResp) => {
  payingRecord.value = record
  await nextTick()
  PayModalRef.value?.onOpen()
}
const onPayDone = () => {
  payingRecord.value = null
  search()
}

// ===== 签名链接 =====
const signLinkVisible = ref(false)
const signLinkUrl = ref('')

const onSignLink = async (record: PrintOrderResp) => {
  if (!record.billingRecordId) {
    Message.warning('该订单未关联记账记录')
    return
  }
  try {
    const { data } = await generateFinBillingSignLink(String(record.billingRecordId))
    signLinkUrl.value = `${window.location.origin}${data}`
    signLinkVisible.value = true
    search()
  } catch (e: any) {
    Message.error(e?.msg || '生成签名链接失败')
  }
}

const copySignLink = () => {
  navigator.clipboard.writeText(signLinkUrl.value).then(() => {
    Message.success('链接已复制到剪贴板')
  }).catch(() => {
    Message.warning('复制失败，请手动选择复制')
  })
}
</script>

<style scoped lang="scss"></style>
