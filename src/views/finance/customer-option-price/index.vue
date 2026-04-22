<template>
  <GiPageLayout>
    <GiTable title="客户选项价格" row-key="id" :data="dataList" :columns="columns" :loading="loading"
             :scroll="{ x: '100%', y: '100%', minWidth: 1000 }" :pagination="pagination" :disabled-tools="['size']" @refresh="search">
      <template #toolbar-left>
        <a-select v-model="queryForm.customerId" placeholder="选择客户" allow-clear allow-search style="width: 200px" @change="search">
          <a-option v-for="item in customerDict" :key="item.value" :value="item.value" :label="item.label" />
        </a-select>
        <a-button @click="reset"><template #icon><icon-refresh /></template><template #default>重置</template></a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['finance:fin-customer-option-price:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template><template #default>新增</template>
        </a-button>
      </template>
      <template #priceMode="{ record }">
        <a-tag size="small" :color="priceModeColor[record.priceMode]">{{ priceModeLabel[record.priceMode] }}</a-tag>
      </template>
      <template #price="{ record }">
        <span style="font-weight: 600">{{ record.price }}</span>
        <span v-if="record.priceMode === 'PER_PAGE'"> 元/页</span>
        <span v-else-if="record.priceMode === 'FIXED'"> 元/份</span>
        <span v-else-if="record.priceMode === 'MULTIPLIER'"> x</span>
      </template>
      <template #effectiveFrom="{ record }">{{ record.effectiveFrom?.replace('T', ' ') }}</template>
      <template #effectiveTo="{ record }">{{ record.effectiveTo?.replace('T', ' ') || '长期有效' }}</template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['finance:fin-customer-option-price:update']" @click="onUpdate(record)">修改</a-link>
          <a-link v-permission="['finance:fin-customer-option-price:delete']" status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>
    <AddModal ref="AddModalRef" @save-success="search" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import { type FinCustomerOptionPriceQuery, type FinCustomerOptionPriceResp, deleteFinCustomerOptionPrice, listFinCustomerOptionPrice } from '@/apis/finance/fin-customer-option-price'
import { listFinCustomerDict } from '@/apis/finance/fin-customer'
import type { LabelValueState } from '@/types/global'
import { useTable } from '@/hooks'
import has from '@/utils/has'

defineOptions({ name: 'FinCustomerOptionPrice' })

const priceModeLabel: Record<string, string> = { PER_PAGE: '按页', FIXED: '固定', MULTIPLIER: '乘数' }
const priceModeColor: Record<string, string> = { PER_PAGE: 'blue', FIXED: 'green', MULTIPLIER: 'orange' }

const queryForm = reactive<FinCustomerOptionPriceQuery>({ customerId: undefined, optionId: undefined, sort: ['id,desc'] })
const { tableData: dataList, loading, pagination, search, handleDelete } = useTable((page) => listFinCustomerOptionPrice({ ...queryForm, ...page }), { immediate: true })

const customerDict = ref<LabelValueState[]>([])
onMounted(async () => {
  const { data } = await listFinCustomerDict()
  customerDict.value = data || []
})

const columns: TableInstance['columns'] = [
  { title: '客户', dataIndex: 'customerName', minWidth: 140, ellipsis: true, tooltip: true },
  { title: '选项', dataIndex: 'optionName', minWidth: 120 },
  { title: '计价方式', dataIndex: 'priceMode', slotName: 'priceMode', width: 100, align: 'center' },
  { title: '专属价格', dataIndex: 'price', slotName: 'price', width: 120, align: 'right' },
  { title: '生效时间', dataIndex: 'effectiveFrom', slotName: 'effectiveFrom', width: 180 },
  { title: '失效时间', dataIndex: 'effectiveTo', slotName: 'effectiveTo', width: 180 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', dataIndex: 'action', slotName: 'action', width: 140, align: 'center', show: has.hasPermOr(['finance:fin-customer-option-price:update', 'finance:fin-customer-option-price:delete']) },
]

const reset = () => {
  queryForm.customerId = undefined
  queryForm.optionId = undefined
  search()
}
const onDelete = (record: FinCustomerOptionPriceResp) => handleDelete(() => deleteFinCustomerOptionPrice(record.id), { content: '是否确定删除该客户选项价格？', showModal: true })

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => AddModalRef.value?.onAdd()
const onUpdate = (record: FinCustomerOptionPriceResp) => AddModalRef.value?.onUpdate(record.id)
</script>

<style scoped lang="scss"></style>
