<template>
  <a-drawer v-model:visible="visible" title="数据源详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions title="基础信息" :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID" :span="2">
        <a-typography-paragraph copyable>{{ dataDetail?.id }}</a-typography-paragraph>
      </a-descriptions-item>
      <a-descriptions-item label="数据源编码">{{ dataDetail?.sourceCode }}</a-descriptions-item>
      <a-descriptions-item label="数据源名称">{{ dataDetail?.sourceName }}</a-descriptions-item>
      <a-descriptions-item label="数据源类型">
        <a-tag v-if="dataDetail?.sourceType === 1" color="blue">CMS API</a-tag>
        <a-tag v-else-if="dataDetail?.sourceType === 2" color="green">HTTP JSON</a-tag>
        <a-tag v-else-if="dataDetail?.sourceType === 3" color="purple">网页抓取</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="状态">
        <a-tag v-if="dataDetail?.status === 1" color="green">启用</a-tag>
        <a-tag v-else color="red">禁用</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="API地址" :span="2">{{ dataDetail?.apiUrl }}</a-descriptions-item>
      <a-descriptions-item label="排序">{{ dataDetail?.sort }}</a-descriptions-item>
      <a-descriptions-item label="最后同步时间">{{ dataDetail?.lastSyncTime }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="备注" :span="2">{{ dataDetail?.remark }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type SpSourceResp, getSpSource as getDetail } from '@/apis/spide/sp-source'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<SpSourceResp>()
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
