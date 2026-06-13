<template>
  <GiPageLayout>
    <GiTable
      title="爬取日志"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-select v-model="queryForm.status" placeholder="状态" allow-clear style="width: 120px" @change="search">
          <a-option :value="0">失败</a-option>
          <a-option :value="1">成功</a-option>
          <a-option :value="2">进行中</a-option>
        </a-select>
        <a-select v-model="queryForm.crawlType" placeholder="类型" allow-clear style="width: 130px" @change="search">
          <a-option :value="1">书籍列表</a-option>
          <a-option :value="2">章节内容</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #crawlType="{ record }">
        <a-tag v-if="record.crawlType === 1" color="blue" size="small">书籍列表</a-tag>
        <a-tag v-else-if="record.crawlType === 2" color="cyan" size="small">章节内容</a-tag>
      </template>
      <template #status="{ record }">
        <a-tag v-if="record.status === 0" color="red" size="small">失败</a-tag>
        <a-tag v-else-if="record.status === 1" color="green" size="small">成功</a-tag>
        <a-tag v-else-if="record.status === 2" color="orange" size="small">进行中</a-tag>
      </template>
      <template #duration="{ record }">
        {{ record.duration ? `${(record.duration / 1000).toFixed(1)}s` : '-' }}
      </template>
    </GiTable>
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { type NovelCrawlLogQuery, listNovelCrawlLog } from '@/apis/novel/novel-crawl-log'
import { useTable } from '@/hooks'

defineOptions({ name: 'NovelCrawlLog' })

const queryForm = reactive<NovelCrawlLogQuery>({
  status: undefined,
  crawlType: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
} = useTable((page) => listNovelCrawlLog({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '数据源ID', dataIndex: 'sourceId', width: 100 },
  { title: '小说ID', dataIndex: 'novelId', width: 100 },
  { title: '类型', dataIndex: 'crawlType', slotName: 'crawlType', width: 100, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 90, align: 'center' },
  { title: '总数', dataIndex: 'totalCount', width: 70, align: 'center' },
  { title: '成功', dataIndex: 'successCount', width: 70, align: 'center' },
  { title: '失败', dataIndex: 'failCount', width: 70, align: 'center' },
  { title: '耗时', dataIndex: 'duration', slotName: 'duration', width: 80, align: 'center' },
  { title: '开始时间', dataIndex: 'startTime', width: 170 },
  { title: '错误信息', dataIndex: 'errorMsg', minWidth: 200, ellipsis: true, tooltip: true },
]

const reset = () => {
  queryForm.status = undefined
  queryForm.crawlType = undefined
  search()
}
</script>

<style scoped lang="scss"></style>
