import "ant-design-vue/dist/antd.css";
import "./assets/main.less";
import "./index.css";

import * as Vue from "vue";
import { el_selector } from "./utils/gradio";
import { querySelector, querySelectorAll, insertAfter } from "./utils/tool";
import Entry from "./Entry.vue";
let promptApp = function (dom, textbox, negbox) {
  const div = document.createElement("div");
  insertAfter(div, dom);
  const app = Vue.createApp(Entry, { nodeDom: textbox, negDom: negbox });
  app.mount(div);
}
let setup = async function () {
  // 文生图反向提示词
  const el_txt2img_boxs = await querySelectorAll(el_selector.el_txt2img_prompt);
  const el_txt2img_prompt_textarea = await querySelector(el_selector.el_txt2img_prompt_textarea);
  const el_txt2img_neg_prompt_textarea = await querySelector(el_selector.el_txt2img_neg_prompt_textarea);

  if (el_txt2img_boxs.length) {
    promptApp(el_txt2img_boxs[0], el_txt2img_prompt_textarea, el_txt2img_neg_prompt_textarea)
    promptApp(el_txt2img_boxs[1], el_txt2img_prompt_textarea)
  }

  // 文生图反向提示词
  const el_img2img_boxs = await querySelectorAll(el_selector.el_img2img_prompt);
  const el_img2img_prompt_textarea = await querySelector(el_selector.el_img2img_prompt_textarea);
  const el_img2img_neg_prompt_textarea = await querySelector(el_selector.el_img2img_neg_prompt_textarea);

  if (el_img2img_boxs.length) {
    promptApp(el_img2img_boxs[0], el_img2img_prompt_textarea, el_img2img_neg_prompt_textarea)
    promptApp(el_img2img_boxs[1], el_img2img_prompt_textarea)
  }
};
document.addEventListener("DOMContentLoaded", async () => {
  setup()
})
