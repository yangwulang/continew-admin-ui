<template>
  <a-drawer v-model:visible="visible" title="记账详情" :width="width >= 700 ? 1100 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="记账日期">{{ dataDetail?.billingDate }}</a-descriptions-item>
      <a-descriptions-item label="客户名称">{{ dataDetail?.customerName || dataDetail?.customerId }}</a-descriptions-item>
      <a-descriptions-item label="部门">{{ dataDetail?.deptName || '未指定' }}</a-descriptions-item>
      <a-descriptions-item label="总金额">
        <span style="font-weight: 600; color: #165dff">{{ dataDetail?.totalAmount }}</span>
      </a-descriptions-item>
      <a-descriptions-item label="状态">
        <a-tag :color="statusColorMap[dataDetail?.status || ''] || 'gray'" size="small">
          {{ statusLabelMap[dataDetail?.status || ''] || dataDetail?.status }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="签名URL" :span="2">{{ dataDetail?.signUrl || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="签名时间">{{ dataDetail?.signedAt || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="审核时间">{{ dataDetail?.reviewedAt || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="创建时间" :span="2">{{ dataDetail?.createTime }}</a-descriptions-item>
    </a-descriptions>

    <a-divider orientation="left">记账明细</a-divider>
    <a-table :data="itemList" :pagination="false" size="small" :loading="itemLoading">
      <template #columns>
        <a-table-column title="类型" :width="70" align="center">
          <template #cell="{ record }">
            <a-tag v-if="record.itemType === 'PRINT'" color="arcoblue" size="small">打印</a-tag>
            <a-tag v-else color="green" size="small">物料</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="项目名称" data-index="materialName" />
        <a-table-column title="单价" data-index="unitPrice" :width="100">
          <template #cell="{ record }">{{ record.unitPrice?.toFixed(2) }}</template>
        </a-table-column>
        <a-table-column title="数量" data-index="quantity" :width="100">
          <template #cell="{ record }">{{ record.quantity?.toFixed(2) }}</template>
        </a-table-column>
        <a-table-column title="金额" data-index="amount" :width="120">
          <template #cell="{ record }">
            <span style="font-weight: 600">{{ record.amount?.toFixed(2) }}</span>
          </template>
        </a-table-column>
        <a-table-column title="备注" data-index="remark" />
      </template>
    </a-table>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type FinBillingRecordDetailResp, getFinBillingRecord } from '@/apis/finance/fin-billing-record'
import { type FinBillingItemResp, listFinBillingItem } from '@/apis/finance/fin-billing-item'

const { width } = useWindowSize()

const statusLabelMap: Record<string, string> = {
  DRAFT: '草稿',
  PENDING_SIGN: '待签名',
  PENDING_REVIEW: '待审核',
  CONFIRMED: '已确认',
  REJECTED: '已驳回',
  CANCELLED: '已取消',
}
const statusColorMap: Record<string, string> = {
  DRAFT: 'gray',
  PENDING_SIGN: 'orangered',
  PENDING_REVIEW: 'blue',
  CONFIRMED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
}

const dataId = ref('')
const dataDetail = ref<FinBillingRecordDetailResp>()
const itemList = ref<FinBillingItemResp[]>([])
const itemLoading = ref(false)
const visible = ref(false)

// 查询详情
const getDataDetail = async () => {
  const { data } = await getFinBillingRecord(dataId.value)
  dataDetail.value = data
}

// 查询明细
const getItemList = async () => {
  itemLoading.value = true
  try {
    const { data } = await listFinBillingItem({ billingRecordId: dataId.value, sort: ['id,asc'], page: 1, size: 200 })
    itemList.value = data.list || []
  } finally {
    itemLoading.value = false
  }
}

// 打开
const onOpen = async (id: string) => {
  dataId.value = id
  await Promise.all([getDataDetail(), getItemList()])
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
