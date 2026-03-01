<template>
  <a-drawer v-model:visible="visible" title="交易详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="客户ID">{{ dataDetail?.customerId }}</a-descriptions-item>
      <a-descriptions-item label="交易类型">
        <a-tag v-if="dataDetail?.type === 'RECHARGE'" color="green" size="small">充值</a-tag>
        <a-tag v-else-if="dataDetail?.type === 'DEBIT_BILLING'" color="orange" size="small">记账扣费</a-tag>
        <a-tag v-else color="gray" size="small">{{ dataDetail?.type }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="收支方向">
        <a-tag v-if="dataDetail?.direction === 'IN'" color="green" size="small">收入</a-tag>
        <a-tag v-else color="red" size="small">支出</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="交易金额">
        <span style="font-weight: 600">{{ dataDetail?.amount }}</span>
      </a-descriptions-item>
      <a-descriptions-item label="变动后余额">
        <span style="font-weight: 600">{{ dataDetail?.balanceAfter }}</span>
      </a-descriptions-item>
      <a-descriptions-item label="充值渠道">{{ dataDetail?.channel || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="交易状态">{{ dataDetail?.status }}</a-descriptions-item>
      <a-descriptions-item label="发生时间">{{ dataDetail?.occurTime }}</a-descriptions-item>
      <a-descriptions-item label="备注" :span="2">{{ dataDetail?.remark || '暂无' }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type FinAccountTransactionDetailResp, getFinAccountTransaction } from '@/apis/finance/fin-account-transaction'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<FinAccountTransactionDetailResp>()
const visible = ref(false)

// 查询详情
const getDataDetail = async () => {
  const { data } = await getFinAccountTransaction(dataId.value)
  dataDetail.value = data
}

// 打开
const onOpen = async (id: string) => {
  dataId.value = id
  await getDataDetail()
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
