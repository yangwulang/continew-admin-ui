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
    <GiForm ref="formRef" v-model="form" :columns="columns" />
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { type RegionResp, addRegion, getRegion, listRegionChildren, updateRegion } from '@/apis/system/region'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改区域' : '新增区域'))
const formRef = ref<InstanceType<typeof GiForm>>()

// 懒加载：初始加载省份，展开时加载子级
const regionTreeData = ref<any[]>([])

const loadRegionRoot = async () => {
  if (regionTreeData.value.length > 0) return
  const { data } = await listRegionChildren(0)
  regionTreeData.value = (data || []).map((item: RegionResp) => ({
    key: item.id,
    title: item.name,
    isLeaf: item.level === 3,
  }))
}

const loadRegionMore = async (selectNode: any, done: (children: any[]) => void) => {
  const { data } = await listRegionChildren(selectNode.key)
  done((data || []).map((item: RegionResp) => ({
    key: item.id,
    title: item.name,
    isLeaf: item.level === 3,
  })))
}

const [form, resetForm] = useResetReactive({
  sort: 999,
  status: 1,
  level: 1,
})

const columns: ColumnItem[] = reactive([
  {
    label: '上级区域',
    field: 'parentId',
    type: 'tree-select',
    span: 24,
    props: {
      data: regionTreeData,
      allowClear: true,
      allowSearch: true,
      fallbackOption: false,
      loadMore: loadRegionMore,
      filterTreeNode(searchKey: string, nodeData: Record<string, unknown>) {
        if (nodeData.title) {
          return String(nodeData.title).toLowerCase().includes(searchKey.toLowerCase())
        }
        return false
      },
    },
    rules: [{ required: true, message: '请选择上级区域' }],
    hide: (formVal: Record<string, unknown>) => {
      return formVal.parentId === 0 || (!formVal.parentId && isUpdate.value)
    },
  },
  {
    label: '区域名称',
    field: 'name',
    type: 'input',
    span: 24,
    props: {
      maxLength: 50,
    },
    rules: [{ required: true, message: '请输入区域名称' }],
  },
  {
    label: '行政区划代码',
    field: 'code',
    type: 'input',
    span: 24,
    props: {
      maxLength: 20,
    },
    rules: [{ required: true, message: '请输入行政区划代码' }],
  },
  {
    label: '层级',
    field: 'level',
    type: 'radio-group',
    span: 24,
    props: {
      options: [
        { label: '省', value: 1 },
        { label: '市', value: 2 },
        { label: '区/县', value: 3 },
      ],
    },
    rules: [{ required: true, message: '请选择层级' }],
  },
  {
    label: '排序',
    field: 'sort',
    type: 'input-number',
    span: 24,
    props: {
      min: 1,
      mode: 'button',
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
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  regionTreeData.value = []
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateRegion(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addRegion(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 新增
const onAdd = async (id?: string) => {
  reset()
  await loadRegionRoot()
  form.parentId = id ?? 0
  dataId.value = ''
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  await loadRegionRoot()
  dataId.value = id
  const { data } = await getRegion(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
