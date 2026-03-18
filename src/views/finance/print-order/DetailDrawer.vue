<template>
  <a-drawer v-model:visible="visible" title="打印订单详情" :width="width >= 700 ? 700 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="订单编号">{{ dataDetail?.orderNo }}</a-descriptions-item>
      <a-descriptions-item label="客户 ID">{{ dataDetail?.customerId }}</a-descriptions-item>
      <a-descriptions-item label="总金额" :span="2">
        <span style="font-weight: 600; color: #f53f3f; font-size: 16px">{{ dataDetail?.totalAmount?.toFixed(2) }} 元</span>
      </a-descriptions-item>
      <a-descriptions-item label="状态">
        <a-tag :color="statusColorMap[dataDetail?.status || ''] || 'gray'" size="small">
          {{ statusLabelMap[dataDetail?.status || ''] || dataDetail?.status }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="关联记账 ID">{{ dataDetail?.billingRecordId || '暂无' }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="备注" :span="2">{{ dataDetail?.remark || '暂无' }}</a-descriptions-item>
    </a-descriptions>

    <!-- 文件项列表 -->
    <a-divider orientation="left">打印文件明细</a-divider>
    <a-spin :loading="itemLoading">
      <a-empty v-if="itemList.length === 0" description="暂无文件项" />
      <template v-else>
        <a-card v-for="(item, idx) in itemList" :key="item.id" style="margin-bottom: 12px" :body-style="{ padding: '12px' }">
          <template #title>
            <span>文件 {{ idx + 1 }} - {{ item.fileName }}</span>
          </template>
          <div style="margin-bottom: 8px">
            <a-space>
              <a-tag color="blue">{{ item.pageCount }} 页</a-tag>
              <a-tag color="green">{{ item.copies }} 份</a-tag>
              <a-tag color="arcoblue">小计：{{ item.subtotalAmount?.toFixed(2) }} 元</a-tag>
            </a-space>
          </div>
          <!-- 该文件项的选项 -->
          <a-table
            :data="getOptionListByItemId(item.id)"
            :pagination="false"
            size="small"
            :show-header="true"
          >
            <template #columns>
              <a-table-column title="属性" data-index="attributeName" :width="120" />
              <a-table-column title="选项" data-index="optionName" :width="120" />
              <a-table-column title="计价方式" data-index="priceMode" :width="100" align="center">
                <template #cell="{ record }">
                  <a-tag size="small" :color="priceModeColor[record.priceMode]">{{ priceModeLabel[record.priceMode] }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="单价/值" data-index="price" :width="100" align="right" />
              <a-table-column title="计算金额" data-index="calculatedAmount" :width="120" align="right">
                <template #cell="{ record }">
                  <span style="font-weight: 600">{{ record.calculatedAmount?.toFixed(2) }}</span>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </a-card>
      </template>
    </a-spin>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type PrintOrderDetailResp, type PrintOrderItemResp, type PrintOrderOptionResp, getPrintOrder, listPrintOrderItems, listPrintOrderOptions } from '@/apis/finance/print-order'

const { width } = useWindowSize()

const priceModeLabel: Record<string, string> = { PER_PAGE: '按页', FIXED: '固定', MULTIPLIER: '乘数' }
const priceModeColor: Record<string, string> = { PER_PAGE: 'blue', FIXED: 'green', MULTIPLIER: 'orange' }

const statusLabelMap: Record<string, string> = {
  PENDING: '待处理',
  CONFIRMED: '已确认',
  PRINTING: '打印中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}
const statusColorMap: Record<string, string> = {
  PENDING: 'orangered',
  CONFIRMED: 'blue',
  PRINTING: 'arcoblue',
  COMPLETED: 'green',
  CANCELLED: 'gray',
}

const dataId = ref('')
const dataDetail = ref<PrintOrderDetailResp>()
const itemList = ref<PrintOrderItemResp[]>([])
const optionList = ref<PrintOrderOptionResp[]>([])
const itemLoading = ref(false)
const visible = ref(false)

// 查询详情
const getDataDetail = async () => {
  const { data } = await getPrintOrder(dataId.value)
  dataDetail.value = data
}

// 查询订单项
const getItemList = async () => {
  itemLoading.value = true
  try {
    const { data } = await listPrintOrderItems({ orderId: dataId.value, sort: ['sort,asc'], page: 1, size: 200 })
    itemList.value = data.list || []
  } finally {
    itemLoading.value = false
  }
}

// 查询所有选项（一次性加载）
const getOptionList = async () => {
  const { data } = await listPrintOrderOptions({ itemId: '', sort: ['id,asc'], page: 1, size: 2000 })
  optionList.value = data.list || []
}

// 根据 itemId 过滤选项
const getOptionListByItemId = (itemId: string) => {
  return optionList.value.filter((opt) => opt.itemId === itemId)
}

// 打开
const onOpen = async (id: string) => {
  dataId.value = id
  await Promise.all([getDataDetail(), getItemList(), getOptionList()])
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
