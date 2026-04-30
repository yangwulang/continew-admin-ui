<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 500 ? 500 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <a-form ref="formRef" :model="form" :rules="rules" auto-label-width size="large">
      <a-form-item field="sourceCode" label="数据源编码">
        <a-input v-model="form.sourceCode" placeholder="请输入数据源编码" />
      </a-form-item>
      <a-form-item field="sourceName" label="数据源名称">
        <a-input v-model="form.sourceName" placeholder="请输入数据源名称" />
      </a-form-item>
      <a-form-item field="sourceType" label="数据源类型">
        <a-select v-model="form.sourceType" placeholder="请选择数据源类型">
          <a-option :value="1">CMS API</a-option>
          <a-option :value="2">HTTP JSON</a-option>
          <a-option :value="3">网页抓取</a-option>
        </a-select>
      </a-form-item>
      <a-form-item field="apiUrl" label="API地址">
        <a-input v-model="form.apiUrl" placeholder="请输入API地址" />
      </a-form-item>
      <a-form-item field="apiKey" label="API Key">
        <a-input v-model="form.apiKey" placeholder="请输入API Key" />
      </a-form-item>
      <a-form-item field="configJson" label="配置JSON">
        <a-textarea
          v-model="form.configJson"
          placeholder="请输入配置JSON"
          :auto-size="{ minRows: 3, maxRows: 6 }"
        />
      </a-form-item>
      <a-form-item label="排序" field="sort">
        <a-input-number v-model="form.sort" placeholder="请输入排序" :min="1" mode="button" />
      </a-form-item>
      <a-form-item field="status" label="状态">
        <a-switch
          v-model="form.status" type="round" :checked-value="1" :unchecked-value="2" checked-text="启用"
          unchecked-text="禁用"
        />
      </a-form-item>
      <a-form-item field="remark" label="备注">
        <a-textarea
          v-model="form.remark"
          placeholder="请输入备注"
          :auto-size="{ minRows: 2, maxRows: 4 }"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addSpSource, getSpSource, updateSpSource } from '@/apis/spide/sp-source'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()
const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改数据源' : '新增数据源'))
const formRef = ref<FormInstance>()
const rules: FormInstance['rules'] = {
  sourceCode: [{ required: true, message: '请输入数据源编码' }],
  sourceName: [{ required: true, message: '请输入数据源名称' }],
  sourceType: [{ required: true, message: '请选择数据源类型' }],
  status: [{ required: true, message: '请选择状态' }],
}

const [form, resetForm] = useResetReactive({
  sourceCode: '',
  sourceName: '',
  sourceType: 1,
  apiUrl: '',
  apiKey: '',
  configJson: '',
  sort: 999,
  status: 1,
  remark: '',
})

// 重置
const reset = () => {
  formRef.value?.resetFields()
  resetForm()
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateSpSource(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addSpSource(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 新增
const onAdd = () => {
  reset()
  dataId.value = ''
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  const { data } = await getSpSource(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style lang="scss" scoped></style>
