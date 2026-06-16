<template>
  <GiPageLayout>
    <GiTable
      row-key="id"
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :pagination="false"
      @refresh="loadData"
    >
      <template #toolbar-left>
        <a-button type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>新增规则
        </a-button>
        <a-button status="success" @click="testVisible = true">
          <template #icon><icon-experiment /></template>测试规则
        </a-button>
      </template>
      <template #ruleType="{ record }">
        <a-tag :color="ruleTypeColor[record.ruleType]">{{ ruleTypeText[record.ruleType] }}</a-tag>
      </template>
      <template #scope="{ record }">
        <template v-if="!record.customerId && !record.deptId">
          <a-tag color="green">全局</a-tag>
        </template>
        <template v-else>
          <a-tag v-if="record.deptId" color="blue">{{ getDeptName(record.deptId) }}</a-tag>
          <a-tag v-if="record.customerId" color="purple">{{ getCustomerName(record.customerId) }}</a-tag>
        </template>
      </template>
      <template #condAttributeCode="{ record }">
        {{ getConditionSummary(record) }}
      </template>
      <template #condOperator="{ record }">
        <template v-if="record.conditions && record.conditions.length > 1">
          <a-tag size="small" :color="record.condLogic === 'OR' ? 'orangered' : 'arcoblue'">{{ record.condLogic || 'AND' }}</a-tag>
        </template>
        <template v-else>
          <a-tag size="small">{{ operatorText[record.condOperator] || record.condOperator }}</a-tag>
        </template>
      </template>
      <template #condValue="{ record }">
        {{ getConditionValueSummary(record) }}
      </template>
      <template #targetAttributeCode="{ record }">
        {{ getAttributeName(record.targetAttributeCode) || '-' }}
      </template>
      <template #targetOptionCodes="{ record }">
        <template v-if="record.targetOptionCodes">
          {{ getOptionNames(record.targetAttributeCode, record.targetOptionCodes) }}
        </template>
        <template v-else>-</template>
      </template>
      <template #surcharge="{ record }">
        <template v-if="record.ruleType === 'PRICE_SURCHARGE'">
          <span style="color: #f53f3f; font-weight: 600">
            +¥{{ record.surchargeAmount }}
            <span v-if="record.surchargeMode === 'PER_PAGE'" style="font-size: 12px; color: #86909c">/页</span>
          </span>
        </template>
        <template v-else>-</template>
      </template>
      <template #isActive="{ record }">
        <a-switch
          v-model="record.isActive"
          :checked-value="1"
          :unchecked-value="0"
          @change="onStatusChange(record)"
        />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link @click="onEdit(record)">编辑</a-link>
          <a-popconfirm content="确定删除该规则？" @ok="onDelete(record)">
            <a-link status="danger">删除</a-link>
          </a-popconfirm>
        </a-space>
      </template>
    </GiTable>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="editId ? '编辑规则' : '新增规则'"
      width="720px"
      @before-ok="handleSubmit"
      @cancel="modalVisible = false"
    >
      <a-form ref="formRef" :model="formData" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="规则名称" field="name" :rules="[{ required: true, message: '请输入' }]">
              <a-input v-model="formData.name" placeholder="如：A2及以上禁止骑马订" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="规则类型" field="ruleType" :rules="[{ required: true, message: '请选择' }]">
              <a-select v-model="formData.ruleType" placeholder="请选择" @change="onRuleTypeChange">
                <a-option value="FORBIDDEN">禁止组合</a-option>
                <a-option value="HIDE_OPTION">隐藏选项</a-option>
                <a-option value="PRICE_SURCHARGE">加价</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>适用范围（留空表示全局规则）</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="适用部门" field="deptId">
              <a-tree-select
                v-model="formData.deptId"
                :data="deptTreeData"
                placeholder="留空表示所有部门"
                allow-clear
                :field-names="{ key: 'key', title: 'title', children: 'children' }"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="适用客户" field="customerId">
              <a-select
                v-model="formData.customerId"
                placeholder="留空表示所有客户"
                allow-clear
                filterable
              >
                <a-option v-for="c in customerDict" :key="c.value" :value="c.value">{{ c.label }}</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>条件配置（当满足以下条件时触发规则）</a-divider>
        <a-row :gutter="8" align="center" style="margin-bottom: 12px">
          <a-col :span="8">
            <a-radio-group v-model="formData.condLogic" type="button" size="small">
              <a-radio value="AND">全部满足 (AND)</a-radio>
              <a-radio value="OR">任一满足 (OR)</a-radio>
            </a-radio-group>
          </a-col>
          <a-col :span="4">
            <a-button type="primary" size="small" @click="addCondition">
              <template #icon><icon-plus /></template>添加条件
            </a-button>
          </a-col>
        </a-row>
        <div v-for="(cond, idx) in formData.conditions" :key="idx" style="margin-bottom: 8px">
          <a-row :gutter="8" align="center">
            <a-col :span="7">
              <a-select v-model="cond.attributeCode" placeholder="选择属性" allow-clear @change="onCondAttrChange(idx)">
                <a-option v-for="attr in attributeList" :key="attr.code" :value="attr.code">{{ attr.name }}</a-option>
              </a-select>
            </a-col>
            <a-col :span="5">
              <a-select v-model="cond.operator" placeholder="操作符">
                <a-option value="EQ">等于</a-option>
                <a-option value="NE">不等于</a-option>
                <a-option value="IN">包含于</a-option>
                <a-option value="NOT_IN">不包含于</a-option>
                <a-option value="GT">大于</a-option>
                <a-option value="GTE">≥</a-option>
                <a-option value="LT">小于</a-option>
                <a-option value="LTE">≤</a-option>
              </a-select>
            </a-col>
            <a-col :span="8">
              <a-select
                v-if="getCondOpts(idx).length > 0"
                :model-value="getCondValueList(idx)"
                placeholder="选择选项值"
                multiple
                allow-clear
                allow-create
                @change="(val: any) => setCondValueList(idx, val as string[])"
              >
                <a-option v-for="opt in getCondOpts(idx)" :key="opt.code" :value="opt.code">{{ opt.name }}</a-option>
              </a-select>
              <a-input v-else v-model="cond.value" placeholder="条件值" />
            </a-col>
            <a-col :span="4">
              <a-button v-if="formData.conditions!.length > 1" status="danger" size="small" @click="removeCondition(idx)">
                <template #icon><icon-delete /></template>
              </a-button>
            </a-col>
          </a-row>
        </div>

        <a-divider>
          {{ formData.ruleType === 'PRICE_SURCHARGE' ? '加价配置' : '动作配置' }}
        </a-divider>

        <template v-if="formData.ruleType === 'PRICE_SURCHARGE'">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="加价金额" field="surchargeAmount" :rules="[{ required: true, message: '请输入' }]">
                <a-input-number v-model="formData.surchargeAmount" :precision="2" :min="0" :step="0.01" style="width:100%" placeholder="如 5.00" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="加价方式" field="surchargeMode">
                <a-select v-model="formData.surchargeMode" placeholder="请选择">
                  <a-option value="FIXED">固定加价</a-option>
                  <a-option value="PER_PAGE">按页加价</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="模拟页数">
                <a-input-number v-model="testPageCount" :min="1" style="width:100%" placeholder="用于测试" />
              </a-form-item>
            </a-col>
          </a-row>
        </template>
        <template v-else>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="目标属性" field="targetAttributeCode" :rules="[{ required: true, message: '请选择' }]">
                <a-select
                  v-model="formData.targetAttributeCode"
                  placeholder="选择属性"
                  allow-clear
                  @change="onTargetAttributeChange"
                >
                  <a-option v-for="attr in attributeList" :key="attr.code" :value="attr.code">{{ attr.name }}</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="16">
              <a-form-item label="目标选项" field="targetOptionCodes" :rules="[{ required: true, message: '请选择' }]">
                <a-select
                  v-if="targetOptions.length > 0"
                  v-model="targetOptionList"
                  placeholder="选择要禁止/隐藏的选项"
                  multiple
                  allow-clear
                >
                  <a-option v-for="opt in targetOptions" :key="opt.code" :value="opt.code">{{ opt.name }}</a-option>
                </a-select>
                <a-input v-else v-model="formData.targetOptionCodes" placeholder="选项编码，多个逗号分隔" />
              </a-form-item>
            </a-col>
          </a-row>
        </template>

        <a-form-item label="提示信息" field="errorMessage">
          <a-input v-model="formData.errorMessage" placeholder="如：A2及以上纸张不支持骑马订" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="优先级" field="priority">
              <a-input-number v-model="formData.priority" :min="0" placeholder="数字越大越高" style="width:100%" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 规则测试面板 -->
    <a-modal v-model:visible="testVisible" title="规则测试" width="800px" :footer="false" @cancel="testVisible = false">
      <a-alert type="info" style="margin-bottom: 16px">
        模拟一组打印属性配置，实时查看规则验证结果、可用选项和加价金额。
      </a-alert>
      <a-row :gutter="24">
        <!-- 左侧：属性配置模拟 -->
        <a-col :span="12">
          <a-card title="模拟属性配置" :bordered="false">
            <a-form :model="testAttributes" layout="vertical">
              <a-form-item label="模拟客户">
                <a-select
                  v-model="testCustomerId"
                  placeholder="留空表示全局"
                  allow-clear
                  filterable
                  @change="runTest"
                >
                  <a-option v-for="c in customerDict" :key="c.value" :value="c.value">{{ c.label }}</a-option>
                </a-select>
              </a-form-item>
              <a-form-item v-for="attr in attributeList" :key="attr.code" :label="attr.name">
                <a-select
                  v-model="testAttributes[attr.code]"
                  :placeholder="`选择${attr.name}`"
                  allow-clear
                  @change="runTest"
                >
                  <a-option v-for="opt in getAttrOptions(attr.code)" :key="opt.code" :value="opt.code">
                    {{ opt.name }}
                  </a-option>
                </a-select>
              </a-form-item>
              <a-form-item label="模拟页数">
                <a-input-number v-model="testPageCount" :min="1" style="width:100%" @change="runTest" />
              </a-form-item>
            </a-form>
          </a-card>
        </a-col>
        <!-- 右侧：测试结果 -->
        <a-col :span="12">
          <a-card title="测试结果" :bordered="false">
            <a-spin :loading="testLoading" style="width: 100%">
              <template v-if="testResult">
                <a-space direction="vertical" fill style="width: 100%">
                  <!-- 验证结果 -->
                  <a-alert v-if="testResult.valid" type="success">配置合法，无违规</a-alert>
                  <a-alert v-else type="warning">
                    <template #title>配置违规</template>
                    <ul style="margin: 4px 0; padding-left: 18px">
                      <li v-for="(v, i) in testResult.violations" :key="i">{{ v }}</li>
                    </ul>
                  </a-alert>
                  <!-- 加价金额 -->
                  <a-card :bordered="false" style="background: var(--color-fill-1)">
                    <a-statistic title="加价金额" :value="testResult.surcharge" :precision="2" prefix="¥">
                      <template #suffix>
                        <span v-if="testResult.surcharge > 0" style="font-size: 12px; color: #86909c">
                          (含按页加价×{{ testPageCount }}页)
                        </span>
                      </template>
                    </a-statistic>
                  </a-card>
                  <!-- 可用选项 -->
                  <a-card :bordered="false" title="各属性可用选项" style="background: var(--color-fill-1)">
                    <div v-for="(opts, code) in testResult.availableOptions" :key="code" style="margin-bottom: 8px">
                      <span style="font-weight: 600">{{ getAttributeName(code) || code }}：</span>
                      <a-tag v-for="opt in opts" :key="opt" size="small" style="margin: 2px">{{ getOptionName(code, opt) || opt }}</a-tag>
                      <a-tag v-if="!opts.length" size="small" color="red">无可用选项</a-tag>
                    </div>
                  </a-card>
                </a-space>
              </template>
              <a-empty v-else description="请在左侧选择属性配置后查看结果" />
            </a-spin>
          </a-card>
        </a-col>
      </a-row>
    </a-modal>
  </GiPageLayout>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import {
  type ConditionItem,
  type PrintConstraintReq,
  type PrintConstraintResp,
  type RuleTestResult,
  addPrintConstraint,
  deletePrintConstraint,
  listPrintConstraints,
  testRules,
  togglePrintConstraintStatus,
  updatePrintConstraint,
} from '@/apis/finance/printConfigRule'
import { type PrintAttributeResp, listPrintAttribute } from '@/apis/finance/print-attribute'
import { type PrintAttributeOptionResp, listPrintAttributeOption } from '@/apis/finance/print-attribute-option'
import { listFinCustomerDict } from '@/apis/finance/fin-customer'
import { listDeptDictTree } from '@/apis/system/dept'

