<template>
  <div class="container">
    <div class="search">
      <a-input v-model="searchKey" placeholder="搜索分类名称" allow-clear>
        <template #prefix><icon-search /></template>
      </a-input>
    </div>
    <div class="tree-wrapper">
      <div class="tree" @contextmenu="onContextmenu">
        <a-tree
          ref="treeRef"
          :data="treeData"
          show-line
          block-node
          default-expand-all
          :selected-keys="selectedKeys"
          @select="select"
        >
          <template #switcher-icon="{ isLeaf }">
            <IconCaretDown v-if="!isLeaf" />
            <IconFolder v-else />
          </template>
          <template #title="node">
            <a-typography-paragraph
              :ellipsis="{
                rows: 1,
                showTooltip: true,
                css: true,
              }"
            >
              {{ node?.title }}
            </a-typography-paragraph>
          </template>
        </a-tree>
      </div>
    </div>

    <!-- 新增/编辑分类弹窗 -->
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
  </div>
</template>

<script setup lang="ts">
import type { TreeInstance, TreeNodeData } from '@arco-design/web-vue'
import { Message, Modal } from '@arco-design/web-vue'
import ContextMenu from '@imengyu/vue3-context-menu'
import {
  type FinMaterialCategoryResp,
  addFinMaterialCategory,
  deleteFinMaterialCategory,
  listFinMaterialCategory,
  updateFinMaterialCategory,
} from '@/apis/finance/fin-material-category'

const emit = defineEmits<{
  (e: 'node-click', keys: Array<any>): void
  (e: 'refresh'): void
}>()

// 选中节点
const selectedKeys = ref<Array<string>>()
const select = (keys: Array<any>) => {
  if (selectedKeys.value && selectedKeys.value[0] === keys[0]) {
    return
  }
  selectedKeys.value = keys
  emit('node-click', keys)
}

const treeRef = ref<TreeInstance>()
const categoryList = ref<FinMaterialCategoryResp[]>([])
const loading = ref(false)

// 查询分类树列表
const getCategoryList = async () => {
  loading.value = true
  try {
    const { data } = await listFinMaterialCategory({ sort: ['sort,asc'] })
    categoryList.value = data || []
    nextTick(() => {
      treeRef.value?.expandAll(true)
      // 不默认选中，触发查询全部
      emit('node-click', [])
    })
  } finally {
    loading.value = false
  }
}

// 构建树形数据
const buildTreeData = (list: FinMaterialCategoryResp[]): TreeNodeData[] => {
  return list.map((item) => ({
    key: item.id,
    title: item.name,
    children: item.children ? buildTreeData(item.children) : undefined,
    raw: item,
  }))
}

const treeDataList = computed(() => buildTreeData(categoryList.value))

// 过滤树
const searchKey = ref('')
const search = (keyword: string) => {
  const loop = (data: TreeNodeData[]) => {
    const result = [] as TreeNodeData[]
    data.forEach((item: TreeNodeData) => {
      if (item.title?.toLowerCase().includes(keyword)) {
        result.push({ ...item })
      } else if (item.children) {
        const filterData = loop(item.children)
        if (filterData.length) {
          result.push({
            ...item,
            children: filterData,
          })
        }
      }
    })
    return result
  }
  return loop(treeDataList.value)
}

const treeData = computed(() => {
  if (!searchKey.value) return treeDataList.value
  return search(searchKey.value.toLowerCase())
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

// 构建树形选择器数据（排除当前编辑节点及其子节点）
const categoryTreeOptions = computed(() => {
  const buildTree = (list: FinMaterialCategoryResp[], excludeId?: string): any[] => {
    return list
      .filter((item) => item.id !== excludeId)
      .map((item) => ({
        key: item.id,
        value: item.id,
        title: item.name,
        disabled: item.id === excludeId,
        children: item.children ? buildTree(item.children, excludeId) : undefined,
      }))
  }
  return buildTree(categoryList.value, editingId.value)
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

const onAdd = (parentId?: string) => {
  resetForm()
  if (parentId) {
    categoryForm.parentId = parentId
  }
  formVisible.value = true
}

const onEdit = (node: TreeNodeData) => {
  const record = node.raw as FinMaterialCategoryResp
  resetForm()
  editingId.value = record.id
  categoryForm.parentId = record.parentId ? String(record.parentId) : undefined
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
    await getCategoryList()
    emit('refresh')
    return true
  } catch {
    return false
  }
}

const onDelete = (node: TreeNodeData) => {
  const record = node.raw as FinMaterialCategoryResp
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
      await getCategoryList()
      emit('refresh')
    },
  })
}

// 当前右键选中的节点
const contextMenuNode = ref<TreeNodeData | null>(null)

const onContextmenu = (e: MouseEvent) => {
  e.preventDefault()

  // 尝试从点击的元素找到对应的树节点
  const target = e.target as HTMLElement
  const treeNodeEl = target.closest('.arco-tree-node') as HTMLElement | null

  if (treeNodeEl) {
    // 从 DOM 获取节点 key
    const key = treeNodeEl.getAttribute('data-key')
    if (key) {
      // 在 treeData 中查找对应节点
      const findNode = (data: TreeNodeData[]): TreeNodeData | null => {
        for (const item of data) {
          if (item.key === key) return item
          if (item.children) {
            const found = findNode(item.children)
            if (found) return found
          }
        }
        return null
      }
      contextMenuNode.value = findNode(treeData.value)
    }
  }

  // 如果没找到节点（在空白处右键），则视为根级别操作
  const items = contextMenuNode.value
    ? [
        {
          label: '新增子分类',
          onClick: () => {
            onAdd(contextMenuNode.value!.key as string)
          },
        },
        {
          label: '编辑',
          onClick: () => {
            onEdit(contextMenuNode.value!)
          },
        },
        {
          label: '删除',
          onClick: () => {
            onDelete(contextMenuNode.value!)
          },
        },
      ]
    : [
        {
          label: '新增分类',
          onClick: () => {
            onAdd()
          },
        },
      ]

  ContextMenu.showContextMenu({
    x: e.clientX,
    y: e.clientY,
    items,
  })
}

onMounted(() => {
  getCategoryList()
})

/** 清除选中状态 */
const clearSelection = () => {
  selectedKeys.value = []
  emit('node-click', [])
}

defineExpose({ getCategoryList, clearSelection })
</script>

<style scoped lang="scss">
:deep(.arco-tree-node-title-text) {
  width: 100%;
  white-space: nowrap;
}

:deep(.arco-tree-node) {
  line-height: normal;
  border-radius: var(--border-radius-medium);
  &:hover {
    background-color: var(--color-secondary-hover);
  }

  .arco-tree-node-title {
    &:hover {
      background-color: transparent;
    }
  }
}

:deep(.arco-tree-node-selected) {
  font-weight: bold;
  background-color: rgba(var(--primary-6), 0.1);
  &:hover {
    background-color: rgba(var(--primary-6), 0.1);
  }
  .arco-typography {
    color: rgb(var(--primary-6));
  }
}

.container {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;

  .search {
    margin-bottom: 16px;
  }

  .tree-wrapper {
    flex: 1;
    overflow: hidden;
    background-color: var(--color-bg-1);
    position: relative;
    height: 100%;
    .tree {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      overflow: auto;
    }
  }
}

.context-menu {
  background: var(--color-bg-popup);
  border-radius: var(--border-radius-medium);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 4px;
}
</style>
