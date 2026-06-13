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
    <a-form ref="formRef" :model="form" :rules="rules" auto-label-width size="large">
      <a-form-item field="bookName" label="书名">
        <a-input v-model="form.bookName" placeholder="请输入书名" />
      </a-form-item>
      <a-form-item field="author" label="作者">
        <a-input v-model="form.author" placeholder="请输入作者" />
      </a-form-item>
      <a-form-item field="categoryIds" label="分类">
        <a-select
          v-model="form.categoryIds"
          :options="categoryOptions"
          placeholder="请选择分类"
          multiple
          allow-clear
        />
      </a-form-item>
      <a-form-item field="coverUrl" label="封面URL">
        <a-input v-model="form.coverUrl" placeholder="请输入封面图片URL" />
      </a-form-item>
      <a-form-item field="description" label="简介">
        <a-textarea v-model="form.description" placeholder="请输入简介" :auto-size="{ minRows: 3, maxRows: 6 }" />
      </a-form-item>
      <a-form-item field="sourceType" label="来源类型">
        <a-select v-model="form.sourceType" placeholder="请选择来源类型">
          <a-option :value="1">用户上传</a-option>
          <a-option :value="2">管理员上传</a-option>
          <a-option :value="3">爬取</a-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addNovelInfo, getNovelInfo, updateNovelInfo } from '@/apis/novel/novel-info'
import { listNovelCategoryDict } from '@/apis/novel/novel-category'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()
const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改小说' : '新增小说'))
const formRef = ref<FormInstance>()
const categoryOptions = ref<any[]>([])

const rules: FormInstance['rules'] = {
  bookName: [{ required: true, message: '请输入书名' }],
  sourceType: [{ required: true, message: '请选择来源类型' }],
}

const [form, resetForm] = useResetReactive({
  bookName: '',
  author: '',
  coverUrl: '',
  description: '',
  sourceType: 2,
  status: 1,
  categoryIds: [] as string[],
})

const loadCategoryOptions = async () => {
  const { data } = await listNovelCategoryDict()
  categoryOptions.value = (data || []).map((item: any) => ({ label: item.label, value: item.value }))
}

const reset = () => {
  formRef.value?.resetFields()
  resetForm()
}

const save = async () => {
  try {
    const isInvalid = await formRef.value?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateNovelInfo(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addNovelInfo(form)
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
  loadCategoryOptions()
  visible.value = true
}

const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  await loadCategoryOptions()
  const { data } = await getNovelInfo(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style lang="scss" scoped></style>
