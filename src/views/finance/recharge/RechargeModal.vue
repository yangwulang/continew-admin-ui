<template>
  <a-modal
    v-model:visible="visible"
    title="客户充值"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 500 ? 500 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <a-form ref="formRef" :model="form" layout="vertical">
      <a-form-item field="customerId" label="选择客户" :rules="[{ required: true, message: '请选择客户' }]">
        <a-select
          v-model="form.customerId"
          placeholder="请选择客户"
          allow-search
          allow-clear
          :loading="customerLoading"
          @search="onCustomerSearch"
        >
          <a-option v-for="c in customerList" :key="c.id" :value="c.id" :label="c.username" />
        </a-select>
      </a-form-item>
      <a-form-item field="amount" label="充值金额" :rules="[{ required: true, message: '请输入充值金额' }]">
        <a-input-number v-model="form.amount" :min="0.01" :precision="2" placeholder="请输入充值金额" style="width: 100%" hide-button>
          <template #suffix>元</template>
        </a-input-number>
      </a-form-item>
      <a-form-item field="channel" label="充值渠道">
        <a-select v-model="form.channel" placeholder="请选择充值渠道" allow-clear>
          <a-option value="CASH">现金</a-option>
          <a-option value="BANK">银行转账</a-option>
          <a-option value="WECHAT">微信</a-option>
          <a-option value="ALIPAY">支付宝</a-option>
          <a-option value="OTHER">其他</a-option>
        </a-select>
      </a-form-item>
      <a-form-item field="remark" label="备注">
        <a-textarea v-model="form.remark" placeholder="请输入备注（可选）" :auto-size="{ minRows: 2, maxRows: 4 }" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { rechargeFinAccount } from '@/apis/finance/fin-account-transaction'
import { type FinCustomerResp, listFinCustomer } from '@/apis/finance/fin-customer'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()
const visible = ref(false)
const formRef = ref()

const form = reactive({
  customerId: undefined as string | undefined,
  amount: undefined as number | undefined,
  channel: undefined as string | undefined,
  remark: '',
})

// ===== 客户列表 =====
const customerList = ref<FinCustomerResp[]>([])
const customerLoading = ref(false)
const loadCustomers = async (keyword?: string) => {
  customerLoading.value = true
  try {
    const { data } = await listFinCustomer({ username: keyword, sort: ['id,desc'], page: 1, size: 50 })
    customerList.value = data.list || []
  } finally {
    customerLoading.value = false
  }
}
const onCustomerSearch = (keyword: string) => {
  loadCustomers(keyword)
}

// 重置
const reset = () => {
  formRef.value?.resetFields()
  form.customerId = undefined
  form.amount = undefined
  form.channel = undefined
  form.remark = ''
}

// 保存
const save = async () => {
  try {
    const err = await formRef.value?.validate()
    if (err) return false
    await rechargeFinAccount({
      customerId: form.customerId!,
      amount: form.amount!,
      channel: form.channel,
      remark: form.remark || undefined,
    })
    Message.success('充值成功')
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 打开
const onOpen = async () => {
  reset()
  visible.value = true
  await loadCustomers()
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
