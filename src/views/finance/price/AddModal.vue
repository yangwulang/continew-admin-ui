<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :width="width >= 600 ? 600 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <GiForm ref="formRef" v-model="form" :columns="columns" />
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import {
  addFinCustomerMaterialPrice,
  getFinCustomerMaterialPrice,
  updateFinCustomerMaterialPrice,
} from '@/apis/finance/fin-customer-material-price'
import { listFinCustomerDict } from '@/apis/finance/fin-customer'
import { listFinMaterialDict } from '@/apis/finance/fin-material'
import type { LabelValueState } from '@/types/global'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改客户物料价格' : '新增客户物料价格'))
const formRef = ref<InstanceType<typeof GiForm>>()

// 加载客户字典
const customerDict = ref<LabelValueState[]>([])
const loadCustomerDict = async () => {
  const { data } = await listFinCustomerDict()
  customerDict.value = data || []
}

// 加载物料字典
const materialDict = ref<LabelValueState[]>([])
const loadMaterialDict = async () => {
  const { data } = await listFinMaterialDict()
  materialDict.value = data || []
}

const [form, resetForm] = useResetReactive({
  customerId: undefined,
  materialId: undefined,
  unitPrice: undefined,
  effectiveFrom: undefined,
  effectiveTo: undefined,
})

const columns: ColumnItem[] = reactive([
  {
    label: '客户',
    field: 'customerId',
    type: 'select',
    span: 24,
    required: true,
    props: {
      options: customerDict,
      allowSearch: true,
      allowClear: true,
      placeholder: '请选择客户',
    },
  },
  {
    label: '物料',
    field: 'materialId',
    type: 'select',
    span: 24,
    required: true,
    props: {
      options: materialDict,
      allowSearch: true,
      allowClear: true,
      placeholder: '请选择物料',
    },
  },
  {
    label: '专属单价',
    field: 'unitPrice',
    type: 'input-number',
    span: 24,
    required: true,
    props: {
      min: 0,
      precision: 2,
      placeholder: '请输入专属单价',
      hideButton: true,
    },
  },
  {
    label: '生效时间',
    field: 'effectiveFrom',
    type: 'date-picker',
    span: 12,
    required: true,
    props: {
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
      placeholder: '生效时间',
      style: 'width: 100%',
    },
  },
  {
    label: '失效时间',
    field: 'effectiveTo',
    type: 'date-picker',
    span: 12,
    props: {
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
      placeholder: '不填则长期有效',
      style: 'width: 100%',
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
      await updateFinCustomerMaterialPrice(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addFinCustomerMaterialPrice(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch {
    return false
  }
}

// 新增
const onAdd = async () => {
  reset()
  dataId.value = ''
  await Promise.all([loadCustomerDict(), loadMaterialDict()])
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  await Promise.all([loadCustomerDict(), loadMaterialDict()])
  const { data } = await getFinCustomerMaterialPrice(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
