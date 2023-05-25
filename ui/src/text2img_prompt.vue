<script setup>
import { el_selector } from "./utils/gradio";
import {ref} from "vue"
let index = ref(0)
let propdom=document.querySelector(el_selector.el_txt2img_prompt_textarea)
let up = () => {
  index.value++;
  propdom.value=index.value
}
</script>

<template>
  <div class="sd-webui-power-share" @click="up">text2img_prompt click up:{{ index }}</div>
</template>
<style scoped lang="less">
.sd-webui-power-share {
  background-color: red;
  width: 100%;
  height: 100px;
  text-align: center;
  display: flex;
  color: white;
  justify-content: space-around;
  align-items: center;
}
</style>
