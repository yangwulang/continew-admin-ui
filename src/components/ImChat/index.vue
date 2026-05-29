<template>
  <a-modal
    v-model:visible="visible"
    title-align="start"
    :width="980"
    :body-style="{ padding: 0, height: '640px', overflow: 'hidden' }"
    :footer="false"
    modal-class="im-chat-modal"
    :mask-closable="false"
    unmount-on-close
    @before-close="handleBeforeClose"
  >
    <template #title>
      <a-space>
        <icon-message />
        <span>消息中心</span>
        <a-tag v-if="isConnected" color="green" size="small">在线</a-tag>
        <a-tag v-else color="red" size="small">离线</a-tag>
      </a-space>
    </template>

    <div class="im-chat">
      <!-- 左侧：会话列表 -->
      <div class="im-side">
        <div class="im-side__head">
          <a-input-search v-model="convKeyword" placeholder="搜索会话" allow-clear size="small" />
          <a-tooltip content="发起单聊">
            <a-button size="small" class="ml-2" @click="openP2PPicker">
              <template #icon>
                <icon-user-add />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip content="发起群聊">
            <a-button size="small" class="ml-2" @click="openGroupCreate">
              <template #icon>
                <icon-plus />
              </template>
            </a-button>
          </a-tooltip>
        </div>
        <a-spin :loading="convLoading" class="im-side__list">
          <div
            v-for="conv in filteredConvs"
            :key="conv.convId"
            class="im-conv-item"
            :class="{ active: currentConvId === conv.convId, pinned: conv.pinned }"
            @click="selectConv(conv)"
            @contextmenu.prevent="onConvContextMenu($event, conv)"
          >
            <a-badge :count="conv.unreadCount || 0" :max-count="99">
              <Avatar :src="conv.targetAvatar" :name="conv.targetName || conv.convId" :size="40" />
            </a-badge>
            <div class="im-conv-item__body">
              <div class="im-conv-item__title">
                <span class="name">{{ getConvName(conv) }}</span>
                <span class="time">{{ formatTime(conv.lastTime) }}</span>
              </div>
              <div class="im-conv-item__preview">
                <icon-mute-fill v-if="conv.muted" :size="12" />
                <span class="preview">{{ conv.lastPreview || '暂无消息' }}</span>
              </div>
            </div>
          </div>
          <a-empty v-if="!convLoading && filteredConvs.length === 0" description="暂无会话" />
        </a-spin>
      </div>

      <!-- 右侧：聊天面板 -->
      <div class="im-main">
        <template v-if="currentConv">
          <div class="im-main__head">
            <div class="title">
              <Avatar :src="currentConv.targetAvatar" :name="currentConv.targetName || ''" :size="32" />
              <span class="name">{{ getConvName(currentConv) }}</span>
              <a-tag v-if="currentConv.convType === 'GROUP'" size="small">群聊</a-tag>
            </div>
            <a-space>
              <a-tooltip v-if="currentConv.convType === 'GROUP'" content="群成员管理">
                <a-button size="small" type="text" @click="openGroupInfo">
                  <template #icon>
                    <icon-user-group />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip :content="currentConv.muted ? '取消免打扰' : '免打扰'">
                <a-button size="small" type="text" @click="toggleMute">
                  <template #icon>
                    <icon-mute-fill v-if="currentConv.muted" />
                    <icon-sound-fill v-else />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip :content="currentConv.pinned ? '取消置顶' : '置顶'">
                <a-button size="small" type="text" @click="togglePin">
                  <template #icon>
                    <icon-pushpin />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip content="清空未读">
                <a-button size="small" type="text" @click="clearUnread">
                  <template #icon>
                    <icon-eye />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip content="删除会话">
                <a-button size="small" type="text" status="danger" @click="hideConv">
                  <template #icon>
                    <icon-delete />
                  </template>
                </a-button>
              </a-tooltip>
            </a-space>
          </div>

          <!-- 消息列表 -->
          <div ref="msgListRef" class="im-main__messages" @scroll="onMsgScroll">
            <div v-if="hasMoreHistory && !msgLoading" class="im-main__load-more">
              <a-link size="small" @click="loadHistory()">加载更多历史</a-link>
            </div>
            <a-spin v-if="msgLoading" />
            <div
              v-for="msg in messages"
              :key="String(msg.msgId)"
              class="im-msg"
              :class="{ self: String(msg.fromUserId) === currentUserId }"
            >
              <Avatar :name="String(msg.fromUserId)" :size="32" class="im-msg__avatar" />
              <div class="im-msg__bubble">
                <!-- 引用 -->
                <div v-if="msg.quoteMsgId" class="im-msg__quote">
                  引用消息 #{{ msg.quoteMsgId }}
                </div>
                <!-- 已撤回 -->
                <div v-if="msg.status === 'RECALLED'" class="im-msg__recalled">
                  消息已撤回
                </div>
                <template v-else>
                  <!-- 文本 -->
                  <div v-if="msg.msgType === 'TEXT'" class="im-msg__text">
                    {{ msg.content }}
                  </div>
                  <!-- 图片 -->
                  <a-image
                    v-else-if="msg.msgType === 'IMAGE'"
                    :src="msg.attach?.url"
                    width="180"
                    fit="cover"
                  />
                  <!-- 文件 -->
                  <div v-else-if="msg.msgType === 'FILE'" class="im-msg__file">
                    <icon-file :size="20" />
                    <a :href="msg.attach?.url" target="_blank">{{ msg.attach?.name }}</a>
                    <span class="size">{{ formatFileSize(msg.attach?.size) }}</span>
                  </div>
                  <!-- 系统 -->
                  <div v-else-if="msg.msgType === 'SYSTEM'" class="im-msg__sys">
                    {{ msg.content }}
                  </div>
                </template>
                <div class="im-msg__meta">
                  <span class="t">{{ formatTime(msg.serverTime) }}</span>
                  <a-dropdown
                    v-if="String(msg.fromUserId) === currentUserId && msg.status === 'NORMAL' && canRecall(msg)"
                    trigger="hover"
                  >
                    <icon-more class="im-msg__more" />
                    <template #content>
                      <a-doption @click="quoteMsg(msg)">引用</a-doption>
                      <a-doption @click="recallMsg(msg)">撤回</a-doption>
                    </template>
                  </a-dropdown>
                  <a-dropdown v-else-if="msg.status === 'NORMAL'" trigger="hover">
                    <icon-more class="im-msg__more" />
                    <template #content>
                      <a-doption @click="quoteMsg(msg)">引用</a-doption>
                    </template>
                  </a-dropdown>
                </div>
              </div>
            </div>
            <div v-if="typingHint" class="im-typing">{{ typingHint }}</div>
          </div>

          <!-- 输入区 -->
          <div class="im-main__input">
            <div v-if="quoteTarget" class="im-input__quote">
              <span>引用：{{ quoteTarget.content || quoteTarget.attach?.name || '消息' }}</span>
              <icon-close @click="quoteTarget = null" />
            </div>
            <div class="im-input__tools">
              <a-upload
                action="/dev-api/system/file/upload"
                :show-file-list="false"
                accept="image/*"
                :headers="uploadHeaders"
                :on-before-upload="() => true"
                @success="(res: any) => onUploadSuccess(res, 'IMAGE')"
              >
                <template #upload-button>
                  <a-tooltip content="发送图片">
                    <a-button type="text" size="small">
                      <template #icon>
                        <icon-image />
                      </template>
                    </a-button>
                  </a-tooltip>
                </template>
              </a-upload>
              <a-upload
                action="/dev-api/system/file/upload"
                :show-file-list="false"
                :headers="uploadHeaders"
                @success="(res: any) => onUploadSuccess(res, 'FILE')"
              >
                <template #upload-button>
                  <a-tooltip content="发送文件">
                    <a-button type="text" size="small">
                      <template #icon>
                        <icon-attachment />
                      </template>
                    </a-button>
                  </a-tooltip>
                </template>
              </a-upload>
            </div>
            <a-textarea
              v-model="inputText"
              :auto-size="{ minRows: 2, maxRows: 4 }"
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              allow-clear
              @keydown="onInputKeydown"
              @input="onInputTyping"
            />
            <div class="im-input__footer">
              <a-button type="primary" :disabled="!inputText.trim()" @click="sendText">发送</a-button>
            </div>
          </div>
        </template>
        <a-empty v-else description="选择一个会话开始聊天" class="im-empty" />
      </div>
    </div>

    <!-- 发起单聊：选择用户 -->
    <a-modal
      v-model:visible="p2pPickerVisible"
      title="发起单聊"
      :width="520"
      :footer="false"
      unmount-on-close
    >
      <a-input-search
        v-model="p2pKeyword"
        placeholder="搜索用户昵称/用户名"
        allow-clear
        @input="onP2PSearch"
        @search="onP2PSearch"
      />
      <a-spin :loading="p2pUserLoading" class="im-p2p-list">
        <div
          v-for="u in p2pUserList"
          :key="u.id"
          class="im-p2p-item"
          @click="startP2PChat(u)"
        >
          <Avatar :src="u.avatar" :name="u.nickname || u.username" :size="36" />
          <div class="im-p2p-item__body">
            <div class="im-p2p-item__title">
              <span class="name">{{ u.nickname || u.username }}</span>
              <span class="im-p2p-item__sub">@{{ u.username }}</span>
            </div>
            <div v-if="u.email" class="im-p2p-item__desc">{{ u.email }}</div>
          </div>
        </div>
        <a-empty v-if="!p2pUserLoading && p2pUserList.length === 0" description="暂无用户" />
      </a-spin>
    </a-modal>

    <!-- 创建群聊抽屉 -->
    <a-modal
      v-model:visible="groupCreateVisible"
      title="发起群聊"
      :width="720"
      @ok="confirmCreateGroup"
    >
      <a-form :model="groupForm" layout="vertical">
        <a-form-item label="群名称" required>
          <a-input v-model="groupForm.name" placeholder="请输入群名称" />
        </a-form-item>
        <a-form-item label="群类型">
          <a-radio-group v-model="groupForm.type">
            <a-radio value="CUSTOM">自定义</a-radio>
            <a-radio value="DEPT">部门群</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="groupForm.type === 'DEPT'" label="所属部门">
          <a-tree-select
            v-model="groupForm.deptId"
            :data="deptTree"
            placeholder="请选择部门"
            allow-search
            allow-clear
          />
        </a-form-item>
        <a-form-item label="群成员">
          <a-select
            v-model="groupForm.memberIds"
            multiple
            placeholder="选择成员"
            allow-search
            :options="userOptions"
            :loading="userLoading"
            @search="searchUsers"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 群信息抽屉 -->
    <a-drawer
      v-model:visible="groupInfoVisible"
      :width="380"
      title="群成员"
      unmount-on-close
    >
      <a-list>
        <a-list-item v-for="uid in groupMembers" :key="uid">
          <a-space>
            <Avatar :name="String(uid)" :size="28" />
            <span>用户 #{{ uid }}</span>
          </a-space>
          <template
            v-if="currentGroup && String(currentGroup.ownerId) === currentUserId && String(uid) !== currentUserId"
            #actions
          >
            <a-button size="mini" status="danger" @click="kickMember(uid)">移除</a-button>
          </template>
        </a-list-item>
      </a-list>
      <template v-if="currentGroup && String(currentGroup.ownerId) === currentUserId" #footer>
        <a-button long type="primary" @click="openInvite">邀请成员</a-button>
      </template>
    </a-drawer>

    <!-- 邀请成员 -->
    <a-modal v-model:visible="inviteVisible" title="邀请成员" @ok="confirmInvite">
      <a-select
        v-model="inviteUserIds"
        multiple
        placeholder="选择成员"
        allow-search
        :options="userOptions"
        :loading="userLoading"
        @search="searchUsers"
      />
    </a-modal>

    <!-- 会话右键菜单 -->
    <div
      v-if="convCtxMenu.visible"
      class="im-ctx-menu"
      :style="{ left: `${convCtxMenu.x}px`, top: `${convCtxMenu.y}px` }"
      @click="convCtxMenu.visible = false"
    >
      <div class="item" @click="ctxPin">{{ convCtxMenu.conv?.pinned ? '取消置顶' : '置顶' }}</div>
      <div class="item" @click="ctxMute">{{ convCtxMenu.conv?.muted ? '取消免打扰' : '免打扰' }}</div>
      <div class="item" @click="ctxClear">清空未读</div>
      <div class="item danger" @click="ctxHide">删除会话</div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Avatar from '@/components/Avatar/index.vue'
