<template>
  <a-modal v-model:visible="visible" :title="title" :mask-closable="false" :width="600" draggable @before-ok="save" @close="reset">
    <GiForm ref="formRef" v-model="form" :columns="columns" />
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { addFinDeptOptionPrice, getFinDeptOptionPrice, updateFinDeptOptionPrice } from '@/apis/finance/fin-dept-option-price'
import { listPrintAttributeOption } from '@/apis/finance/print-attribute-option'
import { useDept } from '@/hooks/app'
import type { LabelValueState } from '@/types/global'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{ (e: 'save-success'): void }>()
const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改部门选项价格' : '新增部门选项价格'))
const formRef = ref<InstanceType<typeof GiForm>>()

// 加载部门树
const { deptList, getDeptList } = useDept()

// 加载所有选项（不分属性）
const optionDict = ref<LabelValueState[]>([])
const loadOptionDict = async () => {
  const { data } = await listPrintAttributeOption({ sort: ['sort,asc'], page: 1, size: 999 })
  optionDict.value = (data?.list || []).map((o: any) => ({ value: o.id, label: o.name }))
}

const [form, resetForm] = useResetReactive({ deptId: undefined, optionId: undefined, priceMode: 'PER_PAGE', price: 0, effectiveFrom: undefined, effectiveTo: undefined })

const columns: ColumnItem[] = reactive([
  { label: '部门', field: 'deptId', type: 'tree-select', span: 24, required: true, props: { data: deptList, allowSearch: true, allowClear: true, placeholder: '请选择部门', fieldNames: { key: 'key', title: 'title', children: 'children' } } },
  { label: '打印选项', field: 'optionId', type: 'select', span: 24, required: true, props: { options: optionDict, allowSearch: true, allowClear: true, placeholder: '请选择打印选项' } },
  { label: '计价方式', field: 'priceMode', type: 'select', span: 12, required: true, props: { options: [{ value: 'PER_PAGE', label: '按页计价' }, { value: 'FIXED', label: '固定费用' }, { value: 'MULTIPLIER', label: '乘数系数' }] } },
  { label: '价格值', field: 'price', type: 'input-number', span: 12, required: true, props: { min: 0, precision: 4, placeholder: '专属价格值', hideButton: true } },
  { label: '生效时间', field: 'effectiveFrom', type: 'date-picker', span: 12, required: true, props: { showTime: true, format: 'YYYY-MM-DD HH:mm:ss', placeholder: '生效时间', style: 'width: 100%' } },
  { label: '失效时间', field: 'effectiveTo', type: 'date-picker', span: 12, props: { showTime: true, format: 'YYYY-MM-DD HH:mm:ss', placeholder: '不填则长期有效', style: 'width: 100%' } },
])

const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
}

const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateFinDeptOptionPrice(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addFinDeptOptionPrice(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch {
    return false
  }
}

const onAdd = async () => {
  reset()
  dataId.value = ''
  await Promise.all([getDeptList(), loadOptionDict()])
  visible.value = true
}
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  await Promise.all([getDeptList(), loadOptionDict()])
  const { data } = await getFinDeptOptionPrice(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
