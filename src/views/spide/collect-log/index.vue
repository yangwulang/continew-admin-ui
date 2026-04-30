<template>
  <GiPageLayout>
    <GiTable
      title="采集日志"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1100 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['sourceId']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-select v-model="queryForm.sourceId" placeholder="数据源" allow-clear style="width: 150px" @change="search">
          <a-option v-for="item in sourceDict" :key="item.value" :value="item.value" :label="item.label" />
        </a-select>
        <a-select v-model="queryForm.collectType" placeholder="采集类型" allow-clear style="width: 130px" @change="search">
          <a-option :value="1">全量采集</a-option>
          <a-option :value="2">增量采集</a-option>
          <a-option :value="3">单部采集</a-option>
        </a-select>
        <a-select v-model="queryForm.status" placeholder="状态" allow-clear style="width: 120px" @change="search">
          <a-option :value="1">成功</a-option>
          <a-option :value="2">失败</a-option>
          <a-option :value="3">进行中</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #collectType="{ record }">
        <a-tag v-if="record.collectType === 1" color="blue" size="small">全量采集</a-tag>
        <a-tag v-else-if="record.collectType === 2" color="green" size="small">增量采集</a-tag>
        <a-tag v-else-if="record.collectType === 3" color="purple" size="small">单部采集</a-tag>
      </template>
      <template #status="{ record }">
        <a-tag v-if="record.status === 1" color="green" size="small">成功</a-tag>
        <a-tag v-else-if="record.status === 2" color="red" size="small">失败</a-tag>
        <a-tag v-else-if="record.status === 3" color="orange" size="small">进行中</a-tag>
      </template>
      <template #action="{ record }">
        <a-link @click="onDetail(record)">详情</a-link>
      </template>
    </GiTable>

    <DetailDrawer ref="DetailDrawerRef" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import DetailDrawer from './DetailDrawer.vue'
import { type SpCollectLogQuery, type SpCollectLogResp, listSpCollectLog } from '@/apis/spide/sp-collect-log'
import { listSpSourceDict } from '@/apis/spide/sp-source'
import type { LabelValueState } from '@/types/global'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'

defineOptions({ name: 'SpCollectLog' })

const queryForm = reactive<SpCollectLogQuery>({
  sourceId: undefined,
  collectType: undefined,
  status: undefined,
  sort: ['id,desc'],
})

const sourceDict = ref<LabelValueState[]>([])
const getSourceDict = async () => {
  const { data } = await listSpSourceDict()
  sourceDict.value = data
}
getSourceDict()

const {
  tableData: dataList,
  loading,
  pagination,
  search,
} = useTable((page) => listSpCollectLog({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '采集类型', dataIndex: 'collectType', slotName: 'collectType', width: 100, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 90, align: 'center' },
  { title: '总数', dataIndex: 'totalCount', width: 80, align: 'center' },
  { title: '成功', dataIndex: 'successCount', width: 80, align: 'center' },
  { title: '失败', dataIndex: 'failCount', width: 80, align: 'center' },
  { title: '耗时(秒)', dataIndex: 'duration', width: 100, align: 'center' },
  { title: '开始时间', dataIndex: 'startTime', width: 170 },
  { title: '结束时间', dataIndex: 'endTime', width: 170 },
  { title: '错误信息', dataIndex: 'errorMsg', minWidth: 200, ellipsis: true, tooltip: true },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 80,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
  },
]

const reset = () => {
  queryForm.sourceId = undefined
  queryForm.collectType = undefined
  queryForm.status = undefined
  search()
}

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
const onDetail = (record: SpCollectLogResp) => DetailDrawerRef.value?.onOpen(record.id)
</script>

<style scoped lang="scss"></style>
