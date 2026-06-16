<template>
  <div class="action-configurator">
    <!-- 可用性过滤 / 禁止组合 -->
    <template v-if="ruleType === 'AVAILABILITY_FILTER' || ruleType === 'FORBIDDEN'">
      <a-form-item label="动作类型" layout="vertical">
        <a-select v-model="localAction.action" placeholder="请选择动作类型">
          <a-option value="FORBIDDEN_OPTIONS">禁止选项</a-option>
          <a-option value="ALLOWED_OPTIONS">仅允许选项</a-option>
        </a-select>
      </a-form-item>

      <a-form-item label="目标属性" layout="vertical">
        <a-select v-model="localAction.target_attribute" placeholder="请选择要限制的属性">
          <a-option value="PAPER_SIZE">纸张尺寸 (PAPER_SIZE)</a-option>
          <a-option value="BINDING_TYPE">装订方式 (BINDING_TYPE)</a-option>
          <a-option value="PRINT_MODE">打印模式 (PRINT_MODE)</a-option>
        </a-select>
      </a-form-item>

      <a-form-item 
        :label="localAction.action === 'FORBIDDEN_OPTIONS' ? '禁止的值' : '允许的值'" 
        layout="vertical"
      >
        <a-input-tag 
          v-model="localAction.forbidden_values" 
          placeholder="请输入值，按回车添加"
          allow-clear
        />
        <template #extra>
          <div style="font-size: 12px; color: #999">
            根据目标属性输入对应的值
            <br/>纸张：A4, A3, A2, A1, A0
            <br/>装订：GLUE(胶装), STAPLER(订书机), SADDLE_STITCH(骑马订)
            <br/>打印：SINGLE_SIDED(单面), DOUBLE_SIDED(双面)
          </div>
        </template>
      </a-form-item>

      <a-form-item label="错误提示" layout="vertical">
        <a-input 
          v-model="localAction.error_message" 
          placeholder="当规则触发时的错误提示信息"
        />
      </a-form-item>
    </template>

    <!-- 价格调整 -->
    <template v-else-if="ruleType === 'PRICE_ADJUST'">
      <a-form-item label="动作类型" layout="vertical">
        <a-select v-model="localAction.action" placeholder="请选择动作类型">
          <a-option value="PRICE_MULTIPLIER">价格倍数</a-option>
          <a-option value="PRICE_FIXED">固定加价</a-option>
          <a-option value="PRICE_DISCOUNT">折扣优惠</a-option>
        </a-select>
      </a-form-item>

      <a-form-item 
        v-if="localAction.action === 'PRICE_MULTIPLIER' || localAction.action === 'PRICE_DISCOUNT'"
        label="倍数/折扣" 
        layout="vertical"
      >
        <a-input-number 
          v-model="localAction.multiplier" 
          :min="0" 
          :step="0.1"
          placeholder="例如：1.5 表示1.5倍，0.8 表示8折"
        />
        <template #extra>
          <div style="font-size: 12px; color: #999">
            大于1表示加价，小于1表示打折
          </div>
        </template>
      </a-form-item>

      <a-form-item 
        v-if="localAction.action === 'PRICE_FIXED'"
        label="固定加价金额" 
        layout="vertical"
      >
        <a-input-number 
          v-model="localAction.fixed_amount" 
          :min="0" 
          :precision="2"
          placeholder="请输入固定加价金额"
        />
      </a-form-item>

      <a-form-item label="描述" layout="vertical">
        <a-input 
          v-model="localAction.description" 
          placeholder="价格调整的描述说明"
        />
      </a-form-item>
    </template>

    <!-- 数值范围约束 -->
    <template v-else-if="ruleType === 'NUMERIC_RANGE'">
      <a-form-item label="目标属性" layout="vertical">
        <a-select v-model="localAction.target_attribute" placeholder="请选择要约束的属性">
          <a-option value="PAGE_COUNT">页数 (PAGE_COUNT)</a-option>
          <a-option value="COPIES">份数 (COPIES)</a-option>
        </a-select>
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="最小值" layout="vertical">
            <a-input-number 
              v-model="localAction.min_value" 
              placeholder="可选"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="最大值" layout="vertical">
            <a-input-number 
              v-model="localAction.max_value" 
              placeholder="可选"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="错误提示" layout="vertical">
        <a-input 
          v-model="localAction.error_message" 
          placeholder="超出范围时的错误提示"
        />
      </a-form-item>
    </template>

    <!-- 未选择规则类型 -->
    <a-alert 
      v-else
      type="warning"
    >
      请先选择规则类型
    </a-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface ActionConfig {
  action?: string
  target_attribute?: string
  forbidden_values?: string[]
  error_message?: string
  multiplier?: number
  fixed_amount?: number
  description?: string
  min_value?: number
  max_value?: number
}

const props = defineProps<{
  modelValue: string | ActionConfig
  ruleType?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 初始化配置
const defaultAction: ActionConfig = {}

const localAction = ref<ActionConfig>(
  typeof props.modelValue === 'string' && props.modelValue
    ? JSON.parse(props.modelValue)
    : (props.modelValue || defaultAction)
)

// 监听变化并转换为 JSON 字符串
watch(
  localAction,
  (newVal) => {
    emit('update:modelValue', JSON.stringify(newVal, null, 2))
  },
  { deep: true }
)

// 监听规则类型变化，重置动作配置
watch(
  () => props.ruleType,
  () => {
    localAction.value = {}
  }
)
</script>

<style scoped lang="scss">
.action-configurator {
  // 样式可根据需要调整
}
</style>
