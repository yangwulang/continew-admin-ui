<template>
  <a-modal
    v-model:visible="visible"
    title="新建打印订单"
    :mask-closable="false"
    :esc-to-close="false"
    :width="900"
    :ok-loading="submitting"
    ok-text="确认下单"
    @before-ok="handleSubmit"
    @close="resetForm"
  >
    <a-form ref="formRef" :model="form" layout="vertical">
      <!-- 选择客户 -->
      <a-form-item label="选择客户" field="customerId" :rules="[{ required: true, message: '请选择客户' }]">
        <a-select
          v-model="form.customerId"
          placeholder="请搜索并选择客户"
          allow-search
          allow-clear
          :loading="customerLoading"
          @search="searchCustomer"
        >
          <a-option v-for="c in customerList" :key="c.id" :value="Number(c.id)">
            {{ c.nickname || c.username }} ({{ c.phone }})
          </a-option>
        </a-select>
      </a-form-item>

      <!-- 文件项列表 -->
      <a-divider orientation="left">
        打印文件列表
        <a-button type="text" size="small" style="margin-left: 8px" @click="addItem">
          <template #icon><icon-plus /></template>
          添加文件
        </a-button>
      </a-divider>

      <a-empty v-if="form.items.length === 0" description="请点击「添加文件」" />

      <a-card v-for="(item, idx) in form.items" :key="idx" style="margin-bottom: 12px" :body-style="{ padding: '16px' }">
        <template #title>
          <span>文件 {{ idx + 1 }}{{ item.fileName ? ` - ${item.fileName}` : '' }}</span>
        </template>
        <template #extra>
          <a-popconfirm content="确定删除此文件项？" @ok="removeItem(idx)">
            <a-button type="text" status="danger" size="small">
              <template #icon><icon-delete /></template>
            </a-button>
          </a-popconfirm>
        </template>

        <!-- 上传文件 -->
        <a-row :gutter="16">
          <a-col :span="16">
            <a-form-item label="上传文件" :field="`items.${idx}.fileUrl`" :rules="[{ required: true, message: '请上传文件' }]">
              <a-space direction="vertical" fill style="width: 100%">
                <a-upload
                  :auto-upload="false"
                  :limit="1"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                  :file-list="fileLists[idx] || []"
                  @change="(list: FileItem[]) => handleFileChange(idx, list)"
                >
                  <template #upload-button>
                    <a-button type="outline" size="small">
                      <template #icon><icon-upload /></template>
                      选择文件
                    </a-button>
                  </template>
                </a-upload>
                <a-space v-if="uploadLoadings[idx]">
                  <a-spin size="16" />
                  <span style="color: var(--color-text-3); font-size: 12px">上传并检测页数...</span>
                </a-space>
                <a-tag v-if="item.pageCount > 0" color="green" size="small">{{ item.pageCount }} 页</a-tag>
              </a-space>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="份数" :field="`items.${idx}.copies`" :rules="[{ required: true, message: '请输入份数' }]">
              <a-input-number v-model="item.copies" :min="1" :max="9999" placeholder="份数" style="width: 100%" @change="onOptionChange" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 该项的打印属性 -->
        <a-spin :loading="attrLoading" style="width: 100%">
          <a-row :gutter="12" :wrap="true">
            <a-col v-for="attr in attributes" :key="attr.id" :span="12" style="margin-bottom: 4px">
              <a-form-item
                :label="attr.name"
                :field="`itemOptions.${idx}.${attr.id}`"
                :rules="attr.isRequired ? [{ required: true, message: `请选择${attr.name}` }] : undefined"
                style="margin-bottom: 8px"
              >
                <a-radio-group
                  v-if="attr.inputType === 'SELECT'"
                  v-model="itemOptions[idx][attr.id]"
                  @change="onOptionChange"
                >
                  <a-radio v-for="opt in attr.options" :key="opt.id" :value="opt.id">
                    {{ opt.name }}
                    <span style="color: var(--color-text-3); font-size: 12px">
                      <template v-if="opt.priceMode === 'PER_PAGE'">({{ opt.price }}/页)</template>
                      <template v-else-if="opt.priceMode === 'FIXED'">({{ opt.price }}元)</template>
                      <template v-else-if="opt.priceMode === 'MULTIPLIER'">(x{{ opt.price }})</template>
                    </span>
                  </a-radio>
                </a-radio-group>
                <a-checkbox-group v-else v-model="itemOptions[idx][attr.id]" @change="onOptionChange">
                  <a-checkbox v-for="opt in attr.options" :key="opt.id" :value="opt.id">
                    {{ opt.name }}
                    <span style="color: var(--color-text-3); font-size: 12px">
                      <template v-if="opt.priceMode === 'PER_PAGE'">({{ opt.price }}/页)</template>
                      <template v-else-if="opt.priceMode === 'FIXED'">({{ opt.price }}元)</template>
                      <template v-else-if="opt.priceMode === 'MULTIPLIER'">(x{{ opt.price }})</template>
                    </span>
                  </a-checkbox>
                </a-checkbox-group>
              </a-form-item>
            </a-col>
          </a-row>
        </a-spin>

        <!-- 小计 -->
        <div v-if="priceResult && priceResult.items[idx]" style="text-align: right; color: #165dff; font-weight: 600">
          小计: {{ priceResult.items[idx].subtotalAmount?.toFixed(2) }} 元
        </div>
      </a-card>

      <!-- 价格明细汇总 -->
      <a-divider orientation="left">价格明细</a-divider>
      <a-spin :loading="priceLoading" style="width: 100%">
        <template v-if="priceResult && priceResult.items.length > 0">
          <a-collapse :default-active-key="priceResult.items.map((_: ItemPriceResult, i: number) => i)">
            <a-collapse-item v-for="(pr, idx) in priceResult.items" :key="idx" :header="`文件${idx + 1}: ${pr.fileName || '未命名'} — 小计 ${pr.subtotalAmount?.toFixed(2)} 元`">
              <a-descriptions :column="2" bordered size="small" style="margin-bottom: 8px">
                <a-descriptions-item label="每页单价合计">{{ pr.perPageSum?.toFixed(4) }} 元/页</a-descriptions-item>
                <a-descriptions-item label="页数费用">{{ pr.pageCost?.toFixed(2) }} 元</a-descriptions-item>
                <a-descriptions-item label="乘数调整后">{{ pr.multipliedCost?.toFixed(2) }} 元</a-descriptions-item>
                <a-descriptions-item label="固定费用">{{ pr.fixedSum?.toFixed(2) }} 元</a-descriptions-item>
              </a-descriptions>
              <a-table :data="pr.details" :pagination="false" size="small">
                <template #columns>
                  <a-table-column title="属性" data-index="attributeName" :width="100" />
                  <a-table-column title="选项" data-index="optionName" :width="100" />
                  <a-table-column title="计价方式" data-index="priceMode" :width="80" align="center">
                    <template #cell="{ record }">
                      <a-tag size="small" :color="priceModeColor[record.priceMode]">{{ priceModeLabel[record.priceMode] }}</a-tag>
                    </template>
                  </a-table-column>
                  <a-table-column title="单价" data-index="price" :width="80" align="right" />
                  <a-table-column title="金额" data-index="calculatedAmount" :width="80" align="right">
                    <template #cell="{ record }">{{ record.calculatedAmount?.toFixed(2) }}</template>
                  </a-table-column>
                </template>
              </a-table>
            </a-collapse-item>
          </a-collapse>
          <div style="text-align: right; margin-top: 16px; font-size: 20px; font-weight: 700; color: #f53f3f">
            总计: {{ priceResult.totalAmount?.toFixed(2) }} 元
          </div>
        </template>
        <a-empty v-else description="请添加文件并选择打印选项后查看价格" />
      </a-spin>

      <!-- 备注 -->
      <a-form-item label="备注" field="remark" style="margin-top: 16px">
        <a-textarea v-model="form.remark" placeholder="备注信息（选填）" :auto-size="{ minRows: 2, maxRows: 4 }" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import type { FileItem } from '@arco-design/web-vue'
