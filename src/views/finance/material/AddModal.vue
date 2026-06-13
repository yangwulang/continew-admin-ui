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
    <GiForm ref="formRef" v-model="form" :columns="columns">
      <template #imageUrl="{ disabled }">
        <div class="photo-uploader">
          <div class="photo-grid">
            <!-- 已上传图片列表 -->
            <div
              v-for="(url, idx) in imageUrlList"
              :key="idx"
              class="photo-preview"
            >
              <a-image
                :src="url"
                width="100"
                height="100"
                fit="cover"
                :preview-visible="previewIndex === idx"
                @preview-visible-change="(val: boolean) => previewIndex = val ? idx : -1"
              />
              <div class="photo-overlay">
                <a-space>
                  <a-tooltip content="查看大图">
                    <a-button type="primary" size="mini" shape="circle" @click="previewIndex = idx">
                      <template #icon><icon-eye /></template>
                    </a-button>
                  </a-tooltip>
                  <a-tooltip content="删除">
                    <a-button type="primary" status="danger" size="mini" shape="circle" @click="removePhoto(idx)">
                      <template #icon><icon-delete /></template>
                    </a-button>
                  </a-tooltip>
                </a-space>
              </div>
            </div>

            <!-- 上传按钮 -->
            <a-upload
              v-if="imageUrlList.length < 9"
              :show-file-list="false"
              accept="image/*"
              :disabled="disabled"
              :custom-request="handleImageUpload"
            >
              <template #upload-button>
                <div class="photo-empty">
                  <div class="photo-empty-inner">
                    <icon-camera class="photo-icon" />
                    <span class="photo-text">上传照片</span>
                    <span class="photo-hint">{{ imageUrlList.length }}/9</span>
                  </div>
                </div>
              </template>
            </a-upload>
          </div>
        </div>
      </template>
    </GiForm>
  </a-modal>
</template>

<script setup lang="ts">
import type { FileItem, TreeNodeData } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addFinMaterial, getFinMaterial, updateFinMaterial } from '@/apis/finance/fin-material'
import { type FinMaterialCategoryResp, listFinMaterialCategory } from '@/apis/finance/fin-material-category'
import { uploadFile } from '@/apis/system/file'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改物料' : '新增物料'))
const formRef = ref<InstanceType<typeof GiForm>>()
const previewIndex = ref(-1)
const imageUrlList = ref<string[]>([])

// 构建树形选择器数据
const buildTreeData = (list: FinMaterialCategoryResp[]): TreeNodeData[] => {
  return list.map((item: FinMaterialCategoryResp) => ({
    key: item.id,
    value: item.id,
    title: item.name,
    children: item.children ? buildTreeData(item.children) : undefined,
  }))
}

const categoryOptions = ref<TreeNodeData[]>([])
const loadCategories = async () => {
  try {
    const { data } = await listFinMaterialCategory({ sort: ['sort,asc'] })
    categoryOptions.value = buildTreeData(data || [])
  } catch {
    categoryOptions.value = []
  }
}

const [form, resetForm] = useResetReactive({
  categoryId: undefined,
  name: undefined,
  code: undefined,
  imageUrl: undefined,
  defaultUnitPrice: undefined,
  unit: undefined,
  status: 1,
  remark: undefined,
})

const columns: ColumnItem[] = reactive([
  {
    label: '物料分类',
    field: 'categoryId',
    type: 'tree-select',
    span: 24,
    required: true,
    props: {
      data: categoryOptions,
      allowSearch: true,
      allowClear: true,
      placeholder: '请选择物料分类',
    },
  },
  {
    label: '物料名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
    props: {
      maxLength: 100,
      placeholder: '请输入物料名称',
    },
  },
  {
    label: '物料编码',
    field: 'code',
    type: 'input',
    span: 24,
    props: {
      maxLength: 50,
      placeholder: '请输入物料编码',
    },
  },
  {
    label: '物料照片',
    field: 'imageUrl',
    type: 'input',
    span: 24,
    hide: false,
  },
  {
    label: '默认单价',
    field: 'defaultUnitPrice',
    type: 'input-number',
    span: 12,
    required: true,
    props: {
      min: 0,
      precision: 2,
      placeholder: '单价',
      hideButton: true,
    },
  },
  {
    label: '计量单位',
    field: 'unit',
    type: 'input',
    span: 12,
    props: {
      maxLength: 20,
      placeholder: '如：个、箱、kg',
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

const handleImageUpload = (options: any) => {
  const { onProgress, onError, onSuccess, fileItem } = options
  onProgress(20)
  const formData = new FormData()
  formData.append('file', fileItem.file as Blob)
  uploadFile(formData)
    .then((res: any) => {
      const url = res.data?.url || res.data
      imageUrlList.value.push(url)
      form.imageUrl = imageUrlList.value.join(',')
      onSuccess(res)
      Message.success('上传成功')
    })
    .catch((err: any) => {
      onError(err)
      Message.error('上传失败')
    })
  return { abort() {} }
}

const removePhoto = (idx: number) => {
  imageUrlList.value.splice(idx, 1)
  form.imageUrl = imageUrlList.value.length > 0 ? imageUrlList.value.join(',') : undefined
  if (previewIndex.value === idx) previewIndex.value = -1
}

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  imageUrlList.value = []
  previewIndex.value = -1
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateFinMaterial(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addFinMaterial(form)
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
  await loadCategories()
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  await loadCategories()
  const { data } = await getFinMaterial(id)
  Object.assign(form, data)
  if (data?.imageUrl) {
    imageUrlList.value = data.imageUrl.split(',').filter((s: string) => s.trim())
  }
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss">
.photo-uploader {
  display: block;
}

.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.photo-empty {
  width: 100px;
  height: 100px;
  border: 2px dashed var(--color-neutral-4);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background-color: var(--color-fill-1);

  &:hover {
    border-color: rgb(var(--arcoblue-6));
    background-color: var(--color-fill-2);
  }
}

.photo-empty-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.photo-icon {
  font-size: 22px;
  color: var(--color-text-3);
}

.photo-text {
  font-size: 12px;
  color: var(--color-text-2);
  font-weight: 500;
}

.photo-hint {
  font-size: 11px;
  color: var(--color-text-4);
}

.photo-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;

  :deep(.arco-image) {
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.arco-image-img) {
    width: 100px;
    height: 100px;
    object-fit: cover;
    display: block;
  }
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  border-radius: 8px;
}

.photo-preview:hover .photo-overlay {
  opacity: 1;
}
</style>
