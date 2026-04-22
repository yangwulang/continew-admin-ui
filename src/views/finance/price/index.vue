<template>
  <GiPageLayout>
    <GiTable
      title="客户物料价格"
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
        <a-select
          v-model="queryForm.customerId"
          placeholder="选择客户"
          allow-clear
          allow-search
          style="width: 200px"
          @change="search"
        >
          <a-option v-for="item in customerDict" :key="item.value" :value="item.value" :label="item.label" />
        </a-select>
        <a-select
          v-model="queryForm.materialId"
          placeholder="选择物料"
          allow-clear
          allow-search
          style="width: 200px"
          @change="search"
        >
          <a-option v-for="item in materialDict" :key="item.value" :value="item.value" :label="item.label" />
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['finance:fin-customer-material-price:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
      </template>
      <template #unitPrice="{ record }">
        <span style="font-weight: 600">{{ record.unitPrice?.toFixed(2) }}</span>
      </template>
      <template #effectiveFrom="{ record }">
        {{ record.effectiveFrom?.replace('T', ' ') }}
      </template>
      <template #effectiveTo="{ record }">
        {{ record.effectiveTo?.replace('T', ' ') || '长期有效' }}
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['finance:fin-customer-material-price:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['finance:fin-customer-material-price:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['finance:fin-customer-material-price:delete']"
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
import {
  type FinCustomerMaterialPriceQuery,
  type FinCustomerMaterialPriceResp,
  deleteFinCustomerMaterialPrice,
  listFinCustomerMaterialPrice,
} from '@/apis/finance/fin-customer-material-price'
import { listFinCustomerDict } from '@/apis/finance/fin-customer'
import { listFinMaterialDict } from '@/apis/finance/fin-material'
import type { LabelValueState } from '@/types/global'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'FinCustomerMaterialPrice' })

const queryForm = reactive<FinCustomerMaterialPriceQuery>({
  customerId: undefined,
  materialId: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listFinCustomerMaterialPrice({ ...queryForm, ...page }), { immediate: true })

// 加载客户字典
const customerDict = ref<LabelValueState[]>([])
const loadCustomerDict = async () => {
  const { data } = await listFinCustomerDict()
  customerDict.value = data || []
}

// 加载物料字典
const materialDict = ref<LabelValueState[]>([])
const loadMaterialDict = async () => {
  const { data } = await listFinMaterialDict()
  materialDict.value = data || []
}

onMounted(() => {
  loadCustomerDict()
  loadMaterialDict()
})

const columns: TableInstance['columns'] = [
  { title: '客户', dataIndex: 'customerName', minWidth: 140, ellipsis: true, tooltip: true },
  { title: '物料', dataIndex: 'materialName', minWidth: 140, ellipsis: true, tooltip: true },
  { title: '专属单价', dataIndex: 'unitPrice', slotName: 'unitPrice', width: 120, align: 'right' },
  { title: '生效时间', dataIndex: 'effectiveFrom', slotName: 'effectiveFrom', width: 180 },
  { title: '失效时间', dataIndex: 'effectiveTo', slotName: 'effectiveTo', width: 180 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['finance:fin-customer-material-price:get', 'finance:fin-customer-material-price:update', 'finance:fin-customer-material-price:delete']),
  },
]

// 重置
const reset = () => {
  queryForm.customerId = undefined
  queryForm.materialId = undefined
  search()
}

// 删除
const onDelete = (record: FinCustomerMaterialPriceResp) => {
  return handleDelete(() => deleteFinCustomerMaterialPrice(record.id), {
    content: `是否确定删除该客户物料价格？`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => {
  AddModalRef.value?.onAdd()
}
const onUpdate = (record: FinCustomerMaterialPriceResp) => {
  AddModalRef.value?.onUpdate(record.id)
}

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
const onDetail = (record: FinCustomerMaterialPriceResp) => {
  DetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