import {
  type ItemPriceResult,
  type PrintAttributeWithOptions,
  type PrintPriceCalculateResp,
  calculatePrintPrice,
  createPrintOrder,
  listPrintAttributes,
  uploadPrintFile,
} from '@/apis/finance/print-order'
import { type FinCustomerResp, listFinCustomer } from '@/apis/finance/fin-customer'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const priceModeLabel: Record<string, string> = { PER_PAGE: '按页', FIXED: '固定', MULTIPLIER: '乘数' }
const priceModeColor: Record<string, string> = { PER_PAGE: 'blue', FIXED: 'green', MULTIPLIER: 'orange' }

interface FormItem {
  fileUrl: string
  fileName: string
  pageCount: number
  copies: number
}

const visible = ref(false)
const submitting = ref(false)
const formRef = ref()

const form = reactive({
  customerId: undefined as number | undefined,
  items: [] as FormItem[],
  remark: '',
})

// 每个文件项的上传状态和文件列表
const fileLists = reactive<Record<number, FileItem[]>>({})
const uploadLoadings = reactive<Record<number, boolean>>({})

// 每个文件项独立的选项 { [itemIdx]: { [attrId]: selectedOptionId(s) } }
const itemOptions = reactive<Record<number, Record<number, number | number[]>>>({})

