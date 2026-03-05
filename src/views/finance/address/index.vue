<template>
  <GiPageLayout>
    <GiTable
      title="客户地址管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1200 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['contactName']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-select
          v-model="queryForm.customerId"
          :options="customerOptions"
          placeholder="请选择客户"
          allow-clear
          allow-search
          style="width: 180px"
          @change="search"
        />
        <a-input-search v-model="queryForm.contactName" placeholder="搜索联系人姓名" allow-clear style="width: 180px" @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['finance:fin-customer-address:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['finance:fin-customer-address:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #fullAddress="{ record }">
        {{ record.province }}{{ record.city }}{{ record.district }} {{ record.detailAddress }}
      </template>
      <template #isDefault="{ record }">
        <a-tag v-if="record.isDefault" color="green" size="small">默认</a-tag>
        <a-link v-else size="small" @click="onSetDefault(record)">设为默认</a-link>
      </template>
      <template #coordinate="{ record }">
        <span v-if="record.longitude && record.latitude">{{ record.longitude }}, {{ record.latitude }}</span>
        <span v-else style="color: var(--color-text-3)">未设置</span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['finance:fin-customer-address:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['finance:fin-customer-address:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['finance:fin-customer-address:delete']"
            status="danger"
            :disabled="record.isDefault"
            :title="record.isDefault ? '默认地址不可删除' : '删除'"
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
import { Message } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import DetailDrawer from './DetailDrawer.vue'
import {
  type FinCustomerAddressQuery,
  type FinCustomerAddressResp,
  deleteFinCustomerAddress,
  exportFinCustomerAddress,
  listFinCustomerAddress,
  setDefaultAddress,
} from '@/apis/finance/fin-customer-address'
import type { LabelValueState } from '@/types/global'
import { useDownload, useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import http from '@/utils/http'

defineOptions({ name: 'FinanceAddress' })

// 客户下拉选项
const customerOptions = ref<LabelValueState[]>([])
const loadCustomers = async () => {
  try {
    const { data } = await http.get<LabelValueState[]>('/finance/fin-customer/dict')
    customerOptions.value = data || []
  } catch {
    customerOptions.value = []
  }
}
onMounted(() => loadCustomers())

const queryForm = reactive<FinCustomerAddressQuery>({
  customerId: undefined,
  contactName: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listFinCustomerAddress({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '客户', dataIndex: 'customerName', width: 120, ellipsis: true, tooltip: true },
  { title: '联系人', dataIndex: 'contactName', width: 100 },
  { title: '联系电话', dataIndex: 'contactPhone', width: 130 },
  { title: '完整地址', dataIndex: 'fullAddress', slotName: 'fullAddress', minWidth: 260, ellipsis: true, tooltip: true },
  { title: '坐标', dataIndex: 'coordinate', slotName: 'coordinate', width: 180 },
  { title: '默认', dataIndex: 'isDefault', slotName: 'isDefault', width: 100, align: 'center' },
  { title: '备注', dataIndex: 'remark', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['finance:fin-customer-address:get', 'finance:fin-customer-address:update', 'finance:fin-customer-address:delete']),
  },
]

// 重置
const reset = () => {
  queryForm.customerId = undefined
  queryForm.contactName = undefined
  search()
}

// 设为默认
const onSetDefault = async (record: FinCustomerAddressResp) => {
  await setDefaultAddress(record.id)
  Message.success('设置成功')
  search()
}

// 删除
const onDelete = (record: FinCustomerAddressResp) => {
  if (record.isDefault) return
  return handleDelete(() => deleteFinCustomerAddress(record.id), {
    content: `是否确定删除联系人「${record.contactName}」的地址？`,
    showModal: true,
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportFinCustomerAddress(queryForm))
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
// 新增
const onAdd = () => {
  AddModalRef.value?.onAdd()
}
// 修改
const onUpdate = (record: FinCustomerAddressResp) => {
  AddModalRef.value?.onUpdate(record.id)
}

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
// 详情
const onDetail = (record: FinCustomerAddressResp) => {
  DetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