defineOptions({ name: 'FinPrintConstraintRule' })

const ruleTypeColor: Record<string, string> = {
  FORBIDDEN: 'red',
  HIDE_OPTION: 'blue',
  PRICE_SURCHARGE: 'orange',
}
const ruleTypeText: Record<string, string> = {
  FORBIDDEN: '禁止组合',
  HIDE_OPTION: '隐藏选项',
  PRICE_SURCHARGE: '加价',
}
const operatorText: Record<string, string> = {
  EQ: '等于',
  NE: '不等于',
  IN: '包含于',
  NOT_IN: '不包含于',
  GT: '大于(排序)',
  GTE: '≥(排序)',
  LT: '小于(排序)',
  LTE: '≤(排序)',
}

// ========== 数据 ==========
const loading = ref(false)
const dataList = ref<PrintConstraintResp[]>([])
const attributeList = ref<PrintAttributeResp[]>([])
const optionMap = ref<Record<string, PrintAttributeOptionResp[]>>({})
interface DictItem {
  label: string
  value: string
}

const customerDict = ref<DictItem[]>([])
const deptTreeData = ref<Array<any>>([])

const columns = [
  { title: '规则名称', dataIndex: 'name', width: 150, ellipsis: true, tooltip: true },
  { title: '类型', slotName: 'ruleType', width: 100, align: 'center' },
  { title: '适用范围', slotName: 'scope', width: 140, ellipsis: true, tooltip: true },
  { title: '条件属性', slotName: 'condAttributeCode', width: 100 },
  { title: '操作符', slotName: 'condOperator', width: 80, align: 'center' },
  { title: '条件值', slotName: 'condValue', width: 120, ellipsis: true, tooltip: true },
  { title: '目标属性', slotName: 'targetAttributeCode', width: 100 },
  { title: '目标选项', slotName: 'targetOptionCodes', width: 150, ellipsis: true, tooltip: true },
  { title: '加价', slotName: 'surcharge', width: 110, align: 'center' },
  { title: '优先级', dataIndex: 'priority', width: 70, align: 'center' },
  { title: '状态', slotName: 'isActive', width: 80, align: 'center' },
  { title: '操作', slotName: 'action', width: 120, fixed: 'right' },
]

