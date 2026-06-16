<template>
  <GiPageLayout>
    <GiTable
      row-key="id"
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :pagination="pagination"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
    >
      <template #toolbar-left>
        <a-button v-permission="['finance:fin-print-price-strategy:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>新增策略
        </a-button>
      </template>
      <template #matchConfig="{ record }">
        <a-tooltip :content="record.matchConfig || '通配所有'">
          <a-tag size="small">{{ record.matchConfig ? '特定条件' : '通配' }}</a-tag>
        </a-tooltip>
      </template>
      <template #isActive="{ record }">
        <a-switch 
          v-model="record.isActive" 
          :checked-value="1" 
          :unchecked-value="0"
          @change="onStatusChange(record)"
        />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link @click="onEdit(record)">编辑</a-link>
          <a-popconfirm content="确定删除该策略？" @ok="onDelete(record)">
            <a-link status="danger">删除</a-link>
          </a-popconfirm>
        </a-space>
      </template>
    </GiTable>

    <!-- 新增/编辑对话框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      width="700px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form ref="formRef" :model="formData" layout="vertical">
        <a-form-item label="策略名称" field="strategyName" :rules="[{ required: true, message: '请输入策略名称' }]">
          <a-input v-model="formData.strategyName" placeholder="如：A4胶装双面默认价" />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="基础价格" field="basePrice" :rules="[{ required: true, message: '请输入基础价格' }]">
              <a-input-number v-model="formData.basePrice" :min="0" :precision="2" placeholder="元/页" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="优先级" field="priority">
              <a-input-number v-model="formData.priority" :min="0" placeholder="数字越大优先级越高" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="匹配条件（JSON）" field="matchConfig">
          <a-textarea
            v-model="formData.matchConfig"
            :rows="4"
            placeholder='示例：{"PAPER_SIZE": "A4", "BINDING_TYPE": "GLUE"}，留空表示通配所有'
          />
          <template #extra>
            <div style="font-size: 12px; color: #999">
              <div>留空表示该策略适用于所有配置</div>
              <div>指定条件示例：{"PAPER_SIZE": "A4", "BINDING_TYPE": "GLUE", "PRINT_MODE": "DOUBLE_SIDED"}</div>
            </div>
          </template>
        </a-form-item>

        <a-form-item label="价格公式" field="priceFormula">
          <a-input v-model="formData.priceFormula" placeholder="{base_price} * {page_count} * {copies}" />
          <template #extra>
            <div style="font-size: 12px; color: #999">
              可用变量：{base_price}(基础价格), {page_count}(页数), {copies}(份数)
            </div>
          </template>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="生效日期" field="effectiveDate">
              <a-date-picker v-model="formData.effectiveDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="失效日期" field="expireDate">
              <a-date-picker v-model="formData.expireDate" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </GiPageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'

defineOptions({ name: 'FinPrintPriceStrategy' })

const loading = ref(false)
const dataList = ref<any[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true
})

const modalVisible = ref(false)
const modalTitle = ref('新增策略')
const formRef = ref()
const formData = ref<any>({
  strategyName: '',
  matchConfig: '',
  basePrice: undefined,
  priceFormula: '{base_price} * {page_count} * {copies}',
  effectiveDate: '',
  expireDate: '',
  priority: 0,
  isActive: 1
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '策略名称', dataIndex: 'strategyName', width: 180, ellipsis: true },
  { title: '匹配条件', slotName: 'matchConfig', width: 120 },
  { title: '基础价格', dataIndex: 'basePrice', width: 100, align: 'right' },
  { title: '优先级', dataIndex: 'priority', width: 80 },
  { title: '状态', slotName: 'isActive', width: 80, align: 'center' },
  { title: '生效日期', dataIndex: 'effectiveDate', width: 120 },
  { title: '失效日期', dataIndex: 'expireDate', width: 120 },
  { title: '操作', slotName: 'action', width: 150, fixed: 'right' }
]

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用后端 API 获取数据
    dataList.value = []
    pagination.total = 0
  } catch (error) {
    Message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 分页变化
const onPageChange = (page: number) => {
  pagination.current = page
  loadData()
}

const onPageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  loadData()
}

// 新增
const onAdd = () => {
  modalTitle.value = '新增策略'
  formData.value = {
    strategyName: '',
    matchConfig: '',
    basePrice: undefined,
    priceFormula: '{base_price} * {page_count} * {copies}',
    effectiveDate: '',
    expireDate: '',
    priority: 0,
    isActive: 1
  }
  modalVisible.value = true
}

// 编辑
const onEdit = (record: any) => {
  modalTitle.value = '编辑策略'
  formData.value = { ...record }
  modalVisible.value = true
}

// 删除
const onDelete = async (record: any) => {
  try {
    // TODO: 调用删除 API
    Message.success('删除成功')
    loadData()
  } catch (error) {
    Message.error('删除失败')
  }
}

// 状态变更
const onStatusChange = async (record: any) => {
  try {
    // TODO: 调用更新状态 API
    Message.success('状态更新成功')
  } catch (error) {
    record.isActive = record.isActive === 1 ? 0 : 1
    Message.error('状态更新失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  // 验证 JSON 格式
  if (formData.value.matchConfig) {
    try {
      JSON.parse(formData.value.matchConfig)
    } catch (e) {
      Message.error('匹配条件 JSON 格式错误')
      return
    }
  }

  try {
    // TODO: 调用保存 API
    Message.success('保存成功')
    modalVisible.value = false
    loadData()
  } catch (error) {
    Message.error('保存失败')
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
}

onMounted(() => {
  loadData()
})
</script>
