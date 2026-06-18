<template>
  <div class="gi-page">
    <a-card title="地图配置管理">
      <template #extra>
        <a-button type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          新增配置
        </a-button>
      </template>
      <a-table :data="configList" :loading="loading" :pagination="false" row-key="id">
        <template #columns>
          <a-table-column title="厂商" data-index="provider" :width="100">
            <template #cell="{ record }">
              <a-tag :color="providerColor(record.provider)">{{ providerLabel(record.provider) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="API Key" data-index="apiKey" :width="160" />
          <a-table-column title="API Secret" data-index="apiSecret" :width="160" />
          <a-table-column title="JS API Key" data-index="jsApiKey" :width="160" />
          <a-table-column title="基础URL" data-index="baseUrl" :width="260" ellipsis />
          <a-table-column title="状态" data-index="isActive" :width="80" align="center">
            <template #cell="{ record }">
              <a-tag v-if="record.isActive === 1" color="green">启用中</a-tag>
              <a-tag v-else color="gray">未启用</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="备注" data-index="remark" :width="150" ellipsis />
          <a-table-column title="更新时间" data-index="updateTime" :width="170" />
          <a-table-column title="操作" :width="200" align="center">
            <template #cell="{ record }">
              <a-space>
                <a-button v-if="record.isActive !== 1" type="text" size="mini" @click="onActivate(record)">激活</a-button>
                <a-button type="text" size="mini" @click="onEdit(record)">编辑</a-button>
                <a-popconfirm v-if="record.isActive !== 1" content="确定删除此配置？" @ok="onDelete(record)">
                  <a-button type="text" status="danger" size="mini">删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      :mask-closable="false"
      :width="520"
      draggable
      @before-ok="onSave"
    >
      <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
        <a-form-item label="地图厂商" field="provider">
          <a-select v-model="form.provider" placeholder="请选择地图厂商">
            <a-option value="AMAP">高德地图</a-option>
            <a-option value="BAIDU">百度地图</a-option>
            <a-option value="TENCENT">腾讯地图</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="API Key" field="apiKey">
          <a-input v-model="form.apiKey" placeholder="请输入Web服务API Key" />
        </a-form-item>
        <a-form-item label="API Secret" field="apiSecret">
          <a-input v-model="form.apiSecret" placeholder="安全密钥(高德数字签名用，可选)" />
        </a-form-item>
        <a-form-item label="JS API Key" field="jsApiKey">
          <a-input v-model="form.jsApiKey" placeholder="前端地图渲染JS API Key(可选，留空则用Web服务Key)" />
        </a-form-item>
        <a-form-item label="API基础URL" field="baseUrl">
          <a-input v-model="form.baseUrl" placeholder="如: https://restapi.amap.com/v3" />
        </a-form-item>
        <a-form-item label="备注" field="remark">
          <a-textarea v-model="form.remark" placeholder="备注信息" :auto-size="{ minRows: 2 }" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import {
  type MapConfigReq,
  type MapConfigResp,
  activateMapConfig,
  addMapConfig,
  deleteMapConfig,
  listMapConfig,
  updateMapConfig,
} from '@/apis/system/map'

const loading = ref(false)
const configList = ref<MapConfigResp[]>([])

// ---- 表格辅助 ----
const providerLabel = (provider: string) => {
  const map: Record<string, string> = { AMAP: '高德', BAIDU: '百度', TENCENT: '腾讯' }
  return map[provider] || provider
}
const providerColor = (provider: string) => {
  const map: Record<string, string> = { AMAP: 'blue', BAIDU: 'red', TENCENT: 'green' }
  return map[provider] || 'gray'
}

// ---- 查询 ----
const loadData = async () => {
  loading.value = true
  try {
    const { data } = await listMapConfig()
    configList.value = data || []
  } catch {
    configList.value = []
  } finally {
    loading.value = false
  }
}

// ---- 弹窗 ----
const modalVisible = ref(false)
const editingId = ref('')
const modalTitle = computed(() => (editingId.value ? '编辑地图配置' : '新增地图配置'))

const form = reactive<MapConfigReq>({
  provider: 'AMAP',
  apiKey: '',
  apiSecret: '',
  jsApiKey: '',
  baseUrl: 'https://restapi.amap.com/v3',
  remark: '',
})

const rules = {
  provider: [{ required: true, message: '请选择地图厂商' }],
  apiKey: [{ required: true, message: '请输入API Key' }],
  baseUrl: [{ required: true, message: '请输入API基础URL' }],
}

const formRef = ref()

const onAdd = () => {
  editingId.value = ''
  Object.assign(form, {
    provider: 'AMAP',
    apiKey: '',
    apiSecret: '',
    jsApiKey: '',
    baseUrl: 'https://restapi.amap.com/v3',
    remark: '',
  })
  modalVisible.value = true
}

const onEdit = (record: MapConfigResp) => {
  editingId.value = record.id
  // 注意: apiKey/apiSecret是脱敏的，编辑时需要重新输入
  Object.assign(form, {
    provider: record.provider,
    apiKey: '', // 脱敏后需重新输入
    apiSecret: '',
    jsApiKey: record.jsApiKey || '',
    baseUrl: record.baseUrl,
    remark: record.remark || '',
  })
  modalVisible.value = true
}

const onSave = async () => {
  try {
    const valid = await formRef.value?.validate()
    if (valid) return false
    if (editingId.value) {
      await updateMapConfig(editingId.value, form)
      Message.success('修改成功')
    } else {
      await addMapConfig(form)
      Message.success('新增成功')
    }
    modalVisible.value = false
    loadData()
    return true
  } catch {
    return false
  }
}

// ---- 激活 ----
const onActivate = async (record: MapConfigResp) => {
  await activateMapConfig(record.id)
  Message.success('激活成功')
  loadData()
}

// ---- 删除 ----
const onDelete = async (record: MapConfigResp) => {
  await deleteMapConfig(record.id)
  Message.success('删除成功')
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss"></style>