// ========== 名称映射工具 ==========
const getAttributeName = (code: string) => attributeList.value.find((a) => a.code === code)?.name || code

const getAttrOptions = (attrCode: string) => optionMap.value[attrCode] || []

const getOptionName = (attrCode: string, optCode: string) => {
  const opts = optionMap.value[attrCode] || []
  return opts.find((o) => o.code === optCode)?.name || optCode
}

const getOptionNames = (attrCode: string, codesStr: string) => {
  if (!codesStr || !attrCode) return codesStr || '-'
  const codes = codesStr.split(',').map((s) => s.trim()).filter(Boolean)
  const names = codes.map((c) => getOptionName(attrCode, c))
  const hasMatch = names.some((n, i) => n !== codes[i])
  return hasMatch ? names.join('\u3001') : codesStr
}

const getCustomerName = (id: string) => {
  const item = customerDict.value.find((c) => c.value === id)
  return item?.label || id
}

const findInTree = (nodes: any[], targetId: string): string | null => {
  if (!nodes) return null
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (String(n.key) === targetId) return String(n.title)
    if (n.children) {
      const found = findInTree(n.children, targetId)
      if (found) return found
    }
  }
  return null
}

const getDeptName = (id: string) => {
  const result = findInTree(deptTreeData.value, id)
  return result || id
}

