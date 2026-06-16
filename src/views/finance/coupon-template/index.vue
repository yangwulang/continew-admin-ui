<template>
  <GiPageLayout>
    <GiTable
      title="优惠券模板"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1100 }"
      :pagination="false"
      :disabled-tools="['size']"
      @refresh="loadData"
    >
      <template #toolbar-left>
        <a-select
          v-model="filterPromotionId"
          placeholder="按活动筛选"
          allow-clear
          style="width: 200px"
          @change="loadData"
        >
          <a-option v-for="p in promotionList" :key="p.id" :value="p.id" :label="p.promoName" />
        </a-select>
        <a-button @click="resetFilter">
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
        <a-tag v-if="record.couponType === 'DISCOUNT'" color="blue">折扣券 {{ (record.discountRate * 100).toFixed(0) }}折</a-tag>
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

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="editId ? '编辑券模板' : '新增券模板'"
      :mask-closable="false"
      :width="600"
      :ok-loading="submitting"
      @before-ok="handleSubmit"
      @close="resetModal"
    >
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="16">
            <a-form-item label="模板名称" field="templateName" :rules="[{ required: true, message: '请输入模板名称' }]">
              <a-input v-model="form.templateName" placeholder="如：五一折扣券" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="所属活动" field="promotionId">
              <a-select v-model="form.promotionId" placeholder="选填" allow-clear style="width: 100%">
                <a-option v-for="p in promotionList" :key="p.id" :value="p.id" :label="p.promoName" />
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="券类型" field="couponType" :rules="[{ required: true, message: '请选择券类型' }]">
              <a-radio-group v-model="form.couponType" type="button">
                <a-radio value="DISCOUNT">折扣券</a-radio>
                <a-radio value="REDUCE">满减券</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col v-if="form.couponType === 'DISCOUNT'" :span="12">
            <a-form-item label="折扣率（0~1，如0.8=八折）" field="discountRate" :rules="[{ required: true, message: '请输入折扣率' }]">
              <a-input-number v-model="form.discountRate" :min="0.01" :max="0.99" :precision="2" placeholder="0.80" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col v-if="form.couponType === 'REDUCE'" :span="12">
            <a-form-item label="减免金额（元）" field="reduceAmount" :rules="[{ required: true, message: '请输入减免金额' }]">
              <a-input-number v-model="form.reduceAmount" :min="0.01" :precision="2" placeholder="5.00" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="最低消费金额（元，0=无门槛）" field="minOrderAmount">
              <a-input-number v-model="form.minOrderAmount" :min="0" :precision="2" placeholder="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="发行总量（空=不限）" field="totalCount">
              <a-input-number v-model="form.totalCount" :min="1" placeholder="不限" style="width: 100%" allow-clear />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="每人限领数量（空=不限）" field="perUserLimit">
              <a-input-number v-model="form.perUserLimit" :min="1" placeholder="不限" style="width: 100%" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="有效天数（派发后N天有效）" field="validDays">
              <a-input-number v-model="form.validDays" :min="1" placeholder="如：30" style="width: 100%" allow-clear />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注" field="remark">
          <a-textarea v-model="form.remark" placeholder="备注信息（选填）" :auto-size="{ minRows: 2, maxRows: 4 }" />
        </a-form-item>
      </a-form>
    </a-modal>

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
import { Message, Modal } from '@arco-design/web-vue'
import type { TableInstance } from '@arco-design/web-vue'
import { useRoute } from 'vue-router'
import {
  type CouponTemplateReq,
  type CouponTemplateResp,
  type PromotionResp,
  addCouponTemplate,
  deleteCouponTemplate,
  issueCoupon,
  listCouponTemplates,
  listPromotions,
  updateCouponTemplate,
} from '@/apis/finance/coupon'
import { listFinCustomerDict } from '@/apis/finance/fin-customer'
import type { LabelValueState } from '@/types/global'
import { isMobile } from '@/utils'

defineOptions({ name: 'FinCouponTemplate' })

const route = useRoute()

const dataList = ref<CouponTemplateResp[]>([])
const loading = ref(false)
const filterPromotionId = ref<string | undefined>(undefined)
const promotionList = ref<PromotionResp[]>([])
const customerDict = ref<LabelValueState[]>([])

