<template>
  <a-modal
    v-model:visible="visible"
    title="物料分类管理"
    :mask-closable="false"
    :width="width >= 800 ? 800 : '100%'"
    :footer="false"
  >
    <a-space style="margin-bottom: 12px">
      <a-button type="primary" size="small" @click="onAddCategory()">
        <template #icon><icon-plus /></template>
        新增分类
      </a-button>
    </a-space>

    <a-table
      :data="categoryList"
      :pagination="false"
      size="small"
      :loading="loading"
      row-key="id"
      :default-expand-all-rows="true"
    >
      <template #columns>
        <a-table-column title="分类名称" data-index="name" />
        <a-table-column title="排序" data-index="sort" :width="80" align="center" />
        <a-table-column title="状态" :width="80" align="center">
          <template #cell="{ record }">
            <a-tag v-if="record.status === 1" color="green" size="small">启用</a-tag>
            <a-tag v-else color="red" size="small">禁用</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" :width="160" align="center">
          <template #cell="{ record }">
            <a-space>
              <a-link @click="onAddCategory(record.id)">新增</a-link>
              <a-link @click="onEditCategory(record)">编辑</a-link>
              <a-link status="danger" @click="onDeleteCategory(record)">删除</a-link>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <!-- 新增/编辑分类 -->
    <a-modal
      v-model:visible="formVisible"
      :title="editingId ? '编辑分类' : '新增分类'"
      :width="400"
      @before-ok="saveCategory"
      @close="resetForm"
    >
      <a-form ref="formRef" :model="categoryForm" layout="vertical">
        <a-form-item field="parentId" label="父级分类">
          <a-tree-select
            v-model="categoryForm.parentId"
            :data="categoryTreeOptions"
            placeholder="选择父级分类（不选为根级）"
            allow-clear
            allow-search
          />
        </a-form-item>
        <a-form-item field="name" label="分类名称" :rules="[{ required: true, message: '请输入分类名称' }]">
          <a-input v-model="categoryForm.name" placeholder="请输入分类名称" :max-length="50" />
        </a-form-item>
        <a-form-item field="sort" label="排序">
          <a-input-number v-model="categoryForm.sort" :min="0" placeholder="排序号" style="width: 100%" />
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-switch
            v-model="categoryForm.status"
            :checked-value="1"
            :unchecked-value="2"
            checked-text="启用"
            unchecked-text="禁用"
          />
        </a-form-item>
        <a-form-item field="remark" label="备注">
          <a-textarea v-model="categoryForm.remark" placeholder="请输入备注" :auto-size="{ minRows: 2 }" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import {
  type FinMaterialCategoryResp,
  listFinMaterialCategory,
  addFinMaterialCategory,
  updateFinMaterialCategory,
  deleteFinMaterialCategory,
} from '@/apis/finance/fin-material-category'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()
const visible = ref(false)
const loading = ref(false)
const categoryList = ref<FinMaterialCategoryResp[]>([])

const loadList = async () => {
  loading.value = true
  try {
    const { data } = await listFinMaterialCategory({ sort: ['sort,asc'] })
    categoryList.value = data || []
  } finally {
    loading.value = false
  }
}

// 构建树形选择器数据（排除当前编辑节点及其子节点）
const categoryTreeOptions = computed(() => {
  const buildTree = (list: FinMaterialCategoryResp[], excludeId?: string): any[] => {
    return list
      .filter(item => item.id !== excludeId)
      .map(item => ({
        key: item.id,
        value: item.id,
        title: item.name,
        disabled: item.id === excludeId,
        children: item.children ? buildTree(item.children, excludeId) : undefined,
      }))
  }
  return buildTree(categoryList.value, editingId.value)
})

// ===== 分类表单 =====
const formVisible = ref(false)
const formRef = ref()
const editingId = ref('')
const categoryForm = reactive({
  parentId: undefined as string | undefined,
  name: '',
  sort: 0,
  status: 1,
  remark: '',
})

const resetForm = () => {
  formRef.value?.resetFields()
  editingId.value = ''
  categoryForm.parentId = undefined
  categoryForm.name = ''
  categoryForm.sort = 0
  categoryForm.status = 1
  categoryForm.remark = ''
}

const onAddCategory = (parentId?: string) => {
  resetForm()
  if (parentId) {
    categoryForm.parentId = parentId
  }
  formVisible.value = true
}

const onEditCategory = (record: FinMaterialCategoryResp) => {
  resetForm()
  editingId.value = record.id
  categoryForm.parentId = record.parentId || undefined
  categoryForm.name = record.name
  categoryForm.sort = record.sort
  categoryForm.status = record.status
  categoryForm.remark = record.remark
  formVisible.value = true
}

const saveCategory = async () => {
  try {
    const err = await formRef.value?.validate()
    if (err) return false
    const submitData = { ...categoryForm }
    if (!submitData.parentId) {
      submitData.parentId = undefined
    }
    if (editingId.value) {
      await updateFinMaterialCategory(submitData, editingId.value)
      Message.success('修改成功')
    } else {
      await addFinMaterialCategory(submitData)
      Message.success('新增成功')
    }
    await loadList()
    emit('save-success')
    return true
  } catch {
    return false
  }
}

const onDeleteCategory = (record: FinMaterialCategoryResp) => {
  if (record.children && record.children.length > 0) {
    Message.warning('请先删除子分类')
    return
  }
  Modal.warning({
    title: '确认删除',
    content: `是否确定删除分类「${record.name}」？`,
    hideCancel: false,
    onOk: async () => {
      await deleteFinMaterialCategory(record.id)
      Message.success('删除成功')
      await loadList()
      emit('save-success')
    },
  })
}

// 打开
const onOpen = async () => {
  visible.value = true
  await loadList()
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