import {
  type ImConversationVO,
  type ImGroupVO,
  type ImMessageVO,
  type ImPacket,
  clearImUnread,
  createImGroup,
  getImGroup,
  hideImConversation,
  inviteImGroupMembers,
  kickImGroupMembers,
  listImConversation,
  listImGroupMembers,
  listImMessage,
  muteImConversation,
  pinImConversation,
  readImMessage,
  recallImMessage,
  sendImMessage,
} from '@/apis/im'
import { listAllUser } from '@/apis/system/user'
import { listDept } from '@/apis/system/dept'
import { useImSocket } from '@/components/ImChat/useImSocket'
import { setImUnreadTotal } from '@/components/ImChat/useImUnread'
import { useUserStore } from '@/stores'
import { getToken } from '@/utils/auth'

defineOptions({ name: 'ImChat' })

const userStore = useUserStore()
const currentUserId = computed(() => String(userStore.userInfo.id))
const visible = ref(false)

// ===== Socket =====
const socket = useImSocket()
const { isConnected, bus } = socket

// ===== 会话列表 =====
const conversations = ref<ImConversationVO[]>([])
const convLoading = ref(false)
const convKeyword = ref('')

const filteredConvs = computed(() => {
  const list = [...conversations.value]
  list.sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1
    return (b.lastTime ?? '').localeCompare(a.lastTime ?? '')
  })
  const kw = convKeyword.value.trim().toLowerCase()
  if (!kw) return list
  return list.filter((c) => (c.targetName || c.convId).toLowerCase().includes(kw))
})

