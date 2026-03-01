<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 600 ? 600 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <GiForm ref="formRef" v-model="form" :columns="columns" />
  </a-modal>
</template>

<script setup lang="ts">
import type { TreeNodeData } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { getFinMaterial, addFinMaterial, updateFinMaterial } from '@/apis/finance/fin-material'
import { type FinMaterialCategoryResp, listFinMaterialCategory } from '@/apis/finance/fin-material-category'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改物料' : '新增物料'))
const formRef = ref<InstanceType<typeof GiForm>>()

const categoryOptions = ref<TreeNodeData[]>([])
const loadCategories = async () => {
  try {
    const { data } = await listFinMaterialCategory({ sort: ['sort,asc'] })
    categoryOptions.value = buildTreeData(data || [])
  } catch {
    categoryOptions.value = []
  }
}

// 构建树形选择器数据
const buildTreeData = (list: FinMaterialCategoryResp[]): TreeNodeData[] => {
  return list.map(item => ({
    key: item.id,
    value: item.id,
    title: item.name,
    children: item.children ? buildTreeData(item.children) : undefined,
  }))
}

const [form, resetForm] = useResetReactive({
  categoryId: undefined,
  name: undefined,
  code: undefined,
  defaultUnitPrice: undefined,
  unit: undefined,
  status: 1,
  remark: undefined,
})

const columns: ColumnItem[] = reactive([
  {
    label: '物料分类',
    field: 'categoryId',
    type: 'tree-select',
    span: 24,
    required: true,
    props: {
      data: categoryOptions,
      allowSearch: true,
      allowClear: true,
      placeholder: '请选择物料分类',
    },
  },
  {
    label: '物料名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
    props: {
      maxLength: 100,
      placeholder: '请输入物料名称',
    },
  },
  {
    label: '物料编码',
    field: 'code',
    type: 'input',
    span: 24,
    props: {
      maxLength: 50,
      placeholder: '请输入物料编码',
    },
  },
  {
    label: '默认单价',
    field: 'defaultUnitPrice',
    type: 'input-number',
    span: 12,
    required: true,
    props: {
      min: 0,
      precision: 2,
      placeholder: '单价',
      hideButton: true,
    },
  },
  {
    label: '计量单位',
    field: 'unit',
    type: 'input',
    span: 12,
    props: {
      maxLength: 20,
      placeholder: '如：个、箱、kg',
    },
  },
  {
    label: '状态',
    field: 'status',
    type: 'switch',
    span: 24,
    props: {
      type: 'round',
      checkedValue: 1,
      uncheckedValue: 2,
      checkedText: '启用',
      uncheckedText: '禁用',
    },
  },
  {
    label: '备注',
    field: 'remark',
    type: 'textarea',
    span: 24,
    props: {
      autoSize: true,
      placeholder: '请输入备注',
    },
  },
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateFinMaterial(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addFinMaterial(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 新增
const onAdd = async () => {
  reset()
  dataId.value = ''
  await loadCategories()
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  await loadCategories()
  const { data } = await getFinMaterial(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
