<template>
  <div class="map-picker">
    <!-- 左侧：搜索 + 列表 -->
    <div class="map-picker__left">
      <a-input-search
        v-model="keyword"
        placeholder="搜索地址、小区、大厦、学校..."
        allow-clear
        search-button
        @search="onSearch"
        @press-enter="onSearch"
      />
      <div class="map-picker__list">
        <a-spin :loading="loading" class="map-picker__spin">
          <div v-if="poiList.length === 0" class="map-picker__empty">
            <a-empty description="输入关键字搜索地址" />
          </div>
          <div
            v-for="poi in poiList"
            :key="poi.id"
            class="map-picker__item"
            :class="{ 'map-picker__item--active': selectedPoi?.id === poi.id }"
            @click="onSelectPoi(poi)"
          >
            <div class="map-picker__item-name">{{ poi.name }}</div>
            <div class="map-picker__item-addr">{{ poi.province }}{{ poi.city }}{{ poi.district }}{{ poi.address }}</div>
          </div>
        </a-spin>
        <div v-if="poiList.length > 0" class="map-picker__pagination">
          <a-pagination
            v-model:current="currentPage"
            :total="totalCount"
            :page-size="10"
            size="mini"
            simple
            @change="onPageChange"
          />
        </div>
      </div>
    </div>
    <!-- 右侧：地图 -->
    <div class="map-picker__right">
      <div ref="mapContainer" class="map-picker__map"></div>
      <div v-if="selectedPoi" class="map-picker__info">
        <div class="map-picker__info-title">{{ selectedPoi.name }}</div>
        <div class="map-picker__info-addr">{{ selectedPoi.province }}{{ selectedPoi.city }}{{ selectedPoi.district }}{{ selectedPoi.address }}</div>
        <a-button type="primary" size="small" @click="onConfirm">确认选取</a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { getMapJsKey, reGeocode, searchPoi } from '@/apis/system/map'
import type { MapAddressInfo, PoiItem } from '@/apis/system/map'

const props = defineProps<{
  city?: string
}>()

const emit = defineEmits<{
  (e: 'select', info: MapAddressInfo): void
}>()