async function loadConvs() {
  convLoading.value = true
  try {
    const { data } = await listImConversation()
    conversations.value = data
  } finally {
    convLoading.value = false
  }
}

function getConvName(c: ImConversationVO) {
  if (c.targetName) return c.targetName
  if (c.convType === 'GROUP') return `群聊 #${c.targetId}`
  return `用户 #${c.targetId}`
}

function formatTime(t?: string) {
  if (!t) return ''
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return ''
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return d.toTimeString().slice(0, 5)
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatFileSize(size?: number) {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

// ===== 当前会话 / 消息列表 =====
const currentConvId = ref('')
const currentConv = computed(() => conversations.value.find((c) => c.convId === currentConvId.value))
const messages = ref<ImMessageVO[]>([])
const msgLoading = ref(false)
const hasMoreHistory = ref(true)
const msgListRef = ref<HTMLElement>()
const quoteTarget = ref<ImMessageVO | null>(null)
const inputText = ref('')

function scrollToBottom() {
  if (msgListRef.value) {
    msgListRef.value.scrollTop = msgListRef.value.scrollHeight
  }
}

async function loadHistory(initial = false) {
  if (!currentConvId.value || msgLoading.value || !hasMoreHistory.value) return
  msgLoading.value = true
  try {
    const before = initial ? undefined : messages.value[0]?.msgId
    const { data } = await listImMessage(currentConvId.value, before, 20)
    if (data.length < 20) hasMoreHistory.value = false
    const ordered = [...data].reverse()
    messages.value = [...ordered, ...messages.value]
    if (initial) {
      const last = ordered[ordered.length - 1]
      if (last) {
        readImMessage(currentConvId.value, last.msgId).catch(() => null)
        socket.wsReportRead(currentConvId.value, last.msgId)
      }
      await nextTick()
      scrollToBottom()
    }
  } finally {
    msgLoading.value = false
  }
}

async function selectConv(conv: ImConversationVO) {
  if (currentConvId.value === conv.convId) return
  currentConvId.value = conv.convId
  messages.value = []
  hasMoreHistory.value = true
  quoteTarget.value = null
  inputText.value = ''
  await loadHistory(true)
  if (conv.unreadCount && conv.unreadCount > 0) {
    await clearImUnread(conv.convId)
    conv.unreadCount = 0
  }
}

function onMsgScroll() {
  if (msgListRef.value && msgListRef.value.scrollTop === 0 && hasMoreHistory.value) {
    loadHistory()
  }
}

// ===== 发送 =====
const uploadHeaders = computed<Record<string, string>>(() => {
  const t = getToken()
  const h: Record<string, string> = {}
  if (t) {
    h.Authorization = `Bearer ${t}`
  }
  return h
})

async function doSend(req: {
  convType: 'P2P' | 'GROUP'
  targetId: string | number
  msgType: 'TEXT' | 'IMAGE' | 'FILE'
  content?: string
  attachUrl?: string
  attachName?: string
  attachSize?: number
  thumbUrl?: string
  mimeType?: string
  quoteMsgId?: number | string
}) {
  try {
    const clientSeq = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const { data } = await sendImMessage({
      ...req,
      clientSeq,
    })
    const localMsg: ImMessageVO = {
      msgId: data.msgId,
      convId: data.convId,
      convType: req.convType,
      fromUserId: currentUserId.value,
      targetId: req.targetId,
      msgType: req.msgType,
      content: req.content,
      attach: req.attachUrl
        ? {
            url: req.attachUrl,
            name: req.attachName,
            size: req.attachSize,
            thumbUrl: req.thumbUrl,
            mimeType: req.mimeType,
          }
        : undefined,
      quoteMsgId: req.quoteMsgId,
      status: 'NORMAL',
      serverTime: data.serverTime,
      clientSeq,
    }
    if (
      data.convId === currentConvId.value
      && !messages.value.find((m) => String(m.msgId) === String(data.msgId))
      && !messages.value.find((m) => m.clientSeq && m.clientSeq === clientSeq)
    ) {
      messages.value.push(localMsg)
      await nextTick()
      scrollToBottom()
    }
    await loadConvs()
  } catch {
    /* 错误已在拦截器处理 */
  }
}

async function sendText() {
  const text = inputText.value.trim()
  if (!text || !currentConv.value) return
  await doSend({
    convType: currentConv.value.convType,
    targetId: currentConv.value.targetId,
    msgType: 'TEXT',
    content: text,
    quoteMsgId: quoteTarget.value?.msgId,
  })
  inputText.value = ''
  quoteTarget.value = null
}

function onInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendText()
  }
}

