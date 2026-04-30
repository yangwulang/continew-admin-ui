<template>
  <a-drawer v-model:visible="visible" title="采集日志详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions title="基础信息" :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID" :span="2">
        <a-typography-paragraph copyable>{{ dataDetail?.id }}</a-typography-paragraph>
      </a-descriptions-item>
      <a-descriptions-item label="采集类型">
        <a-tag v-if="dataDetail?.collectType === 1" color="blue">全量采集</a-tag>
        <a-tag v-else-if="dataDetail?.collectType === 2" color="green">增量采集</a-tag>
        <a-tag v-else-if="dataDetail?.collectType === 3" color="purple">单部采集</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="状态">
        <a-tag v-if="dataDetail?.status === 1" color="green">成功</a-tag>
        <a-tag v-else-if="dataDetail?.status === 2" color="red">失败</a-tag>
        <a-tag v-else-if="dataDetail?.status === 3" color="orange">进行中</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="总数">{{ dataDetail?.totalCount }}</a-descriptions-item>
      <a-descriptions-item label="成功数">{{ dataDetail?.successCount }}</a-descriptions-item>
      <a-descriptions-item label="失败数">{{ dataDetail?.failCount }}</a-descriptions-item>
      <a-descriptions-item label="耗时(秒)">{{ dataDetail?.duration }}</a-descriptions-item>
      <a-descriptions-item label="开始时间">{{ dataDetail?.startTime }}</a-descriptions-item>
      <a-descriptions-item label="结束时间">{{ dataDetail?.endTime }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item v-if="dataDetail?.errorMsg" label="错误信息" :span="2">
        <a-typography-paragraph type="error">{{ dataDetail?.errorMsg }}</a-typography-paragraph>
      </a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type SpCollectLogResp, getSpCollectLog as getDetail } from '@/apis/spide/sp-collect-log'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<SpCollectLogResp>()
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
