<script setup>
// import Prompt from '../src/pages/prompt/index.vue'
import PromptBox from './components/PromptBox/index.vue';
import { el_selector } from "./utils/gradio";
import { onMounted, ref, nextTick } from "vue";
let index = ref(0)
let propdom=document.querySelector(el_selector.el_img2img_prompt_textarea);
let up = () => {
  index.value++;
  propdom.value=index.value
}
const forward = ref(null);
const negative = ref(null);
const loadByForward = ref(false);
const loadByNegative = ref(false);
onMounted(() => {
  const forwardDom = document.querySelector('#yj-texteara');
  const negativeDom = document.querySelector('#yj-texteara1');
  // 正向提示词 需要获取两个texteara dom
  forward.value.initDom(forwardDom, negativeDom);
  negative.value.initDom(negativeDom);
});
</script>
<template>
  <div class="prompt-container">
    <textarea id="yj-texteara"></textarea>
    <PromptBox
      v-model:loading="loadByForward"
      ref="forward"
      type="Forward"
    />
    <textarea id="yj-texteara1"></textarea>
    <PromptBox
      v-model:loading="loadByNegative"
      ref="negative"
      type="Negative"
    />
  </div>
  <!-- <div class="sd-webui-power-share" @click="up">img2img_prompt click up:{{ index }}</div> -->
</template>
<style lang="less" scoped>
.prompt-container {
  box-sizing: border-box;
  padding: 0 20px;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  background-color: #121212;
}
</style>