// 多条件摘要
const getConditionSummary = (record: PrintConstraintResp) => {
  if (record.conditions && record.conditions.length > 0) {
    return record.conditions.map((c) => getAttributeName(c.attributeCode)).join(' / ')
  }
  return getAttributeName(record.condAttributeCode)
}

const getConditionValueSummary = (record: PrintConstraintResp) => {
  if (record.conditions && record.conditions.length > 0) {
    return record.conditions.map((c) => {
      const optName = getOptionNames(c.attributeCode, c.value)
      return `${operatorText[c.operator] || c.operator} ${optName}`
    }).join(record.condLogic === 'OR' ? ' \u6216 ' : ' \u4E14 ')
  }
  return getOptionNames(record.condAttributeCode, record.condValue)
}

// ========== 加载数据 ==========
const loadData = async () => {
  loading.value = true
  try {
    const { data } = await listPrintConstraints()
    dataList.value = data || []
  } finally {
    loading.value = false
  }
}

const loadAttributes = async () => {
  try {
    const { data } = await listPrintAttribute({ sort: ['sort,asc'], page: 1, size: 999 })
    attributeList.value = data?.list || []
    for (const attr of attributeList.value) {
      const { data: optData } = await listPrintAttributeOption({
        attributeId: attr.id,
        sort: ['sort,asc'],
        page: 1,
        size: 999,
      })
      optionMap.value[attr.code] = optData?.list || []
    }
  } catch { /* ignore */ }
}

