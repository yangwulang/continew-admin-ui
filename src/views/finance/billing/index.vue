<template>
  <GiPageLayout>
    <GiTable
      title="记账管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1200 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['billingDate']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-select
          v-model="queryForm.status"
          placeholder="记账状态"
          allow-clear
          style="width: 150px"
          @change="search"
        >
          <a-option value="DRAFT">草稿</a-option>
          <a-option value="PENDING_SIGN">待签名</a-option>
          <a-option value="PENDING_REVIEW">待审核</a-option>
          <a-option value="CONFIRMED">已确认</a-option>
          <a-option value="REJECTED">已驳回</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['finance:fin-billing-record:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增记账</template>
        </a-button>
      </template>
      <template #status="{ record }">
        <a-tag :color="statusColorMap[record.status] || 'gray'" size="small">{{ statusLabelMap[record.status] || record.status }}</a-tag>
      </template>
      <template #totalAmount="{ record }">
        <span style="font-weight: 600; color: #165dff">{{ record.totalAmount?.toFixed(2) }}</span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['finance:fin-billing-record:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link
            v-if="record.status === 'DRAFT' || record.status === 'REJECTED'"
            v-permission="['finance:fin-billing-record:create']"
            title="生成签名链接"
            @click="onSignLink(record)"
          >
            签名链接
          </a-link>
          <a-link
            v-if="record.status === 'PENDING_REVIEW'"
            v-permission="['finance:fin-billing-record:create']"
            status="success"
            title="审核"
            @click="onApprove(record)"
          >
            审核
          </a-link>
          <a-link
            v-if="record.status === 'DRAFT'"
            v-permission="['finance:fin-billing-record:delete']"
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

    <!-- 签名链接弹窗 -->
    <a-modal v-model:visible="signLinkVisible" title="签名链接" :width="500" ok-text="关闭" :cancel-button-props="{ style: { display: 'none' } }">
      <a-space direction="vertical" fill style="width: 100%">
        <a-alert type="info">请复制以下链接发送给客户进行签名</a-alert>
        <a-textarea :model-value="signLinkUrl" :auto-size="{ minRows: 2 }" readonly />
        <a-button type="primary" long @click="copySignLink">
          <template #icon><icon-copy /></template>
          复制链接
        </a-button>
      </a-space>
    </a-modal>

    <!-- 审核弹窗 -->
    <a-modal
      v-model:visible="approveVisible"
      title="审核记账记录"
      :mask-closable="false"
      :width="500"
      :footer="false"
    >
      <a-form :model="approveForm" layout="vertical">
        <a-form-item label="审核备注">
          <a-textarea v-model="approveForm.reviewRemark" placeholder="请输入审核备注（可选）" :auto-size="{ minRows: 2, maxRows: 4 }" />
        </a-form-item>
        <a-space style="width: 100%; justify-content: flex-end">
          <a-button status="danger" @click="handleApprove(false)">
            <template #icon><icon-close /></template>
            驳回
          </a-button>
          <a-button type="primary" status="success" @click="handleApprove(true)">
            <template #icon><icon-check /></template>
            通过
          </a-button>
        </a-space>
      </a-form>
    </a-modal>
  </GiPageLayout>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import type { TableInstance } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import DetailDrawer from './DetailDrawer.vue'
import {
  type FinBillingRecordResp,
  type FinBillingRecordQuery,
  listFinBillingRecord,
  generateFinBillingSignLink,
  approveFinBillingRecord,
} from '@/apis/finance/fin-billing-record'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import http from '@/utils/http'

defineOptions({ name: 'FinanceBilling' })

const statusLabelMap: Record<string, string> = {
  DRAFT: '草稿',
  PENDING_SIGN: '待签名',
  PENDING_REVIEW: '待审核',
  CONFIRMED: '已确认',
  REJECTED: '已驳回',
  CANCELLED: '已取消',
}
const statusColorMap: Record<string, string> = {
  DRAFT: 'gray',
  PENDING_SIGN: 'orangered',
  PENDING_REVIEW: 'blue',
  CONFIRMED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
}

const queryForm = reactive<FinBillingRecordQuery>({
  status: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listFinBillingRecord({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '记账日期', dataIndex: 'billingDate', width: 120 },
  { title: '客户ID', dataIndex: 'customerId', width: 100 },
  { title: '总金额', dataIndex: 'totalAmount', slotName: 'totalAmount', width: 120, align: 'right' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 100, align: 'center' },
  { title: '签名时间', dataIndex: 'signedAt', width: 180, show: false },
  { title: '审核时间', dataIndex: 'reviewedAt', width: 180, show: false },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 220,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['finance:fin-billing-record:get', 'finance:fin-billing-record:create', 'finance:fin-billing-record:delete']),
  },
]

// 重置
const reset = () => {
  queryForm.status = undefined
  search()
}

// 删除
const onDelete = (record: FinBillingRecordResp) => {
  return handleDelete(() => http.del('/finance/fin-billing-record', { ids: [record.id] }), {
    content: `是否确定删除该记账记录？`,
    showModal: true,
  })
}

// ========= 签名链接 =========
const signLinkVisible = ref(false)
const signLinkUrl = ref('')

const onSignLink = async (record: FinBillingRecordResp) => {
  try {
    const { data } = await generateFinBillingSignLink(record.id)
    signLinkUrl.value = `${window.location.origin}${data}`
    signLinkVisible.value = true
    search()
  } catch (e: any) {
    Message.error(e?.msg || '生成签名链接失败')
  }
}

const copySignLink = () => {
  navigator.clipboard.writeText(signLinkUrl.value).then(() => {
    Message.success('链接已复制到剪贴板')
  }).catch(() => {
    Message.warning('复制失败，请手动选择复制')
  })
}

// ========= 审核 =========
const approveVisible = ref(false)
const approveRecordId = ref('')
const approveForm = reactive({
  reviewRemark: '',
})

const onApprove = (record: FinBillingRecordResp) => {
  approveRecordId.value = record.id
  approveForm.reviewRemark = ''
  approveVisible.value = true
}

const handleApprove = async (approved: boolean) => {
  try {
    await approveFinBillingRecord(approveRecordId.value, {
      approved,
      reviewRemark: approveForm.reviewRemark,
    })
    Message.success(approved ? '审核通过' : '已驳回')
    approveVisible.value = false
    search()
  } catch (e: any) {
    Message.error(e?.msg || '审核操作失败')
  }
}

// ========= 新增 / 详情 =========
const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => {
  AddModalRef.value?.onAdd()
}

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
const onDetail = (record: FinBillingRecordResp) => {
  DetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
