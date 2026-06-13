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
      <a-form-item field="categoryName" label="分类名称">
        <a-input v-model="form.categoryName" placeholder="请输入分类名称" />
      </a-form-item>
      <a-form-item field="sort" label="排序">
        <a-input-number v-model="form.sort" placeholder="请输入排序" :min="1" mode="button" />
      </a-form-item>
      <a-form-item field="status" label="状态">
        <a-switch
          v-model="form.status" type="round" :checked-value="1" :unchecked-value="2" checked-text="启用"
          unchecked-text="禁用"
        />
      </a-form-item>
      <a-form-item field="description" label="描述">
        <a-textarea v-model="form.description" placeholder="请输入描述" :auto-size="{ minRows: 2, maxRows: 4 }" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addNovelCategory, getNovelCategory, updateNovelCategory } from '@/apis/novel/novel-category'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()
const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改分类' : '新增分类'))
const formRef = ref<FormInstance>()

const rules: FormInstance['rules'] = {
  categoryName: [{ required: true, message: '请输入分类名称' }],
}

const [form, resetForm] = useResetReactive({
  categoryName: '',
  sort: 999,
  status: 1,
  description: '',
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
      await updateNovelCategory(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addNovelCategory(form)
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
  const { data } = await getNovelCategory(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style lang="scss" scoped></style>
