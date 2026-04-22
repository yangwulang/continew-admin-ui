<template>
  <a-modal
    v-model:visible="visible"
    title="新增记账"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 900 ? 900 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <a-form ref="formRef" :model="form" layout="vertical">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item field="customerId" label="选择客户" :rules="[{ required: true, message: '请选择客户' }]">
            <a-select
              v-model="form.customerId"
              placeholder="请选择客户"
              allow-search
              allow-clear
              :loading="customerLoading"
              @search="onCustomerSearch"
              @change="onCustomerChange"
            >
              <a-option v-for="c in customerList" :key="c.id" :value="c.id" :label="c.username" />
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="所属部门">
            <a-input :model-value="selectedDeptName" placeholder="选择客户后自动填充" readonly />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item field="billingDate" label="记账日期" :rules="[{ required: true, message: '请选择记账日期' }]">
            <a-date-picker v-model="form.billingDate" format="YYYY-MM-DD" style="width: 100%" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-divider orientation="left">记账明细</a-divider>

      <a-table :data="form.items" :pagination="false" size="small" :bordered="{ cell: true }">
        <template #columns>
          <a-table-column title="物料" :width="220">
            <template #cell="{ record, rowIndex }">
              <a-select
                v-model="record.materialId"
                placeholder="选择物料"
                allow-search
                allow-clear
                :loading="materialLoading"
                @change="onMaterialChange(rowIndex)"
              >
                <a-option v-for="m in materialList" :key="m.id" :value="m.id" :label="`${m.name}（${m.unit || ''}）`" />
              </a-select>
            </template>
          </a-table-column>
          <a-table-column title="单价" :width="130">
            <template #cell="{ record }">
              <a-input-number v-model="record.unitPrice" :min="0" :precision="2" placeholder="自动" hide-button @change="calcItemAmount(record)" />
            </template>
          </a-table-column>
          <a-table-column title="数量" :width="120">
            <template #cell="{ record }">
              <a-input-number v-model="record.quantity" :min="0.01" :precision="2" placeholder="数量" hide-button @change="calcItemAmount(record)" />
            </template>
          </a-table-column>
          <a-table-column title="金额" :width="120">
            <template #cell="{ record }">
              <span style="font-weight: 600">{{ record.amount?.toFixed(2) || '0.00' }}</span>
            </template>
          </a-table-column>
          <a-table-column title="备注" :width="160">
            <template #cell="{ record }">
              <a-input v-model="record.remark" placeholder="备注" />
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="80" align="center">
            <template #cell="{ rowIndex }">
              <a-button type="text" status="danger" size="mini" @click="removeItem(rowIndex)">
                <template #icon><icon-delete /></template>
              </a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>

      <a-space style="margin-top: 12px">
        <a-button type="dashed" long @click="addItem">
          <template #icon><icon-plus /></template>
          添加明细
        </a-button>
      </a-space>

      <a-divider />
      <div style="text-align: right; font-size: 16px; font-weight: 600">
        合计金额：<span style="color: #165dff">{{ totalAmount.toFixed(2) }}</span> 元
      </div>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addFinBillingRecordWithItems } from '@/apis/finance/fin-billing-record'
import { type FinCustomerResp, listFinCustomer } from '@/apis/finance/fin-customer'
import { type FinCustomerMaterialPriceResp, listFinCustomerMaterialPrice } from '@/apis/finance/fin-customer-material-price'
import { type FinDeptMaterialPriceResp, listFinDeptMaterialPrice } from '@/apis/finance/fin-dept-material-price'
import { type FinMaterialResp, listFinMaterial } from '@/apis/finance/fin-material'
import { useDept } from '@/hooks/app'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()
const visible = ref(false)
const formRef = ref()

interface ItemRow {
  materialId: string | undefined
  unitPrice: number | undefined
  quantity: number | undefined
  amount: number
  remark: string
}

const form = reactive({
  customerId: undefined as string | undefined,
  deptId: undefined as string | undefined,
  billingDate: undefined as string | undefined,
  items: [] as ItemRow[],
})

// ===== 客户列表 =====
const customerList = ref<FinCustomerResp[]>([])
const customerLoading = ref(false)
const loadCustomers = async (keyword?: string) => {
  customerLoading.value = true
  try {
    const { data } = await listFinCustomer({ username: keyword, sort: ['id,desc'], page: 1, size: 50 })
    customerList.value = data.list || []
  } finally {
    customerLoading.value = false
  }
}
const onCustomerSearch = (keyword: string) => {
  loadCustomers(keyword)
}

// ===== 部门名称显示 =====
const { deptList, getDeptList } = useDept()

// 从部门树中递归查找部门名称
const findDeptName = (list: any[], deptId: string): string => {
  for (const item of list) {
    if (String(item.key) === String(deptId)) return item.title || ''
    if (item.children) {
      const name = findDeptName(item.children, deptId)
      if (name) return name
    }
  }
  return ''
}

const selectedDeptName = computed(() => {
  if (!form.deptId) return ''
  return findDeptName(deptList.value, form.deptId)
})

// ===== 物料列表 =====
const materialList = ref<FinMaterialResp[]>([])
const materialLoading = ref(false)
const loadMaterials = async () => {
  materialLoading.value = true
  try {
    const { data } = await listFinMaterial({ sort: ['id,desc'], page: 1, size: 200 })
    materialList.value = data.list || []
  } finally {
    materialLoading.value = false
  }
}

