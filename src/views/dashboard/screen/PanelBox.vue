<template>
  <div class="panel-box">
    <div class="panel-box__head">
      <span class="panel-box__corner left-top" />
      <span class="panel-box__corner right-top" />
      <div class="panel-box__title">
        <span class="dot" />
        {{ title }}
      </div>
    </div>
    <div class="panel-box__body">
      <slot />
    </div>
    <span class="panel-box__corner left-bottom" />
    <span class="panel-box__corner right-bottom" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<style lang="scss" scoped>
.panel-box {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(54, 207, 201, 0.04), rgba(89, 126, 247, 0.04));
  border: 1px solid rgba(54, 207, 201, 0.18);
  border-radius: 6px;
  overflow: hidden;
}
.panel-box__head {
  position: relative;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(54, 207, 201, 0.15);
  background: rgba(54, 207, 201, 0.04);
}
.panel-box__title {
  font-size: 14px;
  font-weight: 600;
  color: #cfe1ff;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px;
  .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: #36cfc9;
    border-radius: 50%;
    box-shadow: 0 0 6px #36cfc9;
  }
}
.panel-box__body {
  flex: 1;
  padding: 8px;
  min-height: 0;
  overflow: hidden;
}
.panel-box__corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: #36cfc9;
  border-style: solid;
  border-width: 0;
  &.left-top { top: 0; left: 0; border-top-width: 2px; border-left-width: 2px; }
  &.right-top { top: 0; right: 0; border-top-width: 2px; border-right-width: 2px; }
  &.left-bottom { bottom: 0; left: 0; border-bottom-width: 2px; border-left-width: 2px; }
  &.right-bottom { bottom: 0; right: 0; border-bottom-width: 2px; border-right-width: 2px; }
}
</style>
