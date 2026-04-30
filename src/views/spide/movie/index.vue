<template>
  <GiPageLayout>
    <GiTable
      title="影片管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1400 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['movieName']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.movieName" placeholder="搜索影片名称" allow-clear style="width: 200px" @search="search" />
        <a-select v-model="queryForm.sourceId" placeholder="数据源" allow-clear style="width: 150px" @change="search">
          <a-option v-for="item in sourceDict" :key="item.value" :value="item.value" :label="item.label" />
        </a-select>
        <a-select v-model="queryForm.status" placeholder="状态" allow-clear style="width: 120px" @change="search">
          <a-option :value="1">启用</a-option>
          <a-option :value="2">禁用</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['spide:sp-movie:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
      </template>
      <template #coverUrl="{ record }">
        <a-image v-if="record.coverUrl" :src="record.coverUrl" width="60" height="80" fit="cover" />
        <span v-else>-</span>
      </template>
      <template #status="{ record }">
        <a-tag v-if="record.status === 1" color="green" size="small">启用</a-tag>
        <a-tag v-else color="red" size="small">禁用</a-tag>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['spide:sp-movie:get']" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['spide:sp-movie:update']" @click="onUpdate(record)">修改</a-link>
          <a-link v-permission="['spide:sp-movie:delete']" status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <EpisodePanel ref="EpisodePanelRef" @play="onPlayEpisode" />
    <AddModal ref="AddModalRef" @save-success="search" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import EpisodePanel from './EpisodePanel.vue'
import type { SpMovieQuery, SpMovieResp } from '@/apis/spide/sp-movie'
import { deleteSpMovie, listSpMovie } from '@/apis/spide/sp-movie'
import type { SpEpisodeResp } from '@/apis/spide/sp-episode'
import type { SpPlaySourceResp } from '@/apis/spide/sp-play-source'
import { listSpSourceDict } from '@/apis/spide/sp-source'
import type { LabelValueState } from '@/types/global'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'SpMovie' })

const queryForm = reactive<SpMovieQuery>({
  movieName: undefined,
  sourceId: undefined,
  status: undefined,
  sort: ['id,desc'],
})

const sourceDict = ref<LabelValueState[]>([])
const getSourceDict = async () => {
  const { data } = await listSpSourceDict()
  sourceDict.value = data
}
getSourceDict()

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listSpMovie({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '影片名称', dataIndex: 'movieName', minWidth: 150, ellipsis: true, tooltip: true },
  { title: '影片副标', dataIndex: 'movieSubname', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '封面', dataIndex: 'coverUrl', slotName: 'coverUrl', width: 90, align: 'center' },
  { title: '导演', dataIndex: 'director', minWidth: 100, ellipsis: true, tooltip: true },
  { title: '演员', dataIndex: 'actors', minWidth: 150, ellipsis: true, tooltip: true },
  { title: '地区', dataIndex: 'area', width: 80 },
  { title: '年份', dataIndex: 'year', width: 80, align: 'center' },
  { title: '评分', dataIndex: 'score', width: 70, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80, align: 'center' },
  { title: '最后同步', dataIndex: 'lastSyncTime', width: 170 },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 180,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['spide:sp-movie:get', 'spide:sp-movie:update', 'spide:sp-movie:delete']),
  },
]

const reset = () => {
  queryForm.movieName = undefined
  queryForm.sourceId = undefined
  queryForm.status = undefined
  search()
}

const onDelete = (record: SpMovieResp) => {
  return handleDelete(() => deleteSpMovie(record.id), {
    content: `是否确定删除影片「${record.movieName}」？`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => AddModalRef.value?.onAdd()
const onUpdate = (record: SpMovieResp) => AddModalRef.value?.onUpdate(record.id)

const EpisodePanelRef = ref<InstanceType<typeof EpisodePanel>>()
const onDetail = (record: SpMovieResp) => EpisodePanelRef.value?.onOpen(record.id)

// 点击剧集播放按钮
const onPlayEpisode = (episode: SpEpisodeResp, _playSource: SpPlaySourceResp) => {
  if (episode.playUrl) {
    window.open(episode.playUrl, '_blank')
  } else {
    Message.warning('该剧集暂无播放地址')
  }
}
</script>

<style scoped lang="scss"></style>
