<template>
  <GiPageLayout>
    <GiTable
      ref="tableRef"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 900 }"
      :pagination="false"
      :disabled-column-keys="['name']"
      :load-more="loadMore"
      @refresh="search"
    >
      <template #expand-icon="{ expanded }">
        <IconDown v-if="expanded" />
        <IconRight v-else />
      </template>
      <template #toolbar-left>
        <a-input v-model="name" placeholder="搜索区域名称" allow-clear @clear="search" @input="onSearchInput">
          <template #prefix><icon-search /></template>
        </a-input>
        <a-select v-model="queryForm.level" placeholder="层级" allow-clear style="width: 120px" @change="search">
          <a-option :value="1">省</a-option>
          <a-option :value="2">市</a-option>
          <a-option :value="3">区/县</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['system:region:create']" type="primary" @click="onAdd()">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['system:region:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #level="{ record }">
        <a-tag v-if="record.level === 1" color="arcoblue" size="small">省</a-tag>
        <a-tag v-else-if="record.level === 2" color="green" size="small">市</a-tag>
        <a-tag v-else-if="record.level === 3" color="orange" size="small">区/县</a-tag>
      </template>
      <template #status="{ record }">
        <GiCellStatus :status="record.status" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['system:region:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link v-permission="['system:region:delete']" status="danger" title="删除" @click="onDelete(record)">删除</a-link>
          <a-link v-if="record.level < 3" v-permission="['system:region:create']" title="新增" @click="onAdd(record.id)">新增</a-link>
        </a-space>
      </template>
    </GiTable>
    <AddModal ref="AddModalRef" @save-success="search" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import { type RegionQuery, type RegionResp, deleteRegion, exportRegion, listRegion, listRegionChildren } from '@/apis/system/region'
import type GiTable from '@/components/GiTable/index.vue'
import { useDownload, useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'SystemRegion' })

const queryForm = reactive<RegionQuery>({})
const tableRef = ref<InstanceType<typeof GiTable>>()
const {
  tableData,
  loading,
  search,
  handleDelete,
} = useTable(() => listRegion(queryForm), {
  immediate: true,
})

// 懒加载：展开行时按 parentId 加载子区域
const loadMore = async (record: RegionResp, done: (children: RegionResp[]) => void) => {
  try {
    const { data } = await listRegionChildren(record.id)
    const children = (data || []).map((item: RegionResp) => ({
      ...item,
      // 区/县没有子节点，不再显示展开箭头
      isLeaf: item.level === 3,
    }))
    done(children)
  } catch {
    done([])
  }
}

// 搜索防抖
let searchTimer: ReturnType<typeof setTimeout> | null = null
const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => search(), 300)
}

const name = ref('')
// 有搜索关键词时使用树过滤，否则直接用 tableData
const dataList = computed(() => {
  if (!name.value) return tableData.value
  const loop = (data: RegionResp[]): RegionResp[] => {
    const result: RegionResp[] = []
    data.forEach((item: RegionResp) => {
      if (item.name?.toLowerCase().includes(name.value!.toLowerCase())) {
        result.push({ ...item })
      } else if (item.children) {
        const filterData = loop(item.children)
        if (filterData.length) {
          result.push({ ...item, children: filterData })
        }
      }
    })
    return result
  }
  return loop(tableData.value)
})

const columns: TableInstance['columns'] = [
  { title: '区域名称', dataIndex: 'name', minWidth: 170, ellipsis: true, tooltip: true },
  { title: '区划代码', dataIndex: 'code', width: 120, align: 'center' },
  { title: '层级', dataIndex: 'level', slotName: 'level', align: 'center', width: 80 },
  { title: '状态', dataIndex: 'status', slotName: 'status', align: 'center', width: 80 },
  { title: '排序', dataIndex: 'sort', align: 'center', width: 80 },
  { title: '修改人', dataIndex: 'updateUserString', ellipsis: true, tooltip: true, show: false },
  { title: '修改时间', dataIndex: 'updateTime', width: 180, show: false },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['system:region:update', 'system:region:delete', 'system:region:create']),
  },
]

// 重置
const reset = () => {
  name.value = ''
  queryForm.level = undefined
  search()
}

// 删除
const onDelete = (record: RegionResp) => {
  return handleDelete(() => deleteRegion(record.id), {
    content: `是否确定删除区域「${record.name}」？`,
    showModal: true,
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportRegion(queryForm))
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
// 新增
const onAdd = (parentId?: string) => {
  AddModalRef.value?.onAdd(parentId)
}
// 修改
const onUpdate = (record: RegionResp) => {
  AddModalRef.value?.onUpdate(record.id)
}
</script>

<style scoped lang="scss"></style>