let typingThrottle = 0
function onInputTyping() {
  if (!currentConv.value || currentConv.value.convType !== 'P2P') return
  const now = Date.now()
  if (now - typingThrottle < 3000) return
  typingThrottle = now
  socket.wsTyping(currentConv.value.convId, currentConv.value.targetId)
}

// ===== 上传 =====
function onUploadSuccess(res: any, type: 'IMAGE' | 'FILE') {
  // 后端 FileUploadResp 返回 { id, url, thUrl, metadata }
  const fileResp = res?.response?.data
  if (!fileResp || !currentConv.value) {
    Message.error('上传失败')
    return
  }
  // 从本地选择的文件对象兜底获取 name/size/type（后端响应没有这些字段）
  const localFile = res?.fileItem?.file as File | undefined
  doSend({
    convType: currentConv.value.convType,
    targetId: currentConv.value.targetId,
    msgType: type,
    attachUrl: fileResp.url,
    attachName: localFile?.name,
    attachSize: localFile?.size,
    thumbUrl: fileResp.thUrl,
    mimeType: localFile?.type,
  })
}

// ===== 撤回 / 引用 =====
function canRecall(msg: ImMessageVO) {
  const t = new Date(msg.serverTime).getTime()
  return Date.now() - t < 120 * 1000
}
function quoteMsg(msg: ImMessageVO) {
  quoteTarget.value = msg
}
function recallMsg(msg: ImMessageVO) {
  Modal.warning({
    title: '撤回消息',
    content: '确认撤回这条消息？',
    hideCancel: false,
    onBeforeOk: async () => {
      try {
        await recallImMessage(msg.msgId)
        msg.status = 'RECALLED'
        return true
      } catch {
        return false
      }
    },
  })
}

