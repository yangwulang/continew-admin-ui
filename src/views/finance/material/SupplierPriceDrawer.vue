<template>
  <a-drawer
    v-model:visible="visible"
    :title="`供应商报价 - ${materialName}`"
    :width="width >= 600 ? 700 : '100%'"
    :footer="false"
  >
    <div style="margin-bottom: 16px">
      <a-button type="primary" @click="onAddPrice">
        <template #icon><icon-plus /></template>
        新增供应商报价
      </a-button>
    </div>

    <a-table :data="priceList" :loading="loading" :pagination="false" size="small" :bordered="{ cell: true }">
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
        <a-table-column title="操作" :width="120" align="center">
          <template #cell="{ record }">
            <a-space>
              <a-link @click="onEditPrice(record)">编辑</a-link>
              <a-link status="danger" @click="onDeletePrice(record)">删除</a-link>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <!-- 新增/编辑报价弹框 -->
    <a-modal
      v-model:visible="priceModalVisible"
      :title="priceModalTitle"
      :mask-closable="false"
      @before-ok="savePrice"
      @close="resetPriceForm"
    >
      <a-form ref="priceFormRef" :model="priceForm" :rules="priceRules" auto-label-width size="large">
        <a-form-item field="supplierId" label="供应商" :rules="[{ required: true, message: '请选择供应商' }]">
          <a-select v-model="priceForm.supplierId" placeholder="请选择供应商" allow-search allow-clear>
            <a-option v-for="item in supplierOptions" :key="item.value" :value="item.value" :label="item.label" />
          </a-select>
        </a-form-item>
        <a-form-item field="supplierPrice" label="供应商报价" :rules="[{ required: true, message: '请输入供应商报价' }]">
          <a-input-number v-model="priceForm.supplierPrice" :min="0" :precision="2" placeholder="供应商报价" hide-button style="width: 100%" />
        </a-form-item>
        <a-form-item field="ourPrice" label="我们的售价">
          <a-input-number v-model="priceForm.ourPrice" :min="0" :precision="2" placeholder="可选，不填则使用供应商报价" hide-button style="width: 100%" />
        </a-form-item>
        <a-form-item field="remark" label="备注">
          <a-input v-model="priceForm.remark" placeholder="备注" :max-length="500" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-drawer>
</template>

<script setup lang="ts">
import type { FormInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import {
  type FinSupplierMaterialResp,
  addFinSupplierMaterial,
  deleteFinSupplierMaterial,
  listFinSupplierMaterial,
  updateFinSupplierMaterial,
} from '@/apis/finance/fin-supplier-material'
import { listFinSupplierDict } from '@/apis/finance/fin-supplier'
import type { LabelValueState } from '@/types/global'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const visible = ref(false)
const materialId = ref('')
const materialName = ref('')
const priceList = ref<FinSupplierMaterialResp[]>([])
const loading = ref(false)
const supplierOptions = ref<LabelValueState[]>([])

// 报价弹框
const priceModalVisible = ref(false)
const priceModalTitle = ref('新增供应商报价')
const priceEditId = ref('')
const priceFormRef = ref<FormInstance>()
const priceRules = {
  supplierId: [{ required: true, message: '请选择供应商' }],
  supplierPrice: [{ required: true, message: '请输入供应商报价' }],
}

const [priceForm, resetPriceFormInner] = useResetReactive({
  supplierId: undefined as string | undefined,
  supplierPrice: undefined as number | undefined,
  ourPrice: undefined as number | undefined,
  remark: undefined as string | undefined,
})

const loadPriceList = async () => {
  loading.value = true
  try {
    const { data } = await listFinSupplierMaterial({ materialId: materialId.value, sort: ['id,desc'], page: 1, size: 500 })
    priceList.value = data?.list || []
  } finally {
    loading.value = false
  }
}

const loadSupplierOptions = async () => {
  const { data } = await listFinSupplierDict()
  supplierOptions.value = data || []
}

const onOpen = async (id: string, name: string) => {
  materialId.value = id
  materialName.value = name
  visible.value = true
  await loadSupplierOptions()
  await loadPriceList()
}

const onAddPrice = () => {
  resetPriceFormInner()
  priceEditId.value = ''
  priceModalTitle.value = '新增供应商报价'
  priceModalVisible.value = true
}

const onEditPrice = (record: FinSupplierMaterialResp) => {
  resetPriceFormInner()
  priceEditId.value = record.id
  priceForm.supplierId = record.supplierId
  priceForm.supplierPrice = record.supplierPrice
  priceForm.ourPrice = record.ourPrice
  priceForm.remark = record.remark
  priceModalTitle.value = '编辑供应商报价'
  priceModalVisible.value = true
}

const savePrice = async () => {
  try {
    const isInvalid = await priceFormRef.value?.validate()
    if (isInvalid) return false
    const data = {
      ...priceForm,
      materialId: materialId.value,
    }
    if (priceEditId.value) {
      await updateFinSupplierMaterial(data, priceEditId.value)
      Message.success('修改成功')
    } else {
      await addFinSupplierMaterial(data)
      Message.success('新增成功')
    }
    await loadPriceList()
    emit('save-success')
    return true
  } catch {
    return false
  }
}

const resetPriceForm = () => {
  priceFormRef.value?.resetFields()
  resetPriceFormInner()
}

const onDeletePrice = async (record: FinSupplierMaterialResp) => {
  await deleteFinSupplierMaterial(record.id)
  Message.success('删除成功')
  await loadPriceList()
  emit('save-success')
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
