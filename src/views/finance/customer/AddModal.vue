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
import { type FinCustomerCreateReq, addFinCustomer, getFinCustomer, updateFinCustomer } from '@/apis/finance/fin-customer'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import type { LabelValueState } from '@/types/global'
import http from '@/utils/http'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改客户' : '新增客户'))
const formRef = ref<InstanceType<typeof GiForm>>()

// 用户选项列表
const userOptions = ref<LabelValueState[]>([])
const loadUsers = async () => {
  try {
    // 调用用户字典接口获取所有用户
    const { data } = await http.get<LabelValueState[]>('/system/user/dict')
    userOptions.value = data || []
  } catch {
    userOptions.value = []
  }
}

const [form, resetForm] = useResetReactive<FinCustomerCreateReq>({
  userId: undefined as any,
  enablePrepaid: false,
  allowNegativeBalance: false,
  remark: undefined,
})

const columns: ColumnItem[] = reactive([
  {
    label: '选择用户',
    field: 'userId',
    type: 'select',
    span: 24,
    required: true,
    props: {
      options: userOptions,
      allowSearch: true,
      placeholder: '请选择用户',
      disabled: isUpdate.value, // 修改时不允许更改用户
    },
  },
  {
    label: '预充值记账',
    field: 'enablePrepaid',
    type: 'switch',
    span: 12,
    props: {
      type: 'round',
      checkedText: '启用',
      uncheckedText: '禁用',
    },
  },
  {
    label: '允许负余额',
    field: 'allowNegativeBalance',
    type: 'switch',
    span: 12,
    props: {
      type: 'round',
      checkedText: '允许',
      uncheckedText: '不允许',
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
      await updateFinCustomer(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addFinCustomer(form)
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
  await loadUsers()
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  await loadUsers()
  const { data } = await getFinCustomer(id)
  form.userId = data.userId
  form.enablePrepaid = data.enablePrepaid
  form.allowNegativeBalance = data.allowNegativeBalance
  form.remark = data.remark
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
