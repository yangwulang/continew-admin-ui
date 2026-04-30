<template>
  <GiPageLayout>
    <GiTable
      title="数据源管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1200 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['sourceName']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.sourceName" placeholder="搜索数据源名称" allow-clear style="width: 200px" @search="search" />
        <a-select v-model="queryForm.sourceType" placeholder="数据源类型" allow-clear style="width: 150px" @change="search">
          <a-option :value="1">CMS API</a-option>
          <a-option :value="2">HTTP JSON</a-option>
          <a-option :value="3">网页抓取</a-option>
        </a-select>
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
        <a-button v-permission="['spide:sp-source:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
      </template>
      <template #sourceType="{ record }">
        <a-tag v-if="record.sourceType === 1" color="blue" size="small">CMS API</a-tag>
        <a-tag v-else-if="record.sourceType === 2" color="green" size="small">HTTP JSON</a-tag>
        <a-tag v-else-if="record.sourceType === 3" color="purple" size="small">网页抓取</a-tag>
      </template>
      <template #status="{ record }">
        <a-tag v-if="record.status === 1" color="green" size="small">启用</a-tag>
        <a-tag v-else color="red" size="small">禁用</a-tag>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['spide:sp-source:get']" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['spide:sp-source:update']" @click="onUpdate(record)">修改</a-link>
          <a-link @click="onFullCollect(record)">全量采集</a-link>
          <a-link @click="onIncrementalCollect(record)">增量采集</a-link>
          <a-link v-permission="['spide:sp-source:delete']" status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="search" />
    <DetailDrawer ref="DetailDrawerRef" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message, Modal } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import DetailDrawer from './DetailDrawer.vue'
import { type SpSourceQuery, type SpSourceResp, deleteSpSource, fullCollect, incrementalCollect, listSpSource } from '@/apis/spide/sp-source'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'SpSource' })

const queryForm = reactive<SpSourceQuery>({
  sourceName: undefined,
  sourceType: undefined,
  status: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listSpSource({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '数据源编码', dataIndex: 'sourceCode', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '数据源名称', dataIndex: 'sourceName', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '类型', dataIndex: 'sourceType', slotName: 'sourceType', width: 100, align: 'center' },
  { title: 'API地址', dataIndex: 'apiUrl', minWidth: 200, ellipsis: true, tooltip: true },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80, align: 'center' },
  { title: '排序', dataIndex: 'sort', width: 70, align: 'center' },
  { title: '最后同步', dataIndex: 'lastSyncTime', width: 170 },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 260,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['spide:sp-source:get', 'spide:sp-source:update', 'spide:sp-source:delete']),
  },
]

const reset = () => {
  queryForm.sourceName = undefined
  queryForm.sourceType = undefined
  queryForm.status = undefined
  search()
}

const onDelete = (record: SpSourceResp) => {
  return handleDelete(() => deleteSpSource(record.id), {
    content: `是否确定删除数据源「${record.sourceName}」？`,
    showModal: true,
  })
}

const onFullCollect = (record: SpSourceResp) => {
  Modal.confirm({
    title: '全量采集确认',
    content: `是否确定对数据源「${record.sourceName}」执行全量采集？`,
    onOk: async () => {
      await fullCollect(record.id)
      Message.success('全量采集任务已提交')
      search()
    },
  })
}

const onIncrementalCollect = (record: SpSourceResp) => {
  Modal.confirm({
    title: '增量采集确认',
    content: `是否确定对数据源「${record.sourceName}」执行增量采集？`,
    onOk: async () => {
      await incrementalCollect(record.id)
      Message.success('增量采集任务已提交')
      search()
    },
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => AddModalRef.value?.onAdd()
const onUpdate = (record: SpSourceResp) => AddModalRef.value?.onUpdate(record.id)

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
const onDetail = (record: SpSourceResp) => DetailDrawerRef.value?.onOpen(record.id)
</script>

<style scoped lang="scss"></style>
