<script setup>
import { ref, defineProps, onMounted } from "vue"
import PromptBox from './components/PromptBox/index.vue';
const props = defineProps(['nodeDom', "negDom"])
const prompt = ref(null)
// let setprompt(dom,dom1)
onMounted(() => {
  console.log('prompt', props, prompt)
  prompt.value.initDom(props.nodeDom,props.negDom);
})
</script>
<template>
  <PromptBox ref="prompt" />
</template>