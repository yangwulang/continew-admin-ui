<template>
  <GiPageLayout>
    <GiTable
      title="数据源管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['sourceName']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.sourceName" placeholder="搜索数据源名称" allow-clear style="width: 200px" @search="search" />
        <a-select v-model="queryForm.status" placeholder="状态" allow-clear style="width: 120px" @change="search">
          <a-option :value="1">启用</a-option>
          <a-option :value="2">禁用</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['novel:source:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
      </template>
      <template #status="{ record }">
        <a-tag v-if="record.status === 1" color="green" size="small">启用</a-tag>
        <a-tag v-else color="red" size="small">禁用</a-tag>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['novel:source:update']" @click="onUpdate(record)">修改</a-link>
          <a-link v-permission="['novel:source:crawl']" status="success" @click="onFullCollect(record)">全量采集</a-link>
          <a-link v-permission="['novel:source:delete']" status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="search" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message, Modal } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import {
  type NovelSourceQuery,
  type NovelSourceResp,
  deleteNovelSource,
  fullCollectNovelSource,
  listNovelSource,
} from '@/apis/novel/novel-source'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'NovelSource' })

const queryForm = reactive<NovelSourceQuery>({
  sourceName: undefined,
  status: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listNovelSource({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '数据源名称', dataIndex: 'sourceName', minWidth: 150, ellipsis: true, tooltip: true },
  { title: '数据源URL', dataIndex: 'sourceUrl', minWidth: 200, ellipsis: true, tooltip: true },
  { title: '类型', dataIndex: 'sourceType', width: 100, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80, align: 'center' },
  { title: '最后采集', dataIndex: 'lastCrawlTime', width: 170 },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 220,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['novel:source:update', 'novel:source:delete', 'novel:source:crawl']),
  },
]

const reset = () => {
  queryForm.sourceName = undefined
  queryForm.status = undefined
  search()
}

const onDelete = (record: NovelSourceResp) => {
  return handleDelete(() => deleteNovelSource(record.id), {
    content: `是否确定删除数据源「${record.sourceName}」？`,
    showModal: true,
  })
}

const onFullCollect = (record: NovelSourceResp) => {
  Modal.confirm({
    title: '全量采集确认',
    content: `是否确定对数据源「${record.sourceName}」执行全量采集？`,
    onOk: async () => {
      await fullCollectNovelSource(record.id)
      Message.success('全量采集任务已提交')
      search()
    },
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => AddModalRef.value?.onAdd()
const onUpdate = (record: NovelSourceResp) => AddModalRef.value?.onUpdate(record.id)
</script>

<style scoped lang="scss"></style>
