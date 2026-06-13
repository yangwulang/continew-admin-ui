<template>
  <GiPageLayout>
    <div class="bookshelf-container">
      <div class="bookshelf-header">
        <h3>我的书架</h3>
        <span class="book-count">共 {{ bookList.length }} 本</span>
      </div>

      <a-spin :loading="loading" style="width: 100%">
        <div v-if="bookList.length === 0" class="empty-state">
          <a-empty description="书架空空如也，快去添加小说吧~" />
        </div>

        <div v-else class="book-grid">
          <div
            v-for="item in bookList"
            :key="item.id"
            class="book-card"
            :class="{ 'is-top': item.isTop === 1 }"
          >
            <div class="book-cover">
              <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.bookName" />
              <div v-else class="cover-placeholder">{{ item.bookName?.charAt(0) }}</div>
              <div v-if="item.isTop === 1" class="top-badge">置顶</div>
            </div>
            <div class="book-info">
              <div class="book-name" :title="item.bookName">{{ item.bookName }}</div>
              <div class="book-author">{{ item.author || '未知作者' }}</div>
              <div class="book-progress">
                <a-progress
                  :percent="item.readProgress / 100"
                  size="small"
                  :show-text="false"
                  style="width: 100%"
                />
                <span class="progress-text">{{ item.readProgress }}%</span>
              </div>
              <div class="book-chapter">
                <span v-if="item.lastChapterTitle">读到：{{ item.lastChapterTitle }}</span>
                <span v-else>尚未开始阅读</span>
              </div>
              <div class="book-actions">
                <a-link size="small" @click="onToggleTop(item)">
                  {{ item.isTop === 1 ? '取消置顶' : '置顶' }}
                </a-link>
                <a-link size="small" status="danger" @click="onRemove(item)">移除</a-link>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </div>
  </GiPageLayout>
</template>

<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import {
  type NovelBookshelfResp,
  listMyBookshelf,
  removeFromBookshelf,
  toggleBookshelfTop,
} from '@/apis/novel/novel-bookshelf'

defineOptions({ name: 'NovelBookshelf' })

const loading = ref(false)
const bookList = ref<NovelBookshelfResp[]>([])

const loadBookshelf = async () => {
  loading.value = true
  try {
    const { data } = await listMyBookshelf()
    bookList.value = data || []
  } finally {
    loading.value = false
  }
}

const onToggleTop = async (item: NovelBookshelfResp) => {
  const newTop = item.isTop === 1 ? 0 : 1
  await toggleBookshelfTop(item.novelId, newTop)
  Message.success(newTop === 1 ? '已置顶' : '已取消置顶')
  loadBookshelf()
}

const onRemove = (item: NovelBookshelfResp) => {
  Modal.confirm({
    title: '移除确认',
    content: `是否确定将「${item.bookName}」从书架移除？`,
    onOk: async () => {
      await removeFromBookshelf(item.novelId)
      Message.success('已从书架移除')
      loadBookshelf()
    },
  })
}

// 初始加载
loadBookshelf()
</script>

<style scoped lang="scss">
.bookshelf-container {
  padding: 16px;
}

.bookshelf-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 18px;
  }

  .book-count {
    color: var(--color-text-3);
    font-size: 14px;
  }
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.book-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  &.is-top {
    border-color: rgb(var(--primary-6));
    background: rgba(var(--primary-1), 0.05);
  }
}

.book-cover {
  position: relative;
  flex-shrink: 0;
  width: 72px;
  height: 96px;
  border-radius: 4px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-size: 24px;
    font-weight: bold;
  }

  .top-badge {
    position: absolute;
    top: 0;
    right: 0;
    padding: 2px 6px;
    font-size: 10px;
    color: #fff;
    background: rgb(var(--primary-6));
    border-radius: 0 4px 0 4px;
  }
}

.book-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .book-name {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .book-author {
    font-size: 12px;
    color: var(--color-text-3);
  }

  .book-progress {
    display: flex;
    align-items: center;
    gap: 8px;

    .progress-text {
      font-size: 12px;
      color: var(--color-text-3);
      white-space: nowrap;
    }
  }

  .book-chapter {
    font-size: 12px;
    color: var(--color-text-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .book-actions {
    display: flex;
    gap: 8px;
    margin-top: auto;
  }
}
</style>
