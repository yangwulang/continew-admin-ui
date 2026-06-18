import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

// 区域数据缓存
let regionTreeCache: T.AreaItem[] | null = null

/** 加载区域树并缓存 */
async function loadRegionTree(): Promise<T.AreaItem[]> {
  if (regionTreeCache) return regionTreeCache
  const { data } = await http.get<T.AreaItem[]>('/system/region/dict/tree', {})
  regionTreeCache = data || []
  return regionTreeCache
}

/** 根据 code 在树中查找节点 */
function findNodeByCode(tree: T.AreaItem[], code: string): T.AreaItem | null {
  for (const item of tree) {
    if (item.code === code) return item
    if (item.children) {
      const found = findNodeByCode(item.children, code)
      if (found) return found
    }
  }
  return null
}

/** @desc 获取地区列表（对接后端区域管理） */
export const getAreaList = async (params: { type: 'province' | 'city' | 'area', code?: string }) => {
  const tree = await loadRegionTree()
  if (params.type === 'province') {
    const data = tree.map((i) => ({ label: i.label, code: i.code }))
    return { data }
  }
  if ((params.type === 'city' || params.type === 'area') && params.code) {
    const parent = findNodeByCode(tree, params.code)
    const data = parent?.children?.map((i) => ({ label: i.label, code: i.code })) || []
    return { data }
  }
  return { data: [] }
}

/** @desc 清除区域数据缓存（区域数据变更后调用） */
export const clearRegionCache = () => {
  regionTreeCache = null
}
