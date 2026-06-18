<template>
  <GiPageLayout>
    <GiTable
      title="活动管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 900 }"
      :pagination="false"
      :disabled-tools="['size']"
      @refresh="loadData"
    >
      <template #toolbar-right>
        <a-button type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          新增活动
        </a-button>
      </template>

      <template #timeRange="{ record }">
        <span>{{ record.startTime?.replace('T', ' ') }} ~ {{ record.endTime?.replace('T', ' ') }}</span>
      </template>
      <template #isActive="{ record }">
        <a-switch
          :model-value="record.isActive === 1"
          @change="(value: string | number | boolean) => onToggleStatus(record, value as boolean)"
        />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link @click="onUpdate(record)">修改</a-link>
          <a-link @click="goTemplates(record)">券模板</a-link>
          <a-link status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="editId ? '编辑活动' : '新增活动'"
      :mask-closable="false"
      :width="520"
      :ok-loading="submitting"
      @before-ok="handleSubmit"
      @close="resetModal"
    >
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-form-item label="活动名称" field="promoName" :rules="[{ required: true, message: '请输入活动名称' }]">
          <a-input v-model="form.promoName" placeholder="如：五一促销活动" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="开始时间" field="startTime" :rules="[{ required: true, message: '请选择开始时间' }]">
              <a-date-picker
                v-model="form.startTime"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择开始时间"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="结束时间" field="endTime" :rules="[{ required: true, message: '请选择结束时间' }]">
              <a-date-picker
                v-model="form.endTime"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择结束时间"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="状态" field="isActive">
          <a-switch v-model="form.isActiveFlag" :checked-value="true" :unchecked-value="false">
            <template #checked>启用</template>
            <template #unchecked>停用</template>
          </a-switch>
        </a-form-item>
        <a-form-item label="备注" field="remark">
          <a-textarea v-model="form.remark" placeholder="备注信息（选填）" :auto-size="{ minRows: 2, maxRows: 4 }" />
        </a-form-item>
      </a-form>
    </a-modal>
  </GiPageLayout>
</template>

<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import type { TableInstance } from '@arco-design/web-vue'
import { useRouter } from 'vue-router'
import {
  type PromotionReq,
  type PromotionResp,
  addPromotion,
  deletePromotion,
  listPromotions,
  togglePromotionStatus,
  updatePromotion,
} from '@/apis/finance/coupon'
import { isMobile } from '@/utils'

defineOptions({ name: 'FinPromotion' })

const router = useRouter()

const dataList = ref<PromotionResp[]>([])
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const { data } = await listPromotions()
    dataList.value = data || []
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())

const columns: TableInstance['columns'] = [
  { title: '活动名称', dataIndex: 'promoName', minWidth: 160, ellipsis: true, tooltip: true },
  { title: '有效时间段', dataIndex: 'timeRange', slotName: 'timeRange', minWidth: 340 },
  { title: '状态', dataIndex: 'isActive', slotName: 'isActive', width: 80, align: 'center' },
  { title: '备注', dataIndex: 'remark', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 180,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
  },
]

// ===== 跳转券模板页面 =====
const goTemplates = (record: PromotionResp) => {
  router.push({ name: 'FinCouponTemplate', query: { promotionId: record.id } })
}

// ===== 新增/编辑 =====
const modalVisible = ref(false)
const submitting = ref(false)
const editId = ref<string | undefined>(undefined)
const formRef = ref()

const form = reactive<PromotionReq & { isActiveFlag: boolean }>({
  promoName: '',
  startTime: '',
  endTime: '',
  isActive: 1,
  isActiveFlag: true,
  remark: '',
})

const resetModal = () => {
  formRef.value?.resetFields()
  editId.value = undefined
  form.promoName = ''
  form.startTime = ''
  form.endTime = ''
  form.isActive = 1
  form.isActiveFlag = true
  form.remark = ''
}

const onAdd = () => {
  resetModal()
  modalVisible.value = true
}

const onUpdate = (record: PromotionResp) => {
  resetModal()
  editId.value = record.id
  form.promoName = record.promoName
  form.startTime = record.startTime
  form.endTime = record.endTime
  form.isActive = record.isActive
  form.isActiveFlag = record.isActive === 1
  form.remark = record.remark || ''
  modalVisible.value = true
}

const handleSubmit = async () => {
  const err = await formRef.value?.validate()
  if (err) return false
  submitting.value = true
  try {
    const payload: PromotionReq = {
      promoName: form.promoName,
      startTime: form.startTime,
      endTime: form.endTime,
      isActive: form.isActiveFlag ? 1 : 0,
      remark: form.remark,
    }
    if (editId.value) {
      await updatePromotion(editId.value, payload)
      Message.success('修改成功')
    } else {
      await addPromotion(payload)
      Message.success('新增成功')
    }
    loadData()
    return true
  } catch (e: any) {
    Message.error(e?.msg || '操作失败')
    return false
  } finally {
    submitting.value = false
  }
}

const onToggleStatus = async (record: PromotionResp, val: boolean) => {
  try {
    await togglePromotionStatus(record.id, val ? 1 : 0)
    record.isActive = val ? 1 : 0
    Message.success(val ? '已启用' : '已停用')
  } catch (e: any) {
    Message.error(e?.msg || '操作失败')
  }
}

const onDelete = (record: PromotionResp) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除活动「${record.promoName}」吗？`,
    onOk: async () => {
      await deletePromotion(record.id)
      Message.success('删除成功')
      loadData()
    },
  })
}
</script>

<style scoped lang="scss"></style>
