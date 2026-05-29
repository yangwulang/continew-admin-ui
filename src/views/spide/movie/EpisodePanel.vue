<template>
  <a-drawer
    v-model:visible="visible"
    :title="movieDetail?.movieName || '影片详情'"
    :width="width >= 800 ? 800 : '100%'"
    :footer="false"
    unmount-on-close
  >
    <a-spin :loading="loading" style="width: 100%">
      <template v-if="playSources.length === 0 && !loading">
        <a-descriptions title="基础信息" :column="2" size="large" class="general-description">
          <a-descriptions-item label="影片名称">{{ movieDetail?.movieName }}</a-descriptions-item>
          <a-descriptions-item label="影片副标">{{ movieDetail?.movieSubname }}</a-descriptions-item>
          <a-descriptions-item label="导演">{{ movieDetail?.director }}</a-descriptions-item>
          <a-descriptions-item label="地区">{{ movieDetail?.area }}</a-descriptions-item>
          <a-descriptions-item label="年份">{{ movieDetail?.year }}</a-descriptions-item>
          <a-descriptions-item label="语言">{{ movieDetail?.language }}</a-descriptions-item>
          <a-descriptions-item label="评分">{{ movieDetail?.score }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag v-if="movieDetail?.status === 1" color="green">启用</a-tag>
            <a-tag v-else color="red">禁用</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="演员" :span="2">{{ movieDetail?.actors }}</a-descriptions-item>
          <a-descriptions-item label="封面" :span="2">
            <a-image v-if="movieDetail?.coverUrl" :src="movieDetail.coverUrl" width="120" height="160" fit="cover" />
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="简介" :span="2">{{ movieDetail?.description }}</a-descriptions-item>
        </a-descriptions>
        <a-empty description="暂无播放源和剧集数据" style="margin-top: 16px" />
      </template>
      <template v-else>
        <a-descriptions title="基础信息" :column="2" size="large" class="general-description">
          <a-descriptions-item label="影片名称">{{ movieDetail?.movieName }}</a-descriptions-item>
          <a-descriptions-item label="影片副标">{{ movieDetail?.movieSubname }}</a-descriptions-item>
          <a-descriptions-item label="导演">{{ movieDetail?.director }}</a-descriptions-item>
          <a-descriptions-item label="地区">{{ movieDetail?.area }}</a-descriptions-item>
          <a-descriptions-item label="年份">{{ movieDetail?.year }}</a-descriptions-item>
          <a-descriptions-item label="语言">{{ movieDetail?.language }}</a-descriptions-item>
          <a-descriptions-item label="评分">{{ movieDetail?.score }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag v-if="movieDetail?.status === 1" color="green">启用</a-tag>
            <a-tag v-else color="red">禁用</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="演员" :span="2">{{ movieDetail?.actors }}</a-descriptions-item>
          <a-descriptions-item label="封面" :span="2">
            <a-image v-if="movieDetail?.coverUrl" :src="movieDetail.coverUrl" width="120" height="160" fit="cover" />
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="简介" :span="2">{{ movieDetail?.description }}</a-descriptions-item>
        </a-descriptions>

        <a-divider style="margin: 16px 0" />

        <h4 style="margin: 0 0 8px 0">播放源与剧集</h4>
        <a-tabs v-model:active-key="activeSourceKey" type="rounded" size="small" @change="onSourceChange">
          <a-tab-pane v-for="ps in playSources" :key="ps.id" :title="ps.sourceName || ps.sourceCode">
            <div class="episode-grid">
              <a-button
                v-for="ep in ps.episodes"
                :key="ep.id"
                size="small"
                type="outline"
                @click="onPlayEpisode(ep)"
              >
                {{ ep.episodeTitle || `第${ep.episodeNum}集` }}
              </a-button>
              <a-empty v-if="!ps.episodes || ps.episodes.length === 0" description="暂无剧集" />
            </div>
          </a-tab-pane>
        </a-tabs>
      </template>
    </a-spin>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import type { SpMovieResp } from '@/apis/spide/sp-movie'
import { getSpMovie } from '@/apis/spide/sp-movie'
import type { SpPlaySourceResp } from '@/apis/spide/sp-play-source'
import { listSpPlaySource } from '@/apis/spide/sp-play-source'
import type { SpEpisodeResp } from '@/apis/spide/sp-episode'
import { listSpEpisode } from '@/apis/spide/sp-episode'

interface PlaySourceWithEpisodes extends SpPlaySourceResp {
  episodes: SpEpisodeResp[]
}

const emit = defineEmits<{
  (e: 'play', episode: SpEpisodeResp, playSource: SpPlaySourceResp): void
}>()

const { width } = useWindowSize()

const movieId = ref('')
const movieDetail = ref<SpMovieResp>()
const playSources = ref<PlaySourceWithEpisodes[]>([])
const loading = ref(false)
const activeSourceKey = ref('')
const visible = ref(false)

// 打开抽屉并加载数据
const onOpen = async (id: string) => {
  if (!id) return
  movieId.value = id
  visible.value = true
  loading.value = true
  try {
    const [movieRes, psRes] = await Promise.all([
      getSpMovie(id),
      listSpPlaySource({ movieId: id, sort: ['sort,asc'], page: 1, size: 200 }),
    ])
    movieDetail.value = movieRes.data
    const psList = psRes.data.list || (psRes.data as unknown as SpPlaySourceResp[])

    const psWithEpisodes: PlaySourceWithEpisodes[] = []
    for (const ps of psList) {
      const epRes = await listSpEpisode({ movieId: id, playSourceId: ps.id, sort: ['episodeNum,asc'], page: 1, size: 500 })
      psWithEpisodes.push({
        ...ps,
        episodes: epRes.data.list || (epRes.data as unknown as SpEpisodeResp[]),
      })
    }
    playSources.value = psWithEpisodes
    if (psWithEpisodes.length > 0) {
      activeSourceKey.value = String(psWithEpisodes[0].id)
    }
  } catch (e) {
    console.error('加载剧集数据失败', e)
  } finally {
    loading.value = false
  }
}

const onSourceChange = (key: string | number) => {
  activeSourceKey.value = String(key)
}

const onPlayEpisode = (ep: SpEpisodeResp) => {
  const ps = playSources.value.find((p) => String(p.id) === activeSourceKey.value)
  if (ps) {
    emit('play', ep, ps)
  }
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss">
.episode-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0;
}
</style>