// ===== 会话操作 =====
async function togglePin() {
  if (!currentConv.value) return
  const pinned = !currentConv.value.pinned
  await pinImConversation(currentConv.value.convId, pinned)
  currentConv.value.pinned = pinned
}
async function toggleMute() {
  if (!currentConv.value) return
  const muted = !currentConv.value.muted
  await muteImConversation(currentConv.value.convId, muted)
  currentConv.value.muted = muted
}
async function clearUnread() {
  if (!currentConv.value) return
  await clearImUnread(currentConv.value.convId)
  currentConv.value.unreadCount = 0
}
async function hideConv() {
  if (!currentConv.value) return
  await hideImConversation(currentConv.value.convId)
  conversations.value = conversations.value.filter((c) => c.convId !== currentConv.value!.convId)
  currentConvId.value = ''
}

// ===== 右键菜单 =====
const convCtxMenu = reactive<{ visible: boolean, x: number, y: number, conv: ImConversationVO | null }>({
  visible: false,
  x: 0,
  y: 0,
  conv: null,
})
function onConvContextMenu(e: MouseEvent, conv: ImConversationVO) {
  convCtxMenu.visible = true
  convCtxMenu.x = e.clientX
  convCtxMenu.y = e.clientY
  convCtxMenu.conv = conv
}
async function ctxPin() {
  if (!convCtxMenu.conv) return
  const c = convCtxMenu.conv
  await pinImConversation(c.convId, !c.pinned)
  c.pinned = !c.pinned
}
async function ctxMute() {
  if (!convCtxMenu.conv) return
  const c = convCtxMenu.conv
  await muteImConversation(c.convId, !c.muted)
  c.muted = !c.muted
}
async function ctxClear() {
  if (!convCtxMenu.conv) return
  await clearImUnread(convCtxMenu.conv.convId)
  convCtxMenu.conv.unreadCount = 0
}
async function ctxHide() {
  if (!convCtxMenu.conv) return
  const id = convCtxMenu.conv.convId
  await hideImConversation(id)
  conversations.value = conversations.value.filter((c) => c.convId !== id)
  if (currentConvId.value === id) currentConvId.value = ''
}
function onDocClick() {
  convCtxMenu.visible = false
}

