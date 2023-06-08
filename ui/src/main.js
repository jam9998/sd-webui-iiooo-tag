import "ant-design-vue/dist/antd.css";
import "./assets/main.less";
import "./index.css";

import * as Vue from "vue";
import { el_selector } from "./utils/gradio";
import { querySelector, querySelectorAll, insertAfter } from "./utils/tool";
import App from "./App.vue";
import Entry from "./Entry.vue";
console.log("gradio selector:", el_selector);
let setup = async function () {
  const el_img2img_prompt = await querySelector(el_selector.el_img2img_prompt);

  if (el_img2img_prompt) {
    const div = document.createElement("div");
    insertAfter(div, el_img2img_prompt);
    console.log("app mount div", div);
    const app = Vue.createApp(img2img_prompt);
    app.mount(div);
    console.log("app mount img2img_prompt", app);
  }

  const el_txt2img_prompt = await querySelector(el_selector.el_txt2img_prompt);

  if (el_txt2img_prompt) {
    const div = document.createElement("div");
    insertAfter(div, el_txt2img_prompt);
    console.log("app mount div", div);
    const app = Vue.createApp(text2img_prompt);
    app.mount(div);
    console.log("app mount text2img_prompt", app);
  }
};


let test_prompt=async function(){
  const el_prompt = await querySelector("#test_prompt");
  const el_prompt_neg = await querySelector("#test_prompt_neg");
  if (el_prompt) {
    const div = document.createElement("div");
    insertAfter(div, el_prompt);
    const app = Vue.createApp(Entry, { nodeDom: el_prompt,negDom:el_prompt_neg });
    app.mount(div);
  }
}
const app = Vue.createApp(App);
app.mount("#app");
document.addEventListener("DOMContentLoaded", async () => {
  test_prompt()
})

