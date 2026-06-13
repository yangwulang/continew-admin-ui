<template>
  <a-drawer v-model:visible="visible" title="供应商详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="供应商名称">{{ dataDetail?.name }}</a-descriptions-item>
      <a-descriptions-item label="联系人">{{ dataDetail?.contact || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="联系电话">{{ dataDetail?.phone || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="状态">
        <a-tag v-if="dataDetail?.status === 1" color="green" size="small">启用</a-tag>
        <a-tag v-else color="red" size="small">禁用</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="地址" :span="2">{{ dataDetail?.address || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="备注" :span="2">{{ dataDetail?.remark || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type FinSupplierDetailResp, getFinSupplier as getDetail } from '@/apis/finance/fin-supplier'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<FinSupplierDetailResp>()
const visible = ref(false)

const getDataDetail = async () => {
  const { data } = await getDetail(dataId.value)
  dataDetail.value = data
}

const onOpen = async (id: string) => {
  dataId.value = id
  await getDataDetail()
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
