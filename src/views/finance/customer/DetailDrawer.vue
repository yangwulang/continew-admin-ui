<template>
  <a-drawer v-model:visible="visible" title="客户详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="用户名">{{ dataDetail?.username }}</a-descriptions-item>
      <a-descriptions-item label="昵称">{{ dataDetail?.nickname || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="手机号">{{ dataDetail?.phone || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="邮箱">{{ dataDetail?.email || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="预充值记账">
        <a-tag v-if="dataDetail?.enablePrepaid" color="green" size="small">启用</a-tag>
        <a-tag v-else color="gray" size="small">禁用</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="允许负余额">
        <a-tag v-if="dataDetail?.allowNegativeBalance" color="orange" size="small">允许</a-tag>
        <a-tag v-else color="gray" size="small">不允许</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="备注" :span="2">{{ dataDetail?.remark || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type FinCustomerDetailResp, getFinCustomer as getDetail } from '@/apis/finance/fin-customer'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<FinCustomerDetailResp>()
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
