<template>
  <a-drawer v-model:visible="visible" title="客户地址详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="客户">{{ dataDetail?.customerName }}</a-descriptions-item>
      <a-descriptions-item label="默认地址">
        <a-tag v-if="dataDetail?.isDefault" color="green" size="small">是</a-tag>
        <a-tag v-else color="gray" size="small">否</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="联系人">{{ dataDetail?.contactName }}</a-descriptions-item>
      <a-descriptions-item label="联系电话">{{ dataDetail?.contactPhone }}</a-descriptions-item>
      <a-descriptions-item label="省份">{{ dataDetail?.province }}</a-descriptions-item>
      <a-descriptions-item label="城市">{{ dataDetail?.city }}</a-descriptions-item>
      <a-descriptions-item label="区/县">{{ dataDetail?.district }}</a-descriptions-item>
      <a-descriptions-item label="详细地址">{{ dataDetail?.detailAddress }}</a-descriptions-item>
      <a-descriptions-item label="经度">{{ dataDetail?.longitude ?? '未设置' }}</a-descriptions-item>
      <a-descriptions-item label="纬度">{{ dataDetail?.latitude ?? '未设置' }}</a-descriptions-item>
      <a-descriptions-item label="备注" :span="2">{{ dataDetail?.remark || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="修改时间">{{ dataDetail?.updateTime || '暂无' }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type FinCustomerAddressDetailResp, getFinCustomerAddress as getDetail } from '@/apis/finance/fin-customer-address'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<FinCustomerAddressDetailResp>()
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