// ===== 客户物料价格缓存 =====
const customerPriceMap = ref<Record<string, FinCustomerMaterialPriceResp[]>>({})
const loadCustomerPrices = async (customerId: string) => {
  if (customerPriceMap.value[customerId]) return
  const { data } = await listFinCustomerMaterialPrice({ customerId, sort: ['id,desc'], page: 1, size: 500 })
  customerPriceMap.value[customerId] = data?.list || []
}

// 获取客户对某物料的专属价格
const getCustomerPrice = (customerId: string | undefined, materialId: string): number | undefined => {
  if (!customerId) return undefined
  const prices = customerPriceMap.value[customerId]
  if (!prices) return undefined
  const now = new Date().toISOString()
  const price = prices.find((p) => {
    if (String(p.materialId) !== String(materialId)) return false
    if (p.effectiveFrom && now < p.effectiveFrom) return false
    if (p.effectiveTo && now > p.effectiveTo) return false
    return true
  })
  return price?.unitPrice
}

// ===== 部门物料价格缓存 =====
const deptPriceMap = ref<Record<string, FinDeptMaterialPriceResp[]>>({})
const loadDeptPrices = async (deptId: string) => {
  if (deptPriceMap.value[deptId]) return
  const { data } = await listFinDeptMaterialPrice({ deptId, sort: ['id,desc'], page: 1, size: 500 })
  deptPriceMap.value[deptId] = data?.list || []
}

// 获取部门对某物料的专属价格
const getDeptPrice = (deptId: string | undefined, materialId: string): number | undefined => {
  if (!deptId) return undefined
  const prices = deptPriceMap.value[deptId]
  if (!prices) return undefined
  const now = new Date().toISOString()
  const price = prices.find((p) => {
    if (String(p.materialId) !== String(materialId)) return false
    if (p.effectiveFrom && now < p.effectiveFrom) return false
    if (p.effectiveTo && now > p.effectiveTo) return false
    return true
  })
  return price?.unitPrice
}

// 刷新明细行价格（优先客户专属价 -> 部门专属价 -> 物料基础价）
const calcItemAmount = (item: ItemRow) => {
  const price = item.unitPrice || 0
  const qty = item.quantity || 0
  item.amount = price * qty
}

const refreshItemPrice = (item: ItemRow) => {
  const mat = materialList.value.find((m) => m.id === item.materialId)
  // 1. 优先客户专属价
  const customerPrice = getCustomerPrice(form.customerId, item.materialId!)
  if (customerPrice !== undefined) {
    item.unitPrice = customerPrice
  } else {
    // 2. 其次部门专属价
    const deptPrice = getDeptPrice(form.deptId, item.materialId!)
    if (deptPrice !== undefined) {
      item.unitPrice = deptPrice
    } else if (mat) {
      // 3. 最后物料基础价
      item.unitPrice = mat.defaultUnitPrice
    }
  }
  calcItemAmount(item)
}

// 选择客户后，自动读取客户的部门
const onCustomerChange = (val: string) => {
  if (val) {
    const customer = customerList.value.find((c) => String(c.id) === String(val))
    form.deptId = customer?.deptId || undefined
    loadCustomerPrices(val)
    if (form.deptId) {
      loadDeptPrices(form.deptId)
    }
  } else {
    form.deptId = undefined
  }
  form.items.forEach((item) => {
    if (item.materialId) {
      refreshItemPrice(item)
    }
  })
}

// 监听客户切换（外部触发时也需同步部门）
watch(() => form.customerId, (newVal) => {
  if (newVal) {
    const customer = customerList.value.find((c) => String(c.id) === String(newVal))
    form.deptId = customer?.deptId || undefined
    loadCustomerPrices(newVal)
    if (form.deptId) {
      loadDeptPrices(form.deptId)
    }
  } else {
    form.deptId = undefined
  }
  form.items.forEach((item) => {
    if (item.materialId) {
      refreshItemPrice(item)
    }
  })
})

// ===== 明细行操作 =====
const addItem = () => {
  form.items.push({
    materialId: undefined,
    unitPrice: undefined,
    quantity: undefined,
    amount: 0,
    remark: '',
  })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

const onMaterialChange = (rowIndex: number) => {
  const item = form.items[rowIndex]
  if (item.materialId) {
    refreshItemPrice(item)
  } else {
    item.unitPrice = undefined
    calcItemAmount(item)
  }
}

const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.amount || 0), 0)
})

// ===== 保存 =====
const save = async () => {
  try {
    const err = await formRef.value?.validate()
    if (err) return false
    if (!form.items.length) {
      Message.warning('请至少添加一条记账明细')
      return false
    }
    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i]
      if (!item.materialId) {
        Message.warning(`第 ${i + 1} 行请选择物料`)
        return false
      }
      if (!item.quantity || item.quantity <= 0) {
        Message.warning(`第 ${i + 1} 行数量必须大于 0`)
        return false
      }
    }
    await addFinBillingRecordWithItems({
      customerId: form.customerId!,
      deptId: form.deptId || undefined,
      billingDate: form.billingDate!,
      items: form.items.map((it) => ({
        materialId: it.materialId!,
        quantity: it.quantity!,
        unitPrice: it.unitPrice,
        remark: it.remark || undefined,
      })),
    })
    Message.success('记账成功')
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// ===== 重置 =====
const reset = () => {
  form.customerId = undefined
  form.deptId = undefined
  form.billingDate = undefined
  form.items = []
}

// ===== 打开 =====
const onAdd = async () => {
  reset()
  visible.value = true
  await Promise.all([loadCustomers(), loadMaterials(), getDeptList()])
  addItem()
}

defineExpose({ onAdd })
</script>

<style scoped lang="scss"></style>
