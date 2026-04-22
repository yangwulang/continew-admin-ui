<template>
  <GiPageLayout>
    <GiTable
      title="部门选项价格"
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
        <a-tree-select
          v-model="queryForm.deptId"
          placeholder="选择部门"
          allow-clear
          allow-search
          :data="deptTree"
          :field-names="{ key: 'key', title: 'title', children: 'children' }"
          style="width: 220px"
          @change="search"
        />
        <a-button @click="reset"><template #icon><icon-refresh /></template><template #default>重置</template></a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['finance:fin-dept-option-price:create']" type="primary" @click="onAdd">
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
          <a-link v-permission="['finance:fin-dept-option-price:update']" @click="onUpdate(record)">修改</a-link>
          <a-link v-permission="['finance:fin-dept-option-price:delete']" status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>
    <AddModal ref="AddModalRef" @save-success="search" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import { type FinDeptOptionPriceQuery, type FinDeptOptionPriceResp, deleteFinDeptOptionPrice, listFinDeptOptionPrice } from '@/apis/finance/fin-dept-option-price'
import { useDept } from '@/hooks/app'
import { useTable } from '@/hooks'
import has from '@/utils/has'

defineOptions({ name: 'FinDeptOptionPrice' })

const priceModeLabel: Record<string, string> = { PER_PAGE: '按页', FIXED: '固定', MULTIPLIER: '乘数' }
const priceModeColor: Record<string, string> = { PER_PAGE: 'blue', FIXED: 'green', MULTIPLIER: 'orange' }

const queryForm = reactive<FinDeptOptionPriceQuery>({ deptId: undefined, optionId: undefined, sort: ['id,desc'] })
const { tableData: dataList, loading, pagination, search, handleDelete } = useTable((page) => listFinDeptOptionPrice({ ...queryForm, ...page }), { immediate: true })

// 加载部门树
const { deptList, getDeptList } = useDept()
const deptTree = computed(() => deptList.value)

onMounted(() => {
  getDeptList()
})

const columns: TableInstance['columns'] = [
  { title: '部门', dataIndex: 'deptName', minWidth: 140, ellipsis: true, tooltip: true },
  { title: '选项', dataIndex: 'optionName', minWidth: 120 },
  { title: '计价方式', dataIndex: 'priceMode', slotName: 'priceMode', width: 100, align: 'center' },
  { title: '专属价格', dataIndex: 'price', slotName: 'price', width: 120, align: 'right' },
  { title: '生效时间', dataIndex: 'effectiveFrom', slotName: 'effectiveFrom', width: 180 },
  { title: '失效时间', dataIndex: 'effectiveTo', slotName: 'effectiveTo', width: 180 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', dataIndex: 'action', slotName: 'action', width: 140, align: 'center', show: has.hasPermOr(['finance:fin-dept-option-price:update', 'finance:fin-dept-option-price:delete']) },
]

const reset = () => {
  queryForm.deptId = undefined
  queryForm.optionId = undefined
  search()
}
const onDelete = (record: FinDeptOptionPriceResp) => handleDelete(() => deleteFinDeptOptionPrice(record.id), { content: '是否确定删除该部门选项价格？', showModal: true })

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => AddModalRef.value?.onAdd()
const onUpdate = (record: FinDeptOptionPriceResp) => AddModalRef.value?.onUpdate(record.id)
</script>

<style scoped lang="scss"></style>
