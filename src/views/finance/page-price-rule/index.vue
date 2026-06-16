<template>
  <GiPageLayout>
    <GiTable
      title="梯度定价规则"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :pagination="false"
      :disabled-tools="['size']"
      @refresh="loadData"
    >
      <template #toolbar-left>
        <a-select
          v-model="filterCustomerId"
          placeholder="按客户筛选"
          allow-clear
          allow-search
          style="width: 180px"
          @change="loadData"
        >
          <a-option v-for="item in customerDict" :key="item.value" :value="item.value" :label="item.label" />
        </a-select>
        <a-button @click="resetFilter">
          <template #icon><icon-refresh /></template>
          重置
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          新增规则
        </a-button>
      </template>

      <template #pageRange="{ record }">
        <span>{{ record.minPages }} ~ {{ record.maxPages != null ? record.maxPages : '∞' }} 页</span>
      </template>
      <template #unitPrice="{ record }">
        <span style="font-weight: 600; color: #165dff">¥{{ Number(record.unitPrice).toFixed(4) }}/页</span>
      </template>
      <template #scope="{ record }">
        <a-tag v-if="record.customerId" color="blue">客户专属</a-tag>
        <a-tag v-else-if="record.deptId" color="purple">部门专属</a-tag>
        <a-tag v-else color="gray">全局</a-tag>
      </template>
      <template #isActive="{ record }">
        <a-switch
          :model-value="record.isActive === 1"
          @change="(val: boolean) => onToggleStatus(record, val)"
        />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link @click="onUpdate(record)">修改</a-link>
          <a-link status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="editId ? '编辑梯度定价规则' : '新增梯度定价规则'"
      :mask-closable="false"
      :width="600"
      :ok-loading="submitting"
      @before-ok="handleSubmit"
      @close="resetModal"
    >
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="规则名称" field="ruleName" :rules="[{ required: true, message: '请输入规则名称' }]">
              <a-input v-model="form.ruleName" placeholder="如：普通用户50页以上优惠" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="页数下限" field="minPages" :rules="[{ required: true, message: '请输入页数下限' }]">
              <a-input-number v-model="form.minPages" :min="1" placeholder="最小页数（含）" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="页数上限（空=无上限）" field="maxPages">
              <a-input-number v-model="form.maxPages" :min="1" placeholder="最大页数（含），空=无上限" style="width: 100%" allow-clear />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="每页单价（元）" field="unitPrice" :rules="[{ required: true, message: '请输入每页单价' }]">
              <a-input-number v-model="form.unitPrice" :min="0" :precision="4" placeholder="如：0.0800" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="优先级（数字越小优先级越高）" field="priority">
              <a-input-number v-model="form.priority" :min="0" :max="9999" placeholder="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="客户专属（可选）" field="customerId">
              <a-select
                v-model="form.customerId"
                placeholder="全局规则不需要填写"
                allow-clear
                allow-search
                style="width: 100%"
              >
                <a-option v-for="item in customerDict" :key="item.value" :value="item.value" :label="item.label" />
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" field="isActive">
              <a-switch v-model="form.isActiveFlag" :checked-value="true" :unchecked-value="false">
                <template #checked>启用</template>
                <template #unchecked>停用</template>
              </a-switch>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注" field="remark">
          <a-textarea v-model="form.remark" placeholder="备注信息（选填）" :auto-size="{ minRows: 2, maxRows: 4 }" />
        </a-form-item>
      </a-form>
    </a-modal>
  </GiPageLayout>
</template>

<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import type { TableInstance } from '@arco-design/web-vue'
import {
  type PagePriceRuleReq,
  type PagePriceRuleResp,
  addPagePriceRule,
  deletePagePriceRule,
  listPagePriceRules,
  togglePagePriceRuleStatus,
  updatePagePriceRule,
} from '@/apis/finance/coupon'
import { listFinCustomerDict } from '@/apis/finance/fin-customer'
import type { LabelValueState } from '@/types/global'
import { isMobile } from '@/utils'

defineOptions({ name: 'PagePriceRule' })

const dataList = ref<PagePriceRuleResp[]>([])
const loading = ref(false)
const filterCustomerId = ref<string | undefined>(undefined)

