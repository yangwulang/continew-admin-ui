<template>
  <GiPageLayout>
    <GiTable
      title="分类管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 800 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['categoryName']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.categoryName" placeholder="搜索分类名称" allow-clear style="width: 200px" @search="search" />
        <a-select v-model="queryForm.sourceId" placeholder="数据源" allow-clear style="width: 150px" @change="search">
          <a-option v-for="item in sourceDict" :key="item.value" :value="item.value" :label="item.label" />
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['spide:sp-category:create']" type="primary" @click="onAdd">
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
          <a-link v-permission="['spide:sp-category:update']" @click="onUpdate(record)">修改</a-link>
          <a-link v-permission="['spide:sp-category:delete']" status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="search" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import { type SpCategoryQuery, type SpCategoryResp, deleteSpCategory, listSpCategory } from '@/apis/spide/sp-category'
import { listSpSourceDict } from '@/apis/spide/sp-source'
import type { LabelValueState } from '@/types/global'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'SpCategory' })

const queryForm = reactive<SpCategoryQuery>({
  categoryName: undefined,
  sourceId: undefined,
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
  handleDelete,
} = useTable((page) => listSpCategory({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '分类编码', dataIndex: 'categoryCode', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '分类名称', dataIndex: 'categoryName', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '排序', dataIndex: 'sort', width: 80, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80, align: 'center' },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 140,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['spide:sp-category:update', 'spide:sp-category:delete']),
  },
]

const reset = () => {
  queryForm.categoryName = undefined
  queryForm.sourceId = undefined
  search()
}

const onDelete = (record: SpCategoryResp) => {
  return handleDelete(() => deleteSpCategory(record.id), {
    content: `是否确定删除分类「${record.categoryName}」？`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => AddModalRef.value?.onAdd()
const onUpdate = (record: SpCategoryResp) => AddModalRef.value?.onUpdate(record.id)
</script>

<style scoped lang="scss"></style>
