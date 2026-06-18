<template>
  <GiPageLayout>
    <GiTable
      title="优惠券模板"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1400 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-select
          v-model="filterPromotionId"
          placeholder="按活动筛选"
          allow-clear
          style="width: 200px"
          @change="search"
        >
          <a-option v-for="p in promotionList" :key="p.id" :value="p.id" :label="p.promoName" />
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          重置
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          新增券模板
        </a-button>
      </template>

      <template #couponType="{ record }">
        <a-tag v-if="record.couponType === 'DISCOUNT'" color="blue">折扣券 {{ ((record.discountRate || 0) * 100).toFixed(0) }}折</a-tag>
        <a-tag v-else color="green">满减券 -¥{{ record.reduceAmount?.toFixed(2) }}</a-tag>
      </template>
      <template #minOrderAmount="{ record }">
        <span>{{ record.minOrderAmount ? `满¥${record.minOrderAmount}可用` : '无门槛' }}</span>
      </template>
      <template #count="{ record }">
        <span>{{ record.totalCount != null ? `${record.totalCount}张` : '不限' }}</span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link @click="onUpdate(record)">修改</a-link>
          <a-link @click="onIssue(record)">派发</a-link>
          <a-link status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="search" />
    <!-- 派发弹窗 -->
    <a-modal
      v-model:visible="issueVisible"
      title="派发优惠券"
      :mask-closable="false"
      :width="480"
      :ok-loading="issueSubmitting"
      @before-ok="handleIssue"
      @close="resetIssue"
    >
      <a-form ref="issueFormRef" :model="issueForm" layout="vertical">
        <a-descriptions title="券模板信息" :column="2" bordered size="small" style="margin-bottom: 16px">
          <a-descriptions-item label="模板">{{ issueTemplate?.templateName }}</a-descriptions-item>
          <a-descriptions-item label="类型">
            <span v-if="issueTemplate?.couponType === 'DISCOUNT'">折扣券 {{ ((issueTemplate?.discountRate ?? 0) * 100).toFixed(0) }}折</span>
            <span v-else>满减 -¥{{ issueTemplate?.reduceAmount?.toFixed(2) }}</span>
          </a-descriptions-item>
        </a-descriptions>
        <a-form-item label="指定客户（空=通用券）" field="customerId">
          <a-select
            v-model="issueForm.customerId"
            placeholder="选填，空则不绑定客户"
            allow-clear
            allow-search
            style="width: 100%"
          >
            <a-option v-for="item in customerDict" :key="item.value" :value="item.value" :label="item.label" />
          </a-select>
        </a-form-item>
        <a-form-item label="有效天数（覆盖模板默认值）" field="days">
          <a-input-number v-model="issueForm.days" :min="1" placeholder="留空则使用模板默认值" style="width: 100%" allow-clear />
        </a-form-item>
      </a-form>
      <a-alert type="info" style="margin-top: 8px">
        <template #message>派发后会生成一个唯一券码，可将券码告知客户</template>
      </a-alert>
    </a-modal>

    <!-- 券码展示弹窗 -->
    <a-modal
      v-model:visible="codeVisible"
      title="派发成功"
      :footer="false"
      :width="360"
    >
      <div style="text-align: center; padding: 16px 0">
        <p style="color: var(--color-text-2); margin-bottom: 12px">券码已生成，请将以下券码告知客户：</p>
        <div style="font-size: 24px; font-weight: 700; letter-spacing: 4px; color: #165dff; margin-bottom: 16px">
          {{ issuedCode }}
        </div>
        <a-button type="primary" @click="copyCode">复制券码</a-button>
      </div>
    </a-modal>
  </GiPageLayout>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import type { TableInstance } from '@arco-design/web-vue'
import { useRoute } from 'vue-router'
import AddModal from './AddModal.vue'
import {
  type CouponTemplateQuery,
  type CouponTemplateResp,
  type PromotionResp,
  deleteCouponTemplate,
  issueCoupon,
  listCouponTemplates,
  listPromotions,
} from '@/apis/finance/coupon'
import { listFinCustomerDict } from '@/apis/finance/fin-customer'
import type { LabelValueState } from '@/types/global'
import { isMobile } from '@/utils'
import { useTable } from '@/hooks'

defineOptions({ name: 'FinCouponTemplate' })

const route = useRoute()
const filterPromotionId = ref<string | undefined>(undefined)

const customerDict = ref<LabelValueState[]>([])

const loadCustomerDict = async () => {
  const { data } = await listFinCustomerDict()
  customerDict.value = data || []
}

