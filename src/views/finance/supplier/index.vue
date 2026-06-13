<template>
  <GiPageLayout>
    <GiTable
      title="供应商管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 800 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.name" placeholder="搜索供应商名称" allow-clear style="width: 200px" @search="search" />
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
        <a-button v-permission="['finance:fin-supplier:create']" type="primary" @click="onAdd">
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
          <a-link v-permission="['finance:fin-supplier:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['finance:fin-supplier:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['finance:fin-supplier:delete']"
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
import AddModal from './AddModal.vue'
import DetailDrawer from './DetailDrawer.vue'
import { type FinSupplierQuery, type FinSupplierResp, deleteFinSupplier, listFinSupplier } from '@/apis/finance/fin-supplier'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'FinanceSupplier' })

const queryForm = reactive<FinSupplierQuery>({
  name: undefined,
  status: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listFinSupplier({ ...queryForm, ...page }))

const columns: TableInstance['columns'] = [
  { title: '供应商名称', dataIndex: 'name', minWidth: 140, ellipsis: true, tooltip: true },
  { title: '联系人', dataIndex: 'contact', width: 120, ellipsis: true, tooltip: true },
  { title: '联系电话', dataIndex: 'phone', width: 140 },
  { title: '地址', dataIndex: 'address', minWidth: 180, ellipsis: true, tooltip: true },
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
    show: has.hasPermOr(['finance:fin-supplier:get', 'finance:fin-supplier:update', 'finance:fin-supplier:delete']),
  },
]

const reset = () => {
  queryForm.name = undefined
  queryForm.status = undefined
  search()
}

const onDelete = (record: FinSupplierResp) => {
  return handleDelete(() => deleteFinSupplier(record.id), {
    content: `是否确定删除供应商「${record.name}」？`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => {
  AddModalRef.value?.onAdd()
}
const onUpdate = (record: FinSupplierResp) => {
  AddModalRef.value?.onUpdate(record.id)
}

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
const onDetail = (record: FinSupplierResp) => {
  DetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