// ===== 发起单聊（P2P） =====
const p2pPickerVisible = ref(false)
const p2pKeyword = ref('')
const p2pUserLoading = ref(false)
const p2pUserList = ref<any[]>([])
let p2pSearchTimer: ReturnType<typeof setTimeout> | null = null

async function loadP2PUsers(kw: string) {
  p2pUserLoading.value = true
  try {
    const { data } = await listAllUser({ description: kw })
    const meId = currentUserId.value
    p2pUserList.value = (data || []).filter((u: any) => String(u.id) !== meId && Number(u.status) === 1)
  } finally {
    p2pUserLoading.value = false
  }
}

function onP2PSearch() {
  if (p2pSearchTimer) {
    clearTimeout(p2pSearchTimer)
  }
  p2pSearchTimer = setTimeout(() => {
    loadP2PUsers(p2pKeyword.value.trim())
  }, 300)
}

async function openP2PPicker() {
  p2pKeyword.value = ''
  p2pPickerVisible.value = true
  await loadP2PUsers('')
}

async function startP2PChat(user: any) {
  p2pPickerVisible.value = false
  const meId = currentUserId.value
  const targetId = user.id != null ? String(user.id) : ''
  if (!meId || !targetId) {
    return
  }
  // 使用 BigInt 比较避免雪花 ID 精度丢失，convId 与后端 ImConstants.p2pConvId 一致
  let a = meId
  let b = targetId
  try {
    if (BigInt(meId) > BigInt(targetId)) {
      a = targetId
      b = meId
    }
  } catch {
    if (meId.localeCompare(targetId) > 0) {
      a = targetId
      b = meId
    }
  }
  const convId = `${a}_${b}`
  // 已存在则直接选中
  const exist = conversations.value.find((c) => c.convId === convId)
  if (exist) {
    await selectConv(exist)
    return
  }
  // 构造一个本地临时 P2P 会话
  const nowIso = new Date().toISOString()
  const temp: ImConversationVO = {
    userId: meId,
    convId,
    convType: 'P2P',
    targetId,
    targetName: user.nickname || user.username,
    targetAvatar: user.avatar,
    lastPreview: '',
    lastTime: nowIso,
    unreadCount: 0,
    pinned: false,
    muted: false,
    hidden: false,
  } as ImConversationVO
  conversations.value = [temp, ...conversations.value]
  await selectConv(temp)
}

// ===== 创建群聊 =====
const groupCreateVisible = ref(false)
const groupForm = reactive<{ name: string, type: 'CUSTOM' | 'DEPT', deptId?: number | string, memberIds: Array<number | string> }>({
  name: '',
  type: 'CUSTOM',
  deptId: undefined,
  memberIds: [],
})
const userOptions = ref<{ label: string, value: number | string }[]>([])
const userLoading = ref(false)
const deptTree = ref<any[]>([])

async function searchUsers(kw: string) {
  userLoading.value = true
  try {
    const { data } = await listAllUser({ description: kw })
    userOptions.value = (data || []).map((u: any) => ({ label: `${u.nickname}(${u.username})`, value: u.id }))
  } finally {
    userLoading.value = false
  }
}

async function openGroupCreate() {
  groupForm.name = ''
  groupForm.type = 'CUSTOM'
  groupForm.deptId = undefined
  groupForm.memberIds = []
  groupCreateVisible.value = true
  if (deptTree.value.length === 0) {
    try {
      const { data } = await listDept({})
      deptTree.value = data as any
    } catch {
      /* ignore */
    }
  }
  if (userOptions.value.length === 0) searchUsers('')
}
async function confirmCreateGroup() {
  if (!groupForm.name.trim() || groupForm.memberIds.length === 0) {
    Message.warning('请填写群名称并选择成员')
    return false
  }
  try {
    await createImGroup({
      name: groupForm.name,
      type: groupForm.type,
      deptId: groupForm.deptId,
      memberIds: groupForm.memberIds,
    })
    Message.success('创建成功')
    groupCreateVisible.value = false
    await loadConvs()
    return true
  } catch {
    return false
  }
}

