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
              <a-table-column title="操作" :width="100" align="center">
                <template #cell="{ record }">
                  <a-space>
                    <a-link v-permission="['finance:fin-print-attribute-option:update']" @click="onEditOption(record)">编辑</a-link>
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
</script>

<style scoped lang="scss">
:deep(.row-selected) {
  td {
    background-color: var(--color-primary-light-1) !important;
  }
}
</style>
