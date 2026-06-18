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
      <!-- 余额提示：在客户选择器下方显示 -->
      <a-alert v-if="customerBalance !== null" type="info" style="margin-bottom: 16px">
        <template #message>
          客户余额: <strong>¥{{ customerBalance.toFixed(2) }}</strong>
          <template v-if="priceResult && priceResult.totalAmount > 0">
            &nbsp;|&nbsp;订单金额: <strong>¥{{ priceResult.totalAmount.toFixed(2) }}</strong>
            <template v-if="priceResult.totalAmount > customerBalance">
              &nbsp;|&nbsp;预计需三方支付: <strong style="color: #f53f3f">¥{{ (priceResult.totalAmount - customerBalance).toFixed(2) }}</strong>
            </template>
            <template v-else>
              &nbsp;|&nbsp;<span style="color: #00b42a">余额足够，可直接全额扮款</span>
            </template>
          </template>
          <template v-if="hasCustomPrice()">
            &nbsp;|&nbsp;<span style="color: #ff7d00">已应用客户/部门专属价格</span>
          </template>
        </template>
      </a-alert>

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
          <a-option v-for="c in customerList" :key="c.id" :value="c.id">
            {{ c.nickname || c.username }} ({{ c.phone }})
          </a-option>
        </a-select>
      </a-form-item>

      <!-- 项目名称 -->
      <a-form-item label="项目名称" field="projectName">
        <a-input v-model="form.projectName" placeholder="请输入项目名称（选填）" />
      </a-form-item>

      <!-- 文件项列表 -->
      <a-divider orientation="left">打印文件列表</a-divider>

      <div v-if="form.items.length === 0" style="text-align: center; padding: 24px; border: 1px dashed var(--color-neutral-3); border-radius: 4px; margin-bottom: 12px">
        <a-empty description="暂无打印文件" />
        <a-button type="dashed" style="margin-top: 8px" @click="addItem">
          <template #icon><icon-plus /></template>
          添加文件
        </a-button>
      </div>

      <a-tabs
        v-else
        v-model:active-key="activeTabKey"
        type="card"
        style="margin-bottom: 12px"
      >
        <a-tab-pane v-for="(item, idx) in form.items" :key="String(idx)">
          <template #title>
            <span>文件 {{ idx + 1 }}{{ item.fileName ? ` - ${item.fileName}` : '' }}</span>
            <a-button type="text" status="danger" size="mini" style="margin-left: 4px; padding: 0 2px" @click.stop="removeItem(idx)">
              <template #icon><icon-close /></template>
            </a-button>
          </template>
          <div style="padding: 8px 4px">
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
                      <a-spin :size="16" />
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
                    :field="`opt.${idx}.${attr.id}`"
                    :rules="attr.isRequired ? [{ required: true, message: `请选择${attr.name}` }] : undefined"
                    style="margin-bottom: 8px"
                  >
                    <a-radio-group
                      v-if="attr.inputType === 'SELECT'"
                      v-model="itemOptions[idx][attr.id]"
                      @change="onOptionChange(idx)"
                    >
                      <a-radio
                        v-for="opt in getVisibleOptions(idx, attr)"
                        :key="opt.id"
                        :value="opt.id"
                      >
                        {{ opt.name }}
                        <span style="color: var(--color-text-3); font-size: 12px">
                          <template v-if="opt.priceMode === 'PER_PAGE'">({{ opt.price }}/页)</template>
                          <template v-else-if="opt.priceMode === 'FIXED'">({{ opt.price }}元)</template>
                          <template v-else-if="opt.priceMode === 'MULTIPLIER'">(x{{ opt.price }})</template>
                        </span>
                      </a-radio>
                    </a-radio-group>
                    <a-checkbox-group v-else v-model="itemOptions[idx][attr.id]" @change="onOptionChange(idx)">
                      <a-checkbox
                        v-for="opt in getVisibleOptions(idx, attr)"
                        :key="opt.id"
                        :value="opt.id"
                      >
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
          </div>
        </a-tab-pane>
      </a-tabs>

      <div v-if="form.items.length > 0" style="text-align: center; margin-bottom: 12px">
        <a-button type="dashed" size="small" @click="addItem">
          <template #icon><icon-plus /></template>
          添加文件
        </a-button>
      </div>

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

      <!-- 约束规则验证提示 -->
      <a-alert v-if="constraintViolations.length > 0" type="warning" style="margin-bottom: 16px">
        <template #title>配置违规</template>
        <ul style="margin: 4px 0; padding-left: 18px">
          <li v-for="(v, i) in constraintViolations" :key="i">{{ v }}</li>
        </ul>
      </a-alert>

      <!-- 优惠券 -->
      <a-divider orientation="left">优惠券</a-divider>
      <a-empty v-if="!form.customerId" description="请先选择客户" />
      <template v-else>
        <a-spin :loading="couponListLoading" style="width: 100%">
          <a-checkbox-group v-model="selectedCouponIds" @change="onCouponSelectChange">
            <div v-for="c in availableCoupons" :key="c.record.id" style="margin-bottom: 8px">
              <a-checkbox :value="Number(c.record.id)" :disabled="!!c.failReason">
                <a-tag color="purple" size="small">{{ c.template.templateName }}</a-tag>
                <a-tag size="small" :color="c.template.couponType === 'DISCOUNT' ? 'blue' : 'green'">
                  {{ c.template.couponType === 'DISCOUNT' ? `${(c.template.discountRate ?? 0) * 10}折` : `减${c.template.reduceAmount?.toFixed(2)}元` }}
                </a-tag>
                <span v-if="c.template.minOrderAmount" style="color: #86909c; font-size: 12px">满{{ c.template.minOrderAmount }}可用</span>
                <span v-if="c.failReason" style="color: #f53f3f; font-size: 12px; margin-left: 4px">{{ c.failReason }}</span>
              </a-checkbox>
            </div>
          </a-checkbox-group>
          <a-empty v-if="availableCoupons.length === 0" description="暂无可用优惠券" />
        </a-spin>
        <a-alert v-if="batchCouponResult && batchCouponResult.valid" type="success" style="margin-top: 8px">
          <template #message>
            已选 {{ selectedCouponIds.length }} 张券，优惠：<strong>-¥{{ batchCouponResult.totalDiscount?.toFixed(2) }}</strong>
            &nbsp;|&nbsp;折后价：<strong style="color: #f53f3f">¥{{ batchCouponResult.finalAmount?.toFixed(2) }}</strong>
          </template>
        </a-alert>
        <a-alert v-if="batchCouponResult && !batchCouponResult.valid" type="warning" style="margin-top: 8px">
          <template #message>{{ batchCouponResult.message }}</template>
        </a-alert>
      </template>

      <!-- 备注 -->
      <a-form-item label="备注" field="remark" style="margin-top: 8px">
        <a-textarea v-model="form.remark" placeholder="备注信息（选填）" :auto-size="{ minRows: 2, maxRows: 4 }" />
      </a-form-item>
    </a-form>
  </a-modal>

  <!-- 支付弹窗 -->
  <PaymentModal
    v-if="paymentInfo"
    ref="PaymentModalRef"
    :order-id="paymentInfo.orderId"
    :order-no="paymentInfo.orderNo"
    :total-amount="paymentInfo.totalAmount"
    :balance-paid="paymentInfo.balancePaid"
    :remain-amount="paymentInfo.remainAmount"
    @paid="onPaymentDone"
    @closed="onPaymentClosed"
  />
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import type { FileItem } from '@arco-design/web-vue'
import PaymentModal from './PaymentModal.vue'
import {
  type ItemPriceResult,
  type PrintAttributeWithOptions,
  type PrintOrderCreateResp,
  type PrintPriceCalculateResp,
  calculatePrintPrice,
  createPrintOrder,
  listPrintAttributes,
  uploadPrintFile,
} from '@/apis/finance/print-order'
import { type AvailableCouponInfo, type MultiCouponCheckResult, checkBatchCoupons, listAvailableCoupons } from '@/apis/finance/coupon'
import { getAvailableOptions, validatePrintConfig } from '@/apis/finance/printConfigRule'
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