// ===== 群信息 =====
const groupInfoVisible = ref(false)
const currentGroup = ref<ImGroupVO | null>(null)
const groupMembers = ref<Array<number | string>>([])
const inviteVisible = ref(false)
const inviteUserIds = ref<Array<number | string>>([])

async function openGroupInfo() {
  if (!currentConv.value || currentConv.value.convType !== 'GROUP') return
  const groupId = currentConv.value.targetId
  groupInfoVisible.value = true
  try {
    const [g, m] = await Promise.all([getImGroup(groupId), listImGroupMembers(groupId)])
    currentGroup.value = g.data
    groupMembers.value = m.data
  } catch {
    /* ignore */
  }
}
function openInvite() {
  inviteUserIds.value = []
  inviteVisible.value = true
  if (userOptions.value.length === 0) searchUsers('')
}
async function confirmInvite() {
  if (!currentGroup.value || inviteUserIds.value.length === 0) return false
  try {
    await inviteImGroupMembers(currentGroup.value.id, inviteUserIds.value)
    Message.success('已邀请')
    const { data } = await listImGroupMembers(currentGroup.value.id)
    groupMembers.value = data
    inviteVisible.value = false
    return true
  } catch {
    return false
  }
}
function kickMember(uid: string | number) {
  if (!currentGroup.value) return
  Modal.warning({
    title: '移除成员',
    content: `确认移除用户 #${uid}？`,
    hideCancel: false,
    onBeforeOk: async () => {
      try {
        await kickImGroupMembers(currentGroup.value!.id, [uid])
        groupMembers.value = groupMembers.value.filter((x) => x !== uid)
        return true
      } catch {
        return false
      }
    },
  })
}

// ===== Typing 提示 =====
const typingHint = ref('')
let typingTimer: number | null = null
function showTyping(fromName: string) {
  typingHint.value = `${fromName} 正在输入...`
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = window.setTimeout(() => {
    typingHint.value = ''
  }, 4000)
}

// ===== 事件处理 =====
function onNewMsg(packet: ImPacket) {
  const data = packet.data as ImMessageVO
  if (!data) return
  if (data.convId === currentConvId.value) {
    // 多重去重：msgId 优先，clientSeq 兜底（避免发送方 REST 已 push、WS 又推一次的双显问题）
    const existsByMsgId = messages.value.find((m) => String(m.msgId) === String(data.msgId))
    const existsByClientSeq = data.clientSeq
      ? messages.value.find((m) => m.clientSeq && m.clientSeq === data.clientSeq)
      : null
    if (existsByMsgId) {
      // 仅合并非 ID 字段，避免雪花 ID 精度丢失把 fromUserId/targetId 覆盖成 number
      existsByMsgId.serverTime = data.serverTime ?? existsByMsgId.serverTime
      existsByMsgId.status = data.status ?? existsByMsgId.status
    } else if (existsByClientSeq) {
      // 本地 localMsg 已包含完整字段，仅以服务端权威字段补充
      existsByClientSeq.msgId = existsByClientSeq.msgId ?? data.msgId
      existsByClientSeq.serverTime = data.serverTime ?? existsByClientSeq.serverTime
      existsByClientSeq.status = data.status ?? existsByClientSeq.status
    } else {
      messages.value.push(data)
      nextTick(() => scrollToBottom())
      readImMessage(data.convId, data.msgId).catch(() => null)
      socket.wsReportRead(data.convId, data.msgId)
    }
  }
  loadConvs()
}
function onRecall(packet: ImPacket) {
  const data = packet.data as { msgId: number | string, convId: string }
  if (!data) return
  const m = messages.value.find((x) => String(x.msgId) === String(data.msgId))
  if (m) m.status = 'RECALLED'
}
function onTyping(packet: ImPacket) {
  const data = packet.data as { fromUserId: number, convId: string }
  if (data?.convId === currentConvId.value) {
    showTyping(`用户 #${data.fromUserId}`)
  }
}
function onReadNotify(_packet: ImPacket) {
  // 可在此渲染对方"已读"标记，留作扩展
}

bus.on('newMsg', onNewMsg)
bus.on('recall', onRecall)
bus.on('typing', onTyping)
bus.on('readNotify', onReadNotify)

function handleBeforeClose() {
  return true
}