// 客户搜索
const customerList = ref<FinCustomerResp[]>([])
const customerLoading = ref(false)
const searchCustomer = async (keyword: string) => {
  if (!keyword) return
  customerLoading.value = true
  try {
    const { data } = await listFinCustomer({ username: keyword, sort: ['id,desc'], page: 1, size: 20 })
    customerList.value = data?.list || []
  } finally {
    customerLoading.value = false
  }
}

// 打印属性
const attributes = ref<PrintAttributeWithOptions[]>([])
const attrLoading = ref(false)

// 价格
const priceResult = ref<PrintPriceCalculateResp | null>(null)
const priceLoading = ref(false)
let priceTimer: ReturnType<typeof setTimeout> | null = null

// 获取某项的选项 ID 列表
const getItemOptionIds = (idx: number): number[] => {
  const ids: number[] = []
  const opts = itemOptions[idx]
  if (!opts) return ids
  for (const attr of attributes.value) {
    const val = opts[attr.id]
    if (Array.isArray(val)) {
      ids.push(...val)
    } else if (val) {
      ids.push(val)
    }
  }
  return ids
}

const initItemOptions = (idx: number) => {
  itemOptions[idx] = {}
  for (const attr of attributes.value) {
    const defaultOpt = attr.options.find((o) => o.isDefault)
    if (attr.inputType === 'SELECT') {
      itemOptions[idx][attr.id] = defaultOpt ? defaultOpt.id : undefined as any
    } else {
      itemOptions[idx][attr.id] = defaultOpt ? [defaultOpt.id] : []
    }
  }
}

const doCalculatePrice = async () => {
  const items = form.items.map((item, idx) => ({
    fileName: item.fileName,
    optionIds: getItemOptionIds(idx),
    pageCount: item.pageCount,
    copies: item.copies,
  })).filter((it) => it.optionIds.length > 0 && it.pageCount > 0 && it.copies > 0)

  if (items.length === 0) {
    priceResult.value = null
    return
  }
  priceLoading.value = true
  try {
    const { data } = await calculatePrintPrice({ items })
    priceResult.value = data
  } catch {
    priceResult.value = null
  } finally {
    priceLoading.value = false
  }
}

const onOptionChange = () => {
  if (priceTimer) clearTimeout(priceTimer)
  priceTimer = setTimeout(doCalculatePrice, 300)
}

const addItem = () => {
  const idx = form.items.length
  form.items.push({ fileUrl: '', fileName: '', pageCount: 0, copies: 1 })
  fileLists[idx] = []
  uploadLoadings[idx] = false
  initItemOptions(idx)
}

