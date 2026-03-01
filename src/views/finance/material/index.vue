<template>
  <GiPageLayout>
    <template #left>
      <CategoryTree ref="CategoryTreeRef" @node-click="handleSelectCategory" @refresh="refreshCategories" />
    </template>
    <GiTable
      title="物料管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.name" placeholder="搜索物料名称" allow-clear style="width: 200px" @search="search" />
        <a-select
          v-model="queryForm.status"
          placeholder="状态"
          allow-clear
          style="width: 120px"
          @change="search"
        >
          <a-option :value="1">启用</a-option>
          <a-option :value="2">禁用</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['finance:fin-material:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
      </template>
      <template #status="{ record }">
        <a-tag v-if="record.status === 1" color="green" size="small">启用</a-tag>
        <a-tag v-else color="red" size="small">禁用</a-tag>
      </template>
      <template #defaultUnitPrice="{ record }">
        <span style="font-weight: 600">{{ record.defaultUnitPrice?.toFixed(2) }}</span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['finance:fin-material:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['finance:fin-material:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['finance:fin-material:delete']"
            status="danger"
            title="删除"
            @click="onDelete(record)"
          >
            删除
          </a-link>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="search" />
    <DetailDrawer ref="DetailDrawerRef" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import CategoryTree from './CategoryTree.vue'
import AddModal from './AddModal.vue'
import DetailDrawer from './DetailDrawer.vue'
import { type FinMaterialQuery, type FinMaterialResp, deleteFinMaterial, listFinMaterial } from '@/apis/finance/fin-material'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'FinanceMaterial' })

const CategoryTreeRef = ref<InstanceType<typeof CategoryTree>>()

const queryForm = reactive<FinMaterialQuery>({
  name: undefined,
  categoryId: undefined,
  status: undefined,
  sort: ['id,desc'],
})

// 处理分类树选择
const handleSelectCategory = (keys: Array<any>) => {
  if (keys && keys.length > 0) {
    queryForm.categoryId = keys[0]
  } else {
    queryForm.categoryId = undefined
  }
  search()
}

// 刷新分类树
const refreshCategories = () => {
  CategoryTreeRef.value?.getCategoryList()
}

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listFinMaterial({ ...queryForm, ...page }), { immediate: false })

const columns: TableInstance['columns'] = [
  { title: '物料名称', dataIndex: 'name', slotName: 'name', minWidth: 140, ellipsis: true, tooltip: true },
  { title: '物料编码', dataIndex: 'code', width: 140, ellipsis: true, tooltip: true },
  { title: '默认单价', dataIndex: 'defaultUnitPrice', slotName: 'defaultUnitPrice', width: 120, align: 'right' },
  { title: '计量单位', dataIndex: 'unit', width: 100, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80, align: 'center' },
  { title: '备注', dataIndex: 'remark', minWidth: 160, ellipsis: true, tooltip: true },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['finance:fin-material:get', 'finance:fin-material:update', 'finance:fin-material:delete']),
  },
]

// 重置
const reset = () => {
  queryForm.name = undefined
  queryForm.categoryId = undefined
  queryForm.status = undefined
  search()
}

// 删除
const onDelete = (record: FinMaterialResp) => {
  return handleDelete(() => deleteFinMaterial(record.id), {
    content: `是否确定删除物料「${record.name}」？`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => {
  AddModalRef.value?.onAdd()
}
const onUpdate = (record: FinMaterialResp) => {
  AddModalRef.value?.onUpdate(record.id)
}

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
const onDetail = (record: FinMaterialResp) => {
  DetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
