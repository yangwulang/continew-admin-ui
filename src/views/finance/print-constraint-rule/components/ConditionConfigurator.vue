<template>
  <div class="condition-configurator">
    <!-- 逻辑关系选择 -->
    <a-card size="small" style="margin-bottom: 16px">
      <a-space>
        <span style="font-weight: 500">条件组合方式：</span>
        <a-radio-group v-model="localConfig.logic" size="small">
          <a-radio value="AND">全部满足（AND）</a-radio>
          <a-radio value="OR">任一满足（OR）</a-radio>
        </a-radio-group>
      </a-space>
    </a-card>

    <!-- 可拖拽的条件列表 -->
    <Draggable
      v-model="localConfig.conditions"
      :animation="200"
      handle=".drag-handle"
      ghost-class="drag-ghost"
      chosen-class="drag-chosen"
      @end="onDragEnd"
    >
      <template #default>
        <div 
          v-for="(condition, index) in localConfig.conditions" 
          :key="index"
          class="condition-card-wrapper"
        >
          <!-- 连接符显示 -->
          <div v-if="index > 0" class="logic-connector">
            <a-tag :color="localConfig.logic === 'AND' ? 'blue' : 'orange'" size="large">
              {{ localConfig.logic === 'AND' ? '且' : '或' }}
            </a-tag>
          </div>

          <a-card 
            size="small" 
            class="condition-card"
            :class="{ 'first-card': index === 0 }"
          >
            <template #title>
              <div class="card-header">
                <icon-drag-dot-vertical class="drag-handle" />
                <span class="condition-title">条件 {{ index + 1 }}</span>
                <a-space style="margin-left: auto">
                  <a-button 
                    type="text" 
                    size="mini" 
                    @click="duplicateCondition(index)"
                    title="复制此条件"
                  >
                    <template #icon><icon-copy /></template>
                  </a-button>
                  <a-button 
                    type="text" 
                    size="mini" 
                    status="danger" 
                    @click="removeCondition(index)"
                    title="删除此条件"
                  >
                    <template #icon><icon-delete /></template>
                  </a-button>
                </a-space>
              </div>
            </template>

            <div class="condition-content">
              <a-row :gutter="12">
                <!-- 属性选择 -->
                <a-col :span="8">
                  <div class="form-field">
                    <label class="field-label">属性</label>
                    <a-select 
                      v-model="condition.attribute_code" 
                      placeholder="选择属性"
                      allow-search
                      size="small"
                    >
                      <a-option value="PAPER_SIZE">
                        <a-space>
                          <icon-file />
                          <span>纸张尺寸</span>
                        </a-space>
                      </a-option>
                      <a-option value="BINDING_TYPE">
                        <a-space>
                          <icon-scissor />
                          <span>装订方式</span>
                        </a-space>
                      </a-option>
                      <a-option value="PRINT_MODE">
                        <a-space>
                          <icon-printer />
                          <span>打印模式</span>
                        </a-space>
                      </a-option>
                      <a-option value="PAGE_COUNT">
                        <a-space>
                          <icon-safe />
                          <span>页数</span>
                        </a-space>
                      </a-option>
                      <a-option value="COPIES">
                        <a-space>
                          <icon-storage />
                          <span>份数</span>
                        </a-space>
                      </a-option>
                    </a-select>
                  </div>
                </a-col>

                <!-- 操作符选择 -->
                <a-col :span="6">
                  <div class="form-field">
                    <label class="field-label">操作符</label>
                    <a-select 
                      v-model="condition.operator" 
                      placeholder="操作符"
                      size="small"
                    >
                      <a-option value="EQ">等于</a-option>
                      <a-option value="NE">不等于</a-option>
                      <a-option value="IN">包含于</a-option>
                      <a-option value="NOT_IN">不包含于</a-option>
                      <a-option value="GT">大于</a-option>
                      <a-option value="GTE">大于等于</a-option>
                      <a-option value="LT">小于</a-option>
                      <a-option value="LTE">小于等于</a-option>
                    </a-select>
                  </div>
                </a-col>

                <!-- 值输入 -->
                <a-col :span="10">
                  <div class="form-field">
                    <label class="field-label">值</label>
                    <!-- 单值输入 -->
                    <a-input 
                      v-if="['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE'].includes(condition.operator)"
                      v-model="condition.value" 
                      placeholder="输入值"
                      size="small"
                      allow-clear
                    />
                    <!-- 多值输入 -->
                    <a-input-tag 
                      v-else-if="['IN', 'NOT_IN'].includes(condition.operator)"
                      v-model="condition.values" 
                      placeholder="输入多个值，回车添加"
                      size="small"
                      allow-clear
                    />
                    <!-- 未选择操作符 -->
                    <a-input 
                      v-else
                      disabled
                      placeholder="请先选择操作符"
                      size="small"
                    />
                  </div>
                </a-col>
              </a-row>

              <!-- 值提示 -->
              <div v-if="['IN', 'NOT_IN'].includes(condition.operator)" class="value-hints">
                <a-space wrap size="mini">
                  <a-tag size="small" color="gray">常用值：</a-tag>
                  <a-tag size="small" color="arcoblue">A4</a-tag>
                  <a-tag size="small" color="arcoblue">A3</a-tag>
                  <a-tag size="small" color="arcoblue">GLUE</a-tag>
                  <a-tag size="small" color="arcoblue">SADDLE_STITCH</a-tag>
                </a-space>
              </div>
            </div>
          </a-card>
        </div>
      </template>
    </Draggable>

    <!-- 添加条件按钮 -->
    <a-button 
      type="dashed" 
      long
      style="margin-top: 16px"
      @click="addCondition"
    >
      <template #icon><icon-plus /></template>
      添加条件
    </a-button>

    <!-- 空状态提示 -->
    <a-empty 
      v-if="localConfig.conditions.length === 0"
      description="暂无条件，请点击上方按钮添加"
      style="margin-top: 24px"
    />

    <!-- 配置预览（可选） -->
    <a-collapse v-if="showPreview" style="margin-top: 16px">
      <a-collapse-item header="JSON 预览" key="preview">
        <a-code-view :code="JSON.stringify(localConfig, null, 2)" language="json" />
      </a-collapse-item>
    </a-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  IconDelete,
  IconPlus,
  IconCopy,
  IconDragDotVertical,
  IconFile,
  IconScissor,
  IconPrinter,
  IconSafe,
  IconStorage
} from '@arco-design/web-vue/es/icon'
import { VueDraggable as Draggable } from 'vue-draggable-plus'

