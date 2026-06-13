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
      <a-form-item field="sourceName" label="数据源名称">
        <a-input v-model="form.sourceName" placeholder="请输入数据源名称" />
      </a-form-item>
      <a-form-item field="sourceUrl" label="数据源URL">
        <a-input v-model="form.sourceUrl" placeholder="请输入数据源URL（如 https://www.example.com）" />
      </a-form-item>
      <a-form-item field="sourceType" label="数据源类型">
        <a-select v-model="form.sourceType" placeholder="请选择数据源类型">
          <a-option value="BIQUGE">笔趣阁类</a-option>
          <a-option value="GENERIC">通用（CSS选择器）</a-option>
        </a-select>
      </a-form-item>
      <a-form-item field="configJson" label="采集规则JSON">
        <a-textarea
          v-model="form.configJson"
          placeholder="请输入采集规则JSON配置"
          :auto-size="{ minRows: 4, maxRows: 8 }"
        />
      </a-form-item>
      <a-form-item field="status" label="状态">
        <a-switch
          v-model="form.status" type="round" :checked-value="1" :unchecked-value="2" checked-text="启用"
          unchecked-text="禁用"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addNovelSource, getNovelSource, updateNovelSource } from '@/apis/novel/novel-source'
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
  sourceName: [{ required: true, message: '请输入数据源名称' }],
  sourceUrl: [{ required: true, message: '请输入数据源URL' }],
  sourceType: [{ required: true, message: '请选择数据源类型' }],
}

const [form, resetForm] = useResetReactive({
  sourceName: '',
  sourceUrl: '',
  sourceType: 'GENERIC',
  configJson: '',
  status: 1,
})

const reset = () => {
  formRef.value?.resetFields()
  resetForm()
}

const save = async () => {
  try {
    const isInvalid = await formRef.value?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateNovelSource(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addNovelSource(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

const onAdd = () => {
  reset()
  dataId.value = ''
  visible.value = true
}

const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  const { data } = await getNovelSource(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style lang="scss" scoped></style>
