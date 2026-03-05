<template>
  <GiPageLayout>
    <GiTable
      title="客户管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['nickname']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.username" placeholder="搜索用户名/昵称" allow-clear style="width: 200px" @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <!-- <a-button v-permission="['finance:fin-customer:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button> -->
      </template>
      <template #enablePrepaid="{ record }">
        <a-tag v-if="record.enablePrepaid" color="green" size="small">是</a-tag>
        <a-tag v-else color="gray" size="small">否</a-tag>
      </template>
      <template #allowNegativeBalance="{ record }">
        <a-tag v-if="record.allowNegativeBalance" color="orange" size="small">允许</a-tag>
        <a-tag v-else color="gray" size="small">不允许</a-tag>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['finance:fin-customer:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['finance:fin-customer:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['finance:fin-customer:delete']"
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
import { type FinCustomerQuery, type FinCustomerResp, deleteFinCustomer, listFinCustomer } from '@/apis/finance/fin-customer'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'FinanceCustomer' })

const queryForm = reactive<FinCustomerQuery>({
  username: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listFinCustomer({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '用户名', dataIndex: 'username', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '昵称', dataIndex: 'nickname', slotName: 'nickname', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '手机号', dataIndex: 'phone', minWidth: 130 },
  { title: '邮箱', dataIndex: 'email', minWidth: 180, ellipsis: true, tooltip: true },
  { title: '余额', dataIndex: 'balance', minWidth: 180, ellipsis: true, tooltip: true },
  { title: '预充值记账', dataIndex: 'enablePrepaid', slotName: 'enablePrepaid', width: 110, align: 'center' },
  { title: '允许负余额', dataIndex: 'allowNegativeBalance', slotName: 'allowNegativeBalance', width: 110, align: 'center' },
  { title: '备注', dataIndex: 'remark', minWidth: 160, ellipsis: true, tooltip: true },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['finance:fin-customer:get', 'finance:fin-customer:update', 'finance:fin-customer:delete']),
  },
]

// 重置
const reset = () => {
  queryForm.username = undefined
  search()
}

// 删除
const onDelete = (record: FinCustomerResp) => {
  return handleDelete(() => deleteFinCustomer(record.id), {
    content: `是否确定删除客户「${record.nickname || record.username}」？`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
// 新增
// const onAdd = () => {
//   AddModalRef.value?.onAdd()
// }
// 修改
const onUpdate = (record: FinCustomerResp) => {
  AddModalRef.value?.onUpdate(record.id)
}

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
// 详情
const onDetail = (record: FinCustomerResp) => {
  DetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