// 支付弹窗相关
const PaymentModalRef = ref<InstanceType<typeof PaymentModal>>()
interface PaymentInfo {
  orderId: string
  orderNo: string
  totalAmount: number
  balancePaid: number
  remainAmount: number
}
const paymentInfo = ref<PaymentInfo | null>(null)

// 客户余额
const customerBalance = ref<number | null>(null)

const form = reactive({
  customerId: undefined as string | undefined,
  projectName: '',
  items: [] as FormItem[],
  remark: '',
  opt: {} as Record<number, Record<number, number | number[]>>,
  couponCode: '',
  couponRecordIds: [] as number[],
})

// 每个文件项的上传状态和文件列表
const fileLists = reactive<Record<number, FileItem[]>>({})
const uploadLoadings = reactive<Record<number, boolean>>({})

// 每个文件项独立的选项 { [itemIdx]: { [attrId]: selectedOptionId(s) } }
const itemOptions = reactive<Record<number, Record<number, number | number[]>>>({})

// 每个文件项的隐藏选项集合 { [itemIdx]: { [attrId]: Set<number> } }
const hiddenOptionsMap = reactive<Record<number, Record<number, Set<number>>>>({})

// 约束验证提示
const constraintViolations = ref<string[]>([])

// 竞态控制版本号
let constraintVersion = 0
let hiddenOptionsVersion = 0

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

