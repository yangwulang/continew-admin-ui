<template>
  <a-modal
    v-model:visible="visible"
    title="上传小说TXT"
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
      <a-form-item field="file" label="TXT文件">
        <a-upload
          v-model:file-list="uploadFileList"
          :auto-upload="false"
          :limit="1"
          accept=".txt"
          @change="onFileChange"
        >
          <template #upload-button>
            <a-button type="primary">
              <template #icon><icon-upload /></template>
              选择TXT文件
            </a-button>
          </template>
        </a-upload>
      </a-form-item>
    </a-form>
    <a-alert v-if="parseResult.length > 0" type="success" style="margin-top: 12px">
      解析成功，共识别到 {{ parseResult.length }} 个章节
    </a-alert>
  </a-modal>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { uploadNovelTxt } from '@/apis/novel/novel-info'
import { listNovelCategoryDict } from '@/apis/novel/novel-category'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()
const { width } = useWindowSize()

const visible = ref(false)
const formRef = ref<FormInstance>()
const categoryOptions = ref<any[]>([])
const fileList = ref<File[]>([])
const uploadFileList = ref<any[]>([])
const parseResult = ref<any[]>([])

const rules: FormInstance['rules'] = {
  bookName: [{ required: true, message: '请输入书名' }],
}

const [form, resetForm] = useResetReactive({
  bookName: '',
  author: '',
  categoryIds: [] as string[],
})

const loadCategoryOptions = async () => {
  const { data } = await listNovelCategoryDict()
  categoryOptions.value = (data || []).map((item: any) => ({ label: item.label, value: item.value }))
}

const onFileChange = (fileItem: any) => {
  if (fileItem && fileItem.length > 0) {
    fileList.value = [fileItem[0].file]
  } else {
    fileList.value = []
  }
}

const reset = () => {
  formRef.value?.resetFields()
  resetForm()
  fileList.value = []
  uploadFileList.value = []
  parseResult.value = []
}

const save = async () => {
  try {
    const isInvalid = await formRef.value?.validate()
    if (isInvalid) return false
    if (fileList.value.length === 0) {
      Message.warning('请选择TXT文件')
      return false
    }
    const formData = new FormData()
    formData.append('file', fileList.value[0])
    formData.append('bookName', form.bookName)
    formData.append('author', form.author || '')
    if (form.categoryIds.length > 0) {
      form.categoryIds.forEach((id) => formData.append('categoryIds', id))
    }
    const { data } = await uploadNovelTxt(formData)
    parseResult.value = data || []
    Message.success(`上传成功，解析出 ${parseResult.value.length} 个章节`)
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

const onOpen = () => {
  reset()
  loadCategoryOptions()
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style lang="scss" scoped></style>
