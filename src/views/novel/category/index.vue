<template>
  <GiPageLayout>
    <GiTable
      title="小说分类管理"
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
        <a-select v-model="queryForm.status" placeholder="状态" allow-clear style="width: 100px" @change="search">
          <a-option :value="1">启用</a-option>
          <a-option :value="2">禁用</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['novel:category:create']" type="primary" @click="onAdd">
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
          <a-link v-permission="['novel:category:update']" @click="onUpdate(record)">修改</a-link>
          <a-link v-permission="['novel:category:delete']" status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="search" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import {
  type NovelCategoryQuery,
  type NovelCategoryResp,
  deleteNovelCategory,
  listNovelCategory,
} from '@/apis/novel/novel-category'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'NovelCategory' })

const queryForm = reactive<NovelCategoryQuery>({
  categoryName: undefined,
  status: undefined,
  sort: ['sort,asc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listNovelCategory({ ...queryForm, ...page }), { immediate: true })

const reset = () => {
  queryForm.categoryName = undefined
  queryForm.status = undefined
  search()
}

const columns: TableInstance['columns'] = [
  { title: '分类名称', dataIndex: 'categoryName', minWidth: 200 },
  { title: '排序', dataIndex: 'sort', width: 80, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80, align: 'center' },
  { title: '描述', dataIndex: 'description', minWidth: 200, ellipsis: true, tooltip: true },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 150,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['novel:category:update', 'novel:category:delete']),
  },
]

const onDelete = (record: NovelCategoryResp) => {
  return handleDelete(() => deleteNovelCategory(record.id), {
    content: `是否确定删除分类「${record.categoryName}」？`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => AddModalRef.value?.onAdd()
const onUpdate = (record: NovelCategoryResp) => AddModalRef.value?.onUpdate(record.id)
</script>

<style scoped lang="scss"></style>