// 获取当前客户的 deptId
const getCustomerDeptId = () => {
  if (!form.customerId) return undefined
  const found = customerList.value.find((c) => c.id === form.customerId)
  return found?.deptId
}

// 客户选择变化时更新余额（价格重算在 onOptionChange 定义后注册）
watch(() => form.customerId, (id) => {
  if (!id) {
    customerBalance.value = null
    return
  }
  const found = customerList.value.find((c) => c.id === id)
  customerBalance.value = found?.balance ?? null
})

// 打印属性
const attributes = ref<PrintAttributeWithOptions[]>([])
const attrLoading = ref(false)

// 价格
const priceResult = ref<PrintPriceCalculateResp | null>(null)
const priceLoading = ref(false)
let priceTimer: ReturnType<typeof setTimeout> | null = null

// 优惠券多券选择
const availableCoupons = ref<AvailableCouponInfo[]>([])
const couponListLoading = ref(false)
const selectedCouponIds = ref<number[]>([])
const batchCouponResult = ref<MultiCouponCheckResult | null>(null)

const loadAvailableCoupons = async () => {
  if (!form.customerId) {
    availableCoupons.value = []
    return
  }
  couponListLoading.value = true
  try {
    const orderAmount = priceResult.value?.totalAmount
    const allOptionIds = form.items.flatMap((_item, idx) => {
      const opts = form.opt[idx] || {}
      return Object.values(opts).flatMap((v) => Array.isArray(v) ? v : [v]).filter(Boolean)
    })
    const totalCopies = form.items.reduce((s, i) => s + (i.copies || 0), 0)
    const totalPages = form.items.reduce((s, i) => s + (i.pageCount * i.copies || 0), 0)
    const { data } = await listAvailableCoupons(form.customerId, orderAmount, allOptionIds as number[], totalCopies, totalPages)
    availableCoupons.value = data
  } catch {
    availableCoupons.value = []
  } finally {
    couponListLoading.value = false
  }
}

const onCouponSelectChange = async () => {
  form.couponRecordIds = [...selectedCouponIds.value]
  if (selectedCouponIds.value.length === 0) {
    batchCouponResult.value = null
    return
  }
  try {
    const orderAmount = priceResult.value?.totalAmount
    const allOptionIds = form.items.flatMap((_item, idx) => {
      const opts = form.opt[idx] || {}
      return Object.values(opts).flatMap((v) => Array.isArray(v) ? v : [v]).filter(Boolean)
    })
    const totalCopies = form.items.reduce((s, i) => s + (i.copies || 0), 0)
    const totalPages = form.items.reduce((s, i) => s + (i.pageCount * i.copies || 0), 0)
    const { data } = await checkBatchCoupons({
      recordIds: selectedCouponIds.value,
      customerId: form.customerId ? Number(form.customerId) : undefined,
      orderAmount,
      optionIds: allOptionIds as number[],
      totalCopies,
      totalPages,
    })
    batchCouponResult.value = data
  } catch {
    batchCouponResult.value = null
  }
}

watch(() => form.customerId, () => {
  selectedCouponIds.value = []
  form.couponRecordIds = []
  batchCouponResult.value = null
  loadAvailableCoupons()
})

watch(() => priceResult.value?.totalAmount, () => {
  loadAvailableCoupons()
})

watch(() => itemOptions, () => {
  form.opt = itemOptions
}, { deep: true })

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

// 构建某项的属性编码->选项编码映射（供约束引擎使用）
const buildAttrCodeMap = (idx: number): Record<string, string> => {
  const result: Record<string, string> = {}
  const opts = itemOptions[idx]
  if (!opts) return result
  for (const attr of attributes.value) {
    const val = opts[attr.id]
    if (val != null) {
      let optCode = ''
      if (Array.isArray(val)) {
        // 多选：取第一个（约束规则通常针对单选场景）
        if (val.length > 0) {
          const opt = attr.options.find((o) => o.id === val[0])
          optCode = opt?.code || ''
        }
      } else {
        const opt = attr.options.find((o) => o.id === val)
        optCode = opt?.code || ''
      }
      if (optCode) {
        result[attr.code] = optCode
      }
    }
  }
  return result
}

