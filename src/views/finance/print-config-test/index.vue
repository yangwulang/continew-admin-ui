<template>
  <div style="padding: 20px">
    <a-card title="打印配置测试（规则引擎）" :bordered="false">
      <a-form :model="formState" layout="vertical">
        <!-- 动态渲染所有属性选择器 -->
        <a-form-item 
          v-for="attr in attributes" 
          :key="attr.code" 
          :label="attr.name" 
          :field="attr.code"
        >
          <a-select 
            v-if="attr.type !== 'number'"
            v-model="formState[attr.code]" 
            :placeholder="`请选择${attr.name}`"
            :options="availableOptions[attr.code]"
            @change="onAttributeChange(attr.code)"
          />
          <a-input-number 
            v-else
            v-model="formState[attr.code]"
            :placeholder="`请输入${attr.name}`"
            :min="1"
            @change="onAttributeChange(attr.code)"
          />
        </a-form-item>
        
        <!-- 实时价格显示 -->
        <a-alert v-if="calculatedPrice > 0" type="info" style="margin-top: 16px">
          预估价格：¥{{ calculatedPrice.toFixed(2) }}
        </a-alert>
        
        <!-- 验证结果 -->
        <a-alert v-if="validationResult && !validationResult.valid" type="error" style="margin-top: 16px">
          <template #title>
            <div>配置验证失败：</div>
            <ul style="margin: 8px 0 0 20px">
              <li v-for="(msg, index) in validationResult.violations" :key="index">{{ msg }}</li>
            </ul>
          </template>
        </a-alert>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { 
  getAvailableOptions, 
  calculatePrintPrice,
  validatePrintConfig
} from '@/apis/finance/printConfigRule'

// 属性定义
const attributes = ref([
  { code: 'PAPER_SIZE', name: '纸张尺寸', type: 'select' },
  { code: 'BINDING_TYPE', name: '装订方式', type: 'select' },
  { code: 'PRINT_MODE', name: '打印方式', type: 'select' },
  { code: 'PAGE_COUNT', name: '页数', type: 'number' },
  { code: 'COPIES', name: '份数', type: 'number' }
])

const formState = ref<Record<string, any>>({
  PAPER_SIZE: '',
  BINDING_TYPE: '',
  PRINT_MODE: '',
  PAGE_COUNT: 10,
  COPIES: 1
})

const availableOptions = ref<Record<string, any[]>>({})
const calculatedPrice = ref<number>(0)
const validationResult = ref<{ valid: boolean; violations: string[] } | null>(null)

// 属性变化时的处理
const onAttributeChange = async (changedAttrCode: string) => {
  try {
    // 重新加载所有其他属性的可用选项
    await refreshAvailableOptions(changedAttrCode)
    
    // 验证配置
    await validateConfiguration()
    
    // 重新计算价格
    await calculatePrice()
  } catch (error) {
    console.error('处理属性变化失败', error)
  }
}

// 刷新可用选项
const refreshAvailableOptions = async (excludeAttrCode?: string) => {
  const currentAttributes = { ...formState.value }
  
  for (const attr of attributes.value) {
    if (attr.code === excludeAttrCode) continue
    
    // 跳过数值类型属性
    if (attr.type === 'number') continue
    
    try {
      const options = await getAvailableOptions(attr.code, currentAttributes)
      availableOptions.value[attr.code] = options.map(code => ({
        label: getOptionLabel(attr.code, code),
        value: code
      }))
      
      // 如果当前选中的选项不可用，重置为空
      if (!options.includes(formState.value[attr.code])) {
        formState.value[attr.code] = ''
      }
    } catch (error) {
      console.error(`加载${attr.name}选项失败`, error)
    }
  }
}

// 验证配置
const validateConfiguration = async () => {
  // 检查必填项
  const requiredAttrs = attributes.value.filter(attr => attr.type !== 'number')
  for (const attr of requiredAttrs) {
    if (!formState.value[attr.code]) {
      validationResult.value = null
      return
    }
  }
  
  try {
    validationResult.value = await validatePrintConfig(formState.value)
  } catch (error) {
    console.error('验证配置失败', error)
  }
}

// 计算价格
const calculatePrice = async () => {
  // 检查必填项
  const requiredAttrs = attributes.value.filter(attr => attr.type !== 'number')
  for (const attr of requiredAttrs) {
    if (!formState.value[attr.code]) {
      calculatedPrice.value = 0
      return
    }
  }
  
  try {
    const price = await calculatePrintPrice(formState.value)
    calculatedPrice.value = price
  } catch (error) {
    console.error('价格计算失败', error)
    calculatedPrice.value = 0
  }
}

// 获取选项标签
const getOptionLabel = (attributeCode: string, optionCode: string): string => {
  // 这里可以根据需要从后端获取或本地映射
  const labels: Record<string, Record<string, string>> = {
    PAPER_SIZE: {
      A4: 'A4',
      A3: 'A3',
      A2: 'A2',
      A1: 'A1',
      A0: 'A0'
    },
    BINDING_TYPE: {
      GLUE: '胶装',
      STAPLER: '订书机钉',
      SADDLE_STITCH: '骑马订'
    },
    PRINT_MODE: {
      SINGLE_SIDED: '单面',
      DOUBLE_SIDED: '双面'
    }
  }
  
  return labels[attributeCode]?.[optionCode] || optionCode
}

// 监听所有属性变化
watch(() => formState.value, () => {
  calculatePrice()
  validateConfiguration()
}, { deep: true })

// 初始化
onMounted(() => {
  refreshAvailableOptions()
})
</script>

<style scoped>
ul {
  padding-left: 20px;
}
</style>