interface ConditionItem {
  attribute_code: string
  operator: string
  value?: any
  values?: string[]
}

interface ConditionConfig {
  conditions: ConditionItem[]
  logic: 'AND' | 'OR'
}

const props = defineProps<{
  modelValue: string | ConditionConfig
  showPreview?: boolean // 是否显示JSON预览
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 初始化配置
const defaultConfig: ConditionConfig = {
  conditions: [],
  logic: 'AND'
}

const localConfig = ref<ConditionConfig>(
  typeof props.modelValue === 'string' && props.modelValue
    ? JSON.parse(props.modelValue)
    : (props.modelValue || defaultConfig)
)

// 添加条件
const addCondition = () => {
  localConfig.value.conditions.push({
    attribute_code: '',
    operator: 'EQ',
    value: ''
  })
}

// 删除条件
const removeCondition = (index: number) => {
  localConfig.value.conditions.splice(index, 1)
}

// 复制条件
const duplicateCondition = (index: number) => {
  const source = localConfig.value.conditions[index]
  const copy = JSON.parse(JSON.stringify(source))
  localConfig.value.conditions.splice(index + 1, 0, copy)
}

// 拖拽结束
const onDragEnd = () => {
  console.log('条件顺序已调整')
}

// 监听变化并转换为 JSON 字符串
watch(
  localConfig,
  (newVal) => {
    emit('update:modelValue', JSON.stringify(newVal, null, 2))
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.condition-configurator {
  .logic-connector {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px 0;
    position: relative;
    z-index: 1;

    &::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--color-border-2);
      transform: translateX(-50%);
      z-index: -1;
    }
  }

  .condition-card-wrapper {
    position: relative;
  }

  .condition-card {
    transition: all 0.3s ease;
    border: 2px solid transparent;

    &:hover {
      border-color: var(--color-primary-light-3);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &.first-card {
      margin-top: 0;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .drag-handle {
      cursor: move;
      color: var(--color-text-3);
      font-size: 16px;
      transition: color 0.2s;

      &:hover {
        color: var(--color-primary);
      }
    }

    .condition-title {
      font-weight: 500;
      flex: 1;
    }
  }

  .condition-content {
    .form-field {
      margin-bottom: 8px;

      .field-label {
        display: block;
        font-size: 12px;
        color: var(--color-text-3);
        margin-bottom: 4px;
      }
    }

    .value-hints {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed var(--color-border-2);
    }
  }

  // 拖拽样式
  :deep(.drag-ghost) {
    opacity: 0.5;
    background: var(--color-fill-2);
  }

  :deep(.drag-chosen) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
</style>