// 获取某项某属性的可见选项（过滤隐藏选项）
const getVisibleOptions = (idx: number, attr: PrintAttributeWithOptions) => {
  const hidden = hiddenOptionsMap[idx]?.[attr.id]
  if (!hidden || hidden.size === 0) return attr.options
  return attr.options.filter((o) => !hidden.has(o.id))
}

// 刷新某项的隐藏选项
const refreshHiddenOptions = async (idx: number) => {
  const version = ++hiddenOptionsVersion
  const attrCodeMap = buildAttrCodeMap(idx)
  if (Object.keys(attrCodeMap).length === 0) {
    // 无选项时清空隐藏状态
    if (hiddenOptionsMap[idx]) {
      for (const attrId of Object.keys(hiddenOptionsMap[idx])) {
        hiddenOptionsMap[idx][Number(attrId)] = new Set<number>()
      }
    }
    return
  }

  // 为每个属性查询可用选项
  for (const attr of attributes.value) {
    try {
      const { data } = await getAvailableOptions(attr.code, attrCodeMap, form.customerId, getCustomerDeptId())
      // 竞态检查
      if (version !== hiddenOptionsVersion) return
      // data 是可用选项编码列表，取差集算隐藏的
      const availableCodes = new Set(data || [])
      const hiddenIds = new Set<number>()
      for (const opt of attr.options) {
        if (!availableCodes.has(opt.code)) {
          hiddenIds.add(opt.id)
        }
      }
      if (!hiddenOptionsMap[idx]) hiddenOptionsMap[idx] = {}
      hiddenOptionsMap[idx][attr.id] = hiddenIds
    } catch {
      // 忽略错误，不影响主流程
    }
  }
}

// 约束规则验证
const validateConstraints = async () => {
  const version = ++constraintVersion
  // 先清空旧违规，避免切换后旧状态残留
  constraintViolations.value = []
  const allViolations: string[] = []
  for (let idx = 0; idx < form.items.length; idx++) {
    const attrCodeMap = buildAttrCodeMap(idx)
    if (Object.keys(attrCodeMap).length === 0) continue
    try {
      const { data } = await validatePrintConfig(attrCodeMap, form.customerId, getCustomerDeptId())
      // 竞态检查：如果期间有新的验证请求，放弃本次结果
      if (version !== constraintVersion) return
      if (data && !data.valid && data.violations) {
        allViolations.push(...data.violations.map((v) => `文件${idx + 1}: ${v}`))
      }
    } catch {
      // 忽略
    }
  }
  // 再次检查竞态
  if (version !== constraintVersion) return
  constraintViolations.value = allViolations
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
    const { data } = await calculatePrintPrice({
      customerId: form.customerId ? Number(form.customerId) : undefined,
      deptId: getCustomerDeptId() ? Number(getCustomerDeptId()) : undefined,
      items,
    })
    priceResult.value = data
  } catch {
    priceResult.value = null
  } finally {
    priceLoading.value = false
  }
}

const onOptionChange = (idx?: number) => {
  // 先清空旧违规（避免切回合法选项时旧提示残留）
  constraintViolations.value = []
  // 验证约束规则（异步，带竞态保护）
  validateConstraints()
  // 刷新隐藏选项（异步，带竞态保护）
  if (idx !== undefined) {
    refreshHiddenOptions(idx)
  } else {
    // 无 idx 时刷新所有项
    for (let i = 0; i < form.items.length; i++) {
      refreshHiddenOptions(i)
    }
  }
  if (priceTimer) clearTimeout(priceTimer)
  priceTimer = setTimeout(doCalculatePrice, 300)
}

// 客户切换后也需重新计算价格（专属价格可能不同）
watch(() => form.customerId, () => {
  onOptionChange()
})

// 判断是否有客户/部门专属价格生效
const hasCustomPrice = () => {
  if (!priceResult.value || !form.customerId) return false
  for (const item of priceResult.value.items) {
    for (const detail of item.details) {
      // 查找选项基础价格进行对比
      const opt = attributes.value.flatMap((a) => a.options).find((o) => o.name === detail.optionName)
      if (opt && opt.price !== detail.price) return true
    }
  }
  return false
}

// Tab 栏当前激活 key
const activeTabKey = ref('0')

const addItem = () => {
  const idx = form.items.length
  form.items.push({ fileUrl: '', fileName: '', pageCount: 0, copies: 1 })
  fileLists[idx] = []
  uploadLoadings[idx] = false
  initItemOptions(idx)
  activeTabKey.value = String(idx)
}

