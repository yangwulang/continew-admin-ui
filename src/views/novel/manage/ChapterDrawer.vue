<template>
  <a-drawer
    v-model:visible="visible"
    :title="`${novelName} - 章节管理`"
    :width="width >= 900 ? 900 : '100%'"
    unmount-on-close
  >
    <GiTable
      title="章节列表"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 700 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['title']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.title" placeholder="搜索章节标题" allow-clear style="width: 200px" @search="search" />
        <a-button @click="resetQuery">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['novel:chapter:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增章节</template>
        </a-button>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link @click="onViewContent(record)">查看内容</a-link>
          <a-link v-permission="['novel:chapter:update']" @click="onUpdate(record)">修改</a-link>
          <a-link v-permission="['novel:chapter:delete']" status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <!-- 章节内容查看弹窗 -->
    <a-modal v-model:visible="contentVisible" title="章节内容" :width="700" :footer="false" @close="currentChapter = null">
      <a-spin :loading="contentLoading" style="width:100%">
        <template v-if="currentChapter">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
            <a-button size="small" :disabled="!currentChapter.prevChapterId" @click="onPrevChapter">
              <template #icon><icon-left /></template>
              {{ currentChapter.prevChapterId ? currentChapter.prevChapterTitle : '已是第一章' }}
            </a-button>
            <h4 style="margin:0; flex:1; text-align:center; padding:0 12px;">{{ currentChapter.title }}</h4>
            <a-button size="small" :disabled="!currentChapter.nextChapterId" @click="onNextChapter">
              {{ currentChapter.nextChapterId ? currentChapter.nextChapterTitle : '已是最后章' }}
              <template #icon><icon-right /></template>
            </a-button>
          </div>
          <div class="chapter-content">{{ currentChapter.content || '暂无内容' }}</div>
        </template>
      </a-spin>
    </a-modal>

    <!-- 章节新增/修改弹窗 -->
    <a-modal
      v-model:visible="formVisible"
      :title="formTitle"
      :mask-closable="false"
      :width="650"
      @before-ok="save"
      @close="resetForm"
    >
      <a-form ref="formRef" :model="form" :rules="rules" auto-label-width size="large">
        <a-form-item field="chapterNo" label="章节序号">
          <a-input-number v-model="form.chapterNo" placeholder="请输入章节序号" :min="1" mode="button" style="width: 200px" />
        </a-form-item>
        <a-form-item field="title" label="章节标题">
          <a-input v-model="form.title" placeholder="请输入章节标题" />
        </a-form-item>
        <a-form-item field="sortOrder" label="排序">
          <a-input-number v-model="form.sortOrder" placeholder="请输入排序" :min="1" mode="button" style="width: 200px" />
        </a-form-item>
        <a-form-item field="content" label="章节内容">
          <a-textarea v-model="form.content" placeholder="请输入章节内容" :auto-size="{ minRows: 8, maxRows: 20 }" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-drawer>
</template>

<script lang="ts" setup>
import type { FormInstance, TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import {
  type NovelChapterDetailResp,
  type NovelChapterQuery,
  type NovelChapterResp,
  addNovelChapter,
  deleteNovelChapter,
  getNovelChapter,
  listNovelChapter,
  updateNovelChapter,
} from '@/apis/novel/novel-chapter'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

const { width } = useWindowSize()

const visible = ref(false)
const novelId = ref('')
const novelName = ref('')

const queryForm = reactive<NovelChapterQuery>({
  novelId: undefined,
  title: undefined,
  sort: ['chapterNo,asc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listNovelChapter({ ...queryForm, ...page }), { immediate: false })

const columns: TableInstance['columns'] = [
  { title: '序号', dataIndex: 'chapterNo', width: 70, align: 'center' },
  { title: '章节标题', dataIndex: 'title', minWidth: 200, ellipsis: true, tooltip: true },
  { title: '字数', dataIndex: 'wordCount', width: 80, align: 'center' },
  { title: '排序', dataIndex: 'sortOrder', width: 70, align: 'center' },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 180,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['novel:chapter:update', 'novel:chapter:delete']),
  },
]

const resetQuery = () => {
  queryForm.title = undefined
  search()
}

// 查看章节内容
const contentVisible = ref(false)
const contentLoading = ref(false)
const currentChapter = ref<NovelChapterDetailResp | null>(null)

const loadChapterContent = async (id: string) => {
  contentLoading.value = true
  try {
    const { data } = await getNovelChapter(id)
    currentChapter.value = data
  } finally {
    contentLoading.value = false
  }
}

const onViewContent = async (record: NovelChapterResp) => {
  contentVisible.value = true
  await loadChapterContent(record.id)
}

const onPrevChapter = () => {
  if (currentChapter.value?.prevChapterId) {
    loadChapterContent(currentChapter.value.prevChapterId)
  }
}

const onNextChapter = () => {
  if (currentChapter.value?.nextChapterId) {
    loadChapterContent(currentChapter.value.nextChapterId)
  }
}

// 新增/修改
const formVisible = ref(false)
const editId = ref('')
const isEdit = computed(() => !!editId.value)
const formTitle = computed(() => (isEdit.value ? '修改章节' : '新增章节'))
const formRef = ref<FormInstance>()

const form = reactive({
  chapterNo: 1,
  title: '',
  content: '',
  sortOrder: 1,
})

const rules: FormInstance['rules'] = {
  chapterNo: [{ required: true, message: '请输入章节序号' }],
  title: [{ required: true, message: '请输入章节标题' }],
  sortOrder: [{ required: true, message: '请输入排序' }],
}

const resetForm = () => {
  formRef.value?.resetFields()
  editId.value = ''
  form.chapterNo = 1
  form.title = ''
  form.content = ''
  form.sortOrder = 1
}

const onAdd = () => {
  resetForm()
  // 自动设置下一个章节序号
  const maxNo = dataList.value.reduce((max: number, item: any) => Math.max(max, item.chapterNo || 0), 0)
  form.chapterNo = maxNo + 1
  form.sortOrder = form.chapterNo
  formVisible.value = true
}

const onUpdate = async (record: NovelChapterResp) => {
  resetForm()
  editId.value = record.id
  const { data } = await getNovelChapter(record.id)
  form.chapterNo = data.chapterNo
  form.title = data.title
  form.content = data.content || ''
  form.sortOrder = data.sortOrder
  formVisible.value = true
}

const save = async () => {
  try {
    const isInvalid = await formRef.value?.validate()
    if (isInvalid) return false
    if (isEdit.value) {
      await updateNovelChapter({ ...form, novelId: novelId.value }, editId.value)
      Message.success('修改成功')
    } else {
      await addNovelChapter({ ...form, novelId: novelId.value })
      Message.success('新增成功')
    }
    search()
    return true
  } catch (error) {
    return false
  }
}

const onDelete = (record: NovelChapterResp) => {
  return handleDelete(() => deleteNovelChapter(record.id), {
    content: `是否确定删除章节「${record.title}」？`,
    showModal: true,
  })
}

// 打开抽屉
const onOpen = (id: string, name: string) => {
  novelId.value = id
  novelName.value = name
  queryForm.novelId = id
  queryForm.title = undefined
  visible.value = true
  nextTick(() => search())
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss">
.chapter-content {
  max-height: 500px;
  overflow-y: auto;
  white-space: pre-wrap;
  line-height: 1.8;
  padding: 12px;
  background: var(--color-fill-1);
  border-radius: 4px;
  font-size: 14px;
}
</style>
