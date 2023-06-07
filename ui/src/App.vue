<script setup>
import Prompt from '../src/pages/prompt/index.vue'
import { el_selector } from "./utils/gradio";
import {ref} from "vue"
console.log("test")
let index = ref(0)
let propdom=document.querySelector(el_selector.el_img2img_prompt_textarea);
let up = () => {
  index.value++;
  propdom.value=index.value
}
</script>
<template>
  <Prompt />
</template>
