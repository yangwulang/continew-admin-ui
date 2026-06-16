# 约束规则管理页面重构说明

## 重构概述

将约束规则管理页面的条件配置和动作配置从**JSON文本输入**改为**可视化组件操作**，提升用户体验和配置准确性。

## 主要改动

### 1. 新增可视化配置组件

#### ConditionConfigurator.vue - 条件配置器
**位置**: `src/views/finance/print-constraint-rule/components/ConditionConfigurator.vue`

**功能特性**:
- ✅ 可视化选择逻辑关系（AND/OR）
- ✅ 动态添加/删除条件项
- ✅ 下拉选择属性编码（PAPER_SIZE、BINDING_TYPE等）
- ✅ 下拉选择操作符（EQ、NE、IN、NOT_IN、GT、GTE、LT、LTE）
- ✅ 智能表单切换：
  - 单值操作符（EQ/NE/GT等）→ 显示单个输入框
  - 多值操作符（IN/NOT_IN）→ 显示标签输入框（a-input-tag）
- ✅ 常用值参考提示
- ✅ 自动转换为 JSON 格式

**使用示例**:
```vue
<ConditionConfigurator v-model="formData.conditionConfig" />
```

#### ActionConfigurator.vue - 动作配置器
**位置**: `src/views/finance/print-constraint-rule/components/ActionConfigurator.vue`

**功能特性**:
- ✅ 根据规则类型动态显示不同的配置表单
- ✅ **可用性过滤/禁止组合**:
  - 动作类型选择（禁止选项/仅允许选项）
  - 目标属性选择
  - 值列表输入（a-input-tag）
  - 错误提示配置
- ✅ **价格调整**:
  - 动作类型选择（倍数/固定加价/折扣）
  - 倍数/折扣数值输入
  - 固定金额输入
  - 描述说明
- ✅ **数值范围约束**:
  - 目标属性选择
  - 最小值/最大值输入
  - 错误提示配置
- ✅ 自动转换为 JSON 格式

**使用示例**:
```vue
<ActionConfigurator 
  v-model="formData.actionConfig" 
  :rule-type="formData.ruleType" 
/>
```

### 2. 主页面改造

**文件**: `src/views/finance/print-constraint-rule/index.vue`

**改动内容**:
```vue
<!-- 改造前：JSON文本输入 -->
<a-form-item label="条件配置" field="conditionConfig">
  <a-textarea v-model="formData.conditionConfig" :rows="6" />
</a-form-item>

<!-- 改造后：可视化组件 -->
<ConditionConfigurator v-model="formData.conditionConfig" />
```

## 技术实现

### 数据流设计

```
用户操作可视化组件
    ↓
组件内部状态更新 (localConfig/localAction)
    ↓
watch 监听变化
    ↓
转换为 JSON 字符串
    ↓
emit('update:modelValue', jsonString)
    ↓
父组件接收并保存
```

### 关键代码

#### 条件配置器数据转换
```typescript
watch(
  localConfig,
  (newVal) => {
    emit('update:modelValue', JSON.stringify(newVal, null, 2))
  },
  { deep: true }
)
```

#### 动作配置器规则类型联动
```typescript
watch(
  () => props.ruleType,
  () => {
    localAction.value = {} // 规则类型变化时重置配置
  }
)
```

## 优势对比

### 改造前（JSON输入）
❌ 需要手动编写 JSON，容易出错  
❌ 格式错误难以发现  
❌ 需要记忆字段名称和操作符  
❌ 无实时验证  
❌ 学习成本高  

### 改造后（可视化配置）
✅ 下拉选择，避免拼写错误  
✅ 自动生成标准 JSON 格式  
✅ 字段名称清晰可见  
✅ 实时验证必填项  
✅ 即开即用，零学习成本  
✅ 提供常用值参考提示  

## 支持的配置场景

### 1. A2及以上纸张禁止骑马订
```json
{
  "conditions": [
    {
      "attribute_code": "PAPER_SIZE",
      "operator": "IN",
      "values": ["A2", "A1", "A0"]
    }
  ],
  "logic": "AND"
}
```
动作：
```json
{
  "action": "FORBIDDEN_OPTIONS",
  "target_attribute": "BINDING_TYPE",
  "forbidden_values": ["SADDLE_STITCH"],
  "error_message": "A2及以上纸张不支持骑马订"
}
```

### 2. 大于A3胶装加价50%
```json
{
  "conditions": [
    {
      "attribute_code": "PAPER_SIZE",
      "operator": "IN",
      "values": ["A2", "A1", "A0"]
    },
    {
      "attribute_code": "BINDING_TYPE",
      "operator": "EQ",
      "value": "GLUE"
    }
  ],
  "logic": "AND"
}
```
动作：
```json
{
  "action": "PRICE_MULTIPLIER",
  "multiplier": 1.5,
  "description": "大纸张胶装加价50%"
}
```

### 3. 超过500页禁止双面打印
```json
{
  "conditions": [
    {
      "attribute_code": "PAGE_COUNT",
      "operator": "GT",
      "value": 500
    }
  ],
  "logic": "AND"
}
```
动作：
```json
{
  "action": "FORBIDDEN_OPTIONS",
  "target_attribute": "PRINT_MODE",
  "forbidden_values": ["DOUBLE_SIDED"],
  "error_message": "超过500页不支持双面打印"
}
```

## 后续优化建议

1. **属性选项动态加载**: 从后端API获取可用属性列表，而不是硬编码
2. **配置预览**: 在配置过程中实时显示生成的JSON
3. **模板快速创建**: 提供常用规则模板，一键填充
4. **配置验证**: 提交前进行更严格的业务逻辑验证
5. **批量操作**: 支持规则的导入导出

## 注意事项

1. 组件内部会自动处理 JSON 的序列化和反序列化
2. 当规则类型改变时，动作配置会自动重置
3. 所有配置最终都会转换为 JSON 字符串存储到数据库
4. 确保至少添加一个条件，否则会有警告提示

## 相关文件

- 主页面: `src/views/finance/print-constraint-rule/index.vue`
- 条件配置器: `src/views/finance/print-constraint-rule/components/ConditionConfigurator.vue`
- 动作配置器: `src/views/finance/print-constraint-rule/components/ActionConfigurator.vue`
