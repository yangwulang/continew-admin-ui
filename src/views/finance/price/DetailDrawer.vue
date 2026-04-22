<template>
  <a-drawer v-model:visible="visible" title="客户物料价格详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="客户">{{ dataDetail?.customerName }}</a-descriptions-item>
      <a-descriptions-item label="物料">{{ dataDetail?.materialName }}</a-descriptions-item>
      <a-descriptions-item label="专属单价">
        <span style="font-weight: 600">{{ dataDetail?.unitPrice?.toFixed(2) }}</span>
      </a-descriptions-item>
      <a-descriptions-item label="生效时间">{{ dataDetail?.effectiveFrom?.replace('T', ' ') }}</a-descriptions-item>
      <a-descriptions-item label="失效时间">{{ dataDetail?.effectiveTo?.replace('T', ' ') || '长期有效' }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type FinCustomerMaterialPriceDetailResp, getFinCustomerMaterialPrice as getDetail } from '@/apis/finance/fin-customer-material-price'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<FinCustomerMaterialPriceDetailResp>()
const visible = ref(false)

// 查询详情
const getDataDetail = async () => {
  const { data } = await getDetail(dataId.value)
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
