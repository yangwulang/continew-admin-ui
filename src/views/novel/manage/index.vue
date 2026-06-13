<template>
  <GiPageLayout>
    <GiTable
      title="小说管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1200 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['bookName']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.bookName" placeholder="搜索书名" allow-clear style="width: 180px" @search="search" />
        <a-input-search v-model="queryForm.author" placeholder="搜索作者" allow-clear style="width: 150px" @search="search" />
        <a-select v-model="queryForm.status" placeholder="状态" allow-clear style="width: 120px" @change="search">
          <a-option :value="1">草稿</a-option>
          <a-option :value="2">待审核</a-option>
          <a-option :value="3">已上架</a-option>
          <a-option :value="4">已驳回</a-option>
          <a-option :value="5">已下架</a-option>
        </a-select>
        <a-select v-model="queryForm.sourceType" placeholder="来源" allow-clear style="width: 130px" @change="search">
          <a-option :value="1">用户上传</a-option>
          <a-option :value="2">管理员上传</a-option>
          <a-option :value="3">爬取</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['novel:info:upload']" type="primary" @click="onUpload">
          <template #icon><icon-upload /></template>
          <template #default>上传小说</template>
        </a-button>
        <a-button v-permission="['novel:info:add']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
      </template>
      <template #status="{ record }">
        <a-tag v-if="record.status === 1" color="gray" size="small">草稿</a-tag>
        <a-tag v-else-if="record.status === 2" color="orange" size="small">待审核</a-tag>
        <a-tag v-else-if="record.status === 3" color="green" size="small">已上架</a-tag>
        <a-tag v-else-if="record.status === 4" color="red" size="small">已驳回</a-tag>
        <a-tag v-else-if="record.status === 5" color="gray" size="small">已下架</a-tag>
      </template>
      <template #sourceType="{ record }">
        <a-tag v-if="record.sourceType === 1" color="blue" size="small">用户上传</a-tag>
        <a-tag v-else-if="record.sourceType === 2" color="cyan" size="small">管理员上传</a-tag>
        <a-tag v-else-if="record.sourceType === 3" color="purple" size="small">爬取</a-tag>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['novel:info:get']" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['novel:chapter:list']" @click="onChapters(record)">章节</a-link>
          <a-link v-if="record.status === 1 || record.status === 4" v-permission="['novel:info:update']" @click="onUpdate(record)">修改</a-link>
          <a-link v-if="record.status === 1 || record.status === 4" v-permission="['novel:info:audit']" status="success" @click="onSubmit(record)">提交审核</a-link>
          <a-link v-if="record.status === 2" v-permission="['novel:info:audit']" status="success" @click="onApprove(record)">通过</a-link>
          <a-link v-if="record.status === 2" v-permission="['novel:info:audit']" status="danger" @click="onReject(record)">驳回</a-link>
          <a-link v-if="record.status === 3" v-permission="['novel:info:audit']" status="warning" @click="onOffline(record)">下架</a-link>
          <a-link :status="bookshelfMap[record.id] ? 'danger' : 'normal'" @click="onAddToBookshelf(record)">
            {{ bookshelfMap[record.id] ? '已在书架' : '加入书架' }}
          </a-link>
          <a-link v-permission="['novel:info:delete']" status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="search" />
    <UploadModal ref="UploadModalRef" @save-success="search" />
    <DetailDrawer ref="DetailDrawerRef" />
    <ChapterDrawer ref="ChapterDrawerRef" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message, Modal } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import UploadModal from './UploadModal.vue'
import DetailDrawer from './DetailDrawer.vue'
import ChapterDrawer from './ChapterDrawer.vue'
import {
  type NovelInfoQuery,
  type NovelInfoResp,
  approveNovelInfo,
  deleteNovelInfo,
  listNovelInfo,
  offlineNovelInfo,
  rejectNovelInfo,
  submitNovelInfo,
} from '@/apis/novel/novel-info'
import { addToBookshelf, checkInBookshelf, removeFromBookshelf } from '@/apis/novel/novel-bookshelf'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'NovelManage' })

// 书架状态缓存：novelId -> boolean
const bookshelfMap = reactive<Record<string, boolean>>({})