const loadCustomerAndDept = async () => {
  try {
    const { data } = await listFinCustomerDict()
    customerDict.value = (data || []).map((item: any) => ({ label: item.label, value: String(item.value) }))
  } catch { /* ignore */ }
  try {
    const { data } = await listDeptDictTree({ description: '' })
    deptTreeData.value = data || []
  } catch { /* ignore */ }
}

// ========== 表单 ==========
const modalVisible = ref(false)
const editId = ref('')
const formRef = ref()

const defaultForm = (): PrintConstraintReq => ({
  name: '',
  ruleType: 'FORBIDDEN',
  condLogic: 'AND',
  conditions: [{ attributeCode: '', operator: 'EQ', value: '' }],
  targetAttributeCode: '',
  targetOptionCodes: '',
  surchargeAmount: null,
  surchargeMode: 'FIXED',
  errorMessage: '',
  priority: 0,
  isActive: 1,
  customerId: null,
  deptId: null,
})
const formData = ref<PrintConstraintReq>(defaultForm())

// 条件操作方法
const addCondition = () => {
  if (!formData.value.conditions) formData.value.conditions = []
  formData.value.conditions.push({ attributeCode: '', operator: 'EQ', value: '' })
}

const removeCondition = (idx: number) => {
  formData.value.conditions?.splice(idx, 1)
}

const getCondOpts = (idx: number) => {
  const cond = formData.value.conditions?.[idx]
  if (!cond || !cond.attributeCode) return []
  return optionMap.value[cond.attributeCode] || []
}

const onCondAttrChange = (idx: number) => {
  const cond = formData.value.conditions?.[idx]
  if (cond) {
    cond.value = ''
  }
}

// 获取条件项的 valueList（用于多选下拉）
const getCondValueList = (idx: number) => {
  const cond = formData.value.conditions?.[idx]
  if (!cond || !cond.value) return []
  return cond.value.split(',').filter(Boolean)
}

