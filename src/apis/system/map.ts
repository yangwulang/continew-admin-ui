import http from '@/utils/http'

const BASE_URL = '/system/map'

// ---- 类型定义 ----

export interface PoiItem {
  id: string
  name: string
  address: string
  province: string
  city: string
  district: string
  longitude: number
  latitude: number
  adcode: string
  type: string
}

export interface PoiSearchResult {
  count: number
  pois: PoiItem[]
}

export interface WeatherItem {
  date: string
  week: string
  dayWeather: string
  nightWeather: string
  dayTemp: string
  nightTemp: string
  dayWind: string
  nightWind: string
}

export interface WeatherResult {
  city: string
  adcode: string
  province: string
  forecasts: WeatherItem[]
}

export interface CoordinateResult {
  longitude: number
  latitude: number
}

export interface RouteStep {
  instruction: string
  road: string
  distance: number
  duration: number
}

export interface RoutePlanResult {
  distance: number
  duration: number
  steps: RouteStep[]
}

export interface GeocodeResult {
  formattedAddress: string
  province: string
  city: string
  district: string
  adcode: string
  longitude: number
  latitude: number
}

export interface ReGeocodeResult {
  formattedAddress: string
  province: string
  city: string
  district: string
  township: string
  adcode: string
  longitude: number
  latitude: number
}

export interface MapConfigResp {
  id: string
  provider: string
  apiKey: string
  apiSecret: string
  jsApiKey: string
  baseUrl: string
  isActive: number
  remark: string
  createTime: string
  updateTime: string
}

export interface MapConfigReq {
  provider: string
  apiKey: string
  apiSecret?: string
  jsApiKey?: string
  baseUrl: string
  remark?: string
}

/** 地图选取返回的完整地址信息 */
export interface MapAddressInfo {
  province: string
  city: string
  district: string
  detailAddress: string
  longitude: number
  latitude: number
}

// ---- 地图服务API ----

/** @desc 关键字搜索POI */
export function searchPoi(keyword: string, city?: string, page = 1, size = 20) {
  return http.get<PoiSearchResult>(`${BASE_URL}/poi/search`, { keyword, city, page, size })
}

/** @desc 周边搜索POI */
export function searchAround(keywords: string, lng: number, lat: number, radius = 3000, page = 1, size = 20) {
  return http.get<PoiSearchResult>(`${BASE_URL}/poi/around`, { keywords, lng, lat, radius, page, size })
}

/** @desc 天气查询 */
export function queryWeather(cityCode: string) {
  return http.get<WeatherResult>(`${BASE_URL}/weather`, { cityCode })
}

/** @desc 坐标转换 */
export function convertCoord(lng: number, lat: number, from = 'gps', to = 'amap') {
  return http.get<CoordinateResult>(`${BASE_URL}/coord/convert`, { lng, lat, from, to })
}

/** @desc 路径规划 */
export function planRoute(origLng: number, origLat: number, destLng: number, destLat: number, mode = 'driving') {
  return http.get<RoutePlanResult>(`${BASE_URL}/route`, { origLng, origLat, destLng, destLat, mode })
}

/** @desc 正地理编码 */
export function geocode(address: string, city?: string) {
  return http.get<GeocodeResult>(`${BASE_URL}/geocode`, { address, city })
}

/** @desc 逆地理编码 */
export function reGeocode(lng: number, lat: number) {
  return http.get<ReGeocodeResult>(`${BASE_URL}/regeocode`, { lng, lat })
}

/** @desc 获取前端JS API Key(地图渲染用) */
export function getMapJsKey() {
  return http.get<string>(`${BASE_URL}/config/js-key`)
}

// ---- 地图配置管理API ----

/** @desc 查询所有地图配置 */
export function listMapConfig() {
  return http.get<MapConfigResp[]>(`${BASE_URL}/config`)
}

/** @desc 新增地图配置 */
export function addMapConfig(data: MapConfigReq) {
  return http.post(`${BASE_URL}/config`, data)
}

/** @desc 修改地图配置 */
export function updateMapConfig(id: string, data: MapConfigReq) {
  return http.put(`${BASE_URL}/config/${id}`, data)
}

/** @desc 删除地图配置 */
export function deleteMapConfig(id: string) {
  return http.del(`${BASE_URL}/config/${id}`)
}

/** @desc 激活地图配置 */
export function activateMapConfig(id: string) {
  return http.put(`${BASE_URL}/config/${id}/activate`)
}
