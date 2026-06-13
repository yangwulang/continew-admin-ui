<template>
  <a-drawer v-model:visible="visible" title="物料详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="物料名称">{{ dataDetail?.name }}</a-descriptions-item>
      <a-descriptions-item label="物料编码">{{ dataDetail?.code || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="分类ID">{{ dataDetail?.categoryId }}</a-descriptions-item>
      <a-descriptions-item label="默认单价">
        <span style="font-weight: 600">{{ dataDetail?.defaultUnitPrice }}</span>
      </a-descriptions-item>
      <a-descriptions-item label="计量单位">{{ dataDetail?.unit || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="状态">
        <a-tag v-if="dataDetail?.status === 1" color="green" size="small">启用</a-tag>
        <a-tag v-else color="red" size="small">禁用</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="物料照片" :span="2">
        <div v-if="dataDetail?.imageUrl" class="detail-image-list">
          <a-image
            v-for="(url, idx) in dataDetail.imageUrl.split(',').filter((s: string) => s.trim())"
            :key="idx"
            :src="url.trim()"
            width="100"
            height="100"
            fit="cover"
            style="border-radius: 8px"
          />
        </div>
        <span v-else>暂无</span>
      </a-descriptions-item>
      <a-descriptions-item label="备注" :span="2">{{ dataDetail?.remark || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
    </a-descriptions>

    <!-- 供应商价格列表 -->
    <a-divider orientation="left">供应商报价</a-divider>
    <a-table :data="dataDetail?.suppliers || []" :pagination="false" size="small" :bordered="{ cell: true }">
      <template #columns>
        <a-table-column title="供应商" data-index="supplierName" :width="140" />
        <a-table-column title="供应商报价" data-index="supplierPrice" :width="120" align="right">
          <template #cell="{ record }">
            <span style="font-weight: 600">{{ record.supplierPrice?.toFixed(2) }}</span>
          </template>
        </a-table-column>
        <a-table-column title="我们的售价" data-index="ourPrice" :width="120" align="right">
          <template #cell="{ record }">
            <span v-if="record.ourPrice" style="font-weight: 600; color: rgb(var(--arcoblue-6))">{{ record.ourPrice?.toFixed(2) }}</span>
            <span v-else style="color: var(--color-text-4)">未设置</span>
          </template>
        </a-table-column>
        <a-table-column title="备注" data-index="remark" ellipsis />
      </template>
    </a-table>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type FinMaterialDetailResp, getFinMaterial as getDetail } from '@/apis/finance/fin-material'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<FinMaterialDetailResp>()
const visible = ref(false)

// 查询详情
const getDataDetail = async () => {
  const { data } = await getDetail(dataId.value)
  dataDetail.value = data
}

// 打开
const onOpen = async (id: string) => {
  dataId.value = id
  await getDataDetail()
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss">
.detail-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