const customerDict = ref<LabelValueState[]>([])
const loadCustomerDict = async () => {
  const { data } = await listFinCustomerDict()
  customerDict.value = data || []
}

const loadData = async () => {
  loading.value = true
  try {
    const { data } = await listPagePriceRules(filterCustomerId.value)
    dataList.value = data || []
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterCustomerId.value = undefined
  loadData()
}

onMounted(() => {
  loadCustomerDict()
  loadData()
})

const columns: TableInstance['columns'] = [
  { title: '规则名称', dataIndex: 'ruleName', minWidth: 160, ellipsis: true, tooltip: true },
  { title: '页数区间', dataIndex: 'pageRange', slotName: 'pageRange', width: 140 },
  { title: '每页单价', dataIndex: 'unitPrice', slotName: 'unitPrice', width: 130, align: 'right' },
  { title: '作用范围', dataIndex: 'scope', slotName: 'scope', width: 100, align: 'center' },
  { title: '优先级', dataIndex: 'priority', width: 80, align: 'center' },
  { title: '状态', dataIndex: 'isActive', slotName: 'isActive', width: 80, align: 'center' },
  { title: '备注', dataIndex: 'remark', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 120,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
  },
]

// ===== 新增/编辑弹窗 =====
const modalVisible = ref(false)
const submitting = ref(false)
const editId = ref<string | undefined>(undefined)
const formRef = ref()

const form = reactive<PagePriceRuleReq & { isActiveFlag: boolean }>({
  ruleName: '',
  minPages: 1,
  maxPages: undefined,
  unitPrice: 0,
  matchConfig: undefined,
  customerId: undefined,
  deptId: undefined,
  priority: 0,
  isActive: 1,
  isActiveFlag: true,
  remark: '',
})

const resetModal = () => {
  formRef.value?.resetFields()
  editId.value = undefined
  form.ruleName = ''
  form.minPages = 1
  form.maxPages = undefined
  form.unitPrice = 0
  form.matchConfig = undefined
  form.customerId = undefined
  form.deptId = undefined
  form.priority = 0
  form.isActive = 1
  form.isActiveFlag = true
  form.remark = ''
}

const onAdd = () => {
  resetModal()
  modalVisible.value = true
}

const onUpdate = (record: PagePriceRuleResp) => {
  resetModal()
  editId.value = record.id
  form.ruleName = record.ruleName
  form.minPages = record.minPages
  form.maxPages = record.maxPages
  form.unitPrice = record.unitPrice
  form.matchConfig = record.matchConfig
  form.customerId = record.customerId
  form.deptId = record.deptId
  form.priority = record.priority
  form.isActive = record.isActive
  form.isActiveFlag = record.isActive === 1
  form.remark = record.remark || ''
  modalVisible.value = true
}

const handleSubmit = async () => {
  const err = await formRef.value?.validate()
  if (err) return false
  submitting.value = true
  try {
    const payload: PagePriceRuleReq = {
      ruleName: form.ruleName,
      minPages: form.minPages,
      maxPages: form.maxPages || undefined,
      unitPrice: form.unitPrice,
      matchConfig: form.matchConfig,
      customerId: form.customerId,
      deptId: form.deptId,
      priority: form.priority,
      isActive: form.isActiveFlag ? 1 : 0,
      remark: form.remark,
    }
    if (editId.value) {
      await updatePagePriceRule(editId.value, payload)
      Message.success('修改成功')
    } else {
      await addPagePriceRule(payload)
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

const onToggleStatus = async (record: PagePriceRuleResp, val: boolean) => {
  try {
    await togglePagePriceRuleStatus(record.id, val ? 1 : 0)
    record.isActive = val ? 1 : 0
    Message.success(val ? '已启用' : '已停用')
  } catch (e: any) {
    Message.error(e?.msg || '操作失败')
  }
}

const onDelete = (record: PagePriceRuleResp) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除规则「${record.ruleName}」吗？`,
    onOk: async () => {
      await deletePagePriceRule(record.id)
      Message.success('删除成功')
      loadData()
    },
  })
}
</script>

<style scoped lang="scss"></style>