// 批量检查书架状态
const checkBookshelfStatus = async (list: NovelInfoResp[]) => {
  for (const item of list) {
    checkInBookshelf(item.id).then(({ data }) => {
      bookshelfMap[item.id] = data
    }).catch(() => {})
  }
}

const onAddToBookshelf = async (record: NovelInfoResp) => {
  if (bookshelfMap[record.id]) {
    Modal.confirm({
      title: '移出书架',
      content: `是否将「${record.bookName}」从书架移除？`,
      onOk: async () => {
        await removeFromBookshelf(record.id)
        bookshelfMap[record.id] = false
        Message.success('已从书架移除')
      },
    })
  } else {
    await addToBookshelf(record.id)
    bookshelfMap[record.id] = true
    Message.success('已加入书架')
  }
}

const queryForm = reactive<NovelInfoQuery>({
  bookName: undefined,
  author: undefined,
  status: undefined,
  sourceType: undefined,
  sort: ['id,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listNovelInfo({ ...queryForm, ...page }), { immediate: true })

watch(dataList, (list) => {
  checkBookshelfStatus(list as NovelInfoResp[])
})

const columns: TableInstance['columns'] = [
  { title: '书名', dataIndex: 'bookName', minWidth: 150, ellipsis: true, tooltip: true },
  { title: '作者', dataIndex: 'author', width: 100, ellipsis: true, tooltip: true },
  { title: '章节数', dataIndex: 'chapterCount', width: 80, align: 'center' },
  { title: '总字数', dataIndex: 'wordCount', width: 90, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 90, align: 'center' },
  { title: '来源', dataIndex: 'sourceType', slotName: 'sourceType', width: 100, align: 'center' },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 340,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['novel:info:get', 'novel:info:update', 'novel:info:delete', 'novel:info:audit']),
  },
]

const reset = () => {
  queryForm.bookName = undefined
  queryForm.author = undefined
  queryForm.status = undefined
  queryForm.sourceType = undefined
  search()
}

const onDelete = (record: NovelInfoResp) => {
  return handleDelete(() => deleteNovelInfo([record.id]), {
    content: `是否确定删除小说「${record.bookName}」？`,
    showModal: true,
  })
}

const onSubmit = (record: NovelInfoResp) => {
  Modal.confirm({
    title: '提交审核',
    content: `是否确定将「${record.bookName}」提交审核？`,
    onOk: async () => {
      await submitNovelInfo(record.id)
      Message.success('已提交审核')
      search()
    },
  })
}

const onApprove = (record: NovelInfoResp) => {
  Modal.confirm({
    title: '审核通过',
    content: `是否确定通过「${record.bookName}」的审核并上架？`,
    onOk: async () => {
      await approveNovelInfo(record.id)
      Message.success('审核通过，已上架')
      search()
    },
  })
}

const onReject = (record: NovelInfoResp) => {
  const inputRef = ref('')
  Modal.confirm({
    title: '驳回',
    content: () => h('div', [
      h('p', '请输入驳回原因：'),
      h('textarea', {
        value: inputRef.value,
        onInput: (e: Event) => { inputRef.value = (e.target as HTMLTextAreaElement).value },
        style: 'width:100%;min-height:60px;padding:8px;border:1px solid #dcdfe6;border-radius:4px',
      }),
    ]),
    onOk: async () => {
      await rejectNovelInfo(record.id, inputRef.value || '审核不通过')
      Message.success('已驳回')
      search()
    },
  })
}

const onOffline = (record: NovelInfoResp) => {
  Modal.confirm({
    title: '下架确认',
    content: `是否确定将「${record.bookName}」下架？`,
    onOk: async () => {
      await offlineNovelInfo(record.id)
      Message.success('已下架')
      search()
    },
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => AddModalRef.value?.onAdd()
const onUpdate = (record: NovelInfoResp) => AddModalRef.value?.onUpdate(record.id)

const UploadModalRef = ref<InstanceType<typeof UploadModal>>()
const onUpload = () => UploadModalRef.value?.onOpen()

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
const onDetail = (record: NovelInfoResp) => DetailDrawerRef.value?.onOpen(record.id)

const ChapterDrawerRef = ref<InstanceType<typeof ChapterDrawer>>()
const onChapters = (record: NovelInfoResp) => ChapterDrawerRef.value?.onOpen(record.id, record.bookName)
</script>

<style scoped lang="scss"></style>
