<template>
  <div class="prompt-container">
    <main>
      <template v-for="(prompt, index) in promptTypeList"> 
        <template v-if="index === 0">
          <PromptBox
            ref="promptBoxRef"
            :key="prompt.key" 
            v-model:loading="prompt.loading"
            v-model:word="prompt.word"
            :placeholder="prompt.placeholder"
            :type="prompt.key"
          />
        </template>
        <template v-else>
          <PromptBox
            :key="prompt.key" 
            v-model:loading="prompt.loading"
            v-model:word="prompt.word"
            :placeholder="prompt.placeholder"
            :type="prompt.key"
          />
        </template>
      </template>
      
    </main>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref, Component, onMounted, watch } from 'vue';
import DragList from '../../components/DragList/index.vue';
import DragPreview from '../../components/DragPreview/index.vue';
import PromptBox from '../../components/PromptBox/index.vue';

type promptType = 'Forward' | 'Negative';
interface promptItemType {
  key: promptType,
  title: string,
  placeholder: string,
  word: string,
  syncCheck: boolean,
  loading: boolean
}
const props = defineProps<{
  nodeDom: Component
}>();
const promptBoxRef = ref();
const promptTypeList: Array<promptItemType> = reactive([
  {
    key: 'Forward',
    title: '正向提示词',
    placeholder: '请输入正向提示词',
    word: '',
    syncCheck: true,
    loading: false
  },
  {
    key: 'Negative',
    title: '反向提示词',
    placeholder: '请输入反向提示词',
    word: '',
    syncCheck: true,
    loading: false
  }
]);
defineExpose({
  initDom: promptBoxRef
})
</script>
<style scoped lang="less">
.prompt-container {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  background-color: #121212;
  > main {
    width: 100%;
    max-width: 1280px;
    height: 100vh;
    min-height: 100%;
    margin: 0 auto;
    background-color: initial;
    padding: 1rem 0.75rem;
    box-sizing: border-box;
  }
  // .prompt-box-wrapper {
  //   margin-top: 0.75rem;
  // }
  // .prompt-textarea {
  //   background-color: #232323;
  //   margin-bottom: 1.875rem;
  //   :deep(.ant-input) {
  //     color: #fff;
  //     height: 142px !important;
  //     max-height: 142px !important;
  //   }
  //   &::after {
  //     color: #fff;
  //   }
  // }
  // .operate-box {
  //   border: 1px solid #3d3d3d;
  // }
  // .operate-top-inline {
  //   display: flex;
  //   flex-wrap: wrap;
  //   padding: 0.75rem;
  //   border-bottom: 1px solid #3d3d3d;
  //   > div {
  //     display: flex;
  //     align-items: center;
  //     margin-bottom: 0.375rem;
  //   }
  //   > div + div {
  //     margin-left: 0.75rem;
  //   }
  //   .label {
  //     font-size: 1rem;
  //     font-weight: 500;
  //     color: #fff;
  //     margin-right: 0.5rem;
  //   }
  //   :deep(.ant-switch) {
  //     background-color: #3d3d3d;
  //   }
  //   :deep(.ant-switch-checked) {
  //     background-color: #1890ff;
  //   }
  // }
}
</style>