const removeItem = (idx: number) => {
  // 调整 activeTabKey
  if (form.items.length <= 1) {
    activeTabKey.value = ''
  } else if (Number(activeTabKey.value) === idx) {
    activeTabKey.value = String(Math.max(0, idx - 1))
  } else if (Number(activeTabKey.value) > idx) {
    activeTabKey.value = String(Number(activeTabKey.value) - 1)
  }

  form.items.splice(idx, 1)
  // 重建 fileLists / uploadLoadings / itemOptions 索引
  const newFileLists: Record<number, FileItem[]> = {}
  const newUploadLoadings: Record<number, boolean> = {}
  const newItemOptions: Record<number, Record<number, number | number[]>> = {}
  const newHiddenOptions: Record<number, Record<number, Set<number>>> = {}
  form.items.forEach((_, i) => {
    const oldIdx = i >= idx ? i + 1 : i
    newFileLists[i] = fileLists[oldIdx] || []
    newUploadLoadings[i] = uploadLoadings[oldIdx] || false
    newItemOptions[i] = itemOptions[oldIdx] || {}
    newHiddenOptions[i] = hiddenOptionsMap[oldIdx] || {}
  })
  // 清理旧数据并重新赋值
  Object.keys(fileLists).forEach((k) => delete fileLists[Number(k)])
  Object.keys(uploadLoadings).forEach((k) => delete uploadLoadings[Number(k)])
  Object.keys(itemOptions).forEach((k) => delete itemOptions[Number(k)])
  Object.keys(hiddenOptionsMap).forEach((k) => delete hiddenOptionsMap[Number(k)])
  Object.assign(fileLists, newFileLists)
  Object.assign(uploadLoadings, newUploadLoadings)
  Object.assign(itemOptions, newItemOptions)
  Object.assign(hiddenOptionsMap, newHiddenOptions)
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

    // 约束规则验证
    if (constraintViolations.value.length > 0) {
      Message.error(`配置违规：${constraintViolations.value[0]}`)
      return false
    }

    submitting.value = true
    const items = form.items.map((item, idx) => ({
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      pageCount: item.pageCount,
      copies: item.copies,
      optionIds: getItemOptionIds(idx),
    }))

    const { data: createResp } = await createPrintOrder({
      customerId: form.customerId! as unknown as number,
      projectName: form.projectName || undefined,
      deptId: getCustomerDeptId() as unknown as number,
      items,
      remark: form.remark,
      couponRecordIds: form.couponRecordIds.length > 0 ? form.couponRecordIds : undefined,
    })

    if (createResp.paymentStatus === 'PAID') {
      // 余额全额扮款，直接成功
      Message.success('订单创建成功，余额已全额扮款')
      emit('save-success')
      return true
    }

    if (createResp.paymentStatus === 'BILLING') {
      // 记账客户：走记账签名流程，不需要支付
      Message.success('订单创建成功，等待客户签字确认')
      emit('save-success')
      return true
    }

    // 需要三方支付 (UNPAID / PARTIAL)
    paymentInfo.value = {
      orderId: createResp.orderId,
      orderNo: createResp.orderNo,
      totalAmount: createResp.totalAmount,
      balancePaid: createResp.balancePaid,
      remainAmount: createResp.remainAmount,
    }
    // 关闭下单弹窗，弹出支付弹窗
    visible.value = false
    await nextTick()
    PaymentModalRef.value?.onOpen()
    return true
  } catch (e: any) {
    Message.error(e?.msg || '创建订单失败')
    return false
  } finally {
    submitting.value = false
  }
}

// 支付成功回调
const onPaymentDone = () => {
  paymentInfo.value = null
  emit('save-success')
}

// 支付弹窗关闭（未支付，订单已以 UNPAID 状态保存）
const onPaymentClosed = () => {
  paymentInfo.value = null
  emit('save-success')
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.customerId = undefined
  form.projectName = ''
  form.items = []
  form.remark = ''
  form.couponCode = ''
  form.couponRecordIds = []
  selectedCouponIds.value = []
  batchCouponResult.value = null
  availableCoupons.value = []
  Object.keys(fileLists).forEach((k) => delete fileLists[Number(k)])
  Object.keys(uploadLoadings).forEach((k) => delete uploadLoadings[Number(k)])
  Object.keys(itemOptions).forEach((k) => delete itemOptions[Number(k)])
  Object.keys(hiddenOptionsMap).forEach((k) => delete hiddenOptionsMap[Number(k)])
  priceResult.value = null
  paymentInfo.value = null
  customerBalance.value = null
  constraintViolations.value = []
  activeTabKey.value = '0'
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