const loadPromotions = async () => {
  const { data } = await listPromotions()
  promotionList.value = data || []
}

const loadCustomerDict = async () => {
  const { data } = await listFinCustomerDict()
  customerDict.value = data || []
}

const loadData = async () => {
  loading.value = true
  try {
    const { data } = await listCouponTemplates(filterPromotionId.value)
    dataList.value = data || []
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterPromotionId.value = undefined
  loadData()
}

onMounted(() => {
  // 如果路由携带 promotionId 查询参数，自动筛选
  if (route.query.promotionId) {
    filterPromotionId.value = route.query.promotionId as string
  }
  loadPromotions()
  loadCustomerDict()
  loadData()
})

const columns: TableInstance['columns'] = [
  { title: '模板名称', dataIndex: 'templateName', minWidth: 160, ellipsis: true, tooltip: true },
  { title: '券类型', dataIndex: 'couponType', slotName: 'couponType', width: 140 },
  { title: '使用门槛', dataIndex: 'minOrderAmount', slotName: 'minOrderAmount', width: 120 },
  { title: '发行量', dataIndex: 'count', slotName: 'count', width: 80, align: 'center' },
  { title: '每人限领', dataIndex: 'perUserLimit', width: 80, align: 'center', render: ({ record }) => record.perUserLimit != null ? `${record.perUserLimit}张` : '不限' },
  { title: '有效天数', dataIndex: 'validDays', width: 80, align: 'center', render: ({ record }) => record.validDays != null ? `${record.validDays}天` : '固定日期' },
  { title: '备注', dataIndex: 'remark', minWidth: 100, ellipsis: true, tooltip: true },
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

// ===== 新增/编辑 =====
const modalVisible = ref(false)
const submitting = ref(false)
const editId = ref<string | undefined>(undefined)
const formRef = ref()

const form = reactive<CouponTemplateReq>({
  promotionId: undefined,
  templateName: '',
  couponType: 'DISCOUNT',
  discountRate: undefined,
  reduceAmount: undefined,
  minOrderAmount: 0,
  totalCount: undefined,
  perUserLimit: undefined,
  validDays: undefined,
  expireTime: undefined,
  isActive: 1,
  remark: '',
})

const resetModal = () => {
  formRef.value?.resetFields()
  editId.value = undefined
  form.promotionId = undefined
  form.templateName = ''
  form.couponType = 'DISCOUNT'
  form.discountRate = undefined
  form.reduceAmount = undefined
  form.minOrderAmount = 0
  form.totalCount = undefined
  form.perUserLimit = undefined
  form.validDays = undefined
  form.expireTime = undefined
  form.isActive = 1
  form.remark = ''
}

const onAdd = () => {
  resetModal()
  modalVisible.value = true
}

const onUpdate = (record: CouponTemplateResp) => {
  resetModal()
  editId.value = record.id
  form.promotionId = record.promotionId
  form.templateName = record.templateName
  form.couponType = record.couponType
  form.discountRate = record.discountRate
  form.reduceAmount = record.reduceAmount
  form.minOrderAmount = record.minOrderAmount ?? 0
  form.totalCount = record.totalCount
  form.perUserLimit = record.perUserLimit
  form.validDays = record.validDays
  form.expireTime = record.expireTime
  form.isActive = record.isActive
  form.remark = record.remark || ''
  modalVisible.value = true
}

const handleSubmit = async () => {
  const err = await formRef.value?.validate()
  if (err) return false
  submitting.value = true
  try {
    if (editId.value) {
      await updateCouponTemplate(editId.value, form)
      Message.success('修改成功')
    } else {
      await addCouponTemplate(form)
      Message.success('新增成功')
    }
    loadData()
    return true
  } catch (e: any) {
    Message.error(e?.msg || '操作失败')
    return false
  } finally {
    submitting.value = false
  }
}

const onDelete = (record: CouponTemplateResp) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除模板「${record.templateName}」吗？`,
    onOk: async () => {
      await deleteCouponTemplate(record.id)
      Message.success('删除成功')
      loadData()
    },
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
</script>

<style scoped lang="scss"></style>
