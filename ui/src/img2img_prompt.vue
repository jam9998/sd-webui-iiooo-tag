<script setup>
import { el_selector } from "./utils/gradio";
import { ref,defineProps } from "vue"
console.log("test")
let index = ref(0)
let propdom = document.querySelector(el_selector.el_img2img_prompt_textarea)
let up = () => {
  index.value++;
  propdom.value = index.value
}
const props = defineProps(['nodeDom'])
onMounted(() => {
  console.log('prompt', props)
})
</script>

<template>
  <div class="sd-webui-power-share" @click="up">img2img_prompt click up:{{ index }}</div>
</template>
<style scoped lang="less">
.sd-webui-power-share {
  background-color: green;
  width: 100%;
  height: 100px;
  text-align: center;
  display: flex;
  color: white;
  justify-content: space-around;
  align-items: center;
}
</style>