const removeItem = (idx: number) => {
  form.items.splice(idx, 1)
  // 重建 fileLists / uploadLoadings / itemOptions 索引
  const newFileLists: Record<number, FileItem[]> = {}
  const newUploadLoadings: Record<number, boolean> = {}
  const newItemOptions: Record<number, Record<number, number | number[]>> = {}
  form.items.forEach((_, i) => {
    const oldIdx = i >= idx ? i + 1 : i
    newFileLists[i] = fileLists[oldIdx] || []
    newUploadLoadings[i] = uploadLoadings[oldIdx] || false
    newItemOptions[i] = itemOptions[oldIdx] || {}
  })
  // 清理旧数据并重新赋值
  Object.keys(fileLists).forEach((k) => delete fileLists[Number(k)])
  Object.keys(uploadLoadings).forEach((k) => delete uploadLoadings[Number(k)])
  Object.keys(itemOptions).forEach((k) => delete itemOptions[Number(k)])
  Object.assign(fileLists, newFileLists)
  Object.assign(uploadLoadings, newUploadLoadings)
  Object.assign(itemOptions, newItemOptions)
  onOptionChange()
}

// 文件上传
const handleFileChange = async (idx: number, list: FileItem[]) => {
  fileLists[idx] = list
  if (list.length === 0 || !list[0].file) {
    form.items[idx].fileUrl = ''
    form.items[idx].fileName = ''
    form.items[idx].pageCount = 0
    onOptionChange()
    return
  }
  uploadLoadings[idx] = true
  try {
    const { data } = await uploadPrintFile(list[0].file)
    form.items[idx].fileUrl = data.fileUrl
    form.items[idx].fileName = data.fileName
    form.items[idx].pageCount = data.pageCount
    Message.success(`文件上传成功，检测到 ${data.pageCount} 页`)
    onOptionChange()
  } catch (e: any) {
    Message.error(e?.msg || '文件上传失败')
    fileLists[idx] = []
    form.items[idx].fileUrl = ''
    form.items[idx].fileName = ''
    form.items[idx].pageCount = 0
  } finally {
    uploadLoadings[idx] = false
  }
}

const loadAttributes = async () => {
  attrLoading.value = true
  try {
    const { data } = await listPrintAttributes()
    attributes.value = data || []
  } finally {
    attrLoading.value = false
  }
}

// 提交订单
const handleSubmit = async () => {
  try {
    const err = await formRef.value?.validate()
    if (err) return false

    if (form.items.length === 0) {
      Message.warning('请至少添加一个文件')
      return false
    }

    for (let i = 0; i < form.items.length; i++) {
      if (!form.items[i].fileUrl) {
        Message.warning(`文件 ${i + 1} 尚未上传`)
        return false
      }
      const optionIds = getItemOptionIds(i)
      if (optionIds.length === 0) {
        Message.warning(`文件 ${i + 1} 请至少选择一个打印选项`)
        return false
      }
    }

    submitting.value = true
    const items = form.items.map((item, idx) => ({
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      pageCount: item.pageCount,
      copies: item.copies,
      optionIds: getItemOptionIds(idx),
    }))

    await createPrintOrder({
      customerId: form.customerId!,
      items,
      remark: form.remark,
    })
    Message.success('打印订单创建成功')
    emit('save-success')
    return true
  } catch (e: any) {
    Message.error(e?.msg || '创建订单失败')
    return false
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.customerId = undefined
  form.items = []
  form.remark = ''
  Object.keys(fileLists).forEach((k) => delete fileLists[Number(k)])
  Object.keys(uploadLoadings).forEach((k) => delete uploadLoadings[Number(k)])
  Object.keys(itemOptions).forEach((k) => delete itemOptions[Number(k)])
  priceResult.value = null
}

const onOpen = async () => {
  resetForm()
  visible.value = true
  await loadAttributes()
  // 默认添加一个文件项
  addItem()
  // 加载客户列表初始数据
  customerLoading.value = true
  try {
    const { data } = await listFinCustomer({ sort: ['id,desc'], page: 1, size: 20 })
    customerList.value = data?.list || []
  } finally {
    customerLoading.value = false
  }
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
