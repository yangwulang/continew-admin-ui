<template>
  <GiPageLayout>
    <GiTable
      title="充值管理"
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
          v-model="queryForm.type"
          placeholder="交易类型"
          allow-clear
          style="width: 150px"
          @change="search"
        >
          <a-option value="RECHARGE">充值</a-option>
          <a-option value="DEBIT_BILLING">记账扣费</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['finance:fin-account-transaction:create']" type="primary" @click="onRecharge">
          <template #icon><icon-plus /></template>
          <template #default>客户充值</template>
        </a-button>
      </template>
      <template #type="{ record }">
        <a-tag v-if="record.type === 'RECHARGE'" color="green" size="small">充值</a-tag>
        <a-tag v-else-if="record.type === 'DEBIT_BILLING'" color="orange" size="small">记账扣费</a-tag>
        <a-tag v-else color="gray" size="small">{{ record.type }}</a-tag>
      </template>
      <template #direction="{ record }">
        <a-tag v-if="record.direction === 'IN'" color="green" size="small">收入</a-tag>
        <a-tag v-else color="red" size="small">支出</a-tag>
      </template>
      <template #amount="{ record }">
        <span :style="{ fontWeight: 600, color: record.direction === 'IN' ? '#00b42a' : '#f53f3f' }">
          {{ record.direction === 'IN' ? '+' : '-' }}{{ record.amount?.toFixed(2) }}
        </span>
      </template>
      <template #balanceAfter="{ record }">
        <span style="font-weight: 600">{{ record.balanceAfter?.toFixed(2) }}</span>
      </template>
      <template #status="{ record }">
        <a-tag v-if="record.status === 'CONFIRMED'" color="green" size="small">已确认</a-tag>
        <a-tag v-else-if="record.status === 'PENDING'" color="blue" size="small">待确认</a-tag>
        <a-tag v-else color="gray" size="small">{{ record.status }}</a-tag>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['finance:fin-account-transaction:list']" title="详情" @click="onDetail(record)">详情</a-link>
        </a-space>
      </template>
    </GiTable>

    <RechargeModal ref="RechargeModalRef" @save-success="search" />
    <DetailDrawer ref="DetailDrawerRef" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import RechargeModal from './RechargeModal.vue'
import DetailDrawer from './DetailDrawer.vue'
import {
  type FinAccountTransactionResp,
  type FinAccountTransactionQuery,
  listFinAccountTransaction,
} from '@/apis/finance/fin-account-transaction'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'FinanceRecharge' })

const queryForm = reactive<FinAccountTransactionQuery>({
  type: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
} = useTable((page) => listFinAccountTransaction({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '客户ID', dataIndex: 'customerId', width: 100 },
  { title: '交易类型', dataIndex: 'type', slotName: 'type', width: 110, align: 'center' },
  { title: '收支方向', dataIndex: 'direction', slotName: 'direction', width: 90, align: 'center' },
  { title: '交易金额', dataIndex: 'amount', slotName: 'amount', width: 130, align: 'right' },
  { title: '变动后余额', dataIndex: 'balanceAfter', slotName: 'balanceAfter', width: 130, align: 'right' },
  { title: '渠道', dataIndex: 'channel', width: 100 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 90, align: 'center' },
  { title: '发生时间', dataIndex: 'occurTime', width: 180 },
  { title: '备注', dataIndex: 'remark', minWidth: 160, ellipsis: true, tooltip: true },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 80,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['finance:fin-account-transaction:list']),
  },
]

// 重置
const reset = () => {
  queryForm.type = undefined
  search()
}

const RechargeModalRef = ref<InstanceType<typeof RechargeModal>>()
const onRecharge = () => {
  RechargeModalRef.value?.onOpen()
}

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
const onDetail = (record: FinAccountTransactionResp) => {
  DetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
