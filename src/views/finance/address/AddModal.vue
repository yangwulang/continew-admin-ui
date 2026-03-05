<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 600 ? 600 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <GiForm ref="formRef" v-model="form" :columns="formColumns">
      <template #region>
        <a-cascader
          v-model="form.region"
          :options="regionOptions"
          :load-more="loadMore"
          allow-clear
          path-mode
          placeholder="请选择省/市/区"
          expand-trigger="hover"
          @dropdown-visible-change="onDropdownOpen"
        />
      </template>
    </GiForm>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addFinCustomerAddress, getFinCustomerAddress, updateFinCustomerAddress } from '@/apis/finance/fin-customer-address'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import type { LabelValueState } from '@/types/global'
import http from '@/utils/http'
import { getAreaList } from '@/apis/area'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改客户地址' : '新增客户地址'))
const formRef = ref<InstanceType<typeof GiForm>>()

// 客户下拉选项
const customerOptions = ref<LabelValueState[]>([])
const loadCustomers = async () => {
  try {
    const { data } = await http.get<LabelValueState[]>('/finance/fin-customer/dict')
    customerOptions.value = data || []
  } catch {
    customerOptions.value = []
  }
}

// ---- 省市区级联 ----
const regionOptions = ref<any[]>([])

// 加载省份（仅首次）
const loadProvinces = async () => {
  if (regionOptions.value.length > 0) return
  try {
    const { data } = await getAreaList({ type: 'province' })
    regionOptions.value = ((data as any) || []).map((item: any) => ({
      label: item.label,
      value: item.label,
      code: item.code,
      isLeaf: false,
      depth: 0,
    }))
  } catch {
    regionOptions.value = []
  }
}

// 懒加载子节点（城市 / 区县）
const loadMore = async (option: any, done: (children: any[]) => void) => {
  try {
    const type = option.depth === 0 ? 'city' : 'area'
    const { data } = await getAreaList({ type, code: option.code })
    const isLeaf = option.depth === 1
    done(((data as any) || []).map((item: any) => ({
      label: item.label,
      value: item.label,
      code: item.code,
      isLeaf,
      depth: option.depth + 1,
    })))
  } catch {
    done([])
  }
}

// 打开下拉时加载省份
const onDropdownOpen = async (visible: boolean) => {
  if (visible) await loadProvinces()
}

// 编辑时预加载选中路径，使级联能正确显示已选值
const preloadRegion = async (province: string, city: string) => {
  await loadProvinces()
  const provNode = regionOptions.value.find((p) => p.label === province)
  if (!provNode) return
  const { data: cities } = await getAreaList({ type: 'city', code: provNode.code })
  const cityItems = ((cities as any) || []).map((item: any) => ({
    label: item.label,
    value: item.label,
    code: item.code,
    isLeaf: false,
    depth: 1,
  }))
  provNode.children = cityItems
  const cityNode = cityItems.find((c: any) => c.label === city)
  if (!cityNode) return
  const { data: districts } = await getAreaList({ type: 'area', code: cityNode.code })
  cityNode.children = ((districts as any) || []).map((item: any) => ({
    label: item.label,
    value: item.label,
    code: item.code,
    isLeaf: true,
    depth: 2,
  }))
}

const [form, resetForm] = useResetReactive({
  customerId: undefined as any,
  contactName: undefined as any,
  contactPhone: undefined as any,
  region: [] as string[], // 级联选择：[省, 市, 区]
  province: undefined as any,
  city: undefined as any,
  district: undefined as any,
  detailAddress: undefined as any,
  longitude: undefined as any,
  latitude: undefined as any,
  isDefault: false,
  remark: undefined as any,
})

const formColumns: ColumnItem[] = reactive([
  {
    label: '选择客户',
    field: 'customerId',
    type: 'select',
    span: 24,
    required: true,
    props: {
      options: customerOptions,
      allowSearch: true,
      placeholder: '请选择客户',
      disabled: isUpdate,
    },
  },
  {
    label: '联系人姓名',
    field: 'contactName',
    type: 'input',
    span: 12,
    required: true,
  },
  {
    label: '联系人电话',
    field: 'contactPhone',
    type: 'input',
    span: 12,
    required: true,
  },
  {
    label: '省/市/区',
    field: 'region',
    type: 'cascader',
    span: 24,
    required: true,
    rules: [{ minLength: 3, type: 'array', message: '请选择到区/县级别' }],
  },
  {
    label: '详细地址',
    field: 'detailAddress',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '经度',
    field: 'longitude',
    type: 'input-number',
    span: 12,
    props: {
      precision: 7,
      step: 0.0000001,
      placeholder: '如: 116.4074013',
    },
  },
  {
    label: '纬度',
    field: 'latitude',
    type: 'input-number',
    span: 12,
    props: {
      precision: 7,
      step: 0.0000001,
      placeholder: '如: 39.9042147',
    },
  },
  {
    label: '默认地址',
    field: 'isDefault',
    type: 'switch',
    span: 12,
    props: {
      type: 'round',
      checkedText: '是',
      uncheckedText: '否',
    },
  },
  {
    label: '备注',
    field: 'remark',
    type: 'textarea',
    span: 24,
    props: {
      autoSize: true,
      placeholder: '请输入备注',
    },
  },
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    // 从级联值同步省市区字段
    form.province = form.region[0] || undefined
    form.city = form.region[1] || undefined
    form.district = form.region[2] || undefined
    if (isUpdate.value) {
      await updateFinCustomerAddress(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addFinCustomerAddress(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 新增
const onAdd = async () => {
  reset()
  dataId.value = ''
  await loadCustomers()
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  await loadCustomers()
  const { data } = await getFinCustomerAddress(id)
  Object.assign(form, {
    customerId: data.customerId,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    region: [data.province, data.city, data.district].filter(Boolean),
    province: data.province,
    city: data.city,
    district: data.district,
    detailAddress: data.detailAddress,
    longitude: data.longitude,
    latitude: data.latitude,
    isDefault: data.isDefault,
    remark: data.remark,
  })
  // 预加载路径选项，确保级联组件能渲染已选值
  if (data.province && data.city) {
    await preloadRegion(data.province, data.city)
  }
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
