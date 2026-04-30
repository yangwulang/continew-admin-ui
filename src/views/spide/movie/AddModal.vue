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
      <a-form-item field="sourceId" label="数据源">
        <a-select v-model="form.sourceId" placeholder="请选择数据源">
          <a-option v-for="item in sourceDict" :key="item.value" :value="item.value" :label="item.label" />
        </a-select>
      </a-form-item>
      <a-form-item field="movieName" label="影片名称">
        <a-input v-model="form.movieName" placeholder="请输入影片名称" />
      </a-form-item>
      <a-form-item field="movieSubname" label="影片副标">
        <a-input v-model="form.movieSubname" placeholder="请输入影片副标题" />
      </a-form-item>
      <a-form-item field="categoryId" label="分类">
        <a-select v-model="form.categoryId" placeholder="请选择分类" allow-clear>
          <a-option v-for="item in categoryDict" :key="item.value" :value="item.value" :label="item.label" />
        </a-select>
      </a-form-item>
      <a-form-item field="coverUrl" label="封面地址">
        <a-input v-model="form.coverUrl" placeholder="请输入封面地址" />
      </a-form-item>
      <a-form-item field="director" label="导演">
        <a-input v-model="form.director" placeholder="请输入导演" />
      </a-form-item>
      <a-form-item field="actors" label="演员">
        <a-input v-model="form.actors" placeholder="请输入演员，多个用逗号分隔" />
      </a-form-item>
      <a-form-item field="area" label="地区">
        <a-input v-model="form.area" placeholder="请输入地区" />
      </a-form-item>
      <a-form-item field="year" label="年份">
        <a-input-number v-model="form.year" placeholder="请输入年份" :min="1900" :max="2100" />
      </a-form-item>
      <a-form-item field="language" label="语言">
        <a-input v-model="form.language" placeholder="请输入语言" />
      </a-form-item>
      <a-form-item field="score" label="评分">
        <a-input-number v-model="form.score" placeholder="请输入评分" :min="0" :max="10" :precision="1" />
      </a-form-item>
      <a-form-item field="description" label="简介">
        <a-textarea
          v-model="form.description"
          placeholder="请输入影片简介"
          :auto-size="{ minRows: 3, maxRows: 6 }"
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
import { addSpMovie, getSpMovie, updateSpMovie } from '@/apis/spide/sp-movie'
import { listSpSourceDict } from '@/apis/spide/sp-source'
import { listSpCategoryDict } from '@/apis/spide/sp-category'
import type { LabelValueState } from '@/types/global'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()
const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改影片' : '新增影片'))
const formRef = ref<FormInstance>()
const rules: FormInstance['rules'] = {
  movieName: [{ required: true, message: '请输入影片名称' }],
  sourceId: [{ required: true, message: '请选择数据源' }],
}

const sourceDict = ref<LabelValueState[]>([])
const categoryDict = ref<LabelValueState[]>([])

const loadDict = async () => {
  const [sourceRes, categoryRes] = await Promise.all([listSpSourceDict(), listSpCategoryDict()])
  sourceDict.value = sourceRes.data
  categoryDict.value = categoryRes.data
}

const [form, resetForm] = useResetReactive({
  sourceId: '',
  movieName: '',
  movieSubname: '',
  categoryId: '',
  coverUrl: '',
  director: '',
  actors: '',
  area: '',
  year: undefined as number | undefined,
  language: '',
  score: undefined as number | undefined,
  description: '',
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
      await updateSpMovie(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addSpMovie(form)
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
  const { data } = await getSpMovie(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style lang="scss" scoped></style>
