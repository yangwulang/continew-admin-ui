<template>
  <GiPageLayout>
    <template #left>
      <CategoryTree ref="CategoryTreeRef" @node-click="handleSelectCategory" @refresh="refreshCategories" />
    </template>
    <GiTable
      title="物料管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.name" placeholder="搜索物料名称" allow-clear style="width: 200px" @search="search" />
        <a-select
          v-model="queryForm.status"
          placeholder="状态"
          allow-clear
          style="width: 120px"
          @change="search"
        >
          <a-option :value="1">启用</a-option>
          <a-option :value="2">禁用</a-option>
        </a-select>
        <a-tag
          v-if="selectedCategoryName"
          closable
          color="arcoblue"
          size="large"
          @close="clearCategory"
        >
          <template #icon><icon-folder /></template>
          {{ selectedCategoryName }}
        </a-tag>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['finance:fin-material:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
      </template>
      <template #status="{ record }">
        <a-tag v-if="record.status === 1" color="green" size="small">启用</a-tag>
        <a-tag v-else color="red" size="small">禁用</a-tag>
      </template>
      <template #imageUrl="{ record }">
        <div v-if="record.imageUrl" class="image-thumb-list">
          <a-image
            v-for="(url, idx) in record.imageUrl.split(',').filter((s: string) => s.trim())"
            :key="idx"
            :src="url.trim()"
            width="32"
            height="32"
            fit="cover"
            style="border-radius: 4px"
          />
        </div>
        <span v-else style="color: var(--color-text-4)">暂无</span>
      </template>
      <template #minPrice="{ record }">
        <span v-if="record.minPrice" style="font-weight: 600; color: rgb(var(--arcoblue-6))">{{ record.minPrice?.toFixed(2) }}</span>
        <span v-else style="color: var(--color-text-4)">{{ record.defaultUnitPrice?.toFixed(2) || '-' }}</span>
      </template>
      <template #supplierCount="{ record }">
        <a-tag v-if="record.supplierCount > 0" color="arcoblue" size="small">{{ record.supplierCount }}</a-tag>
        <span v-else style="color: var(--color-text-4)">0</span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['finance:fin-material:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['finance:fin-material:update']" title="供应商报价" @click="onSupplierPrice(record)">报价</a-link>
          <a-link v-permission="['finance:fin-material:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['finance:fin-material:delete']"
            status="danger"
            title="删除"
            @click="onDelete(record)"
          >
            删除
          </a-link>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="search" />
    <DetailDrawer ref="DetailDrawerRef" />
    <SupplierPriceDrawer ref="SupplierPriceDrawerRef" @save-success="search" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import CategoryTree from './CategoryTree.vue'
import AddModal from './AddModal.vue'
import DetailDrawer from './DetailDrawer.vue'
import SupplierPriceDrawer from './SupplierPriceDrawer.vue'
import { type FinMaterialQuery, type FinMaterialResp, deleteFinMaterial, listFinMaterial } from '@/apis/finance/fin-material'
import { type FinMaterialCategoryResp, listFinMaterialCategory } from '@/apis/finance/fin-material-category'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'FinanceMaterial' })

const CategoryTreeRef = ref<InstanceType<typeof CategoryTree>>()

const queryForm = reactive<FinMaterialQuery>({
  name: undefined,
  categoryId: undefined,
  categoryIds: undefined,
  status: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listFinMaterial({ ...queryForm, ...page }), { immediate: false })

// 分类列表（用于查找分类名称和收集子孙分类 ID）
const categoryList = ref<FinMaterialCategoryResp[]>([])
const loadCategoryList = async () => {
  const { data } = await listFinMaterialCategory({ sort: ['sort,asc'] })
  categoryList.value = data || []
}

// 递归收集分类及所有子孙分类 ID
const collectCategoryIds = (list: FinMaterialCategoryResp[], id: string): string[] => {
  const ids: string[] = [id]
  const findChildren = (items: FinMaterialCategoryResp[]) => {
    for (const item of items) {
      if (item.id === id && item.children) {
        const getChildIds = (children: FinMaterialCategoryResp[]) => {
          for (const child of children) {
            ids.push(child.id)
            if (child.children) getChildIds(child.children)
          }
        }
        getChildIds(item.children)
        return
      }
      if (item.children) findChildren(item.children)
    }
  }
  findChildren(list)
  return ids
}

// 处理分类树选择
const handleSelectCategory = (keys: Array<any>) => {
  if (keys && keys.length > 0) {
    queryForm.categoryId = keys[0]
    queryForm.categoryIds = collectCategoryIds(categoryList.value, keys[0])
  } else {
    queryForm.categoryId = undefined
    queryForm.categoryIds = undefined
  }
  search()
}

// 刷新分类树
const refreshCategories = () => {
  CategoryTreeRef.value?.getCategoryList()
}

// 根据 categoryId 查找分类名称（递归）
const findCategoryName = (list: FinMaterialCategoryResp[], id: string): string => {
  for (const item of list) {
    if (item.id === id) return item.name
    if (item.children) {
      const found = findCategoryName(item.children, id)
      if (found) return found
    }
  }
  return ''
}
const selectedCategoryName = computed(() => {
  if (!queryForm.categoryId) return ''
  return findCategoryName(categoryList.value, queryForm.categoryId)
})

// 清除分类选中
const clearCategory = () => {
  queryForm.categoryId = undefined
  queryForm.categoryIds = undefined
  CategoryTreeRef.value?.clearSelection()
  search()
}

const columns: TableInstance['columns'] = [
  { title: '物料名称', dataIndex: 'name', slotName: 'name', minWidth: 140, ellipsis: true, tooltip: true },
  { title: '物料编码', dataIndex: 'code', width: 140, ellipsis: true, tooltip: true },
  { title: '照片', dataIndex: 'imageUrl', slotName: 'imageUrl', width: 120, align: 'center' },
  { title: '最低售价', dataIndex: 'minPrice', slotName: 'minPrice', width: 120, align: 'right' },
  { title: '供应商数', dataIndex: 'supplierCount', slotName: 'supplierCount', width: 100, align: 'center' },
  { title: '计量单位', dataIndex: 'unit', width: 100, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80, align: 'center' },
  { title: '备注', dataIndex: 'remark', minWidth: 160, ellipsis: true, tooltip: true },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 200,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['finance:fin-material:get', 'finance:fin-material:update', 'finance:fin-material:delete']),
  },
]

// 重置
const reset = () => {
  queryForm.name = undefined
  queryForm.categoryId = undefined
  queryForm.categoryIds = undefined
  queryForm.status = undefined
  search()
}

// 删除
const onDelete = (record: FinMaterialResp) => {
  return handleDelete(() => deleteFinMaterial(record.id), {
    content: `是否确定删除物料「${record.name}」？`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => {
  AddModalRef.value?.onAdd()
}
const onUpdate = (record: FinMaterialResp) => {
  AddModalRef.value?.onUpdate(record.id)
}

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
const onDetail = (record: FinMaterialResp) => {
  DetailDrawerRef.value?.onOpen(record.id)
}

const SupplierPriceDrawerRef = ref<InstanceType<typeof SupplierPriceDrawer>>()
const onSupplierPrice = (record: FinMaterialResp) => {
  SupplierPriceDrawerRef.value?.onOpen(record.id, record.name)
}

onMounted(() => {
  loadCategoryList()
})
</script>

<style scoped lang="scss">
.image-thumb-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}
</style>