const setCondValueList = (idx: number, val: string[]) => {
  const cond = formData.value.conditions?.[idx]
  if (cond) cond.value = val.join(',')
}

// 目标属性对应的选项列表

const targetOptions = computed(() => {
  if (!formData.value.targetAttributeCode) return []
  return optionMap.value[formData.value.targetAttributeCode] || []
})

// 目标选项：多选下拉 <-> 逗号分隔字符串
const targetOptionList = computed({
  get: () => formData.value.targetOptionCodes ? formData.value.targetOptionCodes.split(',').filter(Boolean) : [],
  set: (val: string[]) => { formData.value.targetOptionCodes = val.join(',') },
})

const onTargetAttributeChange = () => {
  formData.value.targetOptionCodes = ''
}

const onRuleTypeChange = () => {
  formData.value.targetAttributeCode = ''
  formData.value.targetOptionCodes = ''
  formData.value.surchargeAmount = null
  formData.value.surchargeMode = 'FIXED'
}

const onAdd = () => {
  editId.value = ''
  formData.value = defaultForm()
  modalVisible.value = true
}

const onEdit = (record: PrintConstraintResp) => {
  editId.value = record.id
  // 将后端数据转换为表单格式
  let conditions: ConditionItem[] = []
  if (record.conditions && record.conditions.length > 0) {
    conditions = record.conditions.map((c) => ({ attributeCode: c.attributeCode, operator: c.operator, value: c.value }))
  } else if (record.condAttributeCode) {
    // 单条件回退：转为 conditions 数组
    conditions = [{ attributeCode: record.condAttributeCode, operator: record.condOperator, value: record.condValue }]
  }
  formData.value = {
    name: record.name,
    ruleType: record.ruleType,
    condLogic: record.condLogic || 'AND',
    conditions,
    targetAttributeCode: record.targetAttributeCode,
    targetOptionCodes: record.targetOptionCodes,
    surchargeAmount: record.surchargeAmount,
    surchargeMode: record.surchargeMode,
    errorMessage: record.errorMessage,
    priority: record.priority,
    isActive: record.isActive,
    customerId: record.customerId,
    deptId: record.deptId,
  }
  modalVisible.value = true
}

const onDelete = async (record: PrintConstraintResp) => {
  await deletePrintConstraint(record.id)
  Message.success('删除成功')
  loadData()
}

const onStatusChange = async (record: PrintConstraintResp) => {
  try {
    await togglePrintConstraintStatus(record.id, record.isActive)
    Message.success('状态更新成功')
  } catch {
    record.isActive = record.isActive === 1 ? 0 : 1
  }
}

const handleSubmit = async () => {
  const err = await formRef.value?.validate()
  if (err) return false
  try {
    if (editId.value) {
      await updatePrintConstraint(editId.value, formData.value)
      Message.success('修改成功')
    } else {
      await addPrintConstraint(formData.value)
      Message.success('新增成功')
    }
    modalVisible.value = false
    loadData()
    return true
  } catch {
    return false
  }
}

// ========== 规则测试面板 ==========
const testVisible = ref(false)
const testLoading = ref(false)
const testResult = ref<RuleTestResult | null>(null)
const testAttributes = ref<Record<string, string>>({})
const testPageCount = ref(1)
const testCustomerId = ref<string | undefined>(undefined)
const testDeptId = ref<string | undefined>(undefined)

const runTest = async () => {
  const filledAttrs = Object.fromEntries(Object.entries(testAttributes.value).filter(([, v]) => v !== undefined && v !== ''))
  if (Object.keys(filledAttrs).length === 0) {
    testResult.value = null
    return
  }
  testLoading.value = true
  try {
    const { data } = await testRules(filledAttrs, testPageCount.value, testCustomerId.value, testDeptId.value)
    testResult.value = data
  } catch {
    testResult.value = null
  } finally {
    testLoading.value = false
  }
}

onMounted(() => {
  loadData()
  loadAttributes()
  loadCustomerAndDept()
})
</script>