const mapContainer = ref<HTMLElement>()
const keyword = ref('')
const loading = ref(false)
const poiList = ref<PoiItem[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const selectedPoi = ref<PoiItem | null>(null)

// 高德地图实例
let mapInstance: any = null
let markerInstance: any = null
let AMapRef: any = null
let jsKeyLoaded = false

// 动态加载高德JS API
async function loadAMapJS(): Promise<any> {
  if (jsKeyLoaded && AMapRef) return AMapRef

  const { data: key } = await getMapJsKey()
  if (!key) {
    Message.error('未配置地图JS API Key')
    return null
  }

  return new Promise((resolve) => {
    // 防止重复加载
    if ((window as any).AMap) {
      AMapRef = (window as any).AMap
      jsKeyLoaded = true
      resolve(AMapRef)
      return
    }
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
    script.onload = () => {
      AMapRef = (window as any).AMap
      jsKeyLoaded = true
      resolve(AMapRef)
    }
    script.onerror = () => {
      Message.error('高德地图JS加载失败')
      resolve(null)
    }
    document.head.appendChild(script)
  })
}

// 初始化地图
async function initMap() {
  const AMap = await loadAMapJS()
  if (!AMap || !mapContainer.value) return

  mapInstance = new AMap.Map(mapContainer.value, {
    zoom: 14,
    center: [116.397428, 39.90923],
    resizeEnable: true,
  })

  // 点击地图选点
  mapInstance.on('click', async (e: any) => {
    const lng = e.lnglat.getLng()
    const lat = e.lnglat.getLat()
    updateMarker(lng, lat)
    // 逆地理编码
    try {
      const { data } = await reGeocode(lng, lat)
      if (data) {
        selectedPoi.value = {
          id: '__click__',
          name: data.formattedAddress || '选中位置',
          address: data.formattedAddress || '',
          province: data.province || '',
          city: data.city || '',
          district: data.district || '',
          longitude: lng,
          latitude: lat,
          adcode: data.adcode || '',
          type: '',
        }
      }
    } catch {
      selectedPoi.value = {
        id: '__click__',
        name: `坐标: ${lng.toFixed(6)}, ${lat.toFixed(6)}`,
        address: '',
        province: '',
        city: '',
        district: '',
        longitude: lng,
        latitude: lat,
        adcode: '',
        type: '',
      }
    }
  })
}

// 更新标记
function updateMarker(lng: number, lat: number) {
  const AMap = AMapRef
  if (!AMap || !mapInstance) return

  if (markerInstance) {
    markerInstance.setPosition([lng, lat])
  } else {
    markerInstance = new AMap.Marker({
      position: [lng, lat],
      draggable: true,
      map: mapInstance,
    })
    // 拖动标记
    markerInstance.on('dragend', async (_e: any) => {
      const pos = markerInstance.getPosition()
      try {
        const { data } = await reGeocode(pos.lng, pos.lat)
        if (data) {
          selectedPoi.value = {
            id: '__drag__',
            name: data.formattedAddress || '拖动位置',
            address: data.formattedAddress || '',
            province: data.province || '',
            city: data.city || '',
            district: data.district || '',
            longitude: pos.lng,
            latitude: pos.lat,
            adcode: data.adcode || '',
            type: '',
          }
        }
      } catch { /* ignore */ }
    })
  }
  mapInstance.setCenter([lng, lat])
}

// 搜索POI
async function onSearch() {
  if (!keyword.value.trim()) return
  loading.value = true
  currentPage.value = 1
  try {
    const { data } = await searchPoi(keyword.value, props.city, 1, 10)
    if (data) {
      poiList.value = data.pois || []
      totalCount.value = data.count || 0
    }
  } catch {
    poiList.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

// 翻页
async function onPageChange(page: number) {
  loading.value = true
  try {
    const { data } = await searchPoi(keyword.value, props.city, page, 10)
    if (data) {
      poiList.value = data.pois || []
      totalCount.value = data.count || 0
    }
  } catch {
    poiList.value = []
  } finally {
    loading.value = false
  }
}

// 选中POI
function onSelectPoi(poi: PoiItem) {
  selectedPoi.value = poi
  if (poi.longitude && poi.latitude) {
    updateMarker(poi.longitude, poi.latitude)
  }
}

// 确认选取
function onConfirm() {
  if (!selectedPoi.value) {
    Message.warning('请先选择一个地址')
    return
  }
  const poi = selectedPoi.value
  emit('select', {
    province: poi.province,
    city: poi.city,
    district: poi.district,
    detailAddress: poi.address || poi.name,
    longitude: poi.longitude,
    latitude: poi.latitude,
  })
}

// 对外暴露初始化方法（弹窗打开时调用）
const init = async () => {
  await nextTick()
  if (!mapInstance) {
    await initMap()
  } else {
    mapInstance.resize()
  }
}

onMounted(() => {
  init()
})

defineExpose({ init })
</script>

<style scoped lang="scss">
.map-picker {
  display: flex;
  height: 500px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.map-picker__left {
  width: 320px;
  min-width: 280px;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
}

.map-picker__list {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.map-picker__spin {
  width: 100%;
}

.map-picker__empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.map-picker__item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-1);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-fill-2);
  }

  &--active {
    background-color: var(--color-primary-light-1);
  }
}

.map-picker__item-name {
  font-weight: 500;
  font-size: 14px;
  color: var(--color-text-1);
  margin-bottom: 4px;
}

.map-picker__item-addr {
  font-size: 12px;
  color: var(--color-text-3);
  line-height: 1.4;
  word-break: break-all;
}

.map-picker__pagination {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.map-picker__right {
  flex: 1;
  position: relative;
}

.map-picker__map {
  width: 100%;
  height: 100%;
}

.map-picker__info {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.map-picker__info-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.map-picker__info-addr {
  font-size: 12px;
  color: var(--color-text-3);
  margin-bottom: 8px;
}
</style>
