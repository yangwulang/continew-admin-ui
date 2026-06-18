<template>
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

      <!-- 适用条件 -->
      <a-divider orientation="left">适用条件</a-divider>
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="最低份数" field="ruleMinCopies">
            <a-input-number v-model="ruleMinCopies" :min="1" placeholder="不限" style="width: 100%" allow-clear />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="最低页数" field="ruleMinPages">
            <a-input-number v-model="ruleMinPages" :min="1" placeholder="不限" style="width: 100%" allow-clear />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="最大折扣率" field="maxDiscountRate">
            <a-input-number v-model="form.maxDiscountRate" :min="0.01" :max="1" :precision="2" placeholder="不限（如0.5=最多5折）" style="width: 100%" allow-clear />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item label="适用打印选项" field="ruleApplicableOptionIds">
        <a-select v-model="ruleApplicableOptionIds" placeholder="留空=所有选项均可用" multiple allow-clear allow-search>
          <a-optgroup v-for="attr in printAttributes" :key="attr.id" :label="attr.name">
            <a-option v-for="opt in attr.options" :key="opt.id" :value="opt.id" :label="opt.name" />
          </a-optgroup>
        </a-select>
      </a-form-item>

      <!-- 互斥/依赖 -->
      <a-divider orientation="left">互斥/依赖关系</a-divider>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="互斥模板" field="ruleExcludeTemplateIds">
            <a-select v-model="ruleExcludeTemplateIds" placeholder="不可同时使用的模板" multiple allow-clear allow-search>
              <a-option v-for="t in otherTemplates" :key="t.id" :value="Number(t.id)" :label="t.templateName" />
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="依赖模板" field="ruleRequireTemplateIds">
            <a-select v-model="ruleRequireTemplateIds" placeholder="必须同时使用的模板" multiple allow-clear allow-search>
              <a-option v-for="t in otherTemplates" :key="t.id" :value="Number(t.id)" :label="t.templateName" />
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import {
  type CouponTemplateReq,
  type CouponTemplateResp,
  type PromotionResp,
  addCouponTemplate,
  listCouponTemplates,
  listPromotions,
  updateCouponTemplate,
} from '@/apis/finance/coupon'
import { type PrintAttributeWithOptions, listPrintAttributes } from '@/apis/finance/print-order'
import { type ColumnItem, GiForm } from '@/components/GiForm'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

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
  applicableRule: undefined,
  couponRelation: undefined,
  maxDiscountRate: undefined,
})

// 规则字段的拆解表单
const ruleMinCopies = ref<number | undefined>(undefined)
const ruleMinPages = ref<number | undefined>(undefined)
const ruleApplicableOptionIds = ref<number[]>([])
const ruleExcludeTemplateIds = ref<number[]>([])
const ruleRequireTemplateIds = ref<number[]>([])

const printAttributes = ref<PrintAttributeWithOptions[]>([])
const otherTemplates = ref<CouponTemplateResp[]>([])

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
  form.applicableRule = undefined
  form.couponRelation = undefined
  form.maxDiscountRate = undefined
  ruleMinCopies.value = undefined
  ruleMinPages.value = undefined
  ruleApplicableOptionIds.value = []
  ruleExcludeTemplateIds.value = []
  ruleRequireTemplateIds.value = []
}

const promotionList = ref<PromotionResp[]>([])

const loadPromotions = async () => {
  const { data } = await listPromotions()
  promotionList.value = data || []
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
  form.maxDiscountRate = record.maxDiscountRate
  // 解析 JSON 规则字段
  if (record.applicableRule) {
    try {
      const rule = JSON.parse(record.applicableRule)
      ruleMinCopies.value = rule.minCopies
      ruleMinPages.value = rule.minPages
      ruleApplicableOptionIds.value = rule.applicableOptionIds || []
    } catch { /* ignore */ }
  }
  if (record.couponRelation) {
    try {
      const relation = JSON.parse(record.couponRelation)
      ruleExcludeTemplateIds.value = relation.excludeTemplateIds || []
      ruleRequireTemplateIds.value = relation.requireTemplateIds || []
    } catch { /* ignore */ }
  }
  modalVisible.value = true
}

const handleSubmit = async () => {
  const err = await formRef.value?.validate()
  if (err) return false
  submitting.value = true
  try {
    // 组装 applicableRule JSON
    const ruleObj: Record<string, any> = {}
    if (ruleMinCopies.value) ruleObj.minCopies = ruleMinCopies.value
    if (ruleMinPages.value) ruleObj.minPages = ruleMinPages.value
    if (ruleApplicableOptionIds.value.length > 0) ruleObj.applicableOptionIds = ruleApplicableOptionIds.value
    form.applicableRule = Object.keys(ruleObj).length > 0 ? JSON.stringify(ruleObj) : undefined

    // 组装 couponRelation JSON
    const relObj: Record<string, any> = {}
    if (ruleExcludeTemplateIds.value.length > 0) relObj.excludeTemplateIds = ruleExcludeTemplateIds.value
    if (ruleRequireTemplateIds.value.length > 0) relObj.requireTemplateIds = ruleRequireTemplateIds.value
    form.couponRelation = Object.keys(relObj).length > 0 ? JSON.stringify(relObj) : undefined

    if (editId.value) {
      await updateCouponTemplate(editId.value, form)
      Message.success('修改成功')
    } else {
      await addCouponTemplate(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (e: any) {
    Message.error(e?.msg || '操作失败')
    return false
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loadPromotions()
  // 加载打印属性选项（供适用条件配置使用）
  try {
    const { data } = await listPrintAttributes()
    printAttributes.value = data || []
  } catch { /* ignore */ }
})

// 加载其他券模板（供互斥/依赖选择使用）
const loadOtherTemplates = async () => {
  try {
    const { data } = await listCouponTemplates({ sort: ['id,desc'], page: 1, size: 200 })
    otherTemplates.value = (data?.list || []).filter((t) => t.id !== editId.value)
  } catch { /* ignore */ }
}

watch(modalVisible, (v) => {
  if (v) loadOtherTemplates()
})

defineExpose({ onAdd, onUpdate })
</script>
