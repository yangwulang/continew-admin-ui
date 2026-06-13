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
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addFinSupplier, getFinSupplier, updateFinSupplier } from '@/apis/finance/fin-supplier'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改供应商' : '新增供应商'))
const formRef = ref<InstanceType<typeof GiForm>>()

const [form, resetForm] = useResetReactive({
  name: undefined,
  contact: undefined,
  phone: undefined,
  address: undefined,
  status: 1,
  remark: undefined,
})

const columns: ColumnItem[] = reactive([
  {
    label: '供应商名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
    props: {
      maxLength: 100,
      placeholder: '请输入供应商名称',
    },
  },
  {
    label: '联系人',
    field: 'contact',
    type: 'input',
    span: 12,
    props: {
      maxLength: 50,
      placeholder: '请输入联系人',
    },
  },
  {
    label: '联系电话',
    field: 'phone',
    type: 'input',
    span: 12,
    props: {
      maxLength: 30,
      placeholder: '请输入联系电话',
    },
  },
  {
    label: '地址',
    field: 'address',
    type: 'input',
    span: 24,
    props: {
      maxLength: 300,
      placeholder: '请输入地址',
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

const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
}

const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateFinSupplier(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addFinSupplier(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

const onAdd = async () => {
  reset()
  dataId.value = ''
  visible.value = true
}

const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  const { data } = await getFinSupplier(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
