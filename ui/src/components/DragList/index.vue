<template>
  <transition-group
    name="drag"
    class="transition-prompt-list"
    style="height:100%"
    tag="div"
  >
    <slot name="list-body" :list="props.list"></slot>
  </transition-group>
</template>
<script lang="ts">
export default {
  name: 'DragList'
}
</script>
<script setup lang="ts">
import { Ref } from 'vue';
const props = withDefaults(defineProps<{
  list?: Ref<Array<any>>
}>(), {
  list: [] as any
});
</script>
<style lang="less" scoped>
.transition-prompt-list {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  grid-gap:  1rem;
  padding: 0.75rem;
  // :deep(.drag-move) {
  //   transition: transform 0.5s;
  // }
  :deep(.drag-move), /* 对移动中的元素应用的过渡 */
  :deep(.drag-enter-active),
  :deep(.drag-leave-active) {
    transition: all 0.5s ease;
  }

  :deep(.drag-enter-from),
  :deep(.drag-leave-to) {
    opacity: 0;
    transform: translateY(30px);
  }

  /* 确保将离开的元素从布局流中删除
    以便能够正确地计算移动的动画。 */
  :deep(.drag-leave-active) {
    position: absolute;
  }
}
</style>
