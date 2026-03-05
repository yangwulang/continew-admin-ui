<template>
  <a-form
    ref="formRef"
    :model="form"
    :rules="rules"
    :label-col-style="{ display: 'none' }"
    :wrapper-col-style="{ flex: 1 }"
    size="large"
    @submit="handleRegister"
  >
    <a-form-item v-if="tenantStore.needInputTenantCode" field="tenantCode" hide-label>
      <a-input v-model="tenantCode" placeholder="请输入租户编码（不输入时为默认租户）" allow-clear />
    </a-form-item>
    <a-form-item field="username" hide-label>
      <a-input v-model="form.username" placeholder="请输入用户名" allow-clear />
    </a-form-item>
    <a-form-item field="nickname" hide-label>
      <a-input v-model="form.nickname" placeholder="请输入昵称" allow-clear />
    </a-form-item>
    <a-form-item field="password" hide-label>
      <a-input-password v-model="form.password" placeholder="请输入密码" />
    </a-form-item>
    <a-form-item field="confirmPassword" hide-label>
      <a-input-password v-model="form.confirmPassword" placeholder="请再次输入密码" />
    </a-form-item>
    <a-form-item field="phone" hide-label>
      <a-input v-model="form.phone" placeholder="请输入手机号" allow-clear />
    </a-form-item>
    <a-form-item field="captcha" hide-label>
      <a-input v-model="form.captcha" placeholder="请输入验证码" :max-length="4" allow-clear style="flex: 1 1" />
      <div class="captcha-container" @click="getCaptcha">
        <img :src="captchaImgBase64" alt="验证码" class="captcha" />
        <div v-if="form.expired" class="overlay">
          <p>已过期，请刷新</p>
        </div>
      </div>
    </a-form-item>
    <a-form-item>
      <a-space direction="vertical" fill class="w-full">
        <a-button class="btn" type="primary" :loading="loading" html-type="submit" size="large" long>注册</a-button>
      </a-space>
    </a-form-item>
    <a-form-item>
      <a-row justify="center" class="w-full">
        <a-link @click="emit('switch-to-login')">已有账号？返回登录</a-link>
      </a-row>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { type FormInstance, Message } from '@arco-design/web-vue'
import { getImageCaptcha } from '@/apis/common'
import { register } from '@/apis/auth'
import { encryptByRsa } from '@/utils/encrypt'
import { useTenantStore } from '@/stores/modules/tenant'

const emit = defineEmits(['switch-to-login'])
const tenantStore = useTenantStore()
const tenantCode = ref()

const captchaImgBase64 = ref()
const formRef = ref<FormInstance>()
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  phone: '',
  captcha: '',
  uuid: '',
  expired: false,
})

const rules: FormInstance['rules'] = {
  username: [{ required: true, message: '请输入用户名' }],
  nickname: [{ required: true, message: '请输入昵称' }],
  password: [
    { required: true, message: '请输入密码' },
    { minLength: 8, maxLength: 32, message: '密码长度为 8-32 个字符' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码' },
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (value !== form.password) {
          callback('两次输入的密码不一致')
        } else {
          callback()
        }
      },
    },
  ],
  phone: [
    { required: true, message: '请输入手机号' },
    { match: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
  ],
  captcha: [{ required: true, message: '请输入验证码' }],
}

// 验证码过期定时器
let timer: ReturnType<typeof setTimeout> | undefined
const startTimer = (expireTime: number, curTime = Date.now()) => {
  if (timer) {
    clearTimeout(timer)
  }
  const remainingTime = expireTime - curTime
  if (remainingTime <= 0) {
    form.expired = true
    return
  }
  timer = setTimeout(() => {
    form.expired = true
  }, remainingTime)
}
onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer)
  }
})

// 获取验证码
const getCaptcha = () => {
  getImageCaptcha().then((res) => {
    const { uuid, img, expireTime, isEnabled: _isEnabled } = res.data
    captchaImgBase64.value = img
    form.uuid = uuid
    form.expired = false
    startTimer(expireTime, Number(res.timestamp))
  })
}

const loading = ref(false)
// 注册
const handleRegister = async () => {
  try {
    const isInvalid = await formRef.value?.validate()
    if (isInvalid) return
    loading.value = true
    await register({
      username: form.username,
      password: encryptByRsa(form.password) || '',
      nickname: form.nickname,
      phone: form.phone,
      captcha: form.captcha,
      uuid: form.uuid,
    }, tenantCode.value)
    Message.success('注册成功，请登录')
    // 触发返回登录
    formRef.value?.resetFields()
    emit('switch-to-login')
  } catch (error) {
    console.error(error)
    getCaptcha()
    form.captcha = ''
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getCaptcha()
})
</script>

<style scoped lang="scss">
.arco-input-wrapper,
:deep(.arco-select-view-single) {
  height: 40px;
  border-radius: 4px;
  font-size: 13px;
}

.arco-input-wrapper.arco-input-error {
  background-color: rgb(var(--danger-1));
  border-color: rgb(var(--danger-3));
}

.arco-input-wrapper.arco-input-error:hover {
  background-color: rgb(var(--danger-1));
  border-color: rgb(var(--danger-6));
}

.arco-input-wrapper :deep(.arco-input) {
  font-size: 13px;
  color: var(--color-text-1);
}

.arco-input-wrapper:hover {
  border-color: rgb(var(--arcoblue-6));
}

.captcha {
  width: 111px;
  height: 36px;
  margin: 0 0 0 5px;
}

.btn {
  height: 40px;
}

.captcha-container {
  position: relative;
  display: flex;
  cursor: pointer;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(51, 51, 51, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
}

.overlay p {
  font-size: 12px;
  color: white;
}
</style>
