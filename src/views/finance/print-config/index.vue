<template>
  <GiPageLayout>
    <a-row :gutter="16" style="height: 100%">
      <!-- 左侧：属性列表 -->
      <a-col :span="10" style="height: 100%">
        <a-card title="打印属性" :bordered="false" style="height: 100%">
          <template #extra>
            <a-button v-permission="['finance:fin-print-attribute:create']" type="primary" size="small" @click="onAddAttr">
              <template #icon><icon-plus /></template>新增属性
            </a-button>
          </template>
          <a-table
            row-key="id"
            :data="attrList"
            :loading="attrLoading"
            :pagination="false"
            :scroll="{ y: 'calc(100vh - 280px)' }"
            :row-class="(record: any) => selectedAttrId === record.id ? 'row-selected' : ''"
            @row-click="onSelectAttr"
          >
            <template #columns>
              <a-table-column title="属性名称" data-index="name" :width="120" />
              <a-table-column title="编码" data-index="code" :width="120" ellipsis />
              <a-table-column title="类型" data-index="inputType" :width="80" align="center">
                <template #cell="{ record }">
                  <a-tag size="small" :color="record.inputType === 'SELECT' ? 'blue' : 'purple'">
                    {{ record.inputType === 'SELECT' ? '单选' : '多选' }}
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column title="必选" data-index="isRequired" :width="60" align="center">
                <template #cell="{ record }">
                  <icon-check-circle-fill v-if="record.isRequired" style="color: #00b42a" />
                  <icon-close-circle-fill v-else style="color: #ccc" />
                </template>
              </a-table-column>
              <a-table-column title="状态" data-index="status" :width="60" align="center">
                <template #cell="{ record }">
                  <a-badge :status="record.status === 1 ? 'success' : 'danger'" :text="record.status === 1 ? '启用' : '禁用'" />
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="100" align="center">
                <template #cell="{ record }">
                  <a-space>
                    <a-link v-permission="['finance:fin-print-attribute:update']" @click.stop="onEditAttr(record)">编辑</a-link>
                    <a-popconfirm content="确定删除该属性？" @ok="onDeleteAttr(record)">
                      <a-link v-permission="['finance:fin-print-attribute:delete']" status="danger" @click.stop>删除</a-link>
                    </a-popconfirm>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <!-- 右侧：选项列表 -->
      <a-col :span="14" style="height: 100%">
        <a-card :title="selectedAttrId ? `「${selectedAttrName}」的选项` : '请选择左侧属性'" :bordered="false" style="height: 100%">
          <template #extra>
            <a-button
              v-if="selectedAttrId"
              v-permission="['finance:fin-print-attribute-option:create']"
              type="primary"
              size="small"
              @click="onAddOption"
            >
              <template #icon><icon-plus /></template>新增选项
            </a-button>
          </template>
          <a-empty v-if="!selectedAttrId" description="请先在左侧选择一个属性" />
          <a-table
            v-else
            row-key="id"
            :data="optionList"
            :loading="optionLoading"
            :pagination="false"
            :scroll="{ y: 'calc(100vh - 280px)' }"
          >
            <template #columns>
              <a-table-column title="选项名称" data-index="name" :width="100" />
              <a-table-column title="编码" data-index="code" :width="100" ellipsis />
              <a-table-column title="计价方式" data-index="priceMode" :width="90" align="center">
                <template #cell="{ record }">
                  <a-tag size="small" :color="priceModeColor[record.priceMode]">{{ priceModeLabel[record.priceMode] }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="价格值" data-index="price" :width="100" align="right">
                <template #cell="{ record }">
                  <span v-if="record.priceMode === 'PER_PAGE'">{{ record.price }} 元/页</span>
                  <span v-else-if="record.priceMode === 'FIXED'">{{ record.price }} 元/份</span>
                  <span v-else-if="record.priceMode === 'MULTIPLIER'">x{{ record.price }}</span>
                </template>
              </a-table-column>
              <a-table-column title="默认" data-index="isDefault" :width="60" align="center">
                <template #cell="{ record }">
                  <icon-check-circle-fill v-if="record.isDefault" style="color: #00b42a" />
                </template>
              </a-table-column>
              <a-table-column title="状态" :width="60" align="center">
                <template #cell="{ record }">
                  <a-badge :status="record.status === 1 ? 'success' : 'danger'" :text="record.status === 1 ? '启用' : '禁用'" />
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="140" align="center">
                <template #cell="{ record }">
                  <a-space>
                    <a-link v-permission="['finance:fin-print-attribute-option:update']" @click="onEditOption(record)">编辑</a-link>
                    <a-link v-permission="['finance:fin-print-attribute-option:update']" @click="openComboDrawer(record)">联动</a-link>
                    <a-popconfirm content="确定删除该选项？" @ok="onDeleteOption(record)">
                      <a-link v-permission="['finance:fin-print-attribute-option:delete']" status="danger">删除</a-link>
                    </a-popconfirm>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- 属性编辑弹窗 -->
    <a-modal v-model:visible="attrModalVisible" :title="attrModalTitle" :mask-closable="false" :width="480" @before-ok="saveAttr" @close="resetAttrForm">
      <a-form ref="attrFormRef" :model="attrForm" layout="vertical">
        <a-form-item label="属性名称" field="name" :rules="[{ required: true, message: '请输入属性名称' }]">
          <a-input v-model="attrForm.name" placeholder="如：纸张大小、打印方式" :max-length="50" />
        </a-form-item>
        <a-form-item label="属性编码" field="code" :rules="[{ required: true, message: '请输入属性编码' }]">
          <a-input v-model="attrForm.code" placeholder="如：paper_size、print_mode" :max-length="50" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="输入类型" field="inputType">
              <a-select v-model="attrForm.inputType">
                <a-option value="SELECT">单选</a-option>
                <a-option value="MULTI_SELECT">多选</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序号" field="sort">
              <a-input-number v-model="attrForm.sort" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="是否必选" field="isRequired">
              <a-switch v-model="attrForm.isRequired" type="round" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" field="status">
              <a-switch v-model="attrForm.status" type="round" :checked-value="1" :unchecked-value="2" checked-text="启用" unchecked-text="禁用" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 选项编辑弹窗 -->
    <a-modal v-model:visible="optionModalVisible" :title="optionModalTitle" :mask-closable="false" :width="520" @before-ok="saveOption" @close="resetOptionForm">
      <a-form ref="optionFormRef" :model="optionForm" layout="vertical">
        <a-form-item label="选项名称" field="name" :rules="[{ required: true, message: '请输入选项名称' }]">
          <a-input v-model="optionForm.name" placeholder="如：A4、彩色、双面" :max-length="50" />
        </a-form-item>
        <a-form-item label="选项编码" field="code" :rules="[{ required: true, message: '请输入选项编码' }]">
          <a-input v-model="optionForm.code" placeholder="如：a4、color、double_side" :max-length="50" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="计价方式" field="priceMode" :rules="[{ required: true, message: '请选择计价方式' }]">
              <a-select v-model="optionForm.priceMode" placeholder="请选择">
                <a-option value="PER_PAGE">按页计价</a-option>
                <a-option value="FIXED">固定费用</a-option>
                <a-option value="MULTIPLIER">乘数系数</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="价格值" field="price" :rules="[{ required: true, message: '请输入价格值' }]">
              <a-input-number v-model="optionForm.price" :precision="4" :min="0" :step="0.01" style="width: 100%" :placeholder="pricePlaceholder" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="排序号" field="sort">
              <a-input-number v-model="optionForm.sort" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="是否默认" field="isDefault">
              <a-switch v-model="optionForm.isDefault" type="round" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态" field="status">
              <a-switch v-model="optionForm.status" type="round" :checked-value="1" :unchecked-value="2" checked-text="启用" unchecked-text="禁用" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 联动价格抽屉 -->
    <a-drawer
      v-model:visible="comboDrawerVisible"
      :title="`「${comboOptionName}」的联动价格`"
      :width="900"
      :footer="false"
    >
      <a-space direction="vertical" fill :size="12" style="width: 100%">
        <a-alert type="info" :show-icon="true">
          当该选项与「触发选项」同时被选中时，用联动价格覆盖默认价格。
          <br />例如：彩色默认 x2，联动 A0 纸张后可覆盖为 x3 → 10×3=30/页
        </a-alert>
        <a-button type="primary" size="small" @click="onAddComboPrice">
          <template #icon><icon-plus /></template>新增联动价格
        </a-button>
        <a-table
          row-key="id"
          :data="comboPriceList"
          :loading="comboPriceLoading"
          :pagination="false"
          size="small"
        >
          <template #columns>
            <a-table-column title="联动说明" :width="180">
              <template #cell="{ record }">
                <template v-if="record.optionId === comboOptionId">
                  <span>当 <b>{{ getComboOptionLabel(record.comboOptionId) }}</b> 选中时覆盖本选项</span>
                </template>
                <template v-else>
                  <span>本选项选中时覆盖 <b>{{ getComboOptionLabel(record.optionId) }}</b></span>
                </template>
              </template>
            </a-table-column>
            <a-table-column title="覆盖计价" data-index="priceMode" :width="90" align="center">
              <template #cell="{ record }">
                <a-tag size="small" :color="priceModeColor[record.priceMode]">{{ priceModeLabel[record.priceMode] }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="覆盖价格" data-index="price" :width="100" align="right">
              <template #cell="{ record }">
                <span v-if="record.priceMode === 'PER_PAGE'">{{ record.price }} 元/页</span>
                <span v-else-if="record.priceMode === 'FIXED'">{{ record.price }} 元/份</span>
                <span v-else-if="record.priceMode === 'MULTIPLIER'">x{{ record.price }}</span>
              </template>
            </a-table-column>
            <a-table-column title="作用域" :width="100" align="center">
              <template #cell="{ record }">
                <template v-if="!record.customerId && !record.deptId">
                  <a-tag size="small" color="green">全局</a-tag>
                </template>
                <template v-else>
                  <a-tag v-if="record.deptId" size="small" color="blue">{{ getComboDeptName(record.deptId) }}</a-tag>
                  <a-tag v-if="record.customerId" size="small" color="purple">{{ getComboCustomerName(record.customerId) }}</a-tag>
                </template>
              </template>
            </a-table-column>
            <a-table-column title="操作" :width="80" align="center">
              <template #cell="{ record }">
                <a-space>
                  <a-link @click="onEditComboPrice(record)">编辑</a-link>
                  <a-popconfirm content="确定删除？" @ok="onDeleteComboPrice(record)">
                    <a-link status="danger">删除</a-link>
                  </a-popconfirm>
                </a-space>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </a-space>

      <!-- 联动价格编辑弹窗 -->
      <a-modal
        v-model:visible="comboFormVisible"
        :title="comboFormEditId ? '编辑联动价格' : '新增联动价格'"
        :mask-closable="false"
        :width="420"
        :render-to-body="false"
        @before-ok="saveComboPrice"
        @close="resetComboForm"
      >
        <a-form ref="comboFormRef" :model="comboForm" layout="vertical">
          <a-form-item label="联动方向" field="direction" :rules="[{ required: true, message: '请选择方向' }]">
            <a-radio-group v-model="comboForm.direction" :disabled="!!comboFormEditId">
              <a-radio value="override-me">其他选项触发 → 覆盖本选项价格</a-radio>
              <a-radio value="me-trigger">本选项触发 → 覆盖其他选项价格</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="comboForm.direction === 'override-me'" label="触发选项（选中时覆盖本选项价格）" field="comboOptionId" :rules="[{ required: true, message: '请选择触发选项' }]">
            <a-select v-model="comboForm.comboOptionId" placeholder="请选择触发选项" :disabled="!!comboFormEditId">
              <a-option v-for="opt in otherOptionList" :key="opt.id" :value="opt.id">
                {{ opt.attrName }} / {{ opt.name }}
              </a-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="comboForm.direction === 'me-trigger'" label="被覆盖选项（本选项选中时覆盖其价格）" field="targetOptionId" :rules="[{ required: true, message: '请选择被覆盖选项' }]">
            <a-select v-model="comboForm.targetOptionId" placeholder="请选择被覆盖选项" :disabled="!!comboFormEditId">
              <a-option v-for="opt in otherOptionList" :key="opt.id" :value="opt.id">
                {{ opt.attrName }} / {{ opt.name }}
              </a-option>
            </a-select>
          </a-form-item>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="覆盖计价方式" field="priceMode" :rules="[{ required: true, message: '请选择' }]">
                <a-select v-model="comboForm.priceMode" placeholder="请选择">
                  <a-option value="PER_PAGE">按页计价</a-option>
                  <a-option value="FIXED">固定费用</a-option>
                  <a-option value="MULTIPLIER">乘数系数</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="覆盖价格值" field="price" :rules="[{ required: true, message: '请输入' }]">
                <a-input-number v-model="comboForm.price" :precision="4" :min="0" :step="0.01" style="width: 100%" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="适用部门" field="deptId">
                <a-tree-select
                  v-model="comboForm.deptId"
                  :data="comboDeptTree"
                  placeholder="留空表示全局"
                  allow-clear
                  :field-names="{ key: 'key', title: 'title', children: 'children' }"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="适用客户" field="customerId">
                <a-select v-model="comboForm.customerId" placeholder="留空表示全局" allow-clear filterable>
                  <a-option v-for="c in comboCustomerDict" :key="c.value" :value="c.value">{{ c.label }}</a-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>
    </a-drawer>
  </GiPageLayout>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import {
  type PrintAttributeResp,
  addPrintAttribute,
  deletePrintAttribute,
  listPrintAttribute,
  updatePrintAttribute,
} from '@/apis/finance/print-attribute'
import {
  type PrintAttributeOptionResp,
  addPrintAttributeOption,
  deletePrintAttributeOption,
  listPrintAttributeOption,
  updatePrintAttributeOption,
} from '@/apis/finance/print-attribute-option'
import {
  type ComboPriceResp,
  addComboPrice,
  deleteComboPrice,
  listComboPrices,
  updateComboPrice,
} from '@/apis/finance/printConfigRule'
import { listFinCustomerDict } from '@/apis/finance/fin-customer'
import { listDeptDictTree } from '@/apis/system/dept'

defineOptions({ name: 'FinPrintConfig' })

const priceModeLabel: Record<string, string> = {
  PER_PAGE: '按页',
  FIXED: '固定',
  MULTIPLIER: '乘数',
}
const priceModeColor: Record<string, string> = {
  PER_PAGE: 'blue',
  FIXED: 'green',
  MULTIPLIER: 'orange',
}

// ========= 属性 & 选项列表 =========
const attrList = ref<PrintAttributeResp[]>([])
const attrLoading = ref(false)
const selectedAttrId = ref<string>('')
const selectedAttrName = ref('')
const optionList = ref<PrintAttributeOptionResp[]>([])
const optionLoading = ref(false)

const loadOptionList = async () => {
  if (!selectedAttrId.value) return
  optionLoading.value = true
  try {
    const { data } = await listPrintAttributeOption({
      attributeId: selectedAttrId.value,
      sort: ['sort,asc'],
      page: 1,
      size: 999,
    })
    optionList.value = data?.list || []
  } finally {
    optionLoading.value = false
  }
}

const loadAttrList = async () => {
  attrLoading.value = true
  try {
    const { data } = await listPrintAttribute({ sort: ['sort,asc'], page: 1, size: 999 })
    attrList.value = data?.list || []
  } finally {
    attrLoading.value = false
  }
}

const onSelectAttr = (record: any) => {
  selectedAttrId.value = record.id
  selectedAttrName.value = record.name
  loadOptionList()
}

// ========= 属性编辑弹窗 =========
const attrModalVisible = ref(false)
const attrEditId = ref('')
const attrModalTitle = computed(() => (attrEditId.value ? '编辑属性' : '新增属性'))
const attrFormRef = ref()
const attrForm = reactive({
  name: '',
  code: '',
  inputType: 'SELECT',
  isRequired: true,
  sort: 0,
  status: 1,
})

const resetAttrForm = () => {
  attrFormRef.value?.resetFields()
  attrEditId.value = ''
  Object.assign(attrForm, { name: '', code: '', inputType: 'SELECT', isRequired: true, sort: 0, status: 1 })
}

const onAddAttr = () => {
  resetAttrForm()
  attrModalVisible.value = true
}

const onEditAttr = (record: PrintAttributeResp) => {
  resetAttrForm()
  attrEditId.value = record.id
  Object.assign(attrForm, {
    name: record.name,
    code: record.code,
    inputType: record.inputType,
    isRequired: record.isRequired,
    sort: record.sort,
    status: record.status,
  })
  attrModalVisible.value = true
}

const saveAttr = async () => {
  try {
    const err = await attrFormRef.value?.validate()
    if (err) return false
    if (attrEditId.value) {
      await updatePrintAttribute(attrForm, attrEditId.value)
      Message.success('修改成功')
    } else {
      await addPrintAttribute(attrForm)
      Message.success('新增成功')
    }
    loadAttrList()
    return true
  } catch {
    return false
  }
}

const onDeleteAttr = async (record: PrintAttributeResp) => {
  await deletePrintAttribute([record.id])
  Message.success('删除成功')
  if (selectedAttrId.value === record.id) {
    selectedAttrId.value = ''
    optionList.value = []
  }
  loadAttrList()
}

// ========= 选项编辑弹窗 =========
const optionModalVisible = ref(false)
const optionEditId = ref('')
const optionModalTitle = computed(() => (optionEditId.value ? '编辑选项' : '新增选项'))
const optionFormRef = ref()
const optionForm = reactive({
  name: '',
  code: '',
  priceMode: 'PER_PAGE',
  price: 0,
  isDefault: false,
  sort: 0,
  status: 1,
})

const pricePlaceholder = computed(() => {
  switch (optionForm.priceMode) {
    case 'PER_PAGE': return '每页单价，如 0.10'
    case 'FIXED': return '固定金额，如 5.00'
    case 'MULTIPLIER': return '乘数，如 0.80'
    default: return '请输入'
  }
})

const resetOptionForm = () => {
  optionFormRef.value?.resetFields()
  optionEditId.value = ''
  Object.assign(optionForm, { name: '', code: '', priceMode: 'PER_PAGE', price: 0, isDefault: false, sort: 0, status: 1 })
}

const onAddOption = () => {
  resetOptionForm()
  optionModalVisible.value = true
}

const onEditOption = (record: PrintAttributeOptionResp) => {
  resetOptionForm()
  optionEditId.value = record.id
  Object.assign(optionForm, {
    name: record.name,
    code: record.code,
    priceMode: record.priceMode,
    price: record.price,
    isDefault: record.isDefault,
    sort: record.sort,
    status: record.status,
  })
  optionModalVisible.value = true
}

const saveOption = async () => {
  try {
    const err = await optionFormRef.value?.validate()
    if (err) return false
    const payload = { ...optionForm, attributeId: selectedAttrId.value }
    if (optionEditId.value) {
      await updatePrintAttributeOption(payload, optionEditId.value)
      Message.success('修改成功')
    } else {
      await addPrintAttributeOption(payload)
      Message.success('新增成功')
    }
    loadOptionList()
    return true
  } catch {
    return false
  }
}

const onDeleteOption = async (record: PrintAttributeOptionResp) => {
  await deletePrintAttributeOption([record.id])
  Message.success('删除成功')
  loadOptionList()
}

// 初始化
onMounted(() => {
  loadAttrList()
})

// ========= 联动价格抽屉 =========
interface OtherOptionItem {
  id: string
  name: string
  attrName: string
  attrId: string
}

const comboDrawerVisible = ref(false)
const comboOptionId = ref('')
const comboOptionName = ref('')
const comboPriceList = ref<ComboPriceResp[]>([])
const comboPriceLoading = ref(false)
const otherOptionList = ref<OtherOptionItem[]>([])

// 客户/部门数据
interface DictItem {
  label: string
  value: string
}
const comboCustomerDict = ref<DictItem[]>([])
const comboDeptTree = ref<Array<any>>([])

const loadComboCustomerAndDept = async () => {
  try {
    const { data } = await listFinCustomerDict()
    comboCustomerDict.value = (data || []).map((item: any) => ({ label: item.label, value: String(item.value) }))
  } catch { /* ignore */ }
  try {
    const { data } = await listDeptDictTree({ description: '' })
    comboDeptTree.value = data || []
  } catch { /* ignore */ }
}

const findInTree = (tree: any[], key: string): string => {
  for (const node of tree) {
    if (node.key === key) return node.title
    if (node.children) {
      const found = findInTree(node.children, key)
      if (found) return found
    }
  }
  return ''
}

const getComboDeptName = (id: string) => findInTree(comboDeptTree.value, id)
const getComboCustomerName = (id: string) => {
  const item = comboCustomerDict.value.find((c) => c.value === id)
  return item?.label || id
}

const loadComboPrices = async () => {
  if (!comboOptionId.value) return
  comboPriceLoading.value = true
  try {
    // 查询两个方向：1) 当前选项价格被覆盖  2) 当前选项触发覆盖其他选项
    const [optRes, comboRes] = await Promise.all([
      listComboPrices(comboOptionId.value), // optionId = 当前选项
      listComboPrices(undefined, comboOptionId.value), // comboOptionId = 当前选项
    ])
    const optList = optRes.data || []
    const comboList = comboRes.data || []
    // 合并去重
    const seen = new Set<string>()
    const merged = [...optList, ...comboList].filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
    comboPriceList.value = merged
  } finally {
    comboPriceLoading.value = false
  }
}

const loadOtherOptions = async () => {
  // 加载所有属性的选项（排除当前选项所在属性）
  const result: OtherOptionItem[] = []
  for (const attr of attrList.value) {
    if (attr.id === selectedAttrId.value) continue
    try {
      const { data } = await listPrintAttributeOption({
        attributeId: attr.id,
        sort: ['sort,asc'],
        page: 1,
        size: 999,
      })
      const opts = data?.list || []
      for (const opt of opts) {
        result.push({
          id: opt.id,
          name: opt.name,
          attrName: attr.name,
          attrId: attr.id,
        })
      }
    } catch {
      // ignore
    }
  }
  otherOptionList.value = result
}

const getComboOptionLabel = (optId: string) => {
  // 先从其他属性的选项中查找
  const found = otherOptionList.value.find((o) => o.id === optId)
  if (found) return `${found.attrName} / ${found.name}`
  // 再从当前属性的选项列表中查找
  const currentOpt = optionList.value.find((o) => o.id === optId)
  if (currentOpt) return `${selectedAttrName.value} / ${currentOpt.name}`
  return optId
}

const openComboDrawer = async (record: PrintAttributeOptionResp) => {
  comboOptionId.value = record.id
  comboOptionName.value = record.name
  comboDrawerVisible.value = true
  await Promise.all([loadOtherOptions(), loadComboCustomerAndDept()])
  loadComboPrices()
}

// ========= 联动价格编辑弹窗 =========
const comboFormVisible = ref(false)
const comboFormEditId = ref('')
const comboFormRef = ref()
const comboForm = reactive({
  direction: 'me-trigger' as 'override-me' | 'me-trigger',
  comboOptionId: '',
  targetOptionId: '',
  priceMode: 'MULTIPLIER',
  price: 0,
  customerId: null as string | null,
  deptId: null as string | null,
})

const resetComboForm = () => {
  comboFormRef.value?.resetFields()
  comboFormEditId.value = ''
  Object.assign(comboForm, { direction: 'me-trigger', comboOptionId: '', targetOptionId: '', priceMode: 'MULTIPLIER', price: 0, customerId: null, deptId: null })
}

const onAddComboPrice = () => {
  resetComboForm()
  comboFormVisible.value = true
}

const onEditComboPrice = (record: ComboPriceResp) => {
  resetComboForm()
  comboFormEditId.value = record.id
  // 判断方向：optionId === 当前选项 → 方向1(其他触发覆盖本选项)，否则 → 方向2(本选项触发覆盖其他)
  const isOverrideMe = record.optionId === comboOptionId.value
  Object.assign(comboForm, {
    direction: isOverrideMe ? 'override-me' : 'me-trigger',
    comboOptionId: isOverrideMe ? record.comboOptionId : '',
    targetOptionId: isOverrideMe ? '' : record.optionId,
    priceMode: record.priceMode,
    price: record.price,
    customerId: record.customerId,
    deptId: record.deptId,
  })
  comboFormVisible.value = true
}

const saveComboPrice = async () => {
  try {
    const err = await comboFormRef.value?.validate()
    if (err) return false
    const payload = {
      optionId: comboForm.direction === 'override-me' ? comboOptionId.value : comboForm.targetOptionId,
      comboOptionId: comboForm.direction === 'override-me' ? comboForm.comboOptionId : comboOptionId.value,
      priceMode: comboForm.priceMode,
      price: comboForm.price,
      customerId: comboForm.customerId || null,
      deptId: comboForm.deptId || null,
    }
    if (comboFormEditId.value) {
      await updateComboPrice(comboFormEditId.value, payload)
      Message.success('修改成功')
    } else {
      await addComboPrice(payload)
      Message.success('新增成功')
    }
    loadComboPrices()
    return true
  } catch {
    return false
  }
}

const onDeleteComboPrice = async (record: ComboPriceResp) => {
  await deleteComboPrice(record.id)
  Message.success('删除成功')
  loadComboPrices()
}
</script>

<style scoped lang="scss">
:deep(.row-selected) {
  td {
    background-color: var(--color-primary-light-1) !important;
  }
}
</style>
