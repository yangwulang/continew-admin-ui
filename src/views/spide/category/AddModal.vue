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
      <a-form-item field="sourceId" label="数据源">
        <a-select v-model="form.sourceId" placeholder="请选择数据源">
          <a-option v-for="item in sourceDict" :key="item.value" :value="item.value" :label="item.label" />
        </a-select>
      </a-form-item>
      <a-form-item field="categoryCode" label="分类编码">
        <a-input v-model="form.categoryCode" placeholder="请输入分类编码" />
      </a-form-item>
      <a-form-item field="categoryName" label="分类名称">
        <a-input v-model="form.categoryName" placeholder="请输入分类名称" />
      </a-form-item>
      <a-form-item field="parentId" label="父级分类">
        <a-input v-model="form.parentId" placeholder="请输入父级分类ID（可为空）" />
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
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addSpCategory, getSpCategory, updateSpCategory } from '@/apis/spide/sp-category'
import { listSpSourceDict } from '@/apis/spide/sp-source'
import type { LabelValueState } from '@/types/global'
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
  categoryCode: [{ required: true, message: '请输入分类编码' }],
  categoryName: [{ required: true, message: '请输入分类名称' }],
  sourceId: [{ required: true, message: '请选择数据源' }],
}

const sourceDict = ref<LabelValueState[]>([])
const loadDict = async () => {
  const { data } = await listSpSourceDict()
  sourceDict.value = data
}

const [form, resetForm] = useResetReactive({
  sourceId: '',
  categoryCode: '',
  categoryName: '',
  parentId: '',
  sort: 999,
  status: 1,
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
      await updateSpCategory(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addSpCategory(form)
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
  await loadDict()
  dataId.value = ''
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  await loadDict()
  dataId.value = id
  const { data } = await getSpCategory(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style lang="scss" scoped></style>
