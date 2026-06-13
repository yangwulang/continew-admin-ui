<template>
  <a-drawer
    v-model:visible="visible"
    title="小说详情"
    :width="width >= 600 ? 600 : '100%'"
  >
    <a-descriptions :column="1" bordered size="large">
      <a-descriptions-item label="书名">{{ detail.bookName }}</a-descriptions-item>
      <a-descriptions-item label="作者">{{ detail.author }}</a-descriptions-item>
      <a-descriptions-item label="分类">
        <a-space v-if="detail.categoryNames?.length">
          <a-tag v-for="name in detail.categoryNames" :key="name" color="blue">{{ name }}</a-tag>
        </a-space>
        <span v-else>暂无</span>
      </a-descriptions-item>
      <a-descriptions-item label="状态">
        <a-tag v-if="detail.status === 1" color="gray">草稿</a-tag>
        <a-tag v-else-if="detail.status === 2" color="orange">待审核</a-tag>
        <a-tag v-else-if="detail.status === 3" color="green">已上架</a-tag>
        <a-tag v-else-if="detail.status === 4" color="red">已驳回</a-tag>
        <a-tag v-else-if="detail.status === 5" color="gray">已下架</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="来源类型">
        <a-tag v-if="detail.sourceType === 1" color="blue">用户上传</a-tag>
        <a-tag v-else-if="detail.sourceType === 2" color="cyan">管理员上传</a-tag>
        <a-tag v-else-if="detail.sourceType === 3" color="purple">爬取</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="章节数">{{ detail.chapterCount }}</a-descriptions-item>
      <a-descriptions-item label="总字数">{{ detail.wordCount }}</a-descriptions-item>
      <a-descriptions-item label="简介">{{ detail.description || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="审核人">{{ detail.reviewer || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="审核时间">{{ detail.reviewTime || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="审核意见">{{ detail.reviewRemark || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ detail.createTime }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script lang="ts" setup>
import { useWindowSize } from '@vueuse/core'
import { type NovelInfoDetailResp, getNovelInfo } from '@/apis/novel/novel-info'

const { width } = useWindowSize()
const visible = ref(false)
const detail = ref<Partial<NovelInfoDetailResp>>({})

const onOpen = async (id: string) => {
  const { data } = await getNovelInfo(id)
  detail.value = data
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style lang="scss" scoped></style>