function open() {
  visible.value = true
  loadConvs()
  socket.connect()
}
function close() {
  visible.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  socket.connect()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  bus.off('newMsg', onNewMsg)
  bus.off('recall', onRecall)
  bus.off('typing', onTyping)
  bus.off('readNotify', onReadNotify)
})

watch(visible, (v) => {
  if (v) loadConvs()
})

// 同步未读总数到全局，供顶部导航栏角标使用
watch(
  conversations,
  (list) => {
    const total = (list || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0)
    setImUnreadTotal(total)
  },
  { deep: true, immediate: true },
)

defineExpose({ open, close })
</script>

<style lang="scss" scoped>
.im-chat {
  display: flex;
  height: 640px;
  background: var(--color-bg-2);
}

.im-side {
  width: 280px;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;

  &__head {
    display: flex;
    align-items: center;
    padding: 8px;
    gap: 4px;
    border-bottom: 1px solid var(--color-border);
  }

  &__list {
    flex: 1;
    overflow-y: auto;
  }
}

.ml-2 { margin-left: 4px; }

.im-conv-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  gap: 10px;
  border-bottom: 1px solid var(--color-fill-1);

  &:hover { background: var(--color-fill-1); }
  &.active { background: var(--color-fill-2); }
  &.pinned { background: var(--color-warning-light-1); }

  &__body {
    flex: 1;
    min-width: 0;
  }
  &__title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .name {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .time {
      font-size: 12px;
      color: var(--color-text-3);
    }
  }
  &__preview {
    display: flex;
    align-items: center;
    gap: 4px;
    .preview {
      flex: 1;
      font-size: 12px;
      color: var(--color-text-3);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.im-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid var(--color-border);
    .title {
      display: flex;
      align-items: center;
      gap: 8px;
      .name { font-weight: 500; }
    }
  }

  &__messages {
    flex: 1;
    padding: 12px 16px;
    overflow-y: auto;
    background: var(--color-fill-1);
  }

  &__load-more {
    text-align: center;
    margin-bottom: 8px;
  }

  &__input {
    border-top: 1px solid var(--color-border);
    padding: 8px 12px;
    background: var(--color-bg-2);
  }
}

.im-input {
  &__quote {
    background: var(--color-fill-2);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: var(--color-text-3);
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }
  &__tools {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  }
  &__footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 6px;
  }
}

.im-msg {
  display: flex;
  margin-bottom: 14px;
  gap: 8px;

  &.self {
    flex-direction: row-reverse;
    .im-msg__bubble { background: var(--color-primary-light-2); }
  }

  &__avatar { flex-shrink: 0; }

  &__bubble {
    max-width: 60%;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--color-bg-2);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    position: relative;
  }

  &__quote {
    background: var(--color-fill-2);
    padding: 4px 6px;
    border-radius: 4px;
    font-size: 12px;
    margin-bottom: 4px;
    color: var(--color-text-3);
  }

  &__recalled {
    color: var(--color-text-3);
    font-style: italic;
  }

  &__text { white-space: pre-wrap; word-break: break-word; }

  &__file {
    display: flex;
    align-items: center;
    gap: 6px;
    .size { font-size: 12px; color: var(--color-text-3); }
  }

  &__sys {
    color: var(--color-text-3);
    font-size: 12px;
    text-align: center;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    margin-top: 4px;
    font-size: 11px;
    color: var(--color-text-3);
  }

  &__more {
    cursor: pointer;
    opacity: 0.6;
    &:hover { opacity: 1; }
  }
}

.im-typing {
  font-size: 12px;
  color: var(--color-text-3);
  padding: 4px 0;
}

.im-empty {
  margin: auto;
}

.im-p2p-list {
  display: block;
  margin-top: 12px;
  max-height: 360px;
  overflow-y: auto;
}

.im-p2p-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  border-radius: 4px;
  padding: 8px;
  user-select: none;

  &:hover {
    background: var(--color-fill-2);
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    .name {
      font-size: 14px;
      color: var(--color-text-1);
    }
  }

  &__sub {
    margin-left: 6px;
    font-size: 12px;
    color: var(--color-text-3);
  }

  &__desc {
    margin-top: 2px;
    font-size: 12px;
    color: var(--color-text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.im-ctx-menu {
  position: fixed;
  z-index: 9999;
  background: var(--color-bg-popup);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 120px;

  .item {
    padding: 6px 12px;
    cursor: pointer;
    font-size: 13px;
    &:hover { background: var(--color-fill-2); }
    &.danger { color: var(--color-danger); }
  }
}
</style>