const queryForm = reactive<CouponTemplateQuery>({
  promotionId: undefined,
  templateName: undefined,
  couponType: undefined,
  validDays: undefined,
  expireTime: undefined,
  isActive: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listCouponTemplates({ ...queryForm, ...page }))

const reset = () => {
  filterPromotionId.value = undefined
  search()
}

const promotionList = ref<PromotionResp[]>([])
const loadPromotions = async () => {
  const { data } = await listPromotions()
  promotionList.value = data || []
}

onMounted(() => {
  // 如果路由携带 promotionId 查询参数，自动筛选
  if (route.query.promotionId) {
    filterPromotionId.value = route.query.promotionId as string
  }
  loadCustomerDict()
  loadPromotions()
  // loadData()
})

const columns: TableInstance['columns'] = [
  { title: '模板名称', dataIndex: 'templateName', minWidth: 160, ellipsis: true, tooltip: true },
  { title: '券类型', dataIndex: 'couponType', slotName: 'couponType', width: 140 },
  { title: '使用门槛', dataIndex: 'minOrderAmount', slotName: 'minOrderAmount', width: 120 },
  {
    title: '适用条件',
    dataIndex: 'applicableRule',
    width: 160,
    render: ({ record }) => {
      if (!record.applicableRule) return '无限制'
      try {
        const rule = JSON.parse(record.applicableRule)
        const parts: string[] = []
        if (rule.minCopies) parts.push(`≥${rule.minCopies}份`)
        if (rule.minPages) parts.push(`≥${rule.minPages}页`)
        if (rule.applicableOptionIds?.length) parts.push(`${rule.applicableOptionIds.length}个选项`)
        return parts.length > 0 ? parts.join('，') : '无限制'
      } catch {
        return '无限制'
      }
    },
  },
  { title: '发行量', dataIndex: 'count', slotName: 'count', width: 80, align: 'center' },
  { title: '每人限领', dataIndex: 'perUserLimit', width: 80, align: 'center', render: ({ record }) => record.perUserLimit != null ? `${record.perUserLimit}张` : '不限' },
  { title: '有效天数', dataIndex: 'validDays', width: 80, align: 'center', render: ({ record }) => record.validDays != null ? `${record.validDays}天` : '固定日期' },
  { title: '备注', dataIndex: 'remark', minWidth: 100, ellipsis: true, tooltip: true },
  {
    title: '互斥/依赖',
    dataIndex: 'couponRelation',
    width: 120,
    render: ({ record }) => {
      if (!record.couponRelation) return '—'
      try {
        const rel = JSON.parse(record.couponRelation)
        const parts: string[] = []
        if (rel.excludeTemplateIds?.length) parts.push(`互斥${rel.excludeTemplateIds.length}个`)
        if (rel.requireTemplateIds?.length) parts.push(`依赖${rel.requireTemplateIds.length}个`)
        return parts.length > 0 ? parts.join('，') : '—'
      } catch {
        return '—'
      }
    },
  },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
  },
]

const onDelete = (record: CouponTemplateResp) => {
  return handleDelete(() => deleteCouponTemplate(record.id), {
    content: `确定要删除模板「${record.templateName}」吗？`,
    showModal: true,
  })
}

// ===== 派发 =====
const issueVisible = ref(false)
const issueSubmitting = ref(false)
const issueFormRef = ref()
const issueTemplate = ref<CouponTemplateResp | undefined>(undefined)
const issueForm = reactive({ templateId: '', customerId: undefined as string | undefined, days: undefined as number | undefined })

const resetIssue = () => {
  issueFormRef.value?.resetFields()
  issueForm.templateId = ''
  issueForm.customerId = undefined
  issueForm.days = undefined
}

const onIssue = (record: CouponTemplateResp) => {
  resetIssue()
  issueTemplate.value = record
  issueForm.templateId = record.id
  issueVisible.value = true
}

const issuedCode = ref('')
const codeVisible = ref(false)

const handleIssue = async () => {
  issueSubmitting.value = true
  try {
    const { data } = await issueCoupon({
      templateId: issueForm.templateId,
      customerId: issueForm.customerId,
      days: issueForm.days,
    })
    issuedCode.value = data as string
    issueVisible.value = false
    codeVisible.value = true
    return true
  } catch (e: any) {
    Message.error(e?.msg || '派发失败')
    return false
  } finally {
    issueSubmitting.value = false
  }
}

const copyCode = () => {
  navigator.clipboard.writeText(issuedCode.value).then(() => {
    Message.success('券码已复制到剪贴板')
  }).catch(() => {
    Message.warning(`请手动复制券码：${issuedCode.value}`)
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => {
  AddModalRef.value?.onAdd()
}
const onUpdate = (record: CouponTemplateResp) => {
  AddModalRef.value?.onUpdate(record)
}
</script>

<style scoped lang="scss"></style>
